# Backend API - Local Mart

Backend completo com banco de dados próprio para substituir o Base44.

## 🚀 Instalação

```bash
cd backend
npm install
```

## ⚙️ Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o `.env` com suas configurações:
```
PORT=3001
JWT_SECRET=seu-secret-super-seguro-aqui
CORS_ORIGIN=http://localhost:3006
DB_PATH=./database.sqlite
```

## 🗄️ Banco de Dados

O banco de dados SQLite é criado automaticamente na primeira execução. O arquivo `database.sqlite` será criado na pasta `backend/`.

### Estrutura do Banco

- **users**: Usuários do sistema (user, store, admin)
- **stores**: Lojas cadastradas
- **products**: Produtos das lojas
- **categories**: Categorias de produtos
- **cities**: Cidades
- **plans**: Planos de assinatura
- **subscriptions**: Assinaturas ativas

### Usuário Admin Padrão

- **Email**: admin@localmart.com
- **Senha**: admin123

⚠️ **IMPORTANTE**: Altere a senha do admin em produção!

## 🏃 Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor estará disponível em `http://localhost:3001`

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter usuário atual (requer auth)
- `PUT /api/auth/me` - Atualizar dados do usuário (requer auth)
- `POST /api/auth/logout` - Logout (requer auth)

### Produtos
- `GET /api/products` - Listar produtos (público)
- `GET /api/products/:id` - Obter produto (público)
- `POST /api/products` - Criar produto (requer auth, role: store/admin)
- `PUT /api/products/:id` - Atualizar produto (requer auth, role: store/admin)
- `DELETE /api/products/:id` - Deletar produto (requer auth, role: store/admin)

### Categorias
- `GET /api/categories` - Listar categorias (público)
- `GET /api/categories/:id` - Obter categoria (público)
- `POST /api/categories` - Criar categoria (requer auth, role: admin)
- `PUT /api/categories/:id` - Atualizar categoria (requer auth, role: admin)
- `DELETE /api/categories/:id` - Deletar categoria (requer auth, role: admin)

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens). Após fazer login, inclua o token no header:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 🔄 Migração do Base44

Para migrar do Base44 para este backend:

1. Exporte os dados do Base44
2. Crie scripts de migração para importar os dados
3. Atualize o frontend para usar a nova API

## 📝 Próximos Passos

- [ ] Adicionar rotas para Stores
- [ ] Adicionar rotas para Cities
- [ ] Adicionar rotas para Plans e Subscriptions
- [ ] Adicionar upload de imagens
- [ ] Adicionar paginação
- [ ] Adicionar filtros avançados
- [ ] Migrar para PostgreSQL em produção

