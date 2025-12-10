/**
 * Script para criar a tabela category_attributes usando superusuário
 * Tenta descobrir o superusuário automaticamente
 */

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

// Carregar variáveis de ambiente
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 5432;
const DB_NAME = process.env.DB_NAME || 'local_mart';

async function descobrirSuperuser() {
  console.log('🔍 Tentando descobrir o superusuário do PostgreSQL...\n');
  
  // Tentar usuários comuns
  const usuariosComuns = [
    'postgres',
    'josiasbonfimdefaria', // Baseado no histórico
    process.env.USER, // Usuário atual do sistema
    'admin',
    'root'
  ];
  
  for (const usuario of usuariosComuns) {
    if (!usuario) continue;
    
    console.log(`Tentando conectar como: ${usuario}`);
    
    try {
      const pool = new Pool({
        host: DB_HOST,
        port: DB_PORT,
        database: 'postgres', // Tentar conectar ao banco padrão
        user: usuario,
        password: '', // Tentar sem senha primeiro
      });
      
      await pool.query('SELECT 1');
      await pool.end();
      
      // Verificar se é superusuário
      const pool2 = new Pool({
        host: DB_HOST,
        port: DB_PORT,
        database: 'postgres',
        user: usuario,
        password: '',
      });
      
      const result = await pool2.query(`
        SELECT usesuper FROM pg_user WHERE usename = $1
      `, [usuario]);
      
      await pool2.end();
      
      if (result.rows[0]?.usesuper) {
        console.log(`✅ Superusuário encontrado: ${usuario}\n`);
        return usuario;
      }
    } catch (error) {
      // Ignorar erros e tentar próximo usuário
    }
  }
  
  return null;
}

async function criarTabela() {
  try {
    let superuser = await descobrirSuperuser();
    
    if (!superuser) {
      console.log('❌ Não foi possível descobrir o superusuário automaticamente.\n');
      superuser = await question('Digite o nome do superusuário do PostgreSQL: ');
    }
    
    const password = await question(`Digite a senha do usuário "${superuser}" (ou pressione Enter se não tiver senha): `);
    
    console.log('\n🔄 Conectando ao PostgreSQL...');
    
    const pool = new Pool({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: superuser,
      password: password || '',
    });
    
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida!\n');
    
    // Verificar se a tabela já existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'category_attributes'
      );
    `);
    
    if (checkResult.rows[0]?.exists) {
      console.log('✅ Tabela category_attributes já existe!\n');
      await pool.end();
      rl.close();
      return;
    }
    
    console.log('📝 Criando tabela category_attributes...\n');
    
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
    await pool.query(`
      CREATE INDEX idx_category_attributes_category 
      ON category_attributes(category_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_category_attributes_filterable 
      ON category_attributes(category_id, is_filterable);
    `);
    
    console.log('✅ Índices criados!\n');
    
    // Conceder permissões ao usuário localmart
    try {
      await pool.query(`
        GRANT ALL PRIVILEGES ON TABLE category_attributes TO localmart;
      `);
      console.log('✅ Permissões concedidas ao usuário localmart!\n');
    } catch (permError) {
      console.warn('⚠️ Não foi possível conceder permissões ao localmart:', permError.message);
    }
    
    console.log('🎉 Tabela category_attributes criada com sucesso!\n');
    
    await pool.end();
    rl.close();
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.code === '28P01') {
      console.error('Erro de autenticação. Verifique o usuário e senha.');
    } else if (error.code === '42P01') {
      console.error('Tabela "categories" não existe. Crie a tabela de categorias primeiro.');
    }
    rl.close();
    process.exit(1);
  }
}

criarTabela();

