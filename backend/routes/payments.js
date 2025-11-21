import express from 'express';
import crypto from 'crypto';
import { db } from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sanitizeBody } from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  getMercadoPagoClient, 
  storeAcceptsMercadoPago, 
  createPreference, 
  getPayment, 
  cancelPayment 
} from '../utils/mercadopago.js';
import { Preference } from 'mercadopago';
import { createNotification } from './notifications.js';

const router = express.Router();

// Criar preferência de pagamento (Mercado Pago)
router.post('/create-preference', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const { order_id, store_id } = req.body;

    if (!order_id || !store_id) {
      return res.status(400).json({ error: 'order_id e store_id são obrigatórios' });
    }

    // Verificar se loja aceita Mercado Pago
    if (!storeAcceptsMercadoPago(store_id)) {
      return res.status(400).json({ 
        error: 'Esta loja não aceita pagamento via Mercado Pago ou não possui credenciais configuradas' 
      });
    }

    // Buscar pedido
    const order = db.prepare(`
      SELECT o.*, u.email, u.full_name, u.phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.user_id = ?
    `).get(order_id, req.user.id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Buscar itens do pedido
    const orderItems = db.prepare(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order_id);

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'Pedido não possui itens' });
    }

    // Buscar loja
    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Preparar itens para a preferência
    const items = orderItems.map(item => ({
      title: item.product_name || 'Produto',
      quantity: item.quantity,
      unit_price: parseFloat(item.product_price),
      currency_id: 'BRL'
    }));

    // Adicionar frete como item separado se houver
    // Nota: O Mercado Pago não tem campo de frete separado, então adicionamos como item
    // Mas vamos usar o campo shipping_cost se disponível na preferência
    const shippingCost = parseFloat(order.total_amount) - orderItems.reduce((sum, item) => 
      sum + (parseFloat(item.product_price) * item.quantity), 0
    );

    // Validar dados necessários
    const payerEmail = order.email || req.user.email;
    if (!payerEmail) {
      return res.status(400).json({ error: 'Email do pagador é obrigatório' });
    }

    // Criar preferência
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3006';
    
    // Construir URLs de retorno - usar a rota RESTful correta
    const successUrl = `${frontendUrl}/pedido/${order_id}?status=approved`;
    const failureUrl = `${frontendUrl}/pedido/${order_id}?status=failure`;
    const pendingUrl = `${frontendUrl}/pedido/${order_id}?status=pending`;
    
    console.log('URLs de retorno:');
    console.log('Success:', successUrl);
    console.log('Failure:', failureUrl);
    console.log('Pending:', pendingUrl);
    
    const preferenceData = {
      items: items,
      payer: {
        email: payerEmail,
        name: (order.full_name || req.user.full_name || 'Cliente').substring(0, 100),
        ...(order.phone || order.shipping_phone ? {
          phone: {
            number: (order.phone || order.shipping_phone).replace(/\D/g, '').substring(0, 15) // Apenas números, máximo 15 caracteres
          }
        } : {})
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      // auto_return só funciona se back_urls.success estiver definido e válido
      // Removendo temporariamente para evitar erro, mas mantendo as URLs de retorno
      // auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12 // Máximo de 12x
      },
      statement_descriptor: (store.name || 'Loja').substring(0, 22), // Máximo 22 caracteres
      external_reference: order_id,
      metadata: {
        order_id: order_id,
        store_id: store_id,
        user_id: req.user.id
      }
    };

    // Adicionar frete se houver
    if (shippingCost > 0) {
      preferenceData.items.push({
        title: 'Frete',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'BRL'
      });
    }

    console.log('=== DEBUG CREATE PREFERENCE ===');
    console.log('Store ID:', store_id);
    console.log('Order ID:', order_id);
    console.log('Items count:', items.length);
    console.log('Items:', items);
    console.log('Payer email:', payerEmail);
    console.log('Back URLs:', preferenceData.back_urls);
    console.log('Preference Data completo:', JSON.stringify(preferenceData, null, 2));
    
    const client = getMercadoPagoClient(store_id);
    if (!client) {
      console.error('Cliente do Mercado Pago não encontrado para store_id:', store_id);
      return res.status(400).json({ 
        error: 'Loja não possui credenciais do Mercado Pago configuradas' 
      });
    }
    
    console.log('Cliente do Mercado Pago obtido com sucesso');
    
    const preference = new Preference(client);
    console.log('Criando preferência no Mercado Pago...');
    
    try {
      const createdPreference = await preference.create({ body: preferenceData });
      console.log('Preferência criada com sucesso:', createdPreference.id);

      // Criar registro de pagamento
      const paymentId = uuidv4();
      db.prepare(`
        INSERT INTO payments (
          id, order_id, status, payment_method, payment_type, 
          amount, currency, mp_preference_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        paymentId,
        order_id,
        'pending',
        'mercadopago',
        null, // Será preenchido quando o pagamento for confirmado
        parseFloat(order.total_amount),
        'BRL',
        createdPreference.id
      );

      // Atualizar pedido com payment_id e mp_preference_id
      db.prepare(`
        UPDATE orders 
        SET payment_id = ?, mp_preference_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(paymentId, createdPreference.id, order_id);

      console.log('Pagamento registrado no banco com ID:', paymentId);

      res.json({
        preference_id: createdPreference.id,
        init_point: createdPreference.init_point,
        sandbox_init_point: createdPreference.sandbox_init_point,
        payment_id: paymentId
      });
    } catch (mpError) {
      console.error('=== ERRO AO CRIAR PREFERÊNCIA NO MERCADO PAGO ===');
      console.error('Tipo do erro:', mpError.constructor.name);
      console.error('Mensagem:', mpError.message);
      console.error('Código:', mpError.code);
      console.error('Status:', mpError.status);
      console.error('Response:', mpError.response?.data || mpError.response);
      console.error('Stack:', mpError.stack);
      throw mpError; // Re-throw para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('=== ERRO GERAL AO CRIAR PREFERÊNCIA ===');
    console.error('Tipo do erro:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('Status:', error.status);
    console.error('Response:', error.response?.data || error.response);
    console.error('Stack:', error.stack);
    
    // Extrair mensagem de erro mais detalhada
    let errorMessage = error.message || 'Erro ao criar preferência de pagamento';
    let errorDetails = error.message;
    
    // Se for erro do Mercado Pago, tentar extrair mais informações
    if (error.response?.data) {
      errorDetails = JSON.stringify(error.response.data, null, 2);
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.cause) {
        errorMessage = error.response.data.cause[0]?.description || errorMessage;
      }
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar preferência de pagamento',
      details: errorDetails,
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Webhook do Mercado Pago
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // O Mercado Pago envia dados como Buffer ou string JSON
    let data;
    let bodyString;
    
    try {
      // req.body pode ser Buffer (do express.raw) ou já ser um objeto (se outro middleware processou)
      if (Buffer.isBuffer(req.body)) {
        bodyString = req.body.toString('utf8');
      } else if (typeof req.body === 'string') {
        bodyString = req.body;
      } else if (typeof req.body === 'object' && req.body !== null) {
        // Já é um objeto, usar diretamente
        data = req.body;
        bodyString = JSON.stringify(req.body);
      } else {
        bodyString = String(req.body);
      }
      
      // Se ainda não tiver data, fazer parse
      if (!data) {
        data = JSON.parse(bodyString);
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON do webhook:', parseError);
      console.error('Body recebido (primeiros 500 chars):', bodyString ? bodyString.substring(0, 500) : 'N/A');
      console.error('Tipo do body:', typeof req.body, Buffer.isBuffer(req.body) ? '(Buffer)' : '');
      // Retornar OK mesmo com erro de parse para evitar reenvios
      return res.status(200).send('OK');
    }
    
    const { type, data: eventData } = data;
    
    // Validar assinatura do webhook (X-Signature header) - Segurança
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    
    if (webhookSecret && signature) {
      // Validar assinatura do webhook
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString)
        .digest('hex');
      
      if (hash !== signature) {
        console.error('❌ Assinatura do webhook inválida! Possível tentativa de ataque.');
        console.error('Signature recebida:', signature);
        console.error('Signature calculada:', hash);
        console.error('Request ID:', requestId);
        // Retornar 401 para indicar que a requisição não é válida
        return res.status(401).send('Unauthorized - Invalid signature');
      }
      
      console.log('✅ Assinatura do webhook validada com sucesso');
    } else if (webhookSecret && !signature) {
      // Se o secret está configurado mas não há signature, pode ser um webhook de teste
      // Em produção, isso deve ser tratado como erro
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Webhook sem assinatura em produção (pode ser teste do Mercado Pago)');
      } else {
        console.log('ℹ️ Webhook sem assinatura (modo desenvolvimento ou teste)');
      }
    } else {
      console.log('ℹ️ Validação de assinatura desabilitada (MERCADOPAGO_WEBHOOK_SECRET não configurado)');
    }

    console.log('Webhook recebido:', { type, eventData, fullData: data });

    if (type === 'payment') {
      // Verificar se eventData existe e tem id
      if (!eventData || !eventData.id) {
        console.log('Webhook de teste ou formato inválido - eventData ou id não encontrado');
        console.log('Full data recebido:', JSON.stringify(data, null, 2));
        // Retornar OK mesmo assim, pois pode ser um webhook de teste
        return res.status(200).send('OK');
      }
      
      const paymentId = eventData.id;
      
      console.log('=== WEBHOOK RECEBIDO ===');
      console.log('Payment ID do Mercado Pago:', paymentId);
      console.log('Tipo:', type);
      console.log('Action:', data.action);
      console.log('Full eventData:', JSON.stringify(eventData, null, 2));

      // Primeiro, tentar buscar pagamento no banco pelo mp_payment_id
      let payment = db.prepare('SELECT * FROM payments WHERE mp_payment_id = ?').get(paymentId.toString());
      console.log('Busca por mp_payment_id:', paymentId.toString(), '- Encontrado:', !!payment);
      
      let order = null;
      let storeId = null;
      
      if (payment) {
        console.log('✅ Pagamento encontrado pelo mp_payment_id:', payment.id);
        order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.order_id);
        if (order) {
          storeId = order.store_id;
        }
      } else {
        // Se não encontrou pelo payment_id, precisamos buscar o pagamento no Mercado Pago
        // para obter o preference_id ou order_id do metadata
        console.log('⚠️ Pagamento não encontrado pelo mp_payment_id. Buscando em todas as lojas...');
        
        // Buscar todas as lojas com credenciais do Mercado Pago
        const storesWithMP = db.prepare('SELECT id, mercadopago_access_token FROM stores WHERE mercadopago_access_token IS NOT NULL').all();
        console.log('Lojas com Mercado Pago configurado:', storesWithMP.length);
        
        // Tentar buscar o pagamento no Mercado Pago usando as credenciais de cada loja
        for (const store of storesWithMP) {
          try {
            console.log(`Tentando buscar pagamento na loja ${store.id}...`);
            const paymentInfo = await getPayment(store.id, paymentId.toString());
            
            if (paymentInfo) {
              console.log('✅ Pagamento encontrado no Mercado Pago!');
              console.log('Preference ID:', paymentInfo.preference_id);
              console.log('Metadata:', paymentInfo.metadata);
              
              // Tentar encontrar o pedido pelo preference_id
              if (paymentInfo.preference_id) {
                order = db.prepare('SELECT * FROM orders WHERE mp_preference_id = ?').get(paymentInfo.preference_id);
                if (order) {
                  console.log('✅ Pedido encontrado pelo preference_id:', order.id);
                  storeId = store.id;
                  
                  // Buscar ou criar registro de pagamento
                  payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);
                  if (!payment && order.payment_id) {
                    payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(order.payment_id);
                  }
                  
                  if (!payment) {
                    // Criar novo registro de pagamento
                    const newPaymentId = uuidv4();
                    console.log('Criando novo registro de pagamento:', newPaymentId);
                    db.prepare(`
                      INSERT INTO payments (
                        id, order_id, status, payment_method, payment_type, 
                        amount, currency, mp_preference_id, mp_payment_id, created_at, updated_at
                      ) VALUES (?, ?, 'pending', 'mercadopago', ?, ?, 'BRL', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).run(
                      newPaymentId,
                      order.id,
                      null,
                      parseFloat(order.total_amount),
                      paymentInfo.preference_id,
                      paymentId.toString()
                    );
                    
                    db.prepare('UPDATE orders SET payment_id = ? WHERE id = ?').run(newPaymentId, order.id);
                    payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(newPaymentId);
                  }
                  break; // Encontrou, sair do loop
                }
              }
              
              // Tentar encontrar pelo order_id no metadata
              if (!order && paymentInfo.metadata && paymentInfo.metadata.order_id) {
                order = db.prepare('SELECT * FROM orders WHERE id = ?').get(paymentInfo.metadata.order_id);
                if (order) {
                  console.log('✅ Pedido encontrado pelo metadata.order_id:', order.id);
                  storeId = store.id;
                  
                  // Buscar ou criar registro de pagamento
                  payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);
                  if (!payment && order.payment_id) {
                    payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(order.payment_id);
                  }
                  
                  if (!payment) {
                    const newPaymentId = uuidv4();
                    db.prepare(`
                      INSERT INTO payments (
                        id, order_id, status, payment_method, payment_type, 
                        amount, currency, mp_preference_id, mp_payment_id, created_at, updated_at
                      ) VALUES (?, ?, 'pending', 'mercadopago', ?, ?, 'BRL', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).run(
                      newPaymentId,
                      order.id,
                      null,
                      parseFloat(order.total_amount),
                      paymentInfo.preference_id || null,
                      paymentId.toString()
                    );
                    
                    db.prepare('UPDATE orders SET payment_id = ? WHERE id = ?').run(newPaymentId, order.id);
                    payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(newPaymentId);
                  }
                  break;
                }
              }
            }
          } catch (error) {
            console.log(`Erro ao buscar pagamento na loja ${store.id}:`, error.message);
            // Continuar tentando outras lojas
          }
        }
      }
      
      // Se ainda não encontrou payment ou order, retornar OK
      if (!payment || !order) {
        console.log('❌ Não foi possível encontrar o pagamento ou pedido no banco.');
        console.log('Payment encontrado:', !!payment);
        console.log('Order encontrado:', !!order);
        return res.status(200).send('OK');
      }
      
      console.log('✅ Payment encontrado:', payment.id);
      console.log('✅ Order encontrado:', order.id);
      console.log('✅ Store ID:', storeId || order.store_id);
      
      // Usar storeId encontrado ou do order
      const finalStoreId = storeId || order.store_id;

      // Buscar informações atualizadas do pagamento no Mercado Pago
      try {
        // Verificar se a loja tem credenciais configuradas antes de tentar buscar
        if (!storeAcceptsMercadoPago(finalStoreId)) {
          console.log('Loja não tem credenciais do Mercado Pago configuradas, pulando busca de informações');
          // Retornar OK mesmo sem buscar informações
          return res.status(200).send('OK');
        }

        console.log('Buscando informações do pagamento no Mercado Pago...');
        console.log('Store ID:', finalStoreId);
        console.log('Payment ID:', paymentId.toString());
        
        const paymentInfo = await getPayment(finalStoreId, paymentId.toString());
        
        if (!paymentInfo) {
          console.error('❌ Não foi possível obter informações do pagamento no Mercado Pago');
          return res.status(200).send('OK');
        }
        
        console.log('✅ Informações do pagamento do Mercado Pago obtidas:', {
          id: paymentInfo.id,
          status: paymentInfo.status,
          status_detail: paymentInfo.status_detail,
          payment_method_id: paymentInfo.payment_method_id
        });
        
        // Atualizar status do pagamento
        const statusMap = {
          'approved': 'approved',
          'pending': 'pending',
          'in_process': 'pending',
          'rejected': 'rejected',
          'cancelled': 'cancelled',
          'refunded': 'refunded',
          'charged_back': 'refunded'
        };

        const newStatus = statusMap[paymentInfo.status] || 'pending';
        const paymentType = paymentInfo.payment_method_id || null;

        // Atualizar pagamento
        db.prepare(`
          UPDATE payments 
          SET status = ?, payment_type = ?, mp_payment_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newStatus, paymentType, paymentId.toString(), payment.id);

        // Atualizar pedido
        const orderStatus = newStatus === 'approved' ? 'confirmed' : 
                           newStatus === 'rejected' || newStatus === 'cancelled' ? 'cancelled' : 
                           order.status || 'pending';
        const paymentStatus = newStatus === 'approved' ? 'paid' : 
                             newStatus === 'rejected' || newStatus === 'cancelled' ? 'failed' : 
                             order.payment_status || 'pending';

        console.log('📝 Atualizando pedido:', {
          order_id: payment.order_id,
          order_status: orderStatus,
          payment_status: paymentStatus,
          payment_status_mp: newStatus
        });

        const updateResult = db.prepare(`
          UPDATE orders 
          SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(orderStatus, paymentStatus, payment.order_id);
        
        console.log('✅ Pedido atualizado. Linhas afetadas:', updateResult.changes);
        
        // Verificar se foi atualizado corretamente
        const updatedOrder = db.prepare('SELECT status, payment_status FROM orders WHERE id = ?').get(payment.order_id);
        console.log('✅ Status do pedido após atualização:', updatedOrder);

        // Criar notificações
        if (newStatus === 'approved') {
          // Notificar lojista
          const store = db.prepare('SELECT user_id FROM stores WHERE id = ?').get(finalStoreId);
          if (store) {
            await createNotification(store.user_id, 'order_paid', {
              order_id: payment.order_id,
              message: `Novo pedido pago: #${payment.order_id.slice(0, 8).toUpperCase()}`
            });
          }

          // Notificar cliente
          const orderData = db.prepare('SELECT user_id FROM orders WHERE id = ?').get(payment.order_id);
          if (orderData) {
            await createNotification(orderData.user_id, 'payment_approved', {
              order_id: payment.order_id,
              message: `Seu pagamento foi aprovado! Pedido #${payment.order_id.slice(0, 8).toUpperCase()}`
            });
          }
        }

        console.log('Pagamento atualizado:', {
          payment_id: payment.id,
          status: newStatus,
          order_id: payment.order_id
        });
      } catch (mpError) {
        console.error('Erro ao buscar informações do pagamento no Mercado Pago:', mpError);
        console.error('Detalhes do erro:', {
          message: mpError.message,
          code: mpError.code,
          status: mpError.status
        });
        // Retornar OK mesmo com erro, pois o webhook já foi recebido
        // O Mercado Pago espera 200 OK para não reenviar o webhook
        return res.status(200).send('OK');
      }
    } else {
      // Tipo de webhook não é 'payment', apenas retornar OK
      console.log('Webhook recebido com tipo diferente de payment:', type);
      return res.status(200).send('OK');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    console.error('Stack trace:', error.stack);
    // Retornar 200 OK mesmo com erro para evitar reenvios do Mercado Pago
    // Em produção, você pode querer logar o erro em um serviço de monitoramento
    res.status(200).send('OK');
  }
});

