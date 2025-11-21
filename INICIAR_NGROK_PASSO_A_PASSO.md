# 🚀 Iniciar ngrok - Passo a Passo

## ✅ O que você precisa fazer:

### 1. Abra um NOVO terminal

**IMPORTANTE:** Deixe o terminal do backend aberto e abra um **NOVO terminal**.

### 2. Execute este comando:

```bash
ngrok http 3001
```

### 3. Você verá algo assim:

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

### 4. Copie a URL HTTPS

Procure pela linha que diz `Forwarding`:

```
Forwarding    https://abc123def456.ngrok-free.app -> http://localhost:3001
```

**Sua URL do webhook será:**
```
https://abc123def456.ngrok-free.app/api/payments/webhook
```

### 5. Abra a interface web do ngrok

No navegador, acesse:
```
http://127.0.0.1:4040
```

Aqui você verá todas as requisições HTTP que passam pelo túnel.

### 6. Configure no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Menu → "Suas integrações" → Sua aplicação → "Webhooks"
3. Adicione a URL: `https://SUA-URL-NGROK.ngrok-free.app/api/payments/webhook`
4. Selecione eventos: `payment`
5. Salve

## ⚠️ IMPORTANTE

- **Mantenha o terminal do ngrok aberto** enquanto estiver testando
- Se você fechar o ngrok, a URL muda e você precisa atualizar no Mercado Pago
- A interface web (http://127.0.0.1:4040) só funciona enquanto o ngrok estiver rodando

## 🐛 Se não funcionar

Execute no terminal:
```bash
# Verificar se o backend está rodando
curl http://localhost:3001/api/health

# Se não estiver, iniciar:
cd backend
npm run dev
```

