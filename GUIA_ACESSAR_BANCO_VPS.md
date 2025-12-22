# 🔌 Guia: Acessar Banco de Dados da VPS Localmente

## 📋 Opções de Acesso

Dependendo do tipo de banco, você tem diferentes opções:

---

## 🗄️ **Opção 1: SQLite (Atual)**

### **Método A: Via SSH + SCP (Copiar arquivo)**

```bash
# 1. Copiar banco da VPS para seu computador
scp usuario@seu-servidor.com:/caminho/para/backend/database.sqlite ~/Downloads/database.sqlite

# 2. Abrir com ferramenta SQLite local
# macOS:
open -a "DB Browser for SQLite" ~/Downloads/database.sqlite

# Ou usar linha de comando:
sqlite3 ~/Downloads/database.sqlite
```

### **Método B: Via SSH (Acessar direto na VPS)**

```bash
# Conectar na VPS
ssh usuario@seu-servidor.com

# Ir para o diretório do banco
cd /caminho/para/backend

# Acessar SQLite
sqlite3 database.sqlite

# Comandos úteis:
.tables              # Ver todas as tabelas
.schema users        # Ver estrutura da tabela users
SELECT * FROM users LIMIT 10;  # Ver dados
.quit                # Sair
```

### **Método C: Ferramenta Visual (DB Browser)**

1. **Instalar DB Browser for SQLite:**
   ```bash
   # macOS
   brew install --cask db-browser-for-sqlite
   
   # Ou baixar: https://sqlitebrowser.org/
   ```

2. **Copiar banco da VPS:**
   ```bash
   scp usuario@seu-servidor.com:/root/nativo/backend/database.sqlite ~/Downloads/
   ```

3. **Abrir no DB Browser:**
   - Abra o DB Browser
   - File → Open Database
   - Selecione o arquivo copiado

---

## 🐘 **Opção 2: PostgreSQL (Recomendado para Produção)**

### **Método A: SSH Tunnel (Mais Seguro)**

Cria um túnel seguro para acessar o PostgreSQL da VPS:

```bash
# 1. Criar túnel SSH (em um terminal)
ssh -L 5433:localhost:5432 usuario@seu-servidor.com

# Explicação:
# -L 5433:localhost:5432
#   └─ Porta local:5433 → VPS:localhost:5432
#   (Deixe este terminal aberto!)

# 2. Em outro terminal, conectar ao PostgreSQL
psql -h localhost -p 5433 -U local_mart_user -d local_mart

# Ou usar ferramenta visual (DBeaver, pgAdmin, etc)
# Host: localhost
# Port: 5433
# Database: local_mart
# User: local_mart_user
# Password: sua-senha
```

### **Método B: Ferramenta Visual (DBeaver - Gratuito)**

1. **Instalar DBeaver:**
   ```bash
   # macOS
   brew install --cask dbeaver-community
   ```

2. **Configurar conexão:**
   - New Database Connection → PostgreSQL
   - **Host:** localhost (depois de criar túnel SSH)
   - **Port:** 5433 (porta do túnel)
   - **Database:** local_mart
   - **Username:** local_mart_user
   - **Password:** sua-senha

3. **Criar túnel SSH primeiro:**
   ```bash
   ssh -L 5433:localhost:5432 usuario@seu-servidor.com
   ```

### **Método C: pgAdmin (Interface Web)**

1. **Instalar pgAdmin:**
   ```bash
   # macOS
   brew install --cask pgadmin4
   ```

2. **Configurar servidor:**
   - Host: localhost (via túnel SSH)
   - Port: 5433
   - Database: local_mart
   - Username: local_mart_user

---

## 🔐 **Configuração de Segurança (PostgreSQL)**

### **Permitir Conexão Remota (Opcional - Não Recomendado)**

⚠️ **Atenção:** Isso expõe o banco na internet. Use apenas com firewall!

```bash
# Na VPS, editar:
sudo nano /etc/postgresql/14/main/postgresql.conf

# Mudar:
listen_addresses = 'localhost'  # Para: listen_addresses = '*'

# Editar pg_hba.conf:
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Adicionar (substitua pelo seu IP):
host    local_mart    local_mart_user    SEU_IP_LOCAL/32    md5

# Reiniciar PostgreSQL:
sudo systemctl restart postgresql
```