// Consultar status de pagamento
router.get('/:paymentId/status', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Verificar se o usuário tem acesso a este pagamento
    const order = db.prepare('SELECT user_id, store_id FROM orders WHERE id = ?').get(payment.order_id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar permissão (cliente ou lojista/admin)
    const isCustomer = order.user_id === req.user.id;
    const isStoreOwner = req.user.role === 'store' || req.user.role === 'admin';
    
    if (!isCustomer && !isStoreOwner) {
      return res.status(403).json({ error: 'Você não tem permissão para ver este pagamento' });
    }

    // Se tiver mp_payment_id, buscar informações atualizadas do Mercado Pago
    let mpPaymentInfo = null;
    if (payment.mp_payment_id && storeAcceptsMercadoPago(order.store_id)) {
      try {
        mpPaymentInfo = await getPayment(order.store_id, payment.mp_payment_id);
      } catch (error) {
        console.error('Erro ao buscar informações do Mercado Pago:', error);
      }
    }

    res.json({
      id: payment.id,
      order_id: payment.order_id,
      status: payment.status,
      payment_method: payment.payment_method,
      payment_type: payment.payment_type,
      amount: payment.amount,
      currency: payment.currency,
      mp_preference_id: payment.mp_preference_id,
      mp_payment_id: payment.mp_payment_id,
      mp_payment_info: mpPaymentInfo,
      created_at: payment.created_at,
      updated_at: payment.updated_at
    });
  } catch (error) {
    console.error('Erro ao consultar status de pagamento:', error);
    res.status(500).json({ error: 'Erro ao consultar status de pagamento' });
  }
});

