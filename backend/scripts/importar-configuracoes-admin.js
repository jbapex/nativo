#!/usr/bin/env node

/**
 * Script para importar configurações do admin na VPS
 * Importa: settings, categories, plans, cities, admin_users
 * 
 * Uso:
 *   node backend/scripts/importar-configuracoes-admin.js configs-admin-export.json
 */

import { initDatabaseWrapper, isSQLite } from '../database/db-wrapper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importarConfiguracoes(arquivoConfig) {
  console.log('🔄 Iniciando importação de configurações do admin...\n');
  
  // Ler arquivo JSON
  if (!fs.existsSync(arquivoConfig)) {
    console.error(`❌ Arquivo não encontrado: ${arquivoConfig}`);
    process.exit(1);
  }
  
  const configs = JSON.parse(fs.readFileSync(arquivoConfig, 'utf8'));
  console.log(`📄 Arquivo carregado: ${arquivoConfig}`);
  console.log(`📅 Data de exportação: ${configs.export_date || 'N/A'}\n`);
  
  const db = await initDatabaseWrapper();
  const usandoSQLite = isSQLite();
  
  console.log(`📊 Banco de dados: ${usandoSQLite ? 'SQLite' : 'PostgreSQL'}\n`);
  
  try {
    // 1. Importar Settings
    console.log('📝 Importando configurações (settings)...');
    let importedSettings = 0;
    let updatedSettings = 0;
    
    for (const [key, data] of Object.entries(configs.settings || {})) {
      let existing;
      if (usandoSQLite) {
        existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
      } else {
        const result = await db.query('SELECT * FROM settings WHERE key = $1', [key]);
        existing = result.rows?.[0] || result[0];
      }
      
      if (existing) {
        // Atualizar
        if (usandoSQLite) {
          db.prepare(`
            UPDATE settings 
            SET value = ?, category = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE key = ?
          `).run(
            data.value || '',
            data.category || 'general',
            data.description || '',
            key
          );
        } else {
          await db.query(`
            UPDATE settings 
            SET value = $1, category = $2, description = $3, updated_at = CURRENT_TIMESTAMP
            WHERE key = $4
          `, [data.value || '', data.category || 'general', data.description || '', key]);
        }
        updatedSettings++;
      } else {
        // Criar
        const id = uuidv4();
        if (usandoSQLite) {
          db.prepare(`
            INSERT INTO settings (id, key, value, category, description)
            VALUES (?, ?, ?, ?, ?)
          `).run(id, key, data.value || '', data.category || 'general', data.description || '');
        } else {
          await db.query(`
            INSERT INTO settings (id, key, value, category, description)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, key, data.value || '', data.category || 'general', data.description || '']);
        }
        importedSettings++;
      }
    }
    console.log(`  ✅ ${importedSettings} novas configurações, ${updatedSettings} atualizadas`);
    
    // 2. Importar Categories
    console.log('\n📝 Importando categorias...');
    let importedCategories = 0;
    let updatedCategories = 0;
    
    for (const category of configs.categories || []) {
      let existing;
      if (usandoSQLite) {
        existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(category.id);
      } else {
        const result = await db.query('SELECT * FROM categories WHERE id = $1', [category.id]);
        existing = result.rows?.[0] || result[0];
      }
      
      if (existing) {
        // Atualizar
        if (usandoSQLite) {
          db.prepare(`
            UPDATE categories 
            SET name = ?, slug = ?, description = ?, icon = ?, active = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(
            category.name,
            category.slug,
            category.description,
            category.icon,
            category.active,
            category.order_index,
            category.id
          );
        } else {
          await db.query(`
            UPDATE categories 
            SET name = $1, slug = $2, description = $3, icon = $4, active = $5, order_index = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
          `, [category.name, category.slug, category.description, category.icon, category.active, category.order_index, category.id]);
        }
        updatedCategories++;
      } else {
        // Criar (manter ID original)
        if (usandoSQLite) {
          db.prepare(`
            INSERT INTO categories (id, name, slug, description, icon, active, order_index, store_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
          `).run(
            category.id,
            category.name,
            category.slug,
            category.description,
            category.icon,
            category.active,
            category.order_index
          );
        } else {
          await db.query(`
            INSERT INTO categories (id, name, slug, description, icon, active, order_index, store_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
          `, [category.id, category.name, category.slug, category.description, category.icon, category.active, category.order_index]);
        }
        importedCategories++;
      }
    }
    console.log(`  ✅ ${importedCategories} novas categorias, ${updatedCategories} atualizadas`);
    
    // 3. Importar Plans
    console.log('\n📝 Importando planos...');
    let importedPlans = 0;
    let updatedPlans = 0;
    
    for (const plan of configs.plans || []) {
      let existing;
      if (usandoSQLite) {
        existing = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan.id);
      } else {
        const result = await db.query('SELECT * FROM plans WHERE id = $1', [plan.id]);
        existing = result.rows?.[0] || result[0];
      }
      
      if (existing) {
        // Atualizar
        if (usandoSQLite) {
          db.prepare(`
            UPDATE plans 
            SET name = ?, slug = ?, price = ?, product_limit = ?, features = ?, active = ?
            WHERE id = ?
          `).run(
            plan.name,
            plan.slug,
            plan.price,
            plan.product_limit,
            plan.features,
            plan.active,
            plan.id
          );
        } else {
          await db.query(`
            UPDATE plans 
            SET name = $1, slug = $2, price = $3, product_limit = $4, features = $5, active = $6
            WHERE id = $7
          `, [plan.name, plan.slug, plan.price, plan.product_limit, plan.features, plan.active, plan.id]);
        }
        updatedPlans++;
      } else {
        // Criar (manter ID original)
        if (usandoSQLite) {
          db.prepare(`
            INSERT INTO plans (id, name, slug, price, product_limit, features, active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            plan.id,
            plan.name,
            plan.slug,
            plan.price,
            plan.product_limit,
            plan.features,
            plan.active
          );
        } else {
          await db.query(`
            INSERT INTO plans (id, name, slug, price, product_limit, features, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [plan.id, plan.name, plan.slug, plan.price, plan.product_limit, plan.features, plan.active]);
        }
        importedPlans++;
      }
    }
    console.log(`  ✅ ${importedPlans} novos planos, ${updatedPlans} atualizados`);
    
    // 4. Importar Cities (apenas criar novas, não atualizar existentes)
    console.log('\n📝 Importando cidades...');
    let importedCities = 0;
    let skippedCities = 0;
    
    for (const city of configs.cities || []) {
      let existing;
      if (usandoSQLite) {
        existing = db.prepare('SELECT * FROM cities WHERE id = ?').get(city.id);
      } else {
        const result = await db.query('SELECT * FROM cities WHERE id = $1', [city.id]);
        existing = result.rows?.[0] || result[0];
      }
      
      if (!existing) {
        // Criar apenas se não existir
        if (usandoSQLite) {
          db.prepare(`
            INSERT INTO cities (id, name, state, active, is_imported)
            VALUES (?, ?, ?, ?, 0)
          `).run(city.id, city.name, city.state, city.active);
        } else {
          await db.query(`
            INSERT INTO cities (id, name, state, active, is_imported)
            VALUES ($1, $2, $3, $4, false)
          `, [city.id, city.name, city.state, city.active]);
        }
        importedCities++;
      } else {
        skippedCities++;
      }
    }
    console.log(`  ✅ ${importedCities} novas cidades, ${skippedCities} já existentes (puladas)`);
    
    // 5. Admin Users - apenas informar (não importar senhas por segurança)
    console.log('\n📝 Verificando usuários admin...');
    console.log(`  ℹ️  ${configs.admin_users?.length || 0} usuários admin no arquivo`);
    console.log(`  ⚠️  Usuários admin não são importados automaticamente por segurança`);
    console.log(`  💡 Crie os usuários admin manualmente na VPS se necessário`);
    
    console.log(`\n✅ Importação concluída!`);
    console.log(`\n📊 Resumo:`);
    console.log(`  - Configurações: ${importedSettings} novas, ${updatedSettings} atualizadas`);
    console.log(`  - Categorias: ${importedCategories} novas, ${updatedCategories} atualizadas`);
    console.log(`  - Planos: ${importedPlans} novos, ${updatedPlans} atualizados`);
    console.log(`  - Cidades: ${importedCities} novas`);
    
  } catch (error) {
    console.error('\n❌ Erro ao importar configurações:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Verificar argumentos
const arquivoConfig = process.argv[2] || 'configs-admin-export.json';

if (!fs.existsSync(arquivoConfig)) {
  console.error(`❌ Arquivo não encontrado: ${arquivoConfig}`);
  console.error(`\nUso: node backend/scripts/importar-configuracoes-admin.js <arquivo.json>`);
  process.exit(1);
}

// Executar
importarConfiguracoes(arquivoConfig)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });

