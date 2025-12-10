-- Script SQL para criar a tabela category_attributes no PostgreSQL
-- Execute este script com um superusuário (postgres ou seu usuário admin)
-- 
-- Opção 1: Via pgAdmin
--   1. Abra o pgAdmin
--   2. Conecte-se ao servidor PostgreSQL
--   3. Selecione o banco "local_mart"
--   4. Clique com botão direito em "Query Tool"
--   5. Cole este script e execute (F5)
--
-- Opção 2: Via psql (terminal)
--   psql -h localhost -p 5433 -U postgres -d local_mart -f backend/scripts/criar_tabela_category_attributes.sql
--
-- Opção 3: Via psql interativo
--   psql -h localhost -p 5433 -U postgres -d local_mart
--   Depois cole e execute este script

-- Verificar se a tabela já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'category_attributes'
    ) THEN
        -- Criar tabela
        CREATE TABLE category_attributes (
            id VARCHAR(50) PRIMARY KEY,
            category_id VARCHAR(50) NOT NULL,
            name TEXT NOT NULL,
            label TEXT,
            type VARCHAR(50) NOT NULL,
            options TEXT,
            is_filterable BOOLEAN DEFAULT TRUE,
            is_required BOOLEAN DEFAULT FALSE,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_category_attributes_category
                FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        -- Criar índices
        CREATE INDEX idx_category_attributes_category 
        ON category_attributes(category_id);

        CREATE INDEX idx_category_attributes_filterable 
        ON category_attributes(category_id, is_filterable);

        RAISE NOTICE 'Tabela category_attributes criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela category_attributes já existe.';
    END IF;
END $$;

-- Verificar estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'category_attributes'
ORDER BY ordinal_position;

