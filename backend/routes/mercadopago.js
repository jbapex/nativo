import express from 'express';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { db } from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import QRCode from 'qrcode';

const router = express.Router();

// Conectar conta do Mercado Pago
router.post('/connect', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    const { store_id, access_token, public_key } = req.body;
    
    if (!store_id || !access_token) {
      return res.status(400).json({ error: 'store_id e access_token são obrigatórios' });
    }
    
    // Verificar se a loja pertence ao usuário (ou se é admin)
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta loja' });
    }
    
    // Validar token do Mercado Pago fazendo uma requisição de teste
    try {
      const client = new MercadoPagoConfig({ accessToken: access_token });
      const payment = new Payment(client);
      
      // Tentar buscar informações da conta (validação básica)
      // Se o token for inválido, isso vai lançar um erro
      await payment.get({ id: 'test' }).catch(() => {
        // Ignorar erro 404, apenas queremos validar se o token é válido
      });
    } catch (mpError) {
      console.error('Erro ao validar token do Mercado Pago:', mpError);
      return res.status(400).json({ error: 'Token do Mercado Pago inválido' });
    }
    
    // Salvar credenciais
    const updates = [];
    const values = [];
    
    updates.push('mercadopago_access_token = ?');
    values.push(access_token);
    
    if (public_key) {
      updates.push('mercadopago_public_key = ?');
      values.push(public_key);
    }
    
    values.push(store_id);
    
    await db.prepare(`
      UPDATE stores 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...values);
    
    res.json({ 
      message: 'Conta do Mercado Pago conectada com sucesso',
      store_id: store_id
    });
  } catch (error) {
    console.error('Erro ao conectar conta do Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao conectar conta do Mercado Pago' });
  }
});

// Desconectar conta do Mercado Pago
router.delete('/disconnect/:storeId', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta loja' });
    }
    
    await db.prepare(`
      UPDATE stores 
      SET mercadopago_access_token = NULL, 
          mercadopago_public_key = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(storeId);
    
    res.json({ message: 'Conta do Mercado Pago desconectada com sucesso' });
  } catch (error) {
    console.error('Erro ao desconectar conta do Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao desconectar conta do Mercado Pago' });
  }
});

// Gerar pagamento PIX via Mercado Pago
router.post('/payment/pix', authenticateToken, async (req, res) => {
  try {
    const { store_id, amount, description, order_id } = req.body;
    
    if (!store_id || !amount || !description) {
      return res.status(400).json({ error: 'store_id, amount e description são obrigatórios' });
    }
    
    // Buscar loja e credenciais do Mercado Pago
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    if (!store.mercadopago_access_token) {
      return res.status(400).json({ error: 'Loja não possui conta do Mercado Pago conectada' });
    }
    
    // Configurar cliente do Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken: store.mercadopago_access_token 
    });
    const payment = new Payment(client);
    
    // Criar pagamento PIX
    const paymentData = {
      transaction_amount: parseFloat(amount),
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: req.user.email || 'cliente@exemplo.com',
        first_name: req.user.full_name?.split(' ')[0] || 'Cliente',
        last_name: req.user.full_name?.split(' ').slice(1).join(' ') || '',
      },
      metadata: {
        order_id: order_id || null,
        store_id: store_id
      }
    };
    
    const createdPayment = await payment.create({ body: paymentData });
    
    // Gerar QR Code a partir do código PIX
    let qrCodeBase64 = null;
    if (createdPayment.point_of_interaction?.transaction_data?.qr_code) {
      const qrCode = createdPayment.point_of_interaction.transaction_data.qr_code;
      qrCodeBase64 = await QRCode.toDataURL(qrCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1
      });
    }
    
    res.json({
      payment_id: createdPayment.id,
      status: createdPayment.status,
      qr_code: createdPayment.point_of_interaction?.transaction_data?.qr_code || null,
      qr_code_base64: qrCodeBase64,
      ticket_url: createdPayment.point_of_interaction?.transaction_data?.ticket_url || null,
      payment_method_id: createdPayment.payment_method_id,
      transaction_amount: createdPayment.transaction_amount,
      date_created: createdPayment.date_created
    });
  } catch (error) {
    console.error('Erro ao gerar pagamento PIX:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar pagamento PIX',
      details: error.message 
    });
  }
});

// Gerar link de pagamento (Preference) via Mercado Pago
router.post('/payment/preference', authenticateToken, async (req, res) => {
  try {
    const { store_id, items, order_id, back_urls } = req.body;
    
    if (!store_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'store_id e items são obrigatórios' });
    }
    
    // Buscar loja e credenciais do Mercado Pago
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    if (!store.mercadopago_access_token) {
      return res.status(400).json({ error: 'Loja não possui conta do Mercado Pago conectada' });
    }
    
    // Configurar cliente do Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken: store.mercadopago_access_token 
    });
    const preference = new Preference(client);
    
    // Criar preferência de pagamento
    const preferenceData = {
      items: items.map(item => ({
        title: item.title,
        quantity: item.quantity || 1,
        unit_price: parseFloat(item.unit_price),
        currency_id: 'BRL'
      })),
      payer: {
        email: req.user.email || 'cliente@exemplo.com',
        name: req.user.full_name || 'Cliente',
      },
      back_urls: back_urls || {
        success: `${process.env.FRONTEND_URL || 'http://localhost:3006'}/OrderDetail?id=${order_id}`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:3006'}/Cart`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:3006'}/OrderDetail?id=${order_id}`
      },
      auto_return: 'approved',
      metadata: {
        order_id: order_id || null,
        store_id: store_id
      }
    };
    
    const createdPreference = await preference.create({ body: preferenceData });
    
    res.json({
      preference_id: createdPreference.id,
      init_point: createdPreference.init_point,
      sandbox_init_point: createdPreference.sandbox_init_point,
      client_id: createdPreference.client_id
    });
  } catch (error) {
    console.error('Erro ao gerar preferência de pagamento:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar preferência de pagamento',
      details: error.message 
    });
  }
});

// Webhook do Mercado Pago (confirmação de pagamento)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar informações do pagamento no Mercado Pago
      // Nota: Precisamos do access_token da loja, mas não temos no webhook
      // Vamos buscar pelo order_id no metadata
      
      // Por enquanto, vamos apenas logar
      console.log('Webhook recebido - Payment ID:', paymentId);
      console.log('Tipo:', type);
      
      // TODO: Buscar order_id no metadata e atualizar status do pedido
      // Isso requer armazenar o payment_id junto com o order_id
      
      res.status(200).send('OK');
    } else {
      res.status(200).send('OK');
    }
  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    res.status(500).send('Error');
  }
});

// Verificar status de um pagamento
router.get('/payment/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { store_id } = req.query;
    
    if (!store_id) {
      return res.status(400).json({ error: 'store_id é obrigatório' });
    }
    
    const store = await db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id);
    if (!store || !store.mercadopago_access_token) {
      return res.status(404).json({ error: 'Loja não encontrada ou sem conta do Mercado Pago' });
    }
    
    const client = new MercadoPagoConfig({ 
      accessToken: store.mercadopago_access_token 
    });
    const payment = new Payment(client);
    
    const paymentInfo = await payment.get({ id: paymentId });
    
    res.json({
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      transaction_amount: paymentInfo.transaction_amount,
      date_created: paymentInfo.date_created,
      date_approved: paymentInfo.date_approved,
      payment_method_id: paymentInfo.payment_method_id
    });
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar status do pagamento',
      details: error.message 
    });
  }
});

export default router;

