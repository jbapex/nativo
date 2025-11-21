import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../database/db.js';

/**
 * Obter cliente do Mercado Pago para uma loja
 * @param {string} storeId - ID da loja
 * @returns {MercadoPagoConfig|null} - Cliente configurado ou null se não tiver credenciais
 */
export function getMercadoPagoClient(storeId) {
  console.log('=== DEBUG getMercadoPagoClient ===');
  console.log('Store ID:', storeId);
  
  const store = db.prepare('SELECT mercadopago_access_token FROM stores WHERE id = ?').get(storeId);
  
  console.log('Store encontrada:', !!store);
  console.log('Tem access_token:', !!store?.mercadopago_access_token);
  console.log('Access token (primeiros 10 chars):', store?.mercadopago_access_token?.substring(0, 10) || 'N/A');
  
  if (!store || !store.mercadopago_access_token) {
    console.log('Retornando null - loja não tem credenciais');
    return null;
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: store.mercadopago_access_token
    });
    console.log('Cliente do Mercado Pago criado com sucesso');
    return client;
  } catch (error) {
    console.error('Erro ao criar cliente do Mercado Pago:', error);
    throw error;
  }
}

/**
 * Verificar se loja aceita Mercado Pago
 * @param {string} storeId - ID da loja
 * @returns {boolean}
 */
export function storeAcceptsMercadoPago(storeId) {
  const store = db.prepare('SELECT payment_methods, mercadopago_access_token FROM stores WHERE id = ?').get(storeId);
  
  if (!store) {
    return false;
  }

  // Parse payment_methods
  let paymentMethods = ['whatsapp']; // Default
  if (store.payment_methods) {
    try {
      paymentMethods = typeof store.payment_methods === 'string' 
        ? JSON.parse(store.payment_methods) 
        : store.payment_methods;
    } catch (e) {
      paymentMethods = ['whatsapp'];
    }
  }

  // Verificar se aceita Mercado Pago E tem credenciais configuradas
  return paymentMethods.includes('mercadopago') && !!store.mercadopago_access_token;
}

/**
 * Criar preferência de pagamento no Mercado Pago
 * @param {string} storeId - ID da loja
 * @param {Object} preferenceData - Dados da preferência
 * @returns {Promise<Object>} - Preferência criada
 */
export async function createPreference(storeId, preferenceData) {
  const client = getMercadoPagoClient(storeId);
  
  if (!client) {
    throw new Error('Loja não possui credenciais do Mercado Pago configuradas');
  }

  const preference = new Preference(client);
  const createdPreference = await preference.create({ body: preferenceData });
  
  return createdPreference;
}

/**
 * Obter informações de um pagamento
 * @param {string} storeId - ID da loja
 * @param {string} paymentId - ID do pagamento no Mercado Pago
 * @returns {Promise<Object>} - Informações do pagamento
 */
export async function getPayment(storeId, paymentId) {
  const client = getMercadoPagoClient(storeId);
  
  if (!client) {
    throw new Error('Loja não possui credenciais do Mercado Pago configuradas');
  }

  const payment = new Payment(client);
  const paymentInfo = await payment.get({ id: paymentId });
  
  return paymentInfo;
}

/**
 * Cancelar um pagamento
 * @param {string} storeId - ID da loja
 * @param {string} paymentId - ID do pagamento no Mercado Pago
 * @returns {Promise<Object>} - Pagamento cancelado
 */
export async function cancelPayment(storeId, paymentId) {
  const client = getMercadoPagoClient(storeId);
  
  if (!client) {
    throw new Error('Loja não possui credenciais do Mercado Pago configuradas');
  }

  const payment = new Payment(client);
  const cancelledPayment = await payment.cancel({ id: paymentId });
  
  return cancelledPayment;
}

