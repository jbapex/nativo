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
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    // Verificar se é um access token (não refresh token)
    if (user.type && user.type !== 'access') {
      return res.status(403).json({ error: 'Tipo de token inválido. Use um access token.' });
    }
    
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
    console.log('requireRole: Verificando role', {
      userRole: req.user.role,
      requiredRoles: roles,
      hasAccess: roles.includes(req.user.role)
    });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

