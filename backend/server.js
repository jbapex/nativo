import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDatabase } from './database/db.js';
import { createLogger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar rotas
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import storeRoutes from './routes/stores.js';
import cityRoutes from './routes/cities.js';
import planRoutes from './routes/plans.js';
import subscriptionRoutes from './routes/subscriptions.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';
import storeCustomizationsRoutes from './routes/storeCustomizations.js';
import promotionsRoutes from './routes/promotions.js';
import ordersRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import reviewsRoutes from './routes/reviews.js';
import favoritesRoutes from './routes/favorites.js';
import notificationsRoutes from './routes/notifications.js';
import mercadopagoRoutes from './routes/mercadopago.js';
import paymentsRoutes from './routes/payments.js';
import userAddressesRoutes from './routes/user-addresses.js';

dotenv.config();

// Logger
const logger = createLogger();

// Validar variáveis de ambiente críticas
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => {
  const value = process.env[varName];
  return !value || value === 'seu-secret-super-seguro-aqui' || value.includes('ALTERE-EM-PRODUCAO');
});

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  logger.error('❌ Variáveis de ambiente críticas não configuradas:', missingVars);
  logger.error('Por favor, configure as variáveis de ambiente antes de iniciar em produção.');
  process.exit(1);
} else if (missingVars.length > 0) {
  logger.warn('⚠️  Variáveis de ambiente não configuradas (aceitável em desenvolvimento):', missingVars);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers (Helmet)
// Em desenvolvimento, desabilitar CSP para evitar problemas com imagens
const isDevelopment = process.env.NODE_ENV !== 'production';
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:*", "http://127.0.0.1:*"],
    },
  },
  crossOriginEmbedderPolicy: false, // Permite uploads
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite carregar recursos de outras origens
}));

// Compressão de respostas (gzip)
app.use(compression({
  filter: (req, res) => {
    // Comprimir apenas respostas JSON e texto
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Nível de compressão (1-9, 6 é um bom equilíbrio)
}));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:3006',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting Global (mais permissivo em desenvolvimento)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: isDevelopment 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000 // 1000 requests em desenvolvimento
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests em produção
  message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting para arquivos estáticos (uploads)
    return req.path.startsWith('/api/upload/uploads/');
  }
});
app.use('/api/', limiter);

// Rate Limiting mais restritivo para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por IP
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true,
});

// Body Parser
// express.json() aplicado globalmente, mas express.raw() na rota específica do webhook
// vai sobrescrever para aquela rota
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializar banco de dados
initDatabase().catch(console.error);

// Rotas de arquivos estáticos (ANTES do rate limiting)
app.use('/api/upload/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/store-customizations', storeCustomizationsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/mercadopago', mercadopagoRoutes);
app.use('/api/user-addresses', userAddressesRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando' });
});

// Middleware de erro
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Não expor detalhes do erro em produção
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Erro interno do servidor',
    ...(isDevelopment && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📡 API disponível em http://localhost:${PORT}/api`);
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

