import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeBody } from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { createNotification } from './notifications.js';

const router = express.Router();

let promotionsSchemaSupportsProductId = null;

function isMissingColumnError(error) {
  if (!error) return false;
  if (error.code === '42703') {
    return true;
  }
  if (error.code === 'SQLITE_ERROR' && /no such column/i.test(error.message || '')) {
    return true;
  }
  return /no such column/i.test(error.message || '');
}

async function hasPromotionProductIdColumn(dbInstance) {
  if (promotionsSchemaSupportsProductId !== null) {
    return promotionsSchemaSupportsProductId;
  }
  try {
    await dbInstance.prepare('SELECT product_id FROM promotions LIMIT 1').get();
    promotionsSchemaSupportsProductId = true;
  } catch (error) {
    if (isMissingColumnError(error)) {
      promotionsSchemaSupportsProductId = false;
    } else {
      console.error('Erro ao verificar coluna product_id em promotions:', error);
      promotionsSchemaSupportsProductId = false;
    }
  }
  return promotionsSchemaSupportsProductId;
}

function extractPromotionProductIds(promotion) {
  if (!promotion) return [];
  if (promotion.product_id) {
    return [promotion.product_id];
  }
  const { product_ids: rawIds } = promotion;
  if (!rawIds) return [];
  if (Array.isArray(rawIds)) {
    return rawIds.filter(Boolean);
  }
  if (typeof rawIds === 'string') {
    try {
      const parsed = JSON.parse(rawIds);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (_) {
      return rawIds
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function findPromotionForProduct(promotions = [], productId) {
  const specific = promotions.find(promo => {
    const ids = extractPromotionProductIds(promo);
    return ids.length > 0 && ids.includes(productId);
  });
  if (specific) return specific;
  return promotions.find(promo => extractPromotionProductIds(promo).length === 0) || null;
}

// Função auxiliar para calcular preço com desconto baseado em promoções
async function calculateProductPriceWithPromotion(product, db) {
  const now = new Date().toISOString();

  const schemaHasProductId = await hasPromotionProductIdColumn(db);
  let promotion = null;

  if (schemaHasProductId) {
    const specificPromo = await db.prepare(`
      SELECT * FROM promotions
      WHERE store_id = ?
        AND product_id = ?
        AND active = true
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(product.store_id, product.id, now, now);

    promotion = specificPromo;

    if (!promotion) {
      promotion = await db.prepare(`
        SELECT * FROM promotions
        WHERE store_id = ?
          AND product_id IS NULL
          AND active = true
          AND start_date <= ?
          AND end_date >= ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(product.store_id, now, now);
    }
  } else {
    const promotions = await db.prepare(`
      SELECT *
      FROM promotions
      WHERE store_id = ?
        AND active = true
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY created_at DESC
    `).all(product.store_id, now, now);

    promotion = findPromotionForProduct(promotions, product.id);
  }

  // Se não tiver promoção, retornar preço original
  if (!promotion) {
    return {
      finalPrice: parseFloat(product.price),
      originalPrice: parseFloat(product.price),
      hasPromotion: false
    };
  }
  
  // Calcular preço com desconto
  let finalPrice = parseFloat(product.price);
  const originalPrice = parseFloat(product.price);
  
  switch (promotion.discount_type) {
    case 'percentage':
      const discountPercent = promotion.discount_value || 0;
      finalPrice = originalPrice * (1 - discountPercent / 100);
      break;
    case 'fixed':
      finalPrice = Math.max(0, originalPrice - (promotion.discount_value || 0));
      break;
    case 'free_shipping':
      // Frete grátis não altera o preço
      finalPrice = originalPrice;
      break;
  }
  
  return {
    finalPrice: Math.round(finalPrice * 100) / 100, // Arredondar para 2 casas decimais
    originalPrice: originalPrice,
    hasPromotion: true,
    promotion: promotion
  };
}

// Função para gerar payload EMV PIX completo com valor
function generatePixPayload({ pixKey, amount, merchantName = 'Loja', merchantCity = 'BRASIL', description = '' }) {
  // Formatar valor com 2 casas decimais
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  // Função auxiliar para criar campo EMV
  const createEMVField = (id, value) => {
    const idStr = String(id).padStart(2, '0');
    const valueStr = String(value);
    const length = String(valueStr.length).padStart(2, '0');
    return `${idStr}${length}${valueStr}`;
  };
  
  // 00 - Payload Format Indicator (fixo: 01)
  let payload = createEMVField('00', '01');
  
  // 01 - Point of Initiation Method (12 = estático, pode ser usado repetidamente)
  payload += createEMVField('01', '12');
  
  // 26 - Merchant Account Information
  // 00 - GUI (Global Unique Identifier) - sempre "br.gov.bcb.pix"
  // 01 - Chave PIX
  const merchantAccountInfo = createEMVField('00', 'br.gov.bcb.pix') + createEMVField('01', pixKey);
  payload += createEMVField('26', merchantAccountInfo);
  
  // 52 - Merchant Category Code (0000 = não especificado)
  payload += createEMVField('52', '0000');
  
  // 53 - Transaction Currency (986 = BRL)
  payload += createEMVField('53', '986');
  
  // 54 - Transaction Amount (valor da transação)
  payload += createEMVField('54', formattedAmount);
  
  // 58 - Country Code (BR)
  payload += createEMVField('58', 'BR');
  
  // 59 - Merchant Name (limitado a 25 caracteres)
  const name = merchantName.substring(0, 25).toUpperCase();
  payload += createEMVField('59', name);
  
  // 60 - Merchant City (limitado a 15 caracteres)
  const city = merchantCity.substring(0, 15).toUpperCase();
  payload += createEMVField('60', city);
  
  // 62 - Additional Data Field Template (opcional - descrição do pedido)
  if (description) {
    const descriptionField = createEMVField('05', description.substring(0, 25));
    payload += createEMVField('62', descriptionField);
  }
  
  // 63 - CRC16 (checksum) - calculado sobre todo o payload + campo 63 sem o CRC
  const payloadWithCRCField = payload + '6304';
  const crc = calculateCRC16(payloadWithCRCField);
  payload += createEMVField('63', crc);
  
  return payload;
}

// Função para calcular CRC16 (algoritmo padrão para PIX)
function calculateCRC16(data) {
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Obter carrinho do usuário (agrupado por loja)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Buscar ou criar carrinho
    let cart = await db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.user.id);
    
    if (!cart) {
      const cartId = uuidv4();
      await db.prepare('INSERT INTO cart (id, user_id) VALUES (?, ?)').run(cartId, req.user.id);
      cart = { id: cartId, user_id: req.user.id };
    }
    
    // Buscar itens do carrinho com informações do produto e loja
    const items = await db.prepare(`
      SELECT 
        ci.id,
        ci.product_id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.name as product_name,
        p.price as product_price,
        p.images as product_images,
        p.stock as product_stock,
        p.active as product_active,
        p.store_id as product_store_id,
        s.name as store_name,
        s.whatsapp as store_whatsapp,
        s.logo as store_logo,
        s.checkout_enabled as store_checkout_enabled
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE ci.user_id = ?
      ORDER BY p.store_id, ci.created_at
    `).all(req.user.id);
    
    // Agrupar itens por loja
    const itemsByStore = {};
    for (const item of items) {
      const storeId = item.product_store_id;
      
      if (!itemsByStore[storeId]) {
        itemsByStore[storeId] = {
          store_id: storeId,
          store_name: item.store_name,
          store_whatsapp: item.store_whatsapp,
          store_logo: item.store_logo,
          store_checkout_enabled: item.store_checkout_enabled === 1 || item.store_checkout_enabled === true,
          items: []
        };
      }
      
      // Buscar produto completo para calcular preço com promoção
      const fullProduct = await db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      const priceInfo = fullProduct ? await calculateProductPriceWithPromotion(fullProduct, db) : {
        finalPrice: parseFloat(item.product_price),
        originalPrice: parseFloat(item.product_price),
        hasPromotion: false
      };
      
      itemsByStore[storeId].items.push({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: priceInfo.finalPrice, // Preço com desconto
        product_original_price: priceInfo.originalPrice, // Preço original
        product_images: item.product_images ? JSON.parse(item.product_images) : [],
        product_stock: item.product_stock,
        product_active: item.product_active === 1 || item.product_active === true,
        quantity: item.quantity,
        subtotal: priceInfo.finalPrice * item.quantity,
        has_promotion: priceInfo.hasPromotion
      });
    }
    
    // Calcular totais por loja
    const stores = Object.values(itemsByStore).map(store => {
      const total = store.items.reduce((sum, item) => sum + item.subtotal, 0);
      return {
        ...store,
        total: total,
        items_count: store.items.length
      };
    });
    
    // Calcular total geral
    const grandTotal = stores.reduce((sum, store) => sum + store.total, 0);
    
    res.json({
      cart_id: cart.id,
      stores: stores,
      total_items: items.length,
      grand_total: grandTotal,
      stores_count: stores.length
    });
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error);
    res.status(500).json({ error: 'Erro ao buscar carrinho' });
  }
});

