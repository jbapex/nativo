import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { requireProductOwnership } from '../middleware/ownership.js';
import { validate, productSchema } from '../middleware/validation.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { getPaginationParams, createPaginationResponse, applyPagination } from '../utils/pagination.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar produtos (público, mas pode filtrar por usuário autenticado)
router.get('/', optionalAuth, (req, res) => {
  try {
    let query = 'SELECT p.*, s.name as store_name, c.name as category_name FROM products p';
    query += ' INNER JOIN stores s ON p.store_id = s.id';
    query += ' LEFT JOIN categories c ON p.category_id = c.id';
    query += ' WHERE p.active = 1';

    const params = [];

    // Se o usuário estiver autenticado e filtrando por sua própria loja, mostrar produtos mesmo se a loja não estiver aprovada
    let allowUnapprovedStore = false;
    if (req.user && req.query.store_id) {
      const userStore = db.prepare('SELECT id, user_id FROM stores WHERE id = ?').get(req.query.store_id);
      if (userStore && userStore.user_id === req.user.id) {
        allowUnapprovedStore = true;
      }
    }

    if (!allowUnapprovedStore) {
      query += ' AND s.status = ?';
      params.push('approved');
    }

    // Filtros
    if (req.query.category_id) {
      query += ' AND p.category_id = ?';
      params.push(req.query.category_id);
    }

    if (req.query.store_id) {
      query += ' AND p.store_id = ?';
      params.push(req.query.store_id);
    }

    if (req.query.city_id) {
      query += ' AND s.city_id = ?';
      params.push(req.query.city_id);
    }

    if (req.query.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Ordenação
    const orderBy = req.query.order_by || '-created_at';
    let orderColumn = orderBy.startsWith('-') ? orderBy.substring(1) : orderBy;
    
    // Mapear nomes de colunas do frontend para nomes do banco
    const columnMap = {
      'created_date': 'created_at',
      'updated_date': 'updated_at'
    };
    
    // Usar o nome mapeado ou o nome original se não houver mapeamento
    const dbColumn = columnMap[orderColumn] || orderColumn;
    
    // Validar se a coluna existe (prevenir SQL injection)
    const allowedColumns = ['created_at', 'updated_at', 'name', 'price', 'active'];
    if (!allowedColumns.includes(dbColumn)) {
      // Se a coluna não for permitida, usar created_at como padrão
      orderColumn = 'created_at';
    } else {
      orderColumn = dbColumn;
    }
    
    if (orderBy.startsWith('-')) {
      query += ` ORDER BY p.${orderColumn} DESC`;
    } else {
      query += ` ORDER BY p.${orderColumn} ASC`;
    }

    // Paginação
    const { page, limit, offset } = getPaginationParams(req.query, { defaultLimit: 20, maxLimit: 100 });
    
    // Contar total de registros (para paginação) - criar query de contagem separada
    const countQuery = query
      .replace(/SELECT p\.\*, s\.name as store_name, c\.name as category_name FROM/, 'SELECT COUNT(*) as total FROM')
      .replace(/ORDER BY.*$/, ''); // Remover ORDER BY da query de contagem
    const countResult = db.prepare(countQuery).get(...params);
    const total = countResult?.total || 0;
    
    // Aplicar paginação
    query = applyPagination(query, limit, offset);
    params.push(limit, offset);

    console.log('Query SQL:', query);
    console.log('Params:', params);
    console.log('Paginação:', { page, limit, offset, total });
    
    const products = db.prepare(query).all(...params);
    console.log(`Produtos encontrados no banco: ${products.length}`);

    // Parse JSON fields com tratamento de erro melhorado
    const formatted = products.map(p => {
      let images = [];
      let tags = [];
      
      try {
        images = p.images ? JSON.parse(p.images) : [];
      } catch (parseError) {
        console.error('Erro ao fazer parse das imagens do produto:', p.id, parseError);
        // Se não conseguir fazer parse, tentar usar como string ou array vazio
        if (typeof p.images === 'string' && p.images.trim()) {
          images = [p.images];
        } else {
          images = [];
        }
      }
      
      try {
        tags = p.tags ? JSON.parse(p.tags) : [];
      } catch (parseError) {
        console.error('Erro ao fazer parse das tags do produto:', p.id, parseError);
        tags = [];
      }
      
      return {
        ...p,
        images: images,
        tags: tags,
        active: p.active === 1 || p.active === true,
        category_id: p.category_id || null // Garantir que category_id está presente
      };
    });

    console.log(`Produtos formatados: ${formatted.length}`);
    
    // Retornar com paginação
    const response = createPaginationResponse(formatted, total, page, limit);
    res.json(response);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao listar produtos', details: error.message });
  }
});

// Obter produto por ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    // Verificar se o usuário está autenticado e se está buscando produto da sua própria loja
    let allowUnapprovedStore = false;
    if (req.user) {
      const productCheck = db.prepare('SELECT store_id FROM products WHERE id = ?').get(req.params.id);
      if (productCheck) {
        const userStore = db.prepare('SELECT id, user_id FROM stores WHERE id = ?').get(productCheck.store_id);
        if (userStore && userStore.user_id === req.user.id) {
          allowUnapprovedStore = true;
        }
      }
    }

    let query = `
      SELECT p.*, s.name as store_name, s.logo as store_logo, s.status as store_status, c.name as category_name
      FROM products p
      LEFT JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    
    // Se não for o dono da loja, só mostrar se a loja estiver aprovada
    if (!allowUnapprovedStore) {
      query += ' AND (s.status = ? OR s.status IS NULL)';
    }
    
    const params = [req.params.id];
    if (!allowUnapprovedStore) {
      params.push('approved');
    }
    
    const product = db.prepare(query).get(...params);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Parse JSON fields com tratamento de erro
    let images = [];
    let tags = [];
    
    try {
      images = product.images ? JSON.parse(product.images) : [];
    } catch (parseError) {
      console.error('Erro ao fazer parse das imagens do produto:', parseError);
      // Se não conseguir fazer parse, tentar usar como string ou array vazio
      if (typeof product.images === 'string' && product.images.trim()) {
        images = [product.images];
      } else {
        images = [];
      }
    }
    
    try {
      tags = product.tags ? JSON.parse(product.tags) : [];
    } catch (parseError) {
      console.error('Erro ao fazer parse das tags do produto:', parseError);
      tags = [];
    }

    const formatted = {
      ...product,
      images: images,
      tags: tags,
      category_id: product.category_id || null // Garantir que category_id está presente
    };

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro ao buscar produto', details: error.message });
  }
});

// Criar produto (requer autenticação)
router.post('/', authenticateToken, validate(productSchema), async (req, res) => {
  try {
    // Debug: verificar usuário autenticado
    console.log('POST /products - Usuário autenticado:', {
      id: req.user?.id,
      role: req.user?.role,
      email: req.user?.email
    });

    // Verificar se é admin ou tem loja (permite role 'store' ou usuário com loja cadastrada)
    let hasPermission = false;
    let store = null;
    
    console.log('=== INÍCIO VERIFICAÇÃO DE PERMISSÃO ===');
    console.log('Usuário:', { id: req.user.id, role: req.user.role, email: req.user.email });
    
    if (req.user.role === 'admin' || req.user.role === 'store') {
      hasPermission = true;
      console.log('✅ Permissão concedida: role no token é', req.user.role);
    } else {
      // Verificar se o usuário tem uma loja cadastrada (mesmo que o role no token seja 'customer')
      store = db.prepare('SELECT id, name, status, plan_id FROM stores WHERE user_id = ?').get(req.user.id);
      console.log('🔍 Verificando loja do usuário:', store ? { id: store.id, name: store.name, status: store.status, plan_id: store.plan_id } : '❌ Nenhuma loja encontrada');
      
      if (store) {
        hasPermission = true;
        console.log('✅ Loja encontrada - permissão concedida');
        // Se tem loja mas o role no token está desatualizado, atualizar no banco
        const userInDb = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
        console.log('📋 Role no banco de dados:', userInDb?.role);
        if (userInDb && userInDb.role !== 'store' && userInDb.role !== 'admin') {
          db.prepare('UPDATE users SET role = ? WHERE id = ?').run('store', req.user.id);
          console.log('🔄 Role do usuário atualizado de', userInDb.role, 'para store');
        }
      } else {
        console.log('❌ Usuário sem loja e sem role store/admin - acesso negado');
        return res.status(403).json({ 
          error: 'Você não possui uma loja cadastrada. Cadastre uma loja primeiro para poder adicionar produtos.' 
        });
      }
    }
    
    if (!hasPermission) {
      console.log('❌ Acesso negado: sem permissão');
      return res.status(403).json({ 
        error: 'Você não tem permissão para criar produtos. Certifique-se de ter uma loja cadastrada.' 
      });
    }
    
    console.log('=== FIM VERIFICAÇÃO DE PERMISSÃO ===');

    const { name, description, price, images, category_id, tags, stock } = req.body;

    // Validações
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do produto é obrigatório' });
    }

    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Preço válido é obrigatório' });
    }

    // Buscar loja do usuário (pode ser aprovada ou pendente) se ainda não foi buscada
    if (!store) {
      store = db.prepare('SELECT * FROM stores WHERE user_id = ?').get(req.user.id);
      console.log('🔍 Loja buscada novamente:', store ? { id: store.id, name: store.name, status: store.status, plan_id: store.plan_id } : 'Nenhuma loja encontrada');
    }
    
    console.log('📦 Loja encontrada para criar produto:', store ? { id: store.id, name: store.name, status: store.status, plan_id: store.plan_id } : 'Nenhuma loja encontrada');
    
    if (!store && req.user.role !== 'admin') {
      console.log('❌ Erro: Loja não encontrada e usuário não é admin');
      return res.status(403).json({ error: 'Você não possui uma loja cadastrada. Cadastre uma loja primeiro.' });
    }

    // Se não for admin, usar a loja do usuário
    const storeId = req.user.role === 'admin' && req.body.store_id ? req.body.store_id : (store ? store.id : null);
    
    if (!storeId && req.user.role !== 'admin') {
      console.log('❌ Erro: storeId não definido');
      return res.status(403).json({ error: 'Erro ao identificar a loja. Tente novamente.' });
    }
    
    console.log('🏪 Store ID para criar produto:', storeId);
    
    // Verificar limite de produtos do plano (apenas para não-admin)
    if (req.user.role !== 'admin') {
      console.log('=== INÍCIO VERIFICAÇÃO DE LIMITE ===');
      console.log('Store ID:', storeId);
      
      // Buscar assinatura ativa da loja
      const activeSubscription = db.prepare(`
        SELECT s.*, p.product_limit 
        FROM subscriptions s
        LEFT JOIN plans p ON s.plan_id = p.id
        WHERE s.store_id = ? AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1
      `).get(storeId);
      
      console.log('Assinatura ativa:', activeSubscription ? { id: activeSubscription.id, plan_id: activeSubscription.plan_id, product_limit: activeSubscription.product_limit } : 'Nenhuma assinatura ativa');
      
      // Se não tiver assinatura ativa, verificar se tem plan_id direto na loja
      let productLimit = 3; // Limite padrão
      let limitSource = 'padrão (3)';
      
      if (activeSubscription && activeSubscription.product_limit !== null) {
        productLimit = activeSubscription.product_limit;
        limitSource = `assinatura (${activeSubscription.plan_id})`;
      } else if (store && store.plan_id) {
        const plan = db.prepare('SELECT product_limit FROM plans WHERE id = ?').get(store.plan_id);
        console.log('Plano da loja:', plan ? { id: store.plan_id, product_limit: plan.product_limit } : 'Plano não encontrado');
        if (plan && plan.product_limit !== null) {
          productLimit = plan.product_limit;
          limitSource = `plano da loja (${store.plan_id})`;
        }
      }
      
      // Contar produtos atuais da loja
      const currentProductsCount = db.prepare(`
        SELECT COUNT(*) as count FROM products WHERE store_id = ?
      `).get(storeId);
      
      const productCount = currentProductsCount?.count || 0;
      
      console.log('📊 Verificação de limite:', {
        storeId,
        productLimit,
        productCount,
        limitSource,
        canCreate: productCount < productLimit
      });
      
      if (productCount >= productLimit) {
        console.log('❌ Limite atingido!');
        return res.status(403).json({ 
          error: `Você atingiu o limite de ${productLimit} produtos do seu plano atual. Faça upgrade do seu plano para adicionar mais produtos.`,
          limit: productLimit,
          current: productCount
        });
      }
      
      console.log('✅ Limite OK - pode criar produto');
      console.log('=== FIM VERIFICAÇÃO DE LIMITE ===');
    }
    
    const id = uuidv4();

    // Validar category_id se fornecido
    if (category_id) {
      const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
      if (!category) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
    }

    // Sanitizar descrição para prevenir XSS
    const sanitizedDescription = description ? sanitizeHTML(description.trim()) : '';

    db.prepare(`
      INSERT INTO products (id, store_id, category_id, name, description, price, images, tags, stock, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      storeId,
      category_id || null,
      name.trim(),
      sanitizedDescription,
      price,
      images ? JSON.stringify(images) : '[]',
      tags ? JSON.stringify(tags) : '[]',
      stock || null
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    const formatted = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      tags: product.tags ? JSON.parse(product.tags) : [],
      category_id: product.category_id || null // Garantir que category_id está presente
    };

    res.status(201).json(formatted);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    
    // Mensagens de erro mais específicas
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({ error: 'Loja ou categoria inválida' });
    }
    
    res.status(500).json({ error: error.message || 'Erro ao criar produto' });
  }
});

