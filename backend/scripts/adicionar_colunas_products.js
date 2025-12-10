/**
 * Script para adicionar colunas faltantes na tabela products (PostgreSQL)
 * Uso: node backend/scripts/adicionar_colunas_products.js [superuser] [password]
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

const superuser = process.argv[2] || 'josiasbonfimdefaria';
const password = process.argv[3] || '';

const colunasParaAdicionar = [
  { nome: 'technical_specs', tipo: 'TEXT', descricao: 'Especificações técnicas do produto' },
  { nome: 'included_items', tipo: 'TEXT', descricao: 'Itens inclusos com o produto' },
  { nome: 'warranty_info', tipo: 'TEXT', descricao: 'Informações de garantia' },
  { nome: 'attributes', tipo: 'TEXT', descricao: 'Atributos dinâmicos da categoria (JSON)' },
];

async function adicionarColunas() {
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
    
    // Verificar quais colunas já existem
    const existingCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('technical_specs', 'included_items', 'warranty_info', 'attributes');
    `);
    
    const colunasExistentes = existingCols.rows.map(r => r.column_name);
    console.log('📋 Colunas existentes:', colunasExistentes.length > 0 ? colunasExistentes.join(', ') : 'Nenhuma');
    
    // Adicionar colunas faltantes
    let colunasAdicionadas = 0;
    
    for (const coluna of colunasParaAdicionar) {
      if (colunasExistentes.includes(coluna.nome)) {
        console.log(`⏭️  Coluna "${coluna.nome}" já existe, pulando...`);
        continue;
      }
      
      try {
        console.log(`📝 Adicionando coluna "${coluna.nome}" (${coluna.descricao})...`);
        
        await pool.query(`
          ALTER TABLE products 
          ADD COLUMN ${coluna.nome} ${coluna.tipo};
        `);
        
        console.log(`✅ Coluna "${coluna.nome}" adicionada com sucesso!`);
        colunasAdicionadas++;
      } catch (error) {
        if (error.code === '42701') {
          console.log(`⏭️  Coluna "${coluna.nome}" já existe (detectado pelo erro), pulando...`);
        } else {
          console.error(`❌ Erro ao adicionar coluna "${coluna.nome}":`, error.message);
        }
      }
    }
    
    if (colunasAdicionadas === 0) {
      console.log('\n✅ Todas as colunas já existem!');
    } else {
      console.log(`\n🎉 ${colunasAdicionadas} coluna(s) adicionada(s) com sucesso!`);
    }
    
    // Verificar estrutura final
    const finalCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('technical_specs', 'included_items', 'warranty_info', 'attributes')
      ORDER BY column_name;
    `);
    
    if (finalCols.rows.length > 0) {
      console.log('\n📋 Estrutura final das colunas adicionadas:');
      finalCols.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.code === '28P01') {
      console.error('\n💡 Tente executar com senha:');
      console.error(`   node backend/scripts/adicionar_colunas_products.js ${superuser} SUA_SENHA\n`);
    }
    process.exit(1);
  }
}

adicionarColunas();

