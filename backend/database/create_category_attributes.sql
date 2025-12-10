-- Criar tabela category_attributes no PostgreSQL
-- Execute este script se a migração automática não funcionar

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

CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
  ON category_attributes(category_id);

CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
  ON category_attributes(category_id, is_filterable);

