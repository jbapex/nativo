import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  let testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'test123456',
    full_name: 'Test User'
  };

  let authToken = '';

  describe('POST /api/auth/register', () => {
    it('deve criar um novo usuário', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.full_name).toBe(testUser.full_name);
      expect(res.body.user).not.toHaveProperty('password_hash');
      
      authToken = res.body.token;
    });

    it('deve retornar erro se email já existe', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro se dados inválidos', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro se email não existe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('deve retornar erro sem token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });
});

