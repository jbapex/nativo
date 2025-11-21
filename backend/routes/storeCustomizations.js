import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Obter customizações de uma loja (público para visualização)
router.get('/store/:storeId', optionalAuth, (req, res) => {
  try {
    const { storeId } = req.params;
    
    const customization = db.prepare('SELECT * FROM store_customizations WHERE store_id = ?').get(storeId);
    
    if (!customization) {
      // Retornar valores padrão se não houver customização
      return res.json({
        store_id: storeId,
        primary_color: '#2563eb',
        secondary_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#1f2937',
        header_color: '#ffffff',
        footer_color: '#f9fafb',
        banner_image: null,
        banner_text: '',
        banners: [],
        banner_enabled: true,
        about_section_enabled: true,
        about_text: '',
        featured_section_enabled: true,
        categories_section_enabled: true,
        contact_section_enabled: true,
        instagram_url: null,
        facebook_url: null,
        whatsapp_number: null,
        layout_style: 'modern',
        show_search: true,
        show_categories: true
      });
    }
    
    // Parse banners JSON se existir
    let parsedBannersStore = null;
    if (customization.banners) {
      try {
        parsedBannersStore = JSON.parse(customization.banners);
      } catch (e) {
        console.error('Erro ao parsear banners JSON:', e);
      }
    }
    
    // Compatibilidade: se não tiver banners mas tiver banner_image, criar array
    if (!parsedBannersStore && customization.banner_image) {
      parsedBannersStore = [{
        image: customization.banner_image,
        text: customization.banner_text || '',
        order: 0
      }];
    }
    
    res.json({
      ...customization,
      banners: parsedBannersStore || [],
      banner_enabled: customization.banner_enabled === 1 || customization.banner_enabled === true,
      about_section_enabled: customization.about_section_enabled === 1 || customization.about_section_enabled === true,
      featured_section_enabled: customization.featured_section_enabled === 1 || customization.featured_section_enabled === true,
      categories_section_enabled: customization.categories_section_enabled === 1 || customization.categories_section_enabled === true,
      contact_section_enabled: customization.contact_section_enabled === 1 || customization.contact_section_enabled === true,
      show_search: customization.show_search === 1 || customization.show_search === true,
      show_categories: customization.show_categories === 1 || customization.show_categories === true
    });
  } catch (error) {
    console.error('Erro ao buscar customizações:', error);
    res.status(500).json({ error: 'Erro ao buscar customizações' });
  }
});

// Obter customizações da própria loja (autenticado)
router.get('/my-store', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  try {
    // Buscar loja do usuário
    const store = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    const customization = db.prepare('SELECT * FROM store_customizations WHERE store_id = ?').get(store.id);
    
    if (!customization) {
      // Retornar valores padrão se não houver customização
      return res.json({
        store_id: store.id,
        primary_color: '#2563eb',
        secondary_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#1f2937',
        header_color: '#ffffff',
        footer_color: '#f9fafb',
        banner_image: null,
        banner_text: '',
        banners: [],
        banner_enabled: true,
        about_section_enabled: true,
        about_text: '',
        featured_section_enabled: true,
        categories_section_enabled: true,
        contact_section_enabled: true,
        instagram_url: null,
        facebook_url: null,
        whatsapp_number: null,
        layout_style: 'modern',
        show_search: true,
        show_categories: true
      });
    }
    
    // Parse banners JSON se existir
    let parsedBannersMyStore = null;
    if (customization.banners) {
      try {
        parsedBannersMyStore = JSON.parse(customization.banners);
      } catch (e) {
        console.error('Erro ao parsear banners JSON:', e);
      }
    }
    
    // Compatibilidade: se não tiver banners mas tiver banner_image, criar array
    if (!parsedBannersMyStore && customization.banner_image) {
      parsedBannersMyStore = [{
        image: customization.banner_image,
        text: customization.banner_text || '',
        order: 0
      }];
    }
    
    res.json({
      ...customization,
      banners: parsedBannersMyStore || [],
      banner_enabled: customization.banner_enabled === 1 || customization.banner_enabled === true,
      about_section_enabled: customization.about_section_enabled === 1 || customization.about_section_enabled === true,
      featured_section_enabled: customization.featured_section_enabled === 1 || customization.featured_section_enabled === true,
      categories_section_enabled: customization.categories_section_enabled === 1 || customization.categories_section_enabled === true,
      contact_section_enabled: customization.contact_section_enabled === 1 || customization.contact_section_enabled === true,
      show_search: customization.show_search === 1 || customization.show_search === true,
      show_categories: customization.show_categories === 1 || customization.show_categories === true
    });
  } catch (error) {
    console.error('Erro ao buscar customizações:', error);
    res.status(500).json({ error: 'Erro ao buscar customizações' });
  }
});

