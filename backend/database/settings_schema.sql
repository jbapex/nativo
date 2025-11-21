-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    category TEXT DEFAULT 'general', -- 'general', 'users', 'security', 'integrations', 'billing', 'store_signup'
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

