-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    
    -- Tipo de usuário
    role TEXT DEFAULT 'customer', -- 'customer', 'store', 'admin'
    status TEXT DEFAULT 'active', -- 'active', 'pending', 'suspended', 'inactive'
    
    -- Dados básicos (para todos os tipos)
    phone TEXT, -- Telefone/WhatsApp
    avatar TEXT, -- URL da foto de perfil
    
    -- Dados específicos de CLIENTE (role = 'customer')
    cpf TEXT, -- CPF do cliente (opcional, para checkout)
    birth_date DATE, -- Data de nascimento (opcional)
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME -- Último acesso
);

-- Tabela de Cidades
CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT,
    active BOOLEAN DEFAULT 1,
    is_imported BOOLEAN DEFAULT 0, -- Se a cidade foi importada do IBGE (true) ou cadastrada manualmente (false)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    store_id TEXT, -- NULL = categoria global, preenchido = categoria da loja
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    price DECIMAL(10,2) NOT NULL,
    product_limit INTEGER,
    features TEXT, -- JSON string
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Lojas
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    store_type TEXT DEFAULT 'physical', -- 'physical', 'online', 'both'
    whatsapp TEXT,
    city_id TEXT,
    category_id TEXT,
    has_physical_store BOOLEAN DEFAULT 0,
    featured BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    plan_id TEXT,
    checkout_enabled BOOLEAN DEFAULT 0, -- Se permite checkout na loja (0 = apenas WhatsApp, 1 = WhatsApp + Checkout)
    -- Configurações de Pagamento
    pix_key TEXT, -- Chave PIX do lojista
    payment_link TEXT, -- Link do Mercado Pago/PagSeguro/etc
    payment_instructions TEXT, -- Instruções personalizadas de pagamento
    mercadopago_access_token TEXT, -- Access Token do Mercado Pago (para integração via API)
    mercadopago_public_key TEXT, -- Public Key do Mercado Pago (opcional)
    payment_methods TEXT DEFAULT '["whatsapp"]', -- JSON array: ["mercadopago", "whatsapp"]
    -- Configurações de Frete
    shipping_fixed_price DECIMAL(10,2), -- Valor fixo do frete
    shipping_calculate_on_whatsapp BOOLEAN DEFAULT 0, -- Se deve calcular frete no WhatsApp (sem valor no checkout)
    shipping_free_threshold DECIMAL(10,2), -- Valor mínimo para frete grátis
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2), -- Preço original (para mostrar desconto)
    images TEXT, -- JSON array de URLs
    tags TEXT, -- JSON array
    active BOOLEAN DEFAULT 1,
    featured BOOLEAN DEFAULT 0,
    stock INTEGER,
    status TEXT DEFAULT 'active', -- 'active', 'draft', 'out_of_stock'
    whatsapp TEXT, -- WhatsApp específico do produto (opcional, usa da loja se não tiver)
    total_views INTEGER DEFAULT 0,
    views_from_marketplace INTEGER DEFAULT 0, -- Visualizações do NATIVO Home
    views_from_store INTEGER DEFAULT 0, -- Visualizações da loja individual
    total_messages INTEGER DEFAULT 0,
    total_favorites INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabela de Customizações da Loja Online Premium
