/**
 * Utilitário de Backup do Banco de Dados
 * 
 * Este módulo fornece funções para fazer backup do banco de dados SQLite
 * e dos arquivos de upload.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createLogger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger();

/**
 * Criar backup do banco de dados SQLite
 * @param {string} dbPath - Caminho do banco de dados
 * @param {string} backupDir - Diretório onde salvar o backup
 * @returns {Promise<string>} - Caminho do arquivo de backup criado
 */
export async function backupDatabase(dbPath, backupDir = null) {
  try {
    // Definir diretório de backup
    if (!backupDir) {
      backupDir = path.join(__dirname, '../backups');
    }

    // Criar diretório se não existir
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Verificar se o banco existe
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Banco de dados não encontrado: ${dbPath}`);
    }

    // Nome do arquivo de backup com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `database-backup-${timestamp}.sqlite`;
    const backupPath = path.join(backupDir, backupFileName);

    // Copiar arquivo do banco
    fs.copyFileSync(dbPath, backupPath);

    // Obter informações do backup
    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    logger.info(`✅ Backup do banco de dados criado: ${backupPath} (${sizeMB} MB)`);

    // Limpar backups antigos (manter apenas os últimos 30 dias)
    await cleanupOldBackups(backupDir, 30);

    return backupPath;
  } catch (error) {
    logger.error('Erro ao criar backup do banco de dados:', error);
    throw error;
  }
}

/**
 * Criar backup dos arquivos de upload
 * @param {string} uploadsDir - Diretório de uploads
 * @param {string} backupDir - Diretório onde salvar o backup
 * @returns {Promise<string>} - Caminho do diretório de backup criado
 */
export async function backupUploads(uploadsDir, backupDir = null) {
  try {
    // Definir diretório de backup
    if (!backupDir) {
      backupDir = path.join(__dirname, '../backups/uploads');
    }

    // Criar diretório se não existir
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Verificar se o diretório de uploads existe
    if (!fs.existsSync(uploadsDir)) {
      logger.warn(`Diretório de uploads não encontrado: ${uploadsDir}`);
      return null;
    }

    // Nome do diretório de backup com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDirName = `uploads-backup-${timestamp}`;
    const backupPath = path.join(backupDir, backupDirName);

    // Criar diretório de backup
    fs.mkdirSync(backupPath, { recursive: true });

    // Copiar arquivos recursivamente
    await copyDirectory(uploadsDir, backupPath);

    logger.info(`✅ Backup dos uploads criado: ${backupPath}`);

    // Limpar backups antigos (manter apenas os últimos 7 dias)
    await cleanupOldBackups(backupDir, 7, true);

    return backupPath;
  } catch (error) {
    logger.error('Erro ao criar backup dos uploads:', error);
    throw error;
  }
}

/**
 * Criar backup completo (banco + uploads)
 * @param {string} dbPath - Caminho do banco de dados
 * @param {string} uploadsDir - Diretório de uploads
 * @returns {Promise<{database: string, uploads: string}>} - Caminhos dos backups criados
 */
export async function createFullBackup(dbPath, uploadsDir) {
  try {
    logger.info('🔄 Iniciando backup completo...');

    const databaseBackup = await backupDatabase(dbPath);
    const uploadsBackup = await backupUploads(uploadsDir);

    logger.info('✅ Backup completo criado com sucesso');

    return {
      database: databaseBackup,
      uploads: uploadsBackup
    };
  } catch (error) {
    logger.error('Erro ao criar backup completo:', error);
    throw error;
  }
}

/**
 * Limpar backups antigos
 * @param {string} backupDir - Diretório de backups
 * @param {number} daysToKeep - Número de dias para manter
 * @param {boolean} isDirectory - Se os backups são diretórios
 */
async function cleanupOldBackups(backupDir, daysToKeep, isDirectory = false) {
  try {
    if (!fs.existsSync(backupDir)) {
      return;
    }

    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Converter dias para ms

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);

      // Verificar se é um arquivo ou diretório conforme esperado
      if (isDirectory && !stats.isDirectory()) continue;
      if (!isDirectory && !stats.isFile()) continue;

      const age = now - stats.mtime.getTime();

      if (age > maxAge) {
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`🗑️  ${deletedCount} backup(s) antigo(s) removido(s)`);
    }
  } catch (error) {
    logger.error('Erro ao limpar backups antigos:', error);
  }
}

/**
 * Copiar diretório recursivamente
 * @param {string} src - Diretório origem
 * @param {string} dest - Diretório destino
 */
async function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      await copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Listar backups disponíveis
 * @param {string} backupDir - Diretório de backups
 * @returns {Array} - Lista de backups com informações
 */
export function listBackups(backupDir) {
  try {
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = fs.readdirSync(backupDir);
    const backups = [];

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);

      backups.push({
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      });
    }

    // Ordenar por data de criação (mais recente primeiro)
    backups.sort((a, b) => b.created - a.created);

    return backups;
  } catch (error) {
    logger.error('Erro ao listar backups:', error);
    return [];
  }
}

