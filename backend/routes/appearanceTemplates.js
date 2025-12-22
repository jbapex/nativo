import express from 'express';
import { getDb, isSQLite } from '../database/db-wrapper.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar todos os templates (públicos ou do usuário)
// Permitir acesso sem autenticação para listar templates públicos
router.get('/', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user?.id;
    
    // Verificar se a tabela existe
    let tableExists = false;
    try {
      if (isSQLite()) {
        const result = db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='appearance_templates'
        `).get();
        tableExists = !!result;
      } else {
        const result = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'appearance_templates'
          )
        `);
        tableExists = result.rows?.[0]?.exists || result[0]?.exists || false;
      }
    } catch (checkError) {
      console.error('Erro ao verificar tabela:', checkError);
    }
    
    // Se a tabela não existe, retornar array vazio
    if (!tableExists) {
      console.warn('⚠️ Tabela appearance_templates não existe. Execute as migrações.');
      return res.json([]);
    }
    
    let templates;
    if (isSQLite()) {
      templates = db.prepare(`
        SELECT * FROM appearance_templates 
        WHERE is_public = 1 OR created_by = ?
        ORDER BY is_default DESC, usage_count DESC, created_at DESC
      `).all(userId || null);
    } else {
      const result = await db.query(`
        SELECT * FROM appearance_templates 
        WHERE is_public = true OR created_by = $1
        ORDER BY is_default DESC, usage_count DESC, created_at DESC
      `, [userId || null]);
      templates = result.rows || result;
    }
    
    res.json(Array.isArray(templates) ? templates : []);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao listar templates', details: error.message });
  }
});

// Obter template por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user?.id;
    
    let template;
    if (isSQLite()) {
      template = db.prepare(`
        SELECT * FROM appearance_templates 
        WHERE id = ? AND (is_public = 1 OR created_by = ?)
      `).get(id, userId || null);
    } else {
      const result = await db.query(`
        SELECT * FROM appearance_templates 
        WHERE id = $1 AND (is_public = true OR created_by = $2)
      `, [id, userId || null]);
      template = result.rows?.[0] || result[0];
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Erro ao obter template:', error);
    res.status(500).json({ error: 'Erro ao obter template' });
  }
});

