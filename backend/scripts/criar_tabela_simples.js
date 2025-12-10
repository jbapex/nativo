/**
 * Script simples para criar a tabela category_attributes
 * Uso: node backend/scripts/criar_tabela_simples.js [superuser] [password]
 */

import pg from 'pg';
const { Pool } = pg;

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 5432;
const DB_NAME = process.env.DB_NAME || 'local_mart';

// Pegar parâmetros da linha de comando
const superuser = process.argv[2] || 'josiasbonfimdefaria';
const password = process.argv[3] || '';

async function criarTabela() {
  try {
    console.log(`🔄 Conectando como ${superuser}...`);
    
    const pool = new Pool({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: superuser,
      password: password,
    });
    
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado!\n');
    
    // Verificar se existe
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'category_attributes'
      );
    `);
    
    if (check.rows[0]?.exists) {
      console.log('✅ Tabela já existe!\n');
      await pool.end();
      return;
    }
    
    console.log('📝 Criando tabela...\n');
    
    // Verificar tipo da coluna id em categories
    const catCheck = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'id';
    `);
    
    const categoryIdType = catCheck.rows[0]?.data_type === 'uuid' ? 'UUID' : 'VARCHAR(50)';
    
    console.log(`📊 Tipo de category_id: ${categoryIdType}\n`);
    
    await pool.query(`
      CREATE TABLE category_attributes (
        id VARCHAR(50) PRIMARY KEY,
        category_id ${categoryIdType} NOT NULL,
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
    
    await pool.query(`
      CREATE INDEX idx_category_attributes_category 
      ON category_attributes(category_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_category_attributes_filterable 
      ON category_attributes(category_id, is_filterable);
    `);
    
    // Conceder permissões
    try {
      await pool.query(`GRANT ALL PRIVILEGES ON TABLE category_attributes TO localmart;`);
      console.log('✅ Permissões concedidas ao localmart!\n');
    } catch (e) {
      console.warn('⚠️ Não foi possível conceder permissões:', e.message);
    }
    
    console.log('🎉 Tabela criada com sucesso!\n');
    
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.code === '28P01') {
      console.error('\n💡 Tente executar com senha:');
      console.error(`   node backend/scripts/criar_tabela_simples.js ${superuser} SUA_SENHA\n`);
    }
    process.exit(1);
  }
}

criarTabela();

