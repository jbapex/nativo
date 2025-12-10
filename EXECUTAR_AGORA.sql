-- Execute este script no PostgreSQL para criar todas as colunas faltantes
-- Copie e cole no pgAdmin ou execute via psql

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'store_customizations'
);

-- Adicionar todas as colunas faltantes
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

-- Verificar colunas criadas
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'store_customizations'
ORDER BY ordinal_position;

