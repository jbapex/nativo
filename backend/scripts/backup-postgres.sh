#!/bin/bash

# Script de Backup Automático do PostgreSQL
# Uso: ./backup-postgres.sh

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações (carregar do .env se existir)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$BACKEND_DIR/.env"

# Carregar variáveis do .env
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | grep -E '^DB_' | xargs)
fi

# Configurações padrão (usar do .env ou padrões)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nativo_db}"
DB_USER="${DB_USER:-nativo_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Diretórios
BACKUP_DIR="$BACKEND_DIR/../backups/postgres"
LOG_DIR="$BACKEND_DIR/logs"
LOG_FILE="$LOG_DIR/backup-postgres.log"

# Criar diretórios se não existirem
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Data e hora para nome do arquivo
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Função de log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "${GREEN}🔄 Iniciando backup do PostgreSQL...${NC}"
log "Database: $DB_NAME"
log "Host: $DB_HOST:$DB_PORT"
log "User: $DB_USER"

# Verificar se pg_dump está instalado
if ! command -v pg_dump &> /dev/null; then
    log "${RED}❌ Erro: pg_dump não encontrado. Instale o PostgreSQL client.${NC}"
    exit 1
fi

# Verificar se PostgreSQL está acessível
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    log "${RED}❌ Erro: Não foi possível conectar ao PostgreSQL${NC}"
    log "Verifique as credenciais no arquivo .env"
    exit 1
fi

# Fazer backup
log "📦 Criando dump do banco de dados..."
if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE" 2>>"$LOG_FILE"; then
    log "${GREEN}✅ Dump criado com sucesso${NC}"
else
    log "${RED}❌ Erro ao criar dump${NC}"
    exit 1
fi

# Comprimir backup
log "🗜️  Comprimindo backup..."
if gzip -f "$BACKUP_FILE" 2>>"$LOG_FILE"; then
    log "${GREEN}✅ Backup comprimido: $COMPRESSED_FILE${NC}"
else
    log "${YELLOW}⚠️  Aviso: Não foi possível comprimir (gzip não encontrado ou erro)${NC}"
    COMPRESSED_FILE="$BACKUP_FILE"
fi

# Obter tamanho do arquivo
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
log "📊 Tamanho do backup: $FILE_SIZE"

# Limpar backups antigos (manter últimos 7 dias)
log "🧹 Limpando backups antigos (mantendo últimos 7 dias)..."
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +7 -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    log "${YELLOW}🗑️  Removidos $DELETED backup(s) antigo(s)${NC}"
else
    log "✅ Nenhum backup antigo para remover"
fi

# Listar backups disponíveis
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)
log "📁 Total de backups disponíveis: $BACKUP_COUNT"

# Verificar integridade do backup (opcional, mas recomendado)
log "🔍 Verificando integridade do backup..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    log "${GREEN}✅ Banco de dados ainda acessível após backup${NC}"
else
    log "${YELLOW}⚠️  Aviso: Não foi possível verificar integridade${NC}"
fi

log "${GREEN}✅ Backup concluído com sucesso!${NC}"
log "📁 Arquivo: $COMPRESSED_FILE"
log "📊 Tamanho: $FILE_SIZE"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0

