#!/usr/bin/env node

/**
 * Script de Backup Manual
 * 
 * Uso:
 *   node scripts/backup.js [--full] [--database-only] [--uploads-only]
 * 
 * Opções:
 *   --full          Fazer backup completo (banco + uploads)
 *   --database-only Fazer backup apenas do banco de dados
 *   --uploads-only  Fazer backup apenas dos uploads
 */

import { backupDatabase, backupUploads, createFullBackup } from '../utils/backup.js';
import { createLogger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger();

// Configurações
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');
const UPLOADS_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

// Processar argumentos
const args = process.argv.slice(2);
const fullBackup = args.includes('--full');
const databaseOnly = args.includes('--database-only');
const uploadsOnly = args.includes('--uploads-only');

async function main() {
  try {
    logger.info('🔄 Iniciando processo de backup...');

    if (fullBackup || (!databaseOnly && !uploadsOnly)) {
      // Backup completo
      const result = await createFullBackup(DB_PATH, UPLOADS_DIR);
      logger.info('✅ Backup completo criado:');
      logger.info(`   - Banco: ${result.database}`);
      if (result.uploads) {
        logger.info(`   - Uploads: ${result.uploads}`);
      }
    } else if (databaseOnly) {
      // Backup apenas do banco
      const backupPath = await backupDatabase(DB_PATH);
      logger.info(`✅ Backup do banco criado: ${backupPath}`);
    } else if (uploadsOnly) {
      // Backup apenas dos uploads
      const backupPath = await backupUploads(UPLOADS_DIR);
      if (backupPath) {
        logger.info(`✅ Backup dos uploads criado: ${backupPath}`);
      }
    }

    logger.info('✅ Processo de backup concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao criar backup:', error);
    process.exit(1);
  }
}

main();

