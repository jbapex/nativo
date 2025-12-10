// Cliente API para substituir o Base44
// Use este cliente em vez do base44Client para usar o banco de dados próprio

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Verificar saúde do banco antes de requisições críticas
async function checkDatabaseHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health/db`);
    const health = await response.json();
    return health.healthy === true;
  } catch (error) {
    console.warn('⚠️ Não foi possível verificar saúde do banco:', error);
    return false; // Em caso de erro, assumir que está OK para não bloquear
  }
}

// Função auxiliar para fazer requisições
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  let response;
  try {
    // Para operações críticas (POST, PUT, DELETE), verificar saúde do banco
    const isCriticalOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method);
    if (isCriticalOperation) {
      const dbHealthy = await checkDatabaseHealth();
      if (!dbHealthy) {
        throw new Error('Banco de dados não está disponível no momento. Tente novamente em alguns instantes.');
      }
    }
    
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (fetchError) {
    console.error('Erro na requisição fetch:', fetchError);
    const err = new Error(fetchError.message || 'Erro de conexão com o servidor');
    err.originalError = fetchError;
    throw err;
  }
  
  if (!response.ok) {
    // Para 401, tentar renovar token usando refresh token antes de deslogar
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Se tiver refresh token, tentar renovar
      if (refreshToken && token) {
        try {
          console.log('🔄 Token expirado, tentando renovar com refresh token...');
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.token) {
              console.log('✅ Token renovado com sucesso');
              localStorage.setItem('auth_token', refreshData.token);
              
              // Tentar a requisição original novamente com o novo token
              const retryConfig = {
                ...options,
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${refreshData.token}`,
                  ...options.headers,
                },
              };
              
              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig);
              
              if (retryResponse.ok) {
                return await retryResponse.json();
              }
              
              // Se ainda der erro após renovar, continuar com o tratamento normal
            }
          } else {
            console.log('⚠️ Não foi possível renovar token, refresh token pode estar inválido');
          }
        } catch (refreshError) {
          console.error('❌ Erro ao tentar renovar token:', refreshError);
          // Continuar com o tratamento normal se falhar
        }
      }
      
      // Se não conseguiu renovar ou não tem refresh token, limpar tokens
      if (token) {
        console.log('⚠️ Removendo tokens inválidos');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
      
      const error = await response.json().catch(() => ({ error: 'Token inválido ou expirado' }));
      const err = new Error(error.error || 'Token inválido ou expirado');
      err.status = response.status;
      err.silent = true; // Marcar como silencioso para não logar no console
      throw err;
    }
    
    // Para 403, não remover token automaticamente (pode ser apenas falta de permissão)
    if (response.status === 403) {
      const error = await response.json().catch(() => ({ error: 'Acesso negado' }));
      const err = new Error(error.error || 'Acesso negado');
      err.status = response.status;
      throw err;
    }
    
    let errorData;
    try {
      errorData = await response.json();
    } catch (parseError) {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const err = new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
    err.status = response.status;
    err.response = { data: errorData }; // Adicionar response para compatibilidade
    err.details = errorData; // Preservar todos os detalhes do erro, incluindo debug
    throw err;
  }

  try {
    return await response.json();
  } catch (parseError) {
    console.error('Erro ao fazer parse da resposta JSON:', parseError);
    throw new Error('Resposta inválida do servidor');
  }
}