// Criar ou atualizar customizações (autenticado)
router.post('/', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    console.log('POST /store-customizations - Iniciando...');
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    
    // Buscar loja do usuário
    const store = db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      console.log('Loja não encontrada para user_id:', req.user.id);
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    console.log('Loja encontrada:', store.id);
    
    // Verificar se tem plano Enterprise - primeiro pela assinatura, depois pelo plan_id da loja
    const subscription = db.prepare(`
      SELECT s.*, p.id as plan_id, p.name as plan_name, p.slug as plan_slug
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.store_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `).get(store.id);
    
    // Buscar também o plan_id diretamente da loja e verificar o plano
    const storeData = db.prepare('SELECT plan_id FROM stores WHERE id = ?').get(store.id);
    const storePlanId = storeData?.plan_id;
    
    // Se houver plan_id na loja, buscar o plano para verificar o slug
    let storePlan = null;
    if (storePlanId) {
      storePlan = db.prepare('SELECT id, slug FROM plans WHERE id = ?').get(storePlanId);
    }
    
    // Verificar se tem plano Enterprise (por assinatura ou diretamente na loja)
    const hasEnterprisePlan = 
      (subscription && (subscription.plan_id === 'plan-enterprise' || subscription.plan_slug === 'enterprise')) ||
      (storePlanId === 'plan-enterprise') ||
      (storePlan && storePlan.slug === 'enterprise');
    
    // Se for admin, permitir sempre
    if (req.user.role === 'admin') {
      // Admin pode personalizar qualquer loja
    } else if (!hasEnterprisePlan) {
      console.log('Verificação de plano Enterprise falhou:', {
        subscription: subscription ? { plan_id: subscription.plan_id, plan_slug: subscription.plan_slug } : null,
        storePlanId: storePlanId,
        storePlan: storePlan ? { id: storePlan.id, slug: storePlan.slug } : null,
        storeId: store.id,
        userId: req.user.id
      });
      return res.status(403).json({ 
        error: 'Você precisa ter o plano Enterprise para personalizar sua loja online' 
      });
    }
    
    const {
      primary_color,
      secondary_color,
      background_color,
      text_color,
      header_color,
      footer_color,
      banner_image, // Mantido para compatibilidade
      banner_text, // Mantido para compatibilidade
      banners, // Novo: array de banners [{ image, text, order }]
      banner_enabled,
      about_section_enabled,
      about_text,
      featured_section_enabled,
      categories_section_enabled,
      contact_section_enabled,
      instagram_url,
      facebook_url,
      whatsapp_number,
      layout_style,
      show_search,
      show_categories
    } = req.body;
    
    // Converter banners para JSON se for array
    let bannersJson = null;
    if (banners && Array.isArray(banners)) {
      bannersJson = JSON.stringify(banners);
    } else if (banner_image) {
      // Compatibilidade: se tiver banner_image antigo, converter para array
      bannersJson = JSON.stringify([{
        image: banner_image,
        text: banner_text || '',
        order: 0
      }]);
    }
    
    // Verificar se já existe customização
    const existing = db.prepare('SELECT id FROM store_customizations WHERE store_id = ?').get(store.id);
    
    console.log('Customização existente?', !!existing);
    
    if (existing) {
      console.log('Atualizando customização existente...');
      // Atualizar
      try {
        db.prepare(`
        UPDATE store_customizations SET
          primary_color = ?,
          secondary_color = ?,
          background_color = ?,
          text_color = ?,
          header_color = ?,
          footer_color = ?,
          banner_image = ?,
          banner_text = ?,
          banners = ?,
          banner_enabled = ?,
          about_section_enabled = ?,
          about_text = ?,
          featured_section_enabled = ?,
          categories_section_enabled = ?,
          contact_section_enabled = ?,
          instagram_url = ?,
          facebook_url = ?,
          whatsapp_number = ?,
          layout_style = ?,
          show_search = ?,
          show_categories = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE store_id = ?
      `).run(
        primary_color || '#2563eb',
        secondary_color || '#06b6d4',
        background_color || '#ffffff',
        text_color || '#1f2937',
        header_color || '#ffffff',
        footer_color || '#f9fafb',
        banner_image || null,
        banner_text || '',
        bannersJson,
        banner_enabled !== undefined ? (banner_enabled ? 1 : 0) : 1,
        about_section_enabled !== undefined ? (about_section_enabled ? 1 : 0) : 1,
        about_text || '',
        featured_section_enabled !== undefined ? (featured_section_enabled ? 1 : 0) : 1,
        categories_section_enabled !== undefined ? (categories_section_enabled ? 1 : 0) : 1,
        contact_section_enabled !== undefined ? (contact_section_enabled ? 1 : 0) : 1,
        instagram_url || null,
        facebook_url || null,
        whatsapp_number || null,
        layout_style || 'modern',
        show_search !== undefined ? (show_search ? 1 : 0) : 1,
        show_categories !== undefined ? (show_categories ? 1 : 0) : 1,
        store.id
      );
      console.log('Customização atualizada com sucesso');
      } catch (updateError) {
        console.error('Erro ao atualizar customização:', updateError);
        throw updateError;
      }
    } else {
      console.log('Criando nova customização...');
      // Criar
      const id = uuidv4();
      try {
        db.prepare(`
        INSERT INTO store_customizations (
          id, store_id, primary_color, secondary_color, background_color,
          text_color, header_color, footer_color, banner_image, banner_text, banners,
          banner_enabled, about_section_enabled, about_text,
          featured_section_enabled, categories_section_enabled, contact_section_enabled,
          instagram_url, facebook_url, whatsapp_number,
          layout_style, show_search, show_categories
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        store.id,
        primary_color || '#2563eb',
        secondary_color || '#06b6d4',
        background_color || '#ffffff',
        text_color || '#1f2937',
        header_color || '#ffffff',
        footer_color || '#f9fafb',
        banner_image || null,
        banner_text || '',
        bannersJson,
        banner_enabled !== undefined ? (banner_enabled ? 1 : 0) : 1,
        about_section_enabled !== undefined ? (about_section_enabled ? 1 : 0) : 1,
        about_text || '',
        featured_section_enabled !== undefined ? (featured_section_enabled ? 1 : 0) : 1,
        categories_section_enabled !== undefined ? (categories_section_enabled ? 1 : 0) : 1,
        contact_section_enabled !== undefined ? (contact_section_enabled ? 1 : 0) : 1,
        instagram_url || null,
        facebook_url || null,
        whatsapp_number || null,
        layout_style || 'modern',
        show_search !== undefined ? (show_search ? 1 : 0) : 1,
        show_categories !== undefined ? (show_categories ? 1 : 0) : 1
      );
      console.log('Customização criada com sucesso');
      } catch (createError) {
        console.error('Erro ao criar customização:', createError);
        throw createError;
      }
    }
    
    // Retornar customização atualizada
    console.log('Buscando customização atualizada...');
    const updated = db.prepare('SELECT * FROM store_customizations WHERE store_id = ?').get(store.id);
    
    if (!updated) {
      console.error('Erro: Customização não encontrada após salvar');
      return res.status(500).json({ error: 'Erro ao recuperar customização salva' });
    }
    
    console.log('Customização recuperada com sucesso');
    
    // Parse banners JSON se existir
    let parsedBannersUpdated = null;
    if (updated.banners) {
      try {
        parsedBannersUpdated = JSON.parse(updated.banners);
      } catch (e) {
        console.error('Erro ao parsear banners JSON:', e);
      }
    }
    
    // Compatibilidade: se não tiver banners mas tiver banner_image, criar array
    if (!parsedBannersUpdated && updated.banner_image) {
      parsedBannersUpdated = [{
        image: updated.banner_image,
        text: updated.banner_text || '',
        order: 0
      }];
    }
    
    res.json({
      ...updated,
      banners: parsedBannersUpdated || [],
      banner_enabled: updated.banner_enabled === 1 || updated.banner_enabled === true,
      about_section_enabled: updated.about_section_enabled === 1 || updated.about_section_enabled === true,
      featured_section_enabled: updated.featured_section_enabled === 1 || updated.featured_section_enabled === true,
      categories_section_enabled: updated.categories_section_enabled === 1 || updated.categories_section_enabled === true,
      contact_section_enabled: updated.contact_section_enabled === 1 || updated.contact_section_enabled === true,
      show_search: updated.show_search === 1 || updated.show_search === true,
      show_categories: updated.show_categories === 1 || updated.show_categories === true
    });
  } catch (error) {
    console.error('Erro ao salvar customizações:', error);
    res.status(500).json({ error: 'Erro ao salvar customizações', details: error.message });
  }
});

export default router;

