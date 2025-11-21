import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar notificações do usuário
router.get('/', authenticateToken, (req, res) => {
  try {
    const { unread_only, limit } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];
    
    if (unread_only === 'true') {
      query += ' AND read = 0';
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const notifications = db.prepare(query).all(...params);
    res.json(notifications);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Contar notificações não lidas
router.get('/unread/count', authenticateToken, (req, res) => {
  try {
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND read = 0
    `).get(req.user.id);
    
    res.json({ count: count.count || 0 });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
});

// Marcar notificação como lida
router.put('/:id/read', authenticateToken, (req, res) => {
  try {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    
    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// Marcar todas como lidas
router.put('/read-all', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
  }
});

// Deletar notificação
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    res.json({ message: 'Notificação deletada' });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro ao deletar notificação' });
  }
});

// Função auxiliar para criar notificação (usada por outras rotas)
export function createNotification(userId, type, title, message, link = null) {
  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, type, title, message, link);
    return id;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

export default router;

