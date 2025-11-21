import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../database.sqlite');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

// Criar conexão com o banco
export const db = new Database(DB_PATH);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Inicializar banco de dados se não existir
export async function initDatabase() {
  if (!existsSync(DB_PATH)) {
    console.log('Criando banco de dados...');
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    
    // Criar tabela de configurações
    const settingsSchema = readFileSync(join(__dirname, 'settings_schema.sql'), 'utf-8');
    db.exec(settingsSchema);
    
    console.log('Banco de dados criado com sucesso!');
    
    // Inserir dados iniciais
    await seedDatabase();
  } else {
    // Verificar se tabela de configurações existe, se não, criar
    try {
      db.prepare('SELECT 1 FROM settings LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela de configurações...');
      const settingsSchema = readFileSync(join(__dirname, 'settings_schema.sql'), 'utf-8');
      db.exec(settingsSchema);
    }
    
    // Migração: adicionar coluna category_id na tabela stores se não existir
    try {
      db.prepare('SELECT category_id FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna category_id na tabela stores...');
      try {
        db.prepare('ALTER TABLE stores ADD COLUMN category_id TEXT').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category_id)').run();
        console.log('Coluna category_id adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna category_id:', migrationError);
      }
    }
    
    // Migração: adicionar coluna checkout_enabled na tabela stores se não existir
    try {
      db.prepare('SELECT checkout_enabled FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna checkout_enabled na tabela stores...');
      try {
        db.prepare('ALTER TABLE stores ADD COLUMN checkout_enabled BOOLEAN DEFAULT 0').run();
        console.log('Coluna checkout_enabled adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna checkout_enabled:', migrationError);
      }
    }
    
    // Migração: adicionar coluna slug na tabela plans se não existir
    try {
      db.prepare('SELECT slug FROM plans LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna slug na tabela plans...');
      try {
        db.prepare('ALTER TABLE plans ADD COLUMN slug TEXT').run();
        // Atualizar slugs existentes baseado no ID
        const plans = db.prepare('SELECT id FROM plans').all();
        plans.forEach(plan => {
          const slug = plan.id.replace(/^plan-/, '');
          db.prepare('UPDATE plans SET slug = ? WHERE id = ?').run(slug, plan.id);
        });
        console.log('Coluna slug adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna slug:', migrationError);
      }
    }
    
    // Migração: adicionar campos de pagamento e frete na tabela stores
    try {
      db.prepare('SELECT pix_key FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando campos de pagamento e frete na tabela stores...');
      try {
        db.prepare('ALTER TABLE stores ADD COLUMN pix_key TEXT').run();
        db.prepare('ALTER TABLE stores ADD COLUMN payment_link TEXT').run();
        db.prepare('ALTER TABLE stores ADD COLUMN payment_instructions TEXT').run();
        db.prepare('ALTER TABLE stores ADD COLUMN shipping_fixed_price DECIMAL(10,2)').run();
        db.prepare('ALTER TABLE stores ADD COLUMN shipping_calculate_on_whatsapp BOOLEAN DEFAULT 0').run();
        db.prepare('ALTER TABLE stores ADD COLUMN shipping_free_threshold DECIMAL(10,2)').run();
        console.log('Campos de pagamento e frete adicionados com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar campos de pagamento e frete:', migrationError);
      }
    }
    
    // Migração: adicionar campo mercadopago_access_token na tabela stores
    try {
      db.prepare('SELECT mercadopago_access_token FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando campo mercadopago_access_token na tabela stores...');
      try {
        db.prepare('ALTER TABLE stores ADD COLUMN mercadopago_access_token TEXT').run();
        db.prepare('ALTER TABLE stores ADD COLUMN mercadopago_public_key TEXT').run();
        console.log('Campos do Mercado Pago adicionados com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar campos do Mercado Pago:', migrationError);
      }
    }
    
    // Migração: adicionar campos de desconto na tabela order_items
    try {
      db.prepare('SELECT original_price FROM order_items LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando campos de desconto na tabela order_items...');
      try {
        db.prepare('ALTER TABLE order_items ADD COLUMN original_price DECIMAL(10,2)').run();
        db.prepare('ALTER TABLE order_items ADD COLUMN discount_percent DECIMAL(5,2)').run();
        db.prepare('ALTER TABLE order_items ADD COLUMN promotion_name TEXT').run();
        console.log('Campos de desconto adicionados com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar campos de desconto:', migrationError);
      }
    }
    
    // Migração: criar tabela store_customizations se não existir
    try {
      db.prepare('SELECT 1 FROM store_customizations LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela store_customizations...');
      try {
        db.exec(`
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
      db.prepare('SELECT banners FROM store_customizations LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna banners...');
      try {
        db.exec('ALTER TABLE store_customizations ADD COLUMN banners TEXT');
        console.log('Coluna banners adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna banners:', migrationError);
      }
    }
    
    // Migração: adicionar coluna show_timer na tabela promotions
    try {
      db.prepare('SELECT show_timer FROM promotions LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna show_timer na tabela promotions...');
      try {
        db.prepare('ALTER TABLE promotions ADD COLUMN show_timer BOOLEAN DEFAULT 0').run();
        console.log('Coluna show_timer adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna show_timer:', migrationError);
      }
    }
    
    // Migração: criar tabela de promoções se não existir
    try {
      db.prepare('SELECT id FROM promotions LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela promotions...');
      try {
        db.exec(`
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
      db.prepare('SELECT id FROM orders LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabelas orders e order_items...');
      try {
        db.exec(`
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
      const ordersInfo = db.prepare("PRAGMA table_info(orders)").all();
      const hasNotesAdmin = ordersInfo.some(col => col.name === 'notes_admin');
      const hasTrackingNumber = ordersInfo.some(col => col.name === 'tracking_number');
      
      if (!hasNotesAdmin) {
        db.prepare('ALTER TABLE orders ADD COLUMN notes_admin TEXT').run();
        console.log('Campo notes_admin adicionado à tabela orders');
      }
      
      if (!hasTrackingNumber) {
        db.prepare('ALTER TABLE orders ADD COLUMN tracking_number TEXT').run();
        console.log('Campo tracking_number adicionado à tabela orders');
      }
    } catch (migrationError) {
      console.error('Erro ao adicionar campos à tabela orders:', migrationError);
    }
    
    // Migração: criar tabela order_history se não existir
    try {
      db.prepare('SELECT id FROM order_history LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela order_history...');
      try {
        db.exec(`
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
      db.prepare('SELECT id FROM cart LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabelas cart e cart_items...');
      try {
        db.exec(`
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
    
    // Migração: adicionar store_id na tabela categories se não existir
    try {
      const tableInfo = db.prepare("PRAGMA table_info(categories)").all();
      const hasStoreId = tableInfo.some(col => col.name === 'store_id');
      
      if (!hasStoreId) {
        console.log('Adicionando coluna store_id na tabela categories...');
        db.prepare(`
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
      const tableInfo = db.prepare("PRAGMA table_info(products)").all();
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
            db.prepare(field.sql).run();
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
        db.prepare('SELECT id FROM reviews LIMIT 1').get();
      } catch (e) {
        console.log('Criando tabela reviews...');
        db.exec(`
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
        db.prepare('SELECT id FROM user_favorites LIMIT 1').get();
      } catch (e) {
        console.log('Criando tabela user_favorites...');
        db.exec(`
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
        db.prepare('SELECT id FROM notifications LIMIT 1').get();
      } catch (e) {
        console.log('Criando tabela notifications...');
        db.exec(`
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
      const userColumns = db.prepare("PRAGMA table_info(users)").all().map(col => col.name);
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
            db.prepare(field.sql).run();
            console.log(`Coluna ${field.name} adicionada com sucesso!`);
          } catch (migrationError) {
            console.error(`Erro ao adicionar coluna ${field.name}:`, migrationError);
          }
        }
      }
      
      // Atualizar role padrão de 'user' para 'customer' nos registros existentes
      try {
        db.prepare("UPDATE users SET role = 'customer' WHERE role = 'user'").run();
        console.log('Roles atualizados de "user" para "customer"');
      } catch (e) {
        // Ignorar se não houver registros
      }
      
      // Atualizar status padrão de 'pending' para 'active' nos clientes existentes
      try {
        db.prepare("UPDATE users SET status = 'active' WHERE role = 'customer' AND status = 'pending'").run();
        console.log('Status de clientes atualizados para "active"');
      } catch (e) {
        // Ignorar se não houver registros
      }
    } catch (error) {
      console.error('Erro ao verificar/adicionar campos em users:', error);
    }
    
    // Migração: criar tabela user_addresses se não existir
    try {
      db.prepare('SELECT id FROM user_addresses LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela user_addresses...');
      try {
        db.exec(`
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
      db.prepare('SELECT is_imported FROM cities LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna is_imported na tabela cities...');
      try {
        db.prepare('ALTER TABLE cities ADD COLUMN is_imported BOOLEAN DEFAULT 0').run();
        console.log('Coluna is_imported adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna is_imported:', migrationError);
      }
    }
    
    // Migração FASE 2: adicionar campo payment_methods na tabela stores
    try {
      db.prepare('SELECT payment_methods FROM stores LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna payment_methods na tabela stores...');
      try {
        db.prepare('ALTER TABLE stores ADD COLUMN payment_methods TEXT DEFAULT \'["whatsapp"]\'').run();
        console.log('Coluna payment_methods adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna payment_methods:', migrationError);
      }
    }
    
    // Migração FASE 2: criar tabela payments se não existir
    try {
      db.prepare('SELECT id FROM payments LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela payments...');
      try {
        db.exec(`
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
      db.prepare('SELECT payment_id FROM orders LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna payment_id na tabela orders...');
      try {
        db.prepare('ALTER TABLE orders ADD COLUMN payment_id TEXT').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_id)').run();
        console.log('Coluna payment_id adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna payment_id:', migrationError);
      }
    }
    
    try {
      db.prepare('SELECT mp_preference_id FROM orders LIMIT 1').get();
    } catch (e) {
      console.log('Adicionando coluna mp_preference_id na tabela orders...');
      try {
        db.prepare('ALTER TABLE orders ADD COLUMN mp_preference_id TEXT').run();
        console.log('Coluna mp_preference_id adicionada com sucesso!');
      } catch (migrationError) {
        console.error('Erro ao adicionar coluna mp_preference_id:', migrationError);
      }
    }
    
    // Migração: criar tabela refresh_tokens se não existir
    try {
      db.prepare('SELECT id FROM refresh_tokens LIMIT 1').get();
    } catch (e) {
      console.log('Criando tabela refresh_tokens...');
      try {
        db.exec(`
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
  }
}

// Dados iniciais
async function seedDatabase() {
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
  db.close();
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

