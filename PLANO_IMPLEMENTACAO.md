# 🚀 PLANO DE IMPLEMENTAÇÃO - NATIVO

**Baseado nas decisões do modelo de negócio**

---

## 📋 FUNCIONALIDADES CRÍTICAS (FASE 1)

### **1. FILTRO POR CIDADE (URGENTE) ⚡**

**Por quê:** Modelo é "mercado local", mas não há filtro por cidade no Home.

**O que implementar:**

#### Backend:
- ✅ Já existe: produtos têm `store.city_id`
- ✅ Já existe: API de produtos aceita filtro por `store_id`
- ⚠️ **Falta:** Filtro por `city_id` na API de produtos

#### Frontend:
- ⚠️ **Falta:** Seletor de cidade no Home
- ⚠️ **Falta:** Salvar cidade selecionada (localStorage)
- ⚠️ **Falta:** Filtrar produtos por cidade
- ⚠️ **Falta:** Badge "Produtos da sua cidade"

**Arquivos a modificar:**
- `backend/routes/products.js` - Adicionar filtro por `city_id`
- `src/pages/Home.jsx` - Adicionar seletor de cidade
- `src/components/home/SearchBar.jsx` - Incluir cidade na busca

**Prioridade:** 🔴 URGENTE

---

### **2. CONFIGURAÇÃO DE PAGAMENTO DO LOJISTA**

**Por quê:** Cada lojista tem conta própria, precisa configurar chave PIX e link de pagamento.

**O que implementar:**

#### Backend:
- ⚠️ **Falta:** Campos na tabela `stores`:
  - `pix_key` (TEXT) - Chave PIX do lojista
  - `payment_link` (TEXT) - Link do Mercado Pago/PagSeguro
  - `payment_instructions` (TEXT) - Instruções personalizadas
- ⚠️ **Falta:** API para atualizar essas configurações

#### Frontend:
- ⚠️ **Falta:** Campos em `StoreSettings` para:
  - Chave PIX
  - Link de pagamento
  - Instruções de pagamento
- ⚠️ **Falta:** Validação de chave PIX

**Arquivos a modificar:**
- `backend/database/schema.sql` - Adicionar campos
- `backend/database/db.js` - Migração
- `backend/routes/stores.js` - Atualizar endpoint
- `src/components/store/StoreSettings.jsx` - Adicionar campos

**Prioridade:** 🔴 URGENTE (para checkout funcionar)

---

### **3. CONFIGURAÇÃO DE FRETE DO LOJISTA**

**Por quê:** Lojista define o valor do frete.

**O que implementar:**

#### Backend:
- ⚠️ **Falta:** Campos na tabela `stores`:
  - `shipping_fixed_price` (DECIMAL) - Frete fixo
  - `shipping_calculate_on_whatsapp` (BOOLEAN) - Calcular no WhatsApp
  - `shipping_free_threshold` (DECIMAL) - Frete grátis acima de X
- ⚠️ **Falta:** API para atualizar essas configurações

#### Frontend:
- ⚠️ **Falta:** Campos em `StoreSettings` para:
  - Valor do frete fixo
  - Checkbox "Calcular no WhatsApp"
  - Valor mínimo para frete grátis

**Arquivos a modificar:**
- `backend/database/schema.sql` - Adicionar campos
- `backend/database/db.js` - Migração
- `backend/routes/stores.js` - Atualizar endpoint
- `src/components/store/StoreSettings.jsx` - Adicionar campos

**Prioridade:** 🟡 IMPORTANTE

---

### **4. CHECKOUT COM PIX E LINK DE PAGAMENTO**

**Por quê:** Lojistas Premium com checkout precisam processar pagamentos.

**O que implementar:**

#### Backend:
- ✅ Já existe: Endpoint de checkout (`/api/cart/checkout/:storeId`)
- ⚠️ **Falta:** Buscar configurações de pagamento da loja
- ⚠️ **Falta:** Gerar QR Code PIX (biblioteca)
- ⚠️ **Falta:** Retornar link de pagamento ou QR Code

#### Frontend:
- ✅ Já existe: Página de checkout (`Cart.jsx`)
- ⚠️ **Falta:** Exibir QR Code PIX
- ⚠️ **Falta:** Botão para copiar chave PIX
- ⚠️ **Falta:** Botão para abrir link de pagamento
- ⚠️ **Falta:** Exibir instruções de pagamento
- ⚠️ **Falta:** Cálculo de frete no checkout