CREATE TABLE IF NOT EXISTS store_customizations (
    id TEXT PRIMARY KEY,
    store_id TEXT UNIQUE NOT NULL,
    
    -- Cores
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#06b6d4',
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#1f2937',
    header_color TEXT DEFAULT '#ffffff',
    footer_color TEXT DEFAULT '#f9fafb',
    
    -- Layout
    banner_image TEXT,
    banner_text TEXT,
    banner_enabled BOOLEAN DEFAULT 1,
    
    -- Seções
    about_section_enabled BOOLEAN DEFAULT 1,
    about_text TEXT,
    
    featured_section_enabled BOOLEAN DEFAULT 1,
    categories_section_enabled BOOLEAN DEFAULT 1,
    contact_section_enabled BOOLEAN DEFAULT 1,
    
    -- Social
    instagram_url TEXT,
    facebook_url TEXT,
    whatsapp_number TEXT,
    
    -- Configurações
    layout_style TEXT DEFAULT 'modern', -- 'modern', 'classic', 'minimal'
    show_search BOOLEAN DEFAULT 1,
    show_categories BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Tabela de Promoções
CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed', 'free_shipping'
    discount_value DECIMAL(10,2),
    product_id TEXT, -- NULL = todos os produtos, ou ID específico
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- Cliente que fez o pedido
    store_id TEXT NOT NULL, -- Loja que recebeu o pedido
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    shipping_phone TEXT,
    notes TEXT, -- Observações do cliente
    notes_admin TEXT, -- Observações internas (lojista/admin)
    tracking_number TEXT, -- Número de rastreamento
    payment_method TEXT, -- 'whatsapp', 'pix', 'credit_card', etc.
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_id TEXT, -- Referência à tabela payments
    mp_preference_id TEXT, -- ID da preferência do Mercado Pago
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL, -- Snapshot do nome do produto no momento do pedido
    product_price DECIMAL(10,2) NOT NULL, -- Snapshot do preço no momento do pedido (com desconto)
    original_price DECIMAL(10,2), -- Preço original antes do desconto
    discount_percent DECIMAL(5,2), -- Percentual de desconto aplicado
    promotion_name TEXT, -- Nome da promoção aplicada
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL, -- quantity * product_price (com desconto)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_id TEXT, -- ID do Mercado Pago (se aplicável)
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
    payment_method TEXT NOT NULL, -- mercadopago, whatsapp
    payment_type TEXT, -- pix, credit_card, debit_card, boleto, whatsapp
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'BRL',
    mp_preference_id TEXT, -- NULL se for WhatsApp
    mp_payment_id TEXT, -- NULL se for WhatsApp
    metadata TEXT, -- JSON com dados adicionais
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Tabela de Histórico de Alterações de Pedidos
CREATE TABLE IF NOT EXISTS order_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    changed_by TEXT NOT NULL, -- ID do usuário que fez a alteração
    changed_by_name TEXT, -- Nome do usuário que fez a alteração
    change_type TEXT NOT NULL, -- 'status', 'payment_status', 'tracking', 'notes'
    old_value TEXT, -- Valor anterior
    new_value TEXT, -- Novo valor
    notes TEXT, -- Observações sobre a alteração
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_stores_user ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_store_customizations_store ON store_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment ON payments(mp_payment_id);

-- Tabela de Carrinho de Compras
CREATE TABLE IF NOT EXISTS cart (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- Um carrinho por usuário
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Itens do Carrinho (agrupado por loja)
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    store_id TEXT NOT NULL, -- Loja do produto
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    UNIQUE(cart_id, product_id) -- Um produto só pode aparecer uma vez no carrinho
);

-- Índices para carrinho
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_store ON cart_items(store_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- Tabela de Avaliações/Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    order_id TEXT, -- Pedido relacionado (opcional, para validar compra)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Tabela de Favoritos (substitui user.favorites JSON)
CREATE TABLE IF NOT EXISTS user_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id) -- Um usuário só pode favoritar um produto uma vez
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'order_new', 'order_status', 'order_payment', 'message', 'review', 'promotion', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- URL relacionada (opcional)
    read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Endereços dos Usuários
CREATE TABLE IF NOT EXISTS user_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    -- Tipo de endereço
    type TEXT DEFAULT 'delivery', -- 'delivery', 'billing', 'both'
    label TEXT, -- 'Casa', 'Trabalho', 'Outro'
    is_default BOOLEAN DEFAULT 0, -- Endereço padrão
    
    -- Dados do endereço
    recipient_name TEXT NOT NULL, -- Nome do destinatário
    phone TEXT, -- Telefone de contato
    zip_code TEXT NOT NULL, -- CEP
    street TEXT NOT NULL, -- Rua
    number TEXT NOT NULL, -- Número
    complement TEXT, -- Complemento (apto, bloco, etc)
    neighborhood TEXT NOT NULL, -- Bairro
    city TEXT NOT NULL, -- Cidade
    state TEXT NOT NULL, -- Estado (UF)
    reference TEXT, -- Ponto de referência
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para novas tabelas
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product ON user_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default);

