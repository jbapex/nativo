import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar favoritos do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Validar user
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const favorites = await db.prepare(`
      SELECT uf.*,
             p.id as product_id,
             p.name as product_name,
             p.price,
             p.compare_price,
             p.images,
             p.store_id,
             s.name as store_name
      FROM user_favorites uf
      JOIN products p ON uf.product_id = p.id
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC
    `).all(req.user.id);
    
    // Processar imagens JSON
    const favoritesWithImages = favorites.map(fav => ({
      ...fav,
      images: fav.images ? JSON.parse(fav.images) : []
    }));
    
    res.json(favoritesWithImages);
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

// Verificar se produto está nos favoritos
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.productId || req.params.productId === 'undefined') {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const favorite = await db.prepare(`
      SELECT id FROM user_favorites 
      WHERE user_id = ? AND product_id = ?
    `).get(req.user.id, req.params.productId);
    
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Erro ao verificar favorito:', error);
    res.status(500).json({ error: 'Erro ao verificar favorito' });
  }
});

// Adicionar aos favoritos
router.post('/:productId', authenticateToken, async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.productId || req.params.productId === 'undefined') {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { productId } = req.params;
    
    // Verificar se produto existe
    const product = await db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verificar se já está nos favoritos
    const existing = await db.prepare(`
      SELECT id FROM user_favorites 
      WHERE user_id = ? AND product_id = ?
    `).get(req.user.id, productId);
    
    if (existing) {
      return res.status(400).json({ error: 'Produto já está nos favoritos' });
    }
    
    // Adicionar aos favoritos
    const id = uuidv4();
    await db.prepare(`
      INSERT INTO user_favorites (id, user_id, product_id)
      VALUES (?, ?, ?)
    `).run(id, req.user.id, productId);
    
    // Atualizar contador de favoritos do produto
    await db.prepare(`
      UPDATE products 
      SET total_favorites = COALESCE(total_favorites, 0) + 1
      WHERE id = ?
    `).run(productId);
    
    res.status(201).json({ message: 'Produto adicionado aos favoritos', id });
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
});

// Remover dos favoritos
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    // Validar ID e user
    if (!req.params.productId || req.params.productId === 'undefined') {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { productId } = req.params;
    
    const favorite = await db.prepare(`
      SELECT id FROM user_favorites 
      WHERE user_id = ? AND product_id = ?
    `).get(req.user.id, productId);
    
    if (!favorite) {
      return res.status(404).json({ error: 'Favorito não encontrado' });
    }
    
    await db.prepare(`
      DELETE FROM user_favorites 
      WHERE user_id = ? AND product_id = ?
    `).run(req.user.id, productId);
    
    // Atualizar contador de favoritos do produto
    const currentFavorites = await db.prepare('SELECT total_favorites FROM products WHERE id = ?').get(productId);
    const newCount = Math.max((currentFavorites?.total_favorites || 0) - 1, 0);
    await db.prepare(`
      UPDATE products 
      SET total_favorites = ?
      WHERE id = ?
    `).run(newCount, productId);
    
    res.json({ message: 'Produto removido dos favoritos' });
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

export default router;

