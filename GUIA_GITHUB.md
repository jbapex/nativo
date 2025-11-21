# 🚀 GUIA DE CONFIGURAÇÃO DO GITHUB

**Como configurar e fazer push do projeto para o GitHub**

---

## 📋 PASSO A PASSO

### **1. Criar Repositório no GitHub**

1. Acesse: https://github.com/new
2. Nome do repositório: `local-mart` (ou outro nome)
3. Descrição: "Marketplace local com integração de pagamentos"
4. **NÃO** marque "Initialize with README" (já temos)
5. Clique em **"Create repository"**

---

### **2. Conectar Repositório Local ao GitHub**

Após criar o repositório no GitHub, você verá instruções. Execute:

```bash
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb

# Adicionar remote (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/local-mart.git

# Ou se preferir SSH:
# git remote add origin git@github.com:SEU-USUARIO/local-mart.git
```

---

### **3. Fazer Primeiro Commit**

```bash
# Adicionar todos os arquivos (respeitando .gitignore)
git add .

# Verificar o que será commitado
git status

# Fazer commit inicial
git commit -m "feat: Initial commit - Sistema completo de marketplace local

- Backend com Express.js e SQLite
- Frontend com React e Vite
- Integração Mercado Pago
- Sistema de pagamentos completo
- Gestão de lojas e produtos
- Painel administrativo
- Melhorias de segurança e performance"
```

---

### **4. Fazer Push para GitHub**

```bash
# Push para branch main (ou master)
git branch -M main
git push -u origin main
```

Se pedir autenticação:
- **HTTPS:** Use Personal Access Token (não senha)
- **SSH:** Configure chave SSH primeiro

---

### **5. Verificar no GitHub**

Acesse: `https://github.com/SEU-USUARIO/local-mart`

Você deve ver todos os arquivos do projeto!

---

## 🔐 AUTENTICAÇÃO

### **Opção 1: Personal Access Token (HTTPS)**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Selecione escopos: `repo` (todos)
4. Copie o token
5. Use o token como senha ao fazer push

### **Opção 2: SSH Key**

```bash
# Gerar chave SSH (se ainda não tiver)
ssh-keygen -t ed25519 -C "seu@email.com"

# Adicionar ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub: Settings → SSH and GPG keys → New SSH key
```

---

## 📝 ESTRUTURA DE COMMITS

Use commits semânticos:

```bash
feat: Adiciona nova funcionalidade
fix: Corrige bug
docs: Atualiza documentação
style: Formatação de código
refactor: Refatoração
test: Adiciona testes
chore: Tarefas de manutenção
```

**Exemplos:**
```bash
git commit -m "feat: Adiciona sistema de paginação"
git commit -m "fix: Corrige erro de validação de upload"
git commit -m "docs: Atualiza README com instruções de instalação"
```

---

## 🌿 BRANCHES RECOMENDADAS

```bash
# Branch principal
main          # Produção

# Branches de desenvolvimento
develop       # Desenvolvimento
feature/*     # Novas features
fix/*         # Correções
hotfix/*      # Correções urgentes
```

**Criar branch:**
```bash
git checkout -b feature/nova-funcionalidade
git push -u origin feature/nova-funcionalidade
```

---

## 📋 .GITIGNORE CONFIGURADO

O arquivo `.gitignore` já está configurado para ignorar:
- ✅ `node_modules/`
- ✅ `.env` e variáveis de ambiente
- ✅ Arquivos de banco de dados (`.db`, `.sqlite`)
- ✅ `uploads/` (arquivos enviados)
- ✅ `logs/`
- ✅ Arquivos temporários
- ✅ Arquivos do editor

---

## ✅ CHECKLIST ANTES DO PUSH

- [ ] Verificar `.gitignore` está correto
- [ ] Não commitar arquivos sensíveis (`.env`, senhas)
- [ ] Não commitar banco de dados
- [ ] Não commitar `node_modules/`
- [ ] README.md atualizado
- [ ] Commits com mensagens descritivas

---

## 🚨 IMPORTANTE

### **NUNCA commitar:**
- ❌ Arquivos `.env` com credenciais reais
- ❌ Banco de dados com dados reais
- ❌ Chaves de API
- ❌ Senhas ou tokens
- ❌ Arquivos de upload (imagens de usuários)

### **SEMPRE commitar:**
- ✅ Código fonte
- ✅ `.env.example` (sem valores reais)
- ✅ Documentação
- ✅ Configurações (sem secrets)

---

## 🔄 COMANDOS ÚTEIS

```bash
# Ver status
git status

# Ver diferenças
git diff

# Ver histórico
git log --oneline

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Verificar remote
git remote -v

# Atualizar remote
git remote set-url origin https://github.com/SEU-USUARIO/local-mart.git
```

---

## 📚 PRÓXIMOS PASSOS

Após configurar o GitHub:

1. ✅ Criar repositório no GitHub
2. ✅ Fazer push inicial
3. ✅ Configurar branch protection (opcional)
4. ✅ Adicionar descrição e tags
5. ✅ Configurar GitHub Actions (CI/CD) - futuro

---

**Pronto para versionar!** 🎉

