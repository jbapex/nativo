# 📋 Comandos para Copiar e Colar na VPS

## 🚀 Atualização Rápida (Copiar Tudo de Uma Vez)

```bash
# Conectar na VPS
ssh root@nativo.contaae.online

# Ir para o projeto
cd /root/nativo

# Baixar atualizações (inclui o script configurado)
git pull origin main

# Executar atualização
chmod +x atualizar-vps.sh
./atualizar-vps.sh
```

## 💻 Se Você Usa Cursor na VPS

Se você usa Cursor na VPS, pode executar direto no terminal integrado:

1. **Abra o terminal no Cursor** (`Ctrl + '` ou `Terminal > New Terminal`)
2. **Cole os comandos acima** (um por vez ou todos de uma vez)
3. **Pronto!** O script fará tudo automaticamente

## 📝 Comandos Individuais (Se Preferir)

### Passo 1: Conectar
```bash
ssh root@nativo.contaae.online
```

### Passo 2: Ir para o projeto
```bash
cd /root/nativo
```

### Passo 3: Baixar atualizações
```bash
git pull origin main
```

### Passo 4: Tornar script executável (só na primeira vez)
```bash
chmod +x atualizar-vps.sh
```

### Passo 5: Executar atualização
```bash
./atualizar-vps.sh
```

## ✅ O Que o Script Faz Automaticamente

1. ✅ **Backup do banco SQLite** (`/root/nativo/backend/database.sqlite`)
2. ✅ **Atualiza código** do GitHub
3. ✅ **Instala dependências** (npm install)
4. ✅ **Aplica migrações** do banco de dados
5. ✅ **Reinicia serviços** (PM2)

## 🔍 Verificar se Funcionou

Após executar, verifique:

```bash
# Ver status dos processos
pm2 status

# Ver logs
pm2 logs

# Testar API
curl http://localhost:3001/api/health
```

## ⚠️ Se Der Erro

### Erro: "Permission denied"
```bash
chmod +x atualizar-vps.sh
```

### Erro: "Not a git repository"
```bash
cd /root/nativo
git init
git remote add origin https://github.com/jbapex/nativo.git
git pull origin main
```

### Erro: "PM2 not found"
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## 🎯 Resumo Ultra Rápido

**Copie e cole tudo isso de uma vez:**

```bash
cd /root/nativo && git pull origin main && chmod +x atualizar-vps.sh && ./atualizar-vps.sh
```

---

**💡 Dica:** Se usar Cursor na VPS, você pode até criar um atalho de teclado para isso!

