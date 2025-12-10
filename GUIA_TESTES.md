# 🧪 Guia de Testes

Este projeto usa **Vitest** para testes unitários e de integração.

## 📋 Estrutura

```
backend/
  tests/
    auth.test.js          # Testes de autenticação
    products.test.js      # Testes de produtos
    stores.test.js        # Testes de lojas
    orders.test.js        # Testes de pedidos
    utils.test.js         # Testes de utilitários
```

## 🚀 Executar Testes

### Todos os Testes
```bash
cd backend
npm test
```

### Modo Watch (desenvolvimento)
```bash
npm run test:watch
```

### Interface Visual
```bash
npm run test:ui
```

### Com Coverage
```bash
npm run test:coverage
```

## 📊 Cobertura de Testes

### Meta: 60% de cobertura

**Status Atual:**
- ✅ Autenticação (auth.test.js)
- ✅ Produtos (products.test.js)
- ✅ Lojas (stores.test.js)
- ✅ Pedidos (orders.test.js)
- ✅ Utilitários (utils.test.js)

### Áreas Cobertas

1. **Autenticação**
   - Registro de usuário
   - Login
   - Validação de token
   - Erros de autenticação

2. **Produtos**
   - Listagem pública
   - Criação (com validação)
   - Validação de campos
   - Permissões

3. **Lojas**
   - Listagem pública
   - Criação (com validação)
   - Permissões (store owner)
   - Paginação

4. **Pedidos**
   - Listagem (autenticado)
   - Criação (com validação)
   - Validação de itens

5. **Utilitários**
   - Sanitização HTML
   - Paginação
   - Validações

## ✍️ Escrever Novos Testes

### Estrutura Básica

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import yourRoutes from '../routes/your-route.js';

const app = express();
app.use(express.json());
app.use('/api/your-route', yourRoutes);

describe('Your Route', () => {
  let authToken = '';

  beforeAll(async () => {
    // Setup inicial (criar usuário, etc.)
  });

  describe('GET /api/your-route', () => {
    it('deve fazer algo', async () => {
      const res = await request(app)
        .get('/api/your-route')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });
});
```

### Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Setup/Teardown**: Use `beforeAll` e `afterAll` para preparar dados
3. **Nomes Descritivos**: Use nomes que descrevam o que o teste faz
4. **AAA Pattern**: Arrange, Act, Assert
5. **Testar Erros**: Teste tanto casos de sucesso quanto de erro

### Exemplo Completo

```javascript
describe('POST /api/products', () => {
  it('deve criar produto com dados válidos', async () => {
    // Arrange
    const productData = {
      name: 'Produto Teste',
      price: 99.99,
      description: 'Descrição',
    };

    // Act
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(productData)
      .expect(201);

    // Assert
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(productData.name);
  });

  it('deve retornar erro sem autenticação', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test' })
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });
});
```

## 🔍 Verificar Coverage

Após executar `npm run test:coverage`, você verá:

```
Test Files  1 passed (1)
     Tests  15 passed (15)
  Start at  10:00:00
  Duration  2.5s

Coverage:
  Statements: 45.23%
  Branches:   38.12%
  Functions:  52.34%
  Lines:      45.23%
```

### Meta de Cobertura

- **Statements:** 60%+
- **Branches:** 50%+
- **Functions:** 60%+
- **Lines:** 60%+

## 📝 Próximos Testes a Adicionar

- [ ] Testes de pagamentos (Mercado Pago)
- [ ] Testes de webhooks
- [ ] Testes de upload de arquivos
- [ ] Testes de validação de imagens
- [ ] Testes de cache
- [ ] Testes de backup
- [ ] Testes de integração end-to-end

## 🐛 Debugging

### Executar Teste Específico

```bash
npm test -- stores.test.js
```

### Executar Teste com Nome Específico

```bash
npm test -- -t "deve criar loja"
```

### Verbose Mode

```bash
npm test -- --reporter=verbose
```

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ Checklist

- [ ] Todos os testes passando
- [ ] Coverage acima de 60%
- [ ] Testes de erro implementados
- [ ] Testes de validação implementados
- [ ] Testes de permissões implementados

