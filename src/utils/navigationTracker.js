/**
 * Utilitário para rastrear a navegação do usuário
 * Armazena o caminho percorrido para construir breadcrumbs dinâmicos
 */

const NAVIGATION_KEY = 'navigationHistory';

/**
 * Adiciona uma entrada ao histórico de navegação
 * @param {Object} entry - Entrada com tipo, label, href, etc.
 */
export function addNavigationEntry(entry) {
  try {
    const history = getNavigationHistory();
    
    // Limitar histórico a 10 entradas para não ocupar muito espaço
    if (history.length >= 10) {
      history.shift();
    }
    
    history.push({
      ...entry,
      timestamp: Date.now()
    });
    
    sessionStorage.setItem(NAVIGATION_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Erro ao salvar histórico de navegação:', error);
  }
}

/**
 * Obtém o histórico de navegação
 * @returns {Array} Array de entradas de navegação
 */
export function getNavigationHistory() {
  try {
    const stored = sessionStorage.getItem(NAVIGATION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao ler histórico de navegação:', error);
    return [];
  }
}

/**
 * Limpa o histórico de navegação
 */
export function clearNavigationHistory() {
  try {
    sessionStorage.removeItem(NAVIGATION_KEY);
  } catch (error) {
    console.error('Erro ao limpar histórico de navegação:', error);
  }
}

/**
 * Obtém o caminho de navegação para um produto específico
 * @param {string} productId - ID do produto
 * @returns {Array} Array de breadcrumbs
 */
export function getProductNavigationPath(productId) {
  const history = getNavigationHistory();
  
  // Filtrar apenas entradas relevantes e remover duplicatas
  const relevantEntries = [];
  const seenTypes = new Set();
  
  // Ordenar por timestamp (mais recente primeiro)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
  
  for (const entry of sortedHistory) {
    // Não adicionar se já vimos este tipo (evitar duplicatas)
    if (!seenTypes.has(entry.type)) {
      relevantEntries.unshift(entry); // Adicionar no início para manter ordem cronológica
      seenTypes.add(entry.type);
    }
  }
  
  return relevantEntries;
}

/**
 * Registra que o usuário está na Home
 */
export function trackHome() {
  addNavigationEntry({
    type: 'home',
    label: 'Home',
    href: '/'
  });
}

/**
 * Registra que o usuário está em uma campanha
 * @param {Object} campaign - Objeto da campanha
 */
export function trackCampaign(campaign) {
  if (!campaign) return;
  
  addNavigationEntry({
    type: 'campaign',
    label: campaign.name || 'Campanha',
    href: `/campanhas/${campaign.slug || campaign.id}`,
    campaignId: campaign.id,
    campaignSlug: campaign.slug
  });
}

/**
 * Registra que o usuário está em uma categoria
 * @param {Object} category - Objeto da categoria
 */
export function trackCategory(category) {
  if (!category) return;
  
  addNavigationEntry({
    type: 'category',
    label: category.name || 'Categoria',
    href: `/?category=${category.id}`,
    categoryId: category.id
  });
}

/**
 * Registra que o usuário está em uma loja
 * @param {Object} store - Objeto da loja
 */
export function trackStore(store) {
  if (!store) return;
  
  addNavigationEntry({
    type: 'store',
    label: store.name || 'Loja',
    href: `/loja/${store.id}`,
    storeId: store.id
  });
}

/**
 * Registra que o usuário está visualizando um produto
 * @param {Object} product - Objeto do produto
 */
export function trackProduct(product) {
  if (!product) return;
  
  addNavigationEntry({
    type: 'product',
    label: product.name || 'Produto',
    href: `/produto/${product.id}`,
    productId: product.id
  });
}

