#!/bin/bash

# Script para criar colunas faltantes em store_customizations via terminal

echo "🔧 Criando colunas faltantes em store_customizations..."

# Configurações do banco (ajuste se necessário)
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="local_mart"
DB_USER="localmart"

# SQL para criar as colunas
SQL_COMMANDS="
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS footer_color VARCHAR(7) DEFAULT '#f9fafb';
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS banner_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS banners TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS about_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS featured_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS categories_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS contact_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS layout_style VARCHAR(50) DEFAULT 'modern';
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_search BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_categories BOOLEAN DEFAULT TRUE;
"

# Tentar executar via psql
if command -v psql &> /dev/null; then
    echo "✅ psql encontrado, executando comandos..."
    echo "$SQL_COMMANDS" | PGPASSWORD=localmart123 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Colunas criadas com sucesso!"
        echo ""
        echo "📋 Verificando colunas criadas..."
        PGPASSWORD=localmart123 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'store_customizations'
        ORDER BY column_name;
        "
    else
        echo "❌ Erro ao executar comandos SQL"
        exit 1
    fi
else
    echo "❌ psql não encontrado no PATH"
    echo ""
    echo "Opções:"
    echo "1. Instale o PostgreSQL client tools"
    echo "2. Use o pgAdmin para executar o arquivo EXECUTAR_AGORA.sql"
    echo "3. Execute manualmente: psql -h localhost -p 5433 -U localmart -d local_mart"
    exit 1
fi

