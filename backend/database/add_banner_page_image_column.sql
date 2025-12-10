-- Script para adicionar a coluna banner_page_image na tabela marketplace_campaigns
-- Execute este script no PostgreSQL se a coluna não existir

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_campaigns' 
        AND column_name = 'banner_page_image'
    ) THEN
        -- Adicionar a coluna se não existir
        ALTER TABLE marketplace_campaigns 
        ADD COLUMN banner_page_image TEXT;
        
        RAISE NOTICE 'Coluna banner_page_image adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna banner_page_image já existe.';
    END IF;
END $$;

-- Verificar se foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns' 
AND column_name = 'banner_page_image';

