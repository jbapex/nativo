import express from 'express';
import { db } from '../database/db.js';
import { isSQLite } from '../database/db-wrapper.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Buscar promoções ativas de uma loja (público)
router.get('/store/:storeId/active', optionalAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Verificar se é um UUID ou slug
    const isUUID = storeId.length === 36 && storeId.includes('-');
    let actualStoreId = storeId;
    
    // Se for slug, buscar o ID da loja primeiro
    if (!isUUID) {
      const store = await db.prepare('SELECT id FROM stores WHERE slug = ?').get(storeId);
      if (!store) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }
      actualStoreId = store.id;
    }
    
    const now = new Date().toISOString();
    
    const promotions = await db.prepare(`
      SELECT p.*
      FROM promotions p
      WHERE p.store_id = ?
        AND p.active = true
        AND p.start_date <= ?
        AND p.end_date >= ?
      ORDER BY p.created_at DESC
    `).all(actualStoreId, now, now);
    
    res.json(promotions.map(promo => {
      // Adaptar schema PostgreSQL para formato unificado
      if (!isSQLite()) {
        promo = {
          ...promo,
          title: promo.name,
          discount_type: promo.type,
          discount_value: promo.value,
          product_id: promo.product_ids ? JSON.parse(promo.product_ids)[0] || 'all' : 'all',
          // show_timer pode não existir se a coluna não foi criada, usar o valor do banco se existir
          show_timer: promo.show_timer !== undefined 
            ? (promo.show_timer === true || promo.show_timer === 1 || promo.show_timer === 't')
            : false
        };
      }
      
      // Normalizar show_timer: verificar vários formatos possíveis
      let normalizedShowTimer = false;
      if (promo.show_timer !== undefined && promo.show_timer !== null) {
        normalizedShowTimer = promo.show_timer === 1 
          || promo.show_timer === true 
          || promo.show_timer === 't' 
          || promo.show_timer === 'true'
          || promo.show_timer === '1'
          || (typeof promo.show_timer === 'string' && promo.show_timer.toLowerCase() === 'true');
      }
      
      return {
        ...promo,
        active: promo.active === 1 || promo.active === true,
        // Garantir que show_timer seja sempre um boolean, mesmo se a coluna não existir
        show_timer: normalizedShowTimer,
        discount_value: promo.discount_value ? parseFloat(promo.discount_value) : null,
        applies_to: promo.applies_to || 'both'
      };
    }));
  } catch (error) {
    console.error('Erro ao buscar promoções ativas:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções ativas' });
  }
});

// Buscar promoções ativas para um produto específico (público)
router.get('/product/:productId/active', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date().toISOString();
    
    // Buscar produto para obter store_id
    const product = await db.prepare('SELECT store_id FROM products WHERE id = ?').get(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Buscar promoções: específicas do produto OU promoções gerais da loja
    // A tabela usa product_ids (text) em vez de product_id
    const promotions = await db.prepare(`
      SELECT p.*
      FROM promotions p
      WHERE p.store_id = ?
        AND p.active = true
        AND p.start_date <= ?
        AND p.end_date >= ?
        AND (p.product_ids LIKE ? OR p.product_ids IS NULL OR p.product_ids = '')
      ORDER BY p.created_at DESC
    `).all(product.store_id, now, now, `%${productId}%`);
    
    res.json(promotions.map(promo => {
      // Normalizar show_timer: verificar vários formatos possíveis
      let normalizedShowTimer = false;
      if (promo.show_timer !== undefined && promo.show_timer !== null) {
        normalizedShowTimer = promo.show_timer === 1 
          || promo.show_timer === true 
          || promo.show_timer === 't' 
          || promo.show_timer === 'true'
          || promo.show_timer === '1'
          || (typeof promo.show_timer === 'string' && promo.show_timer.toLowerCase() === 'true');
      }
      
      return {
        ...promo,
        active: promo.active === 1 || promo.active === true,
        // Garantir que show_timer seja sempre um boolean, mesmo se a coluna não existir
        show_timer: normalizedShowTimer,
        discount_value: promo.discount_value ? parseFloat(promo.discount_value) : null,
        applies_to: promo.applies_to || 'both'
      };
    }));
  } catch (error) {
    console.error('Erro ao buscar promoções do produto:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções do produto' });
  }
});