// Cliente de autenticação (similar ao base44.auth)
export const Auth = {
  // Login - pode ser chamado com email/password ou sem parâmetros (abre modal)
  async login(email, password) {
    // Se não tiver email/password, lança erro para que o componente abra o modal
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios. Use o componente LoginDialog.');
    }

    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Salvar tokens
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }
    
    return data.user;
  },

  // Registrar
  async register(email, password, full_name, phone = null, role = 'customer') {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, phone, role }),
    });
    
    // Salvar tokens
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }
    
    return data.user;
  },

  // Obter usuário atual
  async me() {
    // Se não houver token, retornar null silenciosamente em vez de fazer requisição
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const err = new Error('Não autenticado');
      err.status = 401;
      err.silent = true;
      throw err;
    }
    return request('/auth/me');
  },

  // Atualizar dados do usuário
  async updateMyUserData(data) {
    return request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Login com Google
  async loginWithGoogle(googleToken) {
    const data = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
    
    // Salvar tokens
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }
    
    return data.user;
  },

  // Logout
  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    
    // Enviar refresh token para revogar no servidor
    if (refreshToken) {
      try {
        await request('/auth/logout', { 
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        });
      } catch (error) {
        // Ignorar erros no logout (pode já estar deslogado)
      }
    }
  },

  // Filtrar usuários (admin apenas)
  async filter(filters = {}, orderBy, limit) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      params.append(key, value);
    });
    if (orderBy) params.append('order_by', orderBy);
    if (limit) params.append('limit', limit);
    
    return request(`/users?${params.toString()}`);
  },
};

// Cliente de entidades (similar ao base44.entities)
class EntityClient {
  constructor(entityName) {
    this.entityName = entityName;
  }

  // Listar todos
  async list(orderBy = '-created_at', limit = 50) {
    const params = new URLSearchParams();
    params.append('page', '1'); // Adicionar paginação
    if (orderBy) params.append('order_by', orderBy);
    if (limit) params.append('limit', limit);
    
    const response = await request(`/${this.entityName}?${params.toString()}`);
    
    // Se a resposta tem estrutura de paginação, extrair data
    if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
      return response.data;
    }
    
