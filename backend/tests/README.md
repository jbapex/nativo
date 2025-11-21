# Testes - Backend API

Este diretório contém os testes automatizados para a API do backend.

## Instalação

As dependências de teste já estão instaladas. Se necessário, instale novamente:

```bash
npm install
```

## Executar Testes

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch (desenvolvimento)
```bash
npm test -- --watch
```

### Executar testes com interface gráfica
```bash
npm run test:ui
```

### Executar testes com cobertura
```bash
npm run test:coverage
```

## Estrutura dos Testes

- `auth.test.js` - Testes de autenticação (login, registro, validação)
- `products.test.js` - Testes de produtos (validação, permissões)

## Adicionar Novos Testes

1. Crie um novo arquivo `*.test.js` no diretório `tests/`
2. Importe as dependências necessárias
3. Use `describe` para agrupar testes relacionados
4. Use `it` ou `test` para testes individuais
5. Use `expect` para asserções

Exemplo:
```javascript
import { describe, it, expect } from 'vitest';

describe('Minha Feature', () => {
  it('deve fazer algo', () => {
    expect(true).toBe(true);
  });
});
```

## Notas

- Os testes usam Vitest como framework
- Supertest é usado para testar rotas HTTP
- Cada teste deve ser independente e isolado

