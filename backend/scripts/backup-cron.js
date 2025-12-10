#!/usr/bin/env node

/**
 * Script de Backup Automático (para Cron)
 * 
 * Este script é otimizado para execução via cron.
 * Ele faz backup silencioso e envia notificações apenas em caso de erro.
 * 
 * Uso no cron:
 *   0 2 * * * cd /caminho/do/projeto/backend && node scripts/backup-cron.js >> /var/log/backup.log 2>&1
 * 
 * Isso executa backup diário às 2h da manhã.
 */

import { createFullBackup } from '../utils/backup.js';
import { createLogger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');
const UPLOADS_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 7; // Manter backups por 7 dias

// Logger silencioso (apenas erros)
const logger = createLogger();

async function main() {
  const startTime = Date.now();
  
  try {
    // Fazer backup completo
    const result = await createFullBackup(DB_PATH, UPLOADS_DIR);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.info(`✅ Backup automático concluído em ${duration}s`);
    logger.info(`   - Banco: ${result.database}`);
    if (result.uploads) {
      logger.info(`   - Uploads: ${result.uploads}`);
    }
    
    // Limpar backups antigos
    await cleanupOldBackups(BACKUP_RETENTION_DAYS);
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ ERRO CRÍTICO no backup automático:', error);
    logger.error('Stack:', error.stack);
    
    // Em produção, você pode enviar notificação (email, Slack, etc.)
    if (process.env.BACKUP_ERROR_NOTIFICATION) {
      // TODO: Implementar notificação de erro
      // Exemplo: enviar email, Slack webhook, etc.
    }
    
    process.exit(1);
  }
}

/**
 * Limpar backups antigos
 */
async function cleanupOldBackups(retentionDays) {
  try {
    const { readdir, stat, unlink } = await import('fs/promises');
    const { join } = await import('path');
    
    const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
    const files = await readdir(backupDir);
    
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.startsWith('backup-')) {
        const filePath = join(backupDir, file);
        const stats = await stat(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > retentionMs) {
          await unlink(filePath);
          deletedCount++;
        }
      }
    }
    
    if (deletedCount > 0) {
      logger.info(`🗑️  Removidos ${deletedCount} backup(s) antigo(s)`);
    }
  } catch (error) {
    // Não falhar o backup se a limpeza falhar
    logger.warn('⚠️  Erro ao limpar backups antigos:', error.message);
  }
}

main();

