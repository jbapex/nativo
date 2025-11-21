# 🔐 Configuração do Login com Google

Este guia explica como configurar o login com Google OAuth no sistema.

## 📋 Pré-requisitos

1. Conta no Google Cloud Platform
2. Acesso ao Google Cloud Console

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID**

### 2. Habilitar Google+ API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure por "Google+ API" ou "Google Identity Services"
3. Clique em **Enable**

### 3. Configurar OAuth Consent Screen

1. Vá em **APIs & Services** > **OAuth consent screen**
2. Escolha **External** (para desenvolvimento) ou **Internal** (para G Suite)
3. Preencha:
   - **App name**: Nome da sua aplicação
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
4. Clique em **Save and Continue**
5. Adicione escopos (opcional):
   - `email`
   - `profile`
   - `openid`
6. Clique em **Save and Continue**
7. Adicione usuários de teste (para desenvolvimento)
8. Clique em **Save and Continue**

### 4. Criar Credenciais OAuth 2.0

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Escolha **Web application**
4. Configure:
   - **Name**: Nome da credencial (ex: "Local Mart Web Client")
   - **Authorized JavaScript origins**:
     - `http://localhost:3006` (desenvolvimento)
     - `https://seudominio.com` (produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3006` (desenvolvimento)
     - `https://seudominio.com` (produção)
5. Clique em **Create**
6. **Copie o Client ID** (você vai precisar dele)

### 5. Configurar Variáveis de Ambiente

#### Frontend (`.env` na raiz do projeto)

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

#### Backend (`.env` na pasta `backend/`)

```env
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

⚠️ **IMPORTANTE**: Use o **mesmo Client ID** no frontend e backend!

### 6. Reiniciar Servidores

Após configurar as variáveis de ambiente:

```bash
# Frontend
npm run dev

# Backend
cd backend
npm run dev
```

## ✅ Testando

1. Acesse a aplicação
2. Clique em "Entrar"
3. Você deve ver o botão "Continuar com Google"
4. Clique no botão e selecione uma conta Google
5. O login deve funcionar automaticamente

## 🔧 Troubleshooting

### Botão do Google não aparece

- Verifique se `VITE_GOOGLE_CLIENT_ID` está configurado no `.env`
- Verifique se o script do Google está carregando (veja console do navegador)
- Recarregue a página (Ctrl+F5 ou Cmd+Shift+R)

### Erro "Google Client ID não configurado"

- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se a variável `VITE_GOOGLE_CLIENT_ID` está correta
- Reinicie o servidor de desenvolvimento

### Erro "Autenticação Google não configurada"

- Verifique se `GOOGLE_CLIENT_ID` está configurado no `.env` do backend
- Verifique se o backend está rodando
- Reinicie o servidor backend

### Erro "Token do Google inválido"

- Verifique se o Client ID no backend é o mesmo do frontend
- Verifique se as origens autorizadas estão corretas no Google Cloud Console
- Verifique se o domínio está na lista de origens autorizadas

## 📝 Notas Importantes

1. **Desenvolvimento**: Use `http://localhost:3006` nas origens autorizadas
2. **Produção**: Adicione seu domínio real nas origens autorizadas
3. **Segurança**: Nunca commite o `.env` com credenciais reais
4. **Client ID**: O mesmo Client ID funciona para frontend e backend

## 🔒 Segurança

- Mantenha o Client ID seguro (não é um segredo, mas não compartilhe publicamente)
- Use HTTPS em produção
- Configure corretamente as origens autorizadas
- Revise periodicamente os usuários com acesso

## 📚 Recursos

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

