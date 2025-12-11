# 📤📥 Como Exportar e Importar Configurações do Admin

## 🎯 Objetivo

Exportar todas as configurações do admin do seu ambiente local e importar na VPS.

## 📋 O Que É Exportado

- ✅ **Settings** - Todas as configurações do sistema (geral, usuários, segurança, integrações, etc.)
- ✅ **Categories** - Categorias globais criadas pelo admin
- ✅ **Plans** - Planos de assinatura
- ✅ **Cities** - Cidades customizadas (não importadas do IBGE)
- ℹ️ **Admin Users** - Apenas informações (sem senhas, por segurança)

## 🚀 Processo Completo

### Passo 1: Exportar no Ambiente Local

```bash
# No seu computador local
cd /caminho/para/local-mart

# Executar script de exportação
node backend/scripts/exportar-configuracoes-admin.js
```

**Ou salvar em arquivo:**

```bash
node backend/scripts/exportar-configuracoes-admin.js > configs-admin-export.json
```

O arquivo `configs-admin-export.json` será criado na raiz do projeto.

### Passo 2: Enviar para a VPS

#### Opção A: Via SCP (linha de comando)

```bash
# Do seu computador local
scp configs-admin-export.json root@nativo.contaae.online:/root/nativo/
```

#### Opção B: Via Git (recomendado)

```bash
# No seu computador local
git add configs-admin-export.json
git commit -m "Exportar configurações do admin"
git push origin main

# Na VPS
cd /root/nativo
git pull origin main
```

#### Opção C: Via Cursor (se usar Cursor na VPS)

1. Abra o arquivo `configs-admin-export.json` no Cursor local
2. Copie o conteúdo
3. Na VPS, crie o arquivo: `configs-admin-export.json`
4. Cole o conteúdo

### Passo 3: Importar na VPS

```bash
# Conectar na VPS
ssh root@nativo.contaae.online

# Ir para o projeto
cd /root/nativo

# Importar configurações
node backend/scripts/importar-configuracoes-admin.js configs-admin-export.json
```

## 📝 Exemplo Completo

### No Computador Local:

```bash
# 1. Exportar
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb
node backend/scripts/exportar-configuracoes-admin.js > configs-admin-export.json

# 2. Enviar para VPS via SCP
scp configs-admin-export.json root@nativo.contaae.online:/root/nativo/
```

### Na VPS:

```bash
# 1. Conectar
ssh root@nativo.contaae.online

# 2. Ir para o projeto
cd /root/nativo

# 3. Verificar se arquivo está lá
ls -la configs-admin-export.json

# 4. Importar
node backend/scripts/importar-configuracoes-admin.js configs-admin-export.json

# 5. Reiniciar serviços (se necessário)
pm2 restart all
```

## 🔄 Atualizar Script de Atualização

O script `atualizar-vps.sh` pode ser atualizado para incluir a importação automática:

```bash
# Adicionar no final do script, antes de reiniciar serviços:
if [ -f "configs-admin-export.json" ]; then
    echo "📥 Importando configurações do admin..."
    node backend/scripts/importar-configuracoes-admin.js configs-admin-export.json
fi
```

## ⚠️ Importante

### O Que NÃO É Exportado (Por Segurança)

- ❌ **Senhas de usuários** (incluindo admin)
- ❌ **Tokens de API** (se estiverem no banco)
- ❌ **Dados de lojas** (produtos, pedidos, etc.)
- ❌ **Dados de clientes**

### O Que É Exportado

- ✅ Configurações do sistema
- ✅ Categorias globais
- ✅ Planos
- ✅ Cidades customizadas
- ✅ Informações de usuários admin (sem senhas)

## 🐛 Solução de Problemas

### Erro: "Cannot find module"

```bash
# Instalar dependências
cd backend
npm install
```

### Erro: "File not found"

```bash
# Verificar se arquivo existe
ls -la configs-admin-export.json

# Verificar caminho
pwd
```

### Erro: "Database locked" (SQLite)

```bash
# Parar serviços antes de importar
pm2 stop all
node backend/scripts/importar-configuracoes-admin.js configs-admin-export.json
pm2 start all
```

## 📊 Verificar Importação

```bash
# Verificar configurações importadas
sqlite3 backend/database.sqlite "SELECT COUNT(*) FROM settings;"

# Ver categorias
sqlite3 backend/database.sqlite "SELECT name FROM categories WHERE store_id IS NULL;"

# Ver planos
sqlite3 backend/database.sqlite "SELECT name, price FROM plans;"
```

## 🔐 Segurança

⚠️ **NUNCA** faça commit do arquivo `configs-admin-export.json` no Git se contiver:
- Tokens de API
- Chaves secretas
- Informações sensíveis

✅ **Pode fazer commit** se contiver apenas:
- Configurações gerais
- Categorias
- Planos
- Cidades

## 💡 Dica

Crie um backup antes de importar:

```bash
# Na VPS, antes de importar
cp backend/database.sqlite backend/database.sqlite.backup_$(date +%Y%m%d)
```

---

**Última atualização:** 2024

