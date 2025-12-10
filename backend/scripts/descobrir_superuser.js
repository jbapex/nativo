/**
 * Script para descobrir o superusuário do PostgreSQL
 * Execute: node backend/scripts/descobrir_superuser.js
 */

import pg from 'pg';
const { Pool } = pg;

// Tentar conectar com diferentes usuários comuns
const usuariosParaTestar = [
  'postgres',
  'josiasbonfimdefaria', // Nome do usuário do sistema
  process.env.USER, // Variável de ambiente do sistema
  'admin',
  'root'
];

async function descobrirSuperuser() {
  console.log('🔍 Tentando descobrir o superusuário do PostgreSQL...');
  console.log('');
  
  // Primeiro, tentar listar usuários usando o usuário localmart (se tiver permissão)
  try {
    const poolLocalmart = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5433,
      database: process.env.DB_NAME || 'local_mart',
      user: 'localmart',
      password: process.env.DB_PASSWORD || 'localmart123',
    });
    
    const client = await poolLocalmart.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          usename as username,
          usesuper as is_superuser,
          usecreatedb as can_create_db
        FROM pg_user
        WHERE usesuper = true
        ORDER BY usename
      `);
      
      if (result.rows.length > 0) {
        console.log('✅ Superusuários encontrados:');
        result.rows.forEach(row => {
          console.log(`   - ${row.username} (superusuário: ${row.is_superuser ? 'SIM' : 'NÃO'})`);
        });
        console.log('');
        console.log('💡 Use um desses usuários como SUPERUSER');
        client.release();
        await poolLocalmart.end();
        return;
      }
    } catch (e) {
      // Se não tiver permissão, continuar com outros métodos
    }
    
    client.release();
    await poolLocalmart.end();
  } catch (e) {
    // Continuar
  }
  
  // Tentar conectar com cada usuário comum
  console.log('🔍 Tentando conectar com usuários comuns...');
  console.log('');
  
  for (const usuario of usuariosParaTestar) {
    if (!usuario) continue;
    
    console.log(`   Tentando: ${usuario}...`);
    
    // Tentar sem senha primeiro (pode funcionar em algumas configurações)
    try {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5433,
        database: process.env.DB_NAME || 'local_mart',
        user: usuario,
        password: '', // Tentar sem senha
        connectionTimeoutMillis: 2000,
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT current_user, current_database()');
      
      console.log(`   ✅ Conectado como: ${result.rows[0].current_user}`);
      console.log(`   ✅ Banco: ${result.rows[0].current_database}`);
      
      // Verificar se é superusuário
      const superCheck = await client.query('SELECT current_setting(\'is_superuser\')');
      const isSuper = superCheck.rows[0].current_setting === 'on';
      
      if (isSuper) {
        console.log(`   ✅ É SUPERUSUÁRIO!`);
        console.log('');
        console.log('🎉 Use este comando:');
        console.log(`   SUPERUSER=${usuario} SUPERPASSWORD= node backend/scripts/criar_colunas_env.js`);
      } else {
        console.log(`   ⚠️  Não é superusuário`);
      }
      
      client.release();
      await pool.end();
      return;
      
    } catch (e) {
      // Tentar com senhas comuns
      const senhasComuns = ['', 'postgres', 'admin', 'root', '123456', usuario];
      
      for (const senha of senhasComuns) {
        try {
          const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5433,
            database: process.env.DB_NAME || 'local_mart',
            user: usuario,
            password: senha,
            connectionTimeoutMillis: 2000,
          });
          
          const client = await pool.connect();
          const result = await client.query('SELECT current_user');
          
          console.log(`   ✅ Conectado como: ${result.rows[0].current_user}`);
          
          // Verificar se é superusuário
          const superCheck = await client.query('SELECT current_setting(\'is_superuser\')');
          const isSuper = superCheck.rows[0].current_setting === 'on';
          
          if (isSuper) {
            console.log(`   ✅ É SUPERUSUÁRIO!`);
            console.log(`   ✅ Senha: ${senha || '(vazia)'}`);
            console.log('');
            console.log('🎉 Use este comando:');
            if (senha) {
              console.log(`   SUPERUSER=${usuario} SUPERPASSWORD=${senha} node backend/scripts/criar_colunas_env.js`);
            } else {
              console.log(`   SUPERUSER=${usuario} SUPERPASSWORD= node backend/scripts/criar_colunas_env.js`);
            }
          } else {
            console.log(`   ⚠️  Não é superusuário`);
          }
          
          client.release();
          await pool.end();
          return;
          
        } catch (e2) {
          // Continuar tentando
        }
      }
    }
  }
  
  console.log('');
  console.log('❌ Não foi possível descobrir automaticamente o superusuário.');
  console.log('');
  console.log('💡 Opções:');
  console.log('   1. Verifique no pgAdmin: Servidores → PostgreSQL → Propriedades');
  console.log('   2. Execute: psql -h localhost -p 5433 -U postgres -d local_mart -c "\\du"');
  console.log('   3. Tente manualmente com: SUPERUSER=postgres SUPERPASSWORD=sua_senha node backend/scripts/criar_colunas_env.js');
}

descobrirSuperuser().catch(console.error);

