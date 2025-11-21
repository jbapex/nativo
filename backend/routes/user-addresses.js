import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeBody } from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar endereços do usuário autenticado
router.get('/', authenticateToken, (req, res) => {
  try {
    const addresses = db.prepare(`
      SELECT * FROM user_addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `).all(req.user.id);

    res.json(addresses || []);
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    res.status(500).json({ error: 'Erro ao listar endereços' });
  }
});

// Obter endereço específico
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const address = db.prepare(`
      SELECT * FROM user_addresses 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!address) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    res.json(address);
  } catch (error) {
    console.error('Erro ao obter endereço:', error);
    res.status(500).json({ error: 'Erro ao obter endereço' });
  }
});

// Criar novo endereço
router.post('/', authenticateToken, sanitizeBody, (req, res) => {
  try {
    const {
      type = 'delivery',
      label,
      is_default = false,
      recipient_name,
      phone,
      zip_code,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      reference
    } = req.body;

    // Validações
    if (!recipient_name || !zip_code || !street || !number || !neighborhood || !city || !state) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: recipient_name, zip_code, street, number, neighborhood, city, state' 
      });
    }

    // Se for o endereço padrão, remover padrão dos outros endereços
    if (is_default) {
      db.prepare(`
        UPDATE user_addresses 
        SET is_default = 0 
        WHERE user_id = ?
      `).run(req.user.id);
    }

    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO user_addresses (
        id, user_id, type, label, is_default, recipient_name, phone,
        zip_code, street, number, complement, neighborhood, city, state, reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user.id, type, label || null, is_default ? 1 : 0,
      recipient_name, phone || null, zip_code, street, number,
      complement || null, neighborhood, city, state, reference || null
    );

    const newAddress = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(id);
    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro ao criar endereço' });
  }
});

// Atualizar endereço
router.put('/:id', authenticateToken, sanitizeBody, (req, res) => {
  try {
    // Verificar se o endereço pertence ao usuário
    const existingAddress = db.prepare(`
      SELECT * FROM user_addresses 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const {
      type,
      label,
      is_default,
      recipient_name,
      phone,
      zip_code,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      reference
    } = req.body;

    // Se for marcar como padrão, remover padrão dos outros
    if (is_default && !existingAddress.is_default) {
      db.prepare(`
        UPDATE user_addresses 
        SET is_default = 0 
        WHERE user_id = ? AND id != ?
      `).run(req.user.id, req.params.id);
    }

    const updates = [];
    const values = [];

    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (label !== undefined) { updates.push('label = ?'); values.push(label || null); }
    if (is_default !== undefined) { updates.push('is_default = ?'); values.push(is_default ? 1 : 0); }
    if (recipient_name !== undefined) { updates.push('recipient_name = ?'); values.push(recipient_name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
    if (zip_code !== undefined) { updates.push('zip_code = ?'); values.push(zip_code); }
    if (street !== undefined) { updates.push('street = ?'); values.push(street); }
    if (number !== undefined) { updates.push('number = ?'); values.push(number); }
    if (complement !== undefined) { updates.push('complement = ?'); values.push(complement || null); }
    if (neighborhood !== undefined) { updates.push('neighborhood = ?'); values.push(neighborhood); }
    if (city !== undefined) { updates.push('city = ?'); values.push(city); }
    if (state !== undefined) { updates.push('state = ?'); values.push(state); }
    if (reference !== undefined) { updates.push('reference = ?'); values.push(reference || null); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`
      UPDATE user_addresses 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updatedAddress = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(req.params.id);
    res.json(updatedAddress);
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro ao atualizar endereço' });
  }
});

// Deletar endereço
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    // Verificar se o endereço pertence ao usuário
    const address = db.prepare(`
      SELECT * FROM user_addresses 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!address) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    db.prepare('DELETE FROM user_addresses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Endereço deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro ao deletar endereço' });
  }
});

// Definir endereço como padrão
router.patch('/:id/set-default', authenticateToken, (req, res) => {
  try {
    // Verificar se o endereço pertence ao usuário
    const address = db.prepare(`
      SELECT * FROM user_addresses 
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!address) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    // Remover padrão dos outros endereços
    db.prepare(`
      UPDATE user_addresses 
      SET is_default = 0 
      WHERE user_id = ?
    `).run(req.user.id);

    // Definir este como padrão
    db.prepare(`
      UPDATE user_addresses 
      SET is_default = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    const updatedAddress = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(req.params.id);
    res.json(updatedAddress);
  } catch (error) {
    console.error('Erro ao definir endereço padrão:', error);
    res.status(500).json({ error: 'Erro ao definir endereço padrão' });
  }
});

export default router;

