/**
 * Utilitário para gerar placeholders de imagens
 * Usa placehold.co que é mais confiável que via.placeholder.com
 */

/**
 * Gera uma URL de placeholder para imagens
 * @param {number} width - Largura da imagem
 * @param {number} height - Altura da imagem (opcional, usa width se não fornecido)
 * @param {string} text - Texto a exibir (opcional)
 * @returns {string} URL do placeholder
 */
export function getImagePlaceholder(width = 300, height = null, text = 'Sem Imagem') {
  const h = height || width;
  const bgColor = 'e2e8f0'; // Cinza claro
  const textColor = '64748b'; // Cinza médio
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/${width}x${h}/${bgColor}/${textColor}?text=${encodedText}`;
}

/**
 * Placeholder padrão para logos de lojas
 */
export const STORE_LOGO_PLACEHOLDER = getImagePlaceholder(64, 64, 'Loja');

/**
 * Placeholder padrão para imagens de produtos
 */
export const PRODUCT_IMAGE_PLACEHOLDER = getImagePlaceholder(300, 300, 'Produto');

/**
 * Placeholder padrão para imagens pequenas (thumbnails)
 */
export const THUMBNAIL_PLACEHOLDER = getImagePlaceholder(50, 50, '');

/**
 * Placeholder padrão para avatares
 */
export const AVATAR_PLACEHOLDER = getImagePlaceholder(40, 40, '');

/**
 * Handler para erro de carregamento de imagem
 * Substitui a imagem por um placeholder quando falha
 * @param {Event} event - Evento de erro da imagem
 * @param {string} placeholder - URL do placeholder a usar
 */
export function handleImageError(event, placeholder = PRODUCT_IMAGE_PLACEHOLDER) {
  if (event.target.src !== placeholder) {
    event.target.src = placeholder;
  }
}