**Bibliotecas necessárias:**
- `qrcode` (npm) - Gerar QR Code PIX
- `pix-utils` ou similar - Validar chave PIX

**Arquivos a modificar:**
- `backend/routes/cart.js` - Atualizar checkout
- `src/pages/Cart.jsx` - Melhorar interface de checkout
- `src/components/ui/qrcode.jsx` - Componente de QR Code (novo)

**Prioridade:** 🔴 URGENTE (para checkout funcionar)

---

### **5. DIFERENCIAÇÃO VISUAL ENTRE PLANOS**

**Por quê:** Clientes precisam saber quais lojas têm loja online e checkout.

**O que implementar:**

#### Frontend:
- ⚠️ **Falta:** Badge "Loja Online" em produtos de lojas Premium
- ⚠️ **Falta:** Badge "Comprar Online" em produtos com checkout
- ⚠️ **Falta:** Seção "Lojas Online Premium" no Home
- ⚠️ **Falta:** Link direto para loja no card do produto
- ⚠️ **Falta:** Botão "Ver Loja" em produtos de lojas Premium

**Arquivos a modificar:**
- `src/components/products/ProductCard.jsx` - Adicionar badges
- `src/pages/Home.jsx` - Adicionar seção "Lojas Online"
- `src/pages/ProductDetail.jsx` - Adicionar botão "Ver Loja"

**Prioridade:** 🟡 IMPORTANTE

---

### **6. ESCOLHA DE MODO DE CHECKOUT (WhatsApp/Checkout/Ambos)**

**Por quê:** Lojista escolhe como cliente pode comprar.

**O que implementar:**

#### Backend:
- ✅ Já existe: Campo `checkout_enabled` (BOOLEAN)
- ⚠️ **Falta:** Campo `checkout_mode` (TEXT) - 'whatsapp', 'checkout', 'both'
- ⚠️ **Falta:** Ou usar lógica: `checkout_enabled = true` = ambos, `false` = apenas WhatsApp

#### Frontend:
- ⚠️ **Falta:** Interface para lojista escolher modo
- ⚠️ **Falta:** Lógica para mostrar botões corretos:
  - `whatsapp`: Apenas botão "Contatar"
  - `checkout`: Apenas botão "Comprar"
  - `both`: Ambos os botões

**Arquivos a modificar:**
- `backend/database/schema.sql` - Adicionar campo (ou usar lógica)
- `src/components/store/StoreSettings.jsx` - Adicionar opção
- `src/pages/ProductDetail.jsx` - Lógica de botões
- `src/components/products/ProductCard.jsx` - Lógica de botões

**Prioridade:** 🟡 IMPORTANTE

---

## 📅 CRONOGRAMA SUGERIDO

### **SEMANA 1-2: Filtro por Cidade + Configurações**
- ✅ Filtro por cidade no Home
- ✅ Configuração de pagamento (PIX, link)
- ✅ Configuração de frete

### **SEMANA 3-4: Checkout Funcional**
- ✅ Checkout com QR Code PIX
- ✅ Checkout com link de pagamento
- ✅ Cálculo de frete no checkout

### **SEMANA 5-6: Diferenciação Visual**
- ✅ Badges de diferenciação
- ✅ Seção "Lojas Online" no Home
- ✅ Escolha de modo de checkout

---

## 🔧 DETALHAMENTO TÉCNICO

### **1. Filtro por Cidade**

**Backend (`backend/routes/products.js`):**
```javascript
// Adicionar filtro por city_id
if (req.query.city_id) {
  query += ' AND s.city_id = ?';
  params.push(req.query.city_id);
}
```

**Frontend (`src/pages/Home.jsx`):**
```javascript
// Adicionar seletor de cidade
const [selectedCity, setSelectedCity] = useState(
  localStorage.getItem('selectedCity') || null
);

// Salvar no localStorage
useEffect(() => {
  if (selectedCity) {
    localStorage.setItem('selectedCity', selectedCity);
  }
}, [selectedCity]);

// Filtrar produtos
const filteredProducts = products.filter(product => {
  if (selectedCity) {
    return product.store_city_id === selectedCity;
  }
  return true;
});
```

---

### **2. Configuração de Pagamento**

