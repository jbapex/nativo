# 🐘 Guia: Instalar e Configurar PostgreSQL na VPS

## 📋 Pré-requisitos

- VPS com Ubuntu/Debian (recomendado Ubuntu 20.04 ou superior)
- Acesso SSH com privilégios de root ou sudo
- Conexão com a internet

---

## 🚀 Instalação do PostgreSQL

### **Passo 1: Atualizar o Sistema**

```bash
# Conectar na VPS
ssh seu-usuario@seu-servidor.com

# Atualizar pacotes
sudo apt update
sudo apt upgrade -y
```

### **Passo 2: Instalar PostgreSQL**

```bash
# Instalar PostgreSQL (versão mais recente)
sudo apt install postgresql postgresql-contrib -y

# Verificar instalação
sudo systemctl status postgresql
```

### **Passo 3: Verificar Versão**

```bash
# Ver versão instalada
sudo -u postgres psql -c "SELECT version();"
```

---

## 🔧 Configuração Inicial

### **Passo 1: Acessar PostgreSQL**

```bash
# Trocar para usuário postgres
sudo -u postgres psql

# Ou diretamente:
sudo -u postgres psql
```

### **Passo 2: Criar Banco de Dados e Usuário**

Dentro do `psql`, execute:

```sql
-- Criar usuário para o projeto
CREATE USER local_mart_user WITH PASSWORD 'SUA_SENHA_FORTE_AQUI';

-- Criar banco de dados
CREATE DATABASE local_mart OWNER local_mart_user;

-- Dar privilégios completos ao usuário
GRANT ALL PRIVILEGES ON DATABASE local_mart TO local_mart_user;

-- Conectar ao banco
\c local_mart

-- Dar privilégios no schema public
GRANT ALL ON SCHEMA public TO local_mart_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO local_mart_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO local_mart_user;

-- Sair do psql
\q
```

### **Passo 3: Testar Conexão**

```bash
# Testar conexão com o novo usuário
psql -U local_mart_user -d local_mart -h localhost

# Se pedir senha, digite a senha que você criou
# Se conectar com sucesso, você verá: local_mart=>
```

---

## 🔐 Configuração de Segurança

### **Passo 1: Configurar pg_hba.conf**

```bash
# Editar arquivo de configuração de autenticação
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

**Localizar e ajustar as linhas:**

```conf
# Método de autenticação local (recomendado)
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Para permitir conexão do seu aplicativo Node.js
host    local_mart      local_mart_user  127.0.0.1/32          md5
```

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

### **Passo 2: Configurar postgresql.conf**

```bash
# Editar configuração principal
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Localizar e ajustar:**

```conf
# Escutar apenas localhost (mais seguro)
listen_addresses = 'localhost'

# Porta padrão (5432)
port = 5432

# Máximo de conexões
max_connections = 100
```

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

### **Passo 3: Reiniciar PostgreSQL**

```bash
# Reiniciar serviço
sudo systemctl restart postgresql

# Verificar status
sudo systemctl status postgresql
```

---

## 🔌 Configurar Aplicação Node.js

### **Passo 1: Instalar Driver PostgreSQL**

Na sua aplicação Node.js (na VPS):

```bash
cd /caminho/para/seu/projeto/backend
npm install pg
```

### **Passo 2: Configurar Variáveis de Ambiente**

Editar `.env`:

```bash
# Banco de dados PostgreSQL
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=local_mart
DB_USER=local_mart_user
DB_PASSWORD=SUA_SENHA_FORTE_AQUI

# Ou usar string de conexão completa
DATABASE_URL=postgresql://local_mart_user:SUA_SENHA_FORTE_AQUI@localhost:5432/local_mart
```

### **Passo 3: Atualizar Código do Backend**

Verificar se o código está configurado para usar PostgreSQL:

```javascript
// Exemplo de conexão (se usar pg diretamente)
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'local_mart',
  user: process.env.DB_USER || 'local_mart_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 📊 Migrar Dados do SQLite para PostgreSQL

### **Opção 1: Usar Script de Migração**

Se você tem um script de migração:

```bash
cd /caminho/para/seu/projeto/backend
node scripts/migrate-sqlite-to-postgres.js
```

### **Opção 2: Migração Manual**

```bash
# 1. Exportar dados do SQLite
sqlite3 database.sqlite .dump > dump.sql

