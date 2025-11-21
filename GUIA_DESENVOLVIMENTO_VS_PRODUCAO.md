# Guia: Desenvolvimento Local vs Produção

## 🏠 Desenvolvimento Local

### Opção 1: ngrok (Mais Popular)

**Instalação:**
```bash
# macOS
brew install ngrok

# Ou baixar de: https://ngrok.com/download
```

**Uso:**
```bash
# 1. Iniciar seu backend
cd backend
npm run dev  # ou npm start

# 2. Em outro terminal, iniciar ngrok
ngrok http 3001

# 3. Copiar a URL HTTPS gerada (ex: https://abc123.ngrok.io)
# 4. Configurar no Mercado Pago: https://abc123.ngrok.io/api/payments/webhook
```

**Vantagens:**
- ✅ Gratuito (com limitações)
- ✅ Fácil de usar
- ✅ HTTPS automático
- ✅ Interface web para ver requisições

**Desvantagens:**
- ⚠️ URL muda a cada reinício (plano gratuito)
- ⚠️ Limite de conexões simultâneas

### Opção 2: Cloudflare Tunnel (Gratuito e Estável)

**Instalação:**
```bash
# macOS
brew install cloudflared

# Ou baixar de: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

**Uso:**
```bash
# Criar túnel permanente (recomendado)
cloudflared tunnel create local-mart

# Rodar túnel
cloudflared tunnel --url http://localhost:3001
```

**Vantagens:**
- ✅ Gratuito
- ✅ URL mais estável
- ✅ Sem limite de conexões

### Opção 3: localtunnel

```bash
npm install -g localtunnel
lt --port 3001 --subdomain seu-nome-aqui
```

## 🚀 Produção (VPS/Servidor)

### Opções de Hospedagem

#### 1. VPS (Recomendado para controle total)

**Opções:**
- **DigitalOcean**: https://www.digitalocean.com/ (a partir de $4/mês)
- **Linode**: https://www.linode.com/ (a partir de $5/mês)
- **Vultr**: https://www.vultr.com/ (a partir de $2.50/mês)
- **AWS EC2**: https://aws.amazon.com/ec2/ (pay-as-you-go)
- **Google Cloud**: https://cloud.google.com/ (free tier disponível)

**Configuração básica:**
```bash
# 1. Conectar ao servidor via SSH
ssh usuario@seu-servidor.com

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# 4. Clonar seu projeto
git clone seu-repositorio.git
cd local-mart-4ffccbdb/backend

# 5. Instalar dependências
npm install

# 6. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com suas configurações

# 7. Iniciar com PM2
pm2 start server.js --name local-mart-api
pm2 save
pm2 startup  # Configurar para iniciar automaticamente
```

#### 2. Plataformas Gerenciadas (Mais Fácil)

**Opções:**
- **Heroku**: https://www.heroku.com/ (free tier limitado)
- **Railway**: https://railway.app/ (free tier generoso)
- **Render**: https://render.com/ (free tier disponível)
- **Fly.io**: https://fly.io/ (free tier disponível)

**Vantagens:**
- ✅ Configuração mais simples
- ✅ HTTPS automático
- ✅ Deploy automático via Git
- ✅ Escalabilidade automática

**Desvantagens:**
- ⚠️ Menos controle
- ⚠️ Pode ser mais caro em escala

### Configuração de Domínio

1. **Comprar domínio** (ex: localmart.com.br)
2. **Configurar DNS:**
   ```
   A     @        IP_DO_SERVIDOR
   A     api      IP_DO_SERVIDOR
   ```
3. **Configurar SSL/HTTPS:**
   ```bash
   # Usando Certbot (Let's Encrypt - Gratuito)
   sudo apt-get install certbot
   sudo certbot --nginx -d api.localmart.com.br
   ```

### Configuração do Webhook em Produção

1. **URL do webhook:**
   ```
   https://api.localmart.com.br/api/payments/webhook
   ```
   ou
   ```
   https://seu-dominio.com/api/payments/webhook
   ```

2. **Configurar no Mercado Pago:**
   - Acesse: https://www.mercadopago.com.br/developers/panel
   - Suas integrações → Sua aplicação → Webhooks
   - Adicione a URL acima
   - Selecione eventos: `payment` e `merchant_order`

## 🔐 Segurança

### Validação de Assinatura do Webhook (Recomendado)

O webhook atual aceita requisições sem validação. Para produção, adicione validação:

1. **No painel do Mercado Pago:**
   - Configure uma chave secreta para o webhook

2. **No backend:**
   - Validar o header `X-Signature` ou `x-signature`
   - Comparar com a chave configurada

**Exemplo de validação (a implementar):**
```javascript
const crypto = require('crypto');

function validateWebhookSignature(req, secret) {
  const signature = req.headers['x-signature'];
  const payload = req.body.toString();
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === hash;
}
```

## 📊 Comparação

| Aspecto | Desenvolvimento Local | Produção (VPS) |
|---------|----------------------|----------------|
| **Custo** | Gratuito (ngrok) | $2-10/mês |
| **URL** | Muda a cada reinício | Fixa |
| **HTTPS** | Automático (ngrok) | Precisa configurar |
| **Performance** | Limitado | Completo |
| **Escalabilidade** | Não | Sim |
| **Controle** | Limitado | Total |

## 🎯 Recomendação

1. **Desenvolvimento:** Use **ngrok** para testes rápidos
2. **Produção:** Use **VPS** (DigitalOcean/Vultr) ou **Railway/Render** para simplicidade

## 📝 Checklist de Deploy

- [ ] Servidor/VPS configurado
- [ ] Node.js instalado
- [ ] Banco de dados configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado (opcional)
- [ ] SSL/HTTPS configurado
- [ ] Webhook configurado no Mercado Pago
- [ ] PM2 ou similar configurado
- [ ] Backup automático configurado
- [ ] Monitoramento configurado

