import express from 'express';
import { db } from '../database/db.js';
import { isSQLite } from '../database/db-wrapper.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { sanitizeBody } from '../middleware/validation.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { getPaginationParams, createPaginationResponse, applyPagination } from '../utils/pagination.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar lojas
router.get('/', optionalAuth, async (req, res) => {
  try {
    let query = 'SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name FROM stores s';
    query += ' LEFT JOIN users u ON s.user_id = u.id';
    query += ' LEFT JOIN cities c ON s.city_id = c.id';
    query += ' LEFT JOIN categories cat ON s.category_id = cat.id';
    query += ' WHERE 1=1';

    const params = [];

    if (req.query.status) {
      query += ' AND s.status = ?';
      params.push(req.query.status);
    }

    if (req.query.user_id) {
      query += ' AND s.user_id = ?';
      params.push(req.query.user_id);
    }

    if (req.query.city_id) {
      query += ' AND s.city_id = ?';
      params.push(req.query.city_id);
    }

    if (req.query.category_id) {
      query += ' AND s.category_id = ?';
      params.push(req.query.category_id);
    }

    if (req.query.search) {
      query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (req.query.featured !== undefined) {
      // featured pode ser 'true', 'false', '1', '0', etc.
      const isFeatured = req.query.featured === 'true' || req.query.featured === '1' || req.query.featured === true;
      query += ' AND s.featured = ?';
      params.push(isFeatured ? 1 : 0);
    }

    query += ' ORDER BY s.created_at DESC';

    // Paginação
    const { page, limit, offset } = getPaginationParams(req.query, { defaultLimit: 20, maxLimit: 100 });
    
    // Contar total de registros - criar query de contagem separada sem JOINs desnecessários
    const countQuery = query
      .replace(/SELECT.*FROM/, 'SELECT COUNT(DISTINCT s.id) as total FROM')
      .replace(/ORDER BY.*$/, ''); // Remover ORDER BY da query de contagem
    const countResult = await db.prepare(countQuery).get(...params);
    const total = countResult?.total || 0;
    
    // Aplicar paginação
    const paginatedQuery = applyPagination(query, limit, offset);
    params.push(limit, offset);

    const stores = await db.prepare(paginatedQuery).all(...params);
    
    // Retornar com paginação
    const response = createPaginationResponse(stores, total, page, limit);
    res.json(response);
  } catch (error) {
    console.error('Erro ao listar lojas:', error);
    res.status(500).json({ error: 'Erro ao listar lojas' });
  }
});

// Obter loja por slug (rota especial antes da rota por ID)
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ error: 'Slug é obrigatório' });
    }

    const store = await db.prepare(`
      SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
      FROM stores s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN cities c ON s.city_id = c.id
      LEFT JOIN categories cat ON s.category_id = cat.id
      WHERE s.slug = ?
    `).get(slug);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Parse payment_methods se for string
    if (store.payment_methods && typeof store.payment_methods === 'string') {
      try {
        store.payment_methods = JSON.parse(store.payment_methods);
      } catch (e) {
        store.payment_methods = ['whatsapp'];
      }
    }

    res.json(store);
  } catch (error) {
    console.error('Erro ao buscar loja por slug:', error);
    res.status(500).json({ error: 'Erro ao buscar loja' });
  }
});

// Obter loja por ID ou slug
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID ou slug da loja é obrigatório' });
    }

    const identifier = req.params.id;
    
    // Verificar se é um UUID (formato com hífens) ou slug (sem hífens ou formato diferente)
    // UUIDs geralmente têm o formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caracteres)
    const isUUID = identifier.length === 36 && identifier.includes('-');
    
    let store;
    if (isUUID) {
      // Buscar por ID (UUID)
      store = await db.prepare(`
        SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
        FROM stores s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN cities c ON s.city_id = c.id
        LEFT JOIN categories cat ON s.category_id = cat.id
        WHERE s.id = ?
      `).get(identifier);
    } else {
      // Buscar por slug
      console.log('🔍 Buscando loja por slug:', identifier);
      console.log('🔍 Identifier length:', identifier.length);
      console.log('🔍 Identifier type:', typeof identifier);
      
      // Normalizar o identifier (mesma lógica usada ao salvar)
      const normalizedIdentifier = identifier.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      console.log('🔍 Identifier normalizado:', normalizedIdentifier);
      
      // Tentar buscar exatamente como fornecido (sem normalização)
      store = await db.prepare(`
        SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
        FROM stores s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN cities c ON s.city_id = c.id
        LEFT JOIN categories cat ON s.category_id = cat.id
        WHERE s.slug = ?
      `).get(identifier);
      
      // Se não encontrou, tentar com o identifier normalizado
      if (!store) {
        console.log('⚠️ Não encontrou com busca exata, tentando com identifier normalizado...');
        store = await db.prepare(`
          SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
          FROM stores s
          LEFT JOIN users u ON s.user_id = u.id
          LEFT JOIN cities c ON s.city_id = c.id
          LEFT JOIN categories cat ON s.category_id = cat.id
          WHERE s.slug = ?
        `).get(normalizedIdentifier);
      }
      
      // Se ainda não encontrou, tentar case-insensitive
      if (!store) {
        console.log('⚠️ Não encontrou com normalizado, tentando case-insensitive...');
        store = await db.prepare(`
          SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
          FROM stores s
          LEFT JOIN users u ON s.user_id = u.id
          LEFT JOIN cities c ON s.city_id = c.id
          LEFT JOIN categories cat ON s.category_id = cat.id
          WHERE LOWER(s.slug) = LOWER(?)
        `).get(identifier);
      }
      
      console.log('📦 Resultado da busca por slug:', store ? { id: store.id, name: store.name, slug: store.slug } : 'null');
      
      // Debug: listar todos os slugs no banco para comparação
      if (!store) {
        const allSlugs = await db.prepare('SELECT id, name, slug FROM stores WHERE slug IS NOT NULL LIMIT 10').all();
        console.log('📋 Slugs existentes no banco:', allSlugs.map(s => ({ id: s.id, name: s.name, slug: s.slug })));
      }
    }
    
    if (!store) {
      console.log('❌ Loja não encontrada para identifier:', identifier);
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    console.log('✅ Loja encontrada:', { id: store.id, name: store.name, slug: store.slug });

    // Parse payment_methods se for string
    if (store.payment_methods && typeof store.payment_methods === 'string') {
      try {
        store.payment_methods = JSON.parse(store.payment_methods);
      } catch (e) {
        store.payment_methods = ['whatsapp']; // Fallback
      }
    } else if (!store.payment_methods) {
      store.payment_methods = ['whatsapp']; // Default
    }

    res.json(store);
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro ao buscar loja', details: error.message });
  }
});

