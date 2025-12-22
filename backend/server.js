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
import { initSentry, sentryErrorHandler, sentryTransactionHandler } from './utils/sentry.js';
import { startHealthCheckMonitoring, checkDatabaseHealth, getDbHealthStatus } from './utils/dbHealth.js';

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
import marketplaceCampaignsRoutes from './routes/marketplaceCampaigns.js';
import campaignParticipationsRoutes from './routes/campaignParticipations.js';
import ordersRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import reviewsRoutes from './routes/reviews.js';
import favoritesRoutes from './routes/favorites.js';
import notificationsRoutes from './routes/notifications.js';
import categoryAttributesRoutes from './routes/categoryAttributes.js';
import mercadopagoRoutes from './routes/mercadopago.js';
import paymentsRoutes from './routes/payments.js';
import userAddressesRoutes from './routes/user-addresses.js';
import appearanceTemplatesRoutes from './routes/appearanceTemplates.js';

dotenv.config();

// Inicializar Sentry (ANTES de qualquer outra coisa)
initSentry();

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
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000 // 5000 requests em desenvolvimento
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests em produção
  message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting para arquivos estáticos (uploads) e health checks
    return req.path.startsWith('/api/upload/uploads/') || 
           req.path.startsWith('/api/health');
  }
});
app.use('/api/', limiter);

// Rate Limiting mais restritivo para autenticação
// Mais permissivo em desenvolvimento para facilitar testes
const authLimiter = rateLimit({
  windowMs: isDevelopment 
    ? parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000 // 5 minutos em desenvolvimento
    : parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos em produção
  max: isDevelopment
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20 // 20 tentativas em desenvolvimento
    : parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 tentativas em produção
  message: { 
    error: isDevelopment 
      ? 'Muitas tentativas de login. Tente novamente em alguns minutos.' 
      : 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
  },
  skipSuccessfulRequests: true,
  // Em desenvolvimento, permitir resetar o rate limit mais facilmente
  standardHeaders: true,
  legacyHeaders: false,
});

// Body Parser
// express.json() aplicado globalmente, mas express.raw() na rota específica do webhook
// vai sobrescrever para aquela rota
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializar banco de dados ANTES de iniciar o servidor
let dbInitialized = false;

async function startServer() {
  try {
    logger.info('🔄 Inicializando banco de dados...');
    await initDatabase();
    
    // Verificar saúde do banco após inicialização
    const health = await checkDatabaseHealth();
    if (!health.healthy) {
      logger.error('❌ Banco de dados não está saudável após inicialização');
      throw new Error('Falha na verificação de saúde do banco de dados');
    }
    
    logger.info('✅ Banco de dados inicializado e saudável');
    
    // Iniciar monitoramento periódico do banco
    startHealthCheckMonitoring(30000); // Verificar a cada 30 segundos
    
    dbInitialized = true;
  } catch (error) {
    logger.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📡 API disponível em http://localhost:${PORT}/api`);
    logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

// Rotas de arquivos estáticos (ANTES do rate limiting)
app.use('/api/upload/uploads', express.static(path.join(__dirname, 'uploads')));

// Sentry Transaction Handler (para rastrear performance)
app.use(sentryTransactionHandler);

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
app.use('/api/marketplace-campaigns', marketplaceCampaignsRoutes);
app.use('/api/campaign-participations', campaignParticipationsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/category-attributes', categoryAttributesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/mercadopago', mercadopagoRoutes);
app.use('/api/user-addresses', userAddressesRoutes);
app.use('/api/appearance-templates', appearanceTemplatesRoutes);

// Rota de health check geral
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando' });
});

// Health Check do Banco de Dados
app.get('/api/health/db', async (req, res) => {
  try {
    const health = await checkDatabaseHealth();
    const status = getDbHealthStatus();
    
    res.status(health.healthy ? 200 : 503).json({
      ...health,
      statistics: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      healthy: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware de erro (Sentry primeiro, depois logger)
app.use(sentryErrorHandler);

// Middleware de erro (tratamento final)
app.use((err, req, res, next) => {
  // Log do erro
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    params: req.params,
    query: req.query
  });
  
  // Não expor detalhes do erro em produção
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Se for erro de UUID inválido, retornar erro mais amigável
  if (err.code === '22P02' || err.message?.includes('invalid input syntax for type uuid')) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'O ID fornecido não é válido'
    });
  }
  
  // Sempre retornar resposta para não deixar requisição pendente
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: isDevelopment ? err.message : 'Erro interno do servidor',
      ...(isDevelopment && { stack: err.stack })
    });
  }
});