// Adicionar item ao carrinho
router.post('/items', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'product_id é obrigatório' });
    }
    
    // Buscar produto
    const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    if (product.active !== 1 && product.active !== true) {
      return res.status(400).json({ error: 'Produto não está disponível' });
    }
    
    // Verificar estoque
    const qty = parseInt(quantity) || 1;
    if (product.stock !== null && product.stock < qty) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }
    
    // Buscar ou criar carrinho
    let cart = await db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      const cartId = uuidv4();
      await db.prepare('INSERT INTO cart (id, user_id) VALUES (?, ?)').run(cartId, req.user.id);
      cart = { id: cartId, user_id: req.user.id };
    }
    
    // Verificar se produto já está no carrinho
    const existingItem = await db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
    
    if (existingItem) {
      // Atualizar quantidade
      const newQuantity = existingItem.quantity + qty;
      
      // Verificar estoque novamente
      if (product.stock !== null && product.stock < newQuantity) {
        return res.status(400).json({ error: 'Estoque insuficiente para a quantidade solicitada' });
      }
      
      await db.prepare('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newQuantity, existingItem.id);
    } else {
      // Adicionar novo item (PostgreSQL usa user_id diretamente)
      const itemId = uuidv4();
      await db.prepare(`
        INSERT INTO cart_items (id, user_id, product_id, quantity)
        VALUES (?, ?, ?, ?)
      `).run(itemId, req.user.id, product_id, qty);
    }
    
    // Atualizar timestamp do carrinho
    await db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cart.id);
    
    res.json({ message: 'Item adicionado ao carrinho', cart_id: cart.id });
  } catch (error) {
    console.error('Erro ao adicionar item ao carrinho:', error);
    res.status(500).json({ error: 'Erro ao adicionar item ao carrinho' });
  }
});

