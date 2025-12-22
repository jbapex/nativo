-- ============================================================================
-- MIGRAÇÕES SQLITE - Local Mart
-- ============================================================================
-- Este arquivo contém as migrações para SQLite
-- Execute este arquivo se estiver usando SQLite como banco de dados
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: TABELA PROMOTIONS - Colunas show_timer e applies_to
-- ============================================================================

-- SQLite não suporta IF NOT EXISTS para ADD COLUMN diretamente
-- Então precisamos verificar manualmente ou usar um wrapper

-- 1.1 Adicionar coluna show_timer (se não existir)
-- Nota: SQLite não suporta verificação automática, então execute apenas se necessário
-- Para verificar se a coluna existe, execute primeiro:
-- PRAGMA table_info(promotions);

-- Se a coluna não existir, execute:
-- ALTER TABLE promotions ADD COLUMN show_timer INTEGER DEFAULT 0; -- SQLite usa INTEGER para BOOLEAN

-- 1.2 Adicionar coluna applies_to (se não existir)
-- ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT 'both';

-- ============================================================================
-- SEÇÃO 2: TABELA STORE_CUSTOMIZATIONS - Colunas adicionais
-- ============================================================================

-- SQLite permite múltiplas colunas em uma única instrução ALTER TABLE
-- Mas é mais seguro fazer uma por vez

-- Cores adicionais
-- ALTER TABLE store_customizations ADD COLUMN background_color TEXT DEFAULT '#ffffff';
-- ALTER TABLE store_customizations ADD COLUMN footer_color TEXT DEFAULT '#f9fafb';

-- Banners
-- ALTER TABLE store_customizations ADD COLUMN banner_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN banners TEXT;

-- Seções
-- ALTER TABLE store_customizations ADD COLUMN about_section_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN about_text TEXT;
-- ALTER TABLE store_customizations ADD COLUMN featured_section_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN categories_section_enabled INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN contact_section_enabled INTEGER DEFAULT 1;

-- Social
-- ALTER TABLE store_customizations ADD COLUMN instagram_url TEXT;
-- ALTER TABLE store_customizations ADD COLUMN facebook_url TEXT;
-- ALTER TABLE store_customizations ADD COLUMN whatsapp_number TEXT;

-- Layout
-- ALTER TABLE store_customizations ADD COLUMN layout_style TEXT DEFAULT 'modern';
-- ALTER TABLE store_customizations ADD COLUMN show_search INTEGER DEFAULT 1;
-- ALTER TABLE store_customizations ADD COLUMN show_categories INTEGER DEFAULT 1;

-- ============================================================================
-- SEÇÃO 3: TABELA CATEGORY_ATTRIBUTES - Criar tabela se não existir
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_attributes (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  label TEXT,
  type TEXT NOT NULL,
  options TEXT,
  is_filterable INTEGER DEFAULT 1,
  is_required INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
  ON category_attributes(category_id);

CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
  ON category_attributes(category_id, is_filterable);

-- ============================================================================
-- SEÇÃO 4: TABELAS DE CAMPANHAS DO MARKETPLACE
-- ============================================================================

-- 4.1 Criar tabela marketplace_campaigns
CREATE TABLE IF NOT EXISTS marketplace_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    min_discount_percent REAL DEFAULT 10.00,
    max_products_per_store INTEGER,
    allowed_categories TEXT,
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

-- 4.2 Criar tabela campaign_participations
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

-- 4.3 Criar índices
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
-- NOTA IMPORTANTE PARA SQLITE
-- ============================================================================
-- SQLite não suporta ADD COLUMN IF NOT EXISTS
-- Você precisa verificar manualmente se as colunas existem antes de adicionar
-- Use o código Node.js em migrations_sqlite.js para aplicar automaticamente
-- ============================================================================

