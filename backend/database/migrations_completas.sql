-- ============================================================================
-- MIGRAÇÕES COMPLETAS DO BANCO DE DADOS - Local Mart
-- ============================================================================
-- Este arquivo contém todas as migrações necessárias para atualizar o banco
-- de dados com as funcionalidades implementadas.
--
-- IMPORTANTE:
-- - Execute este script como superusuário do PostgreSQL
-- - Ou execute cada seção individualmente se necessário
-- - As verificações IF NOT EXISTS garantem que não haverá erros se já executado
-- - Compatível com PostgreSQL 9.1+
--
-- Data: 2024
-- Versão: 1.0.0
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: TABELA PROMOTIONS - Colunas show_timer e applies_to
-- ============================================================================

-- 1.1 Adicionar coluna show_timer na tabela promotions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'promotions' 
        AND column_name = 'show_timer'
    ) THEN
        ALTER TABLE promotions 
        ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
        
        -- Atualizar registros existentes para FALSE (padrão)
        UPDATE promotions SET show_timer = FALSE WHERE show_timer IS NULL;
        
        RAISE NOTICE '✅ Coluna show_timer adicionada com sucesso na tabela promotions!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna show_timer já existe na tabela promotions';
    END IF;
END $$;

-- 1.2 Adicionar coluna applies_to na tabela promotions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        AND column_name = 'applies_to'
    ) THEN
        ALTER TABLE promotions 
        ADD COLUMN applies_to VARCHAR(50) DEFAULT 'both';
        
        -- Atualizar registros existentes para 'both' (padrão)
        UPDATE promotions SET applies_to = 'both' WHERE applies_to IS NULL;
        
        RAISE NOTICE '✅ Coluna applies_to adicionada com sucesso na tabela promotions!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna applies_to já existe na tabela promotions';
    END IF;
END $$;

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

-- ============================================================================
-- SEÇÃO 2: TABELA STORE_CUSTOMIZATIONS - Colunas adicionais
-- ============================================================================

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
        
        -- Social
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS instagram_url TEXT;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS facebook_url TEXT;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
        
        -- Layout
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS layout_style VARCHAR(50) DEFAULT 'modern';
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_search BOOLEAN DEFAULT TRUE;
        ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_categories BOOLEAN DEFAULT TRUE;
        
        RAISE NOTICE '✅ Colunas adicionadas com sucesso à tabela store_customizations!';
    ELSE
        RAISE NOTICE '⚠️ Tabela store_customizations não existe. Execute o schema completo primeiro.';
    END IF;
END $$;

-- Verificar colunas da tabela store_customizations
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'store_customizations'
ORDER BY ordinal_position;

-- ============================================================================
-- SEÇÃO 3: TABELA CATEGORY_ATTRIBUTES - Criar tabela se não existir
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_attributes (
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
  ON category_attributes(category_id);

CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
  ON category_attributes(category_id, is_filterable);

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'category_attributes'
ORDER BY ordinal_position;

-- ============================================================================
-- SEÇÃO 4: TABELAS DE CAMPANHAS DO MARKETPLACE
-- ============================================================================

-- 4.1 Criar tabela marketplace_campaigns
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
    requires_approval BOOLEAN DEFAULT FALSE, -- Se precisa aprovação manual (FALSE = automático)
    
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

-- 4.2 Criar tabela campaign_participations
CREATE TABLE IF NOT EXISTS campaign_participations (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    
    -- Desconto aplicado pelo lojista
    discount_percent DECIMAL(5,2) NOT NULL, -- Percentual de desconto
    discount_fixed DECIMAL(10,2), -- Desconto fixo (opcional, se aplicável)
    
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

-- 4.3 Adicionar coluna banner_page_image se não existir (para instalações antigas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_campaigns' 
        AND column_name = 'banner_page_image'
    ) THEN
        ALTER TABLE marketplace_campaigns 
        ADD COLUMN banner_page_image TEXT;
        
        RAISE NOTICE '✅ Coluna banner_page_image adicionada à tabela marketplace_campaigns!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna banner_page_image já existe na tabela marketplace_campaigns';
    END IF;
END $$;

-- 4.4 Criar índices para performance das campanhas
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

-- Verificar tabelas de campanhas
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('marketplace_campaigns', 'campaign_participations')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SEÇÃO 5: VERIFICAÇÃO FINAL
-- ============================================================================

-- Resumo das alterações
SELECT 
    'promotions' as tabela,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promotions' 
AND column_name IN ('show_timer', 'applies_to')
UNION ALL
SELECT 
    'store_customizations' as tabela,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_customizations'
AND column_name IN (
    'background_color', 'footer_color', 'banner_enabled', 'banners',
    'about_section_enabled', 'about_text', 'featured_section_enabled',
    'categories_section_enabled', 'contact_section_enabled',
    'instagram_url', 'facebook_url', 'whatsapp_number',
    'layout_style', 'show_search', 'show_categories'
)
UNION ALL
SELECT 
    'category_attributes' as tabela,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'category_attributes'
UNION ALL
SELECT 
    'marketplace_campaigns' as tabela,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns'
AND column_name = 'banner_page_image'
ORDER BY tabela, column_name;

-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================
-- Se todas as mensagens acima apareceram sem erros, as migrações foram
-- aplicadas com sucesso!
-- ============================================================================