// Atualizar quantidade de um item
router.put('/items/:itemId', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = parseInt(quantity);
    
    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }
    
    // Buscar item do carrinho
    const item = await db.prepare(`
      SELECT ci.*, p.stock, p.active
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND ci.user_id = ?
    `).get(req.params.itemId, req.user.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no carrinho' });
    }
    
    // Verificar estoque
    if (item.stock !== null && item.stock < qty) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }
    
    // Atualizar quantidade
    await db.prepare('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(qty, req.params.itemId);
    
    // Atualizar timestamp do carrinho
    const userCart = await db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (userCart) {
      await db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userCart.id);
    }
    
    res.json({ message: 'Quantidade atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar item do carrinho:', error);
    res.status(500).json({ error: 'Erro ao atualizar item do carrinho' });
  }
});

// Remover item do carrinho
router.delete('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    // Verificar se o item pertence ao carrinho do usuário
    const item = await db.prepare(`
      SELECT ci.* FROM cart_items ci
      WHERE ci.id = ? AND ci.user_id = ?
    `).get(req.params.itemId, req.user.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no carrinho' });
    }
    
    // Remover item
    await db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.itemId);
    
    // Atualizar timestamp do carrinho
    const userCart = await db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (userCart) {
      await db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userCart.id);
    }
    
    res.json({ message: 'Item removido do carrinho' });
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error);
    res.status(500).json({ error: 'Erro ao remover item do carrinho' });
  }
});

// Limpar carrinho
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const cart = await db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.user.id);
    
    if (cart) {
      // Deletar itens (cascade já remove, mas vamos fazer explicitamente)
      await db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
      await db.prepare('DELETE FROM cart WHERE id = ?').run(cart.id);
    }
    
    res.json({ message: 'Carrinho limpo' });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    res.status(500).json({ error: 'Erro ao limpar carrinho' });
  }
});

