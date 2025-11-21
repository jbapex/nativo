# 🏪 Configuração do Mercado Pago para Lojistas

## 📋 Como está configurado atualmente

### **Opção Atual: Credenciais por Loja** ✅

Cada lojista precisa:

1. ✅ **Criar uma conta no Mercado Pago**
   - Acessar: https://www.mercadopago.com.br
   - Criar conta de vendedor

2. ✅ **Criar um aplicativo no Mercado Pago**
   - Acessar: https://www.mercadopago.com.br/developers/panel
   - Criar novo aplicativo
   - Obter **Access Token** e **Public Key**

3. ✅ **Configurar credenciais no sistema**
   - Acessar configurações da loja
   - Inserir Access Token e Public Key
   - Ativar método de pagamento "Mercado Pago"

4. ✅ **Configurar webhook**
   - Cada lojista precisa configurar o webhook no painel do Mercado Pago
   - URL: `https://seu-dominio.com/api/payments/webhook`
   - Evento: **Pagamentos**

---

## 💰 Como funciona o pagamento

### **Fluxo atual:**

```
Cliente faz pedido
    ↓
Sistema cria preferência de pagamento usando credenciais da LOJA
    ↓
Cliente paga no Mercado Pago
    ↓
💰 Dinheiro vai direto para a conta do LOJISTA no Mercado Pago
    ↓
Webhook atualiza status do pedido
```

**Vantagens:**
- ✅ Cada lojista recebe o dinheiro diretamente na sua conta
- ✅ Não precisa de intermediário
- ✅ Lojista tem controle total sobre seus pagamentos
- ✅ Mais simples de implementar

**Desvantagens:**
- ⚠️ Cada lojista precisa criar conta e aplicativo
- ⚠️ Cada lojista precisa configurar webhook
- ⚠️ Mais complexo para o lojista configurar

---

## 🔄 Alternativa: Marketplace (Não implementado)

### **Como funcionaria:**

```
Cliente faz pedido
    ↓
Sistema cria preferência usando credenciais do MARKETPLACE
    ↓
Cliente paga no Mercado Pago
    ↓
💰 Dinheiro vai para a conta do MARKETPLACE
    ↓
Sistema distribui o dinheiro para cada lojista
    ↓
Webhook atualiza status do pedido
```

**Vantagens:**
- ✅ Lojista não precisa criar conta no Mercado Pago
- ✅ Configuração mais simples para o lojista
- ✅ Você tem controle sobre os pagamentos
- ✅ Pode cobrar taxa de marketplace

**Desvantagens:**
- ❌ Requer configuração de Marketplace no Mercado Pago
- ❌ Você precisa distribuir os pagamentos manualmente
- ❌ Mais complexo de implementar
- ❌ Requer aprovação do Mercado Pago como Marketplace

---

## 🎯 Qual opção escolher?

### **Use "Credenciais por Loja" se:**
- ✅ Você quer que cada lojista receba o dinheiro diretamente
- ✅ Você não quer ser responsável por distribuir pagamentos
- ✅ Você não quer cobrar taxa de marketplace
- ✅ Você quer uma implementação mais simples

### **Use "Marketplace" se:**
- ✅ Você quer centralizar todos os pagamentos
- ✅ Você quer cobrar taxa de marketplace
- ✅ Você quer simplificar a configuração para lojistas
- ✅ Você tem aprovação do Mercado Pago como Marketplace

---

## 📝 Passo a passo para o lojista (Opção Atual)

### **1. Criar conta no Mercado Pago**
1. Acesse: https://www.mercadopago.com.br
2. Clique em "Criar conta"
3. Preencha os dados (CPF/CNPJ, e-mail, etc.)
4. Complete a verificação de identidade

### **2. Criar aplicativo**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Clique em "Criar aplicativo"
3. Preencha:
   - Nome do aplicativo (ex: "Minha Loja - Local Mart")
   - Descrição
4. Clique em "Criar"

### **3. Obter credenciais**
1. No painel do aplicativo, vá em "Credenciais"
2. Copie:
   - **Access Token** (Produção)
   - **Public Key** (Produção)

### **4. Configurar no sistema**
1. Acesse configurações da loja
2. Vá em "Pagamentos"
3. Cole o Access Token e Public Key
4. Ative "Mercado Pago" nos métodos de pagamento

### **5. Configurar webhook**
1. No painel do Mercado Pago, vá em "Webhooks"
2. Adicione URL: `https://seu-dominio.com/api/payments/webhook`
3. Selecione evento: **Pagamentos**
4. Salve

---

## 🔐 Segurança

### **Importante:**
- ⚠️ **Access Token** é confidencial - nunca compartilhe
- ⚠️ Cada lojista deve usar suas próprias credenciais
- ⚠️ Não use credenciais de teste em produção
- ⚠️ Configure webhook apenas em produção

---

## 📊 Resumo

| Aspecto | Credenciais por Loja | Marketplace |
|---------|---------------------|-------------|
| **Configuração do lojista** | Mais complexa | Mais simples |
| **Quem recebe o dinheiro** | Lojista diretamente | Marketplace (depois distribui) |
| **Taxa de marketplace** | Não | Sim (opcional) |
| **Complexidade técnica** | Simples | Complexa |
| **Status atual** | ✅ Implementado | ❌ Não implementado |

---

## 🎯 Recomendação

**Para começar, use "Credenciais por Loja"** porque:
- ✅ Já está implementado
- ✅ Funciona bem para a maioria dos casos
- ✅ Lojista tem controle total
- ✅ Mais simples de manter

**Considere Marketplace no futuro se:**
- Você quiser centralizar pagamentos
- Você quiser cobrar taxa de marketplace
- Você tiver muitos lojistas e quiser simplificar

