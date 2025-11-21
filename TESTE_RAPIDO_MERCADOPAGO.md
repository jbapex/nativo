# ⚡ Teste Rápido do Mercado Pago

## ✅ Checklist - O que você precisa:

- [x] **Backend rodando** (porta 3001) ✅
- [x] **Frontend rodando** (porta 3006) ✅
- [ ] **ngrok rodando** (para webhooks) ❌
- [ ] **Credenciais do Mercado Pago configuradas na loja** (verificar)
- [ ] **Webhook configurado no Mercado Pago** (após iniciar ngrok)

---

## 🚀 Passo a Passo Rápido

### **1. Iniciar ngrok** (necessário para webhooks)

Abra um terminal e execute:

```bash
ngrok http 3001
```

Você verá algo como:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copie a URL HTTPS** (ex: `https://abc123.ngrok-free.app`)

---

### **2. Configurar Webhook no Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **"Webhooks"** ou **"Notificações"**
4. **IMPORTANTE**: Clique na aba **"Modo de teste"** (não produção!)
5. Adicione a URL:
   ```
   https://SUA-URL-NGROK.ngrok-free.app/api/payments/webhook
   ```
6. Marque o evento: **"Pagamentos"**
7. Clique em **"Salvar"**

---

### **3. Configurar Credenciais na Loja**

1. Acesse o sistema: http://localhost:3006
2. Faça login como **lojista**
3. Vá em **"Minha Loja"** → **"Configurações"**
4. Na seção **"Métodos de Pagamento Aceitos"**:
   - ✅ Marque **"Mercado Pago"**
   - Clique em **"Salvar Métodos de Pagamento"**
5. Na seção **"Integração Mercado Pago"**:
   - Cole seu **Access Token** do Mercado Pago
   - Para teste, use credenciais que começam com `TEST-...`
   - Clique em **"Conectar Conta"**

**Onde obter as credenciais:**
- Acesse: https://www.mercadopago.com.br/developers/panel
- Vá em **"Credenciais"**
- Clique na aba **"Credenciais de Teste"**
- Copie o **Access Token** (começa com `TEST-...`)

---

### **4. Fazer um Pedido de Teste**

1. **Adicione produtos ao carrinho**
2. **Vá para o carrinho** (ícone do carrinho)
3. **Clique em "Finalizar Pedido"**
4. **Preencha os dados:**
   - Nome completo
   - Telefone
   - Endereço
   - CEP
5. **Selecione "Mercado Pago"** como método de pagamento
6. **Clique em "Finalizar Pedido"**

---

### **5. Completar Pagamento no Mercado Pago**

Você será redirecionado para o checkout do Mercado Pago.

#### **Para Teste (Credenciais de Teste):**

**Cartão de Crédito de Teste:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Nome: `APRO` (para pagamento aprovado)
- Data: Qualquer data futura (ex: 12/25)

**Outros códigos de teste:**
- `APRO` = Pagamento aprovado ✅
- `CONT` = Pagamento pendente ⏳
- `CALL` = Pagamento recusado ❌
- `FUND` = Pagamento recusado por falta de fundos ❌

**Para PIX:**
- Use credenciais de **PRODUÇÃO** (`APP_USR-...`) para gerar QR Codes escaneáveis
- Com credenciais de teste, o QR Code não pode ser escaneado por apps reais

---

### **6. Verificar se Funcionou**

#### **Opção 1: Interface Web do ngrok**
Acesse: http://127.0.0.1:4040

Você verá todas as requisições, incluindo:
- `POST /api/payments/webhook` (do Mercado Pago)

#### **Opção 2: Logs do Backend**
No terminal onde o backend está rodando, procure por:
```
Webhook recebido - Payment ID: 123456789
Pagamento atualizado: { status: 'approved', ... }
```

#### **Opção 3: Verificar no Sistema**
1. Após o pagamento, você será redirecionado para a página do pedido
2. O status do pagamento deve aparecer como **"Pago"** ou **"Aprovado"**
3. O status do pedido deve aparecer como **"Confirmado"**

---

## 🐛 Problemas Comuns

### **Erro: "Loja não aceita Mercado Pago"**
- ✅ Verifique se marcou "Mercado Pago" nos métodos de pagamento
- ✅ Verifique se salvou as configurações

### **Erro: "Credenciais não configuradas"**
- ✅ Verifique se colou o Access Token corretamente
- ✅ Verifique se clicou em "Conectar Conta"

### **Webhook não está sendo recebido**
- ✅ Verifique se o ngrok está rodando
- ✅ Verifique se a URL no Mercado Pago está correta
- ✅ Verifique se está no **"Modo de teste"** (não produção)
- ✅ Acesse http://127.0.0.1:4040 para ver as requisições

### **Pagamento não atualiza status**
- ✅ Verifique os logs do backend
- ✅ Verifique se o webhook foi recebido (ngrok interface)
- ✅ Aguarde alguns segundos (pode haver delay)

---

## 📝 Resumo Rápido

1. ✅ Iniciar ngrok: `ngrok http 3001`
2. ✅ Copiar URL HTTPS do ngrok
3. ✅ Configurar webhook no Mercado Pago (Modo de teste)
4. ✅ Configurar credenciais na loja (Access Token de teste)
5. ✅ Fazer pedido e pagar
6. ✅ Verificar se funcionou

---

## 🎯 Próximos Passos

Depois de testar com sucesso:
- ✅ Testar com diferentes status (aprovado, pendente, recusado)
- ✅ Testar com PIX (requer credenciais de produção)
- ✅ Preparar para produção (VPS com URL fixa)

---

**Dúvidas?** Verifique os logs do backend e a interface do ngrok (http://127.0.0.1:4040)

