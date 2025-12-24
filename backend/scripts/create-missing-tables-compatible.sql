-- Script para criar tabelas faltantes usando TEXT (compatível com SQLite migrado)
-- Execute via: PGPASSWORD='Nativo2025SecureDB' psql -h localhost -p 5434 -U nativo_user -d nativo_db -f create-missing-tables-compatible.sql

-- Tabela de Categorias (se não existir)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    store_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Lojas (se não existir)
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    store_type TEXT DEFAULT 'physical',
    whatsapp TEXT,
    city_id TEXT,
    category_id TEXT,
    has_physical_store BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending',
    plan_id TEXT,
    checkout_enabled BOOLEAN DEFAULT FALSE,
    pix_key TEXT,
    payment_link TEXT,
    payment_instructions TEXT,
    mercadopago_access_token TEXT,
    mercadopago_public_key TEXT,
    payment_methods TEXT DEFAULT '["whatsapp"]',
    shipping_fixed_price DECIMAL(10,2),
    shipping_calculate_on_whatsapp BOOLEAN DEFAULT FALSE,
    shipping_free_threshold DECIMAL(10,2),
    slug TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Tabela de Produtos (se não existir)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    images TEXT,
    tags TEXT,
    active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    stock INTEGER,
    status TEXT DEFAULT 'active',
    whatsapp TEXT,
    total_views INTEGER DEFAULT 0,
    views_from_marketplace INTEGER DEFAULT 0,
    views_from_store INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_favorites INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabela de Promoções (se não existir)
CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL,
    discount_value DECIMAL(10,2),
    product_id TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    show_timer BOOLEAN DEFAULT FALSE,
    applies_to TEXT DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Adicionar coluna show_timer se não existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promotions' AND column_name = 'show_timer'
        ) THEN
            ALTER TABLE promotions ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;
END $$;

-- Adicionar coluna applies_to se não existir
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promotions' AND column_name = 'applies_to'
        ) THEN
            ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT 'all';
        END IF;
    END IF;
END $$;

-- Tabela de Participações em Campanhas (se não existir)
CREATE TABLE IF NOT EXISTS campaign_participations (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL,
    discount_fixed DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    approved_at TIMESTAMP,
    approved_by TEXT,
    original_price DECIMAL(10,2) NOT NULL,
    promo_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES marketplace_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, product_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_user ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city_id);
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_plan ON stores(plan_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participations_campaign ON campaign_participations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_participations_store ON campaign_participations(store_id);
CREATE INDEX IF NOT EXISTS idx_participations_product ON campaign_participations(product_id);

-- Verificar tabelas criadas
SELECT 'stores' as tabela, COUNT(*) as existe FROM information_schema.tables WHERE table_name = 'stores'
UNION ALL
SELECT 'categories', COUNT(*) FROM information_schema.tables WHERE table_name = 'categories'
UNION ALL
SELECT 'products', COUNT(*) FROM information_schema.tables WHERE table_name = 'products'
UNION ALL
SELECT 'promotions', COUNT(*) FROM information_schema.tables WHERE table_name = 'promotions'
UNION ALL
SELECT 'campaign_participations', COUNT(*) FROM information_schema.tables WHERE table_name = 'campaign_participations';