// Listar promoções de uma loja (autenticado)
router.get('/', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    // Validar user
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar loja do usuário
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const store = isSQLite()
      ? db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id)
      : await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Se for admin, pode buscar por store_id na query
    const storeId = req.user.role === 'admin' && req.query.store_id 
      ? req.query.store_id 
      : store.id;
    
    // Buscar promoções com JOIN para obter nome do produto (se aplicável)
    let promotions;
    
    if (isSQLite()) {
      // SQLite: usar product_id diretamente
      promotions = db.prepare(`
        SELECT 
          p.*,
          pr.name as product_name
        FROM promotions p
        LEFT JOIN products pr ON p.product_id = pr.id
        WHERE p.store_id = ?
        ORDER BY p.created_at DESC
      `).all(storeId);
    } else {
      // PostgreSQL: buscar todas as promoções primeiro
      const allPromotions = await db.prepare(`
        SELECT p.*
        FROM promotions p
        WHERE p.store_id = $1
        ORDER BY p.created_at DESC
      `).all(storeId);
      
      // Para cada promoção, buscar o nome do produto se houver product_ids
      promotions = await Promise.all(allPromotions.map(async (promo) => {
        let productName = null;
        
        if (promo.product_ids) {
          try {
            const productIds = JSON.parse(promo.product_ids);
            if (Array.isArray(productIds) && productIds.length > 0) {
              const productId = productIds[0];
              const product = await db.prepare('SELECT name FROM products WHERE id = $1').get(productId);
              if (product) {
                productName = product.name;
              }
            }
          } catch (e) {
            console.error('Erro ao parsear product_ids:', e);
          }
        }
        
        return {
          ...promo,
          product_name: productName
        };
      }));
    }
    
    res.json(promotions.map(promo => {
      // Adaptar schema PostgreSQL para formato unificado
      if (!isSQLite()) {
        // Extrair product_id do JSON para PostgreSQL (se ainda não foi extraído)
        let productId = promo.product_id;
        if (!productId && promo.product_ids) {
          try {
            const productIds = JSON.parse(promo.product_ids);
            productId = Array.isArray(productIds) && productIds.length > 0 ? productIds[0] : null;
          } catch (e) {
            console.error('Erro ao parsear product_ids no map:', e);
          }
        }
        
        promo = {
          ...promo,
          title: promo.name,
          discount_type: promo.type,
          discount_value: promo.value,
          product_id: productId || 'all',
          // show_timer pode não existir se a coluna não foi criada, usar o valor do banco se existir
          show_timer: promo.show_timer !== undefined 
            ? (promo.show_timer === true || promo.show_timer === 1 || promo.show_timer === 't')
            : false
        };
      }
      
      // Normalizar show_timer: verificar vários formatos possíveis
      let normalizedShowTimer = false;
      if (promo.show_timer !== undefined && promo.show_timer !== null) {
        normalizedShowTimer = promo.show_timer === 1 
          || promo.show_timer === true 
          || promo.show_timer === 't' 
          || promo.show_timer === 'true'
          || promo.show_timer === '1'
          || (typeof promo.show_timer === 'string' && promo.show_timer.toLowerCase() === 'true');
      }
      
      return {
        ...promo,
        active: promo.active === 1 || promo.active === true,
        // Garantir que show_timer seja sempre um boolean, mesmo se a coluna não existir
        show_timer: normalizedShowTimer,
        discount_value: promo.discount_value ? parseFloat(promo.discount_value) : null,
        product_name: promo.product_name || null,
        applies_to: promo.applies_to || 'both'
      };
    }));
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({ error: 'Erro ao listar promoções' });
  }
});

// Obter uma promoção específica
router.get('/:id', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da promoção é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    
    // Buscar loja do usuário
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const store = isSQLite()
      ? db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id)
      : await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Buscar promoção
    const promotion = isSQLite()
      ? db.prepare(`
          SELECT p.*
          FROM promotions p
          WHERE p.id = ? AND p.store_id = ?
        `).get(id, store.id)
      : await db.prepare(`
          SELECT p.*
          FROM promotions p
          WHERE p.id = ? AND p.store_id = ?
        `).get(id, store.id);
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    
    // Adaptar schema PostgreSQL para formato unificado
    if (!isSQLite()) {
      promotion = {
        ...promotion,
        title: promotion.name,
        discount_type: promotion.type,
        discount_value: promotion.value,
        product_id: promotion.product_ids ? JSON.parse(promotion.product_ids)[0] || 'all' : 'all',
        // show_timer pode não existir se a coluna não foi criada, usar o valor do banco se existir
        show_timer: promotion.show_timer !== undefined 
          ? (promotion.show_timer === true || promotion.show_timer === 1 || promotion.show_timer === 't')
          : false
      };
    }
    
    // Normalizar show_timer: verificar vários formatos possíveis
    let normalizedShowTimer = false;
    if (promotion.show_timer !== undefined && promotion.show_timer !== null) {
      normalizedShowTimer = promotion.show_timer === 1 
        || promotion.show_timer === true 
        || promotion.show_timer === 't' 
        || promotion.show_timer === 'true'
        || promotion.show_timer === '1'
        || (typeof promotion.show_timer === 'string' && promotion.show_timer.toLowerCase() === 'true');
    }
    
    res.json({
      ...promotion,
      active: promotion.active === 1 || promotion.active === true,
      // Garantir que show_timer seja sempre um boolean
      show_timer: normalizedShowTimer,
      discount_value: promotion.discount_value ? parseFloat(promotion.discount_value) : null,
      applies_to: promotion.applies_to || 'both'
    });
  } catch (error) {
    console.error('Erro ao buscar promoção:', error);
    res.status(500).json({ error: 'Erro ao buscar promoção' });
  }
});

