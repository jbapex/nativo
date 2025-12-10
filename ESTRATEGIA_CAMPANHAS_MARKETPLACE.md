# Estratégia de Campanhas de Marketplace

## 📊 Visão Geral

Sistema de campanhas de marketplace permite que o administrador crie campanhas promocionais (Black Friday, Oferta Relâmpago, etc.) onde lojistas podem participar voluntariamente, aumentando o engajamento e as vendas de toda a plataforma.

## 🎯 Benefícios

### Para o Marketplace (Você):
- ✅ **Aumenta o tráfego**: Campanhas atraem mais visitantes
- ✅ **Engajamento**: Lojistas participam ativamente
- ✅ **Diferenciação**: Marketplace se destaca com campanhas exclusivas
- ✅ **Receita**: Pode cobrar taxa de participação (opcional)
- ✅ **Marketing**: Gera buzz e compartilhamento nas redes sociais

### Para os Lojistas:
- ✅ **Visibilidade**: Produtos aparecem em destaque durante campanhas
- ✅ **Vendas**: Aumento de conversões durante períodos promocionais
- ✅ **Facilidade**: Sistema gerencia tudo automaticamente
- ✅ **Flexibilidade**: Escolhem quais produtos participar

### Para os Clientes:
- ✅ **Ofertas**: Acesso a descontos exclusivos
- ✅ **Variedade**: Múltiplas lojas com ofertas
- ✅ **Urgência**: Sensação de oportunidade única

## 🏗️ Estrutura Proposta

### 1. **Campanhas do Marketplace** (Criadas pelo Admin)
- Black Friday
- Oferta Relâmpago
- Dia das Mães
- Natal
- Volta às Aulas
- etc.

### 2. **Regras de Participação**
- Desconto mínimo obrigatório (ex: mínimo 10% off)
- Categorias permitidas
- Limite de produtos por loja
- Data de início e fim
- Aprovação automática ou manual

### 3. **Inscrição dos Lojistas**
- Lojista vê campanhas disponíveis
- Escolhe produtos para participar
- Define desconto (respeitando mínimo)
- Sistema valida e aprova

### 4. **Exibição**
- Banner da campanha no Home
- Seção especial "Campanhas Ativas"
- Badge nos produtos participantes
- Filtro "Em Promoção"
- Contador regressivo

## 💡 Como Funcionaria

### Fluxo do Admin:
1. Criar campanha (nome, datas, regras)
2. Definir desconto mínimo
3. Escolher categorias (opcional)
4. Ativar campanha
5. Monitorar participações

### Fluxo do Lojista:
1. Ver campanhas disponíveis no dashboard
2. Clicar em "Participar"
3. Selecionar produtos
4. Definir desconto (≥ mínimo)
5. Confirmar participação
6. Produtos aparecem automaticamente na campanha

### Fluxo do Cliente:
1. Vê banner da campanha no Home
2. Clica e vê produtos em promoção
3. Filtra por categoria/loja
4. Compra com desconto aplicado

## 🚀 Implementação Sugerida

### Fase 1: Estrutura Básica
- Tabela `marketplace_campaigns` (campanhas do marketplace)
- Tabela `campaign_participations` (lojistas participantes)
- Interface admin para criar campanhas
- Interface lojista para participar

### Fase 2: Funcionalidades
- Validação automática de descontos
- Badges e destaques visuais
- Seção dedicada no Home
- Relatórios de performance

### Fase 3: Avançado
- Taxa de participação (opcional)
- Campanhas por categoria
- Campanhas exclusivas (apenas lojas premium)
- Sistema de pontos/recompensas

## 📈 Métricas de Sucesso

- Número de lojistas participantes
- Produtos em promoção
- Vendas durante campanha
- Aumento de tráfego
- Taxa de conversão

## ⚠️ Considerações

1. **Validação**: Garantir que descontos sejam reais
2. **Performance**: Sistema deve suportar muitas campanhas simultâneas
3. **Comunicação**: Notificar lojistas sobre novas campanhas
4. **Transparência**: Lojistas devem ver regras claras

