-- Script para adicionar todas as colunas faltantes na tabela store_customizations
-- Execute este script no PostgreSQL se as colunas não forem criadas automaticamente

-- Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_customizations') THEN
        -- Adicionar colunas faltantes uma por uma
        -- Usar IF NOT EXISTS para evitar erros se a coluna já existir
        
        -- Cores adicionais
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff';
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS footer_color VARCHAR(7) DEFAULT '#f9fafb';
        
        -- Banners
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS banner_enabled BOOLEAN DEFAULT TRUE;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS banners TEXT; -- JSON array
        
        -- Seções
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS about_section_enabled BOOLEAN DEFAULT TRUE;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS about_text TEXT;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS featured_section_enabled BOOLEAN DEFAULT TRUE;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS categories_section_enabled BOOLEAN DEFAULT TRUE;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS contact_section_enabled BOOLEAN DEFAULT TRUE;
        
        -- Social
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS instagram_url TEXT;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS facebook_url TEXT;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
        
        -- Layout
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS layout_style VARCHAR(50) DEFAULT 'modern';
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_search BOOLEAN DEFAULT TRUE;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_categories BOOLEAN DEFAULT TRUE;
        
        RAISE NOTICE 'Colunas adicionadas com sucesso à tabela store_customizations!';
    ELSE
        RAISE NOTICE 'Tabela store_customizations não existe. Execute o schema completo primeiro.';
    END IF;
END $$;

-- Verificar colunas existentes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'store_customizations'
ORDER BY ordinal_position;

