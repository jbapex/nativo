-- Script para adicionar coluna applies_to na tabela promotions
-- Execute este script como superusuário do PostgreSQL

-- SQLite
-- ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT 'both';

-- PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        AND column_name = 'applies_to'
    ) THEN
        -- Adicionar coluna applies_to
        ALTER TABLE promotions 
        ADD COLUMN applies_to VARCHAR(20) DEFAULT 'both';
        
        -- Atualizar registros existentes para 'both' (padrão)
        UPDATE promotions SET applies_to = 'both' WHERE applies_to IS NULL;
        
        RAISE NOTICE 'Coluna applies_to adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna applies_to já existe na tabela promotions';
    END IF;
END $$;