# 2. Converter formato (pode precisar ajustes manuais)
# 3. Importar no PostgreSQL
psql -U local_mart_user -d local_mart -f dump.sql
```

### **Opção 3: Usar Ferramenta de Migração**

```bash
# Instalar pgloader (ferramenta de migração)
sudo apt install pgloader -y

# Migrar SQLite para PostgreSQL
pgloader database.sqlite postgresql://local_mart_user:SUA_SENHA@localhost/local_mart
```

---

## 🛠️ Comandos Úteis

### **Gerenciar PostgreSQL**

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql

# Parar PostgreSQL
sudo systemctl stop postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver status
sudo systemctl status postgresql

# Habilitar inicialização automática
sudo systemctl enable postgresql
```

### **Acessar PostgreSQL**

```bash
# Como usuário postgres
sudo -u postgres psql

# Como usuário específico
psql -U local_mart_user -d local_mart

# Com host específico
psql -h localhost -U local_mart_user -d local_mart
```

### **Comandos SQL Úteis**

```sql
-- Listar todos os bancos
\l

-- Conectar a um banco
\c nome_do_banco

-- Listar tabelas
\dt

-- Ver estrutura de uma tabela
\d nome_da_tabela

-- Ver usuários
\du

-- Sair
\q
```

### **Backup e Restore**

```bash
# Backup completo do banco
pg_dump -U local_mart_user -d local_mart > backup_$(date +%Y%m%d).sql

# Backup apenas estrutura (sem dados)
pg_dump -U local_mart_user -d local_mart --schema-only > estrutura.sql

# Backup apenas dados (sem estrutura)
pg_dump -U local_mart_user -d local_mart --data-only > dados.sql

# Restaurar backup
psql -U local_mart_user -d local_mart < backup_20251221.sql
```

---

## 🔒 Segurança Adicional

### **1. Firewall (UFW)**

```bash
# PostgreSQL já escuta apenas localhost, mas para garantir:
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw deny 5432
```

### **2. Senha Forte**

Use uma senha forte para o usuário do banco:

```sql
-- Alterar senha de um usuário
ALTER USER local_mart_user WITH PASSWORD 'NOVA_SENHA_FORTE';
```

### **3. Limitar Conexões**

```sql
-- Limitar conexões simultâneas de um usuário
ALTER USER local_mart_user WITH CONNECTION LIMIT 50;
```

---

## 🧪 Testar Conexão

### **Teste 1: Via psql**

```bash
psql -U local_mart_user -d local_mart -h localhost
# Digite a senha quando solicitado
# Se conectar, está funcionando!
```

### **Teste 2: Via Node.js**

Criar arquivo de teste `test-connection.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'local_mart',
  user: 'local_mart_user',
  password: 'SUA_SENHA',
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro:', err);
  } else {
    console.log('✅ Conexão OK!', res.rows[0]);
  }
  pool.end();
});
```

Executar:

```bash
node test-connection.js
```

---

## 📝 Checklist de Instalação

- [ ] PostgreSQL instalado
- [ ] Serviço PostgreSQL rodando
- [ ] Banco de dados criado
- [ ] Usuário criado com senha forte
- [ ] Privilégios configurados
- [ ] Conexão testada via psql
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação Node.js conectando com sucesso
- [ ] Backup configurado (opcional)

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
# Verificar usuário e senha
sudo -u postgres psql
\du  # Ver usuários
ALTER USER local_mart_user WITH PASSWORD 'NOVA_SENHA';
```

### **Erro: "database does not exist"**

```sql
-- Listar bancos
\l

-- Criar banco se não existir
CREATE DATABASE local_mart OWNER local_mart_user;
```

### **Erro: "permission denied"**

```sql
-- Dar privilégios
GRANT ALL PRIVILEGES ON DATABASE local_mart TO local_mart_user;
\c local_mart
GRANT ALL ON SCHEMA public TO local_mart_user;
```

---

## 🚀 Próximos Passos

1. **Configurar Backup Automático** (ver `GUIA_BACKUP_AUTOMATICO.md`)
2. **Monitorar Performance** (usar `pg_stat_statements`)
3. **Otimizar Configurações** (ajustar `postgresql.conf` conforme necessidade)
4. **Configurar Replicação** (se necessário para alta disponibilidade)

---

## 📚 Recursos Adicionais

- **Documentação Oficial:** https://www.postgresql.org/docs/
- **Comandos SQL:** https://www.postgresql.org/docs/current/sql-commands.html
- **Performance:** https://wiki.postgresql.org/wiki/Performance_Optimization

---

**Última atualização:** Dezembro 2025

