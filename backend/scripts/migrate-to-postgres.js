#!/usr/bin/env node

/**
 * Script de Migração: SQLite → PostgreSQL
 * 
 * Migra dados do SQLite para PostgreSQL
 * 
 * Uso:
 *   node scripts/migrate-to-postgres.js
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações
const SQLITE_PATH = process.env.DB_PATH || join(__dirname, '../database.sqlite');
const POSTGRES_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'local_mart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

const { existsSync } = await import('fs');

console.log('🔄 Iniciando migração SQLite → PostgreSQL...\n');

if (!existsSync(SQLITE_PATH)) {
  console.error('❌ Arquivo SQLite não encontrado:', SQLITE_PATH);
  process.exit(1);
}

console.log('📦 Conectando ao SQLite...');
const sqliteDb = new Database(SQLITE_PATH);

const cartUserMap = new Map();
try {
  const carts = sqliteDb.prepare('SELECT id, user_id FROM cart').all();
  carts.forEach((cart) => {
    if (cart.id && cart.user_id) {
      cartUserMap.set(cart.id, cart.user_id);
    }
  });
} catch (error) {
  console.warn('⚠️  Não foi possível carregar tabela cart:', error.message);
}

console.log('🐘 Conectando ao PostgreSQL...');
const pgPool = new Pool(POSTGRES_CONFIG);

try {
  await pgPool.query('SELECT NOW()');
  console.log('✅ Conectado ao PostgreSQL\n');
} catch (error) {
  console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
  process.exit(1);
}

// Criar schema no PostgreSQL (se necessário)
console.log('📋 Garantindo schema no PostgreSQL...');
try {
  const schemaPath = join(__dirname, '../database/postgres-schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  const statements = schema.split(';').filter((s) => s.trim().length > 0);
  for (const statement of statements) {
    try {
      await pgPool.query(statement);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn('⚠️  Aviso ao executar statement:', err.message);
      }
    }
  }
  console.log('✅ Schema verificado\n');
} catch (error) {
  console.error('❌ Erro ao garantir schema:', error.message);
  process.exit(1);
}

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
  'cart_items',
  'user_favorites',
  'reviews',
  'notifications',
  'settings',
  'user_addresses',
  'payments',
  'refresh_tokens',
];

const tableConfigs = {
  users: { primaryKey: 'id' },
  stores: {
    references: { user_id: 'users', city_id: 'cities', category_id: 'categories' },
  },
  subscriptions: { references: { user_id: 'users', store_id: 'stores' } },
  products: { references: { store_id: 'stores', category_id: 'categories' } },
  store_customizations: { references: { store_id: 'stores' } },
  promotions: {
    references: { store_id: 'stores' },
    columnOverrides: {
      name: { source: 'title' },
      type: { source: 'discount_type' },
      value: { source: 'discount_value' },
      product_ids: {
        transform: (row) => (row.product_id ? JSON.stringify([row.product_id]) : null),
      },
    },
  },
  orders: {
    references: { user_id: 'users', store_id: 'stores' },
  },
  order_items: { references: { order_id: 'orders', product_id: 'products' } },
  order_history: { references: { order_id: 'orders', changed_by: 'users' } },
  cart_items: {
    references: { user_id: 'users', product_id: 'products' },
    columnOverrides: {
      user_id: {
        source: 'cart_id',
        notNull: true,
        transform: (row) => cartUserMap.get(row.cart_id) || null,
      },
    },
  },
  user_favorites: { references: { user_id: 'users', product_id: 'products' } },
  reviews: { references: { product_id: 'products', user_id: 'users' } },
  notifications: { references: { user_id: 'users' } },
  user_addresses: {
    references: { user_id: 'users' },
    columnOverrides: {
      label: {
        source: 'label',
        transform: (row, value) => (value && value.trim() ? value : 'Principal'),
      },
    },
  },
  payments: { references: { order_id: 'orders' } },
  refresh_tokens: { references: { user_id: 'users' } },
};

const idRemap = new Map(); // table -> Map(oldId -> newId)

const rememberId = (table, oldId, newId) => {
  if (!idRemap.has(table)) {
    idRemap.set(table, new Map());
  }
  idRemap.get(table).set(oldId, newId);
};

const getMappedId = (table, value) => {
  if (!value) return value;
  const tableMap = idRemap.get(table);
  if (tableMap && tableMap.has(value)) {
    return tableMap.get(value);
  }
  return value;
};

const isValidUUID = (value) => {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

const normalizeValue = (value, pgType) => {
  if (value === undefined || value === null) return null;
  const type = (pgType || '').toLowerCase();

  if (type.includes('boolean')) {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0' || normalized === '') return false;
    }
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'boolean') return value;
    return Boolean(value);
  }

  if (type.includes('int')) {
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === '') return null;
      if (normalized === 'true') return 1;
      if (normalized === 'false') return 0;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : Math.trunc(num);
  }

  if (type.includes('numeric') || type.includes('decimal') || type.includes('double') || type.includes('real')) {
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === '') return null;
      if (normalized === 'true') return 1;
      if (normalized === 'false') return 0;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  if (type.includes('timestamp')) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return new Date(Number(value)).toISOString();
    }
  }

  return value;
};

console.log('📊 Migrando dados...\n');

for (const table of tables) {
  try {
    const tableInfo = sqliteDb.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(table);

    if (!tableInfo) {
      console.log(`⏭️  Tabela ${table} não existe no SQLite, pulando...`);
      continue;
    }

    const count = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    const total = count?.count || 0;

    if (total === 0) {
      console.log(`⏭️  Tabela ${table} está vazia, pulando...`);
      continue;
    }

    const sqliteColumns = sqliteDb.prepare(`PRAGMA table_info(${table});`).all();
    const pgColumnsResult = await pgPool.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      [table]
    );
    const pgColumns = pgColumnsResult.rows;

    if (!pgColumns.length) {
      console.warn(`⚠️  Tabela ${table} não existe no PostgreSQL, pulando...`);
      continue;
    }

    const columnInfoMap = new Map();
    sqliteColumns.forEach((col) => {
      const pgCol = pgColumns.find((p) => p.column_name === col.name);
      if (!pgCol) return;
      columnInfoMap.set(col.name, {
        name: col.name,
        source: col.name,
        sqliteType: col.type || '',
        pgType: pgCol.data_type,
        isPrimaryKey: col.pk === 1,
        notNull: col.notnull === 1,
        defaultValue: col.dflt_value,
      });
    });

    const config = tableConfigs[table] || {};

    if (config.columnOverrides) {
      for (const [columnName, override] of Object.entries(config.columnOverrides)) {
        const pgCol = pgColumns.find((p) => p.column_name === columnName);
        if (!pgCol) continue;
        columnInfoMap.set(columnName, {
          name: columnName,
          source: override.source || columnName,
          sqliteType: '',
          pgType: pgCol.data_type,
          isPrimaryKey: override.primaryKey || false,
          notNull: override.notNull ?? (pgCol.is_nullable === 'NO'),
          defaultValue: override.defaultValue ?? null,
          transform: override.transform,
        });
      }
    }

    const columnInfos = Array.from(columnInfoMap.values());

    if (!columnInfos.length) {
      console.warn(`⚠️  Nenhuma coluna em comum entre SQLite e PostgreSQL para ${table}, pulando...`);
      continue;
    }

    const columnNamesPg = columnInfos.map((c) => `"${c.name}"`).join(', ');
    const placeholders = columnInfos.map((_, idx) => `$${idx + 1}`).join(', ');
    const selectColumns = Array.from(
      new Set(
        columnInfos
          .map((info) => info.source)
          .filter((source) => source && sqliteColumns.some((col) => col.name === source))
      )
    );

    const selectStmt =
      selectColumns.length > 0 ? `SELECT ${selectColumns.join(', ')} FROM ${table}` : null;
    const rows = selectStmt ? sqliteDb.prepare(selectStmt).all() : sqliteDb.prepare(`SELECT * FROM ${table}`).all();

    console.log(`📦 Migrando ${table} (${rows.length} registros)...`);

    const insertQuery = `
      INSERT INTO ${table} (${columnNamesPg})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    let inserted = 0;

    for (const row of rows) {
      let skipRow = false;
      const values = [];

      for (const columnInfo of columnInfos) {
        const { name, pgType, source, transform } = columnInfo;
        let value = source ? row[source] : row[name];

        if (typeof transform === 'function') {
          value = transform(row, value);
        }

        if (config.references && config.references[name]) {
          if (value !== null && value !== undefined && value !== '') {
            value = getMappedId(config.references[name], value);
            if (value && !isValidUUID(value)) {
              console.warn(`   ⚠️  Valor inválido em ${table}.${name}: ${value}. Registro pulado.`);
              skipRow = true;
              break;
            }
            if (!value) {
              skipRow = true;
              break;
            }
          }
        }

        if (config.primaryKey && columnInfo.isPrimaryKey && name === config.primaryKey) {
          if (!isValidUUID(value)) {
            const newId = randomUUID();
            rememberId(table, value, newId);
            value = newId;
          } else {
            rememberId(table, value, value);
          }
        }

        value = normalizeValue(value, pgType);

         if ((value === null || value === undefined || value === '') && columnInfo.notNull) {
          console.warn(`   ⚠️  Valor obrigatório ausente em ${table}.${name}. Registro pulado.`);
          skipRow = true;
          break;
        }

        values.push(value);
      }

      if (skipRow) continue;

      try {
        await pgPool.query(insertQuery, values);
        inserted++;
      } catch (err) {
        if (!err.message.includes('duplicate key')) {
          console.warn(`   ⚠️  Erro ao inserir registro:`, err.message);
        }
      }
    }

    console.log(`   ✅ ${inserted}/${rows.length} registros migrados`);
  } catch (error) {
    console.error(`   ❌ Erro ao migrar ${table}:`, error.message);
  }
}

console.log('\n✅ Migração concluída!');
console.log('\n📋 Próximos passos:');
console.log('   1. Verifique os dados no PostgreSQL');
console.log('   2. Configure DB_TYPE=postgres no .env');
console.log('   3. Reinicie o servidor');

sqliteDb.close();
await pgPool.end();

process.exit(0);

