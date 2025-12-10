import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import orderRoutes from '../routes/orders.js';
import authRoutes from '../routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

describe('Orders Routes', () => {
  let customerToken = '';
  let storeOwnerToken = '';

  beforeAll(async () => {
    // Criar usuário customer
    const customerUser = {
      email: `test-customer-orders-${Date.now()}@example.com`,
      password: 'test123456',
      full_name: 'Test Customer',
      role: 'customer',
    };

    const customerRes = await request(app)
      .post('/api/auth/register')
      .send(customerUser);

    customerToken = customerRes.body.token;

    // Criar usuário store owner
    const storeUser = {
      email: `test-store-orders-${Date.now()}@example.com`,
      password: 'test123456',
      full_name: 'Test Store Owner',
      role: 'store',
    };

    const storeRes = await request(app)
      .post('/api/auth/register')
      .send(storeUser);

    storeOwnerToken = storeRes.body.token;
  });

  describe('GET /api/orders', () => {
    it('deve retornar erro sem autenticação', async () => {
      const res = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve listar pedidos do usuário autenticado', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    it('deve retornar erro sem autenticação', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          store_id: 'test-store-id',
          items: [],
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve validar campos obrigatórios', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('deve validar que items não está vazio', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          store_id: 'test-store-id',
          items: [],
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });
});

