# 🔌 Guia: Conectar ao PostgreSQL da VPS do Ambiente Local

## 📋 Objetivo

Conectar seu ambiente de desenvolvimento **local** ao PostgreSQL que está rodando na **VPS**, permitindo que você desenvolva localmente usando os dados de produção.

---

## ⚠️ Importante: Segurança

**NUNCA exponha o PostgreSQL diretamente na internet!** Sempre use túnel SSH para conexões remotas.

---

## 🚀 Método 1: Túnel SSH (Recomendado - Mais Seguro)

### **Passo 1: Criar Túnel SSH**

Em um terminal, execute:

```bash
# Criar túnel SSH
ssh -L 5433:localhost:5432 seu-usuario@seu-servidor.com

# Explicação:
# -L 5433:localhost:5432
#   └─ Porta local 5433 → VPS localhost:5432
#   (Deixe este terminal aberto enquanto desenvolve!)
```

**Exemplo com suas credenciais:**

```bash
ssh -L 5433:localhost:5432 root@nativo.jbapex.com.br

# Ou usando IP direto:
ssh -L 5433:localhost:5432 root@72.60.151.155
```

### **Passo 2: Configurar .env Local**

No seu projeto local, edite o arquivo `backend/.env`:

```env
# Banco de Dados - Conectando ao PostgreSQL da VPS via túnel SSH
DB_TYPE=postgres

# PostgreSQL (via túnel SSH)
DB_HOST=localhost        # ← localhost porque o túnel redireciona
DB_PORT=5433            # ← Porta LOCAL do túnel (não 5432!)
DB_NAME=nativo_db
DB_USER=nativo_user
DB_PASSWORD=Nativo2025SecureDB
```

### **Passo 3: Testar Conexão**

Em outro terminal (mantendo o túnel aberto):

```bash
# Testar conexão via psql
psql -h localhost -p 5433 -U nativo_user -d nativo_db

# Ou testar via Node.js
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
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Erro:', err.message);
  else console.log('✅ Conectado!', res.rows[0]);
  process.exit(0);
});
"
```

---

## 🛠️ Método 2: Script Automático de Túnel

Criar um script para facilitar:

### **Criar Script: `tunnel-postgres.sh`**

```bash
#!/bin/bash

# Configurações
VPS_USER="root"
VPS_HOST="nativo.jbapex.com.br"
LOCAL_PORT=5433
REMOTE_PORT=5432

echo "🔌 Criando túnel SSH para PostgreSQL..."
echo "📍 Conecte em: localhost:${LOCAL_PORT}"
echo "⚠️  Deixe este terminal aberto!"
echo ""
echo "Para usar no .env:"
echo "  DB_HOST=localhost"
echo "  DB_PORT=${LOCAL_PORT}"
echo "  DB_NAME=nativo_db"
echo "  DB_USER=nativo_user"
echo "  DB_PASSWORD=Nativo2025SecureDB"
echo ""
echo "Pressione Ctrl+C para fechar o túnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} ${VPS_USER}@${VPS_HOST}
```

**Tornar executável:**

```bash
chmod +x tunnel-postgres.sh
```

**Usar:**

```bash
# Terminal 1: Criar túnel
./tunnel-postgres.sh

# Terminal 2: Desenvolver normalmente
npm run dev
```

---

## 🔧 Método 3: Configuração com Variáveis de Ambiente

### **Opção A: .env Separado para VPS**

Criar `backend/.env.vps`:

```env
# Configuração para conectar ao PostgreSQL da VPS
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_NAME=nativo_db
DB_USER=nativo_user
DB_PASSWORD=Nativo2025SecureDB
```

**Usar quando necessário:**

```bash
# Copiar .env.vps para .env antes de desenvolver
cp backend/.env.vps backend/.env

# Ou usar dotenv-cli
npm install -g dotenv-cli
dotenv -e backend/.env.vps -- npm run dev
```

### **Opção B: Script de Inicialização**

Criar `start-dev-vps.sh`:

```bash
#!/bin/bash

echo "🚀 Iniciando desenvolvimento conectado à VPS..."
echo ""

# Verificar se túnel está ativo
if ! nc -z localhost 5433 2>/dev/null; then
    echo "⚠️  Túnel SSH não detectado!"
    echo "📝 Execute em outro terminal:"
    echo "   ssh -L 5433:localhost:5432 root@nativo.jbapex.com.br"
    echo ""
    read -p "Pressione Enter quando o túnel estiver ativo..."
fi

# Copiar configuração VPS
cp backend/.env.vps backend/.env

# Iniciar desenvolvimento
echo "✅ Conectando ao PostgreSQL da VPS..."
cd backend && npm run dev
```

---

## 🧪 Testar Conexão

### **Teste 1: Via psql**

```bash
# Com túnel ativo
psql -h localhost -p 5433 -U nativo_user -d nativo_db

# Dentro do psql:
SELECT version();
SELECT current_database();
SELECT current_user;
\dt  # Listar tabelas
\q   # Sair
```

