import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import productRoutes from '../routes/products.js';
import authRoutes from '../routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

describe('Products Routes', () => {
  let authToken = '';
  let storeId = '';
  let testProduct = {
    name: 'Produto Teste',
    description: 'Descrição do produto teste',
    price: 99.99,
    stock: 10
  };

  beforeAll(async () => {
    // Criar usuário de teste e fazer login
    const testUser = {
      email: `test-store-${Date.now()}@example.com`,
      password: 'test123456',
      full_name: 'Test Store Owner',
      role: 'store'
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerRes.body.token;

    // Criar loja de teste (simulado - em teste real precisaria criar a loja)
    // Por enquanto, vamos testar apenas validações
  });

  describe('GET /api/products', () => {
    it('deve listar produtos sem autenticação', async () => {
      const res = await request(app)
        .get('/api/products')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('deve retornar erro sem autenticação', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(testProduct)
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve validar campos obrigatórios', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('deve validar formato de preço', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testProduct,
          price: -10
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('deve validar tamanho máximo do nome', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testProduct,
          name: 'a'.repeat(201) // Nome muito longo
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });
});

