# 📋 FASE 2: FUNCIONALIDADES ESSENCIAIS - PLANO DETALHADO

**Status:** ⏳ Aguardando Aprovação  
**Duração Estimada:** 3-4 semanas  
**Prioridade:** 🔴 CRÍTICA (Necessário para produção)

---

## 🎯 OBJETIVO DA FASE 2

Implementar as funcionalidades essenciais que permitirão ao sistema funcionar completamente em produção, focando em:
1. **Pagamentos flexíveis** (Mercado Pago opcional + WhatsApp - lojista escolhe)
2. **Cálculo de frete** (integração com Correios/Melhor Envio)
3. **Cupons de desconto**
4. **Melhorias de UX/UI** críticas

### **🎯 Diferencial:**
- **Lojista tem controle total:** Pode escolher usar Mercado Pago, WhatsApp, ou ambos
- **Flexibilidade:** Atende desde pequenos negócios (apenas WhatsApp) até lojas maiores (Mercado Pago)
- **WhatsApp mantido:** Método atual continua funcionando normalmente

---

## 📦 1. INTEGRAÇÃO DE PAGAMENTO (Mercado Pago + WhatsApp)

### **O que será implementado:**

#### **Backend:**
- ✅ **Configuração de Métodos de Pagamento por Loja**
  - Adicionar campo `payment_methods` na tabela `stores`
  - Permitir que lojista escolha: Mercado Pago, WhatsApp, ou ambos
  - Endpoint `PUT /api/stores/:id/payment-methods` para configurar
  - Endpoint `GET /api/stores/:id/payment-methods` para consultar

