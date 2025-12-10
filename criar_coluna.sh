#!/bin/bash

# Script para criar a coluna banner_page_image
# Execute: bash criar_coluna.sh

echo "🔍 Procurando psql..."
PSQL_PATH=$(find "/Applications/PostgreSQL 17" -name psql -type f 2>/dev/null | head -1)

if [ -z "$PSQL_PATH" ]; then
    echo "❌ psql não encontrado. Use o pgAdmin em vez disso."
    echo ""
    echo "📋 Abra o pgAdmin e execute este SQL:"
    echo ""
    echo "ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;"
    echo "GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;"
    exit 1
fi

echo "✅ psql encontrado: $PSQL_PATH"
echo ""
echo "🔐 Você precisará digitar a senha do PostgreSQL"
echo ""

# Executar o comando SQL
$PSQL_PATH -h localhost -p 5433 -U josiasbonfimdefaria -d local_mart << EOF
ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;
GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'marketplace_campaigns' AND column_name = 'banner_page_image';
\q
EOF

echo ""
echo "✅ Comando executado!"

