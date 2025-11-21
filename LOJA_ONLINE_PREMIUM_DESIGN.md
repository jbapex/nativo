# 🎨 Design da Loja Online Premium - Proposta

## 📋 Visão Geral

Criar uma **Loja Online Premium** como upgrade para lojistas, com personalização completa de cores, layout e funcionalidades avançadas.

---

## 🎯 Diferenças: Vitrine Básica vs Loja Online Premium

### **Vitrine Básica (Atual - StoreFront)**
- Layout padrão do sistema
- Cores fixas (azul/cyan)
- Funcionalidades básicas
- Sem personalização

### **Loja Online Premium (Nova)**
- ✅ Layout totalmente personalizável
- ✅ Cores customizadas (tema da loja)
- ✅ Banner/hero personalizado
- ✅ Seções editáveis
- ✅ Domínio personalizado (futuro)
- ✅ Analytics avançado
- ✅ SEO otimizado

---

## 🎨 Funcionalidades de Personalização

### 1. **Editor de Cores**
```
- Cor primária (botões, links, destaques)
- Cor secundária (acessórios, badges)
- Cor de fundo (background)
- Cor do texto
- Cor do header/footer
- Preview em tempo real
```

### 2. **Layout e Seções**
```
- Banner/Hero personalizado (imagem + texto)
- Seção "Sobre a Loja"
- Seção "Destaques" (produtos em destaque)
- Seção "Categorias"
- Seção "Depoimentos" (futuro)
- Seção "Contato/WhatsApp"
- Footer personalizado
```

### 3. **Configurações da Loja**
```
- Logo da loja
- Banner/Imagem de capa
- Descrição da loja
- Texto de boas-vindas
- Links sociais (Instagram, Facebook, etc)
- WhatsApp para contato
- Endereço (se tiver loja física)
```

---

## 🗂️ Estrutura de Dados

