/**
 * Script para criar a tabela category_attributes no banco de dados
 * Execute: node backend/scripts/criar_tabela_category_attributes.js
 */

import { initDatabaseWrapper, isSQLite, getDb } from '../database/db-wrapper.js';

async function criarTabelaCategoryAttributes() {
  try {
    console.log('🔄 Inicializando conexão com o banco de dados...');
    const db = await initDatabaseWrapper();
    
    if (isSQLite()) {
      console.log('📦 Usando SQLite');
      
      // Verificar se a tabela já existe
      try {
        await db.prepare('SELECT 1 FROM category_attributes LIMIT 1').get();
        console.log('✅ Tabela category_attributes já existe no SQLite');
        return;
      } catch (e) {
        console.log('📝 Criando tabela category_attributes no SQLite...');
      }
      
      // Criar tabela
      db.exec(`
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
      `);
      
      // Criar índices
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_category_attributes_category 
        ON category_attributes(category_id);
      `);
      
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_category_attributes_filterable 
        ON category_attributes(category_id, is_filterable);
      `);
      
      console.log('✅ Tabela category_attributes criada com sucesso no SQLite!');
      
    } else {
      console.log('🐘 Usando PostgreSQL');
      
      // Verificar se a tabela já existe
      try {
        const checkResult = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'category_attributes'
          );
        `);
        
        if (checkResult.rows[0]?.exists) {
          console.log('✅ Tabela category_attributes já existe no PostgreSQL');
          return;
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar existência da tabela:', e.message);
      }
      
      console.log('📝 Criando tabela category_attributes no PostgreSQL...');
      
      // Criar tabela
      await db.query(`
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
      
      // Criar índices
      await db.query(`
        CREATE INDEX idx_category_attributes_category 
        ON category_attributes(category_id);
      `);
      
      await db.query(`
        CREATE INDEX idx_category_attributes_filterable 
        ON category_attributes(category_id, is_filterable);
      `);
      
      console.log('✅ Tabela category_attributes criada com sucesso no PostgreSQL!');
    }
    
    console.log('🎉 Processo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela category_attributes:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar
criarTabelaCategoryAttributes()
  .then(() => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

