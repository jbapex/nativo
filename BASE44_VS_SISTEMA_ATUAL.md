# Comparação: Base44 vs Sistema Atual (Self-Hosted)

## 📋 Resumo das Diferenças

### **Base44 (Sistema Antigo)**
- Autenticação gerenciada pelo Base44 SDK
- Redirecionamento automático para página de login do Base44
- Banco de dados hospedado no Base44
- API gerenciada pelo Base44

### **Sistema Atual (Self-Hosted)**
- Autenticação própria com JWT
- Modal de login integrado (LoginDialog)
- Banco de dados SQLite local
- API REST própria (Node.js/Express)

---

## 🔐 1. Sistema de Autenticação

### **Base44**

```javascript
// Verificação de Login
const userData = await User.me(); // Se retornar dados, está logado

// Login
User.login(); // Redirecionava para página do Base44

// Logout
User.logout(); // Fazia logout no Base44

// Verificação de autenticação
User.isAuthenticated(); // Verificava se estava logado
```

**Características:**
- ✅ Redirecionamento automático para `https://base44.app/login`
- ✅ Gerenciamento de sessão pelo Base44
- ❌ Não tinha controle sobre o fluxo de login
- ❌ Dependência externa

### **Sistema Atual**

```javascript
// Verificação de Login
const userData = await User.me(); // Se retornar dados, está logado

// Login (com email/senha)
await User.login(email, password); // Retorna dados do usuário

// Login (sem parâmetros - abre modal)
// Lança erro para que componente abra LoginDialog
try {
  await User.login();
} catch {
  setLoginDialogOpen(true);
}

// Logout
await User.logout(); // Remove token do localStorage

// Verificação de autenticação
try {
  const user = await User.me();
  // Usuário está logado
} catch {
  // Usuário não está logado
}
```

**Características:**
- ✅ Modal de login integrado (LoginDialog)
- ✅ Controle total sobre o fluxo
- ✅ Token JWT armazenado no localStorage
- ✅ Sem dependências externas

---

## 👥 2. Tipos de Usuários (Roles)

### **Ambos os Sistemas**

Os roles são os mesmos:

- **`user`** - Usuário comum (pode comprar/navegar)
- **`store`** - Lojista (pode vender produtos)
- **`admin`** - Administrador (gerencia tudo)

### **Diferença na Implementação**

**Base44:**
- Roles gerenciados pelo Base44
- Status da loja vinculado ao usuário

**Sistema Atual:**
- Roles armazenados no banco local (`users.role`)
- Status da loja separado (`stores.status`)
- Usuário pode ter `role: "store"` mas loja com `status: "pending"`

---

## 🔒 3. Permissões de Página

### **Base44**

```javascript
export const pagePermissions = {
  public: true,           // Página acessível sem login
  loginRequired: false,   // Não obriga login
  roles: ["admin"]       // (opcional) Apenas para admins
};
```

**Funcionamento:**
- Base44 verificava automaticamente
- Redirecionava se não tivesse permissão

### **Sistema Atual**

```javascript
export const pagePermissions = {
  public: true,           // Página acessível sem login
  loginRequired: false,   // Não obriga login
  roles: ["admin"]       // (opcional) Apenas para admins
};
```

**Funcionamento:**
- Layout.jsx verifica `User.me()` manualmente
- Componentes verificam permissões internamente
- Exemplo: `AdminDashboard` verifica `role === "admin"`

**Exemplo de Implementação:**

```javascript
// src/pages/AdminDashboard.jsx
export const pagePermissions = {
  public: false,
  loginRequired: true,
  roles: ["admin"]
};

// No componente:
useEffect(() => {
  const checkAuth = async () => {
    try {
      const user = await User.me();
      if (user.role !== "admin") {
        navigate(createPageUrl("Home"));
      }
    } catch {
      navigate(createPageUrl("AdminLogin"));
    }
  };
  checkAuth();
}, []);
```

---

## 🏪 4. Fluxo de Cadastro de Lojista

### **Base44 - Na Home**

```
Usuário clica "Vender Produtos"
  ↓
Não está logado?
  → User.login() → Redireciona para Base44
  ↓
Já é lojista (role = "store")?
  → Redireciona para StoreProfile
  ↓
É usuário comum (role = "user")?
  → Abre formulário BecomeSeller
```

### **Sistema Atual - Na Home**

```javascript
// src/pages/Home.jsx
const handleSellerClick = () => {
  if (!isAuthenticated) {
    setLoginPromptOpen(true); // Abre LoginDialog
    return;
  }

  if (user?.role === "store") {
    navigate(createPageUrl("StoreProfile"));
    return;
  }

  setSellerDialogOpen(true); // Abre BecomeSeller
};
```

**Diferenças:**
- ✅ Modal de login em vez de redirecionamento
- ✅ Mesma lógica de verificação
- ✅ Fluxo mais integrado

---

## ✅ 5. Processo de Aprovação

### **Base44**

```
1. Usuário faz login
2. Cadastra loja
3. Status "pending" 
4. Admin aprova no Base44
5. Status "approved" + role vira "store"
6. Loja fica visível e pode vender
```

### **Sistema Atual**

```
1. Usuário faz login (ou cria conta no StoreSignup)
2. Cadastra loja (status: "pending")
3. Usuário recebe role: "store" (mas loja pendente)
4. Admin aprova em /AdminStores
5. Status muda para "approved"
6. Loja fica visível e pode vender
```