**Migração (`backend/database/db.js`):**
```javascript
// Adicionar campos na tabela stores
const addPaymentFields = db.prepare(`
  ALTER TABLE stores 
  ADD COLUMN pix_key TEXT,
  ADD COLUMN payment_link TEXT,
  ADD COLUMN payment_instructions TEXT
`);
```

**StoreSettings (`src/components/store/StoreSettings.jsx`):**
```jsx
<Input
  label="Chave PIX"
  value={formData.pix_key || ''}
  onChange={(e) => handleChange('pix_key', e.target.value)}
  placeholder="00000000000 ou email@exemplo.com"
/>

<Input
  label="Link de Pagamento (Mercado Pago, PagSeguro, etc.)"
  value={formData.payment_link || ''}
  onChange={(e) => handleChange('payment_link', e.target.value)}
  placeholder="https://..."
/>

<Textarea
  label="Instruções de Pagamento"
  value={formData.payment_instructions || ''}
  onChange={(e) => handleChange('payment_instructions', e.target.value)}
  placeholder="Ex: Envie o comprovante via WhatsApp após o pagamento"
/>
```

---

### **3. Checkout com PIX**

**Backend (`backend/routes/cart.js`):**
```javascript
// No endpoint de checkout
const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId);

// Gerar QR Code PIX
if (store.pix_key) {
  const qrCode = generatePixQRCode({
    key: store.pix_key,
    amount: totalAmount,
    description: `Pedido #${orderId}`
  });
  
  orderResponse.pix_qr_code = qrCode;
  orderResponse.pix_key = store.pix_key;
}

// Link de pagamento
if (store.payment_link) {
  orderResponse.payment_link = store.payment_link;
}
```

**Frontend (`src/pages/Cart.jsx`):**
```jsx
{order.pix_qr_code && (
  <div>
    <QRCode value={order.pix_qr_code} />
    <Button onClick={() => copyToClipboard(order.pix_key)}>
      Copiar Chave PIX
    </Button>
  </div>
)}

{order.payment_link && (
  <Button onClick={() => window.open(order.payment_link)}>
    Pagar com Mercado Pago
  </Button>
)}
```

---

## 📦 DEPENDÊNCIAS NECESSÁRIAS

### **Backend:**
```bash
npm install qrcode pix-utils
```

### **Frontend:**
```bash
npm install qrcode.react
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **FASE 1 - Filtro por Cidade**
- [ ] Adicionar filtro `city_id` na API de produtos
- [ ] Criar seletor de cidade no Home
- [ ] Salvar cidade no localStorage
- [ ] Filtrar produtos por cidade
- [ ] Badge "Produtos da sua cidade"

### **FASE 2 - Configurações de Pagamento e Frete**
- [ ] Adicionar campos `pix_key`, `payment_link`, `payment_instructions` na tabela `stores`
- [ ] Criar migração no `db.js`
- [ ] Adicionar campos em `StoreSettings`
- [ ] Adicionar campos `shipping_fixed_price`, `shipping_calculate_on_whatsapp` na tabela `stores`
- [ ] Adicionar campos de frete em `StoreSettings`

### **FASE 3 - Checkout Funcional**
- [ ] Instalar biblioteca `qrcode`
- [ ] Criar função para gerar QR Code PIX
- [ ] Atualizar endpoint de checkout para retornar QR Code
- [ ] Criar componente de QR Code no frontend
- [ ] Adicionar botão "Copiar Chave PIX"
- [ ] Adicionar botão para link de pagamento
- [ ] Calcular frete no checkout

### **FASE 4 - Diferenciação Visual**
- [ ] Badge "Loja Online" em produtos Premium
- [ ] Badge "Comprar Online" em produtos com checkout
- [ ] Seção "Lojas Online Premium" no Home
- [ ] Link direto para loja no card do produto
- [ ] Botão "Ver Loja" em ProductDetail

---

## 🎯 PRÓXIMOS PASSOS

1. **Começar pela FASE 1** (Filtro por Cidade) - Mais crítico
2. **Depois FASE 2** (Configurações) - Necessário para checkout
3. **Depois FASE 3** (Checkout) - Funcionalidade principal
4. **Por último FASE 4** (Diferenciação) - Melhora UX

---

**Documento criado em:** Dezembro 2024  
**Última atualização:** Dezembro 2024

