# 🚀 Guia Rápido de Deploy/Atualização

## 📋 Atualizar Sistema na VPS

### Método Rápido (Script Automático)

1. **Conectar na VPS:**
```bash
ssh usuario@seu-servidor.com
```

2. **Executar script de atualização:**
```bash
cd /caminho/para/local-mart
./atualizar-vps.sh
```

### Método Manual (Passo a Passo)

1. **Backup do banco:**
```bash
pg_dump -U usuario -d banco | gzip > backup_$(date +%Y%m%d).sql.gz
```

2. **Atualizar código:**
```bash
cd /caminho/para/local-mart
git pull origin main
```

3. **Instalar dependências:**
```bash
npm install
cd backend && npm install && cd ..
```

4. **Aplicar migrações:**
```bash
cd backend
node scripts/aplicar-migracoes.js
```

5. **Reiniciar serviços:**
```bash
pm2 restart all
```

## ⚠️ IMPORTANTE

- **NUNCA** faça commit do banco de dados no Git
- **SEMPRE** faça backup antes de atualizar
- Teste em desenvolvimento primeiro (se possível)

## 📚 Documentação Completa

Veja `GUIA_DEPLOY_VPS.md` para documentação detalhada.