### Nova Tabela: `store_customizations`
```sql
CREATE TABLE store_customizations (
    id TEXT PRIMARY KEY,
    store_id TEXT UNIQUE NOT NULL,
    
    -- Cores
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#06b6d4',
    background_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#1f2937',
    header_color TEXT DEFAULT '#ffffff',
    footer_color TEXT DEFAULT '#f9fafb',
    
    -- Layout
    banner_image TEXT,
    banner_text TEXT,
    banner_enabled BOOLEAN DEFAULT 1,
    
    -- Seções
    about_section_enabled BOOLEAN DEFAULT 1,
    about_text TEXT,
    
    featured_section_enabled BOOLEAN DEFAULT 1,
    categories_section_enabled BOOLEAN DEFAULT 1,
    contact_section_enabled BOOLEAN DEFAULT 1,
    
    -- Social
    instagram_url TEXT,
    facebook_url TEXT,
    whatsapp_number TEXT,
    
    -- Configurações
    layout_style TEXT DEFAULT 'modern', -- 'modern', 'classic', 'minimal'
    show_search BOOLEAN DEFAULT 1,
    show_categories BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

---

## 📱 Páginas e Componentes

### 1. **Nova Rota: `/StoreOnline/:id`**
- Loja online premium personalizada
- Carrega customizações da loja
- Aplica cores e layout customizados

### 2. **Editor de Personalização: `/StoreProfile` → Nova Aba "Loja Online"**
- Editor visual de cores (color picker)
- Upload de banner
- Editor de texto para seções
- Preview em tempo real
- Salvar/Publicar

### 3. **Componentes Reutilizáveis**
```
- StoreOnlineHeader (com cores customizadas)
- StoreOnlineBanner (banner personalizado)
- StoreOnlineAbout (seção sobre)
- StoreOnlineProducts (grid de produtos com tema)
- StoreOnlineContact (contato/whatsapp)
- StoreOnlineFooter (footer personalizado)
```

---

## 🎨 Exemplos de Layouts

### Layout "Modern"
- Header fixo com logo
- Banner grande com imagem de fundo
- Grid de produtos em cards modernos
- Footer com redes sociais

### Layout "Classic"
- Header tradicional
- Banner médio
- Lista de produtos em tabela
- Footer simples

### Layout "Minimal"
- Header minimalista
- Sem banner
- Grid limpo de produtos
- Footer discreto

---

## 💰 Plano Premium

### Adicionar ao banco:
```sql
-- Plano "Enterprise" ou "Premium"
INSERT INTO plans (id, name, price, product_limit, features, active)
VALUES (
    'plan-enterprise',
    'Enterprise',
    199.90,
    NULL, -- Ilimitado
    '["Produtos ilimitados", "Loja Online Premium", "Personalização completa", "Analytics avançado", "Suporte prioritário"]',
    1
);
```

### Features do Plano:
- ✅ Loja Online Premium
- ✅ Personalização de cores
- ✅ Banner personalizado
- ✅ Seções editáveis
- ✅ Analytics avançado
- ✅ Produtos ilimitados
- ✅ Suporte prioritário

---

## 🚀 Fluxo de Uso

### Para o Lojista:
1. Fazer upgrade para plano Enterprise/Premium
2. Acessar `/StoreProfile` → Aba "Loja Online"
3. Personalizar cores, banner, seções
4. Salvar e publicar
5. Compartilhar link da loja online premium

### Para o Cliente:
1. Acessar link da loja online premium
2. Ver loja com tema personalizado
3. Navegar produtos
4. Contatar via WhatsApp
5. Comprar produtos

---

## 📝 Checklist de Implementação

### Fase 1: Backend
- [ ] Criar tabela `store_customizations`
- [ ] Criar rotas API para CRUD de customizações
- [ ] Adicionar plano Enterprise ao seed
- [ ] Middleware para verificar plano premium

### Fase 2: Frontend - Editor
- [ ] Criar componente `StoreOnlineEditor`
- [ ] Color picker para cores
- [ ] Upload de banner
- [ ] Editor de texto para seções
- [ ] Preview em tempo real
- [ ] Salvar customizações

### Fase 3: Frontend - Loja Online
- [ ] Criar rota `/StoreOnline/:id`
- [ ] Carregar customizações
- [ ] Aplicar tema customizado
- [ ] Componentes com cores dinâmicas
- [ ] Layout responsivo

### Fase 4: Melhorias
- [ ] Analytics da loja online
- [ ] SEO otimizado
- [ ] Domínio personalizado (futuro)
- [ ] Templates pré-definidos

---

## ❓ Perguntas para Decidir Juntos

1. **Cores**: Quantas cores permitir personalizar? (Sugestão: 5-6 cores principais)
2. **Banner**: Permitir apenas imagem ou também vídeo? (Sugestão: começar com imagem)
3. **Layouts**: Quantos templates de layout? (Sugestão: 3 - Modern, Classic, Minimal)
4. **Seções**: Quais seções são obrigatórias? (Sugestão: Produtos sempre, outras opcionais)
5. **Plano**: Criar novo plano "Enterprise" ou adicionar ao "Premium"? (Sugestão: Enterprise)
6. **Preço**: Qual valor do plano? (Sugestão: R$ 199,90/mês)
7. **Preview**: Preview na mesma página ou modal? (Sugestão: mesma página com split view)

---

## 🎨 Mockup Visual (Descrição)

```
┌─────────────────────────────────────────┐
│  [LOGO]  Loja Premium  [Menu] [WhatsApp]│ ← Header (cor customizada)
├─────────────────────────────────────────┤
│                                         │
│     [BANNER GRANDE COM IMAGEM]          │ ← Banner personalizado
│     Texto de boas-vindas customizado   │
│                                         │
├─────────────────────────────────────────┤
│  🔍 Buscar produtos...  [Filtros]      │
├─────────────────────────────────────────┤
│                                         │
│  [Produto 1]  [Produto 2]  [Produto 3] │ ← Grid de produtos
│                                         │
│  [Produto 4]  [Produto 5]  [Produto 6] │
│                                         │
├─────────────────────────────────────────┤
│  📱 Sobre a Loja                        │ ← Seção "Sobre"
│  Texto personalizado...              │
│                                         │
├─────────────────────────────────────────┤
│  📞 Contato | 📷 Instagram | 💬 WhatsApp│ ← Footer (cor customizada)
└─────────────────────────────────────────┘
```

---

## 💡 Próximos Passos

1. **Revisar esta proposta juntos**
2. **Definir funcionalidades prioritárias**
3. **Escolher cores e layouts**
4. **Decidir sobre o plano/preço**
5. **Começar implementação**

---

**O que você acha dessa proposta? Quer ajustar algo antes de começarmos a implementar?** 🚀

