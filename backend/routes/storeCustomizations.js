import express from 'express';
import { db } from '../database/db.js';
import { isSQLite, getDb } from '../database/db-wrapper.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Obter customizações de uma loja (público para visualização)
router.get('/store/:storeId', optionalAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Verificar se é um UUID ou slug
    const isUUID = storeId.length === 36 && storeId.includes('-');
    let actualStoreId = storeId;
    
    // Se for slug, buscar o ID da loja primeiro
    if (!isUUID) {
      const store = await db.prepare('SELECT id FROM stores WHERE slug = ?').get(storeId);
      if (!store) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }
      actualStoreId = store.id;
    }
    
    const customization = await db.prepare('SELECT * FROM store_customizations WHERE store_id = ?').get(actualStoreId);
    
    if (!customization) {
      // Retornar valores padrão se não houver customização
      return res.json({
        store_id: storeId,
        primary_color: '#2563eb',
        secondary_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#1f2937',
        header_color: '#1e3a8a',
        categories_bar_color: '#f97316',
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
router.get('/my-store', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    // Buscar loja do usuário
    const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    const customization = await db.prepare('SELECT * FROM store_customizations WHERE store_id = ?').get(store.id);
    
    if (!customization) {
      // Retornar valores padrão se não houver customização
      return res.json({
        store_id: store.id,
        primary_color: '#2563eb',
        secondary_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#1f2937',
        header_color: '#1e3a8a',
        categories_bar_color: '#f97316',
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

// Função auxiliar para garantir que colunas existam (PostgreSQL)
async function ensureColumnsExist() {
  if (isSQLite()) {
    return; // SQLite não precisa dessa verificação
  }
  
  const requiredColumns = [
    { name: 'background_color', type: 'VARCHAR(7)', default: "'#ffffff'" },
    { name: 'footer_color', type: 'VARCHAR(7)', default: "'#f9fafb'" },
    { name: 'categories_bar_color', type: 'VARCHAR(7)', default: "'#f97316'" },
    { name: 'banner_enabled', type: 'BOOLEAN', default: 'TRUE' },
    { name: 'banners', type: 'TEXT', default: null }, // JSON array
    { name: 'about_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
    { name: 'about_text', type: 'TEXT', default: null },
    { name: 'featured_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
    { name: 'categories_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
    { name: 'contact_section_enabled', type: 'BOOLEAN', default: 'TRUE' },
    { name: 'instagram_url', type: 'TEXT', default: null },
    { name: 'facebook_url', type: 'TEXT', default: null },
    { name: 'whatsapp_number', type: 'TEXT', default: null },
    { name: 'layout_style', type: 'VARCHAR(50)', default: "'modern'" },
    { name: 'show_search', type: 'BOOLEAN', default: 'TRUE' },
    { name: 'show_categories', type: 'BOOLEAN', default: 'TRUE' }
  ];
  
  try {
    // Obter instância do banco diretamente para usar query
    const dbInstance = getDb();
    
    // Verificar se o método query está disponível
    if (typeof dbInstance.query !== 'function') {
      console.warn('⚠️ Método query não disponível, pulando verificação de colunas');
      return;
    }
    
    // Verificar colunas existentes
    const existingColumns = await dbInstance.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'store_customizations'
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    console.log('📋 Colunas existentes em store_customizations:', existingColumnNames);
    
    // Criar colunas faltantes
    for (const column of requiredColumns) {
      if (!existingColumnNames.includes(column.name)) {
        console.log(`⚠️ Coluna ${column.name} não existe, tentando criar...`);
        try {
          const defaultClause = column.default !== null ? `DEFAULT ${column.default}` : '';
          const alterQuery = `
            ALTER TABLE store_customizations 
            ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} ${defaultClause}
          `;
          
          await dbInstance.query(alterQuery);
          console.log(`✅ Coluna ${column.name} criada com sucesso!`);
        } catch (createError) {
          console.error(`❌ Erro ao criar coluna ${column.name}:`, createError);
          console.error(`❌ Detalhes:`, {
            message: createError.message,
            code: createError.code,
            detail: createError.detail
          });
          
          // Se for erro de permissão, fornecer instruções
          if (createError.code === '42501' || createError.message?.includes('permission')) {
            const defaultClause = column.default !== null ? `DEFAULT ${column.default}` : '';
            console.error(`⚠️ PERMISSÃO INSUFICIENTE. Execute manualmente no PostgreSQL:`);
            console.error(`   ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} ${defaultClause};`);
          }
        }
      } else {
        console.log(`✓ Coluna ${column.name} já existe`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar colunas:', error);
    console.error('❌ Detalhes:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    // Não lançar erro, apenas logar, pois pode ser problema de permissão
  }
}

// Criar ou atualizar customizações (autenticado)
router.post('/', authenticateToken, requireRole('store', 'admin'), async (req, res) => {
  try {
    console.log('POST /store-customizations - Iniciando...');
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    
    // Garantir que colunas existam (PostgreSQL)
    console.log('🔍 Verificando colunas antes de salvar...');
    try {
      await ensureColumnsExist();
      console.log('✅ Verificação de colunas concluída');
    } catch (ensureError) {
      console.error('⚠️ Erro ao verificar colunas (continuando mesmo assim):', ensureError);
      // Continuar mesmo se houver erro, pois vamos verificar dinamicamente
    }
    
    // Buscar loja do usuário
    const store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').get(req.user.id);
    
    if (!store) {
      console.log('Loja não encontrada para user_id:', req.user.id);
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    console.log('Loja encontrada:', store.id);
    
    // Verificar se tem plano Enterprise - primeiro pela assinatura, depois pelo plan_id da loja
    const subscription = await db.prepare(`
      SELECT s.*, p.id as plan_id, p.name as plan_name, p.slug as plan_slug
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.store_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `).get(store.id);
    
    // Buscar também o plan_id diretamente da loja e verificar o plano
    const storeData = await db.prepare('SELECT plan_id FROM stores WHERE id = ?').get(store.id);
    const storePlanId = storeData?.plan_id;
    
    // Se houver plan_id na loja, buscar o plano para verificar o slug
    let storePlan = null;
    if (storePlanId) {
      storePlan = await db.prepare('SELECT id, slug FROM plans WHERE id = ?').get(storePlanId);
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
      categories_bar_color,
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
      show_categories,
      // Novas cores específicas da vitrine
      product_price_color,
      product_button_color,
      categories_card_bg_color
    } = req.body;
    
    // Validar e normalizar cores: garantir que nunca sejam vazias
    const defaultColors = {
      primary_color: '#2563eb',
      secondary_color: '#06b6d4',
      background_color: '#ffffff',
      text_color: '#1f2937',
      header_color: '#1e3a8a',
      categories_bar_color: '#f97316',
      footer_color: '#f9fafb',
      product_price_color: '#f97316',
      product_button_color: '#f97316',
      categories_card_bg_color: '#ffffff'
    };
    
    // Normalizar cores: se vazias ou inválidas, usar padrão
    const normalizeColor = (color, defaultValue) => {
      try {
        // Se for null, undefined, ou não for string, usar padrão
        if (color === null || color === undefined) {
          return defaultValue;
        }
        
        // Se não for string, tentar converter
        const colorStr = typeof color === 'string' ? color : String(color);
        
        // Se vazio após trim, usar padrão
        if (colorStr.trim() === '') {
          return defaultValue;
        }
        
        // Validar formato hex (#rrggbb ou #rrggbbaa)
        const hexPattern = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;
        if (!hexPattern.test(colorStr)) {
          console.warn(`⚠️ Cor inválida recebida: "${colorStr}", usando padrão: "${defaultValue}"`);
          return defaultValue;
        }
        
        return colorStr;
      } catch (err) {
        console.error('Erro ao normalizar cor:', err);
        return defaultValue;
      }
    };
    
    console.log('🔍 Normalizando cores...');
    console.log('Cores recebidas:', {
      primary_color,
      secondary_color,
      background_color,
      text_color,
      header_color,
      categories_bar_color,
      footer_color,
      product_price_color,
      product_button_color,
      categories_card_bg_color
    });
    
    const normalizedPrimaryColor = normalizeColor(primary_color, defaultColors.primary_color);
    const normalizedSecondaryColor = normalizeColor(secondary_color, defaultColors.secondary_color);
    const normalizedBackgroundColor = normalizeColor(background_color, defaultColors.background_color);
    const normalizedTextColor = normalizeColor(text_color, defaultColors.text_color);
    const normalizedHeaderColor = normalizeColor(header_color, defaultColors.header_color);
    const normalizedCategoriesBarColor = normalizeColor(categories_bar_color, defaultColors.categories_bar_color);
    const normalizedFooterColor = normalizeColor(footer_color, defaultColors.footer_color);
    const normalizedProductPriceColor = normalizeColor(product_price_color, defaultColors.product_price_color);
    const normalizedProductButtonColor = normalizeColor(product_button_color, defaultColors.product_button_color);
    const normalizedCategoriesCardBgColor = normalizeColor(categories_card_bg_color, defaultColors.categories_card_bg_color);
    
    console.log('✅ Cores normalizadas:', {
      normalizedPrimaryColor,
      normalizedSecondaryColor,
      normalizedBackgroundColor,
      normalizedTextColor,
      normalizedHeaderColor,
      normalizedFooterColor,
      normalizedProductPriceColor,
      normalizedProductButtonColor,
      normalizedCategoriesCardBgColor
    });
    
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
    
    // Verificar se a coluna banners existe (para PostgreSQL)
    // Por enquanto, vamos assumir que a coluna existe e tratar o erro se não existir
    // Isso evita problemas de permissão ao verificar information_schema
    let hasBannersColumn = true;
    
    // Tentar verificar de forma simples: se der erro ao usar, não incluir na query
    if (!isSQLite()) {
      try {
        // Tentar uma query simples para verificar se a coluna existe
        await db.prepare('SELECT banners FROM store_customizations WHERE 1=0').get();
        hasBannersColumn = true;
        console.log('✅ Coluna banners existe');
      } catch (checkError) {
        // Se der erro, provavelmente a coluna não existe
        hasBannersColumn = false;
        console.log('⚠️ Coluna banners não encontrada, será omitida da query:', checkError.message);
      }
    }
    
    // Verificar quais colunas realmente existem na tabela (PostgreSQL)
    let availableColumns = [];
    if (!isSQLite()) {
      try {
        console.log('🔍 Verificando colunas disponíveis na tabela...');
        const dbInstance = getDb();
        
        if (typeof dbInstance.query !== 'function') {
          console.warn('⚠️ Método query não disponível, assumindo que todas as colunas existem');
          availableColumns = null;
        } else {
          const columnCheck = await dbInstance.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'store_customizations'
          `);
          availableColumns = columnCheck.rows.map(row => row.column_name);
          console.log('📋 Colunas disponíveis na tabela:', availableColumns);
          console.log('📊 Total de colunas encontradas:', availableColumns.length);
        }
      } catch (checkError) {
        console.error('❌ Erro ao verificar colunas disponíveis:', checkError);
        console.error('❌ Detalhes do erro:', {
          message: checkError.message,
          code: checkError.code,
          stack: checkError.stack
        });
        // Se não conseguir verificar, assumir que todas existem (comportamento padrão)
        availableColumns = null;
        console.warn('⚠️ Assumindo que todas as colunas existem devido ao erro');
      }
    } else {
      console.log('ℹ️ SQLite detectado, todas as colunas devem existir');
    }
    
    // Função auxiliar para verificar se uma coluna existe
    const columnExists = (columnName) => {
      if (isSQLite()) {
        console.log(`✓ SQLite: assumindo que coluna ${columnName} existe`);
        return true; // SQLite sempre tem todas as colunas
      }
      if (!availableColumns || availableColumns.length === 0) {
        console.warn(`⚠️ Não foi possível verificar colunas, assumindo que ${columnName} existe`);
        return true; // Se não conseguiu verificar, assumir que existe
      }
      const exists = availableColumns.includes(columnName);
      console.log(`${exists ? '✓' : '✗'} Coluna ${columnName}: ${exists ? 'existe' : 'NÃO existe'}`);
      return exists;
    };
    
    // Verificar se já existe customização
    const existing = await db.prepare('SELECT id FROM store_customizations WHERE store_id = ?').get(store.id);
    
    console.log('Customização existente?', !!existing);
    
    if (existing) {
      console.log('Atualizando customização existente...');
      // Atualizar
      try {
        // Construir query dinamicamente baseado nas colunas que realmente existem
        const updateFields = [];
        const updateValues = [];
        
        // Adicionar apenas colunas que existem
        if (columnExists('primary_color')) {
          updateFields.push('primary_color = ?');
          updateValues.push(normalizedPrimaryColor);
        }
        if (columnExists('secondary_color')) {
          updateFields.push('secondary_color = ?');
          updateValues.push(normalizedSecondaryColor);
        }
        if (columnExists('background_color')) {
          updateFields.push('background_color = ?');
          updateValues.push(normalizedBackgroundColor);
        }
        if (columnExists('text_color')) {
          updateFields.push('text_color = ?');
          updateValues.push(normalizedTextColor);
        }
        if (columnExists('header_color')) {
          updateFields.push('header_color = ?');
          updateValues.push(normalizedHeaderColor);
        }
        if (columnExists('categories_bar_color')) {
          updateFields.push('categories_bar_color = ?');
          updateValues.push(normalizedCategoriesBarColor);
        }
        if (columnExists('footer_color')) {
          updateFields.push('footer_color = ?');
          updateValues.push(normalizedFooterColor);
        }
        if (columnExists('product_price_color')) {
          updateFields.push('product_price_color = ?');
          updateValues.push(normalizedProductPriceColor);
        }
        if (columnExists('product_button_color')) {
          updateFields.push('product_button_color = ?');
          updateValues.push(normalizedProductButtonColor);
        }
        if (columnExists('categories_card_bg_color')) {
          updateFields.push('categories_card_bg_color = ?');
          updateValues.push(normalizedCategoriesCardBgColor);
        }
        if (columnExists('banner_image')) {
          updateFields.push('banner_image = ?');
          updateValues.push(banner_image || null);
        }
        if (columnExists('banner_text')) {
          updateFields.push('banner_text = ?');
          updateValues.push(banner_text || null);
        }
        if (columnExists('banners') && hasBannersColumn) {
          updateFields.push('banners = ?');
          updateValues.push(bannersJson);
        }
        if (columnExists('banner_enabled')) {
          updateFields.push('banner_enabled = ?');
          updateValues.push(banner_enabled !== undefined ? (isSQLite() ? (banner_enabled ? 1 : 0) : banner_enabled) : true);
        }
        if (columnExists('about_section_enabled')) {
          updateFields.push('about_section_enabled = ?');
          updateValues.push(about_section_enabled !== undefined ? (isSQLite() ? (about_section_enabled ? 1 : 0) : about_section_enabled) : true);
        }
        if (columnExists('about_text')) {
          updateFields.push('about_text = ?');
          updateValues.push(about_text || null);
        }
        if (columnExists('featured_section_enabled')) {
          updateFields.push('featured_section_enabled = ?');
          updateValues.push(featured_section_enabled !== undefined ? (isSQLite() ? (featured_section_enabled ? 1 : 0) : featured_section_enabled) : true);
        }
        if (columnExists('categories_section_enabled')) {
          updateFields.push('categories_section_enabled = ?');
          updateValues.push(categories_section_enabled !== undefined ? (isSQLite() ? (categories_section_enabled ? 1 : 0) : categories_section_enabled) : true);
        }
        if (columnExists('contact_section_enabled')) {
          updateFields.push('contact_section_enabled = ?');
          updateValues.push(contact_section_enabled !== undefined ? (isSQLite() ? (contact_section_enabled ? 1 : 0) : contact_section_enabled) : true);
        }
        if (columnExists('instagram_url')) {
          updateFields.push('instagram_url = ?');
          updateValues.push(instagram_url || null);
        }
        if (columnExists('facebook_url')) {
          updateFields.push('facebook_url = ?');
          updateValues.push(facebook_url || null);
        }
        if (columnExists('whatsapp_number')) {
          updateFields.push('whatsapp_number = ?');
          updateValues.push(whatsapp_number || null);
        }
        if (columnExists('layout_style')) {
          updateFields.push('layout_style = ?');
          updateValues.push(layout_style || 'modern');
        }
        if (columnExists('show_search')) {
          updateFields.push('show_search = ?');
          updateValues.push(show_search !== undefined ? (isSQLite() ? (show_search ? 1 : 0) : show_search) : true);
        }
        if (columnExists('show_categories')) {
          updateFields.push('show_categories = ?');
          updateValues.push(show_categories !== undefined ? (isSQLite() ? (show_categories ? 1 : 0) : show_categories) : true);
        }
        
        // Sempre atualizar updated_at
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        
        console.log('📝 Campos a atualizar:', updateFields);
        console.log('📝 Valores:', updateValues);
        
        if (updateFields.length === 0) {
          throw new Error('Nenhum campo disponível para atualizar');
        }
        
        const updateQuery = `
          UPDATE store_customizations 
          SET ${updateFields.join(', ')}
          WHERE store_id = ?
        `;
        
        console.log('📤 Query de atualização:', updateQuery);
        console.log('📤 Parâmetros:', [...updateValues, store.id]);
        
        try {
          await db.prepare(updateQuery).run(...updateValues, store.id);
          console.log('✅ Customização atualizada com sucesso');
        } catch (queryError) {
          console.error('❌ Erro na execução da query UPDATE:', queryError);
          console.error('❌ Query:', updateQuery);
          console.error('❌ Values:', updateValues);
          throw queryError;
        }
      } catch (updateError) {
        console.error('❌ Erro ao atualizar customização:', updateError);
        throw updateError;
      }
    } else {
      console.log('Criando nova customização...');
      // Criar
      const id = uuidv4();
      try {
        // Construir query INSERT dinamicamente baseado nas colunas que existem
        const insertFields = ['id', 'store_id'];
        const insertValues = [id, store.id];
        
        // Adicionar apenas colunas que existem
        if (columnExists('primary_color')) {
          insertFields.push('primary_color');
          insertValues.push(normalizedPrimaryColor);
        }
        if (columnExists('secondary_color')) {
          insertFields.push('secondary_color');
          insertValues.push(normalizedSecondaryColor);
        }
        if (columnExists('background_color')) {
          insertFields.push('background_color');
          insertValues.push(normalizedBackgroundColor);
        }
        if (columnExists('text_color')) {
          insertFields.push('text_color');
          insertValues.push(normalizedTextColor);
        }
        if (columnExists('header_color')) {
          insertFields.push('header_color');
          insertValues.push(normalizedHeaderColor);
        }
        if (columnExists('categories_bar_color')) {
          insertFields.push('categories_bar_color');
          insertValues.push(normalizedCategoriesBarColor);
        }
        if (columnExists('footer_color')) {
          insertFields.push('footer_color');
          insertValues.push(normalizedFooterColor);
        }
        if (columnExists('product_price_color')) {
          insertFields.push('product_price_color');
          insertValues.push(normalizedProductPriceColor);
        }
        if (columnExists('product_button_color')) {
          insertFields.push('product_button_color');
          insertValues.push(normalizedProductButtonColor);
        }
        if (columnExists('categories_card_bg_color')) {
          insertFields.push('categories_card_bg_color');
          insertValues.push(normalizedCategoriesCardBgColor);
        }
        if (columnExists('banner_image')) {
          insertFields.push('banner_image');
          insertValues.push(banner_image || null);
        }
        if (columnExists('banner_text')) {
          insertFields.push('banner_text');
          insertValues.push(banner_text || null);
        }
        if (columnExists('banners') && hasBannersColumn) {
          insertFields.push('banners');
          insertValues.push(bannersJson);
        }
        if (columnExists('banner_enabled')) {
          insertFields.push('banner_enabled');
          insertValues.push(banner_enabled !== undefined ? (isSQLite() ? (banner_enabled ? 1 : 0) : banner_enabled) : true);
        }
        if (columnExists('about_section_enabled')) {
          insertFields.push('about_section_enabled');
          insertValues.push(about_section_enabled !== undefined ? (isSQLite() ? (about_section_enabled ? 1 : 0) : about_section_enabled) : true);
        }
        if (columnExists('about_text')) {
          insertFields.push('about_text');
          insertValues.push(about_text || null);
        }
        if (columnExists('featured_section_enabled')) {
          insertFields.push('featured_section_enabled');
          insertValues.push(featured_section_enabled !== undefined ? (isSQLite() ? (featured_section_enabled ? 1 : 0) : featured_section_enabled) : true);
        }
        if (columnExists('categories_section_enabled')) {
          insertFields.push('categories_section_enabled');
          insertValues.push(categories_section_enabled !== undefined ? (isSQLite() ? (categories_section_enabled ? 1 : 0) : categories_section_enabled) : true);
        }
        if (columnExists('contact_section_enabled')) {
          insertFields.push('contact_section_enabled');
          insertValues.push(contact_section_enabled !== undefined ? (isSQLite() ? (contact_section_enabled ? 1 : 0) : contact_section_enabled) : true);
        }
        if (columnExists('instagram_url')) {
          insertFields.push('instagram_url');
          insertValues.push(instagram_url || null);
        }
        if (columnExists('facebook_url')) {
          insertFields.push('facebook_url');
          insertValues.push(facebook_url || null);
        }
        if (columnExists('whatsapp_number')) {
          insertFields.push('whatsapp_number');
          insertValues.push(whatsapp_number || null);
        }
        if (columnExists('layout_style')) {
          insertFields.push('layout_style');
          insertValues.push(layout_style || 'modern');
        }
        if (columnExists('show_search')) {
          insertFields.push('show_search');
          insertValues.push(show_search !== undefined ? (isSQLite() ? (show_search ? 1 : 0) : show_search) : true);
        }
        if (columnExists('show_categories')) {
          insertFields.push('show_categories');
          insertValues.push(show_categories !== undefined ? (isSQLite() ? (show_categories ? 1 : 0) : show_categories) : true);
        }
        
        console.log('📝 Campos a inserir:', insertFields);
        console.log('📝 Valores:', insertValues);
        
        if (insertFields.length < 2) {
          throw new Error('Nenhum campo disponível para inserir');
        }
        
        const placeholders = insertFields.map(() => '?').join(', ');
        const insertQuery = `
          INSERT INTO store_customizations (
            ${insertFields.join(', ')}
          ) VALUES (${placeholders})
        `;
        
        console.log('📤 Query de inserção:', insertQuery);
        console.log('📤 Parâmetros:', insertValues);
        
        try {
          await db.prepare(insertQuery).run(...insertValues);
          console.log('✅ Customização criada com sucesso');
        } catch (queryError) {
          console.error('❌ Erro na execução da query INSERT:', queryError);
          console.error('❌ Query:', insertQuery);
          console.error('❌ Values:', insertValues);
          throw queryError;
        }
      } catch (createError) {
        console.error('❌ Erro ao criar customização:', createError);
        throw createError;
      }
    }
    
    // Retornar customização atualizada
    console.log('Buscando customização atualizada...');
    const updated = await db.prepare('SELECT * FROM store_customizations WHERE store_id = ?').get(store.id);
    
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
    console.error('❌ Erro ao salvar customizações:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    console.error('❌ Error hint:', error.hint);
    
    // Mensagem de erro mais amigável
    let errorMessage = 'Erro ao salvar customizações';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.detail) {
      errorMessage = error.detail;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack
      } : undefined
    });
  }
});

export default router;

