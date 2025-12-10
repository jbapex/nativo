/**
 * Script para verificar e adicionar a coluna show_timer na tabela promotions
 */

import { initDatabase } from '../database/db.js';
import { isSQLite } from '../database/db-wrapper.js';

async function verificarShowTimer() {
  try {
    const db = await initDatabase();
    
    console.log('🔍 Verificando se a coluna show_timer existe...');
    
    if (isSQLite()) {
      // SQLite: verificar se a coluna existe
      try {
        const result = db.prepare("PRAGMA table_info(promotions)").all();
        const hasShowTimer = result.some(col => col.name === 'show_timer');
        
        if (!hasShowTimer) {
          console.log('⚠️ Coluna show_timer não existe. Adicionando...');
          db.prepare('ALTER TABLE promotions ADD COLUMN show_timer BOOLEAN DEFAULT 0').run();
          console.log('✅ Coluna show_timer adicionada com sucesso!');
        } else {
          console.log('✅ Coluna show_timer já existe!');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/adicionar coluna:', error);
        throw error;
      }
    } else {
      // PostgreSQL: verificar se a coluna existe
      try {
        const result = await db.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'promotions' AND column_name = 'show_timer'
        `);
        
        if (result.rows.length === 0) {
          console.log('⚠️ Coluna show_timer não existe. Adicionando...');
          await db.query(`
            ALTER TABLE promotions 
            ADD COLUMN show_timer BOOLEAN DEFAULT FALSE
          `);
          console.log('✅ Coluna show_timer adicionada com sucesso!');
        } else {
          console.log('✅ Coluna show_timer já existe!');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/adicionar coluna:', error);
        throw error;
      }
    }
    
    console.log('✅ Verificação concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

verificarShowTimer();

