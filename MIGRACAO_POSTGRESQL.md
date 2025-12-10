# 🐘 Guia de Migração: SQLite → PostgreSQL

Este guia explica como migrar o sistema de SQLite para PostgreSQL.

## 📋 Pré-requisitos

1. **PostgreSQL instalado** (versão 12 ou superior)
2. **Banco de dados criado** no PostgreSQL
3. **Credenciais de acesso** ao banco

## 🚀 Passo a Passo

### 1. Instalar PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Baixe do site oficial: https://www.postgresql.org/download/windows/

### 2. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE local_mart;

# Criar usuário (opcional)
CREATE USER local_mart_user WITH PASSWORD 'sua-senha-segura';
GRANT ALL PRIVILEGES ON DATABASE local_mart TO local_mart_user;

# Sair
\q
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env` no diretório `backend/`:

```env
# Banco de Dados
DB_TYPE=postgres

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=local_mart
DB_USER=postgres
DB_PASSWORD=sua-senha-aqui
```

### 4. Executar Migração

```bash
cd backend
node scripts/migrate-to-postgres.js
```

O script irá:
- ✅ Conectar ao SQLite e PostgreSQL
- ✅ Criar o schema no PostgreSQL
- ✅ Migrar todos os dados
- ✅ Verificar integridade

### 5. Verificar Migração

```bash
# Conectar ao PostgreSQL
psql -U postgres -d local_mart

# Verificar tabelas
\dt

# Contar registros
SELECT 
  'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

# Sair
\q
```

### 6. Reiniciar Servidor

```bash
cd backend
npm run dev
```

O servidor deve conectar ao PostgreSQL automaticamente.

## ⚠️ Diferenças Importantes

### SQLite vs PostgreSQL

| Aspecto | SQLite | PostgreSQL |
|---------|--------|------------|
| **Tipo de dados** | TEXT, INTEGER, REAL | VARCHAR, INTEGER, DECIMAL, TIMESTAMP |
| **IDs** | TEXT (UUID como string) | UUID (tipo nativo) |
| **Booleanos** | INTEGER (0/1) | BOOLEAN (true/false) |
| **Datas** | DATETIME (texto) | TIMESTAMP |
| **Placeholders** | `?` | `$1, $2, ...` |
| **Execução** | Síncrona | Assíncrona |

### Mudanças no Código

O código atual usa `better-sqlite3` que é **síncrono**. PostgreSQL é **assíncrono**.

**Exemplo SQLite (síncrono):**
```javascript
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

**Exemplo PostgreSQL (assíncrono):**
```javascript
const user = await db.prepare('SELECT * FROM users WHERE id = $1').get(userId);
```

### Status Atual

✅ **Infraestrutura criada:**
- Schema PostgreSQL (`postgres-schema.sql`)
- Wrapper de compatibilidade (`db-postgres.js`)
- Script de migração (`migrate-to-postgres.js`)
- Configuração de ambiente

⚠️ **Atenção:**
- O código atual ainda usa SQLite por padrão
- Para usar PostgreSQL, você precisa:
  1. Configurar `DB_TYPE=postgres` no `.env`
  2. Atualizar o código para usar `await` nas queries (quando necessário)
  3. Ou usar o wrapper que já faz a conversão automaticamente

## 🔧 Troubleshooting

### Erro: "Connection refused"

**Causa:** PostgreSQL não está rodando.

**Solução:**
```bash
# Verificar status
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Iniciar
brew services start postgresql@14  # macOS
sudo systemctl start postgresql  # Linux
```

### Erro: "database does not exist"

**Causa:** Banco de dados não foi criado.

**Solução:**
```bash
psql -U postgres
CREATE DATABASE local_mart;
\q
```

### Erro: "password authentication failed"

**Causa:** Senha incorreta no `.env`.

**Solução:**
1. Verificar senha no `.env`
2. Ou redefinir senha do PostgreSQL:
```bash
psql -U postgres
ALTER USER postgres WITH PASSWORD 'nova-senha';
\q
```

### Erro: "syntax error at or near '$1'"

**Causa:** Query SQL não foi convertida corretamente.

**Solução:**
O wrapper `db-postgres.js` converte automaticamente `?` para `$1, $2, ...`. Se ainda houver erro, verifique a query SQL.

## 📚 Recursos

- [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- [Node.js pg](https://node-postgres.com/)
- [Migração SQLite → PostgreSQL](https://www.postgresql.org/docs/current/migration.html)

## ✅ Checklist de Migração

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `local_mart` criado
- [ ] Variáveis de ambiente configuradas
- [ ] Script de migração executado com sucesso
- [ ] Dados verificados no PostgreSQL
- [ ] Servidor reiniciado e testado
- [ ] Backup do SQLite criado (recomendado)

## 🔄 Reverter para SQLite

Se precisar voltar para SQLite:

1. Edite `.env`:
```env
DB_TYPE=sqlite
DB_PATH=./database.sqlite
```

2. Reinicie o servidor

O sistema voltará a usar SQLite automaticamente.

