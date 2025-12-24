-- Script para criar tabelas faltantes no PostgreSQL
-- Execute via: psql -h localhost -p 5434 -U nativo_user -d nativo_db -f create-missing-tables-postgres.sql

-- Tabela de Promoções (se não existir)
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed', 'free_shipping'
    discount_value DECIMAL(10,2),
    product_id UUID, -- NULL = todos os produtos, ou ID específico
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    show_timer BOOLEAN DEFAULT FALSE,
    applies_to TEXT, -- 'all', 'specific', 'category'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Adicionar coluna show_timer se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'show_timer'
    ) THEN
        ALTER TABLE promotions ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Adicionar coluna applies_to se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'applies_to'
    ) THEN
        ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT 'all';
    END IF;
END $$;

-- Tabela de Campanhas do Marketplace (se não existir)
CREATE TABLE IF NOT EXISTS marketplace_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    min_discount_percent DECIMAL(5,2) DEFAULT 10.00,
    max_products_per_store INTEGER DEFAULT NULL,
    allowed_categories TEXT, -- JSON array
    requires_approval BOOLEAN DEFAULT FALSE,
    banner_image TEXT,
    banner_text TEXT,
    banner_page_image TEXT,
    badge_text VARCHAR(100) DEFAULT 'EM PROMOÇÃO',
    badge_color VARCHAR(7) DEFAULT '#EF4444',
    active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    total_participants INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna banner_page_image se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marketplace_campaigns' AND column_name = 'banner_page_image'
    ) THEN
        ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT;
    END IF;
END $$;

-- Tabela de Participações em Campanhas (se não existir)
CREATE TABLE IF NOT EXISTS campaign_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,
    store_id UUID NOT NULL,
    product_id UUID NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL,
    discount_fixed DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMP,
    approved_by UUID,
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
CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON marketplace_campaigns(active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON marketplace_campaigns(featured, active);
CREATE INDEX IF NOT EXISTS idx_participations_campaign ON campaign_participations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_participations_store ON campaign_participations(store_id);
CREATE INDEX IF NOT EXISTS idx_participations_product ON campaign_participations(product_id);

-- Verificar tabelas criadas
SELECT 'promotions' as tabela, COUNT(*) as existe FROM information_schema.tables WHERE table_name = 'promotions'
UNION ALL
SELECT 'marketplace_campaigns', COUNT(*) FROM information_schema.tables WHERE table_name = 'marketplace_campaigns'
UNION ALL
SELECT 'campaign_participations', COUNT(*) FROM information_schema.tables WHERE table_name = 'campaign_participations';