- ✅ **Configuração do Mercado Pago (Opcional)**
  - Adicionar variáveis de ambiente (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`)
  - Configurar credenciais de teste e produção
  - Criar utilitário para inicializar SDK do Mercado Pago
  - **Importante:** Mercado Pago só será usado se a loja tiver configurado

- ✅ **Criar Preferência de Pagamento (Apenas se loja usar Mercado Pago)**
  - Endpoint `POST /api/payments/create-preference`
  - Verificar se loja aceita Mercado Pago antes de criar
  - Gerar preferência com dados do pedido
  - Suportar múltiplos métodos: PIX, Cartão, Boleto
  - Incluir informações do comprador e itens

- ✅ **Webhook de Confirmação**
  - Endpoint `POST /api/payments/webhook`
  - Receber notificações do Mercado Pago
  - Validar assinatura do webhook
  - Atualizar status do pedido automaticamente
  - Criar notificações para lojista e cliente

- ✅ **Consultar Status de Pagamento**
  - Endpoint `GET /api/payments/:paymentId/status`
  - Sincronizar status manualmente se necessário
  - Retornar informações detalhadas do pagamento

- ✅ **Cancelar Pagamento**
  - Endpoint `POST /api/payments/:paymentId/cancel`
  - Permitir cancelamento de pagamentos pendentes
  - Atualizar status do pedido

#### **Frontend:**
- ✅ **Configuração de Métodos de Pagamento (Lojista)**
  - Adicionar seção em "Configurações da Loja"
  - Checkbox para ativar/desativar Mercado Pago
  - Checkbox para ativar/desativar WhatsApp
  - Salvar preferências da loja
  - Mostrar aviso se nenhum método estiver ativo

- ✅ **Componente de Checkout Dinâmico**
  - Verificar métodos aceitos pela loja
  - Se Mercado Pago ativo: mostrar botão "Pagar com Mercado Pago"
  - Se WhatsApp ativo: mostrar botão "Finalizar via WhatsApp"
  - Se ambos ativos: mostrar ambas as opções
  - Redirecionar conforme método escolhido

- ✅ **Página de Confirmação de Pagamento (Mercado Pago)**
  - Exibir status do pagamento (aprovado, pendente, rejeitado)
  - Mostrar instruções para PIX/Boleto
  - Link para acompanhar pedido

- ✅ **Atualizar Fluxo de Checkout**
  - Manter método WhatsApp funcionando (se loja aceitar)
  - Adicionar método Mercado Pago (se loja aceitar)
  - Validar dados antes de criar preferência
  - Mostrar apenas métodos aceitos pela loja

#### **Banco de Dados:**
- ✅ **Atualizar tabela `stores`**
  - Adicionar campo `payment_methods` (TEXT) - JSON array: `["mercadopago", "whatsapp"]`
  - Adicionar campo `mp_access_token` (TEXT) - Token do Mercado Pago (opcional, por loja)
  - Adicionar campo `mp_public_key` (TEXT) - Chave pública do Mercado Pago (opcional, por loja)
  - **Nota:** Se loja não usar Mercado Pago, esses campos ficam NULL

- ✅ **Tabela `payments`**
  ```sql
  CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_id TEXT, -- ID do Mercado Pago (se aplicável)
    status TEXT NOT NULL, -- pending, approved, rejected, cancelled
    payment_method TEXT, -- mercadopago, whatsapp
    payment_type TEXT, -- pix, credit_card, debit_card, boleto, whatsapp
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'BRL',
    mp_preference_id TEXT, -- NULL se for WhatsApp
    mp_payment_id TEXT, -- NULL se for WhatsApp
    metadata TEXT, -- JSON com dados adicionais
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
  ```

- ✅ **Atualizar tabela `orders`**
  - Adicionar campo `payment_id` (referência ao payment)
  - Adicionar campo `mp_preference_id` (NULL se for WhatsApp)
  - Campo `payment_method` já existe, manter compatibilidade

#### **Arquivos que serão criados/modificados:**
- `backend/routes/payments.js` (novo)
- `backend/routes/stores.js` (adicionar endpoints de payment-methods)
- `backend/utils/mercadopago.js` (novo)
- `backend/database/schema.sql` (atualizar)
- `backend/database/db.js` (migração)
- `src/pages/Checkout.jsx` (modificar - métodos dinâmicos)
- `src/pages/PaymentConfirmation.jsx` (novo)
- `src/components/payments/MercadoPagoButton.jsx` (novo)
- `src/components/store/StoreSettings.jsx` (adicionar configuração de pagamentos)
- `src/pages/StoreProfile.jsx` (adicionar seção de métodos de pagamento)

---

## 🚚 2. SISTEMA DE FRETE

### **O que será implementado:**

#### **Opção A: Integração com Melhor Envio (Recomendado)**
- ✅ **Vantagens:**
  - API mais simples e moderna
  - Suporta múltiplas transportadoras
  - Cálculo automático de frete
  - Geração de etiquetas
  - Rastreamento integrado

#### **Opção B: Integração com Correios (Alternativa)**
- ✅ **Vantagens:**
  - Mais conhecido no Brasil
  - API oficial
  - Cálculo preciso

#### **Backend:**
- ✅ **Configuração da API de Frete**
  - Adicionar variáveis de ambiente (`MELHOR_ENVIO_TOKEN` ou `CORREIOS_TOKEN`)
  - Criar utilitário para calcular frete

- ✅ **Calcular Frete**
  - Endpoint `POST /api/shipping/calculate`
  - Receber: CEP origem, CEP destino, dimensões, peso
  - Retornar: Opções de frete com preço e prazo
  - Cache de resultados (evitar muitas chamadas)

- ✅ **Salvar Endereço de Entrega**
  - Integrar com `user_addresses`
  - Validar CEP antes de calcular frete

- ✅ **Gerar Etiqueta (Melhor Envio)**
  - Endpoint `POST /api/shipping/generate-label`
  - Gerar etiqueta após pedido confirmado
  - Salvar PDF da etiqueta

#### **Frontend:**
- ✅ **Componente de Cálculo de Frete**
  - Campo para CEP
  - Botão "Calcular Frete"
  - Exibir opções: PAC, SEDEX, etc.
  - Mostrar preço e prazo de entrega
  - Selecionar opção de frete

- ✅ **Atualizar Checkout**
  - Incluir cálculo de frete no resumo
  - Atualizar total com frete
  - Validar CEP antes de finalizar

- ✅ **Melhorar ShippingCalculator (ProductDetail)**
  - Integrar com API real
  - Mostrar opções reais de frete
  - Cache local para melhor UX

#### **Banco de Dados:**
- ✅ **Tabela `shipping_options`**
  ```sql
  CREATE TABLE shipping_options (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    carrier TEXT, -- correios, jadlog, etc
    service TEXT, -- PAC, SEDEX, etc
    price REAL NOT NULL,
    delivery_time INTEGER, -- dias
    tracking_code TEXT,
    label_url TEXT, -- URL do PDF da etiqueta
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
  ```

- ✅ **Atualizar tabela `orders`**
  - Adicionar campo `shipping_price`
  - Adicionar campo `shipping_method`
  - Adicionar campo `shipping_carrier`
  - Adicionar campo `tracking_code`

#### **Arquivos que serão criados/modificados:**
- `backend/routes/shipping.js` (novo)
- `backend/utils/shipping.js` (novo) ou `backend/utils/melhorenvio.js` (novo)
- `backend/database/schema.sql` (atualizar)
- `backend/database/db.js` (migração)
- `src/components/products/ShippingCalculator.jsx` (modificar)
- `src/pages/Checkout.jsx` (modificar)
- `src/components/shipping/ShippingOptions.jsx` (novo)

---

## 🎟️ 3. CUPONS DE DESCONTO

### **O que será implementado:**

#### **Backend:**
- ✅ **CRUD de Cupons**
  - `POST /api/coupons` - Criar cupom (admin/lojista)
  - `GET /api/coupons` - Listar cupons
  - `GET /api/coupons/:code` - Validar cupom
  - `PUT /api/coupons/:id` - Atualizar cupom
  - `DELETE /api/coupons/:id` - Deletar cupom

- ✅ **Tipos de Cupom:**
  - **Percentual:** Desconto de X%
  - **Valor Fixo:** Desconto de R$ X
  - **Frete Grátis:** Desconto no frete
  - **Produto Específico:** Desconto em produto específico
  - **Categoria:** Desconto em categoria
  - **Loja:** Desconto em toda a loja

- ✅ **Validações:**
  - Data de validade (início e fim)
  - Limite de uso (total e por usuário)
  - Valor mínimo do pedido
  - Aplicável apenas para produtos/lojas específicas
  - Verificar se cupom está ativo

- ✅ **Aplicar Cupom no Pedido**
  - Endpoint `POST /api/orders/:id/apply-coupon`
  - Validar cupom
  - Calcular desconto
  - Atualizar total do pedido

#### **Frontend:**
- ✅ **Componente de Cupom**
  - Campo para inserir código do cupom
  - Botão "Aplicar"
  - Exibir desconto aplicado
  - Permitir remover cupom

- ✅ **Página de Gerenciamento (Admin/Lojista)**
  - Listar cupons criados
  - Criar novo cupom
  - Editar cupom
  - Ver estatísticas (usos, valor descontado)

- ✅ **Integrar no Checkout**
  - Adicionar campo de cupom
  - Aplicar desconto no resumo
  - Validar cupom em tempo real

#### **Banco de Dados:**
- ✅ **Tabela `coupons`**
  ```sql
  CREATE TABLE coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    store_id TEXT, -- NULL = cupom global
    type TEXT NOT NULL, -- percentage, fixed, free_shipping
    value REAL NOT NULL, -- valor do desconto
    min_order_value REAL, -- valor mínimo do pedido
    max_discount REAL, -- desconto máximo (para percentual)
    usage_limit INTEGER, -- limite total de usos
    usage_count INTEGER DEFAULT 0,
    user_limit INTEGER DEFAULT 1, -- limite por usuário
    start_date DATETIME,
    end_date DATETIME,
    active BOOLEAN DEFAULT 1,
    applicable_to TEXT, -- all, products, categories, stores
    applicable_ids TEXT, -- JSON array de IDs
    created_by TEXT, -- user_id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
  ```

- ✅ **Tabela `coupon_usage`**
  ```sql
  CREATE TABLE coupon_usage (
    id TEXT PRIMARY KEY,
    coupon_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    discount_amount REAL NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  ```

- ✅ **Atualizar tabela `orders`**
  - Adicionar campo `coupon_id`
  - Adicionar campo `discount_amount`

#### **Arquivos que serão criados/modificados:**
- `backend/routes/coupons.js` (novo)
- `backend/utils/coupons.js` (novo)
- `backend/database/schema.sql` (atualizar)
- `backend/database/db.js` (migração)
- `src/pages/Coupons.jsx` (novo - admin/lojista)
- `src/components/coupons/CouponInput.jsx` (novo)
- `src/pages/Checkout.jsx` (modificar)
- `src/pages/Cart.jsx` (modificar - adicionar cupom)

---

## 🎨 4. MELHORIAS DE UX/UI CRÍTICAS

### **O que será implementado:**

#### **Checkout:**
- ✅ **Melhorar Fluxo de Checkout**
  - Passo a passo visual (1. Endereço, 2. Frete, 3. Pagamento)
  - Indicador de progresso
  - Validação em tempo real
  - Mensagens de erro mais claras
  - Loading states

- ✅ **Resumo do Pedido Melhorado**
  - Lista de produtos com imagens
  - Cálculo de subtotal, frete, desconto, total
  - Exibir cupom aplicado
  - Mostrar endereço de entrega

#### **Páginas de Pedido:**
- ✅ **Status de Pagamento Visível**
  - Badge de status (Pago, Pendente, Rejeitado)
  - Instruções para PIX/Boleto
  - QR Code do PIX (se aplicável)
  - Link para acompanhar no Mercado Pago

- ✅ **Rastreamento de Pedido**
  - Exibir código de rastreamento
  - Link para rastrear nos Correios
  - Timeline de status de entrega

#### **Notificações:**
- ✅ **Notificações de Pagamento**
  - Notificar quando pagamento for aprovado
  - Notificar quando pagamento for rejeitado
  - Notificar lojista sobre novo pedido pago

- ✅ **Notificações de Entrega**
  - Notificar quando pedido for enviado
  - Notificar quando pedido for entregue

#### **Mobile:**
- ✅ **Melhorar Responsividade**
  - Checkout mobile-friendly
  - Formulários otimizados para mobile
  - Botões com tamanho adequado

#### **Arquivos que serão modificados:**
- `src/pages/Cart.jsx` (melhorar checkout)
- `src/pages/OrderDetail.jsx` (adicionar status de pagamento)
- `src/components/notifications/NotificationCenter.jsx` (se existir)
- `src/pages/Checkout.jsx` (criar/melhorar)

---

## 📊 RESUMO DA FASE 2

### **Funcionalidades:**
1. ✅ Pagamento flexível (Mercado Pago opcional + WhatsApp - escolha do lojista)
2. ✅ Cálculo de frete real
3. ✅ Sistema de cupons de desconto
4. ✅ Melhorias críticas de UX/UI

### **Arquivos Novos (estimado):**
- Backend: ~8 arquivos
- Frontend: ~6 arquivos
- Database: 3 novas tabelas + atualizações

### **Arquivos Modificados (estimado):**
- Backend: ~5 arquivos
- Frontend: ~8 arquivos

### **Dependências Novas:**
- `mercadopago` (já instalado, precisa configurar)
- `axios` ou `node-fetch` (para APIs de frete)
- Possivelmente SDK do Melhor Envio ou Correios

### **Variáveis de Ambiente Novas:**
```env
# Mercado Pago (Opcional - pode ser configurado por loja também)
MP_ACCESS_TOKEN=seu-token-aqui  # Token global (fallback)
MP_PUBLIC_KEY=sua-chave-publica-aqui  # Chave global (fallback)
MP_WEBHOOK_SECRET=seu-secret-webhook-aqui

# Frete (escolher uma opção)
MELHOR_ENVIO_TOKEN=seu-token-aqui
# OU
CORREIOS_TOKEN=seu-token-aqui
```

**Nota:** Mercado Pago pode ser configurado globalmente (variáveis de ambiente) ou por loja (campo no banco). Se configurado por loja, cada lojista pode ter suas próprias credenciais.

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Mercado Pago (Opcional por Loja):**
   - Lojista escolhe se quer usar Mercado Pago ou não
   - Se escolher usar, precisa configurar credenciais (pode ser por loja ou global)
   - Usar credenciais de teste primeiro
   - Configurar webhook URL em produção
   - **Importante:** WhatsApp continua funcionando normalmente para lojas que preferirem

2. **WhatsApp (Método Alternativo):**
   - Mantido como está (funcionando)
   - Lojista pode escolher usar apenas WhatsApp
   - Lojista pode escolher usar ambos (Mercado Pago + WhatsApp)
   - Cliente escolhe o método no checkout

3. **Frete:**
   - Recomendo começar com Melhor Envio (mais simples)
   - Pode adicionar Correios depois se necessário
   - Em desenvolvimento, pode usar valores simulados

4. **Cupons:**
   - Sistema completo de cupons
   - Pode ser usado por admin (cupons globais) ou lojista (cupons da loja)

5. **Testes:**
   - Adicionar testes para pagamentos
   - Adicionar testes para cupons
   - Testes de integração com APIs externas (mockados)
   - Testar fluxo com apenas WhatsApp, apenas Mercado Pago, e ambos

---

## ✅ CHECKLIST DE APROVAÇÃO

Antes de começar, confirme:

- [ ] Aprova integração com Mercado Pago (opcional por loja)
- [ ] Aprova manter WhatsApp como método de pagamento (escolha do lojista)
- [ ] Aprova que lojista possa escolher métodos aceitos (Mercado Pago, WhatsApp, ou ambos)
- [ ] Aprova integração com Melhor Envio (ou prefere Correios?)
- [ ] Aprova sistema de cupons de desconto
- [ ] Aprova melhorias de UX/UI propostas
- [ ] Tem conta no Mercado Pago (ou posso criar em modo teste)?
- [ ] Tem conta no Melhor Envio (ou posso criar em modo teste)?

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

1. **Semana 1:** 
   - Configuração de métodos de pagamento por loja (Backend + Frontend)
   - Integração Mercado Pago (Backend + Frontend)
   - Manter WhatsApp funcionando
   - Testar ambos os métodos

2. **Semana 2:** Sistema de Frete (Backend + Frontend)

3. **Semana 3:** Cupons de Desconto (Backend + Frontend)

4. **Semana 4:** Melhorias UX/UI + Testes + Ajustes

---

**Aguardando sua aprovação para começar!** 🎯