### **Teste 2: Via Node.js**

Criar `backend/test-connection.js`:

```javascript
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'nativo_db',
  user: process.env.DB_USER || 'nativo_user',
  password: process.env.DB_PASSWORD,
});

console.log('🔄 Testando conexão...');
console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);

pool.query('SELECT NOW(), version(), current_database(), current_user', (err, res) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Informações:');
    console.log('  Data/Hora:', res.rows[0].now);
    console.log('  Versão:', res.rows[0].version.split(',')[0]);
    console.log('  Database:', res.rows[0].current_database);
    console.log('  User:', res.rows[0].current_user);
  }
  pool.end();
});
```

**Executar:**

```bash
cd backend
node test-connection.js
```

---

## 🔐 Segurança e Boas Práticas

### **1. Nunca Commitar Credenciais**

Certifique-se de que `.env` e `.env.vps` estão no `.gitignore`:

```bash
# Verificar .gitignore
cat .gitignore | grep -E "\.env|\.env\."

# Se não estiver, adicionar:
echo "*.env" >> .gitignore
echo "*.env.*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### **2. Usar Chaves SSH**

Configure autenticação por chave SSH (mais seguro que senha):

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Copiar chave para VPS
ssh-copy-id root@nativo.contaae.online

# Agora pode conectar sem senha
ssh root@nativo.jbapex.com.br
```

### **3. Fechar Túnel Quando Não Usar**

Sempre feche o túnel SSH quando não estiver desenvolvendo:

```bash
# No terminal do túnel, pressione:
Ctrl + C
```

---

## 📊 Fluxo de Trabalho Recomendado

### **Desenvolvimento Normal (Local com SQLite):**

```bash
# .env local
DB_TYPE=sqlite
DB_PATH=./database.sqlite

# Desenvolver normalmente
npm run dev
```

### **Desenvolvimento com Dados da VPS:**

```bash
# Terminal 1: Criar túnel
ssh -L 5433:localhost:5432 root@nativo.jbapex.com.br

# Terminal 2: Configurar e desenvolver
cp backend/.env.vps backend/.env
npm run dev
```

---

## 🐛 Solução de Problemas

### **Erro: "Connection refused"**

**Causa:** Túnel SSH não está ativo ou PostgreSQL não está rodando na VPS.

**Solução:**

```bash
# 1. Verificar se túnel está ativo
nc -z localhost 5433 && echo "✅ Túnel ativo" || echo "❌ Túnel inativo"

# 2. Verificar PostgreSQL na VPS
ssh root@nativo.jbapex.com.br "sudo systemctl status postgresql"
```

### **Erro: "password authentication failed"**

**Causa:** Credenciais incorretas no `.env`.

**Solução:**

```bash
# Verificar credenciais
cat backend/.env | grep DB_

# Deve mostrar:
# DB_NAME=nativo_db
# DB_USER=nativo_user
# DB_PASSWORD=Nativo2025SecureDB
```

### **Erro: "database does not exist"**

**Causa:** Nome do banco incorreto.

**Solução:**

```bash
# Verificar banco na VPS
ssh root@nativo.jbapex.com.br "psql -U nativo_user -d nativo_db -c '\l'"
```

### **Túnel Fecha Automaticamente**

**Causa:** Timeout do SSH.

**Solução:**

```bash
# Adicionar keep-alive ao SSH
ssh -o ServerAliveInterval=60 -L 5433:localhost:5432 root@nativo.contaae.online
```

---

## 🎯 Configuração Rápida (Resumo)

### **1. Criar Túnel SSH:**

```bash
ssh -L 5433:localhost:5432 root@nativo.jbapex.com.br
```

### **2. Configurar .env Local:**

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_NAME=nativo_db
DB_USER=nativo_user
DB_PASSWORD=Nativo2025SecureDB
```

### **3. Desenvolver:**

```bash
npm run dev
```

---

## 📝 Checklist

- [ ] Túnel SSH criado e ativo
- [ ] `.env` configurado com credenciais corretas
- [ ] Porta local configurada (5433)
- [ ] Conexão testada via psql
- [ ] Conexão testada via Node.js
- [ ] Backend iniciando corretamente
- [ ] API respondendo

---

## 🚀 Próximos Passos

1. **Configurar script de túnel** para facilitar
2. **Criar .env.vps** separado para não misturar configurações
3. **Testar todas as funcionalidades** conectado à VPS
4. **Documentar** qualquer diferença encontrada

---

## 💡 Dicas

- **Use dois terminais:** Um para o túnel SSH, outro para desenvolvimento
- **Mantenha túnel aberto:** Enquanto estiver desenvolvendo
- **Feche quando não usar:** Para segurança e performance
- **Use variáveis de ambiente:** Para alternar entre local e VPS facilmente

---

**Última atualização:** Dezembro 2025

