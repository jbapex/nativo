/**
 * Utilitário de Paginação
 * 
 * Fornece funções auxiliares para implementar paginação consistente
 * em todas as rotas que retornam listas.
 */

/**
 * Extrair parâmetros de paginação da query string
 * @param {Object} query - req.query
 * @param {Object} options - Opções de paginação
 * @returns {Object} - { page, limit, offset }
 */
export function getPaginationParams(query, options = {}) {
  const defaultLimit = options.defaultLimit || 20;
  const maxLimit = options.maxLimit || 100;
  
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Criar resposta paginada
 * @param {Array} data - Dados da página atual
 * @param {number} total - Total de registros
 * @param {number} page - Página atual
 * @param {number} limit - Itens por página
 * @returns {Object} - Resposta paginada
 */
export function createPaginationResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

/**
 * Aplicar paginação a uma query SQL
 * @param {string} baseQuery - Query SQL base (sem LIMIT/OFFSET)
 * @param {number} limit - Limite de itens
 * @param {number} offset - Offset
 * @returns {string} - Query com LIMIT e OFFSET
 */
export function applyPagination(baseQuery, limit, offset) {
  return `${baseQuery} LIMIT ? OFFSET ?`;
}

