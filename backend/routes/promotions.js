import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Buscar promoções ativas de uma loja (público)
router.get('/store/:storeId/active', optionalAuth, (req, res) => {
  try {
    const { storeId } = req.params;
    const now = new Date().toISOString();
    
    const promotions = db.prepare(`
      SELECT p.*, 
             pr.name as product_name
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.store_id = ?
        AND p.active = 1
        AND p.start_date <= ?
        AND p.end_date >= ?
      ORDER BY p.created_at DESC
    `).all(storeId, now, now);
    
    res.json(promotions.map(promo => ({
      ...promo,
      active: promo.active === 1 || promo.active === true,
      show_timer: promo.show_timer === 1 || promo.show_timer === true,
      discount_value: promo.discount_value ? parseFloat(promo.discount_value) : null
    })));
  } catch (error) {
    console.error('Erro ao buscar promoções ativas:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções ativas' });
  }
});

// Buscar promoções ativas para um produto específico (público)
router.get('/product/:productId/active', optionalAuth, (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date().toISOString();
    
    // Buscar produto para obter store_id
    const product = db.prepare('SELECT store_id FROM products WHERE id = ?').get(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Buscar promoções: específicas do produto OU promoções gerais da loja (product_id NULL)
    const promotions = db.prepare(`
      SELECT p.*, 
             pr.name as product_name
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.store_id = ?
        AND p.active = 1
        AND p.start_date <= ?
        AND p.end_date >= ?
        AND (p.product_id = ? OR p.product_id IS NULL)
      ORDER BY p.created_at DESC
    `).all(product.store_id, now, now, productId);
    
    res.json(promotions.map(promo => ({
      ...promo,
      active: promo.active === 1 || promo.active === true,
      show_timer: promo.show_timer === 1 || promo.show_timer === true,
      discount_value: promo.discount_value ? parseFloat(promo.discount_value) : null
    })));
  } catch (error) {
    console.error('Erro ao buscar promoções do produto:', error);
    res.status(500).json({ error: 'Erro ao buscar promoções do produto' });
  }
});

// Listar promoções de uma loja (autenticado)
router.get('/', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  try {
    // Buscar loja do usuário
    const store = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Se for admin, pode buscar por store_id na query
    const storeId = req.user.role === 'admin' && req.query.store_id 
      ? req.query.store_id 
      : store.id;
    
    const promotions = db.prepare(`
      SELECT p.*, 
             pr.name as product_name
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.store_id = ?
      ORDER BY p.created_at DESC
    `).all(storeId);
    
    res.json(promotions.map(promo => ({
      ...promo,
      active: promo.active === 1 || promo.active === true,
      show_timer: promo.show_timer === 1 || promo.show_timer === true,
      discount_value: promo.discount_value ? parseFloat(promo.discount_value) : null
    })));
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({ error: 'Erro ao listar promoções' });
  }
});

// Obter uma promoção específica
router.get('/:id', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar loja do usuário
    const store = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    const promotion = db.prepare(`
      SELECT p.*, 
             pr.name as product_name
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.id = ? AND p.store_id = ?
    `).get(id, store.id);
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    
    res.json({
      ...promotion,
      active: promotion.active === 1 || promotion.active === true,
      show_timer: promotion.show_timer === 1 || promotion.show_timer === true,
      discount_value: promotion.discount_value ? parseFloat(promotion.discount_value) : null
    });
  } catch (error) {
    console.error('Erro ao buscar promoção:', error);
    res.status(500).json({ error: 'Erro ao buscar promoção' });
  }
});

// Criar promoção
router.post('/', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  try {
    const {
      title,
      description,
      discount_type,
      discount_value,
      product_id,
      start_date,
      end_date,
      active
    } = req.body;
    
    // Validações
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    if (!discount_type) {
      return res.status(400).json({ error: 'Tipo de desconto é obrigatório' });
    }
    
    if (discount_type !== 'free_shipping' && (!discount_value || discount_value <= 0)) {
      return res.status(400).json({ error: 'Valor do desconto é obrigatório' });
    }
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Datas de início e término são obrigatórias' });
    }
    
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'Data de término deve ser posterior à data de início' });
    }
    
    // Buscar loja do usuário
    const store = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Se for admin e tiver store_id no body, usar esse
    const storeId = req.user.role === 'admin' && req.body.store_id 
      ? req.body.store_id 
      : store.id;
    
    // Verificar se product_id existe (se fornecido)
    if (product_id && product_id !== 'all') {
      const product = db.prepare('SELECT id FROM products WHERE id = ? AND store_id = ?').get(product_id, storeId);
      if (!product) {
        return res.status(400).json({ error: 'Produto não encontrado' });
      }
    }
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO promotions (
        id, store_id, title, description, discount_type, discount_value,
        product_id, start_date, end_date, show_timer, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      show_timer !== undefined ? (show_timer ? 1 : 0) : 0,
      active !== undefined ? (active ? 1 : 0) : 1
    );
    
    const promotion = db.prepare(`
      SELECT p.*, 
             pr.name as product_name
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.id = ?
    `).get(id);
    
    res.status(201).json({
      ...promotion,
      active: promotion.active === 1 || promotion.active === true,
      discount_value: promotion.discount_value ? parseFloat(promotion.discount_value) : null
    });
  } catch (error) {
    console.error('Erro ao criar promoção:', error);
    res.status(500).json({ error: 'Erro ao criar promoção', details: error.message });
  }
});

// Atualizar promoção
router.put('/:id', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  try {
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
      active
    } = req.body;
    
    // Buscar loja do usuário
    const store = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Verificar se a promoção existe e pertence à loja
    const existing = db.prepare('SELECT * FROM promotions WHERE id = ? AND store_id = ?').get(id, store.id);
    
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
    if (product_id && product_id !== 'all' && product_id !== existing.product_id) {
      const product = db.prepare('SELECT id FROM products WHERE id = ? AND store_id = ?').get(product_id, store.id);
      if (!product) {
        return res.status(400).json({ error: 'Produto não encontrado' });
      }
    }
    
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
      show_timer !== undefined ? (show_timer ? 1 : 0) : existing.show_timer,
      active !== undefined ? (active ? 1 : 0) : existing.active,
      id,
      store.id
    );
    
    const promotion = db.prepare(`
      SELECT p.*, 
             pr.name as product_name
      FROM promotions p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.id = ?
    `).get(id);
    
    res.json({
      ...promotion,
      active: promotion.active === 1 || promotion.active === true,
      show_timer: promotion.show_timer === 1 || promotion.show_timer === true,
      discount_value: promotion.discount_value ? parseFloat(promotion.discount_value) : null
    });
  } catch (error) {
    console.error('Erro ao atualizar promoção:', error);
    res.status(500).json({ error: 'Erro ao atualizar promoção', details: error.message });
  }
});

// Deletar promoção
router.delete('/:id', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar loja do usuário
    const store = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ? AND store_id = ?').get(id, store.id);
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promoção não encontrada' });
    }
    
    db.prepare('DELETE FROM promotions WHERE id = ? AND store_id = ?').run(id, store.id);
    
    res.json({ message: 'Promoção deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar promoção:', error);
    res.status(500).json({ error: 'Erro ao deletar promoção' });
  }
});

export default router;

