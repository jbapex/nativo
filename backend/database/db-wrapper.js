/**
 * Database Wrapper - Suporta SQLite e PostgreSQL
 * 
 * Fornece interface unificada para ambos os bancos
 */

let dbInstance = null;
let dbType = null;

/**
 * Inicializar banco de dados (SQLite ou PostgreSQL)
 */
export async function initDatabaseWrapper() {
  dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'postgres' || dbType === 'postgresql') {
    // PostgreSQL
    const { initPostgresPool, PostgresDB } = await import('./db-postgres.js');
    const pool = initPostgresPool();
    dbInstance = new PostgresDB(pool);
    console.log('✅ Usando PostgreSQL');
  } else {
    // SQLite (padrão)
    const Database = (await import('better-sqlite3')).default;
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const DB_PATH = process.env.DB_PATH || join(__dirname, '../database.sqlite');
    
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('foreign_keys = ON');
    console.log('✅ Usando SQLite');
  }

  return dbInstance;
}

/**
 * Obter instância do banco
 */
export function getDb() {
  if (!dbInstance) {
    throw new Error('Database não inicializado. Chame initDatabaseWrapper() primeiro.');
  }
  return dbInstance;
}

/**
 * Verificar se está usando PostgreSQL
 */
export function isPostgres() {
  return dbType === 'postgres' || dbType === 'postgresql';
}

/**
 * Verificar se está usando SQLite
 */
export function isSQLite() {
  return dbType === 'sqlite';
}

export default {
  initDatabaseWrapper,
  getDb,
  isPostgres,
  isSQLite,
};

