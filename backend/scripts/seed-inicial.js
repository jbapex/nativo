#!/usr/bin/env node

/**
 * Script para popular o banco de dados com dados iniciais
 * Executa automaticamente ao instalar o sistema
 * 
 * Uso:
 *   node backend/scripts/seed-inicial.js
 */

import { initDatabaseWrapper, isSQLite } from '../database/db-wrapper.js';
import { v4 as uuidv4 } from 'uuid';

async function seedInicial() {
  console.log('🌱 Iniciando seed de dados iniciais...\n');
  
  const db = await initDatabaseWrapper();
  const usandoSQLite = isSQLite();
  
  console.log(`📊 Banco de dados: ${usandoSQLite ? 'SQLite' : 'PostgreSQL'}\n`);
  
  try {
    // ========================================================================
    // 1. PLANOS DE ASSINATURA
    // ========================================================================
    console.log('📝 Criando planos de assinatura...');
    
    const planos = [
      {
        id: uuidv4(),
        name: 'Gratuito',
        slug: 'gratuito',
        price: 0.00,
        product_limit: 10,
        features: JSON.stringify([
          'Até 10 produtos',
          'Loja online básica',
          'Suporte por email'
        ]),
        active: true
      },
      {
        id: uuidv4(),
        name: 'Básico',
        slug: 'basico',
        price: 29.90,
        product_limit: 50,
        features: JSON.stringify([
          'Até 50 produtos',
          'Loja online completa',
          'Promoções ilimitadas',
          'Suporte prioritário',
          'Relatórios básicos'
        ]),
        active: true
      },
      {
        id: uuidv4(),
        name: 'Profissional',
        slug: 'profissional',
        price: 79.90,
        product_limit: 200,
        features: JSON.stringify([
          'Até 200 produtos',
          'Loja online premium',
          'Promoções ilimitadas',
          'Checkout integrado',
          'Relatórios avançados',
          'Suporte 24/7',
          'Personalização completa'
        ]),
        active: true
      },
      {
        id: uuidv4(),
        name: 'Empresarial',
        slug: 'empresarial',
        price: 199.90,
        product_limit: null, // Ilimitado
        features: JSON.stringify([
          'Produtos ilimitados',
          'Loja online premium',
          'Checkout integrado',
          'Múltiplas formas de pagamento',
          'Relatórios avançados',
          'API personalizada',
          'Suporte dedicado',
          'Personalização completa',
          'White label'
        ]),
        active: true
      }
    ];
    
    let planosCriados = 0;
    for (const plano of planos) {
      // Verificar se já existe
      let existing;
      if (usandoSQLite) {
        existing = db.prepare('SELECT * FROM plans WHERE slug = ?').get(plano.slug);
      } else {
        const result = await db.query('SELECT * FROM plans WHERE slug = $1', [plano.slug]);
        existing = result.rows?.[0] || result[0];
      }
      
      if (!existing) {
        if (usandoSQLite) {
          db.prepare(`
            INSERT INTO plans (id, name, slug, price, product_limit, features, active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            plano.id,
            plano.name,
            plano.slug,
            plano.price,
            plano.product_limit,
            plano.features,
            plano.active ? 1 : 0
          );
        } else {
          await db.query(`
            INSERT INTO plans (id, name, slug, price, product_limit, features, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [plano.id, plano.name, plano.slug, plano.price, plano.product_limit, plano.features, plano.active]);
        }
        planosCriados++;
        console.log(`  ✅ Plano criado: ${plano.name}`);
      } else {
        console.log(`  ℹ️  Plano já existe: ${plano.name}`);
      }
    }
    console.log(`✅ ${planosCriados} planos criados\n`);
    
    // ========================================================================
    // 2. CONFIGURAÇÕES PADRÃO DO SISTEMA
    // ========================================================================
    console.log('📝 Criando configurações padrão...');
    
    const configuracoes = [
      // Geral
      { key: 'siteName', value: 'Nativo', category: 'general', description: 'Nome do site' },
      { key: 'siteDescription', value: 'Marketplace local para conectar lojas e clientes', category: 'general', description: 'Descrição do site' },
      { key: 'contactEmail', value: 'contato@nativo.com', category: 'general', description: 'Email de contato' },
      { key: 'maintenanceMode', value: 'false', category: 'general', description: 'Modo de manutenção' },
      { key: 'maintenanceMessage', value: 'Estamos realizando manutenção no momento. Por favor, volte em breve.', category: 'general', description: 'Mensagem de manutenção' },
      { key: 'siteActive', value: 'true', category: 'general', description: 'Site ativo' },
      
      // Usuários
      { key: 'allowRegistration', value: 'true', category: 'users', description: 'Permitir registro de novos usuários' },
      { key: 'requireEmailVerification', value: 'false', category: 'users', description: 'Exigir verificação de email' },
      { key: 'defaultUserRole', value: 'customer', category: 'users', description: 'Papel padrão do usuário' },
      { key: 'allowSocialLogin', value: 'true', category: 'users', description: 'Permitir login social' },
      
      // Segurança
      { key: 'sessionTimeout', value: '60', category: 'security', description: 'Timeout de sessão (minutos)' },
      { key: 'passwordMinLength', value: '8', category: 'security', description: 'Tamanho mínimo da senha' },
      { key: 'passwordRequireSpecialChars', value: 'true', category: 'security', description: 'Exigir caracteres especiais na senha' },
      { key: 'twoFactorAuth', value: 'false', category: 'security', description: 'Autenticação de dois fatores' },
      
      // Integrações
      { key: 'googleMapsApiKey', value: '', category: 'integrations', description: 'Chave da API do Google Maps' },
      { key: 'enableWhatsapp', value: 'true', category: 'integrations', description: 'Habilitar WhatsApp' },
      { key: 'enableFacebookLogin', value: 'false', category: 'integrations', description: 'Habilitar login com Facebook' },
      { key: 'enableGoogleLogin', value: 'false', category: 'integrations', description: 'Habilitar login com Google' },
      { key: 'facebookPixelId', value: '', category: 'integrations', description: 'ID do Facebook Pixel' },
      
      // Cobrança
      { key: 'currency', value: 'BRL', category: 'billing', description: 'Moeda padrão' },
      { key: 'taxRate', value: '0', category: 'billing', description: 'Taxa de imposto (%)' },
      { key: 'paymentGateway', value: 'mercadopago', category: 'billing', description: 'Gateway de pagamento' },
      
      // Cadastro de Loja
      { key: 'store_signup_title', value: 'Cadastre sua Loja', category: 'storeSignup', description: 'Título da página de cadastro' },
      { key: 'store_signup_subtitle', value: 'Junte-se ao nosso marketplace e alcance mais clientes', category: 'storeSignup', description: 'Subtítulo da página de cadastro' },
      { key: 'store_signup_info', value: 'Cadastre sua loja gratuitamente e comece a vender online hoje mesmo!', category: 'storeSignup', description: 'Informações da página de cadastro' },
      { key: 'store_signup_form_title', value: 'Preencha os dados da sua loja', category: 'storeSignup', description: 'Título do formulário' },
      { key: 'store_signup_form_description', value: 'Todos os campos são obrigatórios', category: 'storeSignup', description: 'Descrição do formulário' },
      
      // Cidades
      { key: 'cities_use_all_brazil', value: 'true', category: 'cities', description: 'Usar todas as cidades do Brasil ou apenas as adicionadas manualmente' },
      
      // Aparência
      { key: 'logo', value: '', category: 'appearance', description: 'Logo do site' },
      { key: 'favicon', value: '', category: 'appearance', description: 'Favicon do site' },
      { key: 'primaryColor', value: '#2563eb', category: 'appearance', description: 'Cor primária' },
      { key: 'secondaryColor', value: '#06b6d4', category: 'appearance', description: 'Cor secundária' },
      { key: 'accentColor', value: '#10b981', category: 'appearance', description: 'Cor de destaque' },
      { key: 'backgroundColor', value: '#ffffff', category: 'appearance', description: 'Cor de fundo' },
      { key: 'textColor', value: '#1f2937', category: 'appearance', description: 'Cor do texto' },
      { key: 'headerColor', value: '#ffffff', category: 'appearance', description: 'Cor do cabeçalho' },
      { key: 'footerColor', value: '#f9fafb', category: 'appearance', description: 'Cor do rodapé' },
    ];
    
    let configsCriadas = 0;
    for (const config of configuracoes) {
      let existing;
      if (usandoSQLite) {
        existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(config.key);
      } else {
        const result = await db.query('SELECT * FROM settings WHERE key = $1', [config.key]);
        existing = result.rows?.[0] || result[0];
      }
      
      if (!existing) {
        const id = uuidv4();
        if (usandoSQLite) {
          db.prepare(`
            INSERT INTO settings (id, key, value, category, description)
            VALUES (?, ?, ?, ?, ?)
          `).run(id, config.key, config.value, config.category, config.description);
        } else {
          await db.query(`
            INSERT INTO settings (id, key, value, category, description)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, config.key, config.value, config.category, config.description]);
        }
        configsCriadas++;
      }
    }
    console.log(`✅ ${configsCriadas} configurações criadas\n`);
    
    // ========================================================================
    // 3. CATEGORIAS PADRÃO
    // ========================================================================
    console.log('📝 Criando categorias padrão...');
    
    const categorias = [
      { name: 'Alimentos e Bebidas', slug: 'alimentos-e-bebidas', icon: '🍔', order: 1 },
      { name: 'Roupas e Acessórios', slug: 'roupas-e-acessorios', icon: '👕', order: 2 },
      { name: 'Eletrônicos', slug: 'eletronicos', icon: '📱', order: 3 },
      { name: 'Casa e Decoração', slug: 'casa-e-decoracao', icon: '🏠', order: 4 },
      { name: 'Beleza e Cuidados', slug: 'beleza-e-cuidados', icon: '💄', order: 5 },
      { name: 'Esportes e Lazer', slug: 'esportes-e-lazer', icon: '⚽', order: 6 },
      { name: 'Livros e Mídia', slug: 'livros-e-midia', icon: '📚', order: 7 },
      { name: 'Brinquedos e Jogos', slug: 'brinquedos-e-jogos', icon: '🎮', order: 8 },
      { name: 'Automotivo', slug: 'automotivo', icon: '🚗', order: 9 },
      { name: 'Outros', slug: 'outros', icon: '📦', order: 10 },
    ];
    
    let categoriasCriadas = 0;
    for (const cat of categorias) {
      let existing;
      if (usandoSQLite) {
        existing = db.prepare('SELECT * FROM categories WHERE slug = ? AND store_id IS NULL').get(cat.slug);
      } else {
        const result = await db.query('SELECT * FROM categories WHERE slug = $1 AND store_id IS NULL', [cat.slug]);
        existing = result.rows?.[0] || result[0];
      }
      
      if (!existing) {
        const id = uuidv4();
        if (usandoSQLite) {
          db.prepare(`
            INSERT INTO categories (id, name, slug, description, icon, active, order_index, store_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
          `).run(id, cat.name, cat.slug, '', cat.icon, 1, cat.order);
        } else {
          await db.query(`
            INSERT INTO categories (id, name, slug, description, icon, active, order_index, store_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
          `, [id, cat.name, cat.slug, '', cat.icon, true, cat.order]);
        }
        categoriasCriadas++;
        console.log(`  ✅ Categoria criada: ${cat.name}`);
      }
    }
    console.log(`✅ ${categoriasCriadas} categorias criadas\n`);
    
    console.log('✨ Seed inicial concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`  ✅ ${planosCriados} planos criados`);
    console.log(`  ✅ ${configsCriadas} configurações criadas`);
    console.log(`  ✅ ${categoriasCriadas} categorias criadas`);
    console.log('\n💡 Dica: As cidades do Brasil podem ser importadas separadamente se necessário.');
    
  } catch (error) {
    console.error('\n❌ Erro ao executar seed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar
seedInicial()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });

