import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui';

// Validar JWT_SECRET em produção
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === 'seu-secret-super-seguro-aqui')) {
  console.error('❌ ERRO CRÍTICO: JWT_SECRET não configurado ou usando valor padrão inseguro!');
  console.error('Configure JWT_SECRET no arquivo .env antes de iniciar em produção.');
  process.exit(1);
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ authenticateToken: Token não fornecido');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ authenticateToken: Token inválido', err.message);
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    // Verificar se é um access token (não refresh token)
    if (user.type && user.type !== 'access') {
      console.log('❌ authenticateToken: Tipo de token inválido', user.type);
      return res.status(403).json({ error: 'Tipo de token inválido. Use um access token.' });
    }
    
    console.log('✅ authenticateToken: Token válido', { userId: user.id, role: user.role });
    req.user = user;
    next();
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      console.log('requireRole: Usuário não autenticado');
      return res.status(401).json({ error: 'Autenticação necessária' });
    }
    const userRole = req.user.role;
    const requiredRoles = roles.flat(); // Flatten array caso seja passado como array de arrays
    const hasAccess = requiredRoles.includes(userRole);
    
    console.log('requireRole: Verificando role', {
      userRole,
      requiredRoles,
      hasAccess,
      userId: req.user.id
    });
    
    if (!hasAccess) {
      console.warn('❌ Acesso negado:', { userRole, requiredRoles });
      return res.status(403).json({ 
        error: 'Acesso negado',
        details: `Role '${userRole}' não tem permissão. Roles necessários: ${requiredRoles.join(', ')}`
      });
    }
    next();
  };
}

