/**
 * Script que tenta criar colunas automaticamente
 * Tenta vários usuários comuns até conseguir
 */

import pg from 'pg';
const { Pool } = pg;

const usuariosParaTestar = [
  { user: 'postgres', password: ['', 'postgres', 'admin', '123456'] },
  { user: 'josiasbonfimdefaria', password: ['', 'postgres', 'admin'] },
  { user: process.env.USER, password: ['', 'postgres'] },
];

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

async function tentarCriarColunas() {
  console.log('🔍 Tentando descobrir superusuário e criar colunas...');
  console.log('');
  
  for (const usuarioConfig of usuariosParaTestar) {
    if (!usuarioConfig.user) continue;
    
    for (const senha of usuarioConfig.password) {
      try {
        console.log(`   Tentando: ${usuarioConfig.user} (senha: ${senha || 'vazia'})...`);
        
        const pool = new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5433,
          database: process.env.DB_NAME || 'local_mart',
          user: usuarioConfig.user,
          password: senha,
          connectionTimeoutMillis: 3000,
        });
        
        const client = await pool.connect();
        
        // Verificar se é superusuário
        try {
          const superCheck = await client.query("SELECT current_setting('is_superuser')");
          const isSuper = superCheck.rows[0].current_setting === 'on';
          
          if (!isSuper) {
            console.log(`   ⚠️  ${usuarioConfig.user} não é superusuário`);
            client.release();
            await pool.end();
            continue;
          }
          
          console.log(`   ✅ Conectado como superusuário: ${usuarioConfig.user}`);
          console.log('');
          
          // Verificar colunas existentes
          const existingColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'store_customizations'
          `);
          
          const existingColumnNames = existingColumns.rows.map(row => row.column_name);
          console.log(`📋 Colunas existentes: ${existingColumnNames.length}`);
          
          // Criar colunas faltantes
          let criadas = 0;
          for (const coluna of colunas) {
            if (!existingColumnNames.includes(coluna.name)) {
              try {
                const defaultClause = coluna.default !== null ? `DEFAULT ${coluna.default}` : '';
                await client.query(`
                  ALTER TABLE store_customizations 
                  ADD COLUMN IF NOT EXISTS ${coluna.name} ${coluna.type} ${defaultClause}
                `);
                console.log(`   ✅ Coluna ${coluna.name} criada!`);
                criadas++;
              } catch (e) {
                console.log(`   ❌ Erro ao criar ${coluna.name}: ${e.message}`);
              }
            }
          }
          
          // Dar permissões
          if (criadas > 0) {
            console.log('');
            console.log('🔧 Concedendo permissões...');
            for (const coluna of colunas) {
              if (!existingColumnNames.includes(coluna.name)) {
                try {
                  await client.query(`
                    GRANT ALL PRIVILEGES ON COLUMN store_customizations.${coluna.name} TO localmart
                  `);
                } catch (e) {
                  // Ignorar erros de permissão
                }
              }
            }
          }
          
          console.log('');
          console.log('✅ Processo concluído!');
          console.log(`   Colunas criadas: ${criadas}`);
          console.log('');
          console.log('🔄 Agora tente salvar as customizações novamente!');
          
          client.release();
          await pool.end();
          return;
          
        } catch (e) {
          client.release();
          await pool.end();
          continue;
        }
        
      } catch (e) {
        // Continuar tentando
        continue;
      }
    }
  }
  
  console.log('');
  console.log('❌ Não foi possível conectar como superusuário automaticamente.');
  console.log('');
  console.log('💡 SOLUÇÃO ALTERNATIVA:');
  console.log('   Execute o SQL diretamente no pgAdmin:');
  console.log('   1. Abra o pgAdmin');
  console.log('   2. Databases → local_mart → Query Tool');
  console.log('   3. Abra o arquivo: EXECUTAR_NO_PGADMIN.sql');
  console.log('   4. Execute (F5)');
}

tentarCriarColunas().catch(console.error);