**Diferenças:**
- ✅ Aprovação no painel admin próprio
- ✅ Status da loja separado do role do usuário
- ✅ Usuário pode ter role "store" mas loja pendente

**Código de Aprovação:**

```javascript
// Backend: backend/routes/stores.js
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  // Admin pode mudar status
  if (status !== undefined && req.user.role === 'admin') {
    updates.push('status = ?');
    values.push(status); // "pending", "approved", "rejected"
  }
});
```

---

## 🛠️ 6. Métodos de Autenticação Disponíveis

### **Base44**

```javascript
User.me()              // Retorna dados do usuário atual
User.login()           // Redireciona para página de login
User.logout()          // Faz logout
User.isAuthenticated() // Verifica se está logado
```

### **Sistema Atual**

```javascript
// src/api/apiClient.js
User.me()                    // Retorna dados do usuário atual
User.login(email, password)  // Faz login e retorna usuário
User.register(email, password, full_name) // Registra novo usuário
User.logout()               // Remove token e faz logout
User.updateMyUserData(data) // Atualiza dados do usuário
User.filter(filters)        // Filtra usuários (admin)
```

**Novos Métodos:**
- ✅ `User.register()` - Registro direto
- ✅ `User.updateMyUserData()` - Atualizar perfil
- ✅ `User.filter()` - Buscar usuários (admin)

---

## 📊 7. Estrutura de Dados

### **Base44**

- Dados no banco do Base44
- Estrutura definida pelo Base44
- Acesso via SDK

### **Sistema Atual**

**Tabela `users`:**
```sql
- id (UUID)
- email
- password_hash
- full_name
- role (user, store, admin)
- status (pending, approved, rejected)
- created_at
- updated_at
```

**Tabela `stores`:**
```sql
- id (UUID)
- user_id (FK para users)
- name
- description
- city_id (FK para cities)
- category_id (FK para categories)
- status (pending, approved, rejected)
- created_at
- updated_at
```

**Diferenças:**
- ✅ Separação clara entre usuário e loja
- ✅ Status da loja independente do role
- ✅ Relacionamentos explícitos (city_id, category_id)

---

## 🔄 8. Fluxo Completo de Cadastro de Loja

### **Base44**

```
1. Usuário clica "Vender Produtos"
2. Se não logado → Redireciona para Base44
3. Faz login no Base44
4. Volta para aplicação
5. Abre BecomeSeller
6. Preenche formulário
7. Cria loja (status: pending)
8. Admin aprova no Base44
9. Loja fica ativa
```

### **Sistema Atual**

**Opção 1: Via Home (usuário já logado)**
```
1. Usuário clica "Vender Produtos"
2. Se não logado → Abre LoginDialog
3. Faz login no modal
4. Abre BecomeSeller
5. Preenche formulário
6. Cria loja (status: pending)
7. Admin aprova em /AdminStores
8. Loja fica ativa
```

**Opção 2: Via StoreSignup (novo usuário)**
```
1. Usuário acessa /StoreSignup
2. Escolhe plano
3. Preenche dados de acesso (email, senha)
4. Preenche dados da loja (com cidade e categoria)
5. Sistema tenta fazer login
6. Se falhar, cria novo usuário
7. Cria loja (status: pending)
8. Redireciona para StoreProfile
9. Admin aprova em /AdminStores
10. Loja fica ativa
```

---

## 🎯 Principais Melhorias do Sistema Atual

1. **✅ Controle Total**
   - Sem dependências externas
   - Customização completa

2. **✅ Experiência do Usuário**
   - Modal de login integrado
   - Sem redirecionamentos externos

3. **✅ Flexibilidade**
   - Estrutura de dados customizável
   - Fluxos de aprovação personalizados

4. **✅ Segurança**
   - JWT próprio
   - Controle sobre tokens e sessões

5. **✅ Dados Locais**
   - Banco de dados próprio
   - Backup e migração facilitados

---

## 📝 Notas Importantes

### **Compatibilidade**

O sistema atual mantém a mesma interface (`User.me()`, `User.login()`, etc.) para facilitar a migração, mas a implementação é completamente diferente.

### **Migração de Dados**

Se você tinha dados no Base44, seria necessário:
1. Exportar dados do Base44
2. Importar para o banco local
3. Ajustar IDs e relacionamentos

### **Funcionalidades Não Migradas**

Algumas funcionalidades do Base44 podem não estar disponíveis:
- Upload de arquivos (precisa implementar)
- Integrações externas (email, etc.)
- Alguns recursos avançados do Base44

---

## 🔍 Exemplo Prático: Verificação de Autenticação

### **Base44**

```javascript
// Automático - Base44 gerenciava
const user = await User.me();
if (!user) {
  // Redirecionava automaticamente
}
```

### **Sistema Atual**

```javascript
// Manual - você controla
try {
  const user = await User.me();
  setIsAuthenticated(true);
  setUser(user);
} catch (error) {
  setIsAuthenticated(false);
  setUser(null);
  // Você decide o que fazer
}
```

---

## 📚 Conclusão

O sistema atual mantém a **mesma lógica e fluxos** do Base44, mas com **controle total** sobre:
- Autenticação
- Banco de dados
- API
- Fluxos de aprovação
- Experiência do usuário

A principal diferença é que **você tem controle completo** sobre todos os aspectos do sistema, enquanto no Base44 tudo era gerenciado externamente.

