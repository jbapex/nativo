import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { sanitizeBody } from '../middleware/validation.js';
import { sanitizeHTML } from '../utils/sanitize.js';
import { getPaginationParams, createPaginationResponse, applyPagination } from '../utils/pagination.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar lojas
router.get('/', optionalAuth, (req, res) => {
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

    query += ' ORDER BY s.created_at DESC';

    // Paginação
    const { page, limit, offset } = getPaginationParams(req.query, { defaultLimit: 20, maxLimit: 100 });
    
    // Contar total de registros
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = db.prepare(countQuery).get(...params);
    const total = countResult?.total || 0;
    
    // Aplicar paginação
    const paginatedQuery = applyPagination(query, limit, offset);
    params.push(limit, offset);

    const stores = db.prepare(paginatedQuery).all(...params);
    
    // Retornar com paginação
    const response = createPaginationResponse(stores, total, page, limit);
    res.json(response);
  } catch (error) {
    console.error('Erro ao listar lojas:', error);
    res.status(500).json({ error: 'Erro ao listar lojas' });
  }
});

// Obter loja por ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const store = db.prepare(`
      SELECT s.*, u.email, u.full_name, c.name as city_name, cat.name as category_name
      FROM stores s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN cities c ON s.city_id = c.id
      LEFT JOIN categories cat ON s.category_id = cat.id
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

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
    res.status(500).json({ error: 'Erro ao buscar loja' });
  }
});

// Criar loja (requer autenticação - permite user, store e admin)
router.post('/', authenticateToken, sanitizeBody, (req, res) => {
  try {
    const { name, description, logo, store_type, whatsapp, city_id, category_id, has_physical_store, plan_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Verificar se usuário já tem uma loja
    const existingStore = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    if (existingStore && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Você já possui uma loja cadastrada' });
    }

    const userId = req.user.role === 'admin' && req.body.user_id ? req.body.user_id : req.user.id;
    const id = uuidv4();

    db.prepare(`
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
      db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('store', userId);
    }

    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
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
router.put('/:id', authenticateToken, requireRole('store', 'admin'), sanitizeBody, (req, res) => {
  try {
    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta loja' });
    }

    const { 
      name, description, logo, store_type, whatsapp, city_id, category_id, 
      has_physical_store, plan_id, status, featured, checkout_enabled,
      // Campos de pagamento
      pix_key, payment_link, payment_instructions,
      // Campos do Mercado Pago
      mercadopago_access_token, mercadopago_public_key,
      // Campos de frete
      shipping_fixed_price, shipping_calculate_on_whatsapp, shipping_free_threshold
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
    if (logo !== undefined) { updates.push('logo = ?'); values.push(logo); }
    if (store_type !== undefined) { updates.push('store_type = ?'); values.push(store_type); }
    if (whatsapp !== undefined) { updates.push('whatsapp = ?'); values.push(whatsapp); }
    if (city_id !== undefined) { updates.push('city_id = ?'); values.push(city_id); }
    if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id); }
    if (has_physical_store !== undefined) { updates.push('has_physical_store = ?'); values.push(has_physical_store ? 1 : 0); }
    if (checkout_enabled !== undefined) { updates.push('checkout_enabled = ?'); values.push(checkout_enabled ? 1 : 0); }
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

    console.log('Atualizando loja com:', updates.join(', '));
    console.log('Valores:', values);

    db.prepare(`
      UPDATE stores 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    // Retornar loja atualizada com JOIN para incluir city_name
    const updated = db.prepare(`
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
    
    // Garantir que checkout_enabled seja boolean
    const response = {
      ...updated,
      checkout_enabled: updated.checkout_enabled === 1 || updated.checkout_enabled === true
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    res.status(500).json({ error: 'Erro ao atualizar loja' });
  }
});

// Deletar loja
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    db.prepare('DELETE FROM stores WHERE id = ?').run(req.params.id);
    res.json({ message: 'Loja deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar loja:', error);
    res.status(500).json({ error: 'Erro ao deletar loja' });
  }
});

// Configurar métodos de pagamento da loja
router.put('/:id/payment-methods', authenticateToken, requireRole('store', 'admin'), sanitizeBody, (req, res) => {
  try {
    const { id } = req.params;
    const { payment_methods, mercadopago_access_token, mercadopago_public_key } = req.body;

    // Verificar se a loja existe e pertence ao usuário (ou se é admin)
    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
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
    db.prepare(query).run(...params);

    // Buscar loja atualizada
    const updatedStore = db.prepare(`
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
router.get('/:id/payment-methods', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const store = db.prepare('SELECT payment_methods, mercadopago_access_token, mercadopago_public_key FROM stores WHERE id = ?').get(id);

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

export default router;

