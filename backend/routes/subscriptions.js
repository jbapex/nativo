import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar assinaturas
router.get('/', optionalAuth, (req, res) => {
  try {
    let query = `
      SELECT s.*, 
             st.name as store_name,
             p.name as plan_name,
             p.price as plan_price
      FROM subscriptions s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.status) {
      query += ' AND s.status = ?';
      params.push(req.query.status);
    }

    if (req.query.store_id) {
      query += ' AND s.store_id = ?';
      params.push(req.query.store_id);
    }

    query += ' ORDER BY s.created_at DESC';

    const subscriptions = db.prepare(query).all(...params);
    res.json(subscriptions);
  } catch (error) {
    console.error('Erro ao listar assinaturas:', error);
    res.status(500).json({ error: 'Erro ao listar assinaturas' });
  }
});

// Obter assinatura por ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const subscription = db.prepare(`
      SELECT s.*, 
             st.name as store_name,
             p.name as plan_name,
             p.price as plan_price
      FROM subscriptions s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
});

// Criar assinatura
router.post('/', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  try {
    const { store_id, plan_id } = req.body;

    if (!store_id || !plan_id) {
      return res.status(400).json({ error: 'store_id e plan_id são obrigatórios' });
    }

    // Verificar se já existe assinatura ativa - se existir, atualizar em vez de criar nova
    const existing = db.prepare('SELECT * FROM subscriptions WHERE store_id = ? AND status = ?').get(store_id, 'active');
    if (existing) {
      // Atualizar assinatura existente
      db.prepare(`
        UPDATE subscriptions 
        SET plan_id = ?
        WHERE id = ?
      `).run(plan_id, existing.id);
      
      const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(existing.id);
      return res.json(updated);
    }

    const id = uuidv4();
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan_id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    // Buscar user_id da loja (não usar req.user.id que pode ser do admin)
    const store = db.prepare('SELECT user_id FROM stores WHERE id = ?').get(store_id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    const userId = store.user_id;

    // Calcular data de término (30 dias)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    db.prepare(`
      INSERT INTO subscriptions (id, user_id, store_id, plan_id, status, start_date, end_date)
      VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, ?)
    `).run(
      id,
      userId,
      store_id,
      plan_id,
      endDate.toISOString()
    );

    const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura' });
  }
});

// Atualizar assinatura
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    const { status, end_date, plan_id } = req.body;
    
    const updates = [];
    const values = [];

    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date); }
    if (plan_id !== undefined) { updates.push('plan_id = ?'); values.push(plan_id); }

    values.push(req.params.id);

    db.prepare(`
      UPDATE subscriptions 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    res.status(500).json({ error: 'Erro ao atualizar assinatura' });
  }
});

// Deletar assinatura
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    db.prepare('DELETE FROM subscriptions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Assinatura deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar assinatura:', error);
    res.status(500).json({ error: 'Erro ao deletar assinatura' });
  }
});

export default router;

