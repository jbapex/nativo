# 🚀 COMO TESTAR O SISTEMA

## 1. Iniciar o Backend

```bash
cd backend
npm run dev
```

O servidor deve iniciar na porta **3001**.

---

## 2. Testar Paginação

### **Teste 1: Listar Produtos (Primeira Página)**
```bash
curl 'http://localhost:3001/api/products?page=1&limit=10'
```

**Resposta esperada:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Teste 2: Listar Lojas**
```bash
curl 'http://localhost:3001/api/stores?page=1&limit=10'
```

### **Teste 3: Listar Pedidos (requer autenticação)**
```bash
# Primeiro, faça login para obter o token
TOKEN="seu-token-aqui"

curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:3001/api/orders?page=1&limit=10'
```

---

## 3. Testar Compressão

```bash
# Verificar se resposta está comprimida
curl -H "Accept-Encoding: gzip" \
  -I 'http://localhost:3001/api/products?page=1&limit=50'

# Deve mostrar: Content-Encoding: gzip
```

---

## 4. Verificar no Navegador

Abra o navegador e acesse:
- **Frontend:** http://localhost:3006 (se estiver rodando)
- **API direta:** http://localhost:3001/api/products?page=1&limit=10

---

## 5. Verificar Logs do Servidor

No terminal onde o backend está rodando, você deve ver:
- ✅ "Servidor rodando na porta 3001"
- ✅ Logs de requisições
- ✅ Queries SQL (se debug estiver ativo)

---

## 🐛 Problemas Comuns

### **Erro: "Cannot find module"**
```bash
cd backend
npm install
```

### **Erro: "Port 3001 already in use"**
```bash
# Encontrar processo usando a porta
lsof -ti:3001

# Matar processo (substitua PID pelo número)
kill -9 PID
```

### **Erro: "Database not initialized"**
```bash
cd backend
npm run migrate
```

---

## ✅ Checklist de Testes

- [ ] Backend inicia sem erros
- [ ] API responde na porta 3001
- [ ] Paginação funciona em produtos
- [ ] Paginação funciona em lojas
- [ ] Estrutura de resposta está correta
- [ ] Compressão está ativa
- [ ] Sem erros no console

---

**Boa sorte!** 🎉