// Criar promoção
router.post('/', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    console.log('🚀 [POST /promotions] Iniciando criação de promoção');
    
    // Validar user
    if (!req.user?.id) {
      console.error('❌ [POST /promotions] Usuário não autenticado');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    console.log('📝 [POST /promotions] Recebendo requisição para criar promoção:', {
      body: req.body,
      user: req.user.id,
      userRole: req.user.role
    });

    const {
      title,
      description,
      discount_type,
      discount_value,
      product_id,
      start_date,
      end_date,
      show_timer,
      active,
      applies_to
    } = req.body;
    
    console.log('📝 Valores extraídos:', {
      title,
      description,
      discount_type,
      discount_value,
      product_id,
      start_date,
      end_date,
      show_timer,
      active,
      applies_to
    });
    
    // Validações
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    if (!discount_type) {
      return res.status(400).json({ error: 'Tipo de desconto é obrigatório' });
    }
    
    // Validar discount_value
    if (discount_type !== 'free_shipping') {
      if (discount_value === undefined || discount_value === null || discount_value === '') {
        console.error('❌ discount_value não fornecido:', discount_value);
        return res.status(400).json({ error: 'Valor do desconto é obrigatório' });
      }
      const numValue = typeof discount_value === 'string' ? parseFloat(discount_value) : discount_value;
      if (isNaN(numValue) || numValue <= 0) {
        console.error('❌ discount_value inválido:', discount_value, '->', numValue);
        return res.status(400).json({ error: 'Valor do desconto deve ser um número maior que zero' });
      }
      console.log('✅ discount_value validado:', numValue);
    } else {
      console.log('✅ Tipo é free_shipping, discount_value será null');
    }
    
    if (!start_date || !end_date) {
      console.error('❌ Validação de datas falhou:', { start_date, end_date });
      return res.status(400).json({ error: 'Datas de início e término são obrigatórias' });
    }
    
    // Validar formato de data
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    if (isNaN(startDateObj.getTime())) {
      console.error('❌ Data de início inválida:', start_date);
      return res.status(400).json({ error: 'Data de início inválida' });
    }
    
    if (isNaN(endDateObj.getTime())) {
      console.error('❌ Data de término inválida:', end_date);
      return res.status(400).json({ error: 'Data de término inválida' });
    }
    
    if (startDateObj >= endDateObj) {
      console.error('❌ Data de término deve ser posterior à data de início:', { start_date, end_date });
      return res.status(400).json({ error: 'Data de término deve ser posterior à data de início' });
    }
    
    console.log('✅ Validação de datas passou:', {
      start_date: startDateObj.toISOString(),
      end_date: endDateObj.toISOString()
    });
    
    // Buscar loja do usuário
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const store = isSQLite()
      ? db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id)
      : await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Se for admin e tiver store_id no body, usar esse
    const storeId = req.user.role === 'admin' && req.body.store_id 
      ? req.body.store_id 
      : store.id;
    
    // Verificar se product_id existe (se fornecido)
    if (product_id && product_id !== 'all') {
      const product = isSQLite()
        ? db.prepare('SELECT id FROM products WHERE id = ? AND store_id = ?').get(product_id, storeId)
        : await db.prepare('SELECT id FROM products WHERE id = ? AND store_id = ?').get(product_id, storeId);
      if (!product) {
        return res.status(400).json({ error: 'Produto não encontrado' });
      }
    }
    
    const id = uuidv4();
    
    // Normalizar show_timer
    const finalShowTimer = show_timer !== undefined 
      ? (show_timer === true || show_timer === 1 || show_timer === 'true') 
      : false;
    
    console.log('📝 Criando promoção:', {
      id,
      title,
      discount_type,
      discount_value,
      product_id,
      show_timer: finalShowTimer,
      active
    });
    
    // Adaptar para diferentes schemas (SQLite vs PostgreSQL)
    try {
      // Validar que não há valores undefined
      const validatedInsertValues = [
        id,
        storeId,
        title.trim(),
        description !== undefined ? (description || null) : null,
        discount_type,
        discount_type !== 'free_shipping' ? (discount_value !== undefined ? discount_value : null) : null,
        product_id && product_id !== 'all' ? product_id : null,
        start_date,
        end_date,
        finalShowTimer,
        active !== undefined ? (active ? true : false) : true,
        applies_to || 'both' // "store", "marketplace", "both"
      ];
      
      // Verificar se há valores undefined
      const undefinedIndexes = validatedInsertValues
        .map((val, idx) => val === undefined ? idx : -1)
        .filter(idx => idx !== -1);
      
      if (undefinedIndexes.length > 0) {
        console.error('❌ ERRO: Valores undefined encontrados nos índices:', undefinedIndexes);
        console.error('Valores:', validatedInsertValues);
        throw new Error(`Valores undefined encontrados nos índices: ${undefinedIndexes.join(', ')}`);
      }
      
      if (isSQLite()) {
        // Schema SQLite: title, discount_type, discount_value, product_id, show_timer
        // NOTA: better-sqlite3 é síncrono, não precisa de await
        console.log('📝 Valores para inserção (SQLite):', validatedInsertValues);
        console.log('📝 Tipos dos valores:', validatedInsertValues.map(v => typeof v));
        
        try {
          db.prepare(`
            INSERT INTO promotions (
              id, store_id, title, description, discount_type, discount_value,
              product_id, start_date, end_date, show_timer, active, applies_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(...validatedInsertValues);
          
          console.log('✅ Promoção inserida com sucesso no SQLite');
        } catch (sqliteError) {
          console.error('❌ Erro ao inserir no SQLite:', sqliteError);
          console.error('Mensagem:', sqliteError.message);
          console.error('Código:', sqliteError.code);
          throw sqliteError;
        }
      } else {
        // Schema PostgreSQL: name, type, value, product_ids (JSON), show_timer
        const productIds = product_id && product_id !== 'all' 
          ? JSON.stringify([product_id]) 
          : null;
        
        const postgresInsertValues = [
          id,
          storeId,
          title.trim(),
          description !== undefined ? (description || null) : null,
          discount_type,
          discount_type !== 'free_shipping' ? (discount_value !== undefined ? discount_value : null) : null,
          productIds,
          start_date,
          end_date,
          finalShowTimer,
          active !== undefined ? (active ? true : false) : true,
          applies_to || 'both' // "store", "marketplace", "both"
        ];
        
        // Verificar se há valores undefined
        const postgresUndefinedIndexes = postgresInsertValues
          .map((val, idx) => val === undefined ? idx : -1)
          .filter(idx => idx !== -1);
        
        if (postgresUndefinedIndexes.length > 0) {
          console.error('❌ ERRO: Valores undefined encontrados nos índices (PostgreSQL):', postgresUndefinedIndexes);
          console.error('Valores:', postgresInsertValues);
          throw new Error(`Valores undefined encontrados nos índices: ${postgresUndefinedIndexes.join(', ')}`);
        }
        
        console.log('📝 Valores para inserção (PostgreSQL):', postgresInsertValues);
        console.log('📝 Tipos dos valores:', postgresInsertValues.map(v => typeof v));
        
        // Verificar se a coluna show_timer existe antes de inserir
        let hasShowTimerColumn = false;
        try {
          const checkQuery = `
            SELECT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'promotions' 
              AND column_name = 'show_timer'
            ) as exists;
          `;
          
          const columnCheckResult = await db.prepare(checkQuery).get();
          
          // Adaptar resposta para formato unificado
          if (columnCheckResult) {
            hasShowTimerColumn = columnCheckResult.exists === true || columnCheckResult.exists === 't' || columnCheckResult.exists === 1;
          }
          
          console.log('📝 Coluna show_timer existe?', hasShowTimerColumn);
        } catch (checkError) {
          console.log('⚠️ Erro ao verificar coluna show_timer, assumindo que NÃO existe:', checkError.message);
          hasShowTimerColumn = false;
        }
        
        // Construir query dinamicamente baseado na existência da coluna
        let insertQuery;
        let insertValues;
        
        if (hasShowTimerColumn) {
          // Inserir com show_timer
          console.log('✅ Inserindo com coluna show_timer');
          insertQuery = `
            INSERT INTO promotions (
              id, store_id, name, description, type, value,
              product_ids, start_date, end_date, show_timer, active, applies_to
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `;
          insertValues = postgresInsertValues;
        } else {
          // Inserir sem show_timer (coluna não existe)
          console.log('⚠️ Coluna show_timer não existe, inserindo sem ela...');
          insertQuery = `
            INSERT INTO promotions (
              id, store_id, name, description, type, value,
              product_ids, start_date, end_date, active, applies_to
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;
          // Remove show_timer (penúltimo elemento antes de applies_to) mas mantém applies_to (último elemento)
          insertValues = [
            ...postgresInsertValues.slice(0, -2), // Remove show_timer e active
            postgresInsertValues[postgresInsertValues.length - 2], // Mantém active
            postgresInsertValues[postgresInsertValues.length - 1] // Mantém applies_to
          ];
        }
        
        console.log('📝 Query de inserção:', insertQuery);
        console.log('📝 Valores finais:', insertValues);
        
        await db.prepare(insertQuery).run(...insertValues);
        
        console.log('✅ Promoção inserida com sucesso no PostgreSQL');
      }
    } catch (insertError) {
      console.error('❌ Erro ao inserir promoção:', insertError);
      console.error('Mensagem:', insertError.message);
      console.error('Código:', insertError.code);
      
      // Se for erro de coluna não encontrada, tentar inserir sem show_timer
      if (insertError.message && (
        insertError.message.includes('column "show_timer"') ||
        insertError.message.includes('does not exist') ||
        insertError.code === '42703'
      )) {
        console.log('⚠️ Coluna show_timer não existe. Tentando inserir sem ela...');
        try {
          if (isSQLite()) {
            // SQLite: inserir sem show_timer
            db.prepare(`
              INSERT INTO promotions (
                id, store_id, title, description, discount_type, discount_value,
                product_id, start_date, end_date, active
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              id,
              storeId,
              title.trim(),
              description || null,
              discount_type,
              discount_type !== 'free_shipping' ? discount_value : null,
              product_id && product_id !== 'all' ? product_id : null,
              start_date,
              end_date,
              active !== undefined ? (active ? true : false) : true
            );
          } else {
            // PostgreSQL: inserir sem show_timer
            await db.prepare(`
              INSERT INTO promotions (
                id, store_id, name, description, type, value,
                product_ids, start_date, end_date, active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `).run(
              id,
              storeId,
              title.trim(),
              description !== undefined ? (description || null) : null,
              discount_type,
              discount_type !== 'free_shipping' ? (discount_value !== undefined ? discount_value : null) : null,
              productIds,
              start_date,
              end_date,
              active !== undefined ? (active ? true : false) : true
            );
          }
          console.log('✅ Promoção criada com sucesso (sem coluna show_timer)');
        } catch (retryError) {
          console.error('❌ Erro ao tentar inserir sem show_timer:', retryError);
          throw new Error('Erro ao criar promoção. Verifique se todos os campos obrigatórios estão preenchidos corretamente.');
        }
      } else {
        throw insertError;
      }
    }
    
    // Buscar promoção criada
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    let promotion = isSQLite()
      ? db.prepare(`
          SELECT p.*
          FROM promotions p
          WHERE p.id = ?
        `).get(id)
      : await db.prepare(`
          SELECT p.*
          FROM promotions p
          WHERE p.id = ?
        `).get(id);
    
    // Adaptar resposta para formato unificado
    if (!isSQLite()) {
      // Converter schema PostgreSQL para formato unificado
      promotion = {
        ...promotion,
        title: promotion.name,
        discount_type: promotion.type,
        discount_value: promotion.value,
        product_id: promotion.product_ids ? JSON.parse(promotion.product_ids)[0] || 'all' : 'all',
        // show_timer pode não existir se a coluna não foi criada, usar o valor enviado pelo frontend
        show_timer: promotion.show_timer !== undefined 
          ? (promotion.show_timer === true || promotion.show_timer === 1) 
          : (finalShowTimer || false) // Usar o valor que foi enviado pelo frontend
      };
    }
    
    // Normalizar show_timer: usar valor do banco se existir, senão usar valor enviado pelo frontend
    let finalShowTimerResponse = false;
    if (promotion.show_timer !== undefined && promotion.show_timer !== null) {
      finalShowTimerResponse = promotion.show_timer === 1 
        || promotion.show_timer === true 
        || promotion.show_timer === 't' 
        || promotion.show_timer === 'true'
        || promotion.show_timer === '1'
        || (typeof promotion.show_timer === 'string' && promotion.show_timer.toLowerCase() === 'true');
    } else {
      // Se não existe no banco, usar o valor enviado pelo frontend
      finalShowTimerResponse = finalShowTimer || false;
    }
    
    res.status(201).json({
      ...promotion,
      active: promotion.active === 1 || promotion.active === true,
      // Sempre retornar o valor correto do show_timer
      show_timer: finalShowTimerResponse,
      discount_value: promotion.discount_value ? parseFloat(promotion.discount_value) : null,
      applies_to: promotion.applies_to || applies_to || 'both'
    });
  } catch (error) {
    console.error('❌ Erro ao criar promoção:', error);
    console.error('Stack:', error.stack);
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);
    console.error('Nome:', error.name);
    console.error('Body recebido:', req.body);
    
    // Retornar mensagem de erro mais detalhada
    let errorMessage = 'Erro ao criar promoção';
    let errorDetails = error.message;
    
    // Mensagens de erro mais amigáveis
    if (error.message && error.message.includes('SQLITE_CONSTRAINT')) {
      errorMessage = 'Erro de validação no banco de dados';
      errorDetails = 'Verifique se todos os campos estão preenchidos corretamente';
    } else if (error.message && error.message.includes('no such column')) {
      errorMessage = 'Erro na estrutura do banco de dados';
      errorDetails = 'Uma coluna necessária não foi encontrada. Entre em contato com o suporte.';
    } else if (error.message && error.message.includes('undefined')) {
      errorMessage = 'Erro de validação';
      errorDetails = 'Alguns campos obrigatórios não foram preenchidos corretamente';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      code: error.code,
      name: error.name,
      // Em desenvolvimento, incluir stack trace
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  }
});

// Atualizar promoção
router.put('/:id', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da promoção é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    const {
      title,
      description,
      discount_type,
      discount_value,
      product_id,
      start_date,
      end_date,
      show_timer,
      active,
      applies_to
    } = req.body;
    
    // Buscar loja do usuário
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const store = isSQLite()
      ? db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id)
      : await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Verificar se a promoção existe e pertence à loja
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const existing = isSQLite()
      ? db.prepare('SELECT * FROM promotions WHERE id = ? AND store_id = ?').get(id, store.id)
      : await db.prepare('SELECT * FROM promotions WHERE id = ? AND store_id = ?').get(id, store.id);
    
    if (!existing) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    
    // Validações
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Título não pode ser vazio' });
    }
    
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'Data de término deve ser posterior à data de início' });
    }
    
    // Verificar se product_id existe (se fornecido)
    // Adaptar verificação para ambos os schemas
    const existingProductId = isSQLite() 
      ? existing.product_id 
      : (existing.product_ids ? JSON.parse(existing.product_ids)[0] : null);
    
    if (product_id && product_id !== 'all' && product_id !== existingProductId) {
      // NOTA: better-sqlite3 é síncrono, não precisa de await
      const product = isSQLite()
        ? db.prepare('SELECT id FROM products WHERE id = ? AND store_id = ?').get(product_id, store.id)
        : await db.prepare('SELECT id FROM products WHERE id = ? AND store_id = ?').get(product_id, store.id);
      if (!product) {
        return res.status(400).json({ error: 'Produto não encontrado' });
      }
    }
    
    // Adaptar atualização para diferentes schemas
    if (isSQLite()) {
      // Schema SQLite - NOTA: better-sqlite3 é síncrono, não precisa de await
      try {
        // Tentar atualizar com show_timer primeiro
          db.prepare(`
            UPDATE promotions SET
              title = COALESCE(?, title),
              description = ?,
              discount_type = COALESCE(?, discount_type),
              discount_value = ?,
              product_id = ?,
              start_date = COALESCE(?, start_date),
              end_date = COALESCE(?, end_date),
              show_timer = ?,
              active = ?,
              applies_to = COALESCE(?, applies_to),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND store_id = ?
          `).run(
            title ? title.trim() : null,
            description !== undefined ? (description || null) : null,
            discount_type || null,
            discount_type !== 'free_shipping' ? (discount_value || null) : null,
            product_id && product_id !== 'all' ? product_id : (product_id === 'all' ? null : existing.product_id),
            start_date || null,
            end_date || null,
            show_timer !== undefined ? (show_timer ? true : false) : existing.show_timer,
            active !== undefined ? (active ? true : false) : existing.active,
            applies_to !== undefined ? (applies_to || 'both') : existing.applies_to || 'both',
            id,
            store.id
          );
      } catch (sqliteError) {
        // Se der erro por falta da coluna show_timer, atualizar sem ela
        if (sqliteError.message && sqliteError.message.includes('show_timer')) {
          console.log('⚠️ Coluna show_timer não existe no SQLite, atualizando sem ela...');
          db.prepare(`
            UPDATE promotions SET
              title = COALESCE(?, title),
              description = ?,
              discount_type = COALESCE(?, discount_type),
              discount_value = ?,
              product_id = ?,
              start_date = COALESCE(?, start_date),
              end_date = COALESCE(?, end_date),
              active = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND store_id = ?
          `).run(
            title ? title.trim() : null,
            description !== undefined ? (description || null) : null,
            discount_type || null,
            discount_type !== 'free_shipping' ? (discount_value || null) : null,
            product_id && product_id !== 'all' ? product_id : (product_id === 'all' ? null : existing.product_id),
            start_date || null,
            end_date || null,
            active !== undefined ? (active ? true : false) : existing.active,
            id,
            store.id
          );
        } else {
          throw sqliteError;
        }
      }
    } else {
      // Schema PostgreSQL: name, type, value, product_ids (JSON)
      let productIds = null;
      if (product_id !== undefined) {
        if (product_id === 'all') {
          productIds = null;
        } else if (product_id && product_id !== 'all') {
          productIds = JSON.stringify([product_id]);
        } else {
          // product_id é null ou vazio, manter o existente
          productIds = existing.product_ids || null;
        }
      } else {
        // product_id não foi fornecido, manter o existente
        productIds = existing.product_ids || null;
      }
      
      const updateFields = [];
      const updateValues = [];
      
      console.log('📝 Atualizando promoção:', {
        id,
        title: title !== undefined ? title : '(não alterado)',
        description: description !== undefined ? description : '(não alterado)',
        discount_type: discount_type !== undefined ? discount_type : '(não alterado)',
        discount_value: discount_value !== undefined ? discount_value : '(não alterado)',
        product_id: product_id !== undefined ? product_id : '(não alterado)',
        productIds,
        start_date: start_date !== undefined ? start_date : '(não alterado)',
        end_date: end_date !== undefined ? end_date : '(não alterado)',
        show_timer: show_timer !== undefined ? show_timer : '(não alterado)',
        active: active !== undefined ? active : '(não alterado)'
      });
      
      if (title !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(title.trim());
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description || null);
      }
      if (discount_type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(discount_type);
      }
      if (discount_value !== undefined) {
        // discount_value foi fornecido explicitamente
        updateFields.push('value = ?');
        const finalValue = discount_type === 'free_shipping' ? null : discount_value;
        updateValues.push(finalValue);
      } else if (discount_type !== undefined && discount_type === 'free_shipping') {
        // discount_type mudou para 'free_shipping', precisamos atualizar value para null
        updateFields.push('value = ?');
        updateValues.push(null);
      }
      if (product_id !== undefined) {
        updateFields.push('product_ids = ?');
        // Garantir que productIds não seja undefined
        const finalProductIds = productIds !== undefined ? productIds : null;
        console.log('📦 product_id fornecido:', product_id, '-> productIds:', finalProductIds);
        updateValues.push(finalProductIds);
      }
      if (start_date !== undefined) {
        updateFields.push('start_date = ?');
        updateValues.push(start_date);
      }
      if (end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(end_date);
      }
      // Verificar se a coluna show_timer existe antes de tentar atualizar
      let hasShowTimerColumn = false;
      try {
        const checkQuery = `
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'promotions' 
            AND column_name = 'show_timer'
          ) as exists;
        `;
        
        const columnCheckResult = await db.prepare(checkQuery).get();
        
        if (columnCheckResult) {
          hasShowTimerColumn = columnCheckResult.exists === true || columnCheckResult.exists === 't' || columnCheckResult.exists === 1;
        }
        
        console.log('📝 Coluna show_timer existe para atualização?', hasShowTimerColumn);
      } catch (checkError) {
        console.log('⚠️ Erro ao verificar coluna show_timer, assumindo que NÃO existe:', checkError.message);
        hasShowTimerColumn = false;
      }
      
      // Incluir show_timer na atualização apenas se a coluna existir
      if (hasShowTimerColumn && show_timer !== undefined) {
        updateFields.push('show_timer = ?');
        const finalShowTimer = show_timer === true || show_timer === 1 || show_timer === 'true';
        console.log('⏰ show_timer fornecido:', show_timer, '-> final:', finalShowTimer);
        updateValues.push(finalShowTimer);
      } else if (!hasShowTimerColumn) {
        console.log('⚠️ show_timer ignorado na atualização (coluna não existe no banco)');
      }
      if (active !== undefined) {
        updateFields.push('active = ?');
        updateValues.push(active ? true : false);
      }
      // Verificar se a coluna applies_to existe antes de tentar atualizar
      let hasAppliesToColumn = false;
      try {
        const checkAppliesToQuery = `
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'promotions' 
            AND column_name = 'applies_to'
          ) as exists;
        `;
        
        const appliesToCheckResult = await db.prepare(checkAppliesToQuery).get();
        
        if (appliesToCheckResult) {
          hasAppliesToColumn = appliesToCheckResult.exists === true || appliesToCheckResult.exists === 't' || appliesToCheckResult.exists === 1;
        }
        
        console.log('📝 Coluna applies_to existe para atualização?', hasAppliesToColumn);
      } catch (checkError) {
        console.log('⚠️ Erro ao verificar coluna applies_to, assumindo que NÃO existe:', checkError.message);
        hasAppliesToColumn = false;
      }
      
      // Incluir applies_to na atualização apenas se a coluna existir
      if (hasAppliesToColumn && applies_to !== undefined) {
        updateFields.push('applies_to = ?');
        updateValues.push(applies_to || 'both');
      } else if (!hasAppliesToColumn && applies_to !== undefined) {
        console.log('⚠️ applies_to ignorado na atualização (coluna não existe no banco)');
      }
      
      // Sempre atualizar updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      // Validar que não há valores undefined (o wrapper PostgreSQL não aceita)
      const validatedValues = updateValues.map((val, idx) => {
        if (val === undefined) {
          console.error(`⚠️ Valor ${idx + 1} é undefined nos campos de atualização`);
          console.error('Campos:', updateFields);
          console.error('Valores:', updateValues);
          throw new Error(`Valor do campo ${updateFields[idx]} não pode ser undefined`);
        }
        return val;
      });
      
      // Adicionar valores do WHERE ao final (id e store.id nunca devem ser undefined)
      validatedValues.push(id, store.id);
      
      // PostgresDB converte ? para $1, $2, ... automaticamente
      // Mas precisamos garantir que há pelo menos um campo para atualizar
      if (updateFields.length === 1) {
        // Apenas updated_at, não há nada para atualizar
        return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
      }
      
      const query = `
        UPDATE promotions SET
          ${updateFields.join(', ')}
        WHERE id = ? AND store_id = ?
      `;
      
      try {
        console.log('📝 Query UPDATE:', query);
        console.log('📝 Campos a atualizar:', updateFields);
        console.log('📝 Valores validados:', validatedValues);
        console.log('📝 Número de placeholders esperados:', (updateFields.length - 1) + 2); // -1 porque updated_at não tem placeholder
        console.log('📝 Número de valores fornecidos:', validatedValues.length);
        
        // Verificar se o número de placeholders corresponde ao número de valores
        const expectedPlaceholders = (updateFields.length - 1) + 2; // -1 porque updated_at não tem placeholder, +2 para WHERE
        if (validatedValues.length !== expectedPlaceholders) {
          console.error('❌ ERRO: Número de valores não corresponde ao número de placeholders!');
          console.error(`Esperado: ${expectedPlaceholders}, Recebido: ${validatedValues.length}`);
          throw new Error(`Número de valores (${validatedValues.length}) não corresponde ao número de placeholders (${expectedPlaceholders})`);
        }
        
        await db.prepare(query).run(...validatedValues);
        console.log('✅ Promoção atualizada com sucesso');
      } catch (updateError) {
        console.error('❌ Erro na query UPDATE:', updateError);
        console.error('Stack:', updateError.stack);
        console.error('Código:', updateError.code);
        console.error('Mensagem:', updateError.message);
        console.error('Query:', query);
        console.error('Valores:', validatedValues);
        console.error('Tipos dos valores:', validatedValues.map(v => typeof v));
        
        // Se for erro de coluna não encontrada, pode ser que show_timer ou applies_to não existe
        if (updateError.message && (
          updateError.message.includes('column') ||
          updateError.message.includes('does not exist') ||
          updateError.code === '42703' // PostgreSQL: undefined column
        )) {
          console.log('⚠️ Erro de coluna não encontrada. Tentando atualizar sem colunas problemáticas...');
          try {
            // Remover show_timer e applies_to dos campos de atualização (caso não existam)
            const fieldsWithoutProblematic = updateFields.filter(field => 
              !field.includes('show_timer') && !field.includes('applies_to')
            );
            
            // Encontrar os índices dos campos problemáticos
            const showTimerIndex = updateFields.findIndex(f => f.includes('show_timer'));
            const appliesToIndex = updateFields.findIndex(f => f.includes('applies_to'));
            
            // Remover os valores correspondentes
            let valuesWithoutProblematic = [...validatedValues];
            if (appliesToIndex >= 0 && appliesToIndex < valuesWithoutProblematic.length - 2) {
              // Remove applies_to (antes dos valores do WHERE)
              valuesWithoutProblematic = [
                ...valuesWithoutProblematic.slice(0, appliesToIndex),
                ...valuesWithoutProblematic.slice(appliesToIndex + 1)
              ];
            }
            if (showTimerIndex >= 0 && showTimerIndex < valuesWithoutProblematic.length - 2) {
              // Remove show_timer (antes dos valores do WHERE)
              valuesWithoutProblematic = [
                ...valuesWithoutProblematic.slice(0, showTimerIndex),
                ...valuesWithoutProblematic.slice(showTimerIndex + 1)
              ];
            }
            
            // Reconstruir query sem colunas problemáticas
            const queryWithoutProblematic = `
              UPDATE promotions 
              SET ${fieldsWithoutProblematic.join(', ')}, updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND store_id = ?
            `;
            
            console.log('📝 Query sem colunas problemáticas:', queryWithoutProblematic);
            console.log('📝 Valores sem colunas problemáticas:', valuesWithoutProblematic);
            console.log('📝 Campos removidos:', updateFields.filter(f => f.includes('show_timer') || f.includes('applies_to')));
            
            await db.prepare(queryWithoutProblematic).run(...valuesWithoutProblematic);
            console.log('✅ Promoção atualizada com sucesso (sem colunas problemáticas)');
          } catch (retryError) {
            console.error('❌ Erro ao tentar atualizar sem colunas problemáticas:', retryError);
            console.error('Mensagem:', retryError.message);
            console.error('Código:', retryError.code);
            throw new Error('Erro ao atualizar promoção. Verifique se todos os campos estão corretos: ' + retryError.message);
          }
        } else {
          throw updateError;
        }
      }
    }
    
    // Buscar promoção atualizada
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    let promotion = isSQLite()
      ? db.prepare(`
          SELECT p.*
          FROM promotions p
          WHERE p.id = ?
        `).get(id)
      : await db.prepare(`
          SELECT p.*
          FROM promotions p
          WHERE p.id = ?
        `).get(id);
    
    // Adaptar resposta para formato unificado
    if (!isSQLite()) {
      promotion = {
        ...promotion,
        title: promotion.name,
        discount_type: promotion.type,
        discount_value: promotion.value,
        product_id: promotion.product_ids ? JSON.parse(promotion.product_ids)[0] || 'all' : 'all',
        show_timer: promotion.show_timer === true || promotion.show_timer === 1
      };
    }
    
    // Normalizar show_timer: usar valor do banco se existir, senão usar valor enviado pelo frontend
    let finalShowTimerValue = false;
    if (promotion.show_timer !== undefined && promotion.show_timer !== null) {
      finalShowTimerValue = promotion.show_timer === 1 
        || promotion.show_timer === true 
        || promotion.show_timer === 't' 
        || promotion.show_timer === 'true'
        || promotion.show_timer === '1'
        || (typeof promotion.show_timer === 'string' && promotion.show_timer.toLowerCase() === 'true');
    } else if (show_timer !== undefined) {
      // Se não existe no banco, usar o valor enviado pelo frontend
      finalShowTimerValue = show_timer === true 
        || show_timer === 1 
        || show_timer === 'true'
        || show_timer === '1'
        || (typeof show_timer === 'string' && show_timer.toLowerCase() === 'true');
    }
    
    res.json({
      ...promotion,
      active: promotion.active === 1 || promotion.active === true,
      show_timer: finalShowTimerValue, // Sempre retornar o valor correto
      discount_value: promotion.discount_value ? parseFloat(promotion.discount_value) : null,
      applies_to: promotion.applies_to || applies_to || 'both'
    });
  } catch (error) {
    console.error('Erro ao atualizar promoção:', error);
    console.error('Stack:', error.stack);
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
    res.status(500).json({ 
      error: 'Erro ao atualizar promoção', 
      details: error.message,
      code: error.code
    });
  }
});

// Deletar promoção
router.delete('/:id', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da promoção é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    
    // Buscar loja do usuário
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const store = isSQLite()
      ? db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id)
      : await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Verificar se a promoção existe e pertence à loja
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const promotion = isSQLite()
      ? db.prepare('SELECT * FROM promotions WHERE id = ? AND store_id = ?').get(id, store.id)
      : await db.prepare('SELECT * FROM promotions WHERE id = ? AND store_id = ?').get(id, store.id);
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    
    // Deletar promoção
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    if (isSQLite()) {
      db.prepare('DELETE FROM promotions WHERE id = ? AND store_id = ?').run(id, store.id);
    } else {
      await db.prepare('DELETE FROM promotions WHERE id = ? AND store_id = ?').run(id, store.id);
    }
    
    res.json({ message: 'Promoção deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar promoção:', error);
    res.status(500).json({ error: 'Erro ao deletar promoção' });
  }
});

export default router;

