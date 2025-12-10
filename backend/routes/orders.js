import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { requireOrderAccess } from '../middleware/ownership.js';
import { validate, orderSchema } from '../middleware/validation.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getPaginationParams, createPaginationResponse, applyPagination } from '../utils/pagination.js';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from './notifications.js';

const router = express.Router();

// Listar pedidos (cliente vê seus pedidos, loja vê pedidos da loja, admin vê todos)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Paginação
    const { page, limit, offset } = getPaginationParams(req.query, { defaultLimit: 20, maxLimit: 100 });
    
    let baseQuery;
    let countQuery;
    let queryParams = [];
    
    if (req.user.role === 'admin') {
      // Admin vê todos os pedidos
      baseQuery = `
        SELECT o.*, 
               u.full_name as user_name,
               u.email as user_email,
               s.name as store_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN stores s ON o.store_id = s.id
      `;
      countQuery = 'SELECT COUNT(*) as total FROM orders o';
    } else if (req.user.role === 'store') {
      // Lojista vê pedidos da sua loja (recebidos) E pedidos que ele fez (compras)
      const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
      
      if (!store) {
        // Se não tem loja, mostrar apenas os pedidos que ele fez como cliente
        baseQuery = `
          SELECT o.*, 
                 u.full_name as user_name,
                 u.email as user_email,
                 s.name as store_name
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN stores s ON o.store_id = s.id
          WHERE o.user_id = ?
        `;
        countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE o.user_id = ?';
        queryParams = [req.user.id];
      } else {
        // Mostrar pedidos recebidos (da sua loja) OU pedidos feitos (como cliente)
        baseQuery = `
          SELECT o.*, 
                 u.full_name as user_name,
                 u.email as user_email,
                 s.name as store_name
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN stores s ON o.store_id = s.id
          WHERE o.store_id = ? OR o.user_id = ?
        `;
        countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE o.store_id = ? OR o.user_id = ?';
        queryParams = [store.id, req.user.id];
      }
    } else {
      // Cliente vê seus próprios pedidos
      baseQuery = `
        SELECT o.*, 
               u.full_name as user_name,
               u.email as user_email,
               s.name as store_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN stores s ON o.store_id = s.id
        WHERE o.user_id = ?
      `;
      countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE o.user_id = ?';
      queryParams = [req.user.id];
    }
    
    // Contar total
    const countResult = await db.prepare(countQuery).get(...queryParams);
    const total = countResult?.total || 0;
    
    // Aplicar ordenação e paginação
    baseQuery += ' ORDER BY o.created_at DESC';
    const paginatedQuery = applyPagination(baseQuery, limit, offset);
    queryParams.push(limit, offset);
    
    const orders = await db.prepare(paginatedQuery).all(...queryParams);
    
    // Buscar itens de cada pedido
    const ordersWithItems = await Promise.all(orders.map(async order => {
      try {
        const items = await db.prepare(`
          SELECT oi.*, p.images, p.active
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `).all(order.id);
        
        return {
          ...order,
          items: items.map(item => {
            let parsedImages = [];
            if (item.images) {
              try {
                parsedImages = JSON.parse(item.images);
                // Garantir que seja um array
                if (!Array.isArray(parsedImages)) {
                  parsedImages = [];
                }
              } catch (parseError) {
                console.error('Erro ao fazer parse das imagens do item:', parseError);
                parsedImages = [];
              }
            }
            return {
              ...item,
              images: parsedImages
            };
          })
        };
      } catch (orderError) {
        console.error('Erro ao processar pedido:', order.id, orderError);
        // Retornar pedido sem itens em caso de erro
        return {
          ...order,
          items: []
        };
      }
    }));
    
    // Retornar com paginação
    const response = createPaginationResponse(ordersWithItems, total, page, limit);
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Obter um pedido específico
router.get('/:id', authenticateToken, requireOrderAccess, async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const order = await db.prepare(`
      SELECT o.*, 
             u.full_name as user_name,
             u.email as user_email,
             u.phone as user_phone,
             s.name as store_name,
             s.whatsapp as store_whatsapp
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.id = ?
    `).get(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Verificar permissão
    if (req.user.role !== 'admin') {
      if (req.user.role === 'store') {
        // Lojista pode ver pedidos da sua loja (recebidos) OU pedidos que ele fez (compras)
        const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
        const isStoreOwner = store && order.store_id === store.id;
        const isOrderBuyer = order.user_id === req.user.id;
        
        if (!isStoreOwner && !isOrderBuyer) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      } else if (order.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
    
    // Buscar itens do pedido
    const items = await db.prepare(`
      SELECT oi.*, p.images, p.active
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    
    // Buscar histórico
    const history = await db.prepare(`
      SELECT * FROM order_history
      WHERE order_id = ?
      ORDER BY created_at DESC
    `).all(order.id);
    
    // Calcular desconto total se houver
    let totalOriginalAmount = 0;
    let totalDiscountAmount = 0;
    items.forEach(item => {
      if (item.original_price && item.original_price > item.product_price) {
        const originalSubtotal = parseFloat(item.original_price) * item.quantity;
        totalOriginalAmount += originalSubtotal;
        totalDiscountAmount += (originalSubtotal - parseFloat(item.subtotal));
      }
    });
    
    res.json({
      ...order,
      items: items.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : [],
        original_price: item.original_price ? parseFloat(item.original_price) : null,
        discount_percent: item.discount_percent ? parseFloat(item.discount_percent) : null,
        promotion_name: item.promotion_name || null
      })),
      history: history,
      original_subtotal: totalOriginalAmount > 0 ? totalOriginalAmount : null,
      discount_amount: totalDiscountAmount > 0 ? totalDiscountAmount : null
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// Criar novo pedido
router.post('/', authenticateToken, validate(orderSchema), async (req, res) => {
  try {
    const {
      store_id,
      items, // Array de { product_id, quantity }
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_phone,
      notes,
      payment_method
    } = req.body;
    
    if (!store_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'store_id e items são obrigatórios' });
    }
    
    // Verificar se a loja existe
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Calcular total e validar produtos
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Produto ${item.product_id} não encontrado` });
      }
      
      if (product.active !== 1 && product.active !== true) {
        return res.status(400).json({ error: `Produto ${product.name} não está disponível` });
      }
      
      const quantity = parseInt(item.quantity) || 1;
      
      // Verificar estoque se disponível
      if (product.stock !== null && product.stock < quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para ${product.name}` });
      }
      
      const price = parseFloat(product.price);
      const subtotal = price * quantity;
      
      totalAmount += subtotal;
      
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: price,
        quantity: quantity,
        subtotal: subtotal
      });
    }
    
    // Criar pedido
    const orderId = uuidv4();
    await db.prepare(`
      INSERT INTO orders (
        id, user_id, store_id, status, total_amount,
        shipping_address, shipping_city, shipping_state, shipping_zip, shipping_phone,
        notes, payment_method, payment_status
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      orderId,
      req.user.id,
      store_id,
      totalAmount,
      shipping_address || null,
      shipping_city || null,
      shipping_state || null,
      shipping_zip || null,
      shipping_phone || null,
      notes ? sanitizeText(notes.trim()) : null,
      payment_method || 'whatsapp'
    );
    
    // Criar itens do pedido
    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of orderItems) {
      await insertItem.run(
        uuidv4(),
        orderId,
        item.product_id,
        item.product_name,
        item.product_price,
        item.quantity,
        item.subtotal
      );
      
      // Atualizar estoque se disponível
      const productForStock = await db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
      if (productForStock && productForStock.stock !== null) {
        await db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
      }
    }
    
    // Buscar pedido criado com relacionamentos
    const createdOrder = await db.prepare(`
      SELECT o.*, 
             u.full_name as user_name,
             u.email as user_email,
             s.name as store_name,
             s.whatsapp as store_whatsapp
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.id = ?
    `).get(orderId);
    
    const orderItemsData = await db.prepare(`
      SELECT oi.*, p.images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);
    
    const orderResponse = {
      ...createdOrder,
      items: orderItemsData.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : []
      }))
    };
    
    // Criar notificação para o lojista
    try {
      const storeForNotification = await db.prepare('SELECT user_id FROM stores WHERE id = ?').get(store_id);
      if (storeForNotification) {
        await createNotification(
          storeForNotification.user_id,
          'order_new',
          'Novo Pedido Recebido',
          `Você recebeu um novo pedido #${orderId.slice(0, 8).toUpperCase()} no valor de R$ ${totalAmount.toFixed(2)}`,
          `/OrderDetail?id=${orderId}`
        );
      }
    } catch (error) {
      console.error('Erro ao criar notificação de novo pedido:', error);
    }
    
    res.status(201).json(orderResponse);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Atualizar status do pedido (lojista ou admin)
