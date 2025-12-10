/**
 * Script para criar colunas faltantes em store_customizations
 * Usa variáveis de ambiente para as credenciais do superusuário
 * 
 * Execute:
 *   SUPERUSER=seu_superuser SUPERPASSWORD=sua_senha node backend/scripts/criar_colunas_env.js
 * 
 * Ou exporte as variáveis antes:
 *   export SUPERUSER=seu_superuser
 *   export SUPERPASSWORD=sua_senha
 *   node backend/scripts/criar_colunas_env.js
 */

import pg from 'pg';
const { Pool } = pg;

const superuser = process.env.SUPERUSER || process.env.DB_SUPERUSER || 'postgres';
const superpassword = process.env.SUPERPASSWORD || process.env.DB_SUPERPASSWORD;

if (!superpassword) {
  console.error('❌ Erro: Senha do superusuário não fornecida!');
  console.error('');
  console.error('Use uma das opções:');
  console.error('  1. SUPERUSER=usuario SUPERPASSWORD=senha node backend/scripts/criar_colunas_env.js');
  console.error('  2. export SUPERUSER=usuario && export SUPERPASSWORD=senha && node backend/scripts/criar_colunas_env.js');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'local_mart',
  user: superuser,
  password: superpassword,
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
    console.log('🔧 Conectando ao PostgreSQL como superusuário...');
    console.log(`   Usuário: ${superuser}`);
    console.log(`   Banco: ${process.env.DB_NAME || 'local_mart'}`);
    console.log('');
    
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
    
    if (criadas > 0) {
      // Dar permissões ao usuário localmart
      console.log('🔧 Concedendo permissões ao usuário localmart...');
      try {
        for (const coluna of colunas) {
          if (!existingColumnNames.includes(coluna.name)) {
            await client.query(`
              GRANT ALL PRIVILEGES ON COLUMN store_customizations.${coluna.name} TO localmart
            `);
          }
        }
        console.log('✅ Permissões concedidas!');
      } catch (permError) {
        console.warn('⚠️  Aviso ao conceder permissões:', permError.message);
      }
    }
    
    // Verificar colunas finais
    const finalColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'store_customizations'
      ORDER BY column_name
    `);
    
    console.log('');
    console.log(`📋 Total de colunas na tabela: ${finalColumns.rows.length}`);
    console.log('');
    
    if (criadas > 0) {
      console.log('✅ Processo concluído com sucesso!');
      console.log('🔄 Agora você pode tentar salvar as customizações novamente.');
    } else if (jaExistem === colunas.length) {
      console.log('✅ Todas as colunas já existem!');
    } else {
      console.log('⚠️  Algumas colunas não puderam ser criadas. Verifique os erros acima.');
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Erro:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.error('   Verifique se as credenciais do superusuário estão corretas.');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

criarColunas();

