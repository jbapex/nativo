# 🔐 Configurar Autenticação do ngrok

## ✅ Passo 1: Criar Conta no ngrok

1. **Acesse:** https://dashboard.ngrok.com/signup
2. **Crie uma conta gratuita** (pode usar email ou GitHub/Google)
3. **Verifique seu email** se necessário

## ✅ Passo 2: Obter seu Authtoken

1. **Após fazer login**, acesse: https://dashboard.ngrok.com/get-started/your-authtoken
2. **Copie o authtoken** que aparece na tela
   - Será algo como: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_

## ✅ Passo 3: Configurar o Authtoken

No terminal, execute:

```bash
ngrok config add-authtoken SEU_AUTHTOKEN_AQUI
```

**Exemplo:**
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_
```

Você verá:
```
Authtoken saved to configuration file: /Users/seu-usuario/.ngrok2/ngrok.yml
```

## ✅ Passo 4: Testar

Agora execute novamente:

```bash
ngrok http 3001
```

Deve funcionar! 🎉

## 📝 Resumo Rápido

1. Criar conta: https://dashboard.ngrok.com/signup
2. Pegar authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configurar: `ngrok config add-authtoken SEU_TOKEN`
4. Usar: `ngrok http 3001`

