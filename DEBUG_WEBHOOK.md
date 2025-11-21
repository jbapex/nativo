# 🔍 Debug: Webhook não atualiza status do pedido

## Problema
O dinheiro está chegando na conta do Mercado Pago, mas o status do pedido não está sendo atualizado.

## Possíveis Causas

### 1. Webhook configurado no modo errado
- **Se suas credenciais são de PRODUÇÃO** (`APP_USR-...`), o webhook deve estar configurado no **"Modo de produção"** no Mercado Pago
- **Se suas credenciais são de TESTE** (`TEST-...`), o webhook deve estar configurado no **"Modo de teste"**

### 2. Webhook não está encontrando o pagamento no banco
O webhook precisa encontrar o pagamento no banco usando:
- `mp_payment_id` (ID do pagamento do Mercado Pago)
- `mp_preference_id` (ID da preferência, usado quando o pagamento ainda não tem payment_id)

### 3. Erro ao buscar informações do Mercado Pago
O webhook tenta buscar informações atualizadas do pagamento no Mercado Pago. Se falhar, o status não é atualizado.

## Como Verificar

### 1. Verificar logs do backend
Quando um webhook for recebido, você verá logs detalhados:
```
=== WEBHOOK RECEBIDO ===
Payment ID do Mercado Pago: [ID]
Busca por mp_payment_id: [ID] - Encontrado: true/false
Busca por mp_preference_id: [ID] - Encontrado: true/false
✅ Informações do pagamento do Mercado Pago obtidas: {...}
📝 Atualizando pedido: {...}
✅ Pedido atualizado. Linhas afetadas: 1
```

### 2. Verificar no ngrok
Acesse: http://127.0.0.1:4040
- Veja se há requisições para `/api/payments/webhook`
- Verifique o status da resposta (deve ser 200 OK)
- Veja o body da requisição

### 3. Verificar no Mercado Pago
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em **"Webhooks"**
3. **IMPORTANTE**: Verifique se está no **"Modo de produção"** (não "Modo de teste")
4. Verifique o histórico de webhooks enviados

## Solução

### Passo 1: Verificar configuração do webhook
Certifique-se de que o webhook está configurado no **modo correto**:
- **Credenciais de PRODUÇÃO** → Webhook em **"Modo de produção"**
- **Credenciais de TESTE** → Webhook em **"Modo de teste"**

### Passo 2: Verificar logs
Após fazer um pagamento, verifique os logs do backend. Você deve ver:
- `=== WEBHOOK RECEBIDO ===`
- Se encontrou o pagamento no banco
- Se conseguiu buscar informações do Mercado Pago
- Se atualizou o pedido

### Passo 3: Verificar banco de dados
Verifique se o pedido tem `mp_preference_id` e `payment_id`:
```sql
SELECT id, mp_preference_id, payment_id, status, payment_status 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

### Passo 4: Testar manualmente
Se o webhook não estiver funcionando, você pode atualizar manualmente:
1. Acesse o pedido no sistema
2. Use a função de verificar status do pagamento
3. Ou atualize manualmente no painel do lojista

## Próximos Passos

1. ✅ Verificar se o webhook está no modo correto no Mercado Pago
2. ✅ Fazer um novo pagamento e verificar os logs
3. ✅ Verificar se o pedido tem `mp_preference_id` salvo
4. ✅ Verificar se o webhook está encontrando o pagamento no banco

