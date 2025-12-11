-- ============================================================================
-- MIGRAÇÕES CONSOLIDADAS - LOCAL MART (SQLite)
-- ============================================================================
-- Este arquivo contém todas as migrações de banco de dados para SQLite
--
-- IMPORTANTE: Execute este script no SQLite
--
-- Data: 2024
-- Versão: 1.0.0
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: TABELA PROMOTIONS
-- ============================================================================

-- Adicionar coluna show_timer (temporizador sempre ativo por padrão)
-- Verificar se já existe antes de adicionar
-- SQLite não suporta IF NOT EXISTS em ALTER TABLE, então use try/catch no código
-- ou execute manualmente verificando antes

-- Adicionar coluna show_timer
-- Se der erro "duplicate column name", a coluna já existe
ALTER TABLE promotions ADD COLUMN show_timer INTEGER DEFAULT 0;

-- Adicionar coluna applies_to (onde a promoção é válida)
-- Se der erro "duplicate column name", a coluna já existe
ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT 'both';

-- ============================================================================
-- SEÇÃO 2: TABELA STORE_CUSTOMIZATIONS
-- ============================================================================

-- Cores adicionais
ALTER TABLE store_customizations ADD COLUMN background_color TEXT DEFAULT '#ffffff';
ALTER TABLE store_customizations ADD COLUMN footer_color TEXT DEFAULT '#f9fafb';

-- Banners
ALTER TABLE store_customizations ADD COLUMN banner_enabled INTEGER DEFAULT 1;
ALTER TABLE store_customizations ADD COLUMN banners TEXT; -- JSON array

-- Seções
ALTER TABLE store_customizations ADD COLUMN about_section_enabled INTEGER DEFAULT 1;
ALTER TABLE store_customizations ADD COLUMN about_text TEXT;
ALTER TABLE store_customizations ADD COLUMN featured_section_enabled INTEGER DEFAULT 1;
ALTER TABLE store_customizations ADD COLUMN categories_section_enabled INTEGER DEFAULT 1;
ALTER TABLE store_customizations ADD COLUMN contact_section_enabled INTEGER DEFAULT 1;

-- Redes sociais
ALTER TABLE store_customizations ADD COLUMN instagram_url TEXT;
ALTER TABLE store_customizations ADD COLUMN facebook_url TEXT;
ALTER TABLE store_customizations ADD COLUMN whatsapp_number TEXT;

-- Layout
ALTER TABLE store_customizations ADD COLUMN layout_style TEXT DEFAULT 'modern';
ALTER TABLE store_customizations ADD COLUMN show_search INTEGER DEFAULT 1;
ALTER TABLE store_customizations ADD COLUMN show_categories INTEGER DEFAULT 1;

-- ============================================================================
-- SEÇÃO 3: TABELA CATEGORY_ATTRIBUTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_attributes (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT,
    type TEXT NOT NULL,
    options TEXT, -- JSON string com opções
    is_filterable INTEGER DEFAULT 1,
    is_required INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
    ON category_attributes(category_id);

CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
    ON category_attributes(category_id, is_filterable);

-- ============================================================================
-- SEÇÃO 4: TABELAS DE CAMPANHAS DO MARKETPLACE
-- ============================================================================

-- Tabela de Campanhas
CREATE TABLE IF NOT EXISTS marketplace_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    min_discount_percent REAL DEFAULT 10.00,
    max_products_per_store INTEGER,
    allowed_categories TEXT, -- JSON array
    requires_approval INTEGER DEFAULT 0,
    banner_image TEXT,
    banner_text TEXT,
    banner_page_image TEXT,
    badge_text TEXT DEFAULT 'EM PROMOÇÃO',
    badge_color TEXT DEFAULT '#EF4444',
    active INTEGER DEFAULT 1,
    featured INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Participações em Campanhas
CREATE TABLE IF NOT EXISTS campaign_participations (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    discount_percent REAL NOT NULL,
    discount_fixed REAL,
    status TEXT DEFAULT 'pending',
    approved_at DATETIME,
    approved_by TEXT,
    original_price REAL NOT NULL,
    promo_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES marketplace_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, product_id)
);

-- Adicionar coluna banner_page_image se não existir
-- SQLite não suporta IF NOT EXISTS em ALTER TABLE
-- Se der erro "duplicate column name", a coluna já existe
-- ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT;

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

-- ============================================================================
-- VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar estrutura da tabela promotions
PRAGMA table_info(promotions);

-- Verificar tabelas criadas
SELECT name FROM sqlite_master 
WHERE type='table' 
AND name IN ('category_attributes', 'marketplace_campaigns', 'campaign_participations');

-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================

