import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate, loginSchema, userSchema } from '../middleware/validation.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Tempos de expiração
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutos
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // 30 dias

// Inicializar cliente OAuth do Google
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar last_login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    
    // Gerar access token (curta duração)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    // Gerar refresh token (longa duração)
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { id: user.id, tokenId: refreshTokenId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    // Calcular data de expiração do refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    // Salvar refresh token no banco
    db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(refreshTokenId, user.id, refreshToken, expiresAt.toISOString());

    // Remover password_hash da resposta
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      token: accessToken,
      refreshToken: refreshToken,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Registrar novo usuário
router.post('/register', validate(userSchema), async (req, res) => {
  try {
    const { email, password, full_name, phone, role = 'customer' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (!full_name) {
      return res.status(400).json({ error: 'Nome completo é obrigatório' });
    }

    // Verificar se email já existe
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    // Status padrão: 'active' para customer, 'pending' para store
    const defaultStatus = role === 'customer' ? 'active' : 'pending';

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, passwordHash, full_name, phone || null, role, defaultStatus);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    // Gerar access token (curta duração)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    // Gerar refresh token (longa duração)
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { id: user.id, tokenId: refreshTokenId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    // Calcular data de expiração do refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    // Salvar refresh token no banco
    db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(refreshTokenId, user.id, refreshToken, expiresAt.toISOString());

    // Remover password_hash da resposta
    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({
      token: accessToken,
      refreshToken: refreshToken,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Obter usuário atual
router.get('/me', authenticateToken, (req, res) => {
  try {
    // Buscar usuário (excluindo password_hash)
    const user = db.prepare(`
      SELECT id, email, full_name, role, status, phone, avatar, cpf, birth_date, 
             created_at, updated_at, last_login 
      FROM users 
      WHERE id = ?
    `).get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar endereços do usuário
    const addresses = db.prepare(`
      SELECT * FROM user_addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `).all(req.user.id);

    res.json({
      ...user,
      addresses: addresses || []
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar dados do usuário
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { full_name, password, phone, avatar, cpf, birth_date, ...otherData } = req.body;
    
    let updates = [];
    let values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar || null);
    }
    
    if (cpf !== undefined) {
      updates.push('cpf = ?');
      values.push(cpf || null);
    }
    
    if (birth_date !== undefined) {
      updates.push('birth_date = ?');
      values.push(birth_date || null);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    // Atualizar outros campos (role, status, etc) - apenas admin pode fazer isso
    if (req.user.role === 'admin') {
      if (otherData.role) {
        updates.push('role = ?');
        values.push(otherData.role);
      }
      if (otherData.status) {
        updates.push('status = ?');
        values.push(otherData.status);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const user = db.prepare(`
      SELECT id, email, full_name, role, status, phone, avatar, cpf, birth_date, 
             created_at, updated_at, last_login 
      FROM users 
      WHERE id = ?
    `).get(req.user.id);
    
    // Buscar endereços
    const addresses = db.prepare(`
      SELECT * FROM user_addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `).all(req.user.id);
    
    res.json({
      ...user,
      addresses: addresses || []
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Login com Google
router.post('/google', async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Token do Google é obrigatório' });
    }

    if (!googleClient) {
      return res.status(500).json({ error: 'Autenticação Google não configurada. Configure GOOGLE_CLIENT_ID no .env' });
    }

    // Verificar token do Google
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Token do Google inválido' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email não fornecido pelo Google' });
    }

    // Verificar se usuário já existe
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // Criar novo usuário
      const id = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, full_name, role, status, password_hash)
        VALUES (?, ?, ?, 'user', 'approved', NULL)
      `).run(id, email, name || email.split('@')[0]);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    } else {
      // Atualizar nome se necessário
      if (name && name !== user.full_name) {
        db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(name, user.id);
        user.full_name = name;
      }
    }

    // Gerar access token (curta duração)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    // Gerar refresh token (longa duração)
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { id: user.id, tokenId: refreshTokenId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    // Calcular data de expiração do refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    // Salvar refresh token no banco
    db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(refreshTokenId, user.id, refreshToken, expiresAt.toISOString());

    res.json({
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        picture: picture || null
      }
    });
  } catch (error) {
    console.error('Erro no login Google:', error);
    if (error.message?.includes('Token used too early')) {
      return res.status(401).json({ error: 'Token do Google inválido ou expirado' });
    }
    res.status(500).json({ error: 'Erro ao fazer login com Google' });
  }
});

// Refresh token - obter novo access token usando refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    // Verificar refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    // Verificar se é um refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar se o token existe no banco e não foi revogado
    const tokenRecord = db.prepare(`
      SELECT * FROM refresh_tokens 
      WHERE id = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP
    `).get(decoded.tokenId);

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    // Buscar usuário
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Gerar novo access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    res.json({
      token: accessToken
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
});

// Logout - revogar refresh token
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Verificar e revogar refresh token
      try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        if (decoded.type === 'refresh' && decoded.tokenId) {
          db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(decoded.tokenId);
        }
      } catch (error) {
        // Ignorar erros de verificação
      }
    }

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// Limpar refresh tokens expirados (manutenção)
router.post('/cleanup-tokens', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM refresh_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP OR revoked = 1
    `).run();

    res.json({ 
      message: 'Tokens expirados removidos',
      deleted: result.changes 
    });
  } catch (error) {
    console.error('Erro ao limpar tokens:', error);
    res.status(500).json({ error: 'Erro ao limpar tokens' });
  }
});

export default router;

