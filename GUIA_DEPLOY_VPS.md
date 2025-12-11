# 🚀 Guia de Atualização do Sistema na VPS

Este guia explica como atualizar o sistema Local Mart que está rodando na sua VPS.

## ⚠️ IMPORTANTE: NÃO Exportar Banco de Dados para o Repositório

**NUNCA** faça commit do banco de dados no Git. O banco de dados contém:
- Dados sensíveis (senhas, tokens)
- Dados de produção
- Informações que mudam constantemente

O que vai para o repositório:
- ✅ Código fonte
- ✅ Scripts de migração
- ✅ Configurações de exemplo (sem dados reais)

## 📋 Processo de Atualização na VPS

### Passo 1: Fazer Backup do Banco de Dados (OBRIGATÓRIO)

Antes de qualquer atualização, sempre faça backup:

#### PostgreSQL:
```bash
# Conectar na VPS
ssh usuario@seu-servidor.com

# Fazer backup do banco de dados
pg_dump -U seu_usuario -d nome_do_banco > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou com compressão (recomendado)
pg_dump -U seu_usuario -d nome_do_banco | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### SQLite:
```bash
# Na VPS
cp /caminho/para/seu/banco.db /caminho/para/backup/backup_$(date +%Y%m%d_%H%M%S).db
```

### Passo 2: Atualizar o Código na VPS

```bash
# 1. Conectar na VPS
ssh usuario@seu-servidor.com

# 2. Ir para o diretório do projeto
cd /caminho/para/local-mart

# 3. Verificar status atual
git status

# 4. Fazer pull das atualizações
git pull origin main

# 5. Verificar se há conflitos
git status
```

### Passo 3: Instalar Dependências (se necessário)

```bash
# Se houver novas dependências no package.json
cd /caminho/para/local-mart
npm install

# Backend também
cd backend
npm install
```

### Passo 4: Aplicar Migrações do Banco de Dados

#### Opção A: Script Automático (Recomendado)

```bash
cd /caminho/para/local-mart/backend
node scripts/aplicar-migracoes.js
```

#### Opção B: SQL Manual (PostgreSQL)

```bash
# Conectar ao PostgreSQL
psql -U seu_usuario -d nome_do_banco

# Executar migrações
\i database/migrations_consolidadas.sql

# Ou via linha de comando
psql -U seu_usuario -d nome_do_banco -f database/migrations_consolidadas.sql
```

#### Opção C: SQL Manual (SQLite)

```bash
sqlite3 /caminho/para/banco.db < backend/database/migrations_consolidadas_sqlite.sql
```

### Passo 5: Reiniciar os Serviços

#### Se estiver usando PM2 (Recomendado):

```bash
# Reiniciar todos os processos
pm2 restart all

# Ou reiniciar processos específicos
pm2 restart local-mart-backend
pm2 restart local-mart-frontend

# Verificar status
pm2 status
pm2 logs
```

#### Se estiver usando systemd:

```bash
# Reiniciar serviços
sudo systemctl restart local-mart-backend
sudo systemctl restart local-mart-frontend

# Verificar status
sudo systemctl status local-mart-backend
sudo systemctl status local-mart-frontend
```

#### Se estiver rodando manualmente:

```bash
# Parar processos antigos
pkill -f "node.*backend"
pkill -f "vite"

# Iniciar novamente
cd /caminho/para/local-mart
npm run dev
```

### Passo 6: Verificar se Está Funcionando

```bash
# Verificar se o backend está respondendo
curl http://localhost:3001/api/health

# Verificar logs
pm2 logs
# ou
tail -f backend/logs/combined.log
```

## 🔄 Script de Atualização Automático

Crie um script para automatizar o processo:

```bash
#!/bin/bash
# atualizar-vps.sh

set -e  # Parar em caso de erro

echo "🔄 Iniciando atualização do sistema..."

# 1. Backup do banco
echo "📦 Fazendo backup do banco de dados..."
pg_dump -U seu_usuario -d nome_do_banco | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
echo "✅ Backup criado"

# 2. Atualizar código
echo "📥 Atualizando código do repositório..."
cd /caminho/para/local-mart
git pull origin main
echo "✅ Código atualizado"

# 3. Instalar dependências
echo "📦 Instalando dependências..."
npm install
cd backend && npm install && cd ..
echo "✅ Dependências instaladas"

# 4. Aplicar migrações
echo "🗄️ Aplicando migrações do banco de dados..."
cd backend
node scripts/aplicar-migracoes.js
cd ..
echo "✅ Migrações aplicadas"

# 5. Reiniciar serviços
echo "🔄 Reiniciando serviços..."
pm2 restart all
echo "✅ Serviços reiniciados"

# 6. Verificar
echo "🔍 Verificando status..."
sleep 3
curl -f http://localhost:3001/api/health || echo "⚠️ Backend não está respondendo"
pm2 status

echo "✨ Atualização concluída!"
```

Torne o script executável:
```bash
chmod +x atualizar-vps.sh
```

## 📝 Checklist de Atualização

Antes de cada atualização:

- [ ] Backup do banco de dados criado
- [ ] Código atualizado via `git pull`
- [ ] Dependências instaladas (`npm install`)
- [ ] Migrações aplicadas
- [ ] Serviços reiniciados
- [ ] Sistema testado e funcionando
- [ ] Logs verificados (sem erros)

## 🐛 Solução de Problemas

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Migration failed"
```bash
# Verificar logs
tail -f backend/logs/combined.log

# Tentar migração novamente
cd backend
node scripts/aplicar-migracoes.js
```

### Erro: "Port already in use"
```bash
# Verificar processos
lsof -i :3001
lsof -i :3006

# Matar processos se necessário
kill -9 <PID>
```

### Rollback (Reverter Atualização)

Se algo der errado:

```bash
# 1. Reverter código
cd /caminho/para/local-mart
git reset --hard HEAD~1  # Voltar 1 commit
# ou
git checkout <commit-anterior>

# 2. Restaurar banco de dados
psql -U seu_usuario -d nome_do_banco < backup_YYYYMMDD_HHMMSS.sql

# 3. Reiniciar serviços
pm2 restart all
```

## 🔐 Variáveis de Ambiente

Certifique-se de que o arquivo `.env` na VPS está configurado:

```bash
# Verificar se existe
ls -la backend/.env

# Se não existir, copiar do exemplo
cp backend/.env.example backend/.env

# Editar com suas configurações
nano backend/.env
```

## 📊 Monitoramento

Após a atualização, monitore:

```bash
# Logs em tempo real
pm2 logs

# Status dos processos
pm2 status

# Uso de recursos
pm2 monit

# Logs do backend
tail -f backend/logs/combined.log
```

## 🚨 Importante

1. **SEMPRE faça backup antes de atualizar**
2. **Teste em ambiente de desenvolvimento primeiro** (se possível)
3. **Atualize em horário de baixo tráfego**
4. **Mantenha os backups organizados** (com data/hora)
5. **Documente qualquer problema encontrado**

## 📞 Comandos Úteis

```bash
# Ver últimas atualizações do Git
git log --oneline -10

# Ver diferenças locais
git diff

# Ver status do Git
git status

# Ver processos PM2
pm2 list

# Ver logs específicos
pm2 logs local-mart-backend --lines 50

# Reiniciar apenas backend
pm2 restart local-mart-backend

# Parar tudo
pm2 stop all

# Iniciar tudo
pm2 start all
```

---

**Última atualização:** 2024  
**Versão:** 1.0.0

