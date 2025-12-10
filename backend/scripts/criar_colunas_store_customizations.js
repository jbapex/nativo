/**
 * Script para criar colunas faltantes em store_customizations
 * Execute: node backend/scripts/criar_colunas_store_customizations.js
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'local_mart',
  user: process.env.DB_USER || 'localmart',
  password: process.env.DB_PASSWORD || 'localmart123',
});

const colunas = [
  { name: 'background_color', type: 'VARCHAR(7)', default: "'#ffffff'" },
  { name: 'footer_color', type: 'VARCHAR(7)', default: "'#f9fafb'" },
  { name: 'banner_enabled', type: 'BOOLEAN', default: 'TRUE' },
  { name: 'banners', type: 'TEXT', default: null },
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

async function criarColunas() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Conectado ao PostgreSQL');
    console.log('🔧 Verificando se a tabela existe...');
    
    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'store_customizations'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Tabela store_customizations não existe!');
      process.exit(1);
    }
    
    console.log('✅ Tabela encontrada');
    console.log('');
    
    // Verificar colunas existentes
    const existingColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'store_customizations'
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    console.log(`📋 Colunas existentes (${existingColumnNames.length}):`, existingColumnNames);
    console.log('');
    
    // Criar colunas faltantes
    let criadas = 0;
    let jaExistem = 0;
    let erros = 0;
    
    for (const coluna of colunas) {
      if (existingColumnNames.includes(coluna.name)) {
        console.log(`✓ Coluna ${coluna.name} já existe`);
        jaExistem++;
      } else {
        try {
          const defaultClause = coluna.default !== null ? `DEFAULT ${coluna.default}` : '';
          const alterQuery = `
            ALTER TABLE store_customizations 
            ADD COLUMN IF NOT EXISTS ${coluna.name} ${coluna.type} ${defaultClause}
          `;
          
          await client.query(alterQuery);
          console.log(`✅ Coluna ${coluna.name} criada com sucesso!`);
          criadas++;
        } catch (error) {
          console.error(`❌ Erro ao criar coluna ${coluna.name}:`, error.message);
          erros++;
        }
      }
    }
    
    console.log('');
    console.log('📊 Resumo:');
    console.log(`   ✅ Criadas: ${criadas}`);
    console.log(`   ✓ Já existiam: ${jaExistem}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log('');
    
    // Verificar colunas finais
    const finalColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'store_customizations'
      ORDER BY column_name
    `);
    
    console.log(`📋 Total de colunas na tabela: ${finalColumns.rows.length}`);
    console.log('');
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

criarColunas();

