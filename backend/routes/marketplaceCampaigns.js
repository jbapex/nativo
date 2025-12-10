import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { ensureDatabaseConnection } from '../utils/dbHealth.js';

const router = express.Router();

// Listar campanhas ativas (público)
router.get('/active', optionalAuth, async (req, res) => {
  try {
    // Garantir conexão com o banco
    await ensureDatabaseConnection();
    const { isSQLite } = await import('../database/db-wrapper.js');
    const now = new Date().toISOString();
    const activeValue = isSQLite() ? 1 : true;
    
    // Verificar se a tabela existe
    try {
      await db.prepare('SELECT 1 FROM marketplace_campaigns LIMIT 1').get();
    } catch (tableError) {
      console.warn('⚠️ Tabela marketplace_campaigns não existe:', tableError.message);
      return res.json([]);
    }
    
    console.log('🔍 Buscando campanhas ativas - now:', now, 'activeValue:', activeValue);
    
    // Verificar se a coluna banner_page_image existe
    let hasBannerPageImage = false;
    try {
      await db.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
      hasBannerPageImage = true;
    } catch (colError) {
      console.warn('⚠️ Coluna banner_page_image não existe ainda:', colError.message);
    }
    
    const campaigns = await db.prepare(`
      SELECT * FROM marketplace_campaigns
      WHERE active = ?
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY featured DESC, start_date DESC
    `).all(activeValue, now, now);
    
    console.log(`✅ ${campaigns.length} campanha(s) ativa(s) encontrada(s)`);
    
    // Buscar estatísticas para cada campanha
    const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
      try {
        // Verificar se a tabela campaign_participations existe antes de consultar
        let stats = { participant_stores: 0, total_products: 0 };
        try {
          await db.prepare('SELECT 1 FROM campaign_participations LIMIT 1').get();
          stats = await db.prepare(`
            SELECT 
              COUNT(DISTINCT store_id) as participant_stores,
              COUNT(id) as total_products
            FROM campaign_participations
            WHERE campaign_id = ? AND status = 'approved'
          `).get(campaign.id);
        } catch (statsError) {
          // Se a tabela não existir ou houver erro, usar valores padrão
          console.warn(`Erro ao buscar stats da campanha ${campaign.id}:`, statsError.message);
          stats = { participant_stores: 0, total_products: 0 };
        }
        
        return {
          ...campaign,
          active: campaign.active === 1 || campaign.active === true,
          featured: campaign.featured === 1 || campaign.featured === true,
          requires_approval: campaign.requires_approval === 1 || campaign.requires_approval === true,
          min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
          allowed_categories: campaign.allowed_categories ? (() => {
            try {
              return JSON.parse(campaign.allowed_categories);
            } catch {
              return null;
            }
          })() : null,
          participant_stores: stats?.participant_stores || 0,
          total_products: stats?.total_products || 0
        };
      } catch (error) {
        console.error(`Erro ao processar campanha ${campaign.id}:`, error);
        return {
          ...campaign,
          active: campaign.active === 1 || campaign.active === true,
          featured: campaign.featured === 1 || campaign.featured === true,
          requires_approval: campaign.requires_approval === 1 || campaign.requires_approval === true,
          min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
          allowed_categories: null,
          participant_stores: 0,
          total_products: 0
        };
      }
    }));
    
    res.json(campaignsWithStats);
  } catch (error) {
    console.error('Erro ao buscar campanhas ativas:', error);
    res.status(500).json({ error: 'Erro ao buscar campanhas ativas', details: error.message });
  }
});

