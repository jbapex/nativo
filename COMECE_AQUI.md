# 🚀 COMECE AQUI - Guia Passo a Passo

## 📍 Onde você está agora?

Você acabou de migrar para PostgreSQL na VPS e quer começar a desenvolver localmente usando os dados da VPS.

---

## ✅ Passo 1: Criar Túnel SSH

**Abra um terminal** e execute:

```bash
# Opção 1: Usar o script (mais fácil)
./tunnel-postgres.sh

# Opção 2: Comando manual
ssh -L 5433:localhost:5432 root@nativo.jbapex.com.br
```

**⚠️ IMPORTANTE:** Deixe este terminal **ABERTO** enquanto desenvolve!

Você verá algo como:
```
🔌 Criando túnel SSH para PostgreSQL...
📍 Conecte em: localhost:5433
⚠️  Deixe este terminal aberto!
```

**✅ Se aparecer a conexão SSH normal, está funcionando!**

---

## ✅ Passo 2: Configurar .env Local

**Abra OUTRO terminal** (deixe o túnel aberto no primeiro):

```bash
# Ir para o projeto
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb

# Copiar configuração para VPS
cp backend/env.vps.example backend/.env.vps

# Usar essa configuração agora
cp backend/.env.vps backend/.env

# Verificar se está correto
cat backend/.env | grep DB_
```

**Deve mostrar:**
```
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_NAME=nativo_db
DB_USER=nativo_user
DB_PASSWORD=Nativo2025SecureDB
```

---

## ✅ Passo 3: Testar Conexão

**No mesmo terminal do Passo 2:**

```bash
# Teste rápido com psql
psql -h localhost -p 5433 -U nativo_user -d nativo_db
```

**Quando pedir senha, digite:** `Nativo2025SecureDB`

**Se conectar, você verá:**
```
nativo_db=>
```

**Teste básico:**
```sql
SELECT version();
SELECT current_database();
SELECT current_user;
\q  -- Para sair
```

**✅ Se funcionou, está tudo certo!**

---

## ✅ Passo 4: Iniciar Backend Local

**No mesmo terminal (ainda com túnel ativo):**

```bash
# Ir para backend
cd backend

# Instalar dependências (se necessário)
npm install

# Iniciar servidor
npm run dev
```

**Você deve ver:**
```
✅ Usando PostgreSQL
🚀 Servidor rodando na porta 3001
```

**✅ Se aparecer isso, está conectado ao PostgreSQL da VPS!**

---

## ✅ Passo 5: Testar API

**Abra OUTRO terminal** (ou use o navegador):

```bash
# Testar health check
curl http://localhost:3001/api/health

# Ou abrir no navegador:
# http://localhost:3001/api/health
```

**Deve retornar status do banco de dados.**

---

## 🎯 Resumo dos Terminais

Você precisa de **3 terminais**:

### **Terminal 1: Túnel SSH** (deixe aberto)
```bash
./tunnel-postgres.sh
```

### **Terminal 2: Backend** (desenvolvimento)
```bash
cd backend
npm run dev
```

### **Terminal 3: Testes/Comandos** (opcional)
```bash
# Para testar API, fazer queries, etc.
```

---

## ❌ Se Algo Não Funcionar

### **Erro: "Connection refused"**

**Problema:** Túnel SSH não está ativo

**Solução:**
1. Verifique se o Terminal 1 está aberto e conectado
2. Tente criar o túnel novamente: `./tunnel-postgres.sh`

### **Erro: "password authentication failed"**

**Problema:** Credenciais incorretas

**Solução:**
```bash
# Verificar .env
cat backend/.env | grep DB_PASSWORD

# Deve mostrar: DB_PASSWORD=Nativo2025SecureDB
```

### **Erro: "database does not exist"**

**Problema:** Nome do banco incorreto

**Solução:**
```bash
# Verificar .env
cat backend/.env | grep DB_NAME

# Deve mostrar: DB_NAME=nativo_db
```

### **Backend não conecta**

**Problema:** Túnel não está ativo ou .env incorreto

**Solução:**
1. Verifique Terminal 1 (túnel)
2. Verifique `.env` tem `DB_TYPE=postgres`
3. Reinicie o backend

---

## ✅ Checklist Rápido

- [ ] Terminal 1: Túnel SSH criado e ativo
- [ ] Terminal 2: `.env` configurado corretamente
- [ ] Terminal 2: Conexão testada com `psql`
- [ ] Terminal 2: Backend iniciado com sucesso
- [ ] Terminal 3: API respondendo corretamente

---

## 🎉 Próximo Passo Após Funcionar

Depois que tudo estiver funcionando:

1. **Configurar backup automático na VPS** (ver `PROXIMOS_PASSOS.md`)
2. **Testar todas as funcionalidades**
3. **Documentar diferenças encontradas**

---

## 📞 Comandos de Referência Rápida

```bash
# Criar túnel
./tunnel-postgres.sh

# Configurar .env
cp backend/env.vps.example backend/.env.vps && cp backend/.env.vps backend/.env

# Testar conexão
psql -h localhost -p 5433 -U nativo_user -d nativo_db

# Iniciar backend
cd backend && npm run dev

# Testar API
curl http://localhost:3001/api/health
```

---

**Comece pelo Passo 1 e siga em ordem!** 🚀

