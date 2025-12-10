import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabaseWrapper, isSQLite } from './db-wrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateCampaigns() {
  try {
    console.log('🔄 Iniciando migração de campanhas...');
    
    const db = await initDatabaseWrapper();
    
    if (isSQLite()) {
      db.pragma('foreign_keys = ON');
    }
    
    // Verificar se as tabelas já existem
    try {
      if (isSQLite()) {
        db.prepare('SELECT 1 FROM marketplace_campaigns LIMIT 1').get();
        console.log('✅ Tabelas de campanhas já existem!');
        return;
      } else {
        // PostgreSQL
        await db.query('SELECT 1 FROM marketplace_campaigns LIMIT 1');
        console.log('✅ Tabelas de campanhas já existem!');
        return;
      }
    } catch (e) {
      // Tabelas não existem, vamos criá-las
      console.log('📝 Criando tabelas de campanhas...');
    }
    
    // Ler e executar o schema
    const schemaPath = join(__dirname, 'campaigns_schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    if (isSQLite()) {
      // SQLite - executar diretamente
      db.exec(schema);
      console.log('✅ Tabelas de campanhas criadas com sucesso no SQLite!');
    } else {
      // PostgreSQL - executar cada comando separadamente
      const commands = schema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      for (const command of commands) {
        if (command.trim()) {
          await db.query(command);
        }
      }
      console.log('✅ Tabelas de campanhas criadas com sucesso no PostgreSQL!');
    }
    
    console.log('🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrateCampaigns();

