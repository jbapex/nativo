-- Script DEFINITIVO para adicionar coluna show_timer na tabela promotions
-- Execute este script como superusuário do PostgreSQL

-- PostgreSQL
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'show_timer'
    ) THEN
        -- Adicionar coluna show_timer
        ALTER TABLE promotions 
        ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
        
        -- Atualizar registros existentes para FALSE (padrão)
        UPDATE promotions SET show_timer = FALSE WHERE show_timer IS NULL;
        
        RAISE NOTICE '✅ Coluna show_timer adicionada com sucesso na tabela promotions!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna show_timer já existe na tabela promotions';
    END IF;
END $$;

-- Verificar se foi adicionada
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotions' 
AND column_name = 'show_timer';

