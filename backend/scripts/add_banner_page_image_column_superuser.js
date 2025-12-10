import pg from 'pg';
const { Pool } = pg;
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addBannerPageImageColumn() {
  console.log('🔐 Este script precisa de credenciais de superusuário do PostgreSQL');
  console.log('💡 Se você não souber, pressione Ctrl+C e execute manualmente com um superusuário\n');
  
  const superuser = await question('Usuário superusuário (ex: postgres ou seu usuário): ');
  const password = await question('Senha: ');
  const host = await question('Host (Enter para localhost): ') || 'localhost';
  const port = await question('Porta (Enter para 5433): ') || '5433';
  const database = await question('Database (Enter para local_mart): ') || 'local_mart';
  
  rl.close();
  
  const pool = new Pool({
    host: host,
    port: parseInt(port),
    database: database,
    user: superuser,
    password: password,
  });
  
  const client = await pool.connect();
  try {
    console.log('\n🔍 Verificando se a coluna banner_page_image existe...');
    
    // Verificar se a coluna já existe
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'marketplace_campaigns' 
      AND column_name = 'banner_page_image'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna banner_page_image já existe!');
      return;
    }
    
    console.log('📝 Criando coluna banner_page_image...');
    
    // Criar a coluna
    await client.query(`
      ALTER TABLE marketplace_campaigns 
      ADD COLUMN banner_page_image TEXT
    `);
    
    console.log('✅ Coluna banner_page_image criada com sucesso!');
    
    // Dar permissão ao usuário localmart
    try {
      await client.query(`
        GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart
      `);
      console.log('✅ Permissões concedidas ao usuário localmart!');
    } catch (permError) {
      console.warn('⚠️ Não foi possível conceder permissões (não crítico):', permError.message);
    }
    
    // Verificar novamente
    const verifyResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketplace_campaigns' 
      AND column_name = 'banner_page_image'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verificação: Coluna criada corretamente!');
      console.log('📊 Detalhes:', verifyResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar coluna:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addBannerPageImageColumn()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    console.log('💡 Agora você pode salvar o banner da página da campanha!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

