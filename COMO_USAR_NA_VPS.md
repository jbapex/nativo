# 📝 Como Usar na VPS - Passo a Passo Prático

## ⚠️ IMPORTANTE: Você Precisa Adaptar os Comandos!

Os comandos que você viu são **exemplos**. Você precisa substituir pelos seus dados reais.

## 🔍 O Que Você Precisa Saber Antes

1. **Usuário SSH da VPS** (ex: `root`, `ubuntu`, `admin`)
2. **IP ou domínio da VPS** (ex: `192.168.1.100` ou `meuservidor.com`)
3. **Caminho do projeto na VPS** (ex: `/var/www/local-mart`)
4. **Usuário do PostgreSQL** (ex: `postgres`)
5. **Nome do banco de dados** (ex: `localmart`)

## 🚀 Processo Completo (Com Exemplos Reais)

### Passo 1: Conectar na VPS

**❌ NÃO faça isso (é só exemplo):**
```bash
ssh usuario@seu-servidor.com
```

**✅ FAÇA isso (com seus dados reais):**
```bash
# Exemplo 1: Se sua VPS é 192.168.1.100 e usuário é root
ssh root@192.168.1.100

# Exemplo 2: Se sua VPS é meuservidor.com.br e usuário é ubuntu
ssh ubuntu@meuservidor.com.br
```

### Passo 2: Ir para o Projeto

**❌ NÃO faça isso:**
```bash
cd /caminho/para/local-mart
```

**✅ FAÇA isso:**
```bash
# Primeiro, descubra onde está seu projeto
pwd  # Mostra onde você está agora

# Ou procure o projeto
find / -name "package.json" 2>/dev/null | head -5

# Depois vá para o diretório (exemplo):
cd /var/www/local-mart
# ou
cd /home/ubuntu/local-mart
# ou
cd ~/local-mart
```

### Passo 3: Baixar Atualizações

```bash
# Verificar se está no lugar certo
ls -la  # Deve mostrar arquivos como package.json, backend/, src/

# Baixar atualizações do GitHub
git pull origin main
```

**Se der erro "not a git repository":**
```bash
# Você precisa clonar primeiro
git clone https://github.com/jbapex/nativo.git .
```

### Passo 4: Configurar o Script (MUITO IMPORTANTE!)

```bash
# Abrir o script para editar
nano atualizar-vps.sh
```

**No arquivo, encontre estas linhas (por volta da linha 14-16):**

```bash
PROJECT_DIR="/caminho/para/local-mart"  # ← MUDE ISSO
DB_USER="seu_usuario"                   # ← MUDE ISSO
DB_NAME="nome_do_banco"                 # ← MUDE ISSO
```

**Substitua pelos seus dados reais. Exemplo:**

```bash
PROJECT_DIR="/var/www/local-mart"        # Caminho real do seu projeto
DB_USER="postgres"                       # Seu usuário do PostgreSQL
DB_NAME="localmart"                     # Nome do seu banco de dados
```

**Para salvar no nano:**
- Pressione `Ctrl + X`
- Digite `Y` (sim)
- Pressione `Enter`

### Passo 5: Executar

```bash
# Tornar executável (só na primeira vez)
chmod +x atualizar-vps.sh

# Executar
./atualizar-vps.sh
```

## 📋 Checklist Antes de Começar

Antes de executar, certifique-se de ter:

- [ ] Acesso SSH à VPS
- [ ] Saber o caminho do projeto na VPS
- [ ] Saber usuário e nome do banco de dados PostgreSQL
- [ ] Ter permissões para executar comandos

## 🔍 Como Descobrir Suas Informações

### Descobrir o caminho do projeto:
```bash
# Se você já está no projeto
pwd

# Se não sabe onde está
find / -name "package.json" 2>/dev/null | grep -i local
```

### Descobrir usuário e banco do PostgreSQL:
```bash
# Verificar no arquivo .env do backend
cat backend/.env | grep -E "DB_USER|DB_NAME|DATABASE"

# Ou conectar no PostgreSQL
psql -U postgres -l
```

## 🎯 Comandos Prontos (Copie e Adapte)

**Substitua os valores entre `< >` pelos seus dados reais:**

```bash
# 1. Conectar na VPS
ssh <seu-usuario>@<ip-ou-dominio>

# 2. Ir para o projeto
cd <caminho-real-do-projeto>

# 3. Baixar atualizações
git pull origin main

# 4. Editar e configurar o script
nano atualizar-vps.sh
# (Ajuste: PROJECT_DIR, DB_USER, DB_NAME)

# 5. Tornar executável
chmod +x atualizar-vps.sh

# 6. Executar
./atualizar-vps.sh
```

## 💡 Exemplo Completo Real

Vamos supor que:
- VPS: `192.168.1.100`
- Usuário: `root`
- Projeto em: `/var/www/local-mart`
- PostgreSQL user: `postgres`
- Banco: `localmart`

**Comandos que você executaria:**

```bash
# 1. Conectar
ssh root@192.168.1.100

# 2. Ir para o projeto
cd /var/www/local-mart

# 3. Baixar atualizações
git pull origin main

# 4. Editar script
nano atualizar-vps.sh
# Dentro do nano, mude:
# PROJECT_DIR="/var/www/local-mart"
# DB_USER="postgres"
# DB_NAME="localmart"
# Salve: Ctrl+X, Y, Enter

# 5. Executar
chmod +x atualizar-vps.sh
./atualizar-vps.sh
```

## ⚠️ Se Preferir Fazer Manualmente

Se não quiser usar o script, veja `GUIA_DEPLOY_VPS.md` para fazer passo a passo manualmente.

## 🆘 Precisa de Ajuda?

Se algo der errado:
1. Verifique os logs: `pm2 logs` ou `tail -f backend/logs/combined.log`
2. Veja `GUIA_DEPLOY_VPS.md` na seção "Solução de Problemas"
3. Verifique se todas as informações estão corretas no script

---

**Lembre-se:** Os comandos são exemplos. Sempre adapte com seus dados reais! 🎯
