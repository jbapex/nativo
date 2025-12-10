# Como Resetar o Rate Limiting de Login

## Problema
Se você receber o erro "Muitas tentativas de login. Tente novamente em 15 minutos", significa que o rate limiting bloqueou seu IP após muitas tentativas de login falhadas.

## Soluções

### 1. Aguardar o Tempo de Bloqueio (Recomendado)
- **Em desenvolvimento**: 5 minutos
- **Em produção**: 15 minutos

### 2. Reiniciar o Servidor Backend
O rate limiting é armazenado em memória, então reiniciar o servidor limpa o contador:

```bash
# Parar o servidor (Ctrl+C) e iniciar novamente
cd backend
npm run dev
```

### 3. Usar um IP Diferente
Se estiver em desenvolvimento local, você pode:
- Usar uma VPN
- Usar outro dispositivo na mesma rede
- Usar o modo anônimo do navegador (pode não funcionar se o IP for o mesmo)

### 4. Ajustar as Configurações (Desenvolvimento)

Edite o arquivo `.env` no backend:

```env
# Aumentar limite de tentativas em desenvolvimento
AUTH_RATE_LIMIT_MAX=50
AUTH_RATE_LIMIT_WINDOW_MS=300000  # 5 minutos
```

Depois reinicie o servidor.

## Configurações Atuais

### Desenvolvimento (NODE_ENV !== 'production')
- **Máximo de tentativas**: 20 por IP
- **Janela de tempo**: 5 minutos
- **Mensagem**: "Muitas tentativas de login. Tente novamente em alguns minutos."

### Produção
- **Máximo de tentativas**: 5 por IP
- **Janela de tempo**: 15 minutos
- **Mensagem**: "Muitas tentativas de login. Tente novamente em 15 minutos."

## Prevenção

Para evitar bloqueios:
1. Use credenciais corretas
2. Não tente fazer login repetidamente com credenciais erradas
3. Use o sistema de refresh token para manter a sessão ativa
4. Em desenvolvimento, aumente os limites no `.env`

## Nota Técnica

O rate limiting usa `express-rate-limit` que armazena os contadores em memória. Isso significa:
- ✅ Reiniciar o servidor limpa o contador
- ✅ O contador é por IP, não por usuário
- ✅ Em produção, considere usar Redis para rate limiting distribuído

