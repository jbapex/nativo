-- Tabela de Campanhas do Marketplace
-- Campanhas criadas pelo admin (Black Friday, Oferta Relâmpago, etc.)
CREATE TABLE IF NOT EXISTS marketplace_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- Nome da campanha (ex: "Black Friday 2024")
    description TEXT, -- Descrição da campanha
    slug TEXT UNIQUE, -- URL amigável (ex: "black-friday-2024")
    
    -- Período da campanha
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    
    -- Regras de participação
    min_discount_percent DECIMAL(5,2) DEFAULT 10.00, -- Desconto mínimo obrigatório (%)
    max_products_per_store INTEGER DEFAULT NULL, -- Limite de produtos por loja (NULL = ilimitado)
    allowed_categories TEXT, -- JSON array de category_ids permitidas (NULL = todas)
    requires_approval BOOLEAN DEFAULT 0, -- Se precisa aprovação manual (0 = automático)
    
    -- Configurações visuais
    banner_image TEXT, -- Imagem do banner da campanha
    banner_text TEXT, -- Texto do banner
    badge_text TEXT DEFAULT "EM PROMOÇÃO", -- Texto do badge nos produtos
    badge_color TEXT DEFAULT "#EF4444", -- Cor do badge
    
    -- Status
    active BOOLEAN DEFAULT 1, -- Se a campanha está ativa
    featured BOOLEAN DEFAULT 0, -- Se aparece em destaque no Home
    
    -- Estatísticas (calculadas)
    total_participants INTEGER DEFAULT 0, -- Número de lojistas participantes
    total_products INTEGER DEFAULT 0, -- Número de produtos em promoção
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Participações em Campanhas
-- Registra quais lojistas participam de quais campanhas com quais produtos
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
    approved_at DATETIME,
    approved_by TEXT, -- ID do admin que aprovou (se requires_approval = true)
    
    -- Preços (snapshot no momento da inscrição)
    original_price DECIMAL(10,2) NOT NULL,
    promo_price DECIMAL(10,2) NOT NULL, -- Preço com desconto
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES marketplace_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, product_id) -- Um produto só pode participar uma vez da mesma campanha
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON marketplace_campaigns(active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON marketplace_campaigns(featured, active);
CREATE INDEX IF NOT EXISTS idx_participations_campaign ON campaign_participations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_participations_store ON campaign_participations(store_id);
CREATE INDEX IF NOT EXISTS idx_participations_product ON campaign_participations(product_id);