router.put('/:id/status', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    const { status, tracking_number, notes } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Verificar permissão (lojista só pode atualizar pedidos da sua loja)
    if (req.user.role === 'store') {
      const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
      if (!store || order.store_id !== store.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
    
    const oldStatus = order.status;
    const oldTrackingNumber = order.tracking_number || null;
    
    // Preparar atualização
    const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateValues = [status];
    
    // Adicionar tracking_number se fornecido e status for 'shipped'
    if (status === 'shipped' && tracking_number) {
      updateFields.push('tracking_number = ?');
      updateValues.push(tracking_number);
    }
    
    // Adicionar notes_admin se fornecido
    if (notes) {
      updateFields.push('notes_admin = ?');
      updateValues.push(notes);
    }
    
    updateValues.push(req.params.id);
    
    await db.prepare(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...updateValues);
    
    // Salvar histórico
    try {
      const user = await db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
      const statusLabels = {
        'pending': 'Pendente',
        'confirmed': 'Confirmado',
        'processing': 'Processando',
        'shipped': 'Enviado',
        'delivered': 'Entregue',
        'cancelled': 'Cancelado'
      };
      
      await db.prepare(`
        INSERT INTO order_history (id, order_id, changed_by, changed_by_name, change_type, old_value, new_value, notes)
        VALUES (?, ?, ?, ?, 'status', ?, ?, ?)
      `).run(
        uuidv4(),
        req.params.id,
        req.user.id,
        user?.full_name || req.user.email,
        statusLabels[oldStatus] || oldStatus,
        statusLabels[status] || status,
        notes ? sanitizeText(notes.trim()) : null
      );
      
      // Se tracking_number foi adicionado, salvar no histórico também
      if (status === 'shipped' && tracking_number && tracking_number !== oldTrackingNumber) {
        await db.prepare(`
          INSERT INTO order_history (id, order_id, changed_by, changed_by_name, change_type, old_value, new_value, notes)
          VALUES (?, ?, ?, ?, 'tracking', ?, ?, ?)
        `).run(
          uuidv4(),
          req.params.id,
          req.user.id,
          user?.full_name || req.user.email,
          oldTrackingNumber || 'Não informado',
          tracking_number,
          'Número de rastreamento adicionado'
        );
      }
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
    
    // Criar notificação para o cliente sobre mudança de status
    try {
      const orderForNotification = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
      if (orderForNotification) {
        const statusMessages = {
          'confirmed': 'Seu pedido foi confirmado',
          'processing': 'Seu pedido está sendo processado',
          'shipped': 'Seu pedido foi enviado',
          'delivered': 'Seu pedido foi entregue',
          'cancelled': 'Seu pedido foi cancelado'
        };
        
        if (statusMessages[status]) {
          await createNotification(
            orderForNotification.user_id,
            'order_status',
            'Status do Pedido Atualizado',
            `${statusMessages[status]}. Pedido #${req.params.id.slice(0, 8).toUpperCase()}`,
            `/OrderDetail?id=${req.params.id}`
          );
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificação de mudança de status:', error);
    }
    
    const updatedOrder = await db.prepare(`
      SELECT o.*, 
             u.full_name as user_name,
             u.email as user_email,
             u.phone as user_phone,
             s.name as store_name,
             s.whatsapp as store_whatsapp
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.id = ?
    `).get(req.params.id);
    
    const items = await db.prepare(`
      SELECT oi.*, p.images, p.active
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id);
    
    // Buscar histórico
    const history = await db.prepare(`
      SELECT * FROM order_history
      WHERE order_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);
    
    // Calcular desconto total se houver
    let totalOriginalAmount = 0;
    let totalDiscountAmount = 0;
    items.forEach(item => {
      if (item.original_price && item.original_price > item.product_price) {
        const originalSubtotal = parseFloat(item.original_price) * item.quantity;
        totalOriginalAmount += originalSubtotal;
        totalDiscountAmount += (originalSubtotal - parseFloat(item.subtotal));
      }
    });
    
    res.json({
      ...updatedOrder,
      items: items.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : [],
        original_price: item.original_price ? parseFloat(item.original_price) : null,
        discount_percent: item.discount_percent ? parseFloat(item.discount_percent) : null,
        promotion_name: item.promotion_name || null
      })),
      history: history,
      original_subtotal: totalOriginalAmount > 0 ? totalOriginalAmount : null,
      discount_amount: totalDiscountAmount > 0 ? totalDiscountAmount : null
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
  }
});

// Atualizar status de pagamento (admin ou lojista)
router.put('/:id/payment-status', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    const { payment_status, notes } = req.body;
    
    // Validar ID do pedido
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }
    
    // Validar payment_status
    if (!payment_status) {
      return res.status(400).json({ error: 'Status de pagamento é obrigatório' });
    }
    
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Status de pagamento inválido' });
    }
    
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Verificar permissão
    if (req.user.role === 'store') {
      const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
      if (!store || order.store_id !== store.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
    
    const oldPaymentStatus = order.payment_status;
    
    // Preparar atualização
    const updateFields = ['payment_status = ?'];
    const updateValues = [payment_status];
    
    // Adicionar notes_admin se fornecido (sanitizado)
    if (notes) {
      const sanitizedNotes = sanitizeText(notes.trim());
      updateFields.push('notes_admin = ?');
      updateValues.push(sanitizedNotes);
    }
    
    // Adicionar updated_at (usar NOW() para PostgreSQL ou CURRENT_TIMESTAMP para SQLite)
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    updateValues.push(req.params.id);
    
    try {
      await db.prepare(`
        UPDATE orders 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...updateValues);
    } catch (updateError) {
      console.error('Erro ao atualizar pedido:', updateError);
      console.error('Query:', `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`);
      console.error('Valores:', updateValues);
      throw updateError;
    }
    
    // Salvar histórico
    try {
      const user = await db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
      const paymentStatusLabels = {
        'pending': 'Pendente',
        'paid': 'Pago',
        'failed': 'Falhou',
        'refunded': 'Reembolsado'
      };
      
      await db.prepare(`
        INSERT INTO order_history (id, order_id, changed_by, changed_by_name, change_type, old_value, new_value, notes)
        VALUES (?, ?, ?, ?, 'payment_status', ?, ?, ?)
      `).run(
        uuidv4(),
        req.params.id,
        req.user.id,
        user?.full_name || req.user.email,
        paymentStatusLabels[oldPaymentStatus] || oldPaymentStatus,
        paymentStatusLabels[payment_status] || payment_status,
        notes ? sanitizeText(notes.trim()) : null
      );
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
    
    // Criar notificação para o cliente sobre mudança de status de pagamento
    try {
      const orderForNotification = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
      if (orderForNotification) {
        const paymentMessages = {
          'paid': 'Pagamento confirmado',
          'failed': 'Falha no pagamento',
          'refunded': 'Reembolso processado'
        };
        
        if (paymentMessages[payment_status]) {
          await createNotification(
            orderForNotification.user_id,
            'order_payment',
            'Status de Pagamento Atualizado',
            `${paymentMessages[payment_status]}. Pedido #${req.params.id.slice(0, 8).toUpperCase()}`,
            `/OrderDetail?id=${req.params.id}`
          );
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificação de pagamento:', error);
    }
    
    const updatedOrder = await db.prepare(`
      SELECT o.*, 
             u.full_name as user_name,
             u.email as user_email,
             u.phone as user_phone,
             s.name as store_name,
             s.whatsapp as store_whatsapp
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.id = ?
    `).get(req.params.id);
    
    const items = await db.prepare(`
      SELECT oi.*, p.images, p.active
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id);
    
    // Buscar histórico
    const history = await db.prepare(`
      SELECT * FROM order_history
      WHERE order_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);
    
    // Calcular desconto total se houver
    let totalOriginalAmount = 0;
    let totalDiscountAmount = 0;
    items.forEach(item => {
      if (item.original_price && item.original_price > item.product_price) {
        const originalSubtotal = parseFloat(item.original_price) * item.quantity;
        totalOriginalAmount += originalSubtotal;
        totalDiscountAmount += (originalSubtotal - parseFloat(item.subtotal));
      }
    });
    
    res.json({
      ...updatedOrder,
      items: items.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : [],
        original_price: item.original_price ? parseFloat(item.original_price) : null,
        discount_percent: item.discount_percent ? parseFloat(item.discount_percent) : null,
        promotion_name: item.promotion_name || null
      })),
      history: history,
      original_subtotal: totalOriginalAmount > 0 ? totalOriginalAmount : null,
      discount_amount: totalDiscountAmount > 0 ? totalDiscountAmount : null
    });
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    console.error('Stack:', error.stack);
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
    res.status(500).json({ 
      error: 'Erro ao atualizar status de pagamento',
      details: error.message,
      code: error.code
    });
  }
});

export default router;

