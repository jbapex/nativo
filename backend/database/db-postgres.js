/**
 * Database Wrapper para PostgreSQL
 * 
 * Fornece interface compatível com better-sqlite3 para facilitar migração
 */

import pg from 'pg';
const { Pool } = pg;

let pool = null;

/**
 * Inicializar pool de conexões PostgreSQL
 */
export function initPostgresPool() {
  if (pool) {
    return pool;
  }

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'local_mart',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20, // Máximo de conexões no pool
    min: 2, // Mínimo de conexões mantidas vivas
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Aumentado para 5s
    // Reconexão automática
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Retry automático em caso de falha
    allowExitOnIdle: false,
  };

  pool = new Pool(config);

  // Tratamento de erros com reconexão
  pool.on('error', async (err) => {
    console.error('❌ Erro inesperado no pool PostgreSQL:', err.message);
    console.error('Código do erro:', err.code);
    
    // Se for erro de conexão, tentar reconectar
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      console.warn('⚠️ Tentando reconectar ao banco de dados...');
      // O pool do pg já tenta reconectar automaticamente, mas vamos forçar um teste
      try {
        await pool.query('SELECT 1');
        console.log('✅ Reconexão bem-sucedida');
      } catch (reconnectError) {
        console.error('❌ Falha na reconexão:', reconnectError.message);
      }
    }
  });

  // Monitorar conexões
  pool.on('connect', () => {
    console.log('✅ Nova conexão estabelecida com PostgreSQL');
  });

  pool.on('remove', () => {
    console.log('ℹ️ Conexão removida do pool');
  });

  // Testar conexão
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ Conectado ao PostgreSQL:', config.database);
    })
    .catch((err) => {
      console.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
      console.error('Verifique as configurações de conexão no .env');
    });

  return pool;
}

/**
 * Wrapper para compatibilidade com better-sqlite3
 * Implementa interface similar para facilitar migração
 */
export class PostgresDB {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Executar query SQL (equivalente a db.exec)
   */
  async exec(sql) {
    const client = await this.pool.connect();
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  }

  /**
   * Executar query SQL diretamente (para migrações e queries especiais)
   */
  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Preparar statement (equivalente a db.prepare)
   */
  prepare(sql) {
    return new PostgresStatement(this.pool, sql);
  }

  /**
   * Fechar conexão
   */
  async close() {
    await this.pool.end();
  }
}

/**
 * Statement wrapper para compatibilidade
 * 
 * NOTA: PostgreSQL é assíncrono, mas better-sqlite3 é síncrono.
 * Este wrapper tenta manter compatibilidade, mas pode exigir mudanças no código.
 */
class PostgresStatement {
  constructor(pool, sql) {
    this.pool = pool;
    // Converter placeholders SQLite (?) para PostgreSQL ($1, $2, ...)
    this.sql = this.convertPlaceholders(sql);
  }

  /**
   * Converter placeholders SQLite (?) para PostgreSQL ($1, $2, ...)
   */
  convertPlaceholders(sql) {
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  }

  /**
   * Executar query com retry automático em caso de falha de conexão
   */
  async executeWithRetry(queryFn, maxRetries = 3, retryDelay = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;
        const isConnectionError = 
          error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' || 
          error.code === 'ENOTFOUND' ||
          error.code === '57P01' || // Admin shutdown
          error.code === '57P02' || // Crash shutdown
          error.code === '57P03' || // Cannot connect now
          error.message?.includes('Connection terminated') ||
          error.message?.includes('Connection lost');

        if (isConnectionError && attempt < maxRetries) {
          console.warn(`⚠️ Erro de conexão (tentativa ${attempt}/${maxRetries}), tentando novamente em ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        // Se não for erro de conexão ou já tentou todas as vezes, lançar erro
        throw error;
      }
    }
    throw lastError;
  }

  /**
   * Executar query e retornar um resultado (equivalente a .get())
   * 
   * ATENÇÃO: Este método é assíncrono, mas better-sqlite3 é síncrono.
   * O código que usa isso precisa ser atualizado para usar await.
   */
  async get(...params) {
    return this.executeWithRetry(async () => {
      // Validar parâmetros - detectar undefined que pode causar erro de UUID
      const validatedParams = params.map((param, index) => {
        if (param === undefined) {
          console.error(`⚠️ Parâmetro ${index + 1} é undefined na query:`, this.sql);
          console.error('Params recebidos:', params);
          throw new Error(`Parâmetro ${index + 1} não pode ser undefined`);
        }
        return param;
      });
      
      const result = await this.pool.query(this.sql, validatedParams);
      return result.rows[0] || null;
    });
  }

  /**
   * Executar query e retornar todos os resultados (equivalente a .all())
   * 
   * ATENÇÃO: Este método é assíncrono.
   */
  async all(...params) {
    return this.executeWithRetry(async () => {
      // Validar parâmetros - detectar undefined que pode causar erro de UUID
      const validatedParams = params.map((param, index) => {
        if (param === undefined) {
          console.error(`⚠️ Parâmetro ${index + 1} é undefined na query:`, this.sql);
          console.error('Params recebidos:', params);
          throw new Error(`Parâmetro ${index + 1} não pode ser undefined`);
        }
        return param;
      });
      
      const result = await this.pool.query(this.sql, validatedParams);
      return result.rows;
    });
  }

  /**
   * Executar query sem retornar resultados (equivalente a .run())
   * 
   * ATENÇÃO: Este método é assíncrono.
   */
  async run(...params) {
    return this.executeWithRetry(async () => {
      // Validar parâmetros - detectar undefined que pode causar erro de UUID
      const validatedParams = params.map((param, index) => {
        if (param === undefined) {
          console.error(`⚠️ Parâmetro ${index + 1} é undefined na query:`, this.sql);
          console.error('Params recebidos:', params);
          throw new Error(`Parâmetro ${index + 1} não pode ser undefined`);
        }
        return param;
      });
      
      const result = await this.pool.query(this.sql, validatedParams);
      return {
        changes: result.rowCount || 0,
        lastInsertRowid: null, // PostgreSQL usa RETURNING para obter ID
      };
    });
  }
}

/**
 * Obter instância do banco (PostgreSQL ou SQLite)
 * NOTA: Esta função não é mais usada - use initDatabaseWrapper() em db-wrapper.js
 */
export async function getDatabase() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'postgres' || dbType === 'postgresql') {
    if (!pool) {
      initPostgresPool();
    }
    return new PostgresDB(pool);
  }

  // Fallback para SQLite
  const Database = (await import('better-sqlite3')).default;
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const DB_PATH = process.env.DB_PATH || join(__dirname, '../database.sqlite');
  
  return new Database(DB_PATH);
}

export default {
  initPostgresPool,
  PostgresDB,
  getDatabase,
};

