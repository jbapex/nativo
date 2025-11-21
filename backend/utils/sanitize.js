/**
 * Utilitário de Sanitização de HTML
 * 
 * Previne ataques XSS (Cross-Site Scripting) sanitizando conteúdo HTML
 * antes de salvar no banco de dados ou exibir no frontend.
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Criar ambiente DOM para DOMPurify funcionar no Node.js
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Configuração padrão de sanitização (restritiva)
 * Permite apenas tags básicas de formatação
 */
const defaultConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

/**
 * Configuração permissiva (para conteúdo rico de lojas premium)
 * Permite mais tags e atributos, mas ainda remove scripts e eventos
 */
const permissiveConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span', 'div',
    'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'section', 'article'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'src', 'alt', 'width', 'height', 'style'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

/**
 * Sanitizar HTML (configuração padrão - restritiva)
 * @param {string} html - HTML a ser sanitizado
 * @returns {string} - HTML sanitizado
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(html, defaultConfig);
  } catch (error) {
    console.error('Erro ao sanitizar HTML:', error);
    // Em caso de erro, retornar apenas texto plano (remover todas as tags)
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  }
}

/**
 * Sanitizar HTML (configuração permissiva)
 * @param {string} html - HTML a ser sanitizado
 * @returns {string} - HTML sanitizado
 */
export function sanitizeHTMLPermissive(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(html, permissiveConfig);
  } catch (error) {
    console.error('Erro ao sanitizar HTML (permissivo):', error);
    // Em caso de erro, usar configuração padrão
    return sanitizeHTML(html);
  }
}

/**
 * Sanitizar texto simples (remove todas as tags HTML)
 * @param {string} text - Texto a ser sanitizado
 * @returns {string} - Texto sem tags HTML
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  } catch (error) {
    console.error('Erro ao sanitizar texto:', error);
    return text.replace(/<[^>]*>/g, ''); // Fallback: remover tags manualmente
  }
}

/**
 * Verificar se uma string contém HTML
 * @param {string} str - String a ser verificada
 * @returns {boolean} - true se contém HTML
 */
export function containsHTML(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  return /<[^>]+>/g.test(str);
}

