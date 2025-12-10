-- ============================================
-- SCRIPT PARA CRIAR COLUNAS FALTANTES
-- Execute este script no pgAdmin
-- ============================================

-- 1. Criar todas as colunas faltantes
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

-- 2. Verificar se as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'store_customizations'
ORDER BY column_name;

-- 3. (Opcional) Dar permissões ao usuário localmart
-- Descomente as linhas abaixo se necessário:
-- GRANT ALL PRIVILEGES ON TABLE store_customizations TO localmart;
-- GRANT ALL PRIVILEGES ON ALL COLUMNS IN TABLE store_customizations TO localmart;

