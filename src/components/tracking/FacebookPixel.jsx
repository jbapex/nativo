import { useEffect } from 'react';

/**
 * Componente para injetar o código do Facebook Pixel
 * @param {string} pixelId - ID do Facebook Pixel
 */
export default function FacebookPixel({ pixelId }) {
  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return;

    // Verificar se o pixel já foi carregado
    if (window.fbq) {
      return;
    }

    // Criar e injetar o script do Facebook Pixel
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    script.id = 'facebook-pixel-script';
    
    // Adicionar o script ao head
    document.head.appendChild(script);

    // Criar o noscript para usuários sem JavaScript
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);

    // Cleanup: remover scripts quando o componente for desmontado ou pixelId mudar
    return () => {
      const existingScript = document.getElementById('facebook-pixel-script');
      if (existingScript) {
        existingScript.remove();
      }
      const existingNoscript = document.querySelector('noscript img[src*="facebook.com/tr"]');
      if (existingNoscript && existingNoscript.parentElement) {
        existingNoscript.parentElement.remove();
      }
      // Limpar fbq se existir
      if (window.fbq) {
        delete window.fbq;
      }
    };
  }, [pixelId]);

  return null;
}