    // Fallback para compatibilidade com rotas sem paginação
    return response;
  }

  // Obter por ID
  async get(id) {
    return request(`/${this.entityName}/${id}`);
  }

  // Criar
  async create(data) {
    return request(`/${this.entityName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Atualizar
  async update(id, data) {
    return request(`/${this.entityName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Deletar
  async delete(id) {
    return request(`/${this.entityName}/${id}`, {
      method: 'DELETE',
    });
  }

  // Deletar em massa
  async deleteBulk(ids) {
    return request(`/${this.entityName}/bulk`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }

  // Filtrar
  async filter(filters = {}, orderBy, limit) {
    try {
      const params = new URLSearchParams();
      params.append('page', '1'); // Adicionar paginação
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      if (orderBy) params.append('order_by', orderBy);
      if (limit) params.append('limit', limit);
      
      const url = `/${this.entityName}?${params.toString()}`;
      console.log(`🔍 [${this.entityName}] Fazendo requisição:`, url);
      
      const response = await request(url);
      
      console.log(`✅ [${this.entityName}] Resposta recebida:`, {
        hasData: !!response,
        isArray: Array.isArray(response),
        hasPagination: response && typeof response === 'object' && 'data' in response,
        dataLength: Array.isArray(response) ? response.length : (response?.data?.length || 0)
      });
      
      // Se a resposta tem estrutura de paginação, extrair data
      if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
        return response.data;
      }
      
      // Fallback para compatibilidade com rotas sem paginação
      return response;
    } catch (error) {
      console.error(`❌ [${this.entityName}] Erro no filter:`, error);
      throw error;
    }
  }
}

// Exportar entidades (compatível com a interface do Base44)
export const Product = new EntityClient('products');

// Adicionar método específico para incrementar métricas (não requer autenticação)
Product.incrementMetric = async function(productId, metricType, viewSource = null) {
  // Fazer requisição sem token de autenticação (rota pública)
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  const response = await fetch(`${API_BASE_URL}/products/${productId}/metrics`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // Não incluir Authorization header - esta rota é pública
    },
    body: JSON.stringify({ metricType, viewSource }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    const err = new Error(errorData.error || `HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }
  
  return response.json();
};
export const Category = new EntityClient('categories');
export const Store = new EntityClient('stores');

// Adicionar método getBySlug para Store
Store.getBySlug = async function(slug) {
  return request(`/stores/slug/${slug}`);
};

// Adicionar método getStats para Store
Store.getStats = async function(storeId, options = {}) {
  const params = new URLSearchParams();
  if (options.period) {
    params.append('period', options.period);
  }
  if (options.start_date) {
    params.append('start_date', options.start_date);
  }
  if (options.end_date) {
    params.append('end_date', options.end_date);
  }
  const queryString = params.toString();
  return request(`/stores/${storeId}/stats${queryString ? `?${queryString}` : ''}`);
};
export const City = new EntityClient('cities');
export const Plan = new EntityClient('plans');
export const Subscription = new EntityClient('subscriptions');

// Cliente de Configurações
export const Settings = {
  // Obter todas as configurações
  async getAll(category) {
    const params = category ? `?category=${category}` : '';
    return request(`/settings${params}`);
  },

  // Obter configuração específica
  async get(key) {
    return request(`/settings/${key}`);
  },

  // Criar ou atualizar configuração (admin)
  async set(key, value, category, description) {
    return request('/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value, category, description }),
    });
  },

  // Atualizar múltiplas configurações (admin)
  async updateBulk(settings) {
    return request('/settings/bulk', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },
};

// Cliente de Customizações da Loja Online
export const StoreCustomizations = {
  // Obter customizações de uma loja (público)
  async getByStore(storeId) {
    return request(`/store-customizations/store/${storeId}`);
  },

  // Obter customizações da própria loja (autenticado)
  async getMyStore() {
    return request('/store-customizations/my-store');
  },

  // Salvar customizações (autenticado, requer plano Enterprise)
  async save(customizations) {
    return request('/store-customizations', {
      method: 'POST',
      body: JSON.stringify(customizations),
    });
  },
};

// Cliente de Promoções
export const Promotions = {
  // Listar promoções da loja
  async list() {
    return request('/promotions');
  },

  // Obter uma promoção específica
  async get(id) {
    return request(`/promotions/${id}`);
  },

  // Buscar promoções ativas de uma loja (público)
  async getActiveByStore(storeId) {
    return request(`/promotions/store/${storeId}/active`, {
      headers: {} // Não precisa de autenticação
    });
  },

  // Buscar promoções ativas de um produto (público)
  async getActiveByProduct(productId) {
    return request(`/promotions/product/${productId}/active`, {
      headers: {} // Não precisa de autenticação
    });
  },

  // Criar promoção
  async create(promotion) {
    return request('/promotions', {
      method: 'POST',
      body: JSON.stringify(promotion),
    });
  },

  // Atualizar promoção
  async update(id, promotion) {
    return request(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promotion),
    });
  },

  // Deletar promoção
  async delete(id) {
    return request(`/promotions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Atributos de categoria (para filtros e formulários dinâmicos)
export const CategoryAttributes = {
  // Listar todos os atributos de uma categoria
  async listByCategory(categoryId) {
    return request(`/category-attributes/category/${categoryId}`);
  },

  // Listar apenas atributos marcados como filtráveis (para sidebar de filtros)
  async listFilterableByCategory(categoryId) {
    return request(`/category-attributes/category/${categoryId}/filterable`);
  },

  // Operações administrativas (usadas em futuras telas do admin)
  async create(data) {
    return request('/category-attributes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/category-attributes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async remove(id) {
    return request(`/category-attributes/${id}`, {
      method: 'DELETE',
    });
  },
};

// Cliente de Campanhas do Marketplace
export const MarketplaceCampaigns = {
  // Listar campanhas ativas (público - não requer autenticação)
  async getActive() {
    try {
      return await request('/marketplace-campaigns/active');
    } catch (error) {
      // Se for erro de autenticação (401/403), tentar sem token (rota pública)
      if (error.status === 401 || error.status === 403) {
        const response = await fetch(`${API_BASE_URL}/marketplace-campaigns/active`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          return await response.json();
        }
      }
      // Se não for erro de auth ou se a requisição sem token também falhar, lançar erro
      throw error;
    }
  },

  // Listar todas as campanhas (admin)
  async list() {
    return request('/marketplace-campaigns');
  },

  // Obter campanha específica
  async get(id) {
    return request(`/marketplace-campaigns/${id}`);
  },

  // Criar campanha (admin)
  async create(campaign) {
    return request('/marketplace-campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  },

  // Atualizar campanha (admin)
  async update(id, campaign) {
    return request(`/marketplace-campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaign),
    });
  },

  // Deletar campanha (admin)
  async delete(id) {
    return request(`/marketplace-campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  // Listar participações de uma campanha (requer autenticação)
  async getParticipations(campaignId) {
    return request(`/marketplace-campaigns/${campaignId}/participations`);
  },

  // Listar participações aprovadas de uma campanha (público - não requer autenticação)
  async getPublicParticipations(campaignId) {
    try {
      return await request(`/marketplace-campaigns/${campaignId}/participations/public`);
    } catch (error) {
      // Se for erro de autenticação (401/403), tentar sem token (rota pública)
      if (error.status === 401 || error.status === 403) {
        const response = await fetch(`${API_BASE_URL}/marketplace-campaigns/${campaignId}/participations/public`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          return await response.json();
        }
      }
      throw error;
    }
  },
};

// Cliente de Participações em Campanhas
export const CampaignParticipations = {
  // Participar de uma campanha (lojista)
  async participate(data) {
    return request('/campaign-participations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Remover participação (lojista)
  async remove(id) {
    return request(`/campaign-participations/${id}`, {
      method: 'DELETE',
    });
  },

  // Aprovar/Rejeitar participação (admin)
  async updateStatus(id, status) {
    return request(`/campaign-participations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Listar campanhas disponíveis para participação (lojista)
  async getAvailable() {
    return request('/campaign-participations/available');
  },
};

// Cliente de Pedidos
export const Orders = {
  // Listar pedidos (cliente vê seus pedidos, loja vê pedidos da loja, admin vê todos)
  async list() {
    const response = await request('/orders?page=1&limit=50');
    
    // Se a resposta tem estrutura de paginação, extrair data
    if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
      return response.data;
    }
    
    // Fallback para compatibilidade com rotas sem paginação
    return response;
  },

  // Obter um pedido específico
  async get(id) {
    return request(`/orders/${id}`);
  },

  // Criar novo pedido
  async create(orderData) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Atualizar status do pedido (lojista ou admin)
  async updateStatus(id, status, tracking_number, notes) {
    return request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, tracking_number, notes }),
    });
  },

  // Atualizar status de pagamento (lojista ou admin)
  async updatePaymentStatus(id, payment_status, notes) {
    return request(`/orders/${id}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status, notes }),
    });
  },
};

// Cliente de Carrinho
export const Cart = {
  // Obter carrinho (agrupado por loja)
  async get() {
    return request('/cart');
  },

  // Adicionar item ao carrinho
  async addItem(product_id, quantity = 1) {
    return request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity }),
    });
  },

  // Atualizar quantidade de um item
  async updateItem(itemId, quantity) {
    return request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  // Remover item do carrinho
  async removeItem(itemId) {
    return request(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Limpar carrinho
  async clear() {
    return request('/cart', {
      method: 'DELETE',
    });
  },

  // Criar pedido a partir do carrinho (para uma loja específica)
  async checkout(storeId, checkoutData) {
    return request(`/cart/checkout/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });
  },
};

// Cliente de Reviews
export const Reviews = {
  // Listar avaliações de um produto
  async getByProduct(productId) {
    return request(`/reviews/product/${productId}`);
  },
  
  // Obter média de avaliações
  async getAverage(productId) {
    return request(`/reviews/product/${productId}/average`);
  },
  
  // Criar avaliação
  async create(reviewData) {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },
  
  // Atualizar avaliação
  async update(id, reviewData) {
    return request(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  },
  
  // Deletar avaliação
  async delete(id) {
    return request(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },
};

// Cliente de Favoritos
export const Favorites = {
  // Listar favoritos do usuário
  async list() {
    return request('/favorites');
  },
  
  // Verificar se produto está nos favoritos
  async check(productId) {
    return request(`/favorites/check/${productId}`);
  },
  
  // Adicionar aos favoritos
  async add(productId) {
    return request(`/favorites/${productId}`, {
      method: 'POST',
    });
  },
  
  // Remover dos favoritos
  async remove(productId) {
    return request(`/favorites/${productId}`, {
      method: 'DELETE',
    });
  },
};

// Cliente de Notificações
export const Notifications = {
  // Listar notificações
  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.unread_only) params.append('unread_only', 'true');
    if (options.limit) params.append('limit', options.limit);
    const query = params.toString();
    return request(`/notifications${query ? `?${query}` : ''}`);
  },
  
  // Contar não lidas
  async getUnreadCount() {
    return request('/notifications/unread/count');
  },
  
  // Marcar como lida
  async markAsRead(id) {
    return request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },
  
  // Marcar todas como lidas
  async markAllAsRead() {
    return request('/notifications/read-all', {
      method: 'PUT',
    });
  },
  
  // Deletar notificação
  async delete(id) {
    return request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// API do Mercado Pago
export const MercadoPago = {
  // Conectar conta do Mercado Pago
  async connect(store_id, access_token, public_key) {
    return await request('/mercadopago/connect', {
      method: 'POST',
      body: JSON.stringify({ store_id, access_token, public_key }),
    });
  },

  // Desconectar conta do Mercado Pago
  async disconnect(storeId) {
    return await request(`/mercadopago/disconnect/${storeId}`, {
      method: 'DELETE',
    });
  },

  // Gerar pagamento PIX
  async createPixPayment(store_id, amount, description, order_id) {
    return await request('/mercadopago/payment/pix', {
      method: 'POST',
      body: JSON.stringify({ store_id, amount, description, order_id }),
    });
  },

  // Gerar preferência de pagamento (link)
  async createPreference(store_id, items, order_id, back_urls) {
    return await request('/mercadopago/payment/preference', {
      method: 'POST',
      body: JSON.stringify({ store_id, items, order_id, back_urls }),
    });
  },

  // Verificar status de um pagamento
  async getPaymentStatus(paymentId, store_id) {
    return await request(`/mercadopago/payment/${paymentId}?store_id=${store_id}`, {
      method: 'GET',
    });
  },
};

// Cliente de Endereços do Usuário
export const UserAddresses = {
  // Listar endereços do usuário autenticado
  async list() {
    return request('/user-addresses');
  },

  // Obter endereço específico
  async get(id) {
    return request(`/user-addresses/${id}`);
  },

  // Criar novo endereço
  async create(address) {
    return request('/user-addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  },

  // Atualizar endereço
  async update(id, address) {
    return request(`/user-addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });
  },

  // Deletar endereço
  async delete(id) {
    return request(`/user-addresses/${id}`, {
      method: 'DELETE',
    });
  },

  // Definir endereço como padrão
  async setDefault(id) {
    return request(`/user-addresses/${id}/set-default`, {
      method: 'PATCH',
    });
  },
};

// Cliente de Pagamentos
export const Payments = {
  // Obter status de um pagamento
  async getStatus(paymentId) {
    return request(`/payments/${paymentId}/status`);
  },
  
  // Cancelar um pagamento
  async cancel(paymentId) {
    return request(`/payments/${paymentId}/cancel`, {
      method: 'POST',
    });
  },
};

// Exportar User como alias para Auth (compatibilidade)
export const User = Auth;

// Cliente principal (compatível com base44)
export const apiClient = {
  auth: Auth,
  entities: {
    Product,
    Category,
    Store,
    City,
    Plan,
    Subscription,
  },
};

