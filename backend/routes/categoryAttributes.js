import express from 'express';
import { db } from '../database/db.js';
import { isSQLite } from '../database/db-wrapper.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Listar atributos de uma categoria (público – usado para filtros e formulário)
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId é obrigatório' });
    }

    console.log('Buscando atributos para categoria:', categoryId);
    
    let attrs = [];
    try {
      attrs = await db
        .prepare(
          'SELECT * FROM category_attributes WHERE category_id = ? ORDER BY order_index ASC, created_at ASC'
        )
        .all(categoryId);
    } catch (queryError) {
      // Se for erro de tabela não encontrada, retornar array vazio
      if (queryError.message?.includes('does not exist') || 
          queryError.message?.includes('no such table') ||
          queryError.code === '42P01') {
        console.warn('Tabela category_attributes não existe ainda, retornando array vazio');
        return res.json([]);
      }
      // Se for outro erro, relançar
      throw queryError;
    }

    console.log('Atributos encontrados:', attrs?.length || 0);

    // Garantir que options seja JSON parseado
    const parsed = (attrs || []).map((attr) => ({
      ...attr,
      options: attr.options ? (() => {
        try {
          // Se já for um array, retornar direto
          if (Array.isArray(attr.options)) {
            return attr.options;
          }
          // Se for string, tentar parsear
          if (typeof attr.options === 'string') {
            return JSON.parse(attr.options);
          }
          return null;
        } catch (e) {
          console.warn('Erro ao parsear options do atributo:', attr.id, e.message);
          return null;
        }
      })() : null,
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Erro ao listar atributos de categoria:', error);
    console.error('Stack:', error.stack);
    console.error('Mensagem completa:', error.message);
    console.error('Código do erro:', error.code);
    
    // Se for erro de tabela não encontrada, retornar array vazio
    const isTableNotFound = 
      error.message?.includes('does not exist') || 
      error.message?.includes('no such table') ||
      error.code === '42P01' || // PostgreSQL: relation does not exist
      error.code === 'SQLITE_ERROR';
    
    if (isTableNotFound) {
      console.warn('Tabela category_attributes não existe, retornando array vazio');
      return res.json([]);
    }
    
    res.status(500).json({ 
      error: 'Erro ao listar atributos de categoria',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Listar atributos filtráveis de uma categoria (para filtros laterais)
router.get('/category/:categoryId/filterable', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId é obrigatório' });
    }

    // Usar comparação correta baseada no tipo de banco
    const filterableCondition = isSQLite() ? 'is_filterable = 1' : 'is_filterable = true';
    
    const attrs = await db
      .prepare(
        `SELECT * FROM category_attributes WHERE category_id = ? AND ${filterableCondition} ORDER BY order_index ASC, created_at ASC`
      )
      .all(categoryId);

    const parsed = (attrs || []).map((attr) => ({
      ...attr,
      options: attr.options ? (() => {
        try {
          if (Array.isArray(attr.options)) {
            return attr.options;
          }
          if (typeof attr.options === 'string') {
            return JSON.parse(attr.options);
          }
          return null;
        } catch (e) {
          console.warn('Erro ao parsear options do atributo:', attr.id, e.message);
          return null;
        }
      })() : null,
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Erro ao listar atributos filtráveis:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar atributos filtráveis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rotas abaixo: apenas admin (poderíamos mais tarde liberar para lojista configurar suas categorias próprias)
router.use(authenticateToken, requireRole('admin'));

// Criar atributo
router.post('/', async (req, res) => {
  try {
    console.log('📥 Recebendo requisição para criar atributo:', req.body);
    
    const {
      category_id,
      name,
      label,
      type,
      options,
      is_filterable = true,
      is_required = false,
      order_index = 0,
    } = req.body;

    if (!category_id || !name || !type) {
      console.error('❌ Validação falhou:', { category_id, name, type });
      return res
        .status(400)
        .json({ error: 'category_id, name e type são obrigatórios' });
    }

    const id = uuidv4();
    const optionsJson = Array.isArray(options)
      ? JSON.stringify(options)
      : options || null;

    console.log('💾 Inserindo atributo no banco:', {
      id,
      category_id,
      name,
      label,
      type,
      optionsJson,
      is_filterable,
      is_required,
      order_index
    });

    // Converter booleanos para o formato correto do banco
    const isFilterableValue = isSQLite() 
      ? (is_filterable ? 1 : 0)
      : is_filterable;
    const isRequiredValue = isSQLite()
      ? (is_required ? 1 : 0)
      : is_required;

    await db
      .prepare(
        `INSERT INTO category_attributes 
        (id, category_id, name, label, type, options, is_filterable, is_required, order_index) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        category_id,
        name,
        label || null,
        type,
        optionsJson,
        isFilterableValue,
        isRequiredValue,
        order_index || 0
      );

    console.log('✅ Atributo inserido com sucesso, buscando registro criado...');

    const created = await db
      .prepare('SELECT * FROM category_attributes WHERE id = ?')
      .get(id);

    console.log('✅ Atributo criado:', created);

    res.status(201).json(created);
  } catch (error) {
    console.error('❌ Erro ao criar atributo de categoria:', error);
    console.error('Stack:', error.stack);
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    res.status(500).json({ 
      error: 'Erro ao criar atributo de categoria',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Atualizar atributo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      label,
      type,
      options,
      is_filterable,
      is_required,
      order_index,
    } = req.body;

    const existing = await db
      .prepare('SELECT * FROM category_attributes WHERE id = ?')
      .get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Atributo não encontrado' });
    }

    const optionsJson =
      options === undefined
        ? existing.options
        : Array.isArray(options)
        ? JSON.stringify(options)
        : options || null;

    await db
      .prepare(
        `UPDATE category_attributes
         SET 
          name = ?, 
          label = ?, 
          type = ?, 
          options = ?, 
          is_filterable = ?, 
          is_required = ?, 
          order_index = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(
        name ?? existing.name,
        label !== undefined ? label : existing.label,
        type ?? existing.type,
        optionsJson,
        is_filterable !== undefined
          ? is_filterable
            ? 1
            : 0
          : existing.is_filterable,
        is_required !== undefined ? (is_required ? 1 : 0) : existing.is_required,
        order_index !== undefined ? order_index : existing.order_index,
        id
      );

    const updated = await db
      .prepare('SELECT * FROM category_attributes WHERE id = ?')
      .get(id);

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar atributo de categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar atributo de categoria' });
  }
});

// Excluir atributo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db
      .prepare('SELECT * FROM category_attributes WHERE id = ?')
      .get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Atributo não encontrado' });
    }

    await db
      .prepare('DELETE FROM category_attributes WHERE id = ?')
      .run(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir atributo de categoria:', error);
    res.status(500).json({ error: 'Erro ao excluir atributo de categoria' });
  }
});

export default router;


