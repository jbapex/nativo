import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'local_mart',
  user: process.env.DB_USER || 'localmart',
  password: process.env.DB_PASSWORD || 'localmart123',
});

async function addBannerPageImageColumn() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando se a coluna banner_page_image existe...');
    
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
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

