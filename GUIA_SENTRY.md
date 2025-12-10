# 🐛 Guia de Configuração: Sentry (Error Tracking)

O Sentry foi integrado ao sistema para rastreamento automático de erros e monitoramento de performance.

## 📋 O que é o Sentry?

O Sentry é uma plataforma de **Error Tracking** que:
- ✅ Captura erros automaticamente
- ✅ Monitora performance da aplicação
- ✅ Envia notificações em tempo real
- ✅ Fornece stack traces detalhados
- ✅ Agrupa erros similares

## 🚀 Configuração

### 1. Criar Conta no Sentry

1. Acesse: https://sentry.io/signup/
2. Crie uma conta gratuita
3. Crie um novo projeto:
   - **Platform:** Node.js
   - **Framework:** Express

### 2. Obter DSN

Após criar o projeto, você receberá um **DSN** (Data Source Name) no formato:
```
https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 3. Configurar no Projeto

Edite o arquivo `.env` no diretório `backend/`:

```env
# Sentry (Error Tracking)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 4. Reiniciar Servidor

```bash
cd backend
npm run dev
```

O Sentry será inicializado automaticamente.

## ✅ Verificação

Após configurar, você verá no console:
```
✅ Sentry inicializado para Error Tracking
```

Se não configurar o DSN, verá:
```
ℹ️  Sentry não configurado (SENTRY_DSN não definido)
```

O sistema funciona normalmente sem Sentry (é opcional).

## 🧪 Testar

Para testar se o Sentry está funcionando, crie uma rota de teste:

```javascript
// Em qualquer rota (ex: backend/routes/test.js)
router.get('/test-error', (req, res) => {
  throw new Error('Teste de erro do Sentry');
});
```

Acesse: `http://localhost:3001/api/test/test-error`

O erro aparecerá no dashboard do Sentry em alguns segundos.

## 📊 Recursos do Sentry

### Error Tracking
- Captura automática de exceções não tratadas
- Stack traces completos
- Contexto da requisição (headers, body, query params)
- Agrupamento inteligente de erros similares

### Performance Monitoring
- Tempo de resposta de cada rota
- Queries lentas
- Transações HTTP
- Profiling (requer plano pago)

### Contexto Adicional
- Informações do usuário (ID, email, role)
- Tags personalizadas
- Breadcrumbs (histórico de ações)

## 🔧 Uso Manual

### Capturar Exceção Manualmente

```javascript
import { captureException } from '../utils/sentry.js';

try {
  // código que pode falhar
} catch (error) {
  captureException(error, {
    extra: {
      userId: req.user?.id,
      action: 'processar-pagamento',
    },
  });
}
```

### Capturar Mensagem

```javascript
import { captureMessage } from '../utils/sentry.js';

captureMessage('Pagamento processado com sucesso', 'info', {
  orderId: order.id,
  amount: order.total_amount,
});
```

### Adicionar Contexto do Usuário

```javascript
import { setUser } from '../utils/sentry.js';

// No middleware de autenticação
if (req.user) {
  setUser(req.user);
}
```

## 📈 Dashboard do Sentry

Após configurar, acesse o dashboard:
- **URL:** https://sentry.io/
- **Projetos:** Seus projetos aparecerão na lista
- **Issues:** Erros capturados aparecerão aqui
- **Performance:** Métricas de performance

## ⚙️ Configurações Avançadas

### Ajustar Taxa de Sampling

Edite `backend/utils/sentry.js`:

```javascript
tracesSampleRate: 0.1, // 10% das requisições (padrão)
```

### Filtrar Erros

O Sentry já filtra automaticamente:
- Erros 400 (validação)
- Erros 404 (favicon.ico)
- Erros de rede comuns

Para adicionar mais filtros, edite `backend/utils/sentry.js`:

```javascript
ignoreErrors: [
  'NetworkError',
  'SeuErroEspecifico',
],
```

## 💰 Planos

O Sentry oferece:
- **Free:** 5.000 eventos/mês
- **Team:** $26/mês (50.000 eventos)
- **Business:** $80/mês (500.000 eventos)

Para projetos pequenos/médios, o plano gratuito é suficiente.

## 🔒 Privacidade

O Sentry captura:
- ✅ Stack traces
- ✅ Headers HTTP
- ✅ Query params
- ✅ Body da requisição (cuidado com senhas!)

**Recomendação:** Configure filtros para não capturar dados sensíveis:

```javascript
beforeSend(event) {
  // Remover senhas do body
  if (event.request?.data?.password) {
    delete event.request.data.password;
  }
  return event;
}
```

## 📚 Recursos

- [Documentação Sentry](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Node.js SDK](https://github.com/getsentry/sentry-javascript/tree/develop/packages/node)
- [Best Practices](https://docs.sentry.io/platforms/javascript/guides/node/usage/)

## ✅ Checklist

- [ ] Conta criada no Sentry
- [ ] Projeto Node.js criado
- [ ] DSN copiado
- [ ] DSN configurado no `.env`
- [ ] Servidor reiniciado
- [ ] Erro de teste enviado
- [ ] Dashboard verificado

---

**Nota:** O Sentry é completamente opcional. O sistema funciona perfeitamente sem ele, mas é altamente recomendado para produção.