// Criar novo template
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    console.log('📝 Criando template - User:', req.user?.id, 'Role:', req.user?.role);
    const db = getDb();
    const userId = req.user?.id;
    const {
      name,
      description,
      category = 'default',
      thumbnail,
      primary_color = '#2563eb',
      secondary_color = '#06b6d4',
      accent_color = '#10b981',
      background_color = '#ffffff',
      text_color = '#1f2937',
      header_color = '#ffffff',
      footer_color = '#f9fafb',
      button_primary_color = '#2563eb',
      button_secondary_color = '#06b6d4',
      button_text_color = '#ffffff',
      link_color = '#2563eb',
      link_hover_color = '#1d4ed8',
      card_background_color = '#ffffff',
      card_border_color = '#e5e7eb',
      card_shadow_color = 'rgba(0, 0, 0, 0.1)',
      input_background_color = '#ffffff',
      input_border_color = '#d1d5db',
      input_focus_color = '#2563eb',
      layout_style = 'modern',
      border_radius = '8px',
      font_family = 'system-ui',
      logo,
      favicon,
      hero_title,
      hero_subtitle,
      hero_image,
      is_public = true
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome do template é obrigatório' });
    }
    
    const id = isSQLite() ? uuidv4() : uuidv4();
    
    if (isSQLite()) {
      db.prepare(`
        INSERT INTO appearance_templates (
          id, name, description, category, thumbnail,
          primary_color, secondary_color, accent_color, background_color, text_color,
          header_color, footer_color,
          button_primary_color, button_secondary_color, button_text_color,
          link_color, link_hover_color,
          card_background_color, card_border_color, card_shadow_color,
          input_background_color, input_border_color, input_focus_color,
          layout_style, border_radius, font_family,
          logo, favicon, hero_title, hero_subtitle, hero_image,
          is_public, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, name, description || null, category, thumbnail || null,
        primary_color, secondary_color, accent_color, background_color, text_color,
        header_color, footer_color,
        button_primary_color, button_secondary_color, button_text_color,
        link_color, link_hover_color,
        card_background_color, card_border_color, card_shadow_color,
        input_background_color, input_border_color, input_focus_color,
        layout_style, border_radius, font_family,
        logo || null, favicon || null, hero_title || null, hero_subtitle || null, hero_image || null,
        is_public ? 1 : 0, userId || null
      );
    } else {
      await db.query(`
        INSERT INTO appearance_templates (
          id, name, description, category, thumbnail,
          primary_color, secondary_color, accent_color, background_color, text_color,
          header_color, footer_color,
          button_primary_color, button_secondary_color, button_text_color,
          link_color, link_hover_color,
          card_background_color, card_border_color, card_shadow_color,
          input_background_color, input_border_color, input_focus_color,
          layout_style, border_radius, font_family,
          logo, favicon, hero_title, hero_subtitle, hero_image,
          is_public, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
      `, [
        id, name, description || null, category, thumbnail || null,
        primary_color, secondary_color, accent_color, background_color, text_color,
        header_color, footer_color,
        button_primary_color, button_secondary_color, button_text_color,
        link_color, link_hover_color,
        card_background_color, card_border_color, card_shadow_color,
        input_background_color, input_border_color, input_focus_color,
        layout_style, border_radius, font_family,
        logo || null, favicon || null, hero_title || null, hero_subtitle || null, hero_image || null,
        is_public, userId || null
      ]);
    }
    
    res.status(201).json({ id, message: 'Template criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// Atualizar template
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verificar se o template existe e se o usuário tem permissão
    let template;
    if (isSQLite()) {
      template = db.prepare('SELECT * FROM appearance_templates WHERE id = ?').get(id);
    } else {
      const result = await db.query('SELECT * FROM appearance_templates WHERE id = $1', [id]);
      template = result.rows?.[0] || result[0];
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    // Verificar se o usuário é o criador ou admin
    const isOwner = template.created_by === userId;
    const isAdmin = req.user?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para editar este template' });
    }
    
    const {
      name,
      description,
      category,
      thumbnail,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      text_color,
      header_color,
      footer_color,
      button_primary_color,
      button_secondary_color,
      button_text_color,
      link_color,
      link_hover_color,
      card_background_color,
      card_border_color,
      card_shadow_color,
      input_background_color,
      input_border_color,
      input_focus_color,
      layout_style,
      border_radius,
      font_family,
      logo,
      favicon,
      hero_title,
      hero_subtitle,
      hero_image,
      is_public
    } = req.body;
    
    if (isSQLite()) {
      db.prepare(`
        UPDATE appearance_templates SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          thumbnail = COALESCE(?, thumbnail),
          primary_color = COALESCE(?, primary_color),
          secondary_color = COALESCE(?, secondary_color),
          accent_color = COALESCE(?, accent_color),
          background_color = COALESCE(?, background_color),
          text_color = COALESCE(?, text_color),
          header_color = COALESCE(?, header_color),
          footer_color = COALESCE(?, footer_color),
          button_primary_color = COALESCE(?, button_primary_color),
          button_secondary_color = COALESCE(?, button_secondary_color),
          button_text_color = COALESCE(?, button_text_color),
          link_color = COALESCE(?, link_color),
          link_hover_color = COALESCE(?, link_hover_color),
          card_background_color = COALESCE(?, card_background_color),
          card_border_color = COALESCE(?, card_border_color),
          card_shadow_color = COALESCE(?, card_shadow_color),
          input_background_color = COALESCE(?, input_background_color),
          input_border_color = COALESCE(?, input_border_color),
          input_focus_color = COALESCE(?, input_focus_color),
          layout_style = COALESCE(?, layout_style),
          border_radius = COALESCE(?, border_radius),
          font_family = COALESCE(?, font_family),
          logo = COALESCE(?, logo),
          favicon = COALESCE(?, favicon),
          hero_title = COALESCE(?, hero_title),
          hero_subtitle = COALESCE(?, hero_subtitle),
          hero_image = COALESCE(?, hero_image),
          is_public = COALESCE(?, is_public),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name, description, category, thumbnail,
        primary_color, secondary_color, accent_color, background_color, text_color,
        header_color, footer_color,
        button_primary_color, button_secondary_color, button_text_color,
        link_color, link_hover_color,
        card_background_color, card_border_color, card_shadow_color,
        input_background_color, input_border_color, input_focus_color,
        layout_style, border_radius, font_family,
        logo, favicon, hero_title, hero_subtitle, hero_image,
        is_public !== undefined ? (is_public ? 1 : 0) : null,
        id
      );
    } else {
      await db.query(`
        UPDATE appearance_templates SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          thumbnail = COALESCE($4, thumbnail),
          primary_color = COALESCE($5, primary_color),
          secondary_color = COALESCE($6, secondary_color),
          accent_color = COALESCE($7, accent_color),
          background_color = COALESCE($8, background_color),
          text_color = COALESCE($9, text_color),
          header_color = COALESCE($10, header_color),
          footer_color = COALESCE($11, footer_color),
          button_primary_color = COALESCE($12, button_primary_color),
          button_secondary_color = COALESCE($13, button_secondary_color),
          button_text_color = COALESCE($14, button_text_color),
          link_color = COALESCE($15, link_color),
          link_hover_color = COALESCE($16, link_hover_color),
          card_background_color = COALESCE($17, card_background_color),
          card_border_color = COALESCE($18, card_border_color),
          card_shadow_color = COALESCE($19, card_shadow_color),
          input_background_color = COALESCE($20, input_background_color),
          input_border_color = COALESCE($21, input_border_color),
          input_focus_color = COALESCE($22, input_focus_color),
          layout_style = COALESCE($23, layout_style),
          border_radius = COALESCE($24, border_radius),
          font_family = COALESCE($25, font_family),
          logo = COALESCE($26, logo),
          favicon = COALESCE($27, favicon),
          hero_title = COALESCE($28, hero_title),
          hero_subtitle = COALESCE($29, hero_subtitle),
          hero_image = COALESCE($30, hero_image),
          is_public = COALESCE($31, is_public),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $32
      `, [
        name, description, category, thumbnail,
        primary_color, secondary_color, accent_color, background_color, text_color,
        header_color, footer_color,
        button_primary_color, button_secondary_color, button_text_color,
        link_color, link_hover_color,
        card_background_color, card_border_color, card_shadow_color,
        input_background_color, input_border_color, input_focus_color,
        layout_style, border_radius, font_family,
        logo, favicon, hero_title, hero_subtitle, hero_image,
        is_public, id
      ]);
    }
    
    res.json({ message: 'Template atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// Deletar template
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verificar se o template existe e se o usuário tem permissão
    let template;
    if (isSQLite()) {
      template = db.prepare('SELECT * FROM appearance_templates WHERE id = ?').get(id);
    } else {
      const result = await db.query('SELECT * FROM appearance_templates WHERE id = $1', [id]);
      template = result.rows?.[0] || result[0];
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    // Não permitir deletar templates padrão do sistema
    if (template.is_default) {
      return res.status(403).json({ error: 'Não é possível deletar templates padrão do sistema' });
    }
    
    // Verificar se o usuário é o criador ou admin
    const isOwner = template.created_by === userId;
    const isAdmin = req.user?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para deletar este template' });
    }
    
    if (isSQLite()) {
      db.prepare('DELETE FROM appearance_templates WHERE id = ?').run(id);
    } else {
      await db.query('DELETE FROM appearance_templates WHERE id = $1', [id]);
    }
    
    res.json({ message: 'Template deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    res.status(500).json({ error: 'Erro ao deletar template' });
  }
});

// Aplicar template (incrementa usage_count)
router.post('/:id/apply', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Verificar se o template existe
    let template;
    if (isSQLite()) {
      template = db.prepare('SELECT * FROM appearance_templates WHERE id = ?').get(id);
    } else {
      const result = await db.query('SELECT * FROM appearance_templates WHERE id = $1', [id]);
      template = result.rows?.[0] || result[0];
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    // Incrementar contador de uso
    if (isSQLite()) {
      db.prepare('UPDATE appearance_templates SET usage_count = usage_count + 1 WHERE id = ?').run(id);
    } else {
      await db.query('UPDATE appearance_templates SET usage_count = usage_count + 1 WHERE id = $1', [id]);
    }
    
    // Retornar dados do template para aplicar nas configurações
    res.json(template);
  } catch (error) {
    console.error('Erro ao aplicar template:', error);
    res.status(500).json({ error: 'Erro ao aplicar template' });
  }
});

export default router;

