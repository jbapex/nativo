import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import storeRoutes from '../routes/stores.js';
import authRoutes from '../routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);

describe('Stores Routes', () => {
  let authToken = '';
  let storeOwnerToken = '';
  let testStore = {
    name: 'Loja Teste',
    description: 'Descrição da loja teste',
    store_type: 'physical',
    whatsapp: '5511999999999',
  };

  beforeAll(async () => {
    // Criar usuário store owner
    const testUser = {
      email: `test-store-owner-${Date.now()}@example.com`,
      password: 'test123456',
      full_name: 'Test Store Owner',
      role: 'store',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    storeOwnerToken = registerRes.body.token;

    // Criar usuário customer
    const customerUser = {
      email: `test-customer-${Date.now()}@example.com`,
      password: 'test123456',
      full_name: 'Test Customer',
      role: 'customer',
    };

    const customerRes = await request(app)
      .post('/api/auth/register')
      .send(customerUser);

    authToken = customerRes.body.token;
  });

  describe('GET /api/stores', () => {
    it('deve listar lojas sem autenticação', async () => {
      const res = await request(app)
        .get('/api/stores')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('deve suportar paginação', async () => {
      const res = await request(app)
        .get('/api/stores?page=1&limit=5')
        .expect(200);

      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('POST /api/stores', () => {
    it('deve retornar erro sem autenticação', async () => {
      const res = await request(app)
        .post('/api/stores')
        .send(testStore)
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro se não for store owner', async () => {
      const res = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testStore)
        .expect(403);

      expect(res.body).toHaveProperty('error');
    });

    it('deve validar campos obrigatórios', async () => {
      const res = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('deve criar loja com dados válidos', async () => {
      const res = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(testStore)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', testStore.name);
      expect(res.body).toHaveProperty('status', 'pending');
    });
  });
});

