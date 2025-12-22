-- Migração: Criar tabela de templates de aparência
-- Permite salvar modelos de aparência para reutilização

-- SQLite
CREATE TABLE IF NOT EXISTS appearance_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'default', -- 'default', 'dark', 'colorful', 'minimal', 'custom'
    thumbnail TEXT, -- URL da imagem de preview (opcional)
    
    -- Cores principais
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#06b6d4',
    accent_color TEXT DEFAULT '#10b981',
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#1f2937',
    header_color TEXT DEFAULT '#ffffff',
    footer_color TEXT DEFAULT '#f9fafb',
    
    -- Cores de botões e links
    button_primary_color TEXT DEFAULT '#2563eb',
    button_secondary_color TEXT DEFAULT '#06b6d4',
    button_text_color TEXT DEFAULT '#ffffff',
    link_color TEXT DEFAULT '#2563eb',
    link_hover_color TEXT DEFAULT '#1d4ed8',
    
    -- Cores de cards e inputs
    card_background_color TEXT DEFAULT '#ffffff',
    card_border_color TEXT DEFAULT '#e5e7eb',
    card_shadow_color TEXT DEFAULT 'rgba(0, 0, 0, 0.1)',
    input_background_color TEXT DEFAULT '#ffffff',
    input_border_color TEXT DEFAULT '#d1d5db',
    input_focus_color TEXT DEFAULT '#2563eb',
    
    -- Configurações de layout
    layout_style TEXT DEFAULT 'modern', -- 'modern', 'classic', 'minimal'
    border_radius TEXT DEFAULT '8px',
    font_family TEXT DEFAULT 'system-ui',
    
    -- Configurações de aparência do site
    logo TEXT,
    favicon TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_image TEXT,
    
    -- Metadados
    is_default BOOLEAN DEFAULT 0, -- Template padrão do sistema
    is_public BOOLEAN DEFAULT 1, -- Se pode ser usado por todos
    created_by TEXT, -- ID do usuário que criou (NULL = sistema)
    usage_count INTEGER DEFAULT 0, -- Quantas vezes foi aplicado
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appearance_templates_category ON appearance_templates(category);
CREATE INDEX IF NOT EXISTS idx_appearance_templates_public ON appearance_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_appearance_templates_created_by ON appearance_templates(created_by);

-- PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appearance_templates') THEN
        CREATE TABLE appearance_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(50) DEFAULT 'default',
            thumbnail TEXT,
            
            -- Cores principais
            primary_color VARCHAR(7) DEFAULT '#2563eb',
            secondary_color VARCHAR(7) DEFAULT '#06b6d4',
            accent_color VARCHAR(7) DEFAULT '#10b981',
            background_color VARCHAR(7) DEFAULT '#ffffff',
            text_color VARCHAR(7) DEFAULT '#1f2937',
            header_color VARCHAR(7) DEFAULT '#ffffff',
            footer_color VARCHAR(7) DEFAULT '#f9fafb',
            
            -- Cores de botões e links
            button_primary_color VARCHAR(7) DEFAULT '#2563eb',
            button_secondary_color VARCHAR(7) DEFAULT '#06b6d4',
            button_text_color VARCHAR(7) DEFAULT '#ffffff',
            link_color VARCHAR(7) DEFAULT '#2563eb',
            link_hover_color VARCHAR(7) DEFAULT '#1d4ed8',
            
            -- Cores de cards e inputs
            card_background_color VARCHAR(7) DEFAULT '#ffffff',
            card_border_color VARCHAR(7) DEFAULT '#e5e7eb',
            card_shadow_color VARCHAR(50) DEFAULT 'rgba(0, 0, 0, 0.1)',
            input_background_color VARCHAR(7) DEFAULT '#ffffff',
            input_border_color VARCHAR(7) DEFAULT '#d1d5db',
            input_focus_color VARCHAR(7) DEFAULT '#2563eb',
            
            -- Configurações de layout
            layout_style VARCHAR(50) DEFAULT 'modern',
            border_radius VARCHAR(20) DEFAULT '8px',
            font_family VARCHAR(100) DEFAULT 'system-ui',
            
            -- Configurações de aparência do site
            logo TEXT,
            favicon TEXT,
            hero_title TEXT,
            hero_subtitle TEXT,
            hero_image TEXT,
            
            -- Metadados
            is_default BOOLEAN DEFAULT FALSE,
            is_public BOOLEAN DEFAULT TRUE,
            created_by UUID,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_appearance_templates_category ON appearance_templates(category);
        CREATE INDEX idx_appearance_templates_public ON appearance_templates(is_public);
        CREATE INDEX idx_appearance_templates_created_by ON appearance_templates(created_by);
        
        RAISE NOTICE '✅ Tabela appearance_templates criada com sucesso!';
    ELSE
        RAISE NOTICE 'ℹ️  Tabela appearance_templates já existe';
    END IF;
END $$;

