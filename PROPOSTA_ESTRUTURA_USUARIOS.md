# 📋 PROPOSTA: Estrutura de Usuários do Sistema

## 🎯 Objetivo
Criar uma estrutura clara e diferenciada para os 3 tipos de usuários:
1. **Admin** - Gerencia o sistema
2. **Lojista (Store)** - Vende produtos
3. **Cliente (Customer)** - Compra produtos

---

## 📊 Estrutura Atual vs Proposta

### **Estrutura Atual:**
```
users:
  - id
  - email
  - password_hash
  - full_name
  - role (user/store/admin)
  - status
```

**Problemas:**
- ❌ Usuários normais não têm campos para endereço, telefone, CPF
- ❌ Não há diferenciação clara entre cliente e lojista no cadastro
- ❌ Dados de entrega ficam apenas no pedido (não reutilizáveis)

---

## ✅ Estrutura Proposta

### **1. Tabela `users` (Melhorada)**

```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    
    -- Tipo de usuário
    role TEXT DEFAULT 'customer', -- 'customer', 'store', 'admin'
    status TEXT DEFAULT 'active', -- 'active', 'pending', 'suspended', 'inactive'
    
    -- Dados básicos (para todos os tipos)
    phone TEXT, -- Telefone/WhatsApp
    avatar TEXT, -- URL da foto de perfil
    
    -- Dados específicos de CLIENTE (role = 'customer')
    cpf TEXT, -- CPF do cliente (opcional, para checkout)
    birth_date DATE, -- Data de nascimento (opcional)
    
    -- Dados específicos de LOJISTA (role = 'store')
    -- (já existe na tabela stores)
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME -- Último acesso
);
```

### **2. Nova Tabela `user_addresses` (Endereços)**

```sql
CREATE TABLE IF NOT EXISTS user_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    -- Tipo de endereço
    type TEXT DEFAULT 'delivery', -- 'delivery', 'billing', 'both'
    label TEXT, -- 'Casa', 'Trabalho', 'Outro'
    is_default BOOLEAN DEFAULT 0, -- Endereço padrão
    
    -- Dados do endereço
    recipient_name TEXT NOT NULL, -- Nome do destinatário
    phone TEXT, -- Telefone de contato
    zip_code TEXT NOT NULL, -- CEP
    street TEXT NOT NULL, -- Rua
    number TEXT NOT NULL, -- Número
    complement TEXT, -- Complemento (apto, bloco, etc)
    neighborhood TEXT NOT NULL, -- Bairro
    city TEXT NOT NULL, -- Cidade
    state TEXT NOT NULL, -- Estado (UF)
    reference TEXT, -- Ponto de referência
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default);
```

---

## 🔄 Fluxos de Cadastro

### **1. Cadastro de CLIENTE (Usuário Normal)**

**Fluxo:**
```
1. Usuário clica "Criar Conta" ou "Cadastrar"
2. Formulário básico:
   - Nome completo
   - Email
   - Senha
   - Confirmar senha
   - Telefone (opcional)
3. Após cadastro → Login automático
4. Redireciona para "Completar Perfil" (opcional):
   - Adicionar endereço
   - Adicionar CPF (opcional)
   - Foto de perfil (opcional)
```

**Campos obrigatórios:**
- ✅ Nome completo
- ✅ Email
- ✅ Senha

**Campos opcionais:**
- Telefone
- CPF
- Endereço (pode adicionar depois)
- Data de nascimento

---

### **2. Cadastro de LOJISTA**

**Fluxo:**
```
1. Usuário clica "Vender Produtos" ou "Quero ser Lojista"
2. Opção A: Já tem conta?
   - Login
   - Se role = 'customer' → Pergunta se quer virar lojista
   - Se role = 'store' → Redireciona para StoreProfile
3. Opção B: Novo cadastro
   - Formulário de cadastro (nome, email, senha)
   - Formulário da loja:
     - Nome da loja
     - Descrição
     - Cidade
     - Categoria
     - Tipo (física/online/ambas)
     - WhatsApp
     - Plano escolhido
4. Cria usuário com role = 'store'
5. Cria loja com status = 'pending'
6. Aguarda aprovação do admin
```

**Campos obrigatórios:**
- ✅ Nome completo
- ✅ Email
- ✅ Senha
- ✅ Nome da loja
- ✅ Cidade
- ✅ Categoria
- ✅ WhatsApp

---

## 📱 Páginas e Componentes

### **1. Página de Perfil do Cliente** (`/Profile` ou `/MyAccount`)

**Seções:**
- **Dados Pessoais**
  - Nome completo
  - Email
  - Telefone
  - CPF (opcional)
  - Data de nascimento (opcional)
  - Foto de perfil

- **Endereços**
  - Lista de endereços cadastrados
  - Botão "Adicionar Endereço"
  - Marcar endereço padrão
  - Editar/Excluir endereços

