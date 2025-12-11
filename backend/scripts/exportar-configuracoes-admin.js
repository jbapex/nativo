#!/usr/bin/env node

/**
 * Script para exportar todas as configurações do admin
 * Exporta: settings, categories, plans, cities (se configuradas pelo admin)
 * 
 * Uso:
 *   node backend/scripts/exportar-configuracoes-admin.js
 *   node backend/scripts/exportar-configuracoes-admin.js > configs-admin.json
 */

import { initDatabaseWrapper, isSQLite } from '../database/db-wrapper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportarConfiguracoes() {
  console.log('🔄 Iniciando exportação de configurações do admin...\n');
  
  const db = await initDatabaseWrapper();
  const usandoSQLite = isSQLite();
  
  console.log(`📊 Banco de dados: ${usandoSQLite ? 'SQLite' : 'PostgreSQL'}\n`);
  
  try {
    const configs = {
      export_date: new Date().toISOString(),
      database_type: usandoSQLite ? 'sqlite' : 'postgres',
      settings: {},
      categories: [],
      plans: [],
      cities: [],
      admin_users: []
    };
    
    // 1. Exportar Settings (configurações do admin)
    console.log('📝 Exportando configurações (settings)...');
    let settings;
    if (usandoSQLite) {
      settings = db.prepare('SELECT * FROM settings ORDER BY category, key').all();
    } else {
      const result = await db.query('SELECT * FROM settings ORDER BY category, key');
      settings = result.rows || result;
    }
    
    if (settings && settings.length > 0) {
      settings.forEach(setting => {
        configs.settings[setting.key] = {
          value: setting.value,
          category: setting.category,
          description: setting.description
        };
      });
      console.log(`  ✅ ${settings.length} configurações exportadas`);
    } else {
      console.log('  ℹ️  Nenhuma configuração encontrada');
    }
    
    // 2. Exportar Categories (categorias globais)
    console.log('\n📝 Exportando categorias...');
    let categories;
    if (usandoSQLite) {
      categories = db.prepare('SELECT * FROM categories WHERE store_id IS NULL ORDER BY order_index, name').all();
    } else {
      const result = await db.query('SELECT * FROM categories WHERE store_id IS NULL ORDER BY order_index, name');
      categories = result.rows || result;
    }
    
    if (categories && categories.length > 0) {
      configs.categories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        active: cat.active,
        order_index: cat.order_index
      }));
      console.log(`  ✅ ${categories.length} categorias exportadas`);
    } else {
      console.log('  ℹ️  Nenhuma categoria encontrada');
    }
    
    // 3. Exportar Plans (planos)
    console.log('\n📝 Exportando planos...');
    let plans;
    if (usandoSQLite) {
      plans = db.prepare('SELECT * FROM plans ORDER BY price').all();
    } else {
      const result = await db.query('SELECT * FROM plans ORDER BY price');
      plans = result.rows || result;
    }
    
    if (plans && plans.length > 0) {
      configs.plans = plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        product_limit: plan.product_limit,
        features: plan.features,
        active: plan.active
      }));
      console.log(`  ✅ ${plans.length} planos exportados`);
    } else {
      console.log('  ℹ️  Nenhum plano encontrado');
    }
    
    // 4. Exportar Cities (cidades - apenas as importadas/configuradas)
    console.log('\n📝 Exportando cidades...');
    let cities;
    if (usandoSQLite) {
      cities = db.prepare('SELECT * FROM cities WHERE is_imported = 0 ORDER BY state, name').all();
    } else {
      const result = await db.query('SELECT * FROM cities WHERE is_imported = false ORDER BY state, name');
      cities = result.rows || result;
    }
    
    if (cities && cities.length > 0) {
      configs.cities = cities.map(city => ({
        id: city.id,
        name: city.name,
        state: city.state,
        active: city.active
      }));
      console.log(`  ✅ ${cities.length} cidades exportadas`);
    } else {
      console.log('  ℹ️  Nenhuma cidade customizada encontrada');
    }
    
    // 5. Exportar Admin Users (apenas IDs e emails, sem senhas)
    console.log('\n📝 Exportando usuários admin...');
    let adminUsers;
    if (usandoSQLite) {
      adminUsers = db.prepare('SELECT id, email, full_name, role, status FROM users WHERE role = ?').all('admin');
    } else {
      const result = await db.query('SELECT id, email, full_name, role, status FROM users WHERE role = $1', ['admin']);
      adminUsers = result.rows || result;
    }
    
    if (adminUsers && adminUsers.length > 0) {
      configs.admin_users = adminUsers.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      }));
      console.log(`  ✅ ${adminUsers.length} usuários admin exportados (sem senhas)`);
    } else {
      console.log('  ℹ️  Nenhum usuário admin encontrado');
    }
    
    // Salvar arquivo JSON
    const outputFile = path.join(__dirname, '../../configs-admin-export.json');
    fs.writeFileSync(outputFile, JSON.stringify(configs, null, 2), 'utf8');
    
    console.log(`\n✅ Exportação concluída!`);
    console.log(`📄 Arquivo salvo em: ${outputFile}`);
    console.log(`\n📊 Resumo:`);
    console.log(`  - Configurações: ${Object.keys(configs.settings).length}`);
    console.log(`  - Categorias: ${configs.categories.length}`);
    console.log(`  - Planos: ${configs.plans.length}`);
    console.log(`  - Cidades: ${configs.cities.length}`);
    console.log(`  - Usuários Admin: ${configs.admin_users.length}`);
    
    // Também imprimir JSON no console (para redirecionamento)
    console.log('\n--- JSON ---');
    console.log(JSON.stringify(configs, null, 2));
    
  } catch (error) {
    console.error('\n❌ Erro ao exportar configurações:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar
exportarConfiguracoes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });

