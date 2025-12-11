# 🚀 Comandos Personalizados para Sua VPS

## 📋 Informações da VPS

- **SSH:** root@nativo.contaae.online
- **IP:** 72.60.151.155
- **Caminho:** /root/nativo
- **Banco:** SQLite (/root/nativo/backend/database.sqlite)

## 🎯 Comandos Prontos para Copiar e Colar

### 1. Conectar na VPS

```bash
ssh root@nativo.contaae.online
```

### 2. Ir para o Projeto

```bash
cd /root/nativo
```

### 3. Atualizar o Sistema (Método Rápido)

```bash
# Baixar atualizações
cd /root/nativo
git pull origin main

# Executar script de atualização (já configurado)
chmod +x atualizar-vps.sh
./atualizar-vps.sh
```

### 4. Atualizar Manualmente (Passo a Passo)

```bash
# 1. Ir para o projeto
cd /root/nativo

# 2. Fazer backup do banco SQLite
mkdir -p backups
cp backend/database.sqlite backups/backup_$(date +%Y%m%d_%H%M%S).db

# 3. Atualizar código
git pull origin main

# 4. Instalar dependências
npm install
cd backend && npm install && cd ..

# 5. Aplicar migrações
cd backend
node scripts/aplicar-migracoes.js
cd ..

# 6. Reiniciar serviços (PM2)
pm2 restart all

# Ou se não usar PM2:
# pkill -f "node.*backend"
# pkill -f "vite"
# npm run dev
```

## 🔧 Comandos Úteis

### Verificar Status

```bash
# Status dos processos PM2
pm2 status

# Ver logs
pm2 logs

# Ver logs do backend
tail -f /root/nativo/backend/logs/combined.log

# Verificar se backend está rodando
curl http://localhost:3001/api/health
```

### Backup Manual do Banco

```bash
# Criar backup
mkdir -p /root/nativo/backups
cp /root/nativo/backend/database.sqlite /root/nativo/backups/backup_$(date +%Y%m%d_%H%M%S).db

# Listar backups
ls -lh /root/nativo/backups/
```

### Verificar Versão do Código

```bash
cd /root/nativo
git log --oneline -5
git status
```

### Reiniciar Serviços

```bash
# Com PM2
pm2 restart all

# Ver processos
pm2 list

# Ver logs em tempo real
pm2 logs
```

## 🐛 Solução de Problemas

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

### Erro: "Cannot find module"

```bash
cd /root/nativo
rm -rf node_modules package-lock.json
npm install
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Banco de Dados Corrompido

```bash
# Restaurar do backup mais recente
cd /root/nativo/backups
ls -lt | head -2  # Ver último backup
cp backup_YYYYMMDD_HHMMSS.db ../backend/database.sqlite
```

## 📝 Script de Atualização Rápida

Crie um arquivo `atualizar.sh` na VPS:

```bash
#!/bin/bash
cd /root/nativo
git pull origin main
npm install
cd backend && npm install && cd ..
cd backend && node scripts/aplicar-migracoes.js && cd ..
pm2 restart all
echo "✅ Atualização concluída!"
```

Torne executável:
```bash
chmod +x atualizar.sh
```

Use sempre:
```bash
./atualizar.sh
```

## 🔐 Segurança

⚠️ **NUNCA** compartilhe:
- Senhas
- Tokens de API
- Chaves privadas
- Credenciais do banco

✅ **Pode compartilhar:**
- IP/Domínio (já público)
- Caminhos de diretórios
- Nomes de usuários (não senhas)

## 📊 Monitoramento

```bash
# Ver uso de recursos
pm2 monit

# Ver logs em tempo real
pm2 logs --lines 100

# Verificar espaço em disco
df -h

# Ver processos Node
ps aux | grep node
```

---

**💡 Dica:** Salve estes comandos em um arquivo na VPS para acesso rápido!

