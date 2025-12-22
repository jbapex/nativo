# 🚀 Guia: Atualizar Código Local → VPS

## 📋 Fluxo Completo de Atualização

### **Cenário:**
- ✅ Você desenvolve **localmente** (no seu computador)
- ✅ Sistema roda em **produção na VPS**
- ✅ Quer enviar suas mudanças para a VPS

---

## 🔄 Processo (2 Opções)

### **Opção 1: Via Git (Recomendado) - Mais Seguro**

#### **No seu computador (local):**

```bash
# 1. Verificar o que mudou
git status

# 2. Adicionar arquivos modificados
git add .

# 3. Fazer commit
git commit -m "feat: ajustes no frontend e backend"

# 4. Enviar para o GitHub/GitLab
git push origin main
```

#### **Na VPS (via SSH):**

```bash
# 1. Conectar na VPS
ssh seu-usuario@seu-servidor.com

# 2. Ir para o projeto
cd /caminho/para/local-mart

# 3. Baixar atualizações do GitHub
git pull origin main

# 4. Instalar novas dependências (se houver)
npm install
cd backend && npm install && cd ..

# 5. Aplicar migrações (se houver mudanças no banco)
cd backend
node scripts/aplicar-migracoes.js
cd ..

# 6. Reiniciar serviços
pm2 restart all
# ou se não usar PM2:
# pkill -f "node.*backend" && npm run dev
```

---

### **Opção 2: Script Automático (Mais Rápido)**

Já existe um script pronto! Use o `atualizar-vps.sh`:

#### **No seu computador (local):**

```bash
# 1. Commit e push (igual acima)
git add .
git commit -m "feat: minhas mudanças"
git push origin main
```

#### **Na VPS:**

```bash
# 1. Conectar
ssh seu-usuario@seu-servidor.com

# 2. Ir para o projeto
cd /caminho/para/local-mart

# 3. Executar script automático (faz tudo!)
chmod +x atualizar-vps.sh  # Só na primeira vez
./atualizar-vps.sh
```

O script faz automaticamente:
- ✅ Backup do banco de dados
- ✅ `git pull` (baixa atualizações)
- ✅ `npm install` (instala dependências)
- ✅ Aplica migrações
- ✅ Reinicia PM2
- ✅ Verifica se está funcionando

---

## 📝 Passo a Passo Detalhado

### **1. Desenvolvimento Local**

Você faz suas mudanças normalmente:

```bash
# Editar arquivos no VS Code/Cursor
# Testar localmente
npm run dev  # Frontend
cd backend && npm run dev  # Backend
```

### **2. Commit Local**

```bash
# Ver o que mudou
git status

# Adicionar tudo
git add .

# Commit com mensagem descritiva
git commit -m "feat: ajuste nos cards de produtos
- Grid de 6 colunas
- Textos compactos
- Contorno colorido"

# Enviar para GitHub
git push origin main
```

### **3. Atualizar na VPS**

```bash
# Conectar na VPS
ssh root@nativo.contaae.online  # (seu servidor)

# Ir para o projeto
cd /root/nativo  # (seu caminho)

# Baixar atualizações
git pull origin main

# Se houver novas dependências
npm install
cd backend && npm install && cd ..

# Reiniciar
pm2 restart all
```

---

## ⚠️ Importante: O que NÃO vai para o Git

**NUNCA** commite:
- ❌ `.env` (variáveis de ambiente)
- ❌ `database.sqlite` (banco de dados)
- ❌ `node_modules/` (dependências)
- ❌ `uploads/` (arquivos enviados)
- ❌ `backups/` (backups)

Esses arquivos já estão no `.gitignore`!

---

## 🔍 Verificar se Funcionou

Após atualizar na VPS:

```bash
# Ver status do PM2
pm2 status

# Ver logs
pm2 logs

# Testar API
curl http://localhost:3001/api/health

# Ver logs do backend
tail -f backend/logs/combined.log
```

---

## 🐛 Problemas Comuns

### **Erro: "Your local changes would be overwritten"**

**Causa:** Há mudanças na VPS que não foram commitadas.

**Solução:**
```bash
# Na VPS, descartar mudanças locais
git reset --hard HEAD
git pull origin main
```

### **Erro: "Cannot find module"**

**Causa:** Dependências não foram instaladas.

**Solução:**
```bash
# Na VPS
npm install
cd backend && npm install && cd ..
pm2 restart all
```

### **Erro: "Port already in use"**

**Causa:** Servidor antigo ainda rodando.

**Solução:**
```bash
# Na VPS
pm2 restart all
# ou
pkill -f "node.*backend"
pm2 start ecosystem.config.js
```

---

## 📊 Resumo Visual

```
┌─────────────────────┐
│  Seu Computador     │
│  (Desenvolvimento)  │
│                     │
│  1. Editar código   │
│  2. git add .       │
│  3. git commit      │
│  4. git push        │
└──────────┬──────────┘
           │
           │ GitHub/GitLab
           │
           ▼
┌─────────────────────┐
│      VPS            │
│   (Produção)        │
│                     │
│  1. git pull        │
│  2. npm install     │
│  3. pm2 restart     │
└─────────────────────┘
```

---

## ✅ Checklist Rápido

**Antes de atualizar:**
- [ ] Testei localmente
- [ ] Fiz commit das mudanças
- [ ] Fiz push para GitHub

**Na VPS:**
- [ ] Conectei via SSH
- [ ] Fiz backup (ou script faz)
- [ ] Fiz `git pull`
- [ ] Instalei dependências
- [ ] Reiniciei serviços
- [ ] Verifiquei se está funcionando

---

## 🚀 Comando Único (Script)

Se você configurou o script `atualizar-vps.sh`:

```bash
# Na VPS, apenas execute:
cd /root/nativo && ./atualizar-vps.sh
```

Pronto! Tudo atualizado automaticamente! 🎉

