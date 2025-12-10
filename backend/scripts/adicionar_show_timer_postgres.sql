-- Script para adicionar coluna show_timer na tabela promotions
-- Execute este script como superusuário do PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        AND column_name = 'show_timer'
    ) THEN
        -- Adicionar coluna show_timer
        ALTER TABLE promotions 
        ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna show_timer adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna show_timer já existe na tabela promotions';
    END IF;
END $$;

