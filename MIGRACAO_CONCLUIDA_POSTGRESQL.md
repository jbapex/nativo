# ✅ Migração PostgreSQL Concluída com Sucesso!

## 📊 Informações da Migração

**Data:** 22 de Dezembro de 2025  
**Status:** ✅ Concluída e Funcionando

---

## 🔐 Credenciais do PostgreSQL

⚠️ **IMPORTANTE:** Mantenha essas credenciais seguras!

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nativo_db
DB_USER=nativo_user
DB_PASSWORD=Nativo2025SecureDB
```

### **String de Conexão Completa:**

```
postgresql://nativo_user:Nativo2025SecureDB@localhost:5432/nativo_db
```

---

## 📁 Arquivos Importantes

### **Backup SQLite Original:**
```
/root/nativo/backend/database.sqlite.backup.20251222_040616
```

**⚠️ Mantenha este backup por pelo menos 30 dias!**

---

## ✅ Status do Sistema

- ✅ PostgreSQL instalado: **versão 16.11**
- ✅ Banco criado: **nativo_db**
- ✅ Usuário criado: **nativo_user**
- ✅ Schema criado: tabelas principais criadas
- ✅ Dados migrados: usuários, planos, configurações e outros dados
- ✅ Backend configurado: sistema rodando com PostgreSQL
- ✅ Health check: banco de dados saudável e respondendo
- ✅ API respondendo corretamente

---

## 🔧 Configuração do .env

Certifique-se de que o arquivo `.env` na VPS está configurado assim:

```env
# Banco de Dados
DB_TYPE=postgres

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nativo_db
DB_USER=nativo_user
DB_PASSWORD=Nativo2025SecureDB
```

**Localização:** `/root/nativo/backend/.env`

---

## 🚀 Próximos Passos Importantes

### **1. Configurar Backup Automático** ⭐ CRÍTICO

O PostgreSQL precisa de backups regulares. Configure um backup automático:

```bash
# Criar script de backup
nano /root/nativo/scripts/backup-postgres.sh
```

**Conteúdo do script:**

```bash
#!/bin/bash
BACKUP_DIR="/root/nativo/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/nativo_db_$DATE.sql"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Fazer backup
PGPASSWORD='Nativo2025SecureDB' pg_dump -U nativo_user -h localhost -d nativo_db > $BACKUP_FILE

# Comprimir backup
gzip $BACKUP_FILE

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup criado: $BACKUP_FILE.gz"
```

**Tornar executável:**

```bash
chmod +x /root/nativo/scripts/backup-postgres.sh
```

**Adicionar ao crontab (backup diário às 2h da manhã):**

```bash
crontab -e

# Adicionar linha:
0 2 * * * /root/nativo/scripts/backup-postgres.sh >> /root/nativo/logs/backup.log 2>&1
```

### **2. Verificar Performance**

```bash
# Conectar ao PostgreSQL
psql -U nativo_user -d nativo_db

# Ver estatísticas
SELECT schemaname, tablename, n_live_tup, n_dead_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

# Ver conexões ativas
SELECT count(*) FROM pg_stat_activity;

# Sair
\q
```

### **3. Monitorar Logs**

```bash
# Ver logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Ver logs do backend
pm2 logs backend
```

### **4. Otimizar Configurações (Opcional)**

Para melhor performance, você pode ajustar `/etc/postgresql/16/main/postgresql.conf`:

```conf
# Memória compartilhada (ajustar conforme RAM disponível)
shared_buffers = 256MB          # 25% da RAM disponível
effective_cache_size = 1GB      # 50-75% da RAM disponível

# Conexões
max_connections = 100

