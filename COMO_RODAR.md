# 🚀 COMO RODAR O SISTEMA

## **Opção 1: Usando o Script (Recomendado)**

```bash
./INICIAR_SERVIDOR.sh
```

---

## **Opção 2: Manualmente**

### **1. Iniciar o Backend:**

```bash
cd backend
npm install  # Se ainda não instalou as dependências
npm run dev
```

O servidor deve iniciar na porta **3001**.

Você verá algo como:
```
✅ Servidor rodando na porta 3001
✅ Banco de dados inicializado
```

---

## **2. Testar se está funcionando:**

Em outro terminal, teste:

```bash
# Teste básico
curl http://localhost:3001/api/products?page=1&limit=5

# Ou abra no navegador:
# http://localhost:3001/api/products?page=1&limit=5
```

---

## **3. Verificar Estrutura de Resposta:**

A resposta deve ter esta estrutura:

```json
{
  "data": [
    {
      "id": "...",
      "name": "...",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 150,
    "totalPages": 30,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## **4. Testar Compressão:**

```bash
curl -H "Accept-Encoding: gzip" \
  -I http://localhost:3001/api/products?page=1&limit=50
```

Deve mostrar: `Content-Encoding: gzip`

---

## **5. Testar Outras Rotas:**

```bash
# Lojas
curl http://localhost:3001/api/stores?page=1&limit=10

# Pedidos (requer autenticação)
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3001/api/orders?page=1&limit=10
```

---

## 🐛 **Problemas Comuns:**

### **Erro: "Port 3001 already in use"**
```bash
# Encontrar e matar processo
lsof -ti:3001 | xargs kill -9
```

### **Erro: "Cannot find module"**
```bash
cd backend
npm install
```

### **Erro: "Database not initialized"**
```bash
cd backend
npm run migrate
```

---

## ✅ **Checklist:**

- [ ] Backend inicia sem erros
- [ ] API responde na porta 3001
- [ ] Resposta tem estrutura `{ data, pagination }`
- [ ] Paginação funciona corretamente
- [ ] Compressão está ativa
- [ ] Sem erros no console

---

**Pronto para testar!** 🎉