// Listar todas as campanhas (admin apenas)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Garantir conexão com o banco
    await ensureDatabaseConnection();
    
    console.log('📋 Listando campanhas - Usuário:', req.user?.id, 'Role:', req.user?.role);
    
    // Primeiro, verificar se a tabela existe
    try {
      await db.prepare('SELECT 1 FROM marketplace_campaigns LIMIT 1').get();
      console.log('✅ Tabela marketplace_campaigns existe');
    } catch (tableError) {
      console.error('❌ Tabela marketplace_campaigns não existe:', tableError.message);
      return res.json([]); // Retornar array vazio se tabela não existir
    }

    // Buscar campanhas
    let campaigns = [];
    try {
      // Verificar se a coluna banner_page_image existe para incluir explicitamente
      let selectQuery = 'SELECT * FROM marketplace_campaigns';
      try {
        await db.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
        // Coluna existe, usar SELECT *
        selectQuery = 'SELECT * FROM marketplace_campaigns';
      } catch (colError) {
        // Coluna não existe, selecionar campos explicitamente sem banner_page_image
        console.warn('⚠️ Coluna banner_page_image não existe, usando SELECT explícito');
        selectQuery = `SELECT 
          id, name, description, slug, start_date, end_date,
          min_discount_percent, max_products_per_store, allowed_categories,
          requires_approval, banner_image, banner_text, badge_text, badge_color,
          featured, active, total_participants, total_products, created_at, updated_at
        FROM marketplace_campaigns`;
      }
      
      campaigns = await db.prepare(`${selectQuery} ORDER BY created_at DESC`).all();
      console.log(`✅ ${campaigns.length} campanha(s) encontrada(s)`);
    } catch (queryError) {
      console.error('❌ Erro ao buscar campanhas:', queryError.message);
      console.error('Stack:', queryError.stack);
      return res.status(500).json({ 
        error: 'Erro ao buscar campanhas', 
        details: queryError.message 
      });
    }
    
    // Se não houver campanhas, retornar array vazio imediatamente
    if (!campaigns || campaigns.length === 0) {
      console.log('ℹ️ Nenhuma campanha encontrada, retornando array vazio');
      return res.json([]);
    }
    
    // Verificar se a coluna banner_page_image existe
    let hasBannerPageImage = false;
    try {
      await db.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
      hasBannerPageImage = true;
      console.log('✅ Coluna banner_page_image existe');
    } catch (colError) {
      console.warn('⚠️ Coluna banner_page_image não existe ainda:', colError.message);
    }
    
    // Para cada campanha, buscar estatísticas de participações
    let campaignsWithStats = [];
    try {
      campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
        try {
          // Verificar se a tabela campaign_participations existe antes de consultar
          let stats = { participant_stores: 0, total_products: 0 };
          try {
            // Verificar se a tabela existe
            await db.prepare('SELECT 1 FROM campaign_participations LIMIT 1').get();
            
            const statsResult = await db.prepare(`
              SELECT 
                COUNT(DISTINCT store_id) as participant_stores,
                COUNT(id) as total_products
              FROM campaign_participations
              WHERE campaign_id = ? AND status = 'approved'
            `).get(campaign.id);
            
            if (statsResult) {
              stats = {
                participant_stores: statsResult.participant_stores || 0,
                total_products: statsResult.total_products || 0
              };
            }
          } catch (statsError) {
            // Se a tabela não existir ou houver erro, usar valores padrão
            console.warn(`⚠️ Erro ao buscar stats da campanha ${campaign.id}:`, statsError.message);
            stats = { participant_stores: 0, total_products: 0 };
          }
          
          const processedCampaign = {
            ...campaign,
            active: campaign.active === 1 || campaign.active === true,
            featured: campaign.featured === 1 || campaign.featured === true,
            requires_approval: campaign.requires_approval === 1 || campaign.requires_approval === true,
            min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
            allowed_categories: campaign.allowed_categories ? (() => {
              try {
                return JSON.parse(campaign.allowed_categories);
              } catch (parseError) {
                console.warn(`⚠️ Erro ao parsear allowed_categories da campanha ${campaign.id}:`, parseError.message);
                return null;
              }
            })() : null,
            participant_stores: stats?.participant_stores || 0,
            total_products: stats?.total_products || 0
          };
          
          // Garantir que banner_page_image existe no objeto retornado
          if (!hasBannerPageImage) {
            processedCampaign.banner_page_image = null;
          } else if (campaign.banner_page_image === undefined) {
            processedCampaign.banner_page_image = null;
          } else {
            // Campo existe e tem valor (pode ser null ou string)
            processedCampaign.banner_page_image = campaign.banner_page_image;
          }
          
          // Log apenas para campanhas específicas ou se houver problema
          if (campaign.id === '1ff42a25-ce7e-4bfc-9d7d-45f25df64150' || campaign.banner_page_image) {
            console.log('🔍 Campanha processada (GET /):', {
              id: processedCampaign.id,
              name: processedCampaign.name,
              banner_image: processedCampaign.banner_image,
              banner_page_image: processedCampaign.banner_page_image,
              raw_banner_page_image: campaign.banner_page_image,
              hasBannerPageImageColumn: hasBannerPageImage,
              raw_campaign_keys: Object.keys(campaign)
            });
          }
          
          return processedCampaign;
        } catch (error) {
          console.error(`❌ Erro ao processar campanha ${campaign.id}:`, error.message);
          console.error('Stack:', error.stack);
          // Retornar campanha com valores padrão em caso de erro
          return {
            ...campaign,
            active: campaign.active === 1 || campaign.active === true,
            featured: campaign.featured === 1 || campaign.featured === true,
            requires_approval: campaign.requires_approval === 1 || campaign.requires_approval === true,
            min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
            allowed_categories: null,
            participant_stores: 0,
            total_products: 0
          };
        }
      }));
    } catch (mapError) {
      console.error('❌ Erro ao processar campanhas:', mapError.message);
      console.error('Stack:', mapError.stack);
      // Em caso de erro no map, retornar campanhas sem stats
      campaignsWithStats = campaigns.map(campaign => ({
        ...campaign,
        active: campaign.active === 1 || campaign.active === true,
        featured: campaign.featured === 1 || campaign.featured === true,
        requires_approval: campaign.requires_approval === 1 || campaign.requires_approval === true,
        min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
        allowed_categories: null,
        participant_stores: 0,
        total_products: 0
      }));
    }
    
    console.log(`✅ Retornando ${campaignsWithStats.length} campanha(s) processada(s)`);
    res.json(campaignsWithStats);
  } catch (error) {
    console.error('❌ Erro ao listar campanhas:', error);
    console.error('Stack completo:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar campanhas', 
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
    });
  }
});

