import { describe, it, expect } from 'vitest';
import { sanitizeHTML, sanitizeText } from '../utils/sanitize.js';
import { getPaginationParams, applyPagination, createPaginationResponse } from '../utils/pagination.js';

describe('Utils', () => {
  describe('sanitizeHTML', () => {
    it('deve remover tags script', () => {
      const input = '<p>Texto</p><script>alert("xss")</script>';
      const output = sanitizeHTML(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('<p>Texto</p>');
    });

    it('deve remover atributos de estilo', () => {
      const input = '<p style="color: red;">Texto</p>';
      const output = sanitizeHTML(input);
      expect(output).not.toContain('style=');
    });

    it('deve permitir tags HTML básicas', () => {
      const input = '<p><strong>Texto</strong> em <em>negrito</em></p>';
      const output = sanitizeHTML(input);
      expect(output).toContain('<p>');
      expect(output).toContain('<strong>');
      expect(output).toContain('<em>');
    });
  });

  describe('sanitizeText', () => {
    it('deve remover todas as tags HTML', () => {
      const input = '<p>Texto <strong>negrito</strong></p>';
      const output = sanitizeText(input);
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
    });

    it('deve codificar entidades HTML', () => {
      const input = '<script>alert("xss")</script>';
      const output = sanitizeText(input);
      expect(output).not.toContain('<script>');
    });
  });

  describe('getPaginationParams', () => {
    it('deve retornar valores padrão', () => {
      const params = getPaginationParams({});
      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
      expect(params.offset).toBe(0);
    });

    it('deve usar valores customizados', () => {
      const params = getPaginationParams({ page: '2', limit: '10' });
      expect(params.page).toBe(2);
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(10);
    });

    it('deve respeitar limite máximo', () => {
      const params = getPaginationParams({ limit: '200' }, { defaultLimit: 20, maxLimit: 100 });
      expect(params.limit).toBe(100);
    });
  });

  describe('applyPagination', () => {
    it('deve adicionar LIMIT e OFFSET', () => {
      const query = 'SELECT * FROM products';
      const result = applyPagination(query, 10, 20);
      expect(result).toContain('LIMIT');
      expect(result).toContain('OFFSET');
    });
  });

  describe('createPaginationResponse', () => {
    it('deve criar resposta com paginação', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = createPaginationResponse(data, 50, 1, 20);
      
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('pagination');
      expect(response.pagination).toHaveProperty('page', 1);
      expect(response.pagination).toHaveProperty('limit', 20);
      expect(response.pagination).toHaveProperty('total', 50);
      expect(response.pagination).toHaveProperty('totalPages', 3);
      expect(response.pagination).toHaveProperty('hasNext', true);
      expect(response.pagination).toHaveProperty('hasPrev', false);
    });
  });
});

