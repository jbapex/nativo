-- Verificar se a coluna banner_page_image existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns' 
AND column_name = 'banner_page_image';
