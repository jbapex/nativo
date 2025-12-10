import express from 'express';
import { db } from '../database/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar cidades
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Primeiro, construir a query base para filtrar cidades
    let baseQuery = 'SELECT c.id, c.name, c.state, c.active, c.is_imported, c.created_at FROM cities c WHERE 1=1';
    const params = [];

    // Mostrar apenas cidades adicionadas manualmente (não importadas)
    // Admin pode ver todas se passar ?include_imported=true
    if (req.query.include_imported !== 'true') {
      // Filtrar cidades não importadas (NULL ou false)
      // PostgreSQL: usar CAST para garantir comparação correta
      baseQuery += ' AND (c.is_imported IS NULL OR c.is_imported = false)';
    }

    if (req.query.active !== undefined) {
      // Converter string para boolean corretamente
      const activeValue = req.query.active === 'true' || req.query.active === true;
      baseQuery += ' AND c.active = ?';
      params.push(activeValue);
    } else {
      // Se não especificar, mostrar todas (admin pode ver inativas)
      if (req.user?.role !== 'admin') {
        baseQuery += ' AND c.active = true';
      }
    }

    baseQuery += ' ORDER BY c.name ASC';

    const cities = await db.prepare(baseQuery).all(...params);
    
    // Para cada cidade, buscar contagens de lojas e produtos
    const citiesWithCounts = await Promise.all(cities.map(async (city) => {
      try {
        // Contar lojas aprovadas
        const storesResult = await db.prepare(`
          SELECT COUNT(*) as count 
          FROM stores 
          WHERE city_id = ? AND status = 'approved'
        `).get(city.id);
        const storesCount = parseInt(storesResult?.count || 0);

        // Contar produtos ativos (apenas de lojas aprovadas)
        const productsResult = await db.prepare(`
          SELECT COUNT(DISTINCT p.id) as count
          FROM products p
          INNER JOIN stores s ON p.store_id = s.id
          WHERE s.city_id = ? AND s.status = 'approved' AND p.active = true
        `).get(city.id);
        const productsCount = parseInt(productsResult?.count || 0);

        return {
          ...city,
          stores_count: storesCount,
          products_count: productsCount
        };
      } catch (countError) {
        console.error(`Erro ao contar lojas/produtos para cidade ${city.id}:`, countError);
        return {
          ...city,
          stores_count: 0,
          products_count: 0
        };
      }
    }));
    
    res.json(citiesWithCounts);
  } catch (error) {
    console.error('Erro ao listar cidades:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    // Se for erro de coluna não encontrada, tentar sem o filtro is_imported
    if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
      console.log('Tentando novamente sem filtro is_imported...');
      try {
        let fallbackQuery = 'SELECT c.id, c.name, c.state, c.active, c.created_at FROM cities c WHERE 1=1';
        const fallbackParams = [];
        
        if (req.query.active !== undefined) {
          const activeValue = req.query.active === 'true' || req.query.active === true;
          fallbackQuery += ' AND c.active = ?';
          fallbackParams.push(activeValue);
        } else {
          if (req.user?.role !== 'admin') {
            fallbackQuery += ' AND c.active = true';
          }
        }
        
        fallbackQuery += ' ORDER BY c.name ASC';
        const cities = await db.prepare(fallbackQuery).all(...fallbackParams);
        
        const citiesWithCounts = await Promise.all(cities.map(async (city) => {
          try {
            const storesResult = await db.prepare(`
              SELECT COUNT(*) as count 
              FROM stores 
              WHERE city_id = ? AND status = 'approved'
            `).get(city.id);
            const storesCount = parseInt(storesResult?.count || 0);

            const productsResult = await db.prepare(`
              SELECT COUNT(DISTINCT p.id) as count
              FROM products p
              INNER JOIN stores s ON p.store_id = s.id
              WHERE s.city_id = ? AND s.status = 'approved' AND p.active = true
            `).get(city.id);
            const productsCount = parseInt(productsResult?.count || 0);

            return {
              ...city,
              stores_count: storesCount,
              products_count: productsCount
            };
          } catch (countError) {
            return {
              ...city,
              stores_count: 0,
              products_count: 0
            };
          }
        }));
        
        return res.json(citiesWithCounts);
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    }
    
    res.status(500).json({ error: 'Erro ao listar cidades', details: error.message });
  }
});

// Obter cidade por ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da cidade é obrigatório' });
    }

    const city = await db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as stores_count,
        COUNT(DISTINCT p.id) as products_count
      FROM cities c
      LEFT JOIN stores s ON s.city_id = c.id AND s.status = 'approved'
      LEFT JOIN products p ON p.store_id = s.id AND p.active = true
      WHERE c.id = ?
      GROUP BY c.id
    `).get(req.params.id);
    
    if (!city) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    // Converter contagens para números
    city.stores_count = parseInt(city.stores_count) || 0;
    city.products_count = parseInt(city.products_count) || 0;

    res.json(city);
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    res.status(500).json({ error: 'Erro ao buscar cidade' });
  }
});

// Criar cidade (admin apenas)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, state, active, is_imported } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const id = uuidv4();

    await db.prepare(`
      INSERT INTO cities (id, name, state, active, is_imported)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      state || '',
      active !== undefined ? (active ? true : false) : true,
      is_imported !== undefined ? (is_imported ? true : false) : false
    );

    const city = await db.prepare('SELECT * FROM cities WHERE id = ?').get(id);
    res.status(201).json(city);
  } catch (error) {
    console.error('Erro ao criar cidade:', error);
    res.status(500).json({ error: 'Erro ao criar cidade' });
  }
});

// Atualizar cidade (admin apenas)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da cidade é obrigatório' });
    }

    const city = await db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    
    if (!city) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    const { name, state, active } = req.body;
    
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (state !== undefined) { updates.push('state = ?'); values.push(state); }
    if (active !== undefined) { updates.push('active = ?'); values.push(active ? true : false); }

    values.push(req.params.id);

    await db.prepare(`
      UPDATE cities 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updated = await db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar cidade' });
  }
});

// Deletar múltiplas cidades em massa (admin apenas)
// IMPORTANTE: Esta rota deve vir ANTES da rota /:id para evitar conflito
router.delete('/bulk', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs é obrigatória' });
    }

    // Deletar cidades em lote
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.prepare(`DELETE FROM cities WHERE id IN (${placeholders})`).run(...ids);
    
    res.json({ 
      message: `${result.changes || ids.length} cidade(s) deletada(s) com sucesso`,
      deleted: result.changes || ids.length
    });
  } catch (error) {
    console.error('Erro ao deletar cidades em massa:', error);
    res.status(500).json({ error: 'Erro ao deletar cidades em massa', details: error.message });
  }
});

// Deletar todas as cidades importadas (admin apenas)
router.delete('/imported/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM cities WHERE is_imported = true').run();
    res.json({ 
      message: `${result.changes} cidade(s) importada(s) deletada(s) com sucesso`,
      deleted: result.changes
    });
  } catch (error) {
    console.error('Erro ao deletar cidades importadas:', error);
    res.status(500).json({ error: 'Erro ao deletar cidades importadas' });
  }
});

// Deletar cidade (admin apenas)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Validar ID
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID da cidade é obrigatório' });
    }

    const city = await db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);
    
    if (!city) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }

    await db.prepare('DELETE FROM cities WHERE id = ?').run(req.params.id);
    res.json({ message: 'Cidade deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cidade:', error);
    res.status(500).json({ error: 'Erro ao deletar cidade' });
  }
});

export default router;

