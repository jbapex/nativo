# 💾 Guia de Backup Automático

Este guia explica como configurar backups automáticos usando cron.

## 📋 Pré-requisitos

- Sistema operacional Linux/macOS
- Acesso ao crontab
- Node.js instalado e no PATH

## 🚀 Configuração

### 1. Tornar Script Executável

```bash
cd backend
chmod +x scripts/backup-cron.js
```

### 2. Configurar Variáveis de Ambiente

Edite o `.env` no diretório `backend/`:

```env
# Backup
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=7  # Manter backups por 7 dias
DB_PATH=./database.sqlite
UPLOAD_DIR=./uploads
```

### 3. Configurar Cron

#### Linux/macOS

```bash
# Abrir crontab
crontab -e
```

#### Adicionar Linha de Backup

**Backup diário às 2h da manhã:**
```cron
0 2 * * * cd /caminho/completo/do/projeto/backend && /usr/bin/node scripts/backup-cron.js >> /var/log/local-mart-backup.log 2>&1
```

**Backup a cada 6 horas:**
```cron
0 */6 * * * cd /caminho/completo/do/projeto/backend && /usr/bin/node scripts/backup-cron.js >> /var/log/local-mart-backup.log 2>&1
```

**Backup semanal (domingo às 3h):**
```cron
0 3 * * 0 cd /caminho/completo/do/projeto/backend && /usr/bin/node scripts/backup-cron.js >> /var/log/local-mart-backup.log 2>&1
```

### 4. Encontrar Caminho do Node.js

```bash
which node
# Exemplo de saída: /usr/bin/node ou /usr/local/bin/node
```

### 5. Encontrar Caminho do Projeto

```bash
pwd
# Use o caminho completo no cron
```

## 📅 Exemplos de Agendamento

### Backup Diário (Recomendado)
```cron
0 2 * * * cd /home/user/local-mart/backend && /usr/bin/node scripts/backup-cron.js >> /var/log/local-mart-backup.log 2>&1
```

### Backup a Cada 12 Horas
```cron
0 */12 * * * cd /home/user/local-mart/backend && /usr/bin/node scripts/backup-cron.js >> /var/log/local-mart-backup.log 2>&1
```

### Backup Múltiplos (Diário + Semanal)
```cron
# Backup diário às 2h
0 2 * * * cd /home/user/local-mart/backend && /usr/bin/node scripts/backup-cron.js >> /var/log/local-mart-backup.log 2>&1

# Backup semanal completo (domingo às 3h)
0 3 * * 0 cd /home/user/local-mart/backend && /usr/bin/node scripts/backup-cron.js >> /var/log/local-mart-backup-weekly.log 2>&1
```

## ✅ Verificar Configuração

### Listar Tarefas Cron
```bash
crontab -l
```

### Testar Manualmente
```bash
cd backend
node scripts/backup-cron.js
```

### Verificar Logs
```bash
tail -f /var/log/local-mart-backup.log
```

## 🔧 Troubleshooting

### Erro: "command not found: node"

**Solução:** Use o caminho completo do Node.js:
```bash
which node
# Use o caminho retornado no cron
```

### Erro: "Permission denied"

**Solução:** Verificar permissões:
```bash
chmod +x scripts/backup-cron.js
chmod +x scripts/backup.js
```

### Erro: "Cannot find module"

**Solução:** Certifique-se de estar no diretório correto:
```cron
cd /caminho/completo/do/projeto/backend && node scripts/backup-cron.js
```

### Backup não está sendo executado

**Solução:**
1. Verificar se o cron está rodando:
   ```bash
   sudo systemctl status cron  # Linux
   sudo launchctl list | grep cron  # macOS
   ```

2. Verificar logs do cron:
   ```bash
   # Linux
   grep CRON /var/log/syslog
   
   # macOS
   grep cron /var/log/system.log
   ```

3. Testar manualmente:
   ```bash
   cd backend
   node scripts/backup-cron.js
   ```

## 📊 Monitoramento

### Verificar Último Backup

```bash
ls -lh backend/backups/ | tail -5
```

### Verificar Tamanho dos Backups

```bash
du -sh backend/backups/
```

### Verificar Espaço em Disco

```bash
df -h
```

## 🔔 Notificações (Opcional)

Para receber notificações de erro, configure no `.env`:

```env
BACKUP_ERROR_NOTIFICATION=email:admin@example.com
# ou
BACKUP_ERROR_NOTIFICATION=slack:https://hooks.slack.com/services/...
```

**Nota:** A implementação de notificações precisa ser adicionada ao script.

## 📦 Backup em Produção

### Recomendações

1. **Frequência:** Backup diário mínimo
2. **Retenção:** Manter pelo menos 7 dias
3. **Localização:** Armazenar em servidor separado (S3, Google Drive, etc.)
4. **Teste:** Testar restauração periodicamente

### Backup para Cloud

Para fazer backup para S3, Google Drive, etc., você pode:

1. **Opção 1:** Usar script adicional que sincroniza `backups/` com cloud
2. **Opção 2:** Modificar `backup-cron.js` para fazer upload direto

**Exemplo com AWS S3:**
```bash
# Após backup local, fazer upload
aws s3 sync backend/backups/ s3://seu-bucket/backups/
```

## ✅ Checklist

- [ ] Script `backup-cron.js` executável
- [ ] Variáveis de ambiente configuradas
- [ ] Cron configurado
- [ ] Teste manual executado com sucesso
- [ ] Logs verificados
- [ ] Backup testado e restaurado
- [ ] Monitoramento configurado

## 📚 Recursos

- [Cron Guide](https://crontab.guru/)
- [Linux Cron Tutorial](https://www.cyberciti.biz/faq/how-do-i-add-jobs-to-cron-under-linux-or-unix-oses/)
- [macOS Cron Tutorial](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/ScheduledJobs.html)

---

**Importante:** Sempre teste a restauração do backup antes de confiar nele em produção!

