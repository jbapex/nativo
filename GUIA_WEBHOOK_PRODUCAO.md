# 🚀 Guia: Configurar Webhook do Mercado Pago para Produção

Este guia explica como configurar o webhook do Mercado Pago quando o sistema estiver em produção (servidor real).

---

## 📋 Pré-requisitos

1. **Servidor em produção** (VPS, Cloud, etc.)
   - Backend rodando e acessível publicamente
   - URL do servidor configurada (ex: `https://api.seudominio.com.br`)
   - SSL/HTTPS configurado (obrigatório para webhooks)

2. **Credenciais de Produção do Mercado Pago**
   - Access Token de produção (começa com `APP_USR-...`)
   - Conta do Mercado Pago verificada

---

## 🔧 Passo a Passo

### **1. Deploy do Backend em Produção**

#### **1.1. Configurar Servidor**

```bash
# Exemplo: Servidor Ubuntu/Debian
# Instalar Node.js, PM2, Nginx, etc.
```

#### **1.2. Configurar Variáveis de Ambiente**

Crie um arquivo `.env` no servidor:

```env
# Produção
NODE_ENV=production
PORT=3001

# URL do seu servidor
FRONTEND_URL=https://seudominio.com.br
CORS_ORIGIN=https://seudominio.com.br

# Banco de Dados
DB_PATH=/var/www/app/database.sqlite

# JWT (GERE UMA CHAVE SEGURA!)
JWT_SECRET=sua-chave-super-segura-aqui

# Mercado Pago (se usar credenciais globais)
# Nota: No sistema, cada loja tem suas próprias credenciais
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
```

#### **1.3. Configurar Nginx (Reverso Proxy)**

Exemplo de configuração do Nginx:

```nginx
server {
    listen 80;
    server_name api.seudominio.com.br;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.seudominio.com.br;

    ssl_certificate /etc/letsencrypt/live/api.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **1.4. Instalar SSL (Let's Encrypt)**

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d api.seudominio.com.br
```

#### **1.5. Testar se o Backend está Acessível**

```bash
# Testar se o servidor responde
curl https://api.seudominio.com.br/api/health

# Testar se o webhook está acessível (deve retornar erro, mas estar acessível)
curl -X POST https://api.seudominio.com.br/api/payments/webhook
```

---

### **2. Configurar Webhook no Mercado Pago**

#### **2.1. Acessar Painel do Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login na sua conta
3. Selecione sua aplicação

#### **2.2. Configurar Webhook em Produção**

1. No menu lateral, clique em **"Webhooks"** ou **"Notificações IPN"**
2. **IMPORTANTE**: Clique na aba **"Modo de produção"** (não "Modo de teste")
3. Configure:
   - **URL para produção**: `https://api.seudominio.com.br/api/payments/webhook`
   - **Eventos**: Marque **"Pagamentos"** (e outros eventos que precisar)
4. Clique em **"Salvar"** ou **"Atualizar"**

#### **2.3. Configurar Assinatura Secreta (Recomendado)**

1. Na mesma página, role até **"Assinatura secreta"**
2. Clique no ícone de **refresh** (↻) para gerar uma nova assinatura
3. **Copie e guarde** a assinatura secreta
4. No seu código, adicione validação da assinatura (veja seção abaixo)

---

### **3. Configurar Credenciais de Produção nas Lojas**

#### **3.1. Obter Credenciais de Produção**

1. No painel do Mercado Pago, vá em **"Credenciais"**
2. Clique na aba **"Credenciais de Produção"**
3. Copie o **Access Token** (começa com `APP_USR-...`)

#### **3.2. Configurar no Sistema**

1. Acesse o sistema como lojista
2. Vá em **"Minha Loja"** → **"Configurações"**
3. Role até **"Métodos de Pagamento Aceitos"**
4. Marque **"Mercado Pago"**
5. Cole o **Access Token de Produção** no campo correspondente
6. Clique em **"Salvar Métodos de Pagamento"**

**⚠️ IMPORTANTE**: Cada loja precisa ter suas próprias credenciais de produção configuradas!

---

### **4. Validar Assinatura do Webhook (Segurança)**

