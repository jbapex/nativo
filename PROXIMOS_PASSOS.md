# 🚀 Próximos Passos - Desenvolvimento com PostgreSQL VPS

## ✅ O que já foi feito

- ✅ PostgreSQL instalado na VPS (versão 16.11)
- ✅ Banco de dados criado (`nativo_db`)
- ✅ Migração SQLite → PostgreSQL concluída
- ✅ Backend rodando com PostgreSQL na VPS
- ✅ Guias e scripts criados para desenvolvimento local
- ✅ Domínio corrigido (`nativo.jbapex.com.br`)

---

## 🎯 Próximos Passos Recomendados

### **1. Testar Conexão Local com PostgreSQL da VPS** ⭐ PRIORITÁRIO

#### **Passo 1.1: Criar Túnel SSH**

```bash
# No terminal, execute:
./tunnel-postgres.sh

# Ou manualmente:
ssh -L 5433:localhost:5432 root@nativo.jbapex.com.br

# Deixe este terminal aberto!
```

#### **Passo 1.2: Configurar .env Local**

```bash
# Copiar configuração VPS
cp backend/env.vps.example backend/.env.vps

# Usar quando quiser desenvolver conectado à VPS
cp backend/.env.vps backend/.env
```

#### **Passo 1.3: Testar Conexão**

```bash
# Teste 1: Via psql
psql -h localhost -p 5433 -U nativo_user -d nativo_db
# Senha: Nativo2025SecureDB
# Se conectar, digite: SELECT version(); e depois \q

# Teste 2: Via Node.js
cd backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'nativo_db',
  user: 'nativo_user',
  password: 'Nativo2025SecureDB'
});
pool.query('SELECT NOW(), version()', (err, res) => {
  if (err) console.error('❌ Erro:', err.message);
  else console.log('✅ Conectado!', res.rows[0]);
  process.exit(0);
});
"
```

#### **Passo 1.4: Iniciar Backend Local**

```bash
# Com túnel ativo e .env configurado
cd backend
npm run dev

# Verificar se conectou ao PostgreSQL
# Deve aparecer: "✅ Usando PostgreSQL"
```

---

### **2. Configurar Backup Automático na VPS** ⭐ CRÍTICO

#### **Passo 2.1: Baixar Script de Backup**

```bash
# Na VPS
cd /root/nativo
git pull origin 2025-12-21-dmnv

# Tornar executável
chmod +x backend/scripts/backup-postgres.sh
```

#### **Passo 2.2: Testar Script Manualmente**

```bash
# Na VPS, testar backup
cd /root/nativo
./backend/scripts/backup-postgres.sh

# Verificar se backup foi criado
ls -lh backups/postgres/
```

#### **Passo 2.3: Configurar Backup Automático**

```bash
# Na VPS, editar crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã):
0 2 * * * /root/nativo/backend/scripts/backup-postgres.sh >> /root/nativo/backend/logs/backup.log 2>&1

# Salvar e sair (Ctrl+X, Y, Enter)
```

#### **Passo 2.4: Verificar Logs**

```bash
# Ver logs de backup
tail -f /root/nativo/backend/logs/backup.log
```

---

### **3. Verificar Funcionamento Completo**

#### **Teste 3.1: API Endpoints**

```bash
# Com backend rodando localmente (conectado à VPS)
curl http://localhost:3001/api/health

# Deve retornar status do PostgreSQL
```

#### **Teste 3.2: Operações CRUD**

Testar no frontend ou via API:
- ✅ Listar produtos
- ✅ Criar produto
- ✅ Atualizar produto
- ✅ Deletar produto
- ✅ Autenticação
- ✅ Upload de imagens

#### **Teste 3.3: Performance**

```bash
# Verificar tempo de resposta
time curl http://localhost:3001/api/products

# Verificar conexões no PostgreSQL (na VPS)
psql -U nativo_user -d nativo_db -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'nativo_db';"
```

---

### **4. Documentar Diferenças Encontradas**

Se encontrar alguma diferença entre SQLite e PostgreSQL:

```bash
# Criar arquivo de notas
nano DIFERENCAS_SQLITE_POSTGRESQL.md

# Documentar:
# - Queries que precisaram ajuste
# - Comportamentos diferentes
# - Performance observada
# - Problemas encontrados e soluções
```

---

### **5. Otimizar Configurações (Opcional)**

#### **5.1: Otimizar PostgreSQL na VPS**

```bash
# Na VPS, editar configuração
sudo nano /etc/postgresql/16/main/postgresql.conf

# Ajustar conforme RAM disponível:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# max_connections = 100

# Reiniciar
sudo systemctl restart postgresql
```

#### **5.2: Criar Índices (se necessário)**

```sql
-- Conectar ao PostgreSQL
psql -U nativo_user -d nativo_db

-- Ver índices existentes
\di

-- Criar índices se necessário (exemplos)
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
```

---

### **6. Configurar Monitoramento (Opcional)**

#### **6.1: Verificar Logs Regularmente**

```bash
# Na VPS, ver logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Ver logs do backend
pm2 logs backend
```

#### **6.2: Monitorar Performance**

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

## 📋 Checklist de Próximos Passos

### **Imediato (Hoje):**
- [ ] Testar conexão local com PostgreSQL da VPS
- [ ] Verificar se backend local conecta corretamente
- [ ] Testar algumas operações básicas (listar, criar, atualizar)

### **Curto Prazo (Esta Semana):**
- [ ] Configurar backup automático na VPS
- [ ] Testar backup manualmente
- [ ] Verificar se backups estão sendo criados
- [ ] Documentar qualquer diferença encontrada

### **Médio Prazo (Este Mês):**
- [ ] Otimizar configurações do PostgreSQL
- [ ] Criar índices necessários
- [ ] Monitorar performance
- [ ] Ajustar conforme necessário

---

## 🎯 Prioridades

1. **🔴 ALTA:** Testar conexão local e funcionamento
2. **🔴 ALTA:** Configurar backup automático
3. **🟡 MÉDIA:** Otimizar configurações
4. **🟢 BAIXA:** Monitoramento avançado

---

## 🚨 Importante Lembrar

- ✅ **Sempre mantenha o túnel SSH aberto** enquanto desenvolve conectado à VPS
- ✅ **Feche o túnel** quando não estiver usando (segurança)
- ✅ **Faça backups regulares** (já configurado automaticamente)
- ✅ **Monitore logs** para detectar problemas cedo
- ✅ **Teste tudo** antes de considerar migração completa

---

## 📞 Comandos Rápidos de Referência

### **Criar Túnel SSH:**
```bash
./tunnel-postgres.sh
```

### **Configurar .env para VPS:**
```bash
cp backend/env.vps.example backend/.env.vps
cp backend/.env.vps backend/.env
```

### **Voltar para SQLite Local:**
```bash
# Editar backend/.env
DB_TYPE=sqlite
DB_PATH=./database.sqlite
```

### **Verificar Conexão:**
```bash
psql -h localhost -p 5433 -U nativo_user -d nativo_db
```

---

**Última atualização:** Dezembro 2025

