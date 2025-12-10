#!/bin/bash
# Script para executar SQL no PostgreSQL
# Tenta usar o usuário do sistema como superusuário

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_NAME=${DB_NAME:-local_mart}
SUPERUSER=${SUPERUSER:-$(whoami)}

echo "🔐 Tentando executar como superusuário: $SUPERUSER"
echo "📝 Executando: ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;"
echo ""
echo "💡 Se pedir senha, digite a senha do usuário $SUPERUSER"
echo ""

psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -d $DB_NAME -c "ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;" && \
psql -h $DB_HOST -p $DB_PORT -U $SUPERUSER -d $DB_NAME -c "GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;" && \
echo "✅ Coluna criada e permissões concedidas!" || \
echo "❌ Erro ao executar. Tente executar manualmente o arquivo backend/scripts/add_banner_page_image.sql"