// Atualizar produto
router.put('/:id', authenticateToken, requireProductOwnership, validate(productSchema.partial()), (req, res) => {
  try {
    // Verificar se o produto existe
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const { 
      name, description, price, images, category_id, tags, stock, active,
      total_views, views_from_marketplace, views_from_store,
      total_messages, total_favorites, whatsapp, status, compare_price
    } = req.body;
    
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { 
      // Sanitizar descrição para prevenir XSS
      const sanitizedDescription = description ? sanitizeHTML(description.trim()) : '';
      updates.push('description = ?'); 
      values.push(sanitizedDescription); 
    }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (compare_price !== undefined) { updates.push('compare_price = ?'); values.push(compare_price); }
    if (images !== undefined) { updates.push('images = ?'); values.push(JSON.stringify(images)); }
    if (category_id !== undefined) { 
      updates.push('category_id = ?'); 
      values.push(category_id || null); // Permitir null para remover categoria
    }
    if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (whatsapp !== undefined) { updates.push('whatsapp = ?'); values.push(whatsapp); }
    if (total_views !== undefined) { updates.push('total_views = ?'); values.push(total_views); }
    if (views_from_marketplace !== undefined) { updates.push('views_from_marketplace = ?'); values.push(views_from_marketplace); }
    if (views_from_store !== undefined) { updates.push('views_from_store = ?'); values.push(views_from_store); }
    if (total_messages !== undefined) { updates.push('total_messages = ?'); values.push(total_messages); }
    if (total_favorites !== undefined) { updates.push('total_favorites = ?'); values.push(total_favorites); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    const formatted = {
      ...updated,
      images: updated.images ? JSON.parse(updated.images) : [],
      tags: updated.tags ? JSON.parse(updated.tags) : [],
      category_id: updated.category_id || null // Garantir que category_id está presente
    };

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Incrementar métricas (público - não requer autenticação)
router.patch('/:id/metrics', optionalAuth, (req, res) => {
  try {
    const productId = req.params.id;
    const { metricType, viewSource } = req.body;
    
    // Verificar se o produto existe
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Obter métricas atuais
    const currentMetrics = {
      total_views: Number(product.total_views || 0),
      views_from_marketplace: Number(product.views_from_marketplace || 0),
      views_from_store: Number(product.views_from_store || 0),
      total_messages: Number(product.total_messages || 0),
      total_favorites: Number(product.total_favorites || 0)
    };

    let updatedMetrics = { ...currentMetrics };

    // Incrementar métrica específica
    if (metricType === 'view') {
      if (viewSource === 'store') {
        updatedMetrics.views_from_store = currentMetrics.views_from_store + 1;
      } else {
        updatedMetrics.views_from_marketplace = currentMetrics.views_from_marketplace + 1;
      }
      // Atualizar total_views como soma dos dois
      updatedMetrics.total_views = updatedMetrics.views_from_marketplace + updatedMetrics.views_from_store;
    } else if (metricType === 'message') {
      updatedMetrics.total_messages = currentMetrics.total_messages + 1;
    } else if (metricType === 'favorite') {
      updatedMetrics.total_favorites = currentMetrics.total_favorites + 1;
    } else {
      return res.status(400).json({ error: 'Tipo de métrica inválido' });
    }

    // Atualizar no banco de dados
    db.prepare(`
      UPDATE products 
      SET 
        total_views = ?,
        views_from_marketplace = ?,
        views_from_store = ?,
        total_messages = ?,
        total_favorites = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updatedMetrics.total_views,
      updatedMetrics.views_from_marketplace,
      updatedMetrics.views_from_store,
      updatedMetrics.total_messages,
      updatedMetrics.total_favorites,
      productId
    );

    res.json({
      success: true,
      metrics: updatedMetrics
    });
  } catch (error) {
    console.error('Erro ao incrementar métrica:', error);
    res.status(500).json({ error: 'Erro ao incrementar métrica' });
  }
});

// Deletar produto
router.delete('/:id', authenticateToken, requireProductOwnership, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

export default router;