// Criar pedido a partir do carrinho (para uma loja específica)
router.post('/checkout/:storeId', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_phone,
      notes,
      payment_method
    } = req.body;
    
    // Buscar carrinho do usuário
    const cart = await db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      return res.status(404).json({ error: 'Carrinho vazio' });
    }
    
    // Buscar itens do carrinho da loja específica
    const items = await db.prepare(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.price as product_price,
        p.stock as product_stock,
        p.active as product_active,
        p.store_id
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.store_id = ?
    `).all(req.user.id, storeId);
    
    // Debug: Log para entender o problema
    console.log('=== DEBUG CHECKOUT ===');
    console.log('User ID:', req.user.id);
    console.log('Store ID recebido:', storeId);
    console.log('Itens encontrados:', items.length);
    console.log('Itens:', items.map(i => ({ id: i.id, product_id: i.product_id, store_id: i.store_id })));
    
    // Verificar todos os itens do carrinho para debug
    const allItems = await db.prepare(`
      SELECT ci.id, ci.product_id, p.store_id, p.name as product_name
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(req.user.id);
    console.log('Todos os itens do carrinho:', allItems.map(i => ({ id: i.id, product_id: i.product_id, store_id: i.store_id, product_name: i.product_name })));
    
    if (items.length === 0) {
      return res.status(404).json({ 
        error: 'Nenhum item desta loja no carrinho',
        debug: {
          cart_id: cart.id,
          store_id: storeId,
          all_items_in_cart: allItems.map(i => ({ store_id: i.store_id, product_name: i.product_name }))
        }
      });
    }
    
    // Verificar se a loja existe e buscar informações da cidade
    const store = await db.prepare(`
      SELECT s.*, c.name as city_name
      FROM stores s
      LEFT JOIN cities c ON s.city_id = c.id
      WHERE s.id = ?
    `).get(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Validar produtos e calcular total
    let subtotalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      if (item.product_active !== 1 && item.product_active !== true) {
        return res.status(400).json({ error: `Produto ${item.product_name} não está disponível` });
      }
      
      if (item.product_stock !== null && item.product_stock < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para ${item.product_name}` });
      }
      
      // Buscar produto completo para calcular preço com promoção
      const fullProduct = await db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      const priceInfo = fullProduct ? await calculateProductPriceWithPromotion(fullProduct, db) : {
        finalPrice: parseFloat(item.product_price),
        originalPrice: parseFloat(item.product_price),
        hasPromotion: false
      };
      
      const price = priceInfo.finalPrice; // Usar preço com desconto
      const subtotal = price * item.quantity;
      subtotalAmount += subtotal;
      
      // Calcular percentual de desconto se houver promoção
      let discountPercent = 0;
      let promotionName = null;
      if (priceInfo.hasPromotion && priceInfo.originalPrice > priceInfo.finalPrice) {
        discountPercent = Math.round(((priceInfo.originalPrice - priceInfo.finalPrice) / priceInfo.originalPrice) * 100 * 100) / 100; // 2 casas decimais
        promotionName = priceInfo.promotion?.name || 'Desconto aplicado';
      }
      
      orderItems.push({
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: price,
        original_price: priceInfo.originalPrice,
        discount_percent: discountPercent,
        promotion_name: promotionName,
        quantity: item.quantity,
        subtotal: subtotal
      });
    }
    
    // Calcular desconto total (diferença entre preços originais e com desconto)
    let totalOriginalAmount = 0;
    let totalDiscountAmount = 0;
    for (const item of orderItems) {
      const originalSubtotal = (item.original_price || item.product_price) * item.quantity;
      totalOriginalAmount += originalSubtotal;
      totalDiscountAmount += (originalSubtotal - item.subtotal);
    }
    
    // Calcular frete
    let shippingCost = 0;
    if (!store.shipping_calculate_on_whatsapp && store.shipping_fixed_price) {
      // Verificar se tem frete grátis
      const freeShippingThreshold = store.shipping_free_threshold ? parseFloat(store.shipping_free_threshold) : null;
      if (!freeShippingThreshold || subtotalAmount < freeShippingThreshold) {
        shippingCost = parseFloat(store.shipping_fixed_price) || 0;
      }
    }
    
    const totalAmount = subtotalAmount + shippingCost;
    
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
      storeId,
      totalAmount,
      shipping_address || null,
      shipping_city || null,
      shipping_state || null,
      shipping_zip || null,
      shipping_phone || null,
      notes || null,
      payment_method || (store.checkout_enabled ? 'checkout' : 'whatsapp')
    );
    
    // Criar itens do pedido
    const insertItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name, product_price, 
        original_price, discount_percent, promotion_name,
        quantity, subtotal
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of orderItems) {
      await insertItem.run(
        uuidv4(),
        orderId,
        item.product_id,
        item.product_name,
        item.product_price,
        item.original_price || item.product_price, // Preço original (ou o mesmo se não tiver desconto)
        item.discount_percent || null,
        item.promotion_name || null,
        item.quantity,
        item.subtotal
      );
      
      // Atualizar estoque
      const productForStock = await db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
      if (productForStock && productForStock.stock !== null) {
        await db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
      }
    }
    
    // Remover itens do carrinho (apenas desta loja)
    await db.prepare(`
      DELETE FROM cart_items 
      WHERE user_id = ? 
      AND product_id IN (SELECT id FROM products WHERE store_id = ?)
    `).run(req.user.id, storeId);
    
    // Atualizar timestamp do carrinho
    await db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cart.id);
    
    // Buscar pedido criado
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
    
    // Preparar informações de pagamento
    const paymentInfo = {
      pix_key: store.pix_key || null,
      payment_link: store.payment_link || null,
      payment_instructions: store.payment_instructions || null,
      pix_qr_code: null,
      mercadopago_payment_id: null,
      mercadopago_preference_id: null
    };
    
    // Tentar usar Mercado Pago se estiver conectado
    if (store.mercadopago_access_token && payment_method === 'pix') {
      try {
        const { MercadoPagoConfig, Payment } = await import('mercadopago');
        const client = new MercadoPagoConfig({ 
          accessToken: store.mercadopago_access_token 
        });
        const payment = new Payment(client);
        
        // Criar pagamento PIX via Mercado Pago
        // IMPORTANTE: O transaction_amount já inclui o valor total (subtotal + frete)
        const paymentData = {
          transaction_amount: parseFloat(totalAmount.toFixed(2)), // Garantir 2 casas decimais
          description: `Pedido #${orderId.slice(0, 8).toUpperCase()} - ${store.name}`,
          payment_method_id: 'pix',
          payer: {
            email: req.user.email || 'cliente@exemplo.com',
            first_name: req.user.full_name?.split(' ')[0] || 'Cliente',
            last_name: req.user.full_name?.split(' ').slice(1).join(' ') || '',
          },
          metadata: {
            order_id: orderId,
            store_id: storeId
          }
        };
        
        console.log('Criando pagamento PIX no Mercado Pago com valor:', paymentData.transaction_amount);
        
        const createdPayment = await payment.create({ body: paymentData });
        
        console.log('Pagamento PIX criado no Mercado Pago:', {
          payment_id: createdPayment.id,
          status: createdPayment.status,
          transaction_amount: createdPayment.transaction_amount,
          has_qr_code: !!createdPayment.point_of_interaction?.transaction_data?.qr_code,
          has_qr_code_base64: !!createdPayment.point_of_interaction?.transaction_data?.qr_code_base64
        });
        
        // Gerar QR Code a partir do código PIX do Mercado Pago
        // O Mercado Pago retorna o QR Code já com o valor incluído
        const transactionData = createdPayment.point_of_interaction?.transaction_data;
        
        if (transactionData) {
          // Priorizar usar o QR Code em base64 do Mercado Pago (já vem pronto)
          if (transactionData.qr_code_base64) {
            // Usar o QR Code em base64 diretamente do Mercado Pago
            // Remover prefixo "data:image/png;base64," se já existir
            const base64Data = transactionData.qr_code_base64.replace(/^data:image\/png;base64,/, '');
            paymentInfo.pix_qr_code = `data:image/png;base64,${base64Data}`;
            console.log('Usando QR Code base64 do Mercado Pago (já com valor incluído)');
          } else if (transactionData.qr_code) {
            // Se não tiver base64, gerar QR Code a partir do código PIX
            // O código PIX do Mercado Pago já vem com o valor incluído
            const qrCode = transactionData.qr_code;
            paymentInfo.pix_qr_code = await QRCode.toDataURL(qrCode, {
              errorCorrectionLevel: 'H', // Alto nível de correção para melhor leitura
              type: 'image/png',
              quality: 1.0,
              margin: 4, // Margem maior para melhor leitura
              width: 512, // Tamanho maior para melhor qualidade
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            console.log('QR Code gerado a partir do código PIX (já com valor incluído)');
          }
          
          // Salvar informações do pagamento
          paymentInfo.mercadopago_payment_id = createdPayment.id.toString();
          paymentInfo.pix_qr_code_text = transactionData.qr_code || null; // Código PIX copia e cola (já com valor)
          paymentInfo.transaction_amount = createdPayment.transaction_amount; // Valor confirmado
          paymentInfo.ticket_url = transactionData.ticket_url || null; // URL do comprovante
          
          console.log('QR Code PIX gerado com sucesso:', {
            payment_id: createdPayment.id,
            valor: createdPayment.transaction_amount,
            tem_qr_code: !!paymentInfo.pix_qr_code,
            tem_codigo_pix: !!paymentInfo.pix_qr_code_text
          });
        } else {
          console.error('Dados de transação não retornados pelo Mercado Pago:', createdPayment);
        }
      } catch (mpError) {
        console.error('Erro ao gerar pagamento PIX via Mercado Pago:', mpError);
        // Fallback para método manual
      }
    }
    
    // Fallback: Gerar QR Code PIX manual se não usar Mercado Pago ou se falhar
    if (!paymentInfo.pix_qr_code && store.pix_key && payment_method === 'pix') {
      try {
        // QR Code simples apenas com a chave PIX (mais compatível)
        // O cliente digita o valor no app do banco
        const qrCodeDataUrl = await QRCode.toDataURL(store.pix_key, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1
        });
        
        paymentInfo.pix_qr_code = qrCodeDataUrl;
      } catch (qrError) {
        console.error('Erro ao gerar QR Code PIX:', qrError);
        // Continuar sem QR Code se houver erro
      }
    }
    
    // Gerar link de pagamento via Mercado Pago para cartão de crédito
    if (store.mercadopago_access_token && payment_method === 'credit_card') {
      try {
        const { MercadoPagoConfig, Preference } = await import('mercadopago');
        const client = new MercadoPagoConfig({ 
          accessToken: store.mercadopago_access_token 
        });
        const preference = new Preference(client);
        
        // Criar preferência de pagamento
        const preferenceData = {
          items: orderItems.map(item => ({
            title: item.product_name,
            quantity: item.quantity,
            unit_price: item.product_price,
            currency_id: 'BRL'
          })),
          payer: {
            email: req.user.email || 'cliente@exemplo.com',
            name: req.user.full_name || 'Cliente',
          },
          back_urls: {
            success: `${process.env.FRONTEND_URL || 'http://localhost:3006'}/OrderDetail?id=${orderId}`,
            failure: `${process.env.FRONTEND_URL || 'http://localhost:3006'}/Cart`,
            pending: `${process.env.FRONTEND_URL || 'http://localhost:3006'}/OrderDetail?id=${orderId}`
          },
          auto_return: 'approved',
          metadata: {
            order_id: orderId,
            store_id: storeId
          }
        };
        
        const createdPreference = await preference.create({ body: preferenceData });
        paymentInfo.mercadopago_preference_id = createdPreference.id;
        paymentInfo.payment_link = createdPreference.init_point || createdPreference.sandbox_init_point;
      } catch (mpError) {
        console.error('Erro ao gerar preferência de pagamento via Mercado Pago:', mpError);
        // Fallback para link manual se configurado
        if (store.payment_link) {
          paymentInfo.payment_link = store.payment_link;
        }
      }
    }
    
    const orderResponse = {
      ...createdOrder,
      items: orderItemsData.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : [],
        original_price: item.original_price ? parseFloat(item.original_price) : null,
        discount_percent: item.discount_percent ? parseFloat(item.discount_percent) : null,
        promotion_name: item.promotion_name || null
      })),
      subtotal: subtotalAmount,
      original_subtotal: totalOriginalAmount > 0 ? totalOriginalAmount : null,
      discount_amount: totalDiscountAmount > 0 ? totalDiscountAmount : null,
      shipping_cost: shippingCost,
      total: totalAmount,
      payment_info: paymentInfo
    };
    
    // Criar notificação para o lojista
    try {
      const storeUser = await db.prepare('SELECT user_id FROM stores WHERE id = ?').get(storeId);
      if (storeUser) {
        await createNotification(
          storeUser.user_id,
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
    console.error('Erro ao criar pedido do carrinho:', error);
    res.status(500).json({ error: 'Erro ao criar pedido do carrinho' });
  }
});

export default router;

