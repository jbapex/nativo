import { Promotions } from "@/api/apiClient";

/**
 * Calcula o preço com desconto baseado em uma promoção
 * @param {number} originalPrice - Preço original do produto
 * @param {object} promotion - Objeto da promoção
 * @returns {object} - { finalPrice, originalPrice, discountPercent }
 */
export function calculatePromoPrice(originalPrice, promotion) {
  if (!promotion || !promotion.active) {
    return {
      finalPrice: originalPrice,
      originalPrice: originalPrice,
      discountPercent: 0,
      hasPromo: false
    };
  }

  const now = new Date();
  const startDate = new Date(promotion.start_date);
  const endDate = new Date(promotion.end_date);

  // Verificar se a promoção está ativa no período
  if (now < startDate || now > endDate) {
    return {
      finalPrice: originalPrice,
      originalPrice: originalPrice,
      discountPercent: 0,
      hasPromo: false
    };
  }

  let finalPrice = originalPrice;
  let discountPercent = 0;

  switch (promotion.discount_type) {
    case 'percentage':
      discountPercent = promotion.discount_value || 0;
      finalPrice = originalPrice * (1 - discountPercent / 100);
      break;
    case 'fixed':
      finalPrice = Math.max(0, originalPrice - (promotion.discount_value || 0));
      discountPercent = originalPrice > 0 
        ? Math.round((promotion.discount_value / originalPrice) * 100)
        : 0;
      break;
    case 'free_shipping':
      // Frete grátis não altera o preço, apenas indica que o frete é grátis
      finalPrice = originalPrice;
      discountPercent = 0;
      break;
    default:
      finalPrice = originalPrice;
  }

  return {
    finalPrice: Math.round(finalPrice * 100) / 100, // Arredondar para 2 casas decimais
    originalPrice: originalPrice,
    discountPercent: Math.round(discountPercent),
    hasPromo: true,
    promotion: promotion
  };
}

/**
 * Aplica promoções a uma lista de produtos
 * @param {array} products - Lista de produtos
 * @param {array} promotions - Lista de promoções ativas
 * @returns {array} - Lista de produtos com preços atualizados
 */
export function applyPromotionsToProducts(products, promotions) {
  if (!promotions || promotions.length === 0) {
    return products;
  }

  return products.map(product => {
    // Buscar promoção aplicável ao produto
    // Prioridade: promoção específica do produto > promoção geral da loja
    let applicablePromo = null;
    
    // Primeiro, tentar encontrar promoção específica do produto
    applicablePromo = promotions.find(p => 
      p.product_id === product.id && p.active
    );
    
    // Se não encontrar, buscar promoção geral (product_id NULL)
    if (!applicablePromo) {
      applicablePromo = promotions.find(p => 
        !p.product_id && p.active
      );
    }

    if (applicablePromo) {
      const promoPrice = calculatePromoPrice(product.price, applicablePromo);
      
      return {
        ...product,
        price: promoPrice.finalPrice,
        compare_price: promoPrice.originalPrice,
        promotion: applicablePromo,
        has_promotion: true,
        discount_percent: promoPrice.discountPercent
      };
    }

    return product;
  });
}

/**
 * Busca promoções ativas de uma loja e aplica aos produtos
 * @param {array} products - Lista de produtos
 * @param {string} storeId - ID da loja
 * @returns {Promise<array>} - Lista de produtos com promoções aplicadas
 */
export async function fetchAndApplyPromotions(products, storeId) {
  if (!storeId || !products || products.length === 0) {
    return products;
  }

  try {
    const promotions = await Promotions.getActiveByStore(storeId);
    return applyPromotionsToProducts(products, promotions);
  } catch (error) {
    console.error('Erro ao buscar promoções:', error);
    // Em caso de erro, retornar produtos sem promoções
    return products;
  }
}

/**
 * Aplica promoções a produtos de múltiplas lojas
 * Agrupa produtos por loja e aplica promoções de cada loja
 * @param {array} products - Lista de produtos de várias lojas
 * @returns {Promise<array>} - Lista de produtos com promoções aplicadas
 */
export async function fetchAndApplyPromotionsMultiStore(products) {
  if (!products || products.length === 0) {
    return products;
  }

  try {
    // Agrupar produtos por loja
    const productsByStore = {};
    products.forEach(product => {
      const storeId = product.store_id;
      if (!productsByStore[storeId]) {
        productsByStore[storeId] = [];
      }
      productsByStore[storeId].push(product);
    });

    // Buscar promoções e aplicar para cada loja
    const storeIds = Object.keys(productsByStore);
    const promotionsByStore = {};
    
    // Buscar promoções de todas as lojas em paralelo
    await Promise.all(
      storeIds.map(async (storeId) => {
        try {
          const promotions = await Promotions.getActiveByStore(storeId);
          promotionsByStore[storeId] = promotions;
        } catch (error) {
          console.error(`Erro ao buscar promoções da loja ${storeId}:`, error);
          promotionsByStore[storeId] = [];
        }
      })
    );

    // Aplicar promoções aos produtos de cada loja
    const result = [];
    storeIds.forEach(storeId => {
      const storeProducts = productsByStore[storeId];
      const promotions = promotionsByStore[storeId] || [];
      const productsWithPromos = applyPromotionsToProducts(storeProducts, promotions);
      result.push(...productsWithPromos);
    });

    return result;
  } catch (error) {
    console.error('Erro ao aplicar promoções multi-loja:', error);
    return products;
  }
}

