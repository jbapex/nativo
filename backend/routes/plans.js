import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar planos
router.get('/', optionalAuth, (req, res) => {
  try {
    let query = 'SELECT * FROM plans WHERE 1=1';
    const params = [];

    if (req.query.active !== undefined) {
      query += ' AND active = ?';
      params.push(req.query.active === 'true' ? 1 : 0);
    } else {
      query += ' AND active = 1';
    }

    query += ' ORDER BY price ASC';

    const plans = db.prepare(query).all(...params);
    
    // Parse JSON fields
    const formatted = plans.map(p => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
});

// Obter plano por ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const formatted = {
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : []
    };

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    res.status(500).json({ error: 'Erro ao buscar plano' });
  }
});

// Criar plano (admin apenas)
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, slug, price, product_limit, features, active } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const id = uuidv4();
    const planSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    db.prepare(`
      INSERT INTO plans (id, name, slug, price, product_limit, features, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      planSlug,
      price,
      product_limit || null,
      features ? JSON.stringify(features) : '[]',
      active !== undefined ? (active ? 1 : 0) : 1
    );

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
    const formatted = {
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : []
    };

    res.status(201).json(formatted);
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    res.status(500).json({ error: 'Erro ao criar plano' });
  }
});

// Atualizar plano (admin apenas)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const { name, slug, price, product_limit, features, active } = req.body;
    
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (product_limit !== undefined) { updates.push('product_limit = ?'); values.push(product_limit); }
    if (features !== undefined) { updates.push('features = ?'); values.push(JSON.stringify(features)); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }

    values.push(req.params.id);

    db.prepare(`
      UPDATE plans 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updated = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
    const formatted = {
      ...updated,
      features: updated.features ? JSON.parse(updated.features) : []
    };

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

// Deletar plano (admin apenas)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    db.prepare('DELETE FROM plans WHERE id = ?').run(req.params.id);
    res.json({ message: 'Plano deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar plano:', error);
    res.status(500).json({ error: 'Erro ao deletar plano' });
  }
});

export default router;