// Obter campanha específica (público)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await db.prepare('SELECT * FROM marketplace_campaigns WHERE id = ?').get(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Verificar se a coluna banner_page_image existe
    let hasBannerPageImage = false;
    try {
      await db.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
      hasBannerPageImage = true;
    } catch (colError) {
      console.warn('⚠️ Coluna banner_page_image não existe na rota GET /:id:', colError.message);
    }
    
    // Buscar estatísticas
    let stats = { participant_stores: 0, total_products: 0 };
    try {
      // Verificar se a tabela existe antes de consultar
      try {
        await db.prepare('SELECT 1 FROM campaign_participations LIMIT 1').get();
        stats = await db.prepare(`
          SELECT 
            COUNT(DISTINCT store_id) as participant_stores,
            COUNT(id) as total_products
          FROM campaign_participations
          WHERE campaign_id = ? AND status = 'approved'
        `).get(id);
      } catch (tableError) {
        // Tabela não existe, usar valores padrão
        console.warn(`Tabela campaign_participations não existe ou erro ao consultar:`, tableError.message);
        stats = { participant_stores: 0, total_products: 0 };
      }
    } catch (error) {
      console.error(`Erro ao buscar stats da campanha ${id}:`, error);
    }
    
    const response = {
      ...campaign,
      active: campaign.active === 1 || campaign.active === true,
      featured: campaign.featured === 1 || campaign.featured === true,
      requires_approval: campaign.requires_approval === 1 || campaign.requires_approval === true,
      min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
      allowed_categories: campaign.allowed_categories ? (() => {
        try {
          return JSON.parse(campaign.allowed_categories);
        } catch {
          return null;
        }
      })() : null,
      participant_stores: stats?.participant_stores || 0,
      total_products: stats?.total_products || 0
    };
    
    // Garantir que banner_page_image existe no objeto retornado
    if (!hasBannerPageImage) {
      response.banner_page_image = null;
      console.warn('⚠️ Coluna banner_page_image não existe - retornando null');
    } else if (campaign.banner_page_image === undefined) {
      response.banner_page_image = null;
      console.warn('⚠️ banner_page_image é undefined no banco - retornando null');
    } else {
      // Campo existe e tem valor (pode ser null ou string)
      response.banner_page_image = campaign.banner_page_image;
    }
    
    console.log('🔍 Campanha retornada (GET /:id):', {
      id: response.id,
      name: response.name,
      banner_image: response.banner_image,
      banner_page_image: response.banner_page_image,
      raw_banner_page_image: campaign.banner_page_image,
      hasBannerPageImageColumn: hasBannerPageImage,
      todas_chaves_campaign: Object.keys(campaign)
    });
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar campanha:', error);
    res.status(500).json({ error: 'Erro ao buscar campanha' });
  }
});

// Criar campanha (admin apenas)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Garantir conexão com o banco antes de criar
    await ensureDatabaseConnection();
    
    console.log('📝 Criando nova campanha - Usuário:', req.user?.id);
    console.log('📦 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      description,
      slug,
      start_date,
      end_date,
      min_discount_percent,
      max_products_per_store,
      allowed_categories,
      requires_approval,
      banner_image,
      banner_page_image,
      banner_text,
      badge_text,
      badge_color,
      featured,
      active
    } = req.body;
    
    // Validações
    if (!name || !name.trim()) {
      console.warn('⚠️ Validação falhou: Nome não fornecido');
      return res.status(400).json({ error: 'Nome da campanha é obrigatório' });
    }
    
    if (!start_date || !end_date) {
      console.warn('⚠️ Validação falhou: Datas não fornecidas');
      return res.status(400).json({ error: 'Datas de início e término são obrigatórias' });
    }
    
    if (new Date(start_date) >= new Date(end_date)) {
      console.warn('⚠️ Validação falhou: Data de término anterior à data de início');
      return res.status(400).json({ error: 'Data de término deve ser posterior à data de início' });
    }
    
    const id = uuidv4();
    const campaignSlug = slug || name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    console.log('🔍 Verificando slug:', campaignSlug);
    
    // Verificar se slug já existe
    try {
      const existing = await db.prepare('SELECT id FROM marketplace_campaigns WHERE slug = ?').get(campaignSlug);
      if (existing) {
        console.warn('⚠️ Slug já existe:', campaignSlug);
        return res.status(400).json({ error: 'Já existe uma campanha com este nome/slug' });
      }
    } catch (checkError) {
      console.error('❌ Erro ao verificar slug:', checkError.message);
      // Continuar mesmo se houver erro na verificação
    }
    
    console.log('💾 Inserindo campanha no banco...');
    
    try {
      // Verificar se a coluna banner_page_image existe
      const { isSQLite } = await import('../database/db-wrapper.js');
      let insertQuery, insertValues;
      
      try {
        // Tentar inserir com banner_page_image
        await db.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
        // Coluna existe
        insertQuery = `
          INSERT INTO marketplace_campaigns (
            id, name, description, slug, start_date, end_date,
            min_discount_percent, max_products_per_store, allowed_categories,
            requires_approval, banner_image, banner_page_image, banner_text, badge_text, badge_color,
            featured, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        insertValues = [
          id,
          name.trim(),
          description || null,
          campaignSlug,
          start_date,
          end_date,
          min_discount_percent || 10.00,
          max_products_per_store || null,
          allowed_categories ? JSON.stringify(allowed_categories) : null,
          requires_approval ? 1 : 0,
          banner_image || null,
          banner_page_image || null,
          banner_text || null,
          badge_text || 'EM PROMOÇÃO',
          badge_color || '#EF4444',
          featured ? 1 : 0,
          active !== undefined ? (active ? 1 : 0) : 1
        ];
      } catch (colError) {
        // Coluna não existe, inserir sem ela
        insertQuery = `
          INSERT INTO marketplace_campaigns (
            id, name, description, slug, start_date, end_date,
            min_discount_percent, max_products_per_store, allowed_categories,
            requires_approval, banner_image, banner_text, badge_text, badge_color,
            featured, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        insertValues = [
          id,
          name.trim(),
          description || null,
          campaignSlug,
          start_date,
          end_date,
          min_discount_percent || 10.00,
          max_products_per_store || null,
          allowed_categories ? JSON.stringify(allowed_categories) : null,
          requires_approval ? 1 : 0,
          banner_image || null,
          banner_text || null,
          badge_text || 'EM PROMOÇÃO',
          badge_color || '#EF4444',
          featured ? 1 : 0,
          active !== undefined ? (active ? 1 : 0) : 1
        ];
      }
      
      await db.prepare(insertQuery).run(...insertValues);
      
      console.log('✅ Campanha inserida com sucesso. ID:', id);
      
      const campaign = await db.prepare('SELECT * FROM marketplace_campaigns WHERE id = ?').get(id);
      
      if (!campaign) {
        console.error('❌ Campanha criada mas não foi possível recuperá-la');
        return res.status(500).json({ error: 'Campanha criada mas não foi possível recuperá-la' });
      }
      
      console.log('✅ Campanha recuperada com sucesso');
      
      const response = {
        ...campaign,
        active: campaign.active === 1,
        featured: campaign.featured === 1,
        requires_approval: campaign.requires_approval === 1,
        min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
        allowed_categories: campaign.allowed_categories ? (() => {
          try {
            return JSON.parse(campaign.allowed_categories);
          } catch {
            return null;
          }
        })() : null,
        participant_stores: 0,
        total_products: 0
      };
      
      console.log('✅ Retornando campanha criada');
      res.status(201).json(response);
    } catch (dbError) {
      console.error('❌ Erro ao inserir campanha no banco:', dbError);
      console.error('Stack:', dbError.stack);
      // Se for erro de constraint (slug duplicado), retornar erro específico
      if (dbError.message && dbError.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Já existe uma campanha com este nome/slug' });
      }
      throw dbError; // Re-lançar para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('❌ Erro ao criar campanha:', error);
    console.error('Stack trace completo:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Garantir que sempre retornamos uma resposta
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erro ao criar campanha', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
      });
    }
  }
});

// Atualizar campanha (admin apenas)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { isSQLite } = await import('../database/db-wrapper.js');
    const { id } = req.params;
    const {
      name,
      description,
      start_date,
      end_date,
      min_discount_percent,
      max_products_per_store,
      allowed_categories,
      requires_approval,
      banner_image,
      banner_text,
      badge_text,
      badge_color,
      banner_page_image,
      featured,
      active
    } = req.body;
    
    console.log('📝 Atualizando campanha:', id);
    console.log('📦 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    // Verificar se campanha existe
    const existing = await db.prepare('SELECT * FROM marketplace_campaigns WHERE id = ?').get(id);
    if (!existing) {
      console.error('❌ Campanha não encontrada:', id);
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Preparar valores para atualização
    const updateName = name !== undefined ? name : existing.name;
    const updateDescription = description !== undefined ? description : (existing.description || null);
    const updateStartDate = start_date || existing.start_date;
    const updateEndDate = end_date || existing.end_date;
    const updateMinDiscount = min_discount_percent !== undefined ? min_discount_percent : existing.min_discount_percent;
    const updateMaxProducts = max_products_per_store !== undefined ? max_products_per_store : (existing.max_products_per_store || null);
    const updateAllowedCategories = allowed_categories !== undefined 
      ? (Array.isArray(allowed_categories) ? JSON.stringify(allowed_categories) : allowed_categories)
      : (existing.allowed_categories || null);
    const updateRequiresApproval = requires_approval !== undefined 
      ? (isSQLite() ? (requires_approval ? 1 : 0) : requires_approval)
      : existing.requires_approval;
    const updateBannerImage = banner_image !== undefined ? banner_image : (existing.banner_image || null);
    const updateBannerPageImage = banner_page_image !== undefined ? banner_page_image : (existing.banner_page_image || null);
    const updateBannerText = banner_text !== undefined ? banner_text : (existing.banner_text || null);
    
    console.log('🖼️ Banner page image:', {
      recebido: banner_page_image,
      existente: existing.banner_page_image,
      final: updateBannerPageImage
    });
    const updateBadgeText = badge_text !== undefined ? badge_text : (existing.badge_text || 'EM PROMOÇÃO');
    const updateBadgeColor = badge_color || existing.badge_color || '#EF4444';
    const updateFeatured = featured !== undefined 
      ? (isSQLite() ? (featured ? 1 : 0) : featured)
      : existing.featured;
    const updateActive = active !== undefined 
      ? (isSQLite() ? (active ? 1 : 0) : active)
      : existing.active;
    
    console.log('💾 Valores para atualização:', {
      name: updateName,
      requires_approval: updateRequiresApproval,
      featured: updateFeatured,
      active: updateActive,
      isSQLite: isSQLite()
    });
    
    // Verificar se a coluna banner_page_image existe e criar se necessário
    let updateQuery, updateValues;
    let columnExists = false;
    try {
      await db.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
      columnExists = true;
      console.log('✅ Coluna banner_page_image existe, atualizando com ela');
      } catch (colError) {
        console.warn('⚠️ Coluna banner_page_image não existe:', colError.message);
        console.log('💡 Tentando criar a coluna automaticamente...');
        try {
          const { isSQLite } = await import('../database/db-wrapper.js');
          if (isSQLite()) {
            // SQLite
            await db.prepare('ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT').run();
            console.log('✅ Coluna banner_page_image criada com sucesso (SQLite)!');
            columnExists = true;
          } else {
            // PostgreSQL - tentar via prepare primeiro
            try {
              await db.prepare('ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT').run();
              console.log('✅ Coluna banner_page_image criada com sucesso (PostgreSQL via prepare)!');
              columnExists = true;
            } catch (prepareError) {
              // Se falhar, a coluna pode já existir ou não temos permissão
              // Continuar sem a coluna - não é crítico
              console.warn('⚠️ Não foi possível criar a coluna banner_page_image:', prepareError.message);
              console.warn('💡 Execute manualmente: ALTER TABLE marketplace_campaigns ADD COLUMN banner_page_image TEXT;');
              columnExists = false;
            }
          }
          
          // Verificar novamente após criar
          if (columnExists) {
            try {
              await db.prepare('SELECT banner_page_image FROM marketplace_campaigns LIMIT 1').get();
              console.log('✅ Verificação: Coluna banner_page_image agora existe!');
            } catch (verifyError) {
              console.warn('⚠️ Coluna criada mas não pode ser verificada:', verifyError.message);
              columnExists = false;
            }
          }
        } catch (createError) {
          console.error('❌ Erro ao criar coluna banner_page_image:', createError.message);
          console.error('Stack:', createError.stack);
          console.error('⚠️ Continuando sem a coluna - o banner_page_image não será salvo');
          columnExists = false;
        }
      }
    
    if (columnExists) {
      // Coluna existe
      updateQuery = `
        UPDATE marketplace_campaigns
        SET 
          name = ?,
          description = ?,
          start_date = ?,
          end_date = ?,
          min_discount_percent = ?,
          max_products_per_store = ?,
          allowed_categories = ?,
          requires_approval = ?,
          banner_image = ?,
          banner_page_image = ?,
          banner_text = ?,
          badge_text = ?,
          badge_color = ?,
          featured = ?,
          active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      updateValues = [
        updateName,
        updateDescription,
        updateStartDate,
        updateEndDate,
        updateMinDiscount,
        updateMaxProducts,
        updateAllowedCategories,
        updateRequiresApproval,
        updateBannerImage,
        updateBannerPageImage,
        updateBannerText,
        updateBadgeText,
        updateBadgeColor,
        updateFeatured,
        updateActive,
        id
      ];
    } else {
      // Coluna não existe, atualizar sem ela
      console.warn('⚠️ Atualizando sem banner_page_image (coluna não existe)');
      updateQuery = `
        UPDATE marketplace_campaigns
        SET 
          name = ?,
          description = ?,
          start_date = ?,
          end_date = ?,
          min_discount_percent = ?,
          max_products_per_store = ?,
          allowed_categories = ?,
          requires_approval = ?,
          banner_image = ?,
          banner_text = ?,
          badge_text = ?,
          badge_color = ?,
          featured = ?,
          active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      updateValues = [
        updateName,
        updateDescription,
        updateStartDate,
        updateEndDate,
        updateMinDiscount,
        updateMaxProducts,
        updateAllowedCategories,
        updateRequiresApproval,
        updateBannerImage,
        updateBannerText,
        updateBadgeText,
        updateBadgeColor,
        updateFeatured,
        updateActive,
        id
      ];
    }
    
    console.log('💾 Executando UPDATE com valores:', {
      banner_image: updateBannerImage,
      banner_page_image: updateBannerPageImage,
      tem_coluna: columnExists,
      query_tem_banner_page: updateQuery.includes('banner_page_image'),
      valores_count: updateValues.length,
      banner_page_image_recebido: banner_page_image,
      banner_page_image_final: updateBannerPageImage
    });
    console.log('📝 Query completa:', updateQuery);
    console.log('📦 Valores (primeiros 5):', updateValues.slice(0, 5));
    console.log('📦 banner_page_image na posição:', columnExists ? updateValues.findIndex((v, i) => updateQuery.split('?')[i]?.includes('banner_page_image')) : 'N/A');
    
    try {
      await db.prepare(updateQuery).run(...updateValues);
      console.log('✅ UPDATE executado com sucesso');
      
      // Verificar se foi salvo corretamente (apenas se a coluna existe)
      if (columnExists) {
        try {
          const updated = await db.prepare('SELECT banner_image, banner_page_image FROM marketplace_campaigns WHERE id = ?').get(id);
          if (updated) {
            console.log('🔍 Verificação após UPDATE:', {
              banner_image: updated.banner_image,
              banner_page_image: updated.banner_page_image
            });
          }
        } catch (verifyError) {
          // Não crítico - apenas logar
          console.warn('⚠️ Erro ao verificar após UPDATE (não crítico):', verifyError.message);
        }
      }
    } catch (updateError) {
      console.error('❌ Erro ao executar UPDATE:', updateError.message);
      console.error('Stack:', updateError.stack);
      console.error('Query:', updateQuery);
      console.error('Valores:', updateValues);
      throw updateError;
    }
    
    console.log('✅ Campanha atualizada com sucesso');
    
    // Buscar campanha atualizada
    let campaign;
    try {
      campaign = await db.prepare('SELECT * FROM marketplace_campaigns WHERE id = ?').get(id);
      if (!campaign) {
        throw new Error('Campanha não encontrada após atualização');
      }
      
      console.log('🔍 Campanha recuperada do banco:', {
        id: campaign.id,
        name: campaign.name,
        banner_image: campaign.banner_image,
        banner_page_image: campaign.banner_page_image,
        banner_page_image_undefined: campaign.banner_page_image === undefined,
        banner_page_image_null: campaign.banner_page_image === null,
        tem_banner_page_image_key: 'banner_page_image' in campaign,
        todas_chaves: Object.keys(campaign)
      });
    } catch (fetchError) {
      console.error('❌ Erro ao buscar campanha após atualização:', fetchError.message);
      throw fetchError;
    }
    
    // Verificar se banner_page_image existe no resultado
    const response = {
      ...campaign,
      active: campaign.active === 1 || campaign.active === true,
      featured: campaign.featured === 1 || campaign.featured === true,
      requires_approval: campaign.requires_approval === 1 || campaign.requires_approval === true,
      min_discount_percent: campaign.min_discount_percent ? parseFloat(campaign.min_discount_percent) : 10,
      allowed_categories: campaign.allowed_categories ? (() => {
        try {
          return JSON.parse(campaign.allowed_categories);
        } catch {
          return null;
        }
      })() : null
    };
    
    // Garantir que banner_page_image existe na resposta
    if (columnExists) {
      // Se a coluna existe, usar o valor do banco (mesmo que seja null)
      response.banner_page_image = campaign.banner_page_image !== undefined ? campaign.banner_page_image : null;
    } else {
      // Se a coluna não existe, retornar null
      response.banner_page_image = null;
    }
    
    console.log('📤 Retornando campanha atualizada:', {
      id: response.id,
      name: response.name,
      banner_image: response.banner_image,
      banner_page_image: response.banner_page_image,
      columnExists: columnExists
    });
    
    res.json(response);
  } catch (error) {
    console.error('❌ Erro ao atualizar campanha:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao atualizar campanha',
      details: error.message 
    });
  }
});

// Deletar campanha (admin apenas)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await db.prepare('SELECT id FROM marketplace_campaigns WHERE id = ?').get(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Deletar participações primeiro (CASCADE)
    await db.prepare('DELETE FROM campaign_participations WHERE campaign_id = ?').run(id);
    
    // Deletar campanha
    await db.prepare('DELETE FROM marketplace_campaigns WHERE id = ?').run(id);
    
    res.json({ message: 'Campanha deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar campanha:', error);
    res.status(500).json({ error: 'Erro ao deletar campanha' });
  }
});

// Listar participações aprovadas de uma campanha (público - para exibição no home)
router.get('/:id/participations/public', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se campanha existe
    const campaign = await db.prepare('SELECT id FROM marketplace_campaigns WHERE id = ?').get(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Buscar apenas participações aprovadas (público)
    const participations = await db.prepare(`
      SELECT 
        cp.*,
        p.name as product_name,
        p.images as product_images,
        s.name as store_name
      FROM campaign_participations cp
      LEFT JOIN products p ON cp.product_id = p.id
      LEFT JOIN stores s ON cp.store_id = s.id
      WHERE cp.campaign_id = ? AND cp.status = 'approved'
      ORDER BY cp.created_at DESC
    `).all(id);
    
    res.json(participations.map(p => ({
      ...p,
      product_images: p.product_images ? (typeof p.product_images === 'string' ? JSON.parse(p.product_images) : p.product_images) : []
    })));
  } catch (error) {
    console.error('Erro ao buscar participações públicas:', error);
    res.status(500).json({ error: 'Erro ao buscar participações', details: error.message });
  }
});

// Listar participações de uma campanha (admin ou lojista da loja)
router.get('/:id/participations', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se campanha existe
    const campaign = await db.prepare('SELECT id FROM marketplace_campaigns WHERE id = ?').get(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    let query = `
      SELECT 
        cp.*,
        p.name as product_name,
        p.images as product_images,
        s.name as store_name
      FROM campaign_participations cp
      LEFT JOIN products p ON cp.product_id = p.id
      LEFT JOIN stores s ON cp.store_id = s.id
      WHERE cp.campaign_id = ?
    `;
    const params = [id];
    
    // Se não for admin, mostrar apenas participações da própria loja
    if (req.user.role !== 'admin') {
      const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
      if (!store) {
        return res.status(403).json({ error: 'Loja não encontrada' });
      }
      query += ' AND cp.store_id = ?';
      params.push(store.id);
    }
    
    query += ' ORDER BY cp.created_at DESC';
    
    const participations = await db.prepare(query).all(...params);
    
    res.json(participations.map(p => ({
      ...p,
      status: p.status,
      original_price: parseFloat(p.original_price),
      promo_price: parseFloat(p.promo_price),
      discount_percent: parseFloat(p.discount_percent),
      discount_fixed: p.discount_fixed ? parseFloat(p.discount_fixed) : null
    })));
  } catch (error) {
    console.error('Erro ao buscar participações:', error);
    res.status(500).json({ error: 'Erro ao buscar participações' });
  }
});

export default router;

