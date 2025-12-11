# 🛒 Local Mart / Nativo - Marketplace Local

Sistema completo de marketplace para conectar lojas locais e clientes.

## 🚀 Início Rápido

```bash
# 1. Clonar repositório
git clone https://github.com/jbapex/nativo.git
cd nativo

# 2. Instalar dependências
npm install
cd backend && npm install && cd ..

# 3. Configurar ambiente
cp backend/.env.example backend/.env
# Editar backend/.env com suas configurações

# 4. Setup inicial (cria banco + dados iniciais)
node backend/scripts/setup-inicial.js

# 5. Iniciar sistema
npm run dev
```

Acesse:
- **Frontend:** http://localhost:3006
- **Backend API:** http://localhost:3001/api

## 📋 O Que É Criado Automaticamente

Ao executar `setup-inicial.js`, o sistema cria automaticamente:

- ✅ **4 Planos de Assinatura** (Gratuito, Básico, Profissional, Empresarial)
- ✅ **10 Categorias Padrão** (Alimentos, Roupas, Eletrônicos, etc.)
- ✅ **Todas as Configurações do Sistema** (geral, usuários, segurança, integrações, aparência)
- ✅ **Estrutura Completa do Banco de Dados**

## 📚 Documentação

- [Instalação Completa](INSTALACAO_COMPLETA.md) - Guia detalhado de instalação
- [Guia de Deploy VPS](GUIA_DEPLOY_VPS.md) - Como fazer deploy na VPS
- [Migrações do Banco](backend/database/MIGRACOES_README.md) - Guia de migrações
- [Exportar/Importar Configs](COMO_EXPORTAR_IMPORTAR_CONFIGS.md) - Como migrar configurações

## 🛠️ Tecnologias

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express
- **Banco de Dados:** SQLite (padrão) ou PostgreSQL
- **Autenticação:** JWT
- **Process Manager:** PM2 (produção)

## 📦 Estrutura do Projeto

```
nativo/
├── backend/          # API Backend
│   ├── routes/      # Rotas da API
│   ├── database/    # Schemas e migrações
│   └── scripts/     # Scripts utilitários
├── src/             # Frontend React
│   ├── pages/       # Páginas
│   ├── components/  # Componentes
│   └── api/         # Cliente API
└── docs/            # Documentação
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia frontend e backend

# Setup
node backend/scripts/setup-inicial.js        # Setup completo
node backend/scripts/aplicar-migracoes.js   # Apenas migrações
node backend/scripts/seed-inicial.js        # Apenas dados iniciais

# Configurações
node backend/scripts/exportar-configuracoes-admin.js   # Exportar configs
node backend/scripts/importar-configuracoes-admin.js   # Importar configs
```

## 🔐 Variáveis de Ambiente

Copie `backend/.env.example` para `backend/.env` e configure:

```env
NODE_ENV=development
PORT=3001
DB_TYPE=sqlite
DB_PATH=./database.sqlite
JWT_SECRET=seu_secret_aqui
```

## 📝 Licença

Este projeto é privado e proprietário.

## 🤝 Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue.

---

**Versão:** 1.0.0  
**Última atualização:** 2024
