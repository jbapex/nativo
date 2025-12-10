-- Script SQL para adicionar a coluna banner_page_image
-- Execute este script com um superusuário do PostgreSQL

-- Adicionar a coluna
ALTER TABLE marketplace_campaigns 
ADD COLUMN IF NOT EXISTS banner_page_image TEXT;

-- Dar permissões ao usuário localmart (opcional, mas recomendado)
GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;

-- Verificar se foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns' 
AND column_name = 'banner_page_image';

