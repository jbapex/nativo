import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Obter todas as configurações (público, mas pode filtrar por categoria)
router.get('/', optionalAuth, async (req, res) => {
  try {
    let query = 'SELECT * FROM settings WHERE 1=1';
    const params = [];

    if (req.query.category) {
      query += ' AND category = ?';
      params.push(req.query.category);
    }

    query += ' ORDER BY category, key';

    const settings = await db.prepare(query).all(...params);
    
    // Converter para objeto chave-valor
    const settingsObj = {};
    if (Array.isArray(settings)) {
      settings.forEach(setting => {
        settingsObj[setting.key] = {
          value: setting.value,
          category: setting.category,
          description: setting.description
        };
      });
    }

    res.json(settingsObj);
  } catch (error) {
    console.error('Erro ao listar configurações:', error);
    res.status(500).json({ error: 'Erro ao listar configurações' });
  }
});

// Obter configuração específica
router.get('/:key', optionalAuth, async (req, res) => {
  try {
    const setting = await db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    
    if (!setting) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
});

// Criar ou atualizar configuração (admin apenas)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { key, value, category, description } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Chave é obrigatória' });
    }

    // Verificar se já existe
    const existing = await db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

    if (existing) {
      // Atualizar
      await db.prepare(`
        UPDATE settings 
        SET value = ?, category = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `).run(
        value || '',
        category || 'general',
        description || '',
        key
      );
    } else {
      // Criar
      const id = uuidv4();
      await db.prepare(`
        INSERT INTO settings (id, key, value, category, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        id,
        key,
        value || '',
        category || 'general',
        description || ''
      );
    }

    const setting = await db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    res.json(setting);
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({ error: 'Erro ao salvar configuração' });
  }
});

// Atualizar múltiplas configurações (admin apenas)
router.put('/bulk', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { settings: settingsData } = req.body;

    if (!settingsData || typeof settingsData !== 'object') {
      return res.status(400).json({ error: 'Dados de configurações inválidos' });
    }

    const updateStmt = db.prepare(`
      UPDATE settings 
      SET value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `);

    const insertStmt = db.prepare(`
      INSERT INTO settings (id, key, value, category, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Executar todas as atualizações/inserções
    for (const [key, data] of Object.entries(settingsData)) {
      const existing = await db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
      
      if (existing) {
        await updateStmt.run(
          typeof data === 'object' ? (data.value || '') : data,
          key
        );
      } else {
        await insertStmt.run(
          uuidv4(),
          key,
          typeof data === 'object' ? (data.value || '') : data,
          typeof data === 'object' ? (data.category || 'general') : 'general',
          typeof data === 'object' ? (data.description || '') : ''
        );
      }
    }

    const allSettings = await db.prepare('SELECT * FROM settings').all();
    const settingsObj = {};
    if (Array.isArray(allSettings)) {
      allSettings.forEach(setting => {
        settingsObj[setting.key] = {
          value: setting.value,
          category: setting.category,
          description: setting.description
        };
      });
    }

    res.json(settingsObj);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// Deletar configuração (admin apenas)
router.delete('/:key', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const setting = await db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    
    if (!setting) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    await db.prepare('DELETE FROM settings WHERE key = ?').run(req.params.key);
    res.json({ message: 'Configuração deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar configuração:', error);
    res.status(500).json({ error: 'Erro ao deletar configuração' });
  }
});

export default router;

