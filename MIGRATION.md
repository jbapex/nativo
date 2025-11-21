# Guia de Migração: Base44 → Banco de Dados Próprio

Este guia explica como migrar do Base44 para o banco de dados próprio.

## 📋 Passo a Passo

### 1. Instalar e Configurar o Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações
npm run dev
```

### 2. Testar o Backend

O backend estará rodando em `http://localhost:3001`. Teste acessando:
- `http://localhost:3001/api/health` - Deve retornar `{ status: 'ok' }`

### 3. Atualizar o Frontend

#### Opção A: Migração Gradual (Recomendado)

1. Mantenha o `base44Client.js` funcionando
2. Crie um arquivo de configuração para alternar entre Base44 e API própria:

```javascript
// src/api/config.js
export const USE_LOCAL_API = true; // Mude para false para voltar ao Base44

export const getEntities = () => {
  if (USE_LOCAL_API) {
    return require('./entities-local.js');
  } else {
    return require('./entities.js');
  }
};
```

2. Atualize os imports gradualmente, arquivo por arquivo.

#### Opção B: Migração Completa

1. Substitua todos os imports de `entities.js` para `entities-local.js`
2. Atualize o `base44Client.js` para usar a nova API

### 4. Configurar Variável de Ambiente

No frontend, adicione no `.env` ou `vite.config.js`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 5. Migrar Dados do Base44

1. Exporte os dados do Base44 (se possível)
2. Crie scripts de migração para importar:
   - Usuários
   - Lojas
   - Produtos
   - Categorias
   - Cidades
   - Planos e Assinaturas

### 6. Testar Funcionalidades

Teste todas as funcionalidades:
- ✅ Login/Logout
- ✅ Listar produtos
- ✅ Criar/Editar/Deletar produtos
- ✅ Gerenciar categorias
- ✅ Gerenciar lojas
- ✅ Painel admin

## 🔄 Diferenças Importantes

### Autenticação

**Base44:**
```javascript
User.login(); // Redireciona para Base44
```

**API Própria:**
```javascript
User.login(email, password); // Retorna token JWT
```

### Listagem

**Base44:**
```javascript
Product.list("-created_date", 50);
```

**API Própria:**
```javascript
Product.list("-created_date", 50); // Mesma interface!
```

### Filtros

**Base44:**
```javascript
Product.filter({ active: true });
```

**API Própria:**
```javascript
Product.filter({ active: true }); // Mesma interface!
```

## 📝 Próximos Passos

Após a migração:

1. ✅ Remover dependência do `@base44/sdk`
2. ✅ Adicionar mais rotas (Stores, Cities, etc)
3. ✅ Implementar upload de imagens
4. ✅ Adicionar testes
5. ✅ Configurar PostgreSQL para produção
6. ✅ Adicionar backup automático

## 🆘 Problemas Comuns

### CORS Error
- Verifique se `CORS_ORIGIN` no `.env` do backend está correto
- Deve ser `http://localhost:3006` (ou a porta do seu frontend)

### Token não encontrado
- Verifique se o token está sendo salvo em `localStorage`
- Verifique se o header `Authorization` está sendo enviado

### 401 Unauthorized
- Verifique se o token é válido
- Faça login novamente

