#!/usr/bin/env node

/**
 * Script de setup inicial completo
 * Executa migrações e seed de dados
 * 
 * Uso:
 *   node backend/scripts/setup-inicial.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupInicial() {
  console.log('🚀 Iniciando setup completo do sistema...\n');
  
  try {
    // 1. Aplicar migrações
    console.log('📝 Passo 1/2: Aplicando migrações do banco de dados...');
    try {
      const { stdout, stderr } = await execAsync('node backend/scripts/aplicar-migracoes.js');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error('Erro ao aplicar migrações:', error.message);
      throw error;
    }
    
    console.log('\n');
    
    // 2. Executar seed inicial
    console.log('🌱 Passo 2/2: Populando banco com dados iniciais...');
    try {
      const { stdout, stderr } = await execAsync('node backend/scripts/seed-inicial.js');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error('Erro ao executar seed:', error.message);
      throw error;
    }
    
    console.log('\n✨ Setup inicial concluído com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('  1. Configure o arquivo .env com suas credenciais');
    console.log('  2. Crie um usuário admin (via interface ou script)');
    console.log('  3. Inicie o servidor: npm run dev');
    console.log('  4. Acesse http://localhost:3006 e faça login');
    
  } catch (error) {
    console.error('\n❌ Erro durante setup:', error);
    process.exit(1);
  }
}

// Executar
setupInicial();

