/**
 * Script para criar a tabela category_attributes no PostgreSQL
 * Execute: node backend/scripts/criar_tabela_category_attributes_postgres.js
 */

import pg from 'pg';
const { Pool } = pg;

// Carregar variáveis de ambiente
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'local_mart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

async function criarTabelaCategoryAttributes() {
  const pool = new Pool(config);
  
  try {
    console.log('🔄 Conectando ao PostgreSQL...');
    console.log(`📊 Banco: ${config.database} | Host: ${config.host}:${config.port} | User: ${config.user}`);
    
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'category_attributes'
      );
    `);
    
    if (checkResult.rows[0]?.exists) {
      console.log('✅ Tabela category_attributes já existe no PostgreSQL');
      
      // Verificar estrutura
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'category_attributes'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Estrutura da tabela:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
      
      await pool.end();
      return;
    }
    
    console.log('📝 Criando tabela category_attributes no PostgreSQL...');
    
    // Criar tabela
    await pool.query(`
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
    
    console.log('✅ Tabela criada!');
    
    // Criar índices
    console.log('📝 Criando índices...');
    
    await pool.query(`
      CREATE INDEX idx_category_attributes_category 
      ON category_attributes(category_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_category_attributes_filterable 
      ON category_attributes(category_id, is_filterable);
    `);
    
    console.log('✅ Índices criados!');
    
    // Verificar estrutura criada
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'category_attributes'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estrutura da tabela criada:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('\n🎉 Tabela category_attributes criada com sucesso no PostgreSQL!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela category_attributes:', error);
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('Stack:', error.stack);
    
    if (error.code === '42P01') {
      console.error('\n⚠️ Erro: Tabela "categories" não existe. Crie a tabela de categorias primeiro.');
    } else if (error.code === '23503') {
      console.error('\n⚠️ Erro de chave estrangeira. Verifique se a tabela "categories" existe e tem dados.');
    } else if (error.code === '23505') {
      console.error('\n⚠️ Erro: Violação de constraint única. A tabela pode já existir parcialmente.');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
criarTabelaCategoryAttributes()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

