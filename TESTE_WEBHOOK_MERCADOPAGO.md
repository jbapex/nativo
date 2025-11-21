# 🧪 Teste do Webhook do Mercado Pago

## ✅ Checklist Antes de Testar

- [ ] Backend rodando na porta 3001
- [ ] ngrok rodando e expondo a porta 3001
- [ ] URL do webhook configurada no Mercado Pago
- [ ] Loja com credenciais do Mercado Pago configuradas
- [ ] Produtos no carrinho

## 📋 Passo 1: Verificar se Tudo Está Rodando

### Backend
```bash
# Verificar se está rodando
curl http://localhost:3001/api/health

# Se não estiver, iniciar:
cd backend
npm run dev
```

### ngrok
```bash
# Verificar se está rodando
curl http://localhost:4040/api/tunnels

# Se não estiver, iniciar:
ngrok http 3001
```

## 📋 Passo 2: Obter URL do Webhook

Quando o ngrok estiver rodando, você verá algo como:

```
Forwarding    https://abc123def456.ngrok-free.app -> http://localhost:3001
```

**Sua URL do webhook será:**
```
https://abc123def456.ngrok-free.app/api/payments/webhook
```

## 📋 Passo 3: Configurar no Mercado Pago

1. **Acesse:** https://www.mercadopago.com.br/developers/panel
2. **Menu → "Suas integrações" → Sua aplicação → "Webhooks"**
3. **Adicione a URL:** `https://SUA-URL-NGROK.ngrok-free.app/api/payments/webhook`
4. **Selecione eventos:** `payment`
5. **Salve**

## 📋 Passo 4: Configurar Credenciais na Loja

1. **Acesse sua loja** no sistema
2. **Vá em "Configurações"**
3. **Na seção "Métodos de Pagamento":**
   - ✅ Marque "Mercado Pago"
   - ✅ Salve
4. **Na seção "Configurações de Pagamento":**
   - Cole seu **Access Token** do Mercado Pago
   - (Opcional) Cole sua **Public Key**
   - Clique em "Conectar Conta"

## 📋 Passo 5: Fazer um Pedido de Teste

1. **Adicione produtos ao carrinho**
2. **Vá para o carrinho**
3. **Clique em "Finalizar Pedido"**
4. **Preencha os dados de entrega**
5. **Selecione "Mercado Pago" como método de pagamento**
6. **Clique em "Finalizar Pedido"**

## 📋 Passo 6: Completar Pagamento no Mercado Pago

Você será redirecionado para o checkout do Mercado Pago.

### Para Teste (Credenciais de Teste):

**Cartão de Teste:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Nome: `APRO`
- Data: Qualquer data futura

**Resultados:**
- `APRO` = Pagamento aprovado
- `CONT` = Pagamento pendente
- `CALL` = Pagamento recusado
- `FUND` = Pagamento recusado por falta de fundos

## 📋 Passo 7: Verificar se o Webhook Funcionou

### Opção 1: Interface Web do ngrok

Acesse: http://127.0.0.1:4040

Você verá todas as requisições, incluindo:
- `POST /api/payments/webhook` (do Mercado Pago)

### Opção 2: Logs do Backend

No terminal onde o backend está rodando, você verá:

```
Webhook recebido - Payment ID: 123456789
Pagamento atualizado: { payment_id: '...', status: 'approved', order_id: '...' }
```

### Opção 3: Verificar no Banco de Dados

```sql
-- Verificar pagamento
SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;

-- Verificar pedido
SELECT * FROM orders WHERE payment_id = 'ID_DO_PAGAMENTO';
```

### Opção 4: Verificar na Interface

1. **Acesse o pedido** criado
2. **Verifique o status de pagamento** - deve estar como "Pago" se aprovado
3. **Verifique o status do pedido** - deve estar como "Confirmado" se pago

## 🐛 Troubleshooting

### Webhook não está sendo recebido

1. **Verificar se ngrok está rodando:**
   ```bash
   curl http://localhost:4040/api/tunnels
   ```

2. **Verificar se a URL está correta no Mercado Pago:**
   - Deve ser: `https://SUA-URL/api/payments/webhook`
   - Deve usar HTTPS (não HTTP)

3. **Verificar logs do backend:**
   - Procure por "Webhook recebido"

4. **Testar manualmente:**
   ```bash
   curl -X POST https://SUA-URL-NGROK/api/payments/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"123456"}}'
   ```

### Pagamento não atualiza status

1. **Verificar se o payment_id existe no banco:**
   ```sql
   SELECT * FROM payments WHERE mp_payment_id = 'ID_DO_PAGAMENTO';
   ```

2. **Verificar credenciais do Mercado Pago:**
   - As credenciais da loja estão corretas?
   - O access_token tem permissões?

3. **Verificar logs de erro:**
   - Procure por erros ao buscar informações do pagamento

### Pedido não é criado

1. **Verificar se o carrinho tem itens**
2. **Verificar se os dados de entrega estão preenchidos**
3. **Verificar logs do backend para erros**

## ✅ Resultado Esperado

Após completar o pagamento:

1. ✅ Webhook é recebido (visto no ngrok)
2. ✅ Status do pagamento atualizado para "approved"
3. ✅ Status do pedido atualizado para "confirmed"
4. ✅ Notificações criadas para lojista e cliente
5. ✅ Cliente é redirecionado para página do pedido
6. ✅ Página do pedido mostra status atualizado

## 📝 Próximos Passos

Após testar com sucesso:

1. ✅ Testar com diferentes status (aprovado, pendente, recusado)
2. ✅ Testar com múltiplos pedidos
3. ✅ Verificar notificações
4. ✅ Preparar para produção (VPS com URL fixa)

