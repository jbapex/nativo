import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar cidades
router.get('/', optionalAuth, (req, res) => {
  try {
    let query = 'SELECT * FROM cities WHERE 1=1';
    const params = [];

    if (req.query.active !== undefined) {
      query += ' AND active = ?';
      params.push(req.query.active === 'true' ? 1 : 0);
    } else {
      query += ' AND active = 1';
    }

    query += ' ORDER BY name ASC';

    const cities = db.prepare(query).all(...params);
    res.json(cities);
  } catch (error) {
    console.error('Erro ao listar cidades:', error);
    res.status(500).json({ error: 'Erro ao listar cidades' });
  }
});

// Obter cidade por ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    
    if (!city) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    res.json(city);
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    res.status(500).json({ error: 'Erro ao buscar cidade' });
  }
});

// Criar cidade (admin apenas)
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, state, active, is_imported } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO cities (id, name, state, active, is_imported)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      state || '',
      active !== undefined ? (active ? 1 : 0) : 1,
      is_imported !== undefined ? (is_imported ? 1 : 0) : 0
    );

    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(id);
    res.status(201).json(city);
  } catch (error) {
    console.error('Erro ao criar cidade:', error);
    res.status(500).json({ error: 'Erro ao criar cidade' });
  }
});

// Atualizar cidade (admin apenas)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    
    if (!city) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    const { name, state, active } = req.body;
    
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (state !== undefined) { updates.push('state = ?'); values.push(state); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }

    values.push(req.params.id);

    db.prepare(`
      UPDATE cities 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updated = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar cidade' });
  }
});

// Deletar todas as cidades importadas (admin apenas)
// IMPORTANTE: Esta rota deve vir ANTES da rota /:id para evitar conflito
router.delete('/imported/all', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM cities WHERE is_imported = 1').run();
    res.json({ 
      message: `${result.changes} cidade(s) importada(s) deletada(s) com sucesso`,
      deleted: result.changes
    });
  } catch (error) {
    console.error('Erro ao deletar cidades importadas:', error);
    res.status(500).json({ error: 'Erro ao deletar cidades importadas' });
  }
});

// Deletar cidade (admin apenas)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    
    if (!city) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    db.prepare('DELETE FROM cities WHERE id = ?').run(req.params.id);
    res.json({ message: 'Cidade deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cidade:', error);
    res.status(500).json({ error: 'Erro ao deletar cidade' });
  }
});

export default router;