// Cancelar pagamento
router.post('/:paymentId/cancel', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Verificar se o usuário tem permissão (apenas lojista/admin)
    const order = db.prepare('SELECT store_id FROM orders WHERE id = ?').get(payment.order_id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const store = db.prepare('SELECT user_id FROM stores WHERE id = ?').get(order.store_id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para cancelar este pagamento' });
    }

    // Só pode cancelar se estiver pendente
    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        error: `Não é possível cancelar um pagamento com status "${payment.status}"` 
      });
    }

    // Se tiver mp_payment_id, cancelar no Mercado Pago
    if (payment.mp_payment_id && storeAcceptsMercadoPago(order.store_id)) {
      try {
        await cancelPayment(order.store_id, payment.mp_payment_id);
      } catch (error) {
        console.error('Erro ao cancelar pagamento no Mercado Pago:', error);
        // Continuar mesmo com erro
      }
    }

    // Atualizar status no banco
    db.prepare(`
      UPDATE payments 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(paymentId);

    // Atualizar pedido
    db.prepare(`
      UPDATE orders 
      SET status = 'cancelled', payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payment.order_id);

    res.json({ message: 'Pagamento cancelado com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar pagamento:', error);
    res.status(500).json({ error: 'Erro ao cancelar pagamento' });
  }
});

export default router;

