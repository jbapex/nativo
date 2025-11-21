import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { sanitizeBody } from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar avaliações de um produto (público)
router.get('/product/:productId', optionalAuth, (req, res) => {
  try {
    const { productId } = req.params;
    
    const reviews = db.prepare(`
      SELECT r.*, 
             u.full_name as user_name,
             u.email as user_email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(productId);
    
    res.json(reviews);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// Obter média de avaliações de um produto
router.get('/product/:productId/average', optionalAuth, (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = db.prepare(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM reviews
      WHERE product_id = ?
    `).get(productId);
    
    res.json({
      total_reviews: result.total_reviews || 0,
      average_rating: result.average_rating ? parseFloat(result.average_rating).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Erro ao calcular média de avaliações:', error);
    res.status(500).json({ error: 'Erro ao calcular média' });
  }
});

// Criar avaliação (requer autenticação)
router.post('/', authenticateToken, sanitizeBody, (req, res) => {
  try {
    const { product_id, order_id, rating, comment } = req.body;
    
    if (!product_id || !rating) {
      return res.status(400).json({ error: 'Produto e avaliação são obrigatórios' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }
    
    // Verificar se já existe avaliação deste usuário para este produto
    const existingReview = db.prepare(`
      SELECT id FROM reviews 
      WHERE product_id = ? AND user_id = ?
    `).get(product_id, req.user.id);
    
    if (existingReview) {
      return res.status(400).json({ error: 'Você já avaliou este produto' });
    }
    
    // Verificar se o usuário comprou o produto (se order_id for fornecido)
    if (order_id) {
      const order = db.prepare(`
        SELECT oi.* FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ?
      `).get(order_id, req.user.id, product_id);
      
      if (!order) {
        return res.status(403).json({ error: 'Você não comprou este produto' });
      }
    }
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO reviews (id, product_id, user_id, order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, product_id, req.user.id, order_id || null, rating, comment || null);
    
    // Atualizar média de avaliações do produto (calcular e atualizar campo no produto se necessário)
    const review = db.prepare(`
      SELECT r.*, 
             u.full_name as user_name,
             u.email as user_email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(id);
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Atualizar avaliação (apenas o próprio usuário)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    
    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta avaliação' });
    }
    
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }
    
    const updates = [];
    const values = [];
    
    if (rating !== undefined) { updates.push('rating = ?'); values.push(rating); }
    if (comment !== undefined) { updates.push('comment = ?'); values.push(comment); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    
    db.prepare(`
      UPDATE reviews 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    const updated = db.prepare(`
      SELECT r.*, 
             u.full_name as user_name,
             u.email as user_email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(req.params.id);
    
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação' });
  }
});

// Deletar avaliação (apenas o próprio usuário ou admin)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para deletar esta avaliação' });
    }
    
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ message: 'Avaliação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({ error: 'Erro ao deletar avaliação' });
  }
});

export default router;

