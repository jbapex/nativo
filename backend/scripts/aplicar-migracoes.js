#!/usr/bin/env node

/**
 * Script para aplicar migrações do banco de dados
 * Suporta PostgreSQL e SQLite
 * 
 * Uso:
 *   node scripts/aplicar-migracoes.js
 *   node scripts/aplicar-migracoes.js --sqlite
 *   node scripts/aplicar-migracoes.js --postgres
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDatabaseWrapper, isSQLite } from '../database/db-wrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function aplicarMigracoes() {
  console.log('🚀 Iniciando aplicação de migrações...\n');
  
  const db = await initDatabaseWrapper();
  const usandoSQLite = isSQLite();
  
  console.log(`📊 Banco de dados: ${usandoSQLite ? 'SQLite' : 'PostgreSQL'}\n`);
  
  try {
    // ========================================================================
    // SEÇÃO 1: PROMOTIONS - show_timer e applies_to
    // ========================================================================
    console.log('📝 Aplicando migrações na tabela promotions...');
    
    if (usandoSQLite) {
      // SQLite: verificar se coluna existe antes de adicionar
      try {
        db.prepare('SELECT show_timer FROM promotions LIMIT 1').get();
        console.log('  ℹ️  Coluna show_timer já existe');
      } catch (e) {
        console.log('  ➕ Adicionando coluna show_timer...');
        db.exec('ALTER TABLE promotions ADD COLUMN show_timer INTEGER DEFAULT 0');
        console.log('  ✅ Coluna show_timer adicionada');
      }
      
      try {
        db.prepare('SELECT applies_to FROM promotions LIMIT 1').get();
        console.log('  ℹ️  Coluna applies_to já existe');
      } catch (e) {
        console.log('  ➕ Adicionando coluna applies_to...');
        db.exec("ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT 'both'");
        console.log('  ✅ Coluna applies_to adicionada');
      }
    } else {
      // PostgreSQL: usar DO block com verificação
      const migrationsPromotions = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'promotions' 
            AND column_name = 'show_timer'
          ) THEN
            ALTER TABLE promotions ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
            UPDATE promotions SET show_timer = FALSE WHERE show_timer IS NULL;
            RAISE NOTICE 'show_timer adicionada';
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promotions' AND column_name = 'applies_to'
          ) THEN
            ALTER TABLE promotions ADD COLUMN applies_to VARCHAR(50) DEFAULT 'both';
            UPDATE promotions SET applies_to = 'both' WHERE applies_to IS NULL;
            RAISE NOTICE 'applies_to adicionada';
          END IF;
        END $$;
      `;
      
      await db.query(migrationsPromotions);
      console.log('  ✅ Migrações de promotions aplicadas');
    }
    
    // ========================================================================
    // SEÇÃO 2: STORE_CUSTOMIZATIONS - Colunas adicionais
    // ========================================================================
    console.log('\n📝 Aplicando migrações na tabela store_customizations...');
    
    const colunasStoreCustomizations = [
      { nome: 'background_color', tipo: 'VARCHAR(7)', default: "'#ffffff'", sqlite: 'TEXT' },
      { nome: 'footer_color', tipo: 'VARCHAR(7)', default: "'#f9fafb'", sqlite: 'TEXT' },
      { nome: 'banner_enabled', tipo: 'BOOLEAN', default: 'TRUE', sqlite: 'INTEGER DEFAULT 1' },
      { nome: 'banners', tipo: 'TEXT', default: null, sqlite: 'TEXT' },
      { nome: 'about_section_enabled', tipo: 'BOOLEAN', default: 'TRUE', sqlite: 'INTEGER DEFAULT 1' },
      { nome: 'about_text', tipo: 'TEXT', default: null, sqlite: 'TEXT' },
      { nome: 'featured_section_enabled', tipo: 'BOOLEAN', default: 'TRUE', sqlite: 'INTEGER DEFAULT 1' },
      { nome: 'categories_section_enabled', tipo: 'BOOLEAN', default: 'TRUE', sqlite: 'INTEGER DEFAULT 1' },
      { nome: 'contact_section_enabled', tipo: 'BOOLEAN', default: 'TRUE', sqlite: 'INTEGER DEFAULT 1' },
      { nome: 'instagram_url', tipo: 'TEXT', default: null, sqlite: 'TEXT' },
      { nome: 'facebook_url', tipo: 'TEXT', default: null, sqlite: 'TEXT' },
      { nome: 'whatsapp_number', tipo: 'TEXT', default: null, sqlite: 'TEXT' },
      { nome: 'layout_style', tipo: 'VARCHAR(50)', default: "'modern'", sqlite: "TEXT DEFAULT 'modern'" },
      { nome: 'show_search', tipo: 'BOOLEAN', default: 'TRUE', sqlite: 'INTEGER DEFAULT 1' },
      { nome: 'show_categories', tipo: 'BOOLEAN', default: 'TRUE', sqlite: 'INTEGER DEFAULT 1' },
    ];
    
    for (const coluna of colunasStoreCustomizations) {
      if (usandoSQLite) {
        try {
          db.prepare(`SELECT ${coluna.nome} FROM store_customizations LIMIT 1`).get();
          console.log(`  ℹ️  Coluna ${coluna.nome} já existe`);
        } catch (e) {
          console.log(`  ➕ Adicionando coluna ${coluna.nome}...`);
          const defaultClause = coluna.default ? ` DEFAULT ${coluna.default}` : '';
          db.exec(`ALTER TABLE store_customizations ADD COLUMN ${coluna.nome} ${coluna.sqlite}${defaultClause}`);
          console.log(`  ✅ Coluna ${coluna.nome} adicionada`);
        }
      } else {
        // PostgreSQL: usar IF NOT EXISTS
        const defaultClause = coluna.default ? ` DEFAULT ${coluna.default}` : '';
        try {
          await db.query(`
            ALTER TABLE store_customizations 
            ADD COLUMN IF NOT EXISTS ${coluna.nome} ${coluna.tipo}${defaultClause}
          `);
          console.log(`  ✅ Coluna ${coluna.nome} verificada/adicionada`);
        } catch (e) {
          console.log(`  ⚠️  Erro ao adicionar ${coluna.nome}: ${e.message}`);
        }
      }
    }
    
    // ========================================================================
    // SEÇÃO 3: CATEGORY_ATTRIBUTES - Criar tabela
    // ========================================================================
    console.log('\n📝 Verificando tabela category_attributes...');
    
    if (usandoSQLite) {
      const createTableSQL = `
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
      `;
      db.exec(createTableSQL);
      
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
        ON category_attributes(category_id)
      `);
      
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
        ON category_attributes(category_id, is_filterable)
      `);
    } else {
      await db.query(`
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
        )
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
        ON category_attributes(category_id)
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
        ON category_attributes(category_id, is_filterable)
      `);
    }
    
    console.log('  ✅ Tabela category_attributes verificada/criada');
    
    // ========================================================================
    // SEÇÃO 4: MARKETPLACE_CAMPAIGNS - Criar tabelas
    // ========================================================================
    console.log('\n📝 Verificando tabelas de campanhas...');
    
    if (usandoSQLite) {
      const createCampaignsSQL = `
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
      `;
      db.exec(createCampaignsSQL);
      
      const createParticipationsSQL = `
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
      `;
      db.exec(createParticipationsSQL);
      
      // Criar índices
      db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_active ON marketplace_campaigns(active, start_date, end_date)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON marketplace_campaigns(featured, active)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_participations_campaign ON campaign_participations(campaign_id, status)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_participations_store ON campaign_participations(store_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_participations_product ON campaign_participations(product_id)`);
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS marketplace_campaigns (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          slug TEXT UNIQUE,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          min_discount_percent DECIMAL(5,2) DEFAULT 10.00,
          max_products_per_store INTEGER DEFAULT NULL,
          allowed_categories TEXT,
          requires_approval BOOLEAN DEFAULT FALSE,
          banner_image TEXT,
          banner_text TEXT,
          banner_page_image TEXT,
          badge_text TEXT DEFAULT 'EM PROMOÇÃO',
          badge_color TEXT DEFAULT '#EF4444',
          active BOOLEAN DEFAULT TRUE,
          featured BOOLEAN DEFAULT FALSE,
          total_participants INTEGER DEFAULT 0,
          total_products INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`
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
        )
      `);
      
      // Adicionar coluna banner_page_image se não existir
      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'marketplace_campaigns' AND column_name = 'banner_page_image'
          ) THEN
            ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT;
          END IF;
        END $$;
      `);
      
      // Criar índices
      await db.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_active ON marketplace_campaigns(active, start_date, end_date)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON marketplace_campaigns(featured, active)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_participations_campaign ON campaign_participations(campaign_id, status)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_participations_store ON campaign_participations(store_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_participations_product ON campaign_participations(product_id)`);
    }
    
    console.log('  ✅ Tabelas de campanhas verificadas/criadas');
    
    console.log('\n✅ Todas as migrações foram aplicadas com sucesso!');
    console.log('\n📊 Resumo:');
    // ========================================================================
    // SEÇÃO 4: APPEARANCE_TEMPLATES - Tabela de templates de aparência
    // ========================================================================
    console.log('\n📝 Aplicando migrações na tabela appearance_templates...');
    
    if (usandoSQLite) {
      try {
        db.prepare('SELECT id FROM appearance_templates LIMIT 1').get();
        console.log('  ℹ️  Tabela appearance_templates já existe');
      } catch (e) {
        console.log('  ➕ Criando tabela appearance_templates...');
        db.exec(`
          CREATE TABLE IF NOT EXISTS appearance_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'default',
            thumbnail TEXT,
            primary_color TEXT DEFAULT '#2563eb',
            secondary_color TEXT DEFAULT '#06b6d4',
            accent_color TEXT DEFAULT '#10b981',
            background_color TEXT DEFAULT '#ffffff',
            text_color TEXT DEFAULT '#1f2937',
            header_color TEXT DEFAULT '#ffffff',
            footer_color TEXT DEFAULT '#f9fafb',
            button_primary_color TEXT DEFAULT '#2563eb',
            button_secondary_color TEXT DEFAULT '#06b6d4',
            button_text_color TEXT DEFAULT '#ffffff',
            link_color TEXT DEFAULT '#2563eb',
            link_hover_color TEXT DEFAULT '#1d4ed8',
            card_background_color TEXT DEFAULT '#ffffff',
            card_border_color TEXT DEFAULT '#e5e7eb',
            card_shadow_color TEXT DEFAULT 'rgba(0, 0, 0, 0.1)',
            input_background_color TEXT DEFAULT '#ffffff',
            input_border_color TEXT DEFAULT '#d1d5db',
            input_focus_color TEXT DEFAULT '#2563eb',
            layout_style TEXT DEFAULT 'modern',
            border_radius TEXT DEFAULT '8px',
            font_family TEXT DEFAULT 'system-ui',
            logo TEXT,
            favicon TEXT,
            hero_title TEXT,
            hero_subtitle TEXT,
            hero_image TEXT,
            is_default INTEGER DEFAULT 0,
            is_public INTEGER DEFAULT 1,
            created_by TEXT,
            usage_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_appearance_templates_category ON appearance_templates(category);
          CREATE INDEX IF NOT EXISTS idx_appearance_templates_public ON appearance_templates(is_public);
          CREATE INDEX IF NOT EXISTS idx_appearance_templates_created_by ON appearance_templates(created_by);
        `);
        console.log('  ✅ Tabela appearance_templates criada');
      }
    } else {
      // PostgreSQL
      try {
        const result = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'appearance_templates'
          )
        `);
        const exists = result.rows?.[0]?.exists || result[0]?.exists;
        
        if (exists) {
          console.log('  ℹ️  Tabela appearance_templates já existe');
        } else {
          console.log('  ➕ Criando tabela appearance_templates...');
          await db.query(`
            CREATE TABLE appearance_templates (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(255) NOT NULL,
              description TEXT,
              category VARCHAR(50) DEFAULT 'default',
              thumbnail TEXT,
              primary_color VARCHAR(7) DEFAULT '#2563eb',
              secondary_color VARCHAR(7) DEFAULT '#06b6d4',
              accent_color VARCHAR(7) DEFAULT '#10b981',
              background_color VARCHAR(7) DEFAULT '#ffffff',
              text_color VARCHAR(7) DEFAULT '#1f2937',
              header_color VARCHAR(7) DEFAULT '#ffffff',
              footer_color VARCHAR(7) DEFAULT '#f9fafb',
              button_primary_color VARCHAR(7) DEFAULT '#2563eb',
              button_secondary_color VARCHAR(7) DEFAULT '#06b6d4',
              button_text_color VARCHAR(7) DEFAULT '#ffffff',
              link_color VARCHAR(7) DEFAULT '#2563eb',
              link_hover_color VARCHAR(7) DEFAULT '#1d4ed8',
              card_background_color VARCHAR(7) DEFAULT '#ffffff',
              card_border_color VARCHAR(7) DEFAULT '#e5e7eb',
              card_shadow_color VARCHAR(50) DEFAULT 'rgba(0, 0, 0, 0.1)',
              input_background_color VARCHAR(7) DEFAULT '#ffffff',
              input_border_color VARCHAR(7) DEFAULT '#d1d5db',
              input_focus_color VARCHAR(7) DEFAULT '#2563eb',
              layout_style VARCHAR(50) DEFAULT 'modern',
              border_radius VARCHAR(20) DEFAULT '8px',
              font_family VARCHAR(100) DEFAULT 'system-ui',
              logo TEXT,
              favicon TEXT,
              hero_title TEXT,
              hero_subtitle TEXT,
              hero_image TEXT,
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
          `);
          console.log('  ✅ Tabela appearance_templates criada');
        }
      } catch (error) {
        console.error('  ❌ Erro ao criar tabela appearance_templates:', error.message);
        throw error;
      }
    }
    
    console.log('  ✅ Tabela promotions: colunas show_timer e applies_to');
    console.log('  ✅ Tabela store_customizations: colunas adicionais');
    console.log('  ✅ Tabela category_attributes: criada');
    console.log('  ✅ Tabelas marketplace_campaigns e campaign_participations: criadas');
    console.log('  ✅ Tabela appearance_templates: criada');
    
  } catch (error) {
    console.error('\n❌ Erro ao aplicar migrações:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar
aplicarMigracoes()
  .then(() => {
    console.log('\n✨ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });

