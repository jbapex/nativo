import express from 'express';
import { db } from '../database/db.js';
import { isSQLite } from '../database/db-wrapper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Participar de uma campanha (lojista)
router.post('/', authenticateToken, requireRole('store'), async (req, res) => {
  try {
    const {
      campaign_id,
      product_ids, // Array de IDs de produtos
      discount_percent,
      discount_fixed
    } = req.body;
    
    // Validações
    if (!campaign_id) {
      return res.status(400).json({ error: 'ID da campanha é obrigatório' });
    }
    
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos um produto' });
    }
    
    if (!discount_percent && !discount_fixed) {
      return res.status(400).json({ error: 'Desconto é obrigatório' });
    }
    
    // Buscar loja do usuário
    const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Buscar campanha
    const campaign = await db.prepare('SELECT * FROM marketplace_campaigns WHERE id = ?').get(campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }
    
    // Verificar se campanha está ativa
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    
    if (now < startDate || now > endDate) {
      return res.status(400).json({ error: 'Campanha não está ativa no momento' });
    }
    
    if (!campaign.active) {
      return res.status(400).json({ error: 'Campanha está desativada' });
    }
    
    // Verificar limite de produtos por loja
    if (campaign.max_products_per_store) {
      const existingCount = await db.prepare(`
        SELECT COUNT(*) as count 
        FROM campaign_participations 
        WHERE campaign_id = ? AND store_id = ? AND status = 'approved'
      `).get(campaign_id, store.id);
      
      if (existingCount.count + product_ids.length > campaign.max_products_per_store) {
        return res.status(400).json({ 
          error: `Limite de ${campaign.max_products_per_store} produtos por loja excedido` 
        });
      }
    }
    
    // Verificar desconto mínimo
    const minDiscount = parseFloat(campaign.min_discount_percent) || 10;
    if (discount_percent && discount_percent < minDiscount) {
      return res.status(400).json({ 
        error: `Desconto mínimo é de ${minDiscount}%` 
      });
    }
    
    // Verificar categorias permitidas (se houver)
    let allowedCategories = null;
    if (campaign.allowed_categories) {
      try {
        allowedCategories = JSON.parse(campaign.allowed_categories);
      } catch (e) {
        console.error('Erro ao parsear categorias permitidas:', e);
      }
    }
    
    const participations = [];
    const errors = [];
    
    // Processar cada produto
    for (const productId of product_ids) {
      try {
        // Verificar se produto existe e pertence à loja
        const product = await db.prepare(`
          SELECT id, price, category_id, store_id 
          FROM products 
          WHERE id = ? AND store_id = ?
        `).get(productId, store.id);
        
        if (!product) {
          errors.push(`Produto ${productId} não encontrado ou não pertence à sua loja`);
          continue;
        }
        
        // Verificar categoria (se houver restrição)
        if (allowedCategories && !allowedCategories.includes(product.category_id)) {
          errors.push(`Produto ${productId} não está em uma categoria permitida`);
          continue;
        }
        
        // Verificar se já está participando
        const existing = await db.prepare(`
          SELECT id FROM campaign_participations 
          WHERE campaign_id = ? AND product_id = ?
        `).get(campaign_id, productId);
        
        if (existing) {
          errors.push(`Produto ${productId} já está participando desta campanha`);
          continue;
        }
        
        // Calcular preço promocional
        let promoPrice = parseFloat(product.price);
        if (discount_percent) {
          promoPrice = product.price * (1 - discount_percent / 100);
        } else if (discount_fixed) {
          promoPrice = Math.max(0, product.price - discount_fixed);
        }
        
        // Criar participação
        const participationId = uuidv4();
        const status = campaign.requires_approval ? 'pending' : 'approved';
        
        await db.prepare(`
          INSERT INTO campaign_participations (
            id, campaign_id, store_id, product_id,
            discount_percent, discount_fixed,
            original_price, promo_price, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          participationId,
          campaign_id,
          store.id,
          productId,
          discount_percent || null,
          discount_fixed || null,
          product.price,
          promoPrice,
          status
        );
        
        participations.push({
          id: participationId,
          product_id: productId,
          status: status
        });
      } catch (error) {
        console.error(`Erro ao processar produto ${productId}:`, error);
        errors.push(`Erro ao processar produto ${productId}`);
      }
    }
    
    if (participations.length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum produto pôde ser adicionado',
        details: errors
      });
    }
    
    res.status(201).json({
      message: `${participations.length} produto(s) adicionado(s) à campanha`,
      participations: participations,
      requires_approval: campaign.requires_approval,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erro ao participar da campanha:', error);
    res.status(500).json({ error: 'Erro ao participar da campanha' });
  }
});

// Remover participação (lojista)
router.delete('/:id', authenticateToken, requireRole('store'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar loja do usuário
    const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Verificar se participação existe e pertence à loja
    const participation = await db.prepare(`
      SELECT id FROM campaign_participations 
      WHERE id = ? AND store_id = ?
    `).get(id, store.id);
    
    if (!participation) {
      return res.status(404).json({ error: 'Participação não encontrada' });
    }
    
    // Deletar participação
    await db.prepare('DELETE FROM campaign_participations WHERE id = ?').run(id);
    
    res.json({ message: 'Participação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover participação:', error);
    res.status(500).json({ error: 'Erro ao remover participação' });
  }
});

// Aprovar/Rejeitar participação (admin)
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use "approved" ou "rejected"' });
    }
    
    const participation = await db.prepare('SELECT id FROM campaign_participations WHERE id = ?').get(id);
    if (!participation) {
      return res.status(404).json({ error: 'Participação não encontrada' });
    }
    
    await db.prepare(`
      UPDATE campaign_participations
      SET status = ?, approved_at = CURRENT_TIMESTAMP, approved_by = ?
      WHERE id = ?
    `).run(status, req.user.id, id);
    
    res.json({ message: `Participação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso` });
  } catch (error) {
    console.error('Erro ao atualizar status da participação:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Listar campanhas disponíveis para participação (lojista)
router.get('/available', authenticateToken, requireRole('store'), async (req, res) => {
  try {
    const now = new Date().toISOString();
    const activeValue = isSQLite() ? 1 : true;
    
    // Buscar loja do usuário
    const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Buscar campanhas ativas
    const campaigns = await db.prepare(`
      SELECT 
        mc.*,
        COUNT(cp.id) as my_participations
      FROM marketplace_campaigns mc
      LEFT JOIN campaign_participations cp ON mc.id = cp.campaign_id 
        AND cp.store_id = ? 
        AND cp.status IN ('approved', 'pending')
      WHERE mc.active = ?
        AND mc.start_date <= ?
        AND mc.end_date >= ?
      GROUP BY mc.id
      ORDER BY mc.featured DESC, mc.start_date DESC
    `).all(store.id, activeValue, now, now);
    
    res.json(campaigns.map(campaign => ({
      ...campaign,
      active: campaign.active === 1,
      featured: campaign.featured === 1,
      requires_approval: campaign.requires_approval === 1,
      min_discount_percent: parseFloat(campaign.min_discount_percent),
      allowed_categories: campaign.allowed_categories ? JSON.parse(campaign.allowed_categories) : null,
      my_participations: campaign.my_participations || 0
    })));
  } catch (error) {
    console.error('Erro ao buscar campanhas disponíveis:', error);
    res.status(500).json({ error: 'Erro ao buscar campanhas disponíveis' });
  }
});

export default router;