**Recomendação:** Use SSH Tunnel (Método A) ao invés disso!

---

## 🛠️ **Ferramentas Recomendadas**

### **Para SQLite:**
- **DB Browser for SQLite** (Gratuito, Visual)
- **SQLiteStudio** (Gratuito, Multiplataforma)
- **TablePlus** (Pago, mas muito bom)

### **Para PostgreSQL:**
- **DBeaver** (Gratuito, Completo)
- **pgAdmin** (Gratuito, Oficial)
- **TablePlus** (Pago, Interface moderna)
- **DataGrip** (Pago, JetBrains)

---

## 📝 **Scripts Úteis**

### **Script: Copiar SQLite da VPS**

```bash
#!/bin/bash
# copiar-banco.sh

VPS_USER="seu-usuario"
VPS_HOST="seu-servidor.com"
VPS_PATH="/root/nativo/backend/database.sqlite"
LOCAL_PATH="~/Downloads/database_$(date +%Y%m%d_%H%M%S).sqlite"

echo "📦 Copiando banco de dados da VPS..."
scp ${VPS_USER}@${VPS_HOST}:${VPS_PATH} ${LOCAL_PATH}

echo "✅ Banco copiado para: ${LOCAL_PATH}"
echo "💡 Abra com: open -a 'DB Browser for SQLite' ${LOCAL_PATH}"
```

### **Script: Criar Túnel SSH para PostgreSQL**

```bash
#!/bin/bash
# tunnel-postgres.sh

VPS_USER="seu-usuario"
VPS_HOST="seu-servidor.com"
LOCAL_PORT=5433
REMOTE_PORT=5432

echo "🔌 Criando túnel SSH para PostgreSQL..."
echo "📍 Conecte em: localhost:${LOCAL_PORT}"
echo "⚠️  Deixe este terminal aberto!"
echo ""

ssh -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} ${VPS_USER}@${VPS_HOST}
```

---

## 🎯 **Exemplos Práticos**

### **Verificar dados no SQLite:**

```bash
# Na VPS
ssh usuario@seu-servidor.com
cd /root/nativo/backend
sqlite3 database.sqlite

# Ver usuários
SELECT id, email, full_name, role FROM users LIMIT 10;

# Ver lojas
SELECT id, name, status FROM stores LIMIT 10;

# Ver produtos
SELECT id, name, price FROM products LIMIT 10;

# Contar registros
SELECT 
  'users' as tabela, COUNT(*) FROM users
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'products', COUNT(*) FROM products;
```

### **Fazer backup via SSH:**

```bash
# SQLite
scp usuario@seu-servidor.com:/root/nativo/backend/database.sqlite \
    ~/Downloads/backup_$(date +%Y%m%d).sqlite

# PostgreSQL (via túnel)
pg_dump -h localhost -p 5433 -U local_mart_user -d local_mart \
    > ~/Downloads/backup_$(date +%Y%m%d).sql
```

---

## ⚠️ **Segurança**

1. **Nunca exponha PostgreSQL diretamente na internet**
2. **Use SSH Tunnel sempre que possível**
3. **Faça backups antes de qualquer operação**
4. **Use senhas fortes**
5. **Limite acesso por IP (se necessário)**

---

## ✅ **Checklist**

- [ ] Identifiquei o tipo de banco (SQLite ou PostgreSQL)
- [ ] Configurei SSH Tunnel (se PostgreSQL)
- [ ] Instalei ferramenta visual (opcional)
- [ ] Testei conexão
- [ ] Fiz backup antes de mexer

---

## 🚀 **Comandos Rápidos**

### **SQLite:**
```bash
# Copiar e abrir
scp usuario@vps:/caminho/database.sqlite ~/Downloads/ && \
open -a "DB Browser for SQLite" ~/Downloads/database.sqlite
```

### **PostgreSQL:**
```bash
# Terminal 1: Criar túnel
ssh -L 5433:localhost:5432 usuario@vps

# Terminal 2: Conectar
psql -h localhost -p 5433 -U usuario -d local_mart
```

---

**Última atualização:** 2025

