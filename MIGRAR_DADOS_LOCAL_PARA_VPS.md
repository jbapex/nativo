# 📦 Guia: Migrar Dados do SQLite Local para PostgreSQL da VPS

## ✅ Pré-requisitos

- ✅ Túnel SSH ativo (porta 5434)
- ✅ Backend conectado ao PostgreSQL da VPS
- ✅ Arquivo SQLite local (`backend/database.sqlite`)
- ✅ `.env` configurado para PostgreSQL

## 🚀 Passo a Passo

### 1. Verificar Túnel SSH

Certifique-se de que o túnel SSH está ativo:

```bash
# Em outro terminal, você deve ter:
./tunnel-postgres.sh
# Ou
ssh -L 5434:localhost:5432 root@nativo.jbapex.com.br
```

### 2. Verificar Configuração

```bash
cd backend
cat .env | grep DB_
```

Deve mostrar:
```
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5434
DB_NAME=nativo_db
DB_USER=nativo_user
DB_PASSWORD=Nativo2025SecureDB
```

### 3. Verificar Dados no SQLite

```bash
# Ver tabelas disponíveis
sqlite3 backend/database.sqlite ".tables"

# Contar registros em tabelas principais
sqlite3 backend/database.sqlite "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'stores', COUNT(*) FROM stores UNION ALL SELECT 'products', COUNT(*) FROM products;"
```

### 4. Executar Migração

```bash
cd backend
node scripts/migrate-to-postgres.js
```

O script irá:
- ✅ Conectar ao SQLite local
- ✅ Conectar ao PostgreSQL via túnel SSH
- ✅ Criar schema se necessário
- ✅ Migrar todos os dados
- ✅ Verificar integridade

### 5. Verificar Migração

```bash
# Conectar ao PostgreSQL via túnel
PGPASSWORD='Nativo2025SecureDB' psql -h localhost -p 5434 -U nativo_user -d nativo_db

# Verificar tabelas e contagens
\dt
SELECT 'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories;

\q
```

## ⚠️ Observações Importantes

1. **Backup**: O script usa `ON CONFLICT DO NOTHING`, então não duplica dados
2. **IDs**: IDs TEXT do SQLite são preservados no PostgreSQL
3. **Foreign Keys**: O script mapeia referências automaticamente
4. **Tempo**: A migração pode levar alguns minutos dependendo do volume de dados

## 🔄 Se Algo Der Errado

### Limpar dados migrados (se necessário):

```sql
-- CUIDADO: Isso apaga TODOS os dados!
TRUNCATE TABLE products, stores, users, categories CASCADE;
```

### Re-executar migração:

```bash
node scripts/migrate-to-postgres.js
```

## ✅ Após Migração

1. Reiniciar backend (se necessário)
2. Testar API endpoints
3. Verificar dados no frontend

