import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { sanitizeBody } from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar categorias (público)
router.get('/', optionalAuth, async (req, res) => {
  try {
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];

    // Se store_id for fornecido, mostrar categorias globais + categorias da loja
    if (req.query.store_id) {
      query += ' AND (store_id IS NULL OR store_id = ?)';
      params.push(req.query.store_id);
    } else {
      // Por padrão, mostrar apenas categorias globais se não especificar loja
      query += ' AND store_id IS NULL';
    }

    if (req.query.active !== undefined) {
      query += ' AND active = ?';
      params.push(req.query.active === 'true' ? true : false);
    } else {
      query += ' AND active = true';
    }

    query += ' ORDER BY store_id IS NULL DESC, order_index ASC, name ASC';

    const categories = await db.prepare(query).all(...params);
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Obter categoria por ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da categoria é obrigatório' });
    }

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json(category);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
});

// Criar categoria (admin ou lojista)
router.post('/', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const { name, slug, description, icon, active, order_index, store_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Se for lojista, só pode criar categoria para sua própria loja
    let finalStoreId = store_id || null;
    if (req.user.role === 'store') {
      // Buscar loja do usuário
      const userStore = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
      if (!userStore) {
        return res.status(403).json({ error: 'Você precisa ter uma loja cadastrada para criar categorias' });
      }
      finalStoreId = userStore.id;
    } else if (req.user.role === 'admin') {
      // Admin pode criar categoria para qualquer loja ou global (null)
      finalStoreId = store_id || null;
    }

    const id = uuidv4();
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await db.prepare(`
      INSERT INTO categories (id, name, slug, description, icon, active, order_index, store_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      finalSlug,
      description || '',
      icon || '',
      active !== undefined ? (active ? true : false) : true,
      order_index || 0,
      finalStoreId
    );

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json(category);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria (admin ou lojista dono da categoria)
router.put('/:id', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da categoria é obrigatório' });
    }

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar permissão: admin pode editar qualquer categoria, lojista só as suas
    if (req.user.role !== 'admin') {
      if (category.store_id) {
        // Verificar se a categoria pertence à loja do usuário
        const userStore = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
        if (!userStore || userStore.id !== category.store_id) {
          return res.status(403).json({ error: 'Você não tem permissão para editar esta categoria' });
        }
      } else {
        // Lojista não pode editar categorias globais
        return res.status(403).json({ error: 'Você não tem permissão para editar categorias globais' });
      }
    }

    const { name, slug, description, icon, active, order_index } = req.body;
    
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? true : false); }
    if (order_index !== undefined) { updates.push('order_index = ?'); values.push(order_index); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await db.prepare(`
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updated = await db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Deletar categoria (admin ou lojista dono da categoria)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da categoria é obrigatório' });
    }

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar permissão: admin pode deletar qualquer categoria, lojista só as suas
    if (req.user.role !== 'admin') {
      if (category.store_id) {
        // Verificar se a categoria pertence à loja do usuário
        const userStore = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
        if (!userStore || userStore.id !== category.store_id) {
          return res.status(403).json({ error: 'Você não tem permissão para deletar esta categoria' });
        }
      } else {
        // Lojista não pode deletar categorias globais
        return res.status(403).json({ error: 'Você não tem permissão para deletar categorias globais' });
      }
    }

    await db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

export default router;

