#!/usr/bin/env node

/**
 * Script para Comparar Dados: SQLite vs PostgreSQL
 * 
 * Compara o número de registros em cada tabela entre SQLite e PostgreSQL
 * para verificar se a migração foi completa.
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações
const SQLITE_PATH = process.env.DB_PATH || join(__dirname, '../database.db');
const POSTGRES_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'local_mart',
  user: process.env.DB_USER || 'localmart',
  password: process.env.DB_PASSWORD || 'localmart123',
};

const { existsSync } = await import('fs');

console.log('🔍 Comparando dados SQLite vs PostgreSQL...\n');

// Verificar se SQLite existe
if (!existsSync(SQLITE_PATH)) {
  console.error('❌ Arquivo SQLite não encontrado:', SQLITE_PATH);
  process.exit(1);
}

// Conectar ao SQLite
console.log('📦 Conectando ao SQLite...');
const sqliteDb = new Database(SQLITE_PATH);

// Conectar ao PostgreSQL
console.log('🐘 Conectando ao PostgreSQL...');
const pgPool = new Pool(POSTGRES_CONFIG);

try {
  await pgPool.query('SELECT NOW()');
  console.log('✅ Conectado ao PostgreSQL\n');
} catch (error) {
  console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
  process.exit(1);
}

// Lista de tabelas para comparar
const tables = [
  'users',
  'cities',
  'plans',
  'categories',
  'stores',
  'store_customizations',
  'products',
  'subscriptions',
  'promotions',
  'orders',
  'order_items',
  'order_history',
  'cart',
  'cart_items',
  'user_favorites',
  'reviews',
  'notifications',
  'settings',
  'user_addresses',
  'payments',
  'refresh_tokens'
];

console.log('📊 Comparando registros por tabela:\n');
console.log('Tabela'.padEnd(30) + 'SQLite'.padEnd(15) + 'PostgreSQL'.padEnd(15) + 'Status');
console.log('-'.repeat(75));

let totalSQLite = 0;
let totalPostgres = 0;
let tablesWithIssues = [];

for (const table of tables) {
  try {
    // Contar no SQLite
    let sqliteCount = 0;
    try {
      const result = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      sqliteCount = result?.count || 0;
    } catch (error) {
      // Tabela pode não existir no SQLite
      sqliteCount = 0;
    }

    // Contar no PostgreSQL
    let postgresCount = 0;
    try {
      const result = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`);
      postgresCount = parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      // Tabela pode não existir no PostgreSQL
      postgresCount = 0;
    }

    totalSQLite += sqliteCount;
    totalPostgres += postgresCount;

    const status = sqliteCount === postgresCount ? '✅' : '⚠️';
    if (sqliteCount !== postgresCount) {
      tablesWithIssues.push({
        table,
        sqlite: sqliteCount,
        postgres: postgresCount,
        diff: sqliteCount - postgresCount
      });
    }

    console.log(
      table.padEnd(30) +
      sqliteCount.toString().padEnd(15) +
      postgresCount.toString().padEnd(15) +
      status
    );
  } catch (error) {
    console.log(
      table.padEnd(30) +
      'ERRO'.padEnd(15) +
      'ERRO'.padEnd(15) +
      '❌'
    );
    console.error(`   Erro ao comparar ${table}:`, error.message);
  }
}

console.log('-'.repeat(75));
console.log(
  'TOTAL'.padEnd(30) +
  totalSQLite.toString().padEnd(15) +
  totalPostgres.toString().padEnd(15) +
  (totalSQLite === totalPostgres ? '✅' : '⚠️')
);

if (tablesWithIssues.length > 0) {
  console.log('\n⚠️  Tabelas com diferenças:');
  tablesWithIssues.forEach(({ table, sqlite, postgres, diff }) => {
    console.log(`   ${table}: SQLite=${sqlite}, PostgreSQL=${postgres} (diferença: ${diff})`);
  });
} else {
  console.log('\n✅ Todas as tabelas têm o mesmo número de registros!');
}

// Fechar conexões
sqliteDb.close();
await pgPool.end();

console.log('\n✅ Comparação concluída!');

