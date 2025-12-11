# 🚀 Instalação Completa do Sistema

Este guia explica como instalar o sistema do zero, garantindo que todas as configurações, planos, categorias e dados iniciais sejam criados automaticamente.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- SQLite (já incluído) ou PostgreSQL configurado

## 🎯 Instalação Rápida

### 1. Clonar o Repositório

```bash
git clone https://github.com/jbapex/nativo.git
cd nativo
```

### 2. Instalar Dependências

```bash
# Instalar dependências do projeto
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp backend/.env.example backend/.env

# Editar com suas configurações
nano backend/.env
```

**Configurações mínimas necessárias:**
```env
NODE_ENV=development
PORT=3001
DB_TYPE=sqlite
DB_PATH=./database.sqlite
JWT_SECRET=seu_jwt_secret_aqui
```

### 4. Executar Setup Inicial

```bash
# Executa migrações + seed de dados iniciais
node backend/scripts/setup-inicial.js
```

Este script irá:
- ✅ Criar todas as tabelas do banco de dados
- ✅ Aplicar todas as migrações
- ✅ Criar 4 planos de assinatura (Gratuito, Básico, Profissional, Empresarial)
- ✅ Criar 10 categorias padrão
- ✅ Criar todas as configurações do sistema
- ✅ Configurar aparência padrão

### 5. Criar Usuário Admin

```bash
# Opção 1: Via script (se disponível)
node backend/scripts/criar-admin.js

# Opção 2: Via interface web
# 1. Inicie o servidor: npm run dev
# 2. Acesse http://localhost:3006
# 3. Faça registro e depois altere o role para 'admin' no banco
```

### 6. Iniciar o Sistema

```bash
npm run dev
```

O sistema estará disponível em:
- **Frontend:** http://localhost:3006
- **Backend API:** http://localhost:3001/api

## 📊 O Que É Criado Automaticamente

### Planos de Assinatura (4)
- ✅ **Gratuito** - R$ 0,00 (10 produtos)
- ✅ **Básico** - R$ 29,90 (50 produtos)
- ✅ **Profissional** - R$ 79,90 (200 produtos)
- ✅ **Empresarial** - R$ 199,90 (ilimitado)

### Categorias (10)
- ✅ Alimentos e Bebidas
- ✅ Roupas e Acessórios
- ✅ Eletrônicos
- ✅ Casa e Decoração
- ✅ Beleza e Cuidados
- ✅ Esportes e Lazer
- ✅ Livros e Mídia
- ✅ Brinquedos e Jogos
- ✅ Automotivo
- ✅ Outros

### Configurações do Sistema
- ✅ Configurações gerais (nome do site, email, etc.)
- ✅ Configurações de usuários
- ✅ Configurações de segurança
- ✅ Configurações de integrações
- ✅ Configurações de cobrança
- ✅ Configurações de cadastro de loja
- ✅ Configurações de aparência (cores, logo, etc.)

## 🔄 Reinstalação Completa

Se quiser reinstalar do zero:

```bash
# 1. Remover banco de dados antigo (se existir)
rm -f backend/database.sqlite
rm -f backend/database/*.db
rm -f backend/database/*.sqlite

# 2. Executar setup inicial
node backend/scripts/setup-inicial.js

# 3. Criar usuário admin
node backend/scripts/criar-admin.js

# 4. Iniciar sistema
npm run dev
```

## 🗄️ Banco de Dados

### SQLite (Padrão)
- Arquivo: `backend/database.sqlite`
- Criado automaticamente no primeiro uso
- Não requer configuração adicional

### PostgreSQL (Opcional)
1. Instalar PostgreSQL
2. Criar banco de dados
3. Configurar no `.env`:
   ```env
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nativo
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   ```
4. Executar `node backend/scripts/setup-inicial.js`

## 📝 Scripts Disponíveis

### Setup Inicial Completo
```bash
node backend/scripts/setup-inicial.js
```
Executa migrações + seed de dados iniciais

### Apenas Migrações
```bash
node backend/scripts/aplicar-migracoes.js
```

### Apenas Seed (Dados Iniciais)
```bash
node backend/scripts/seed-inicial.js
```

### Exportar Configurações
```bash
node backend/scripts/exportar-configuracoes-admin.js
```

### Importar Configurações
```bash
node backend/scripts/importar-configuracoes-admin.js configs-admin-export.json
```

## ⚠️ Importante

- **NUNCA** faça commit de arquivos `.env` ou bancos de dados
- **SEMPRE** faça backup antes de reinstalar
- Os dados iniciais são criados automaticamente, mas você pode personalizar depois

## 🐛 Solução de Problemas

### Erro: "Cannot find module"
```bash
npm install
cd backend && npm install && cd ..
```

### Erro: "Database locked" (SQLite)
```bash
# Parar todos os processos Node
pkill -f node
# Tentar novamente
```

### Erro: "Table already exists"
```bash
# Remover banco e recriar
rm -f backend/database.sqlite
node backend/scripts/setup-inicial.js
```

## 📚 Próximos Passos

Após instalação:
1. ✅ Configure o arquivo `.env` com suas credenciais
2. ✅ Crie um usuário admin
3. ✅ Personalize as configurações via painel admin
4. ✅ Configure domínio e SSL (em produção)
5. ✅ Configure backup automático do banco

---

**Última atualização:** 2024