- **Pedidos**
  - Histórico de pedidos
  - Status dos pedidos
  - Detalhes do pedido

- **Favoritos**
  - Lista de produtos favoritados

- **Avaliações**
  - Produtos avaliados

---

### **2. Página de Perfil do Lojista** (`/StoreProfile`)

**Já existe, mas pode melhorar:**
- Adicionar seção "Dados Pessoais" (separado dos dados da loja)
- Mostrar dados do usuário (nome, email, telefone)
- Link para gerenciar loja

---

### **3. Componente de Seleção de Endereço** (Checkout)

**Funcionalidades:**
- Listar endereços cadastrados
- Selecionar endereço existente
- Adicionar novo endereço
- Editar endereço selecionado

---

## 🔐 Regras de Negócio

### **1. Roles e Permissões**

| Role | Pode Comprar | Pode Vender | Pode Gerenciar Sistema |
|------|--------------|-------------|------------------------|
| `customer` | ✅ | ❌ | ❌ |
| `store` | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ |

### **2. Conversão de Role**

**Cliente → Lojista:**
- Cliente pode se tornar lojista a qualquer momento
- Ao criar loja, role muda de `customer` → `store`
- Mantém todos os dados (pedidos, favoritos, etc.)

**Lojista → Cliente:**
- Lojista pode cancelar loja
- Role volta para `customer`
- Loja fica inativa (não deletada)

### **3. Status do Usuário**

- `active` - Usuário ativo (padrão para clientes)
- `pending` - Aguardando aprovação (lojistas novos)
- `suspended` - Suspenso (violação de regras)
- `inactive` - Inativo (desativado pelo próprio usuário)

---

## 🚀 Implementação Sugerida (Ordem)

### **Fase 1: Estrutura Base**
1. ✅ Adicionar campos na tabela `users` (phone, cpf, avatar, etc.)
2. ✅ Criar tabela `user_addresses`
3. ✅ Criar migrations no `db.js`

### **Fase 2: Backend**
1. ✅ Atualizar rota `/auth/register` para aceitar novos campos
2. ✅ Criar rotas para endereços (`/api/user-addresses`)
3. ✅ Atualizar rota `/auth/me` para retornar endereços

### **Fase 3: Frontend - Cadastro**
1. ✅ Melhorar `LoginDialog` para diferenciar cadastro de cliente vs lojista
2. ✅ Criar componente `AddressForm` (reutilizável)
3. ✅ Criar página `Profile` para clientes

### **Fase 4: Frontend - Checkout**
1. ✅ Integrar seleção de endereço no checkout
2. ✅ Salvar endereço do pedido
3. ✅ Permitir adicionar novo endereço durante checkout

### **Fase 5: Melhorias**
1. ✅ Validação de CPF
2. ✅ Integração com API de CEP (Buscar endereço por CEP)
3. ✅ Upload de foto de perfil
4. ✅ Histórico de endereços usados

---

## 💡 Exemplos de Uso

### **Cadastro Rápido de Cliente:**
```javascript
// Usuário só precisa de nome, email e senha
await User.register({
  email: "cliente@email.com",
  password: "senha123",
  full_name: "João Silva",
  role: "customer" // padrão
});
```

### **Adicionar Endereço:**
```javascript
await UserAddresses.create({
  user_id: user.id,
  type: "delivery",
  label: "Casa",
  is_default: true,
  recipient_name: "João Silva",
  zip_code: "12345-678",
  street: "Rua Exemplo",
  number: "123",
  complement: "Apto 45",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP"
});
```

### **Checkout com Endereço:**
```javascript
// Usuário seleciona endereço existente
const order = await Orders.create({
  user_id: user.id,
  store_id: store.id,
  address_id: selectedAddress.id, // ID do endereço
  // ... outros dados
});
```

---

## ❓ Decisões a Tomar

1. **CPF obrigatório?**
   - ✅ Opcional (mais flexível)
   - ❌ Obrigatório (mais seguro, mas pode afastar clientes)

2. **Múltiplos endereços?**
   - ✅ Sim (mais conveniente)
   - ❌ Não (mais simples)

3. **Validação de CPF?**
   - ✅ Sim (validar formato)
   - ❌ Não (aceitar qualquer formato)

4. **Busca de CEP?**
   - ✅ Sim (integração com ViaCEP/Correios)
   - ❌ Não (usuário digita tudo)

5. **Foto de perfil obrigatória?**
   - ✅ Não (opcional)
   - ❌ Sim (obrigatória)

---

## 📝 Próximos Passos

1. **Revisar proposta** com o time
2. **Decidir** sobre as questões acima
3. **Criar tasks** no projeto
4. **Implementar** fase por fase
5. **Testar** cada funcionalidade

---

**Data:** Dezembro 2024  
**Versão:** 1.0

