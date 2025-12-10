/**
 * Utilitário para aplicar cores do tema em todo o sistema
 * Aplica CSS variables dinamicamente baseado nas configurações de aparência
 */

/**
 * Aplica todas as cores configuradas como CSS variables no documento
 * @param {Object} appearanceSettings - Objeto com todas as configurações de aparência
 */
export function applyAppearanceColors(appearanceSettings) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Adicionar atributo data-theme para que os estilos CSS sejam aplicados
  root.setAttribute('data-theme', 'custom');
  
  // Mapeamento de todas as cores para CSS variables
  const colorMap = {
    // Cores principais
    primaryColor: '--primary-color',
    secondaryColor: '--secondary-color',
    accentColor: '--accent-color',
    backgroundColor: '--background-color',
    textColor: '--text-color',
    headerColor: '--header-color',
    footerColor: '--footer-color',
    
    // Cores de botões
    buttonPrimaryColor: '--button-primary-color',
    buttonSecondaryColor: '--button-secondary-color',
    buttonTextColor: '--button-text-color',
    
    // Cores de links
    linkColor: '--link-color',
    linkHoverColor: '--link-hover-color',
    
    // Cores de cards
    cardBackgroundColor: '--card-background-color',
    cardBorderColor: '--card-border-color',
    cardShadowColor: '--card-shadow-color',
    
    // Cores de inputs
    inputBackgroundColor: '--input-background-color',
    inputBorderColor: '--input-border-color',
    inputFocusColor: '--input-focus-color',
    focusRingColor: '--focus-ring-color',
    
    // Cores de texto
    textSecondaryColor: '--text-secondary-color',
    textMutedColor: '--text-muted-color',
    
    // Cores de bordas e seções
    borderColor: '--border-color',
    sectionBackgroundColor: '--section-background-color',
    
    // Cores de badges
    badgePrimaryColor: '--badge-primary-color',
    badgeSecondaryColor: '--badge-secondary-color',
    badgeSuccessColor: '--badge-success-color',
    badgeErrorColor: '--badge-error-color',
    badgeWarningColor: '--badge-warning-color',
    
    // Cores de estado
    hoverColor: '--hover-color',
  };

  // Aplicar todas as cores como CSS variables
  Object.entries(colorMap).forEach(([key, cssVar]) => {
    const value = appearanceSettings[key];
    // Garantir que o valor não seja vazio e seja uma string válida
    if (value && typeof value === 'string' && value.trim() !== '') {
      root.style.setProperty(cssVar, value);
    }
  });
}

/**
 * Aplica favicon se configurado
 * @param {string} faviconUrl - URL do favicon
 */
export function applyFavicon(faviconUrl) {
  if (typeof document === 'undefined' || !faviconUrl) return;

  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = faviconUrl;
}

/**
 * Hook para aplicar cores automaticamente quando appearanceSettings mudar
 * @param {Object} appearanceSettings - Objeto com todas as configurações de aparência
 */
export function useAppearanceColors(appearanceSettings) {
  if (typeof window === 'undefined') return;

  // Aplicar cores quando settings mudarem
  if (appearanceSettings) {
    applyAppearanceColors(appearanceSettings);
    if (appearanceSettings.favicon) {
      applyFavicon(appearanceSettings.favicon);
    }
  }
}

