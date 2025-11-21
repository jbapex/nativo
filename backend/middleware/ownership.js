import { db } from '../database/db.js';

// Middleware para verificar se o usuário é dono do produto
export function requireProductOwnership(req, res, next) {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin pode acessar qualquer produto
    if (userRole === 'admin') {
      return next();
    }

    // Buscar produto e verificar se pertence à loja do usuário
    const product = db.prepare('SELECT store_id FROM products WHERE id = ?').get(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verificar se o usuário é dono da loja
    const store = db.prepare('SELECT user_id FROM stores WHERE id = ?').get(product.store_id);
    
    if (!store || store.user_id !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este produto' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar propriedade do produto:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
}

// Middleware para verificar se o usuário é dono da loja
export function requireStoreOwnership(req, res, next) {
  try {
    const storeId = req.params.id || req.body.store_id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin pode acessar qualquer loja
    if (userRole === 'admin') {
      return next();
    }

    if (!storeId) {
      return res.status(400).json({ error: 'ID da loja é obrigatório' });
    }

    // Verificar se o usuário é dono da loja
    const store = db.prepare('SELECT user_id FROM stores WHERE id = ?').get(storeId);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    if (store.user_id !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar esta loja' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar propriedade da loja:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
}

// Middleware para verificar se o usuário é dono do pedido (cliente ou lojista)
export function requireOrderAccess(req, res, next) {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin pode acessar qualquer pedido
    if (userRole === 'admin') {
      return next();
    }

    // Buscar pedido
    const order = db.prepare('SELECT user_id, store_id FROM orders WHERE id = ?').get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se é o cliente que fez o pedido
    if (order.user_id === userId) {
      return next();
    }

    // Verificar se é o lojista que recebeu o pedido
    if (userRole === 'store') {
      const store = db.prepare('SELECT id FROM stores WHERE id = ? AND user_id = ?').get(order.store_id, userId);
      if (store) {
        return next();
      }
    }

    return res.status(403).json({ error: 'Você não tem permissão para acessar este pedido' });
  } catch (error) {
    console.error('Erro ao verificar acesso ao pedido:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
}

