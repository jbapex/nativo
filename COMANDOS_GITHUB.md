# 🚀 COMANDOS PARA FAZER PUSH NO GITHUB

**Commit inicial criado com sucesso!** ✅

---

## 📋 PRÓXIMOS PASSOS

### **1. Criar Repositório no GitHub**

1. Acesse: **https://github.com/new**
2. **Nome do repositório:** `local-mart` (ou outro nome de sua escolha)
3. **Descrição:** "Marketplace local com integração de pagamentos"
4. **NÃO marque** "Initialize with README" (já temos)
5. Clique em **"Create repository"**

---

### **2. Adicionar Remote**

Após criar o repositório, copie a URL e execute:

```bash
# HTTPS (recomendado para iniciantes)
git remote add origin https://github.com/SEU-USUARIO/local-mart.git

# OU SSH (se tiver chave SSH configurada)
git remote add origin git@github.com:SEU-USUARIO/local-mart.git
```

**Substitua `SEU-USUARIO` pelo seu username do GitHub!**

---

### **3. Fazer Push**

```bash
git push -u origin main
```

Se pedir autenticação:
- **HTTPS:** Use Personal Access Token (não sua senha)
- **SSH:** Deve funcionar automaticamente se tiver chave configurada

---

## 🔐 AUTENTICAÇÃO

### **Personal Access Token (HTTPS)**

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token (classic)**
3. Selecione escopos: `repo` (todos)
4. Copie o token
5. Use o token como **senha** ao fazer push

### **SSH Key (SSH)**

```bash
# Verificar se já tem chave SSH
ls -la ~/.ssh/id_ed25519.pub

# Se não tiver, criar:
ssh-keygen -t ed25519 -C "seu@email.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub: Settings → SSH and GPG keys → New SSH key
```

---

## ✅ VERIFICAÇÃO

Após o push, verifique:

```bash
# Ver remote configurado
git remote -v

# Ver último commit
git log --oneline -1

# Ver status
git status
```

---

## 🎯 COMANDOS COMPLETOS (Copiar e Colar)

```bash
# 1. Adicionar remote (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/local-mart.git

# 2. Verificar remote
git remote -v

# 3. Fazer push
git push -u origin main
```

---

**Pronto! Seu código estará no GitHub!** 🎉

