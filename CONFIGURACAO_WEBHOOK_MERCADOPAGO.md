# Configuração do Webhook do Mercado Pago

## 📍 Onde Configurar

1. **Acesse o Painel do Mercado Pago:**
   - Acesse: https://www.mercadopago.com.br/developers/panel
   - Faça login com sua conta do Mercado Pago

2. **Navegue até Webhooks:**
   - No menu lateral, clique em **"Suas integrações"**
   - Selecione sua aplicação (ou crie uma nova se necessário)
   - No menu da aplicação, clique em **"Webhooks"** ou **"Notificações"**

## 🔗 URL do Webhook

A URL do webhook que você precisa configurar é:

```
https://seu-dominio.com/api/payments/webhook
```

**Exemplo em produção:**
```
https://api.localmart.com.br/api/payments/webhook
```

**⚠️ IMPORTANTE:**
- A URL deve ser **HTTPS** (não funciona com HTTP em produção)
- A URL deve ser **pública** (acessível da internet)
- Para desenvolvimento local, você precisará usar um túnel (veja abaixo)

## 🔧 Configuração no Painel

1. **Adicionar URL do Webhook:**
   - Clique em **"Adicionar URL"** ou **"Criar Webhook"**
   - Cole a URL: `https://seu-dominio.com/api/payments/webhook`
   - Selecione os eventos que deseja receber:
     - ✅ **payment** (obrigatório)
     - ✅ **merchant_order** (opcional, mas recomendado)

2. **Salvar Configuração:**
   - Clique em **"Salvar"** ou **"Criar"**
   - O Mercado Pago enviará um teste para validar a URL

## 🧪 Testando em Desenvolvimento Local

Para testar webhooks em desenvolvimento local, você precisa expor sua aplicação para a internet. Use uma das opções:

### Opção 1: ngrok (Recomendado)

1. **Instalar ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Ou baixar de: https://ngrok.com/download
   ```

2. **Iniciar túnel:**
   ```bash
   ngrok http 3001
   ```

3. **Copiar a URL HTTPS gerada:**
   ```
   https://abc123.ngrok.io
   ```

4. **Configurar webhook no Mercado Pago:**
   ```
   https://abc123.ngrok.io/api/payments/webhook
   ```

### Opção 2: Cloudflare Tunnel

1. Instalar `cloudflared`
2. Criar túnel:
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

### Opção 3: localtunnel

```bash
npm install -g localtunnel
lt --port 3001
```

## ✅ Validação

Após configurar o webhook, o Mercado Pago enviará uma requisição de teste. Você deve ver no console do backend:

```
Webhook recebido - Payment ID: [ID]
```

## 🔍 Verificar se está Funcionando

1. **Criar um pedido de teste** com pagamento via Mercado Pago
2. **Verificar logs do backend** para ver se o webhook foi recebido
3. **Verificar no banco de dados** se o status do pagamento foi atualizado

## 🐛 Troubleshooting

### Webhook não está sendo recebido

1. **Verificar se a URL está correta:**
   - A URL deve ser acessível publicamente
   - Deve usar HTTPS em produção

2. **Verificar logs do backend:**
   ```bash
   # Verificar se há erros no console
   tail -f logs/combined.log
   ```

3. **Testar manualmente:**
   ```bash
   curl -X POST https://seu-dominio.com/api/payments/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"123456"}}'
   ```

### Webhook recebido mas status não atualiza

1. **Verificar se o payment_id existe no banco:**
   ```sql
   SELECT * FROM payments WHERE mp_payment_id = 'ID_DO_PAGAMENTO';
   ```

2. **Verificar credenciais do Mercado Pago:**
   - As credenciais da loja estão corretas?
   - O access_token tem permissões para consultar pagamentos?

3. **Verificar logs de erro:**
   - Procure por erros ao buscar informações do pagamento no Mercado Pago

## 📝 Notas Importantes

1. **Cada loja pode ter suas próprias credenciais:**
   - O webhook é global, mas processa pagamentos de todas as lojas
   - O sistema identifica a loja pelo `store_id` no metadata do pagamento

2. **Webhook pode ser chamado múltiplas vezes:**
   - O Mercado Pago pode enviar o mesmo evento várias vezes
   - O código já trata isso verificando o status atual antes de atualizar

3. **Ambiente de Teste vs Produção:**
   - Use credenciais de teste (`TEST-...`) para desenvolvimento
   - Use credenciais de produção (`APP_USR-...`) apenas em produção

## 🔐 Segurança

O webhook atual não valida a assinatura do Mercado Pago. Para produção, recomenda-se adicionar validação:

1. Configurar `X-Signature` no webhook do Mercado Pago
2. Validar a assinatura no backend antes de processar

Isso será implementado em uma versão futura.

