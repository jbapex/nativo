-- ============================================================================
-- MIGRAÇÕES CONSOLIDADAS - LOCAL MART
-- ============================================================================
-- Este arquivo contém todas as migrações de banco de dados necessárias
-- para aplicar as melhorias implementadas no sistema.
--
-- IMPORTANTE: Execute este script com permissões de superusuário no PostgreSQL
-- ou com permissões adequadas no SQLite.
--
-- Data: 2024
-- Versão: 1.0.0
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: TABELA PROMOTIONS
-- ============================================================================
-- Adiciona colunas show_timer e applies_to para suportar temporizador
-- de ofertas e definir onde a promoção é válida (store/marketplace/ambos)

-- PostgreSQL
DO $$
BEGIN
    -- Adicionar coluna show_timer (temporizador sempre ativo por padrão)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'show_timer'
    ) THEN
        ALTER TABLE promotions 
        ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
        
        -- Atualizar registros existentes para FALSE (padrão)
        UPDATE promotions SET show_timer = FALSE WHERE show_timer IS NULL;
        
        RAISE NOTICE '✅ Coluna show_timer adicionada na tabela promotions';
    ELSE
        RAISE NOTICE 'ℹ️  Coluna show_timer já existe na tabela promotions';
    END IF;
    
    -- Adicionar coluna applies_to (onde a promoção é válida)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        AND column_name = 'applies_to'
    ) THEN
        ALTER TABLE promotions 
        ADD COLUMN applies_to VARCHAR(50) DEFAULT 'both';
        
        -- Atualizar registros existentes para 'both' (padrão)
        UPDATE promotions SET applies_to = 'both' WHERE applies_to IS NULL;
        
        RAISE NOTICE '✅ Coluna applies_to adicionada na tabela promotions';
    ELSE
        RAISE NOTICE 'ℹ️  Coluna applies_to já existe na tabela promotions';
    END IF;
END $$;

-- SQLite (execute separadamente se estiver usando SQLite)
-- ALTER TABLE promotions ADD COLUMN show_timer INTEGER DEFAULT 0;
-- ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT 'both';

-- ============================================================================
-- SEÇÃO 2: TABELA STORE_CUSTOMIZATIONS
-- ============================================================================
-- Adiciona colunas para personalização visual e funcional das lojas

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_customizations') THEN
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
        
        -- Redes sociais
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS instagram_url TEXT;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS facebook_url TEXT;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
        
        -- Layout
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS layout_style VARCHAR(50) DEFAULT 'modern';
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_search BOOLEAN DEFAULT TRUE;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_categories BOOLEAN DEFAULT TRUE;
        
        RAISE NOTICE '✅ Colunas adicionadas na tabela store_customizations';
    ELSE
        RAISE NOTICE '⚠️  Tabela store_customizations não existe. Execute o schema completo primeiro.';
    END IF;
END $$;

-- SQLite (execute separadamente se estiver usando SQLite)
-- ALTER TABLE store_customizations ADD COLUMN background_color TEXT DEFAULT '#ffffff';
-- ALTER TABLE store_customizations ADD COLUMN footer_color TEXT DEFAULT '#f9fafb';
-- ALTER TABLE store_customizations ADD COLUMN banner_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN banners TEXT;
-- ALTER TABLE store_customizations ADD COLUMN about_section_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN about_text TEXT;
-- ALTER TABLE store_customizations ADD COLUMN featured_section_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN categories_section_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN contact_section_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN instagram_url TEXT;
-- ALTER TABLE store_customizations ADD COLUMN facebook_url TEXT;
-- ALTER TABLE store_customizations ADD COLUMN whatsapp_number TEXT;
-- ALTER TABLE store_customizations ADD COLUMN layout_style TEXT DEFAULT 'modern';
-- ALTER TABLE store_customizations ADD COLUMN show_search INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN show_categories INTEGER DEFAULT 1;

-- ============================================================================
-- SEÇÃO 3: TABELA CATEGORY_ATTRIBUTES
-- ============================================================================
-- Cria tabela para atributos de categorias (filtros, especificações)

