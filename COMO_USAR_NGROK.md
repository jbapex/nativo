# 🚀 Como Usar ngrok para Testar Webhooks Localmente

## ✅ Passo 1: Verificar se o Backend está Rodando

Abra um terminal e verifique se o backend está rodando na porta 3001:

```bash
cd backend
npm run dev
```

Você deve ver algo como:
```
🚀 Servidor rodando na porta 3001
📡 API disponível em http://localhost:3001/api
```

**Mantenha este terminal aberto!**

## ✅ Passo 2: Iniciar o ngrok

Abra um **NOVO terminal** (deixe o backend rodando no primeiro) e execute:

```bash
ngrok http 3001
```

Você verá algo assim:

```
ngrok                                                                              
                                                                                   
Session Status                online                                               
Account                       seu-email@exemplo.com (Plan: Free)                  
Version                       3.x.x                                                
Region                        United States (us)                                   
Latency                       -                                                    
Web Interface                 http://127.0.0.1:4040                                
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3001
                                                                                   
Connections                   ttl     opn     rt1     rt5     p50     p90         
                              0       0       0.00    0.00    0.00    0.00        
```

## ✅ Passo 3: Copiar a URL do Webhook

Na saída do ngrok, procure pela linha que começa com `Forwarding`:

```
Forwarding    https://abc123def456.ngrok-free.app -> http://localhost:3001
```

**Sua URL do webhook será:**
```
https://abc123def456.ngrok-free.app/api/payments/webhook
```

⚠️ **IMPORTANTE:** A URL muda a cada vez que você reinicia o ngrok!

## ✅ Passo 4: Configurar no Mercado Pago

1. **Acesse o Painel do Mercado Pago:**
   - https://www.mercadopago.com.br/developers/panel
   - Faça login

2. **Navegue até Webhooks:**
   - Menu lateral → **"Suas integrações"**
   - Selecione sua aplicação
   - Clique em **"Webhooks"** ou **"Notificações"**

3. **Adicionar URL do Webhook:**
   - Clique em **"Adicionar URL"** ou **"Criar Webhook"**
   - Cole a URL: `https://abc123def456.ngrok-free.app/api/payments/webhook`
   - (Substitua pela sua URL real do ngrok)

4. **Selecionar Eventos:**
   - ✅ **payment** (obrigatório)
   - ✅ **merchant_order** (opcional, mas recomendado)

5. **Salvar:**
   - Clique em **"Salvar"** ou **"Criar"**
   - O Mercado Pago enviará um teste para validar

## ✅ Passo 5: Verificar se Está Funcionando

### Opção 1: Interface Web do ngrok

Abra no navegador:
```
http://127.0.0.1:4040
```

Você verá todas as requisições que passam pelo ngrok, incluindo os webhooks do Mercado Pago!

### Opção 2: Logs do Backend

No terminal onde o backend está rodando, você verá:

```
Webhook recebido - Payment ID: 123456789
```

## 🔍 Testando um Pagamento

1. **Criar um pedido de teste** no sistema
2. **Escolher Mercado Pago** como método de pagamento
3. **Ser redirecionado** para o checkout do Mercado Pago
4. **Completar o pagamento** (use cartão de teste)
5. **Verificar logs** - o webhook deve ser chamado automaticamente

## ⚠️ Dicas Importantes

1. **Mantenha ambos os terminais abertos:**
   - Terminal 1: Backend rodando (`npm run dev`)
   - Terminal 2: ngrok rodando (`ngrok http 3001`)

2. **URL muda a cada reinício:**
   - Se você fechar e reabrir o ngrok, a URL muda
   - Você precisará atualizar a URL no Mercado Pago

3. **Para URL fixa (pago):**
   - O plano gratuito do ngrok gera URLs aleatórias
   - Planos pagos permitem URLs fixas (domínios personalizados)

4. **Ver requisições em tempo real:**
   - Acesse: http://127.0.0.1:4040
   - Veja todas as requisições HTTP que passam pelo túnel

## 🐛 Problemas Comuns

### ngrok não inicia

```bash
# Verificar se já está rodando
ps aux | grep ngrok

# Matar processos antigos
pkill ngrok

# Tentar novamente
ngrok http 3001
```

### Backend não está acessível

```bash
# Verificar se está rodando na porta 3001
lsof -ti:3001

# Se não estiver, iniciar
cd backend
npm run dev
```

### Webhook não está sendo recebido

1. Verificar se a URL está correta no Mercado Pago
2. Verificar se o ngrok está rodando
3. Verificar logs do backend
4. Verificar interface web do ngrok (http://127.0.0.1:4040)

## 📝 Próximos Passos

Depois de testar localmente, quando for para produção:

1. **Subir em um VPS/servidor** com URL fixa
2. **Configurar domínio** (ex: api.localmart.com.br)
3. **Configurar SSL/HTTPS**
4. **Atualizar URL do webhook** no Mercado Pago para a URL de produção

