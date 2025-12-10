/**
 * Configuração do Sentry para Error Tracking
 * 
 * O Sentry é opcional - se SENTRY_DSN não estiver configurado,
 * o sistema funciona normalmente sem tracking de erros.
 */

import * as Sentry from '@sentry/node';

let isInitialized = false;

/**
 * Inicializar Sentry
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  // Se não houver DSN, Sentry não será inicializado
  if (!dsn) {
    console.log('ℹ️  Sentry não configurado (SENTRY_DSN não definido)');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% em produção, 100% em dev
      
      // Profiling (opcional, requer plano pago)
      // Desabilitado por enquanto - requer configuração adicional
      // profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // integrations: [
      //   new ProfilingIntegration(),
      // ],
      
      // Filtrar erros comuns que não precisam ser reportados
      beforeSend(event, hint) {
        // Ignorar erros de validação (400)
        if (event.request?.headers?.['x-status-code'] === '400') {
          return null;
        }
        
        // Ignorar erros 404
        if (event.request?.url?.includes('favicon.ico')) {
          return null;
        }
        
        return event;
      },
      
      // Configurações adicionais
      ignoreErrors: [
        // Erros de rede comuns
        'NetworkError',
        'Network request failed',
        // Erros de CORS (já tratados)
        'CORS',
      ],
    });

    isInitialized = true;
    console.log('✅ Sentry inicializado para Error Tracking');
  } catch (error) {
    console.error('❌ Erro ao inicializar Sentry:', error.message);
  }
}

/**
 * Capturar exceção manualmente
 */
export function captureException(error, context = {}) {
  if (!isInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    // Adicionar contexto adicional
    Object.entries(context).forEach(([key, value]) => {
      scope.setContext(key, value);
    });
    
    Sentry.captureException(error);
  });
}

/**
 * Capturar mensagem manualmente
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!isInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setContext(key, value);
    });
    
    Sentry.captureMessage(message, level);
  });
}

/**
 * Adicionar contexto ao usuário atual
 */
export function setUser(user) {
  if (!isInitialized) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Middleware Express para capturar erros automaticamente
 */
export function sentryErrorHandler(err, req, res, next) {
  if (isInitialized) {
    Sentry.captureException(err, {
      tags: {
        route: req.path,
        method: req.method,
      },
      extra: {
        body: req.body,
        query: req.query,
        params: req.params,
      },
    });
  }
  
  // Passar para o próximo handler de erro
  next(err);
}

/**
 * Middleware Express para adicionar transação
 */
export function sentryTransactionHandler(req, res, next) {
  if (isInitialized) {
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${req.method} ${req.path}`,
    });

    Sentry.getCurrentHub().configureScope((scope) => {
      scope.setSpan(transaction);
    });

    res.on('finish', () => {
      transaction.setHttpStatus(res.statusCode);
      transaction.finish();
    });
  }

  next();
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  sentryErrorHandler,
  sentryTransactionHandler,
};