CREATE TABLE IF NOT EXISTS category_attributes (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    label TEXT,
    type VARCHAR(50) NOT NULL,
    options TEXT, -- JSON string com opções (para select, radio, etc)
    is_filterable BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_attributes_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
    ON category_attributes(category_id);

CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
    ON category_attributes(category_id, is_filterable);

-- SQLite (mesma estrutura, apenas tipos diferentes)
-- CREATE TABLE IF NOT EXISTS category_attributes (
--     id TEXT PRIMARY KEY,
--     category_id TEXT NOT NULL,
--     name TEXT NOT NULL,
--     label TEXT,
--     type TEXT NOT NULL,
--     options TEXT,
--     is_filterable INTEGER DEFAULT 1,
--     is_required INTEGER DEFAULT 0,
--     order_index INTEGER DEFAULT 0,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (category_id) REFERENCES categories(id)
-- );

-- ============================================================================
-- SEÇÃO 4: TABELAS DE CAMPANHAS DO MARKETPLACE
-- ============================================================================
-- Cria tabelas para campanhas promocionais do marketplace (Black Friday, etc)

-- Tabela de Campanhas
CREATE TABLE IF NOT EXISTS marketplace_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- Nome da campanha (ex: "Black Friday 2024")
    description TEXT, -- Descrição da campanha
    slug TEXT UNIQUE, -- URL amigável (ex: "black-friday-2024")
    
    -- Período da campanha
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    
    -- Regras de participação
    min_discount_percent DECIMAL(5,2) DEFAULT 10.00, -- Desconto mínimo obrigatório (%)
    max_products_per_store INTEGER DEFAULT NULL, -- Limite de produtos por loja (NULL = ilimitado)
    allowed_categories TEXT, -- JSON array de category_ids permitidas (NULL = todas)
    requires_approval BOOLEAN DEFAULT FALSE, -- Se precisa aprovação manual
    
    -- Configurações visuais
    banner_image TEXT, -- Imagem do banner da campanha
    banner_text TEXT, -- Texto do banner
    banner_page_image TEXT, -- Imagem da página da campanha
    badge_text TEXT DEFAULT 'EM PROMOÇÃO', -- Texto do badge nos produtos
    badge_color TEXT DEFAULT '#EF4444', -- Cor do badge
    
    -- Status
    active BOOLEAN DEFAULT TRUE, -- Se a campanha está ativa
    featured BOOLEAN DEFAULT FALSE, -- Se aparece em destaque no Home
    
    -- Estatísticas (calculadas)
    total_participants INTEGER DEFAULT 0, -- Número de lojistas participantes
    total_products INTEGER DEFAULT 0, -- Número de produtos em promoção
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Participações em Campanhas
CREATE TABLE IF NOT EXISTS campaign_participations (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    
    -- Desconto aplicado pelo lojista
    discount_percent DECIMAL(5,2) NOT NULL, -- Percentual de desconto
    discount_fixed DECIMAL(10,2), -- Desconto fixo (opcional)
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMP,
    approved_by TEXT, -- ID do admin que aprovou (se requires_approval = true)
    
    -- Preços (snapshot no momento da inscrição)
    original_price DECIMAL(10,2) NOT NULL,
    promo_price DECIMAL(10,2) NOT NULL, -- Preço com desconto
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES marketplace_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, product_id) -- Um produto só pode participar uma vez da mesma campanha
);

-- Adicionar coluna banner_page_image se não existir (para campanhas já criadas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_campaigns' 
        AND column_name = 'banner_page_image'
    ) THEN
        ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT;
        RAISE NOTICE '✅ Coluna banner_page_image adicionada na tabela marketplace_campaigns';
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_active 
    ON marketplace_campaigns(active, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_campaigns_featured 
    ON marketplace_campaigns(featured, active);

CREATE INDEX IF NOT EXISTS idx_participations_campaign 
    ON campaign_participations(campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_participations_store 
    ON campaign_participations(store_id);

CREATE INDEX IF NOT EXISTS idx_participations_product 
    ON campaign_participations(product_id);

-- SQLite (mesma estrutura, apenas tipos diferentes)
-- CREATE TABLE IF NOT EXISTS marketplace_campaigns (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     description TEXT,
--     slug TEXT UNIQUE,
--     start_date DATETIME NOT NULL,
--     end_date DATETIME NOT NULL,
--     min_discount_percent REAL DEFAULT 10.00,
--     max_products_per_store INTEGER,
--     allowed_categories TEXT,
--     requires_approval INTEGER DEFAULT 0,
--     banner_image TEXT,
--     banner_text TEXT,
--     banner_page_image TEXT,
--     badge_text TEXT DEFAULT 'EM PROMOÇÃO',
--     badge_color TEXT DEFAULT '#EF4444',
--     active INTEGER DEFAULT 1,
--     featured INTEGER DEFAULT 0,
--     total_participants INTEGER DEFAULT 0,
--     total_products INTEGER DEFAULT 0,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================================================
-- VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar colunas da tabela promotions
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotions' 
AND column_name IN ('show_timer', 'applies_to')
ORDER BY column_name;

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('category_attributes', 'marketplace_campaigns', 'campaign_participations')
ORDER BY table_name;

-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================
-- Se todas as migrações foram executadas com sucesso, você verá:
-- ✅ Mensagens de sucesso para cada seção
-- ✅ Resultados das verificações finais
-- 
-- Em caso de erro, verifique:
-- 1. Permissões do usuário (precisa ser superusuário no PostgreSQL)
-- 2. Se as tabelas base existem (stores, categories, products, etc)
-- 3. Se há conflitos com colunas/tabelas já existentes
-- ============================================================================

