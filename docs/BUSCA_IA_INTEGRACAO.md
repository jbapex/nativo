# Integração de IA para Busca Inteligente

## Visão Geral

O campo de pesquisa foi preparado para futura integração com LLM (Large Language Model) para fornecer uma experiência de busca mais inteligente e intuitiva.

## Estrutura Atual

### Componente: `SearchBar.jsx`
- Campo de pesquisa normal funcional
- Suporte a busca por Enter
- Placeholder indicando futura integração com IA
- Função `processSearchWithAI()` preparada (placeholder)

### Página: `Home.jsx`
- Função `handleSearch()` preparada para integração com IA
- Comentários detalhados sobre como será implementada a integração
- Fallback para busca normal caso a IA falhe

## Como Funcionará a Integração com IA

### 1. Processamento da Query do Usuário

Quando o usuário digitar uma busca, a query será enviada para um endpoint de IA que irá:

```javascript
// Exemplo de chamada futura
const aiResponse = await fetch('/api/ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: "quero um celular barato para minha mãe",
    context: {
      categories: allCategories,
      cityId: selectedCityId,
      userPreferences: user?.preferences
    }
  })
});
```

### 2. Análise da Intenção

A IA irá analisar a query e identificar:
- **Intenção**: O que o usuário realmente quer?
  - Buscar produto específico
  - Buscar categoria
  - Buscar loja
  - Comparar produtos
  
- **Parâmetros Extraídos**:
  - Preço (ex: "barato", "até R$ 500")
  - Características (ex: "para minha mãe" → interface simples, tela grande)
  - Categoria (ex: "celular" → Eletrônicos > Smartphones)
  - Marca (se mencionada)
  - Uso/Contexto (ex: "para presente", "para trabalho")

### 3. Resposta da IA

A API retornará um objeto estruturado:

```json
{
  "intent": {
    "type": "product_search",
    "confidence": 0.95,
    "processedQuery": "smartphone acessível interface simples"
  },
  "extractedParams": {
    "category": "smartphones",
    "priceRange": { "max": 500 },
    "characteristics": ["interface simples", "tela grande"],
    "targetAudience": "idosos"
  },
  "suggestedFilters": {
    "category": "smartphones",
    "priceRange": [0, 500],
    "tags": ["fácil de usar", "tela grande"]
  },
  "suggestions": [
    "Celulares para idosos",
    "Smartphones baratos",
    "Celulares com tela grande"
  ]
}
```

### 4. Aplicação dos Filtros

O sistema aplicará automaticamente os filtros sugeridos pela IA:

```javascript
// Aplicar categoria sugerida
if (suggestedFilters?.category) {
  setCategory(suggestedFilters.category);
}

// Aplicar faixa de preço
if (suggestedFilters?.priceRange) {
  // Atualizar filtros de preço
}

// Usar query processada pela IA
setSearchTerm(intent?.processedQuery || query);
```

## Benefícios da Integração com IA

1. **Busca Natural**: Usuários podem buscar usando linguagem natural
   - "quero um presente para minha mãe"
   - "preciso de algo barato para cozinhar"
   - "celular bom e barato"

2. **Entendimento de Contexto**: A IA entende o contexto da busca
   - "para minha mãe" → interface simples, fácil de usar
   - "para trabalho" → foco em produtividade
   - "para presente" → embalagem, qualidade

3. **Extração Automática de Parâmetros**: Não precisa preencher filtros manualmente
   - "até R$ 300" → aplica filtro de preço automaticamente
   - "vermelho" → filtra por cor
   - "grande" → filtra por tamanho

4. **Sugestões Inteligentes**: Oferece sugestões relevantes baseadas na busca

5. **Personalização**: Considera preferências do usuário e histórico

## Implementação Futura

### Backend: Endpoint de IA

Criar endpoint `/api/ai/search` que:
1. Recebe a query do usuário
2. Envia para serviço de LLM (OpenAI, Anthropic, etc)
3. Processa a resposta
4. Retorna estrutura padronizada

### Exemplo de Implementação Backend

```javascript
// backend/routes/ai.js
router.post('/search', async (req, res) => {
  const { query, context } = req.body;
  
  // Chamar LLM
  const aiResponse = await callLLM({
    prompt: `Analise esta busca de produtos: "${query}"
    Contexto: ${JSON.stringify(context)}
    
    Retorne JSON com:
    - intent: tipo de busca
    - extractedParams: parâmetros extraídos
    - suggestedFilters: filtros sugeridos
    - suggestions: sugestões de busca`
  });
  
  res.json(aiResponse);
});
```

### Frontend: Integração

Descomentar e implementar o código em `Home.jsx` na função `handleSearch()`.

## Notas Importantes

- A busca atual continua funcionando normalmente
- A integração com IA será opcional (pode ser ativada/desativada)
- Fallback automático para busca normal se a IA falhar
- Cache de resultados de IA para melhor performance
- Rate limiting para evitar custos excessivos

## Próximos Passos

1. Escolher provedor de LLM (OpenAI, Anthropic, Google, etc)
2. Criar endpoint backend `/api/ai/search`
3. Implementar processamento de resposta da IA
4. Adicionar indicador visual quando busca usa IA
5. Coletar feedback dos usuários
6. Ajustar prompts e lógica baseado no feedback