# WAL (Write-Ahead Logging)
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```

**Após alterar, reiniciar:**

```bash
sudo systemctl restart postgresql
```

---

## 🔒 Segurança

### **1. Verificar Acesso**

```bash
# Verificar que PostgreSQL só escuta localhost
sudo netstat -tlnp | grep 5432
# Deve mostrar: 127.0.0.1:5432 (não 0.0.0.0:5432)
```

### **2. Firewall**

```bash
# Garantir que porta 5432 não está exposta externamente
sudo ufw status
# PostgreSQL não deve aparecer nas regras permitidas
```

### **3. Senha Forte**

A senha atual é forte, mas considere trocá-la periodicamente:

```sql
-- Conectar como postgres
sudo -u postgres psql

-- Alterar senha
ALTER USER nativo_user WITH PASSWORD 'NOVA_SENHA_MUITO_FORTE';

-- Atualizar .env também!
```

---

## 🧪 Comandos de Teste

### **Testar Conexão:**

```bash
psql -U nativo_user -d nativo_db -h localhost
# Digite a senha quando solicitado
```

### **Verificar Tabelas:**

```sql
-- Listar tabelas
\dt

-- Contar registros
SELECT 
  'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'products', COUNT(*) FROM products;
```

### **Testar API:**

```bash
# Health check
curl http://localhost:3001/api/health

# Deve retornar status do banco
```

---

## 📊 Monitoramento

### **Ver Estatísticas:**

```sql
-- Tamanho do banco
SELECT pg_size_pretty(pg_database_size('nativo_db'));

-- Tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Ver Conexões:**

```sql
-- Conexões ativas
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE datname = 'nativo_db';
```

---

## 🐛 Solução de Problemas

### **Erro: "could not connect to server"**

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Se não estiver, iniciar
sudo systemctl start postgresql
```

### **Erro: "password authentication failed"**

```bash
# Verificar credenciais no .env
cat /root/nativo/backend/.env | grep DB_

# Testar conexão manual
psql -U nativo_user -d nativo_db -h localhost
```

### **Erro: "database does not exist"**

```sql
-- Listar bancos
\l

-- Se nativo_db não existir, criar:
CREATE DATABASE nativo_db OWNER nativo_user;
```

### **Performance Lenta**

```sql
-- Ver queries lentas
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
ORDER BY duration DESC;
```

---

## 📝 Checklist Pós-Migração

- [x] PostgreSQL instalado e funcionando
- [x] Banco de dados criado
- [x] Usuário criado com senha forte
- [x] Dados migrados do SQLite
- [x] Backend conectando ao PostgreSQL
- [x] API funcionando corretamente
- [x] Backup do SQLite original salvo
- [ ] Backup automático configurado
- [ ] Monitoramento configurado
- [ ] Logs sendo verificados regularmente
- [ ] Performance otimizada (se necessário)

---

## 🎯 Benefícios da Migração

✅ **Melhor Performance:** PostgreSQL é mais rápido para operações complexas  
✅ **Concorrência:** Melhor suporte a múltiplas conexões simultâneas  
✅ **Escalabilidade:** Pode crescer conforme necessário  
✅ **Recursos Avançados:** Triggers, stored procedures, views, etc.  
✅ **Backup Robusto:** Ferramentas profissionais de backup  
✅ **Replicação:** Possibilidade de replicação para alta disponibilidade  

---

## 📚 Recursos Úteis

- **Documentação PostgreSQL:** https://www.postgresql.org/docs/16/
- **Comandos SQL:** https://www.postgresql.org/docs/16/sql-commands.html
- **Performance:** https://wiki.postgresql.org/wiki/Performance_Optimization
- **Backup:** https://www.postgresql.org/docs/16/backup.html

---

## ⚠️ Lembrete Importante

1. **Nunca exponha PostgreSQL diretamente na internet**
2. **Faça backups regulares** (configure automático!)
3. **Monitore logs** regularmente
4. **Mantenha PostgreSQL atualizado** (`sudo apt update && sudo apt upgrade postgresql`)
5. **Guarde as credenciais** em local seguro

---

**Última atualização:** 22 de Dezembro de 2025  
**Status:** ✅ Sistema migrado e funcionando perfeitamente!

