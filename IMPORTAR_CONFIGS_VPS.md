# 📥 Importar Configurações na VPS

O arquivo `configs-admin-export.json` foi enviado para o repositório Git.

## 🚀 Comandos para Executar na VPS

```bash
# 1. Conectar na VPS
ssh root@nativo.contaae.online

# 2. Ir para o projeto
cd /root/nativo

# 3. Baixar atualizações (inclui o arquivo de configurações)
git pull origin main

# 4. Importar configurações
node backend/scripts/importar-configuracoes-admin.js configs-admin-export.json

# 5. Reiniciar serviços (se necessário)
pm2 restart all
```

## ✅ O Que Será Importado

- ✅ 1 configuração do sistema
- ✅ 2 categorias
- ✅ 3 planos
- ✅ 11.143 cidades (todas do Brasil)
- ℹ️ 1 usuário admin (apenas informações, sem senha)

## ⚠️ Importante

- As cidades já existentes na VPS **não serão sobrescritas** (apenas novas serão adicionadas)
- Configurações, categorias e planos **serão atualizados** se já existirem
- Usuários admin **não são importados automaticamente** (por segurança)

---

**Arquivo:** `configs-admin-export.json`  
**Tamanho:** 1.4 MB  
**Data:** 2025-12-11

