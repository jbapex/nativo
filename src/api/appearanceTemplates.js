import { request } from './apiClient.js';

export const AppearanceTemplates = {
  // Listar todos os templates
  async list() {
    return request('/appearance-templates', {
      method: 'GET',
    });
  },

  // Obter template por ID
  async get(id) {
    return request(`/appearance-templates/${id}`, {
      method: 'GET',
    });
  },

  // Criar novo template
  async create(data) {
    return request('/appearance-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Atualizar template
  async update(id, data) {
    return request(`/appearance-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Deletar template
  async delete(id) {
    return request(`/appearance-templates/${id}`, {
      method: 'DELETE',
    });
  },

  // Aplicar template (retorna dados do template)
  async apply(id) {
    return request(`/appearance-templates/${id}/apply`, {
      method: 'POST',
    });
  },
};