// Criar loja (requer autenticação - permite user, store e admin)
router.post('/', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const { name, description, logo, store_type, whatsapp, city_id, category_id, has_physical_store, plan_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Verificar se usuário já tem uma loja
    const existingStore = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    if (existingStore && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Você já possui uma loja cadastrada' });
    }

    const userId = req.user.role === 'admin' && req.body.user_id ? req.body.user_id : req.user.id;
    const id = uuidv4();

    await db.prepare(`
      INSERT INTO stores (id, user_id, name, description, logo, store_type, whatsapp, city_id, category_id, has_physical_store, plan_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      id,
      userId,
      name,
      description ? sanitizeHTML(description.trim()) : '',
      logo || '',
      store_type || 'physical',
      whatsapp || '',
      city_id || null,
      category_id || null,
      has_physical_store ? 1 : 0,
      plan_id || null
    );

    // Atualizar role do usuário para 'store' se ainda não for admin ou store
    if (req.user.role !== 'admin' && req.user.role !== 'store') {
      await db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('store', userId);
    }

    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
    res.status(201).json(store);
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    // Retornar mensagem de erro mais específica
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({ error: 'Cidade ou categoria inválida' });
    }
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Já existe uma loja com esses dados' });
    }
    res.status(500).json({ error: error.message || 'Erro ao criar loja' });
  }
});

// Atualizar loja
router.put('/:id', authenticateToken, requireRole('store', 'admin'), sanitizeBody, async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da loja é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const store = isSQLite()
      ? db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id)
      : await db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta loja' });
    }

    const { 
      name, description, logo, store_type, whatsapp, city_id, category_id, 
      has_physical_store, plan_id, status, featured, checkout_enabled,
      slug, // Campo para personalizar link
      installments_enabled, // Campo para habilitar parcelamento
      // Campos de pagamento
      pix_key, payment_link, payment_instructions,
      // Campos do Mercado Pago
      mercadopago_access_token, mercadopago_public_key,
      // Campos de frete
      shipping_fixed_price, shipping_calculate_on_whatsapp, shipping_free_threshold
    } = req.body;
    
    const updates = [];
    const values = [];

    // Validar e normalizar slug se fornecido
    if (slug !== undefined) {
      if (slug === null || slug === '') {
        // Permitir remover slug (definir como null)
        updates.push('slug = ?');
        values.push(null);
      } else {
        // Normalizar slug: apenas letras minúsculas, números e hífens
        const normalizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        if (normalizedSlug.length < 3) {
          return res.status(400).json({ error: 'O link personalizado deve ter pelo menos 3 caracteres' });
        }
        
        if (normalizedSlug.length > 50) {
          return res.status(400).json({ error: 'O link personalizado deve ter no máximo 50 caracteres' });
        }
        
        // Verificar se slug já existe em outra loja
        // NOTA: better-sqlite3 é síncrono, não precisa de await
        const existingStore = isSQLite()
          ? db.prepare('SELECT id FROM stores WHERE slug = ? AND id != ?').get(normalizedSlug, req.params.id)
          : await db.prepare('SELECT id FROM stores WHERE slug = ? AND id != ?').get(normalizedSlug, req.params.id);
        if (existingStore) {
          return res.status(400).json({ error: 'Este link personalizado já está em uso por outra loja' });
        }
        
        updates.push('slug = ?');
        values.push(normalizedSlug);
      }
    }
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { 
      // Sanitizar descrição para prevenir XSS
      const sanitizedDescription = description ? sanitizeHTML(description.trim()) : '';
      updates.push('description = ?'); 
      values.push(sanitizedDescription); 
    }
    if (logo !== undefined) { updates.push('logo = ?'); values.push(logo); }
    if (store_type !== undefined) { updates.push('store_type = ?'); values.push(store_type); }
    if (whatsapp !== undefined) { updates.push('whatsapp = ?'); values.push(whatsapp); }
    if (city_id !== undefined) { 
      updates.push('city_id = ?'); 
      // Aceitar null para remover cidade, ou UUID válido
      values.push(city_id === null || city_id === '' ? null : city_id); 
      console.log('city_id sendo atualizado:', city_id === null || city_id === '' ? null : city_id);
    }
    if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id); }
    if (has_physical_store !== undefined) { updates.push('has_physical_store = ?'); values.push(has_physical_store ? 1 : 0); }
    if (checkout_enabled !== undefined) { updates.push('checkout_enabled = ?'); values.push(checkout_enabled ? 1 : 0); }
    if (installments_enabled !== undefined) { updates.push('installments_enabled = ?'); values.push(installments_enabled ? 1 : 0); }
    // Campos de pagamento
    if (pix_key !== undefined) { updates.push('pix_key = ?'); values.push(pix_key || null); }
    if (payment_link !== undefined) { updates.push('payment_link = ?'); values.push(payment_link || null); }
    if (payment_instructions !== undefined) { updates.push('payment_instructions = ?'); values.push(payment_instructions || null); }
    // Campos do Mercado Pago (apenas admin pode atualizar diretamente, lojista usa rota específica)
    if (req.user.role === 'admin') {
      if (mercadopago_access_token !== undefined) { updates.push('mercadopago_access_token = ?'); values.push(mercadopago_access_token || null); }
      if (mercadopago_public_key !== undefined) { updates.push('mercadopago_public_key = ?'); values.push(mercadopago_public_key || null); }
    }
    // Campos de frete
    if (shipping_fixed_price !== undefined) { updates.push('shipping_fixed_price = ?'); values.push(shipping_fixed_price || null); }
    if (shipping_calculate_on_whatsapp !== undefined) { updates.push('shipping_calculate_on_whatsapp = ?'); values.push(shipping_calculate_on_whatsapp ? 1 : 0); }
    if (shipping_free_threshold !== undefined) { updates.push('shipping_free_threshold = ?'); values.push(shipping_free_threshold || null); }
    if (plan_id !== undefined) { 
      updates.push('plan_id = ?'); 
      values.push(plan_id);
      console.log(`Atualizando plan_id da loja ${req.params.id} para: ${plan_id}`);
    }
    if (status !== undefined && req.user.role === 'admin') { updates.push('status = ?'); values.push(status); }
    if (featured !== undefined && req.user.role === 'admin') { updates.push('featured = ?'); values.push(featured ? 1 : 0); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    // Validar que não há valores undefined (PostgreSQL não aceita)
    const validatedValues = values.map((val, idx) => {
      if (val === undefined) {
        console.error(`⚠️ Valor ${idx + 1} é undefined nos campos de atualização`);
        console.error('Campo:', updates[idx]);
        console.error('Valores:', values);
        throw new Error(`Valor do campo ${updates[idx]} não pode ser undefined`);
      }
      return val;
    });

    // Verificar se o número de placeholders corresponde ao número de valores
    // updated_at = CURRENT_TIMESTAMP não tem placeholder (não usa ?)
    // Então: número de placeholders = número de updates com ? + 1 (para WHERE id = ?)
    // Como updated_at é o último e não tem ?, temos: (updates.length - 1) placeholders + 1 para WHERE = updates.length
    const expectedPlaceholders = updates.length; // Todos os updates têm ?, exceto updated_at que não conta, mas o WHERE conta
    
    if (validatedValues.length !== expectedPlaceholders) {
      console.error('❌ ERRO: Número de valores não corresponde ao número de placeholders!');
      console.error(`Esperado: ${expectedPlaceholders}, Recebido: ${validatedValues.length}`);
      console.error('Updates:', updates);
      console.error('Valores:', validatedValues);
      console.error('Tipos dos valores:', validatedValues.map(v => typeof v));
      // Não lançar erro fatal, apenas logar - pode ser um problema de contagem que não impede a execução
      console.warn('⚠️ Continuando apesar da diferença de contagem...');
    }
    
    console.log('Atualizando loja com:', updates.join(', '));
    console.log('Valores validados:', validatedValues);
    console.log('Número de valores:', validatedValues.length);
    console.log('Número de updates:', updates.length);
    console.log('Placeholders esperados:', expectedPlaceholders);

    // NOTA: better-sqlite3 é síncrono, não precisa de await
    if (isSQLite()) {
      db.prepare(`
        UPDATE stores 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...validatedValues);
    } else {
      await db.prepare(`
        UPDATE stores 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...validatedValues);
    }

    // Retornar loja atualizada com JOIN para incluir city_name
    // NOTA: better-sqlite3 é síncrono, não precisa de await
    const updated = isSQLite()
      ? db.prepare(`
          SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
          FROM stores s
          LEFT JOIN users u ON s.user_id = u.id
          LEFT JOIN cities c ON s.city_id = c.id
          LEFT JOIN categories cat ON s.category_id = cat.id
          WHERE s.id = ?
        `).get(req.params.id)
      : await db.prepare(`
          SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
          FROM stores s
          LEFT JOIN users u ON s.user_id = u.id
          LEFT JOIN cities c ON s.city_id = c.id
          LEFT JOIN categories cat ON s.category_id = cat.id
          WHERE s.id = ?
        `).get(req.params.id);
    
    console.log('Loja atualizada - plan_id:', updated.plan_id);
    console.log('Loja atualizada - city_id:', updated.city_id);
    console.log('Loja atualizada - city_name:', updated.city_name);
    console.log('Loja atualizada - checkout_enabled:', updated.checkout_enabled, 'tipo:', typeof updated.checkout_enabled);
    
    // Garantir que campos boolean sejam boolean
    const response = {
      ...updated,
      checkout_enabled: updated.checkout_enabled === 1 || updated.checkout_enabled === true,
      installments_enabled: updated.installments_enabled === 1 || updated.installments_enabled === true
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    console.error('Stack:', error.stack);
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
    console.error('Body recebido:', req.body);
    res.status(500).json({ 
      error: 'Erro ao atualizar loja',
      details: error.message,
      code: error.code
    });
  }
});

// Deletar loja
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da loja é obrigatório' });
    }

    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    await db.prepare('DELETE FROM stores WHERE id = ?').run(req.params.id);
    res.json({ message: 'Loja deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar loja:', error);
    res.status(500).json({ error: 'Erro ao deletar loja' });
  }
});

// Configurar métodos de pagamento da loja
router.put('/:id/payment-methods', authenticateToken, requireRole('store', 'admin'), sanitizeBody, async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da loja é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { id } = req.params;
    const { payment_methods, mercadopago_access_token, mercadopago_public_key } = req.body;

    // Verificar se a loja existe e pertence ao usuário (ou se é admin)
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Verificar se o usuário é dono da loja ou admin
    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para alterar esta loja' });
    }

    // Validar payment_methods
    if (payment_methods && !Array.isArray(payment_methods)) {
      return res.status(400).json({ error: 'payment_methods deve ser um array' });
    }

    if (payment_methods) {
      const validMethods = ['mercadopago', 'whatsapp'];
      const invalidMethods = payment_methods.filter(m => !validMethods.includes(m));
      if (invalidMethods.length > 0) {
        return res.status(400).json({ 
          error: `Métodos inválidos: ${invalidMethods.join(', ')}. Métodos válidos: ${validMethods.join(', ')}` 
        });
      }

      // Garantir que pelo menos um método esteja ativo
      if (payment_methods.length === 0) {
        return res.status(400).json({ error: 'Pelo menos um método de pagamento deve estar ativo' });
      }
    }

    // Preparar atualização
    const updates = [];
    const params = [];

    if (payment_methods !== undefined) {
      updates.push('payment_methods = ?');
      params.push(JSON.stringify(payment_methods));
    }

    if (mercadopago_access_token !== undefined) {
      updates.push('mercadopago_access_token = ?');
      params.push(mercadopago_access_token || null);
    }

    if (mercadopago_public_key !== undefined) {
      updates.push('mercadopago_public_key = ?');
      params.push(mercadopago_public_key || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE stores SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(query).run(...params);

    // Buscar loja atualizada
    const updatedStore = await db.prepare(`
      SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
      FROM stores s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN cities c ON s.city_id = c.id
      LEFT JOIN categories cat ON s.category_id = cat.id
      WHERE s.id = ?
    `).get(id);

    // Parse payment_methods se for string
    if (updatedStore.payment_methods && typeof updatedStore.payment_methods === 'string') {
      try {
        updatedStore.payment_methods = JSON.parse(updatedStore.payment_methods);
      } catch (e) {
        updatedStore.payment_methods = ['whatsapp']; // Fallback
      }
    }

    res.json(updatedStore);
  } catch (error) {
    console.error('Erro ao atualizar métodos de pagamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar métodos de pagamento' });
  }
});

// Obter métodos de pagamento da loja
router.get('/:id/payment-methods', optionalAuth, async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da loja é obrigatório' });
    }

    const { id } = req.params;
    const store = await db.prepare('SELECT payment_methods, mercadopago_access_token, mercadopago_public_key FROM stores WHERE id = ?').get(id);

    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Parse payment_methods se for string
    let payment_methods = ['whatsapp']; // Default
    if (store.payment_methods) {
      try {
        payment_methods = typeof store.payment_methods === 'string' 
          ? JSON.parse(store.payment_methods) 
          : store.payment_methods;
      } catch (e) {
        payment_methods = ['whatsapp']; // Fallback
      }
    }

    res.json({
      payment_methods,
      has_mercadopago_configured: !!(store.mercadopago_access_token || store.mercadopago_public_key),
      // Não retornar tokens por segurança (apenas indicar se está configurado)
    });
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    res.status(500).json({ error: 'Erro ao buscar métodos de pagamento' });
  }
});

// Obter estatísticas da loja (requer autenticação e ser dono da loja ou admin)
router.get('/:storeId/stats', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Verificar se é UUID ou slug
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
    
    // Verificar se o usuário é dono da loja ou admin
    const store = await db.prepare('SELECT user_id FROM stores WHERE id = ?').get(actualStoreId);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    if (store.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Obter período do query string (padrão: 30 dias) ou datas personalizadas
    let periodFilter;
    let periodDays = 30;
    
    if (req.query.start_date && req.query.end_date) {
      // Período personalizado usando datas específicas
      const startDate = req.query.start_date;
      const endDate = req.query.end_date;
      periodFilter = isSQLite()
        ? `datetime('${startDate} 00:00:00')`
        : `'${startDate} 00:00:00'::timestamp`;
      
      // Calcular dias para exibição
      const start = new Date(startDate);
      const end = new Date(endDate);
      periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    } else {
      // Período padrão em dias
      periodDays = parseInt(req.query.period) || 30;
      periodFilter = isSQLite() 
        ? `datetime('now', '-${periodDays} days')`
        : `CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'`;
    }
    
    // Filtro de data final (para período personalizado)
    const endDateFilter = req.query.start_date && req.query.end_date
      ? (isSQLite()
          ? `datetime('${req.query.end_date} 23:59:59')`
          : `'${req.query.end_date} 23:59:59'::timestamp`)
      : (isSQLite()
          ? `datetime('now')`
          : `CURRENT_TIMESTAMP`);
    
    // Estatísticas de produtos - filtrar por período se fornecido
    // Nota: Como não há histórico de visualizações/mensagens por data, vamos usar uma estimativa
    // baseada na distribuição proporcional ao longo do tempo de vida do produto
    let productsStats;
    if (req.query.start_date && req.query.end_date) {
      // Período personalizado: calcular estimativa baseada na proporção do período
      const startDate = new Date(req.query.start_date);
      const endDate = new Date(req.query.end_date);
      const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      if (isSQLite()) {
        productsStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_products,
            -- Estimar visualizações baseado na proporção do período vs tempo de vida do produto
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= datetime('${req.query.start_date} 00:00:00')
                  AND p.created_at <= datetime('${req.query.end_date} 23:59:59')
                THEN COALESCE(p.total_views, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < datetime('${req.query.start_date} 00:00:00')
                THEN CAST(
                  (COALESCE(p.total_views, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('${req.query.end_date} 23:59:59') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as total_views,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= datetime('${req.query.start_date} 00:00:00')
                  AND p.created_at <= datetime('${req.query.end_date} 23:59:59')
                THEN COALESCE(p.views_from_marketplace, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < datetime('${req.query.start_date} 00:00:00')
                THEN CAST(
                  (COALESCE(p.views_from_marketplace, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('${req.query.end_date} 23:59:59') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_marketplace,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= datetime('${req.query.start_date} 00:00:00')
                  AND p.created_at <= datetime('${req.query.end_date} 23:59:59')
                THEN COALESCE(p.views_from_store, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < datetime('${req.query.start_date} 00:00:00')
                THEN CAST(
                  (COALESCE(p.views_from_store, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('${req.query.end_date} 23:59:59') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_store,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as mensagens
                WHEN p.created_at >= datetime('${req.query.start_date} 00:00:00')
                  AND p.created_at <= datetime('${req.query.end_date} 23:59:59')
                THEN COALESCE(p.total_messages, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < datetime('${req.query.start_date} 00:00:00')
                THEN CAST(
                  (COALESCE(p.total_messages, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('${req.query.end_date} 23:59:59') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as total_messages,
            -- Favoritos já são filtrados pela tabela user_favorites
            SUM(COALESCE(p.total_favorites, 0)) as total_favorites
          FROM products p
          WHERE p.store_id = ?
            AND p.created_at <= datetime('${req.query.end_date} 23:59:59')
        `).get(actualStoreId);
      } else {
        // PostgreSQL
        productsStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_products,
            -- Estimar visualizações baseado na proporção do período vs tempo de vida do produto
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= '${req.query.start_date} 00:00:00'::timestamp
                  AND p.created_at <= '${req.query.end_date} 23:59:59'::timestamp
                THEN COALESCE(p.total_views, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < '${req.query.start_date} 00:00:00'::timestamp
                THEN CAST(
                  (COALESCE(p.total_views, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM ('${req.query.end_date} 23:59:59'::timestamp - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as total_views,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= '${req.query.start_date} 00:00:00'::timestamp
                  AND p.created_at <= '${req.query.end_date} 23:59:59'::timestamp
                THEN COALESCE(p.views_from_marketplace, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < '${req.query.start_date} 00:00:00'::timestamp
                THEN CAST(
                  (COALESCE(p.views_from_marketplace, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM ('${req.query.end_date} 23:59:59'::timestamp - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_marketplace,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= '${req.query.start_date} 00:00:00'::timestamp
                  AND p.created_at <= '${req.query.end_date} 23:59:59'::timestamp
                THEN COALESCE(p.views_from_store, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < '${req.query.start_date} 00:00:00'::timestamp
                THEN CAST(
                  (COALESCE(p.views_from_store, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM ('${req.query.end_date} 23:59:59'::timestamp - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_store,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as mensagens
                WHEN p.created_at >= '${req.query.start_date} 00:00:00'::timestamp
                  AND p.created_at <= '${req.query.end_date} 23:59:59'::timestamp
                THEN COALESCE(p.total_messages, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < '${req.query.start_date} 00:00:00'::timestamp
                THEN CAST(
                  (COALESCE(p.total_messages, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM ('${req.query.end_date} 23:59:59'::timestamp - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as total_messages,
            -- Favoritos já são filtrados pela tabela user_favorites
            SUM(COALESCE(p.total_favorites, 0)) as total_favorites
          FROM products p
          WHERE p.store_id = $1
            AND p.created_at <= '${req.query.end_date} 23:59:59'::timestamp
        `).get(actualStoreId);
      }
    } else {
      // Período padrão: usar estimativa proporcional
      if (isSQLite()) {
        productsStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_products,
            -- Estimar visualizações baseado na proporção do período vs tempo de vida do produto
            SUM(
              CASE 
                WHEN p.created_at <= datetime('now', '-${periodDays} days')
                THEN CAST(
                  (COALESCE(p.total_views, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('now') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE COALESCE(p.total_views, 0)
              END
            ) as total_views,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= datetime('now', '-${periodDays} days')
                THEN COALESCE(p.views_from_marketplace, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < datetime('now', '-${periodDays} days')
                THEN CAST(
                  (COALESCE(p.views_from_marketplace, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('now') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_marketplace,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= datetime('now', '-${periodDays} days')
                THEN COALESCE(p.views_from_store, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < datetime('now', '-${periodDays} days')
                THEN CAST(
                  (COALESCE(p.views_from_store, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('now') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_store,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as mensagens
                WHEN p.created_at >= datetime('now', '-${periodDays} days')
                THEN COALESCE(p.total_messages, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < datetime('now', '-${periodDays} days')
                THEN CAST(
                  (COALESCE(p.total_messages, 0) * ${periodDays}) / 
                  NULLIF(
                    CAST((julianday('now') - julianday(p.created_at)) AS INTEGER),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as total_messages,
            -- Favoritos já são filtrados pela tabela user_favorites
            SUM(COALESCE(p.total_favorites, 0)) as total_favorites
          FROM products p
          WHERE p.store_id = ?
        `).get(actualStoreId);
      } else {
        // PostgreSQL
        productsStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_products,
            -- Estimar visualizações baseado na proporção do período vs tempo de vida do produto
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN COALESCE(p.total_views, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN CAST(
                  (COALESCE(p.total_views, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as total_views,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN COALESCE(p.views_from_marketplace, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN CAST(
                  (COALESCE(p.views_from_marketplace, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_marketplace,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as visualizações
                WHEN p.created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN COALESCE(p.views_from_store, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN CAST(
                  (COALESCE(p.views_from_store, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as views_from_store,
            SUM(
              CASE 
                -- Produto criado dentro do período: usar todas as mensagens
                WHEN p.created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN COALESCE(p.total_messages, 0)
                -- Produto criado antes do período: estimar proporcionalmente
                WHEN p.created_at < CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
                THEN CAST(
                  (COALESCE(p.total_messages, 0) * ${periodDays}) / 
                  NULLIF(
                    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.created_at)),
                    0
                  ) AS INTEGER
                )
                ELSE 0
              END
            ) as total_messages,
            -- Favoritos já são filtrados pela tabela user_favorites
            SUM(COALESCE(p.total_favorites, 0)) as total_favorites
          FROM products p
          WHERE p.store_id = $1
        `).get(actualStoreId);
      }
    }
    
    // Estatísticas de carrinho (todos os tempos)
    const cartStatsAll = await db.prepare(`
      SELECT 
        COUNT(DISTINCT ci.id) as total_cart_additions,
        COUNT(DISTINCT ci.user_id) as unique_users_added,
        COUNT(DISTINCT ci.product_id) as unique_products_added,
        SUM(ci.quantity) as total_items_in_carts
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      WHERE p.store_id = ?
    `).get(actualStoreId);
    
    // Estatísticas de carrinho no período selecionado
    let cartStats;
    if (isSQLite()) {
      cartStats = await db.prepare(`
        SELECT 
          COUNT(DISTINCT ci.id) as total_cart_additions,
          COUNT(DISTINCT ci.user_id) as unique_users_added,
          COUNT(DISTINCT ci.product_id) as unique_products_added,
          SUM(ci.quantity) as total_items_in_carts
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE p.store_id = ? 
          AND ci.created_at >= datetime('now', '-${periodDays} days')
      `).get(actualStoreId);
    } else {
      cartStats = await db.prepare(`
        SELECT 
          COUNT(DISTINCT ci.id) as total_cart_additions,
          COUNT(DISTINCT ci.user_id) as unique_users_added,
          COUNT(DISTINCT ci.product_id) as unique_products_added,
          SUM(ci.quantity) as total_items_in_carts
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE p.store_id = $1 
          AND ci.created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
      `).get(actualStoreId);
    }
    
    // Estatísticas de favoritos no período selecionado
    let favoritesStats;
    if (isSQLite()) {
      if (req.query.start_date && req.query.end_date) {
        favoritesStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_favorites,
            COUNT(DISTINCT uf.user_id) as unique_users,
            COUNT(DISTINCT uf.product_id) as unique_products
          FROM user_favorites uf
          INNER JOIN products p ON uf.product_id = p.id
          WHERE p.store_id = ? 
            AND uf.created_at >= datetime('${req.query.start_date} 00:00:00')
            AND uf.created_at <= datetime('${req.query.end_date} 23:59:59')
        `).get(actualStoreId);
      } else {
        favoritesStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_favorites,
            COUNT(DISTINCT uf.user_id) as unique_users,
            COUNT(DISTINCT uf.product_id) as unique_products
          FROM user_favorites uf
          INNER JOIN products p ON uf.product_id = p.id
          WHERE p.store_id = ? 
            AND uf.created_at >= datetime('now', '-${periodDays} days')
        `).get(actualStoreId);
      }
    } else {
      if (req.query.start_date && req.query.end_date) {
        favoritesStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_favorites,
            COUNT(DISTINCT uf.user_id) as unique_users,
            COUNT(DISTINCT uf.product_id) as unique_products
          FROM user_favorites uf
          INNER JOIN products p ON uf.product_id = p.id
          WHERE p.store_id = $1 
            AND uf.created_at >= '${req.query.start_date} 00:00:00'::timestamp
            AND uf.created_at <= '${req.query.end_date} 23:59:59'::timestamp
        `).get(actualStoreId);
      } else {
        favoritesStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_favorites,
            COUNT(DISTINCT uf.user_id) as unique_users,
            COUNT(DISTINCT uf.product_id) as unique_products
          FROM user_favorites uf
          INNER JOIN products p ON uf.product_id = p.id
          WHERE p.store_id = $1 
            AND uf.created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
        `).get(actualStoreId);
      }
    }
    
    // Produtos mais adicionados ao carrinho no período selecionado
    let topCartProducts;
    if (isSQLite()) {
      if (req.query.start_date && req.query.end_date) {
        topCartProducts = await db.prepare(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p.images,
            COUNT(ci.id) as cart_additions,
            SUM(ci.quantity) as total_quantity_in_carts
          FROM products p
          LEFT JOIN cart_items ci ON p.id = ci.product_id 
            AND ci.created_at >= datetime('${req.query.start_date} 00:00:00')
            AND ci.created_at <= datetime('${req.query.end_date} 23:59:59')
          WHERE p.store_id = ?
          GROUP BY p.id, p.name, p.price, p.images
          ORDER BY cart_additions DESC, total_quantity_in_carts DESC
          LIMIT 10
        `).all(actualStoreId);
      } else {
        topCartProducts = await db.prepare(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p.images,
            COUNT(ci.id) as cart_additions,
            SUM(ci.quantity) as total_quantity_in_carts
          FROM products p
          LEFT JOIN cart_items ci ON p.id = ci.product_id 
            AND ci.created_at >= datetime('now', '-${periodDays} days')
          WHERE p.store_id = ?
          GROUP BY p.id, p.name, p.price, p.images
          ORDER BY cart_additions DESC, total_quantity_in_carts DESC
          LIMIT 10
        `).all(actualStoreId);
      }
    } else {
      if (req.query.start_date && req.query.end_date) {
        topCartProducts = await db.prepare(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p.images,
            COUNT(ci.id) as cart_additions,
            SUM(ci.quantity) as total_quantity_in_carts
          FROM products p
          LEFT JOIN cart_items ci ON p.id = ci.product_id 
            AND ci.created_at >= '${req.query.start_date} 00:00:00'::timestamp
            AND ci.created_at <= '${req.query.end_date} 23:59:59'::timestamp
          WHERE p.store_id = $1
          GROUP BY p.id, p.name, p.price, p.images
          ORDER BY cart_additions DESC, total_quantity_in_carts DESC
          LIMIT 10
        `).all(actualStoreId);
      } else {
        topCartProducts = await db.prepare(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p.images,
            COUNT(ci.id) as cart_additions,
            SUM(ci.quantity) as total_quantity_in_carts
          FROM products p
          LEFT JOIN cart_items ci ON p.id = ci.product_id 
            AND ci.created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
          WHERE p.store_id = $1
          GROUP BY p.id, p.name, p.price, p.images
          ORDER BY cart_additions DESC, total_quantity_in_carts DESC
          LIMIT 10
        `).all(actualStoreId);
      }
    }
    
    // Estatísticas de pedidos (todos os tempos)
    const ordersStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(COALESCE(total_amount, 0)) as total_revenue,
        -- Receita já paga
        SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(total_amount, 0) ELSE 0 END) as paid_revenue,
        -- Receita a receber (pendente)
        SUM(CASE WHEN payment_status = 'pending' THEN COALESCE(total_amount, 0) ELSE 0 END) as pending_revenue
      FROM orders
      WHERE store_id = ?
    `).get(actualStoreId);
    
    // Estatísticas de pedidos no período selecionado
    let periodOrdersStats;
    if (isSQLite()) {
      if (req.query.start_date && req.query.end_date) {
        periodOrdersStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
            SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(total_amount, 0) ELSE 0 END) as paid_revenue,
            SUM(CASE WHEN payment_status = 'pending' THEN COALESCE(total_amount, 0) ELSE 0 END) as pending_revenue
          FROM orders
          WHERE store_id = ? 
            AND created_at >= datetime('${req.query.start_date} 00:00:00')
            AND created_at <= datetime('${req.query.end_date} 23:59:59')
        `).get(actualStoreId);
      } else {
        periodOrdersStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
            SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(total_amount, 0) ELSE 0 END) as paid_revenue,
            SUM(CASE WHEN payment_status = 'pending' THEN COALESCE(total_amount, 0) ELSE 0 END) as pending_revenue
          FROM orders
          WHERE store_id = ? 
            AND created_at >= datetime('now', '-${periodDays} days')
        `).get(actualStoreId);
      }
    } else {
      if (req.query.start_date && req.query.end_date) {
        periodOrdersStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
            SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(total_amount, 0) ELSE 0 END) as paid_revenue,
            SUM(CASE WHEN payment_status = 'pending' THEN COALESCE(total_amount, 0) ELSE 0 END) as pending_revenue
          FROM orders
          WHERE store_id = $1 
            AND created_at >= '${req.query.start_date} 00:00:00'::timestamp
            AND created_at <= '${req.query.end_date} 23:59:59'::timestamp
        `).get(actualStoreId);
      } else {
        periodOrdersStats = await db.prepare(`
          SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
            SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(total_amount, 0) ELSE 0 END) as paid_revenue,
            SUM(CASE WHEN payment_status = 'pending' THEN COALESCE(total_amount, 0) ELSE 0 END) as pending_revenue
          FROM orders
          WHERE store_id = $1 
            AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${periodDays} days'
        `).get(actualStoreId);
      }
    }
    
    // Estatísticas por período (carrinho) - usar período selecionado
    let periodStats;
    try {
      if (isSQLite()) {
        if (req.query.start_date && req.query.end_date) {
          periodStats = await db.prepare(`
            SELECT 
              DATE(ci.created_at) as date,
              COUNT(DISTINCT ci.id) as cart_additions,
              COUNT(DISTINCT ci.user_id) as unique_users
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.id
            WHERE p.store_id = ? 
              AND ci.created_at >= datetime('${req.query.start_date} 00:00:00')
              AND ci.created_at <= datetime('${req.query.end_date} 23:59:59')
            GROUP BY DATE(ci.created_at)
            ORDER BY date DESC
          `).all(actualStoreId);
        } else {
          periodStats = await db.prepare(`
            SELECT 
              DATE(ci.created_at) as date,
              COUNT(DISTINCT ci.id) as cart_additions,
              COUNT(DISTINCT ci.user_id) as unique_users
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.id
            WHERE p.store_id = ? 
              AND ci.created_at >= ${periodFilter}
            GROUP BY DATE(ci.created_at)
            ORDER BY date DESC
          `).all(actualStoreId);
        }
      } else {
        // PostgreSQL
        if (req.query.start_date && req.query.end_date) {
          periodStats = await db.prepare(`
            SELECT 
              DATE(ci.created_at) as date,
              COUNT(DISTINCT ci.id) as cart_additions,
              COUNT(DISTINCT ci.user_id) as unique_users
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.id
            WHERE p.store_id = $1 
              AND ci.created_at >= '${req.query.start_date} 00:00:00'::timestamp
              AND ci.created_at <= '${req.query.end_date} 23:59:59'::timestamp
            GROUP BY DATE(ci.created_at)
            ORDER BY date DESC
          `).all(actualStoreId);
        } else {
          periodStats = await db.prepare(`
            SELECT 
              DATE(ci.created_at) as date,
              COUNT(DISTINCT ci.id) as cart_additions,
              COUNT(DISTINCT ci.user_id) as unique_users
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.id
            WHERE p.store_id = $1 
              AND ci.created_at >= ${periodFilter}
            GROUP BY DATE(ci.created_at)
            ORDER BY date DESC
          `).all(actualStoreId);
        }
      }
    } catch (periodError) {
      console.error('Erro ao buscar estatísticas por período:', periodError);
      periodStats = [];
    }
    
    // Calcular taxa de conversão (visualizações vs adições ao carrinho no período)
    // Nota: visualizações são contadores totais, não filtrados por período
    const totalViews = Number(productsStats.total_views || 0);
    const totalCartAdditions = Number(cartStats.total_cart_additions || 0);
    const conversionRate = totalViews > 0 
      ? ((totalCartAdditions / totalViews) * 100).toFixed(2)
      : 0;
    
    // Parse imagens dos produtos
    const topCartProductsFormatted = topCartProducts.map(product => ({
      ...product,
      images: product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : []
    }));
    
    res.json({
      products: {
        total: Number(productsStats.total_products || 0),
        total_views: Number(productsStats.total_views || 0),
        views_from_marketplace: Number(productsStats.views_from_marketplace || 0),
        views_from_store: Number(productsStats.views_from_store || 0),
        total_messages: Number(productsStats.total_messages || 0),
        total_favorites: Number(productsStats.total_favorites || 0)
      },
      cart: {
        total_additions: Number(cartStats.total_cart_additions || 0),
        unique_users: Number(cartStats.unique_users_added || 0),
        unique_products: Number(cartStats.unique_products_added || 0),
        total_items: Number(cartStats.total_items_in_carts || 0)
      },
      cart_all_time: {
        total_additions: Number(cartStatsAll.total_cart_additions || 0),
        unique_users: Number(cartStatsAll.unique_users_added || 0),
        unique_products: Number(cartStatsAll.unique_products_added || 0),
        total_items: Number(cartStatsAll.total_items_in_carts || 0)
      },
      favorites: {
        total: Number(favoritesStats.total_favorites || 0),
        unique_users: Number(favoritesStats.unique_users || 0),
        unique_products: Number(favoritesStats.unique_products || 0)
      },
      orders: {
        total: Number(ordersStats.total_orders || 0),
        pending: Number(ordersStats.pending_orders || 0),
        delivered: Number(ordersStats.delivered_orders || 0),
        cancelled: Number(ordersStats.cancelled_orders || 0),
        total_revenue: Number(ordersStats.total_revenue || 0),
        paid_revenue: Number(ordersStats.paid_revenue || 0),
        pending_revenue: Number(ordersStats.pending_revenue || 0)
      },
      period_orders: {
        total: Number(periodOrdersStats.total_orders || 0),
        delivered: Number(periodOrdersStats.delivered_orders || 0),
        paid_revenue: Number(periodOrdersStats.paid_revenue || 0),
        pending_revenue: Number(periodOrdersStats.pending_revenue || 0)
      },
      period_days: periodDays,
      conversion: {
        views_to_cart_rate: parseFloat(conversionRate),
        views: totalViews,
        cart_additions: totalCartAdditions
      },
      top_cart_products: topCartProductsFormatted,
      period_stats: periodStats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas da loja:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas da loja', details: error.message });
  }
});

export default router;

