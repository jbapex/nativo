# 🛒 Local Mart - Marketplace Local

**Sistema completo de marketplace para comércio local com integração de pagamentos e gestão de lojas.**

---

## 📋 Sobre o Projeto

O **Local Mart** é uma plataforma de marketplace local que conecta lojistas e clientes dentro da mesma cidade. O sistema oferece:

- 🏪 **Gestão completa de lojas** - Cadastro, aprovação e customização
- 📦 **Sistema de produtos** - CRUD completo com múltiplas imagens
- 🛒 **Carrinho e checkout** - Processo de compra completo
- 💰 **Pagamentos integrados** - Mercado Pago e WhatsApp
- 📊 **Painel administrativo** - Gestão completa do sistema
- 🎨 **Loja Online Premium** - Customização avançada para planos Enterprise

---

## 🚀 Tecnologias

### **Backend**
- **Node.js** + **Express.js** - API RESTful
- **SQLite** (desenvolvimento) / **PostgreSQL** (produção recomendado)
- **JWT** - Autenticação com refresh tokens
- **Mercado Pago SDK** - Integração de pagamentos
- **Multer** - Upload de arquivos
- **Winston** - Logging estruturado

### **Frontend**
- **React** + **Vite** - Framework moderno
- **React Router** - Navegação
- **Shadcn UI** - Componentes de interface
- **Tailwind CSS** - Estilização
- **Axios** - Cliente HTTP

---

## 📦 Instalação

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn

### **1. Clonar o repositório**
```bash
git clone https://github.com/seu-usuario/local-mart.git
cd local-mart
```

### **2. Instalar dependências**

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ..
npm install
```

### **3. Configurar variáveis de ambiente**

**Backend (`backend/.env`):**
```env
# JWT
JWT_SECRET=sua-chave-jwt-aqui
JWT_REFRESH_SECRET=sua-chave-refresh-token-aqui

# CORS
CORS_ORIGIN=http://localhost:3006

# Mercado Pago (Opcional)
MERCADOPAGO_WEBHOOK_SECRET=sua-assinatura-secreta-aqui

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID=seu-client-id-aqui

# Porta
PORT=3001
NODE_ENV=development
```

**Frontend (`src/.env` ou `.env.local`):**
```env
VITE_API_URL=http://localhost:3001/api
```

### **4. Inicializar banco de dados**
```bash
cd backend
npm run migrate
```

### **5. Iniciar servidores**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

O sistema estará disponível em:
- **Frontend:** http://localhost:3006
- **Backend API:** http://localhost:3001/api

---

## 🎯 Funcionalidades Principais

### **Para Clientes**
- ✅ Busca e filtro de produtos
- ✅ Visualização de lojas
- ✅ Carrinho de compras
- ✅ Checkout com múltiplos métodos de pagamento
- ✅ Acompanhamento de pedidos
- ✅ Sistema de favoritos
- ✅ Avaliações de produtos

### **Para Lojistas**
- ✅ Cadastro e gestão de loja
- ✅ CRUD completo de produtos
- ✅ Gestão de pedidos
- ✅ Configuração de métodos de pagamento
- ✅ Loja Online Premium (planos Enterprise)
- ✅ Dashboard com métricas
- ✅ Sistema de promoções

### **Para Administradores**
- ✅ Painel administrativo completo
- ✅ Aprovação de lojas
- ✅ Gestão de planos e assinaturas
- ✅ Gestão de categorias e cidades
- ✅ Relatórios e analytics

---

## 🔐 Segurança

### **Implementado:**
- ✅ JWT com refresh tokens (15min access, 30 dias refresh)
- ✅ Validação de assinatura de webhook (Mercado Pago)
- ✅ Sanitização de HTML (prevenção XSS)
- ✅ Validação robusta de uploads (extensão + MIME type)
- ✅ Rate limiting
- ✅ Helmet.js (headers de segurança)
- ✅ Prepared statements (proteção SQL injection)

---

## 🚀 Performance

### **Implementado:**
- ✅ Paginação completa em todas as listagens
- ✅ Compressão Gzip de respostas
- ✅ Cache básico em memória
- ✅ Estrutura de resposta padronizada

---

## 📁 Estrutura do Projeto

```
local-mart/
├── backend/                 # API Backend
│   ├── routes/             # Rotas da API
│   ├── middleware/         # Middlewares (auth, validation)
│   ├── database/           # Schema e migrações
│   ├── utils/              # Utilitários
│   ├── scripts/            # Scripts (backup, migrate)
│   └── server.js           # Servidor principal
│
├── src/                    # Frontend React
│   ├── pages/              # Páginas da aplicação
│   ├── components/         # Componentes reutilizáveis
│   ├── api/                # Cliente API
│   └── utils/              # Utilitários frontend
│
└── docs/                   # Documentação
```

---

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Com UI
npm run test:ui

# Coverage
npm run test:coverage
```

---

## 📦 Scripts Disponíveis

### **Backend:**
```bash
npm run dev          # Desenvolvimento (watch mode)
npm start            # Produção
npm run migrate      # Executar migrações
npm run backup       # Backup completo
npm run backup:db    # Backup apenas do banco
npm run backup:uploads  # Backup apenas de uploads
```

### **Frontend:**
```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
```

---

## 🔄 Migração para Produção

### **Checklist:**
- [ ] Configurar variáveis de ambiente de produção
- [ ] Migrar banco de dados para PostgreSQL
- [ ] Configurar backup automático (cron)
- [ ] Configurar error tracking (Sentry)
- [ ] Migrar uploads para S3/Cloudinary
- [ ] Configurar CDN
- [ ] Configurar SSL/HTTPS
- [ ] Configurar webhook do Mercado Pago (produção)

---

## 📚 Documentação

- [Guia de Desenvolvimento](GUIA_DESENVOLVIMENTO_VS_PRODUCAO.md)
- [Configuração do Mercado Pago](CONFIGURACAO_MERCADOPAGO_LOJISTAS.md)
- [Configuração de Webhook](CONFIGURACAO_WEBHOOK_MERCADOPAGO.md)
- [Análise do Sistema](ANALISE_SISTEMA_COMPLETA_2025.md)
- [O que Falta](O_QUE_FALTA_RESUMO.md)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👥 Autores

- **Desenvolvedor** - [Seu Nome](https://github.com/seu-usuario)

---

## 🙏 Agradecimentos

- Base44 - Estrutura inicial do projeto
- Mercado Pago - Integração de pagamentos
- Comunidade open source

---

## 📞 Suporte

Para suporte, envie um email para suporte@localmart.com ou abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para o comércio local**
