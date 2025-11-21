/**
 * Cache em Memória Simples
 * 
 * Cache básico para queries frequentes.
 * Em produção, considere usar Redis para cache distribuído.
 */

class SimpleCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutos padrão
    this.maxSize = options.maxSize || 1000; // Máximo de 1000 entradas
  }

  /**
   * Obter valor do cache
   * @param {string} key - Chave do cache
   * @returns {any|null} - Valor ou null se não existir/expirado
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Armazenar valor no cache
   * @param {string} key - Chave do cache
   * @param {any} value - Valor a armazenar
   * @param {number} ttl - Tempo de vida em ms (opcional)
   */
  set(key, value, ttl = null) {
    // Se o cache está cheio, remover entrada mais antiga
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Remover entrada do cache
   * @param {string} key - Chave a remover
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Limpar todo o cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Limpar entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obter estatísticas do cache
   * @returns {Object} - Estatísticas
   */
  getStats() {
    this.cleanup(); // Limpar expirados antes de contar
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }
}

// Instância global do cache
export const cache = new SimpleCache({
  defaultTTL: 300000, // 5 minutos
  maxSize: 1000
});

// Limpar cache expirado a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 300000); // 5 minutos
}

/**
 * Middleware de cache para rotas
 * @param {Function} keyGenerator - Função para gerar chave do cache
 * @param {number} ttl - Tempo de vida em ms
 * @returns {Function} - Middleware
 */
export function cacheMiddleware(keyGenerator, ttl = 300000) {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Interceptar res.json para cachear a resposta
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      cache.set(key, data, ttl);
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Invalidar cache por padrão
 * @param {string} pattern - Padrão de chave (ex: 'products:*')
 */
export function invalidateCache(pattern) {
  if (pattern.includes('*')) {
    const prefix = pattern.replace('*', '');
    for (const key of cache.cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.delete(pattern);
  }
}

