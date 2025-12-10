import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { initDatabaseWrapper, getDb, isSQLite } from './db-wrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../database.sqlite');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

// Variável para armazenar a instância do banco
let dbInstance = null;

// Inicializar banco de dados se não existir
export async function initDatabase() {
  // Inicializar wrapper (SQLite ou PostgreSQL)
  dbInstance = await initDatabaseWrapper();
  
  // Se for SQLite, habilitar foreign keys
  if (isSQLite()) {
    dbInstance.pragma('foreign_keys = ON');
  }
  
  // Verificar se é SQLite e se o arquivo existe
  if (isSQLite() && !existsSync(DB_PATH)) {
    console.log('Criando banco de dados...');
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    dbInstance.exec(schema);
    
    // Criar tabela de configurações
    const settingsSchema = readFileSync(join(__dirname, 'settings_schema.sql'), 'utf-8');
    dbInstance.exec(settingsSchema);
    
    console.log('Banco de dados criado com sucesso!');
    
    // Inserir dados iniciais
    await seedDatabase(dbInstance);
  } else if (isSQLite()) {
    // Verificar se tabela de configurações existe, se não, criar
    try {
      dbInstance.prepare('SELECT 1 FROM settings LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela de configurações...');
      const settingsSchema = readFileSync(join(__dirname, 'settings_schema.sql'), 'utf-8');
      dbInstance.exec(settingsSchema);
    }
    
    // Migração: adicionar coluna category_id na tabela stores se não existir
    try {
      dbInstance.prepare('SELECT category_id FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna category_id na tabela stores...');
      try {
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN category_id TEXT').run();
        dbInstance.prepare('CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category_id)').run();
        console.log('Coluna category_id adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna category_id:', migrationError);
      }
    }
    
    // Migração: adicionar coluna checkout_enabled na tabela stores se não existir
    try {
      dbInstance.prepare('SELECT checkout_enabled FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna checkout_enabled na tabela stores...');
      try {
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN checkout_enabled BOOLEAN DEFAULT 0').run();
        console.log('Coluna checkout_enabled adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna checkout_enabled:', migrationError);
      }
    }
    
    // Migração: adicionar coluna slug na tabela plans se não existir
    try {
      dbInstance.prepare('SELECT slug FROM plans LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna slug na tabela plans...');
      try {
        dbInstance.prepare('ALTER TABLE plans ADD COLUMN slug TEXT').run();
        // Atualizar slugs existentes baseado no ID
        const plans = dbInstance.prepare('SELECT id FROM plans').all();
        plans.forEach(plan => {
          const slug = plan.id.replace(/^plan-/, '');
          dbInstance.prepare('UPDATE plans SET slug = ? WHERE id = ?').run(slug, plan.id);
        });
        console.log('Coluna slug adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna slug:', migrationError);
      }
    }
    
    // Migração: adicionar coluna banner_page_image na tabela marketplace_campaigns
    try {
      dbInstance.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna banner_page_image na tabela marketplace_campaigns...');
      try {
        dbInstance.prepare('ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT').run();
        console.log('Coluna banner_page_image adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna banner_page_image:', migrationError);
      }
    }
    
    // Migração: criar tabelas de campanhas do marketplace se não existirem
    try {
      dbInstance.prepare('SELECT 1 FROM marketplace_campaigns LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabelas de campanhas do marketplace...');
      try {
        const campaignsSchema = readFileSync(join(__dirname, 'campaigns_schema.sql'), 'utf-8');
        dbInstance.exec(campaignsSchema);
        console.log('Tabelas de campanhas criadas com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabelas de campanhas:', migrationError);
      }
    }
    
    // Migração: adicionar campos de pagamento e frete na tabela stores
    try {
      dbInstance.prepare('SELECT pix_key FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando campos de pagamento e frete na tabela stores...');
      try {
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN pix_key TEXT').run();
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN payment_link TEXT').run();
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN payment_instructions TEXT').run();
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN shipping_fixed_price DECIMAL(10,2)').run();
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN shipping_calculate_on_whatsapp BOOLEAN DEFAULT 0').run();
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN shipping_free_threshold DECIMAL(10,2)').run();
        console.log('Campos de pagamento e frete adicionados com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar campos de pagamento e frete:', migrationError);
      }
    }
    
    // Migração: adicionar campo mercadopago_access_token na tabela stores
    try {
      dbInstance.prepare('SELECT mercadopago_access_token FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando campo mercadopago_access_token na tabela stores...');
      try {
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN mercadopago_access_token TEXT').run();
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN mercadopago_public_key TEXT').run();
        console.log('Campos do Mercado Pago adicionados com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar campos do Mercado Pago:', migrationError);
      }
    }
    
    // Migração: adicionar campos de desconto na tabela order_items
    try {
      dbInstance.prepare('SELECT original_price FROM order_items LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando campos de desconto na tabela order_items...');
      try {
        dbInstance.prepare('ALTER TABLE order_items ADD COLUMN original_price DECIMAL(10,2)').run();
        dbInstance.prepare('ALTER TABLE order_items ADD COLUMN discount_percent DECIMAL(5,2)').run();
        dbInstance.prepare('ALTER TABLE order_items ADD COLUMN promotion_name TEXT').run();
        console.log('Campos de desconto adicionados com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar campos de desconto:', migrationError);
      }
    }
    
    // Migração: criar tabela store_customizations se não existir
    try {
      dbInstance.prepare('SELECT 1 FROM store_customizations LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela store_customizations...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS store_customizations (
            id TEXT PRIMARY KEY,
            store_id TEXT UNIQUE NOT NULL,
            primary_color TEXT DEFAULT '#2563eb',
            secondary_color TEXT DEFAULT '#06b6d4',
            background_color TEXT DEFAULT '#ffffff',
            text_color TEXT DEFAULT '#1f2937',
            header_color TEXT DEFAULT '#ffffff',
            footer_color TEXT DEFAULT '#f9fafb',
            banner_image TEXT,
            banner_text TEXT,
            banner_enabled BOOLEAN DEFAULT 1,
            about_section_enabled BOOLEAN DEFAULT 1,
            about_text TEXT,
            featured_section_enabled BOOLEAN DEFAULT 1,
            categories_section_enabled BOOLEAN DEFAULT 1,
            contact_section_enabled BOOLEAN DEFAULT 1,
            instagram_url TEXT,
            facebook_url TEXT,
            whatsapp_number TEXT,
            layout_style TEXT DEFAULT 'modern',
            show_search BOOLEAN DEFAULT 1,
            show_categories BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id)
          );
          CREATE INDEX IF NOT EXISTS idx_store_customizations_store ON store_customizations(store_id);
        `);
        console.log('Tabela store_customizations criada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabela store_customizations:', migrationError);
      }
    }
    
    // Migração: adicionar coluna banners se não existir
    try {
      if (isSQLite()) {
        // SQLite: tentar selecionar para verificar se existe
        dbInstance.prepare('SELECT banners FROM store_customizations LIMIT 1').get();
      } else {
        // PostgreSQL: verificar se a coluna existe na information_schema
        const result = await dbInstance.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'store_customizations' 
          AND column_name = 'banners'
        `);
        if (result.rows.length > 0) {
          // Coluna já existe, não precisa fazer nada
          throw new Error('Column already exists');
        }
      }
    } catch (e) {
      // Se der erro, significa que a coluna não existe, então vamos criar
      if (e.message !== 'Column already exists') {
        console.log('Adicionando coluna banners...');
        try {
          if (isSQLite()) {
            await dbInstance.exec('ALTER TABLE store_customizations ADD COLUMN banners TEXT');
          } else {
            // PostgreSQL: usar IF NOT EXISTS (disponível no PostgreSQL 9.1+)
            await dbInstance.query(`
              ALTER TABLE store_customizations 
              ADD COLUMN IF NOT EXISTS banners TEXT
            `);
          }
          console.log('✅ Coluna banners adicionada com sucesso!');
        } catch (migrationError) {
          console.error('❌ Erro ao adicionar coluna banners:', migrationError);
          // Não lançar erro, apenas logar, pois pode ser que a coluna já exista
        }
      }
    }
    
    // Migração: adicionar colunas faltantes em store_customizations (PostgreSQL)
    if (!isSQLite()) {
      console.log('🔄 Verificando colunas faltantes em store_customizations (PostgreSQL)...');
      
      const missingColumns = [
        { name: 'background_color', type: 'VARCHAR(7)', default: "'#ffffff'" },
        { name: 'footer_color', type: 'VARCHAR(7)', default: "'#f9fafb'" },
        { name: 'categories_bar_color', type: 'VARCHAR(7)', default: "'#f97316'" },
        // Novas cores de personalização da vitrine da loja
        { name: 'product_price_color', type: 'VARCHAR(7)', default: "'#f97316'" },
        { name: 'product_button_color', type: 'VARCHAR(7)', default: "'#f97316'" },
        { name: 'categories_card_bg_color', type: 'VARCHAR(7)', default: "'#ffffff'" },
        { name: 'banner_enabled', type: 'BOOLEAN', default: 'TRUE' },
        { name: 'banners', type: 'TEXT', default: null }, // JSON array
        { name: 'about_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
        { name: 'about_text', type: 'TEXT', default: null },
        { name: 'featured_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
        { name: 'categories_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
        { name: 'contact_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
        { name: 'instagram_url', type: 'TEXT', default: null },
        { name: 'facebook_url', type: 'TEXT', default: null },
        { name: 'whatsapp_number', type: 'TEXT', default: null },
        { name: 'layout_style', type: 'VARCHAR(50)', default: "'modern'" },
        { name: 'show_search', type: 'BOOLEAN', default: 'TRUE' },
        { name: 'show_categories', type: 'BOOLEAN', default: 'TRUE' }
      ];
      
      // Verificar se a tabela existe primeiro
      try {
        const tableCheck = await dbInstance.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'store_customizations'
          )
        `);
        
        if (!tableCheck.rows[0]?.exists) {
          console.log('⚠️ Tabela store_customizations não existe, pulando migração de colunas');
        } else {
          // Buscar todas as colunas existentes de uma vez
          const existingColumns = await dbInstance.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'store_customizations'
          `);
          
          const existingColumnNames = existingColumns.rows.map(row => row.column_name);
          console.log('📋 Colunas existentes em store_customizations:', existingColumnNames);
          console.log('📋 Total de colunas existentes:', existingColumnNames.length);
          
          let addedCount = 0;
          let skippedCount = 0;
          let errorCount = 0;
          
          for (const column of missingColumns) {
            try {
              if (!existingColumnNames.includes(column.name)) {
                console.log(`➕ Adicionando coluna ${column.name}...`);
                const defaultClause = column.default !== null ? `DEFAULT ${column.default}` : '';
                const alterQuery = `
                  ALTER TABLE store_customizations 
                  ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} ${defaultClause}
                `;
                
                await dbInstance.query(alterQuery);
                console.log(`✅ Coluna ${column.name} adicionada com sucesso!`);
                addedCount++;
              } else {
                console.log(`✓ Coluna ${column.name} já existe`);
                skippedCount++;
              }
            } catch (migrationError) {
              console.error(`❌ Erro ao adicionar coluna ${column.name}:`, migrationError);
              console.error(`❌ Detalhes:`, {
                message: migrationError.message,
                code: migrationError.code,
                detail: migrationError.detail,
                hint: migrationError.hint
              });
              errorCount++;
              
              // Se for erro de permissão, fornecer instruções
              if (migrationError.code === '42501' || migrationError.message?.includes('permission')) {
                const defaultClause = column.default !== null ? `DEFAULT ${column.default}` : '';
                console.error(`\n⚠️ PERMISSÃO INSUFICIENTE para criar coluna ${column.name}.`);
                console.error(`   Execute manualmente no PostgreSQL:`);
                console.error(`   ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} ${defaultClause};\n`);
              }
            }
          }
          
          console.log(`\n📊 Resumo da migração:`);
          console.log(`   ✅ Colunas adicionadas: ${addedCount}`);
          console.log(`   ✓ Colunas já existentes: ${skippedCount}`);
          console.log(`   ❌ Erros: ${errorCount}`);
          
          if (errorCount > 0) {
            console.error(`\n⚠️ ATENÇÃO: ${errorCount} coluna(s) não puderam ser criadas automaticamente.`);
            console.error(`   Execute o script fix_store_customizations.sql manualmente ou verifique as permissões.`);
          }
        }
      } catch (checkError) {
        console.error('❌ Erro ao verificar tabela store_customizations:', checkError);
        console.error('⚠️ Migração de colunas não pôde ser executada. As colunas podem não existir.');
        console.error('   Execute o script fix_store_customizations.sql manualmente.');
      }
    }
    
    // Migração: adicionar coluna show_timer na tabela promotions
    try {
      dbInstance.prepare('SELECT show_timer FROM promotions LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna show_timer na tabela promotions...');
      try {
        dbInstance.prepare('ALTER TABLE promotions ADD COLUMN show_timer BOOLEAN DEFAULT 0').run();
        console.log('Coluna show_timer adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna show_timer:', migrationError);
      }
    }
    
    // Migração: criar tabela de promoções se não existir
    try {
      dbInstance.prepare('SELECT id FROM promotions LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela promotions...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS promotions (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            discount_type TEXT NOT NULL,
            discount_value DECIMAL(10,2),
            product_id TEXT,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
          );
          CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);
          CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
          CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
        `);
        console.log('Tabela promotions criada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabela promotions:', migrationError);
      }
    }
    
    // Migração: criar tabelas de pedidos se não existirem
    try {
      dbInstance.prepare('SELECT id FROM orders LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabelas orders e order_items...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            store_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            total_amount DECIMAL(10,2) NOT NULL,
            shipping_address TEXT,
            shipping_city TEXT,
            shipping_state TEXT,
            shipping_zip TEXT,
            shipping_phone TEXT,
            notes TEXT,
            payment_method TEXT,
            payment_status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (store_id) REFERENCES stores(id)
          );
          CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            product_price DECIMAL(10,2) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            subtotal DECIMAL(10,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
          );
          CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
          CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
          CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
          CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
        `);
        console.log('Tabelas orders e order_items criadas com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabelas de pedidos:', migrationError);
      }
    }
    
    // Migração: adicionar campos notes_admin e tracking_number à tabela orders
    try {
      const ordersInfo = dbInstance.prepare("PRAGMA table_info(orders)").all();
      const hasNotesAdmin = ordersInfo.some(col => col.name === 'notes_admin');
      const hasTrackingNumber = ordersInfo.some(col => col.name === 'tracking_number');
      
      if (!hasNotesAdmin) {
        dbInstance.prepare('ALTER TABLE orders ADD COLUMN notes_admin TEXT').run();
        console.log('Campo notes_admin adicionado à tabela orders');
      }
      
      if (!hasTrackingNumber) {
        dbInstance.prepare('ALTER TABLE orders ADD COLUMN tracking_number TEXT').run();
        console.log('Campo tracking_number adicionado à tabela orders');
      }
    } catch (migrationError) {
      console.error('Erro ao adicionar campos à tabela orders:', migrationError);
    }
    
    // Migração: criar tabela order_history se não existir
    try {
      dbInstance.prepare('SELECT id FROM order_history LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela order_history...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS order_history (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            changed_by TEXT NOT NULL,
            changed_by_name TEXT,
            change_type TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (changed_by) REFERENCES users(id)
          );
          CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id);
          CREATE INDEX IF NOT EXISTS idx_order_history_changed_by ON order_history(changed_by);
        `);
        console.log('Tabela order_history criada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabela order_history:', migrationError);
      }
    }
    
    // Migração: criar tabelas de carrinho se não existirem
    try {
      dbInstance.prepare('SELECT id FROM cart LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabelas cart e cart_items...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS cart (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS cart_items (
            id TEXT PRIMARY KEY,
            cart_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            store_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (store_id) REFERENCES stores(id),
            UNIQUE(cart_id, product_id)
          );
          CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
          CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
          CREATE INDEX IF NOT EXISTS idx_cart_items_store ON cart_items(store_id);
          CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);
        `);
        console.log('Tabelas cart e cart_items criadas com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabelas de carrinho:', migrationError);
      }
    }
    
    console.log('Banco de dados já existe.');
  }
  
  // Migrações para PostgreSQL
  if (!isSQLite()) {
    console.log('Usando PostgreSQL - verificando migrações...');
    
    // Migração: adicionar campo show_timer na tabela promotions se não existir
    try {
      const result = await dbInstance.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'show_timer'
      `);
      
      if (result.rows.length === 0) {
        console.log('Adicionando coluna show_timer na tabela promotions...');
        await dbInstance.query(`
          ALTER TABLE promotions 
          ADD COLUMN show_timer BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Coluna show_timer adicionada com sucesso!');
      } else {
        console.log('✅ Coluna show_timer já existe na tabela promotions');
      }
    } catch (migrationError) {
      console.error('Erro ao verificar/adicionar coluna show_timer:', migrationError);
      // Não bloquear inicialização se a migração falhar
    }

    // Migração: criar tabelas de campanhas do marketplace se não existirem
    try {
      await dbInstance.query('SELECT 1 FROM marketplace_campaigns LIMIT 1');
      console.log('✅ Tabela marketplace_campaigns já existe');
      
      // Migração: adicionar coluna banner_page_image se não existir
      try {
        await dbInstance.query('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1');
        console.log('✅ Coluna banner_page_image já existe');
      } catch (e) {
        console.log('Adicionando coluna banner_page_image na tabela marketplace_campaigns (PostgreSQL)...');
        try {
          // Usar IF NOT EXISTS para evitar erro se já existir
          await dbInstance.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'marketplace_campaigns' 
                AND column_name = 'banner_page_image'
              ) THEN
                ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT;
              END IF;
            END $$;
          `);
          console.log('✅ Coluna banner_page_image adicionada com sucesso!');
        } catch (migrationError) {
          console.error('❌ Erro ao adicionar coluna banner_page_image:', migrationError.message);
          console.error('💡 Execute manualmente: ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT;');
        }
      }
    } catch (error) {
      if (error.code === '42P01') {
        console.warn('⚠️ Tabela marketplace_campaigns não existe no PostgreSQL.');
        console.warn('   Crie manualmente executando o script backend/database/campaigns_schema.sql');
      } else {
        console.error('Erro ao verificar tabela marketplace_campaigns:', error);
      }
    }
  }
  
  // Migrações apenas para SQLite (PostgreSQL usa schema.sql)
  if (isSQLite()) {
    // Migração: adicionar store_id na tabela categories se não existir
    try {
      const tableInfo = dbInstance.prepare("PRAGMA table_info(categories)").all();
      const hasStoreId = tableInfo.some(col => col.name === 'store_id');
      
      if (!hasStoreId) {
        console.log('Adicionando coluna store_id na tabela categories...');
        dbInstance.prepare(`
          ALTER TABLE categories 
          ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE CASCADE
        `).run();
        console.log('Coluna store_id adicionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao adicionar coluna store_id:', error);
    }
    
    // Migração: adicionar campos faltando na tabela products
    try {
      const tableInfo = dbInstance.prepare("PRAGMA table_info(products)").all();
      const columns = tableInfo.map(col => col.name);
      
      const fieldsToAdd = [
        { name: 'compare_price', sql: 'ALTER TABLE products ADD COLUMN compare_price DECIMAL(10,2)' },
        { name: 'total_views', sql: 'ALTER TABLE products ADD COLUMN total_views INTEGER DEFAULT 0' },
        { name: 'views_from_marketplace', sql: 'ALTER TABLE products ADD COLUMN views_from_marketplace INTEGER DEFAULT 0' },
        { name: 'views_from_store', sql: 'ALTER TABLE products ADD COLUMN views_from_store INTEGER DEFAULT 0' },
        { name: 'total_messages', sql: 'ALTER TABLE products ADD COLUMN total_messages INTEGER DEFAULT 0' },
        { name: 'total_favorites', sql: 'ALTER TABLE products ADD COLUMN total_favorites INTEGER DEFAULT 0' },
        { name: 'whatsapp', sql: 'ALTER TABLE products ADD COLUMN whatsapp TEXT' },
        { name: 'status', sql: "ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active'" }
      ];
      
      for (const field of fieldsToAdd) {
        if (!columns.includes(field.name)) {
          console.log(`Adicionando coluna ${field.name} na tabela products...`);
          try {
            dbInstance.prepare(field.sql).run();
            console.log(`Coluna ${field.name} adicionada com sucesso!`);
          } catch (migrationError) {
            console.error(`Erro ao adicionar coluna ${field.name}:`, migrationError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/adicionar campos em products:', error);
    }
    
    // Migração: criar tabelas de reviews, favorites e notifications se não existirem
    try {
      // Verificar se tabela reviews existe
      try {
        dbInstance.prepare('SELECT id FROM reviews LIMIT 1').get();
      } catch (e) {
        console.log('Criando tabela reviews...');
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            order_id TEXT,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
          );
          CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
        `);
        console.log('Tabela reviews criada com sucesso!');
      }
      
      // Verificar se tabela user_favorites existe
      try {
        dbInstance.prepare('SELECT id FROM user_favorites LIMIT 1').get();
      } catch (e) {
        console.log('Criando tabela user_favorites...');
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS user_favorites (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(user_id, product_id)
          );
          CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_favorites_product ON user_favorites(product_id);
        `);
        console.log('Tabela user_favorites criada com sucesso!');
      }
      
      // Verificar se tabela notifications existe
      try {
        dbInstance.prepare('SELECT id FROM notifications LIMIT 1').get();
      } catch (e) {
        console.log('Criando tabela notifications...');
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            link TEXT,
            read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
          CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
          CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
        `);
        console.log('Tabela notifications criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar tabelas de reviews/favorites/notifications:', error);
    }
    
    // Migração: adicionar novos campos na tabela users
    try {
      const userColumns = dbInstance.prepare("PRAGMA table_info(users)").all().map(col => col.name);
      const fieldsToAdd = [
        { name: 'phone', sql: 'ALTER TABLE users ADD COLUMN phone TEXT' },
        { name: 'avatar', sql: 'ALTER TABLE users ADD COLUMN avatar TEXT' },
        { name: 'cpf', sql: 'ALTER TABLE users ADD COLUMN cpf TEXT' },
        { name: 'birth_date', sql: 'ALTER TABLE users ADD COLUMN birth_date DATE' },
        { name: 'last_login', sql: 'ALTER TABLE users ADD COLUMN last_login DATETIME' }
      ];
      
      for (const field of fieldsToAdd) {
        if (!userColumns.includes(field.name)) {
          console.log(`Adicionando coluna ${field.name} na tabela users...`);
          try {
            dbInstance.prepare(field.sql).run();
            console.log(`Coluna ${field.name} adicionada com sucesso!`);
          } catch (migrationError) {
            console.error(`Erro ao adicionar coluna ${field.name}:`, migrationError);
          }
        }
      }
      
      // Atualizar role padrão de 'user' para 'customer' nos registros existentes
      try {
        dbInstance.prepare("UPDATE users SET role = 'customer' WHERE role = 'user'").run();
        console.log('Roles atualizados de "user" para "customer"');
      } catch (e) {
        // Ignorar se não houver registros
      }
      
      // Atualizar status padrão de 'pending' para 'active' nos clientes existentes
      try {
        dbInstance.prepare("UPDATE users SET status = 'active' WHERE role = 'customer' AND status = 'pending'").run();
        console.log('Status de clientes atualizados para "active"');
      } catch (e) {
        // Ignorar se não houver registros
      }
    } catch (error) {
      console.error('Erro ao verificar/adicionar campos em users:', error);
    }
    
    // Migração: criar tabela user_addresses se não existir
    try {
      dbInstance.prepare('SELECT id FROM user_addresses LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela user_addresses...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS user_addresses (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT DEFAULT 'delivery',
            label TEXT,
            is_default BOOLEAN DEFAULT 0,
            recipient_name TEXT NOT NULL,
            phone TEXT,
            zip_code TEXT NOT NULL,
            street TEXT NOT NULL,
            number TEXT NOT NULL,
            complement TEXT,
            neighborhood TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            reference TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default);
        `);
        console.log('Tabela user_addresses criada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabela user_addresses:', migrationError);
      }
    }
    
    // Migração: adicionar coluna is_imported na tabela cities se não existir
    try {
      dbInstance.prepare('SELECT is_imported FROM cities LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna is_imported na tabela cities...');
      try {
        dbInstance.prepare('ALTER TABLE cities ADD COLUMN is_imported BOOLEAN DEFAULT 0').run();
        console.log('Coluna is_imported adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna is_imported:', migrationError);
      }
    }
    
    // Migração FASE 2: adicionar campo payment_methods na tabela stores
    try {
      dbInstance.prepare('SELECT payment_methods FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna payment_methods na tabela stores...');
      try {
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN payment_methods TEXT DEFAULT \'["whatsapp"]\'').run();
        console.log('Coluna payment_methods adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna payment_methods:', migrationError);
      }
    }
    
    // Migração: adicionar coluna slug na tabela stores se não existir
    try {
      dbInstance.prepare('SELECT slug FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna slug na tabela stores...');
      try {
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN slug TEXT UNIQUE').run();
        console.log('Coluna slug adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna slug:', migrationError);
      }
    }
    
    // Migração: adicionar coluna installments_enabled na tabela stores se não existir
    try {
      dbInstance.prepare('SELECT installments_enabled FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna installments_enabled na tabela stores...');
      try {
        dbInstance.prepare('ALTER TABLE stores ADD COLUMN installments_enabled BOOLEAN DEFAULT 0').run();
        console.log('Coluna installments_enabled adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna installments_enabled:', migrationError);
      }
    }
    
    // Migração: adicionar colunas de informações detalhadas na tabela products
    try {
      if (isSQLite()) {
        dbInstance.prepare('SELECT technical_specs FROM products LIMIT 1').get();
      } else {
        const checkResult = await dbInstance.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'technical_specs';
        `);
        if (checkResult.rows.length > 0) {
          throw new Error('Coluna já existe'); // Simular que já existe
        }
      }
    } catch (e) {
      console.log('Adicionando colunas de informações detalhadas na tabela products...');
      try {
        if (isSQLite()) {
          dbInstance.prepare('ALTER TABLE products ADD COLUMN technical_specs TEXT').run();
          dbInstance.prepare('ALTER TABLE products ADD COLUMN included_items TEXT').run();
          dbInstance.prepare('ALTER TABLE products ADD COLUMN warranty_info TEXT').run();
        } else {
          // PostgreSQL
          await dbInstance.query('ALTER TABLE products ADD COLUMN technical_specs TEXT');
          await dbInstance.query('ALTER TABLE products ADD COLUMN included_items TEXT');
          await dbInstance.query('ALTER TABLE products ADD COLUMN warranty_info TEXT');
        }
        console.log('✅ Colunas de informações detalhadas adicionadas com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar colunas de informações detalhadas:', migrationError);
      }
    }
    
    // Migração: adicionar coluna attributes na tabela products (JSON com atributos dinâmicos da categoria)
    try {
      dbInstance.prepare('SELECT attributes FROM products LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna attributes na tabela products...');
      try {
        if (isSQLite()) {
          dbInstance.prepare('ALTER TABLE products ADD COLUMN attributes TEXT').run();
        } else {
          await dbInstance.query('ALTER TABLE products ADD COLUMN attributes TEXT');
        }
        console.log('✅ Coluna attributes adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna attributes:', migrationError);
      }
    }
    
    // Migração FASE 2: criar tabela payments se não existir
    try {
      dbInstance.prepare('SELECT id FROM payments LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela payments...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            payment_id TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            payment_method TEXT NOT NULL,
            payment_type TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'BRL',
            mp_preference_id TEXT,
            mp_payment_id TEXT,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
          CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
          CREATE INDEX IF NOT EXISTS idx_payments_mp_payment ON payments(mp_payment_id);
        `);
        console.log('Tabela payments criada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabela payments:', migrationError);
      }
    }
    
    // Migração FASE 2: adicionar campos payment_id e mp_preference_id na tabela orders
    try {
      dbInstance.prepare('SELECT payment_id FROM orders LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna payment_id na tabela orders...');
      try {
        dbInstance.prepare('ALTER TABLE orders ADD COLUMN payment_id TEXT').run();
        dbInstance.prepare('CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_id)').run();
        console.log('Coluna payment_id adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna payment_id:', migrationError);
      }
    }
    
    try {
      dbInstance.prepare('SELECT mp_preference_id FROM orders LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna mp_preference_id na tabela orders...');
      try {
        dbInstance.prepare('ALTER TABLE orders ADD COLUMN mp_preference_id TEXT').run();
        console.log('Coluna mp_preference_id adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna mp_preference_id:', migrationError);
      }
    }
    
    // Migração: criar tabela refresh_tokens se não existir
    try {
      dbInstance.prepare('SELECT id FROM refresh_tokens LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela refresh_tokens...');
      try {
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            revoked BOOLEAN DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
          CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
          CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
        `);
        console.log('Tabela refresh_tokens criada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabela refresh_tokens:', migrationError);
      }
    }
    
    // Migração: criar tabelas de campanhas do marketplace se não existirem
    try {
      dbInstance.prepare('SELECT 1 FROM marketplace_campaigns LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabelas de campanhas do marketplace...');
      try {
        const campaignsSchema = readFileSync(join(__dirname, 'campaigns_schema.sql'), 'utf-8');
        dbInstance.exec(campaignsSchema);
        console.log('✅ Tabelas de campanhas criadas com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao criar tabelas de campanhas:', migrationError);
      }
    }

    // Migração: criar tabela de atributos de categoria (category_attributes)
    try {
      if (isSQLite()) {
        // SQLite: tentar fazer uma query simples
        try {
          dbInstance.prepare('SELECT 1 FROM category_attributes LIMIT 1').get();
        } catch (e) {
          console.log('Criando tabela category_attributes (SQLite)...');
          dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS category_attributes (
              id TEXT PRIMARY KEY,
              category_id TEXT NOT NULL,
              name TEXT NOT NULL,
              label TEXT,
              type TEXT NOT NULL,
              options TEXT,
              is_filterable BOOLEAN DEFAULT 1,
              is_required BOOLEAN DEFAULT 0,
              order_index INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (category_id) REFERENCES categories(id)
            );
            CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
              ON category_attributes(category_id);
            CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
              ON category_attributes(category_id, is_filterable);
          `);
          console.log('✅ Tabela category_attributes criada com sucesso (SQLite)!');
        }
      } else {
        // PostgreSQL: verificar se a tabela existe usando information_schema
        try {
          const checkResult = await dbInstance.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'category_attributes'
            );
          `);
          
          if (!checkResult.rows[0]?.exists) {
            console.log('Criando tabela category_attributes (PostgreSQL)...');
            await dbInstance.query(`
              CREATE TABLE category_attributes (
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
            `);
            await dbInstance.query(`
              CREATE INDEX idx_category_attributes_category 
              ON category_attributes(category_id);
            `);
            await dbInstance.query(`
              CREATE INDEX idx_category_attributes_filterable 
              ON category_attributes(category_id, is_filterable);
            `);
            console.log('✅ Tabela category_attributes criada com sucesso (PostgreSQL)!');
          } else {
            console.log('✅ Tabela category_attributes já existe');
          }
        } catch (migrationError) {
          console.error('Erro ao criar tabela category_attributes:', migrationError);
          console.error('Stack:', migrationError.stack);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabela category_attributes:', error);
    }

    // Seed: atributos padrão para categoria "Carros" (se existir)
    try {
      console.log('🔍 Verificando categoria \"Carros\" para criar atributos padrão...');
      if (isSQLite()) {
        const cat = dbInstance
          .prepare(
            "SELECT id, name, slug FROM categories WHERE lower(name) = lower(?) OR lower(slug) = lower(?) LIMIT 1"
          )
          .get('Carros', 'carros');

        if (cat && cat.id) {
          const existing = dbInstance
            .prepare(
              'SELECT COUNT(*) as count FROM category_attributes WHERE category_id = ?'
            )
            .get(cat.id);

          if (!existing || !existing.count) {
            console.log('➕ Criando atributos padrão para categoria Carros (SQLite)...');
            const insertAttr = dbInstance.prepare(`
              INSERT INTO category_attributes 
              (id, category_id, name, label, type, options, is_filterable, is_required, order_index)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const attrs = [
              {
                name: 'year',
                label: 'Ano',
                type: 'range',
                options: null,
                is_filterable: 1,
                is_required: 0,
                order_index: 1,
              },
              {
                name: 'model',
                label: 'Modelo',
                type: 'select',
                options: null,
                is_filterable: 1,
                is_required: 0,
                order_index: 2,
              },
              {
                name: 'brand',
                label: 'Marca',
                type: 'select',
                options: JSON.stringify([
                  'Chevrolet', 'Fiat', 'Volkswagen', 'Ford', 'Toyota', 'Hyundai',
                  'Renault', 'Honda', 'Nissan', 'Jeep', 'Peugeot', 'Citroën',
                  'Mitsubishi', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo',
                  'Land Rover', 'Jaguar', 'Porsche', 'Outra'
                ]),
                is_filterable: 1,
                is_required: 0,
                order_index: 3,
              },
              {
                name: 'mileage',
                label: 'Quilometragem',
                type: 'range',
                options: null,
                is_filterable: 1,
                is_required: 0,
                order_index: 4,
              },
              {
                name: 'fuel',
                label: 'Combustível',
                type: 'multi-select',
                options: JSON.stringify([
                  'Gasolina',
                  'Álcool (Etanol)',
                  'Flex',
                  'Diesel',
                  'GNV',
                  'Elétrico',
                  'Híbrido',
                ]),
                is_filterable: 1,
                is_required: 0,
                order_index: 5,
              },
              {
                name: 'transmission',
                label: 'Câmbio',
                type: 'select',
                options: JSON.stringify(['Manual', 'Automático', 'Automatizado', 'CVT']),
                is_filterable: 1,
                is_required: 0,
                order_index: 6,
              },
              {
                name: 'color',
                label: 'Cor',
                type: 'select',
                options: JSON.stringify([
                  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul',
                  'Verde', 'Amarelo', 'Laranja', 'Marrom', 'Bege', 'Dourado',
                  'Roxo', 'Rosa', 'Outra'
                ]),
                is_filterable: 1,
                is_required: 0,
                order_index: 7,
              },
            ];

            for (const attr of attrs) {
              insertAttr.run(
                `car-${attr.name}`,
                cat.id,
                attr.name,
                attr.label,
                attr.type,
                attr.options,
                attr.is_filterable,
                attr.is_required,
                attr.order_index
              );
            }

            console.log('✅ Atributos padrão para Carros criados (SQLite)');
          } else {
            console.log('ℹ️ Categoria Carros já possui atributos, nada a fazer (SQLite).');
          }
        } else {
          console.log('ℹ️ Categoria Carros não encontrada (SQLite), seed ignorado.');
        }
      } else {
        const catResult = await dbInstance.query(
          "SELECT id, name, slug FROM categories WHERE lower(name) = lower($1) OR lower(slug) = lower($1) LIMIT 1",
          ['carros']
        );
        const cat = catResult.rows[0];

        if (cat && cat.id) {
          const countResult = await dbInstance.query(
            'SELECT COUNT(*) as count FROM category_attributes WHERE category_id = $1',
            [cat.id]
          );
          const existingCount = Number(countResult.rows[0]?.count || 0);

          if (existingCount === 0) {
            console.log('➕ Criando atributos padrão para categoria Carros (PostgreSQL)...');

            const attrs = [
              {
                name: 'year',
                label: 'Ano',
                type: 'range',
                options: null,
                is_filterable: true,
                is_required: false,
                order_index: 1,
              },
              {
                name: 'model',
                label: 'Modelo',
                type: 'select',
                options: null,
                is_filterable: true,
                is_required: false,
                order_index: 2,
              },
              {
                name: 'brand',
                label: 'Marca',
                type: 'select',
                options: JSON.stringify([
                  'Chevrolet', 'Fiat', 'Volkswagen', 'Ford', 'Toyota', 'Hyundai',
                  'Renault', 'Honda', 'Nissan', 'Jeep', 'Peugeot', 'Citroën',
                  'Mitsubishi', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo',
                  'Land Rover', 'Jaguar', 'Porsche', 'Outra'
                ]),
                is_filterable: true,
                is_required: false,
                order_index: 3,
              },
              {
                name: 'mileage',
                label: 'Quilometragem',
                type: 'range',
                options: null,
                is_filterable: true,
                is_required: false,
                order_index: 4,
              },
              {
                name: 'fuel',
                label: 'Combustível',
                type: 'multi-select',
                options: JSON.stringify([
                  'Gasolina',
                  'Álcool (Etanol)',
                  'Flex',
                  'Diesel',
                  'GNV',
                  'Elétrico',
                  'Híbrido',
                ]),
                is_filterable: true,
                is_required: false,
                order_index: 5,
              },
              {
                name: 'transmission',
                label: 'Câmbio',
                type: 'select',
                options: JSON.stringify(['Manual', 'Automático', 'Automatizado', 'CVT']),
                is_filterable: true,
                is_required: false,
                order_index: 6,
              },
              {
                name: 'color',
                label: 'Cor',
                type: 'select',
                options: JSON.stringify([
                  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul',
                  'Verde', 'Amarelo', 'Laranja', 'Marrom', 'Bege', 'Dourado',
                  'Roxo', 'Rosa', 'Outra'
                ]),
                is_filterable: true,
                is_required: false,
                order_index: 7,
              },
            ];

            for (const attr of attrs) {
              await dbInstance.query(
                `
                INSERT INTO category_attributes 
                (id, category_id, name, label, type, options, is_filterable, is_required, order_index)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `,
                [
                  `car-${attr.name}`,
                  cat.id,
                  attr.name,
                  attr.label,
                  attr.type,
                  attr.options,
                  attr.is_filterable,
                  attr.is_required,
                  attr.order_index,
                ]
              );
            }

            console.log('✅ Atributos padrão para Carros criados (PostgreSQL)');
          } else {
            console.log('ℹ️ Categoria Carros já possui atributos, nada a fazer (PostgreSQL).');
          }
        } else {
          console.log('ℹ️ Categoria Carros não encontrada (PostgreSQL), seed ignorado.');
        }
      }
    } catch (seedError) {
      console.error('Erro ao criar atributos padrão para categoria Carros:', seedError);
    }
  }
  
  // Exportar db para uso global
  return dbInstance;
}

// Função getter para obter db (compatibilidade com imports existentes)
function getDbInstance() {
  if (!dbInstance) {
    throw new Error('Database não inicializado. Chame initDatabase() primeiro.');
  }
  return dbInstance;
}

// Exportar db como objeto com getter (será definido após initDatabase)
// Isso permite que as rotas continuem usando `import { db } from '../database/db.js'`
// mas o db só estará disponível após initDatabase() ser chamado
export const db = new Proxy({}, {
  get(target, prop) {
    const instance = getDbInstance();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value) {
    const instance = getDbInstance();
    instance[prop] = value;
    return true;
  }
});

// Dados iniciais
async function seedDatabase(db) {
  // Inserir categorias padrão
  const categories = [
    { id: 'cat-1', name: 'Alimentos', slug: 'alimentos', active: 1 },
    { id: 'cat-2', name: 'Bebidas', slug: 'bebidas', active: 1 },
    { id: 'cat-3', name: 'Limpeza', slug: 'limpeza', active: 1 },
    { id: 'cat-4', name: 'Hortifruti', slug: 'hortifruti', active: 1 },
    { id: 'cat-5', name: 'Padaria', slug: 'padaria', active: 1 },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, active) 
    VALUES (?, ?, ?, ?)
  `);

  categories.forEach(cat => {
    try {
      insertCategory.run(cat.id, cat.name, cat.slug, cat.active);
    } catch (e) {
      // Ignorar se já existir
    }
  });

  // Inserir planos padrão
  const plans = [
    { 
      id: 'plan-free', 
      name: 'Free',
      slug: 'free',
      price: 0, 
      product_limit: 10,
      features: JSON.stringify(['Até 10 produtos', 'Perfil básico', 'Suporte por email'])
    },
    { 
      id: 'plan-standard', 
      name: 'Standard',
      slug: 'standard',
      price: 49.90, 
      product_limit: 50,
      features: JSON.stringify(['Até 50 produtos', 'Perfil destacado', 'Relatórios básicos'])
    },
    { 
      id: 'plan-premium', 
      name: 'Premium',
      slug: 'premium',
      price: 99.90, 
      product_limit: null,
      features: JSON.stringify(['Produtos ilimitados', 'Perfil premium', 'Relatórios avançados'])
    },
    { 
      id: 'plan-enterprise', 
      name: 'Enterprise',
      slug: 'enterprise',
      price: 199.90, 
      product_limit: null,
      features: JSON.stringify([
        'Produtos ilimitados', 
        'Loja Online Premium', 
        'Personalização completa de cores', 
        'Banner personalizado',
        'Seções editáveis',
        'Analytics avançado', 
        'Suporte prioritário'
      ])
    },
  ];

  const insertPlan = db.prepare(`
    INSERT INTO plans (id, name, slug, price, product_limit, features, active) 
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  plans.forEach(plan => {
    try {
      insertPlan.run(plan.id, plan.name, plan.slug, plan.price, plan.product_limit, plan.features);
    } catch (e) {
      // Ignorar se já existir
    }
  });

  // Criar usuário admin padrão (senha: admin123)
  const bcrypt = await import('bcryptjs');
  const adminPassword = await bcrypt.default.hash('admin123', 10);
  
  const insertAdmin = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, status) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  try {
    insertAdmin.run('admin-1', 'admin@localmart.com', adminPassword, 'Administrador', 'admin', 'approved');
  } catch (e) {
    // Ignorar se já existir
  }

  console.log('Dados iniciais inseridos!');
}

// Fechar conexão ao encerrar
process.on('exit', () => {
  if (dbInstance && isSQLite() && typeof dbInstance.close === 'function') {
    dbInstance.close();
  }
});

process.on('SIGINT', () => {
  if (dbInstance && isSQLite() && typeof dbInstance.close === 'function') {
    dbInstance.close();
  }
  process.exit(0);
});

