/**
 * Database Health Check Utility
 * Garante que o banco de dados está sempre acessível e funcionando
 */

import { db } from '../database/db.js';
import { isSQLite } from '../database/db-wrapper.js';

let healthCheckInterval = null;
let lastHealthCheck = null;
let isHealthy = true;
let consecutiveFailures = 0;
let lastFailureTime = null;

/**
 * Verificar saúde do banco de dados com retry
 */
export async function checkDatabaseHealth(maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Teste simples de conexão
      if (isSQLite()) {
        db.prepare('SELECT 1').get();
      } else {
        // Para PostgreSQL, verificar se tem método query
        if (typeof db.query === 'function') {
          await db.query('SELECT 1');
        } else {
          // Tentar método prepare se não tiver query
          await db.prepare('SELECT 1').get();
        }
      }
      
      lastHealthCheck = new Date();
      isHealthy = true;
      return { healthy: true, timestamp: lastHealthCheck };
    } catch (error) {
      lastError = error;
      
      const isConnectionError = 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' ||
        error.code === '57P01' ||
        error.code === '57P02' ||
        error.code === '57P03' ||
        error.message?.includes('Connection terminated') ||
        error.message?.includes('Connection lost');

      if (isConnectionError && attempt < maxRetries) {
        console.warn(`⚠️ Health check falhou (tentativa ${attempt}/${maxRetries}), tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // Se não for erro de conexão ou já tentou todas as vezes
      console.error('❌ Erro no health check do banco:', error.message);
      isHealthy = false;
      return { 
        healthy: false, 
        error: error.message,
        code: error.code,
        timestamp: new Date()
      };
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  isHealthy = false;
  return { 
    healthy: false, 
    error: lastError?.message || 'Falha ao conectar ao banco de dados',
    code: lastError?.code,
    timestamp: new Date()
  };
}

/**
 * Verificar se o banco está saudável
 */
export function isDatabaseHealthy() {
  return isHealthy;
}

/**
 * Obter último health check
 */
export function getLastHealthCheck() {
  return lastHealthCheck;
}

/**
 * Iniciar monitoramento periódico do banco
 */
export function startHealthCheckMonitoring(intervalMs = 30000) {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  // Verificar imediatamente
  checkDatabaseHealth().then(health => {
    if (!health.healthy) {
      console.warn('⚠️ Banco de dados não está saudável na inicialização');
    }
  });
  
  // Verificar periodicamente
  healthCheckInterval = setInterval(async () => {
    const health = await checkDatabaseHealth();
    
    if (!health.healthy) {
      consecutiveFailures++;
      lastFailureTime = new Date();
      
      if (consecutiveFailures >= 3) {
        console.error(`🚨 ALERTA: Banco de dados falhou ${consecutiveFailures} vezes consecutivas!`);
        console.error(`Última falha: ${lastFailureTime.toISOString()}`);
        console.error(`Erro: ${health.error}`);
      }
    } else {
      if (consecutiveFailures > 0) {
        console.log(`✅ Banco de dados recuperado após ${consecutiveFailures} falhas`);
        consecutiveFailures = 0;
        lastFailureTime = null;
      }
    }
  }, intervalMs);
  
  console.log(`✅ Monitoramento de saúde do banco iniciado (intervalo: ${intervalMs}ms)`);
}

/**
 * Parar monitoramento
 */
export function stopHealthCheckMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

/**
 * Garantir que o banco está acessível antes de executar uma operação
 */
export async function ensureDatabaseConnection(maxRetries = 3, retryDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const health = await checkDatabaseHealth();
      if (health.healthy) {
        return true;
      }
      
      if (i < maxRetries - 1) {
        console.warn(`⚠️ Tentativa ${i + 1} de conexão falhou, tentando novamente em ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1))); // Backoff exponencial
      }
    } catch (error) {
      if (i < maxRetries - 1) {
        console.warn(`⚠️ Erro na tentativa ${i + 1}, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
      } else {
        throw new Error(`Não foi possível conectar ao banco de dados após ${maxRetries} tentativas: ${error.message}`);
      }
    }
  }
  
  throw new Error('Banco de dados não está acessível');
}

/**
 * Obter estatísticas de saúde do banco
 */
export function getDbHealthStatus() {
  return {
    isHealthy,
    lastHealthCheck,
    consecutiveFailures,
    lastFailureTime,
    uptime: lastHealthCheck ? (Date.now() - lastHealthCheck.getTime()) / 1000 : null
  };
}