Para garantir que os webhooks realmente vêm do Mercado Pago, valide a assinatura:

```javascript
// backend/routes/payments.js
import crypto from 'crypto';

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Obter assinatura do header
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    
    // Validar assinatura (se configurada)
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && signature) {
      const hash = crypto
        .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
        .update(req.body.toString())
        .digest('hex');
      
      if (hash !== signature) {
        console.error('Assinatura do webhook inválida!');
        return res.status(401).send('Unauthorized');
      }
    }
    
    // Processar webhook...
    const data = JSON.parse(req.body.toString());
    // ... resto do código
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Error');
  }
});
```

Adicione no `.env`:

```env
MERCADOPAGO_WEBHOOK_SECRET=sua-assinatura-secreta-aqui
```

---

### **5. Testar Webhook em Produção**

#### **5.1. Teste Manual**

Você pode testar o webhook usando o painel do Mercado Pago:

1. No painel, vá em **"Webhooks"**
2. Clique em **"Testar webhook"** ou **"Enviar notificação de teste"**
3. Verifique os logs do servidor para confirmar que recebeu

#### **5.2. Teste com Pagamento Real**

1. Faça um pedido de teste com valor mínimo (R$ 0,01)
2. Pague com PIX ou cartão
3. Verifique se o webhook foi recebido e processado
4. Verifique se o pedido foi atualizado no sistema

#### **5.3. Verificar Logs**

```bash
# Ver logs do backend
pm2 logs

# Ou se estiver usando systemd
journalctl -u seu-servico -f

# Verificar logs específicos do webhook
tail -f /var/www/app/logs/combined.log | grep webhook
```

---

## 🔍 Troubleshooting

### **Webhook não está sendo recebido**

1. **Verificar se o servidor está acessível:**
   ```bash
   curl https://api.seudominio.com.br/api/payments/webhook
   ```

2. **Verificar se o SSL está válido:**
   - Acesse: https://www.ssllabs.com/ssltest/
   - Digite sua URL e verifique se está tudo OK

3. **Verificar firewall:**
   - Certifique-se de que a porta 443 (HTTPS) está aberta
   - Verifique se o Nginx está configurado corretamente

4. **Verificar logs do Mercado Pago:**
   - No painel, vá em **"Webhooks"** → **"Histórico"**
   - Veja se há tentativas de envio e qual o status

### **Webhook recebido mas não processa**

1. **Verificar logs do backend:**
   ```bash
   pm2 logs | grep webhook
   ```

2. **Verificar se o endpoint está correto:**
   - Deve ser: `/api/payments/webhook`
   - Não deve ter barra no final

3. **Verificar se o formato do webhook está correto:**
   - O Mercado Pago envia JSON
   - Verifique se o middleware `express.raw` está configurado

### **Erro 401 (Unauthorized)**

- Verifique se a assinatura secreta está configurada corretamente
- Verifique se o header `X-Signature` está sendo enviado

---

## 📝 Checklist de Produção

- [ ] Backend deployado e acessível via HTTPS
- [ ] SSL/HTTPS configurado e válido
- [ ] Webhook configurado no Mercado Pago (Modo de Produção)
- [ ] URL do webhook: `https://api.seudominio.com.br/api/payments/webhook`
- [ ] Evento "Pagamentos" marcado
- [ ] Assinatura secreta configurada (opcional mas recomendado)
- [ ] Credenciais de produção configuradas nas lojas
- [ ] Teste de webhook realizado com sucesso
- [ ] Logs configurados e monitorados
- [ ] Backup do banco de dados configurado

---

## 🔐 Segurança

### **Boas Práticas:**

1. ✅ **Use HTTPS obrigatoriamente** (webhooks não funcionam em HTTP)
2. ✅ **Valide a assinatura do webhook** (previne ataques)
3. ✅ **Use credenciais de produção** apenas em produção
4. ✅ **Monitore os logs** regularmente
5. ✅ **Faça backup** do banco de dados regularmente
6. ✅ **Mantenha o servidor atualizado** (segurança)

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do servidor
2. Verifique o histórico de webhooks no Mercado Pago
3. Consulte a documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

**Última atualização:** 2024

