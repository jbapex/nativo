# 📋 Guia de Migrações do Banco de Dados

Este documento explica como aplicar as migrações de banco de dados necessárias para o sistema Local Mart.

## 📁 Arquivos de Migração

- **`migrations_consolidadas.sql`** - Arquivo SQL consolidado com todas as migrações (PostgreSQL)
- **`aplicar-migracoes.js`** - Script Node.js que aplica migrações automaticamente (suporta SQLite e PostgreSQL)

## 🚀 Como Aplicar as Migrações

### Opção 1: Script Automático (Recomendado)

O script `aplicar-migracoes.js` detecta automaticamente o tipo de banco de dados e aplica as migrações necessárias:

```bash
# Aplicar migrações (detecta automaticamente SQLite ou PostgreSQL)
cd backend
node scripts/aplicar-migracoes.js

# Forçar SQLite
node scripts/aplicar-migracoes.js --sqlite

# Forçar PostgreSQL
node scripts/aplicar-migracoes.js --postgres
```

### Opção 2: SQL Manual (PostgreSQL)

Execute o arquivo SQL consolidado diretamente no PostgreSQL:

```bash
# Via psql
psql -U seu_usuario -d seu_banco -f database/migrations_consolidadas.sql

# Via pgAdmin
# 1. Abra o pgAdmin
# 2. Conecte-se ao banco de dados
# 3. Abra o Query Tool
# 4. Cole o conteúdo de migrations_consolidadas.sql
# 5. Execute (F5)
```

### Opção 3: SQL Manual (SQLite)

Para SQLite, você precisa executar os comandos SQLite separadamente (veja comentários no arquivo `migrations_consolidadas.sql`):

```bash
sqlite3 seu_banco.db < migrations_consolidadas_sqlite.sql
```

Ou execute manualmente via linha de comando:

```bash
sqlite3 seu_banco.db
```

Depois execute os comandos SQLite indicados nos comentários do arquivo.

## 📝 O que as Migrações Fazem

### 1. Tabela `promotions`
- ✅ Adiciona coluna `show_timer` (BOOLEAN) - Controla se o temporizador de oferta é exibido
- ✅ Adiciona coluna `applies_to` (VARCHAR) - Define onde a promoção é válida: `'store'`, `'marketplace'` ou `'both'`

### 2. Tabela `store_customizations`
- ✅ Adiciona colunas de personalização visual (cores, banners, seções)
- ✅ Adiciona colunas de redes sociais (Instagram, Facebook, WhatsApp)
- ✅ Adiciona colunas de layout (estilo, busca, categorias)

### 3. Tabela `category_attributes` (Nova)
- ✅ Cria tabela para atributos de categorias
- ✅ Suporta filtros e especificações de produtos
- ✅ Índices para performance

### 4. Tabelas de Campanhas (Novas)
- ✅ `marketplace_campaigns` - Campanhas promocionais do marketplace
- ✅ `campaign_participations` - Participações de lojistas em campanhas
- ✅ Coluna `banner_page_image` na tabela `marketplace_campaigns`

## ⚠️ Requisitos

### PostgreSQL
- Usuário com permissões de **superusuário** ou **ALTER TABLE**
- Banco de dados já criado
- Tabelas base existentes (`stores`, `categories`, `products`, etc.)

### SQLite
- Acesso de escrita ao arquivo do banco de dados
- Tabelas base existentes

## 🔍 Verificação

Após executar as migrações, verifique se foram aplicadas corretamente:

### PostgreSQL
```sql
-- Verificar colunas da tabela promotions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'promotions' 
AND column_name IN ('show_timer', 'applies_to');

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('category_attributes', 'marketplace_campaigns', 'campaign_participations');
```

### SQLite
```sql
-- Verificar colunas da tabela promotions
PRAGMA table_info(promotions);

-- Verificar tabelas criadas
SELECT name FROM sqlite_master 
WHERE type='table' 
AND name IN ('category_attributes', 'marketplace_campaigns', 'campaign_participations');
```

## 🐛 Solução de Problemas

### Erro: "must be owner of table"
**Causa:** Usuário não tem permissões suficientes no PostgreSQL.

**Solução:**
1. Execute como superusuário (postgres)
2. Ou conceda permissões:
```sql
GRANT ALL PRIVILEGES ON TABLE promotions TO seu_usuario;
GRANT ALL PRIVILEGES ON TABLE store_customizations TO seu_usuario;
```

### Erro: "column already exists"
**Causa:** A migração já foi executada anteriormente.

**Solução:** Este erro é seguro de ignorar. As migrações verificam se as colunas já existem antes de criar.

### Erro: "table does not exist"
**Causa:** Tabelas base não foram criadas.

**Solução:** Execute o schema completo do banco de dados primeiro (`schema.sql` ou `postgres-schema.sql`).

## 📚 Estrutura das Migrações

```
backend/database/
├── migrations_consolidadas.sql    # SQL consolidado (PostgreSQL)
├── MIGRACOES_README.md            # Este arquivo
└── aplicar-migracoes.js          # Script automático (Node.js)

backend/scripts/
├── adicionar_show_timer_definitivo.sql
├── adicionar_applies_to_promotions.sql
└── ... (outros scripts individuais)
```

## ✅ Checklist de Migração

- [ ] Backup do banco de dados criado
- [ ] Migrações executadas (script automático ou SQL manual)
- [ ] Verificações executadas (colunas e tabelas criadas)
- [ ] Aplicação testada (criar promoção, configurar loja, etc.)
- [ ] Logs verificados (sem erros relacionados ao banco)

## 🔄 Rollback

Se precisar reverter as migrações (não recomendado em produção):

```sql
-- PostgreSQL
ALTER TABLE promotions DROP COLUMN IF EXISTS show_timer;
ALTER TABLE promotions DROP COLUMN IF EXISTS applies_to;
-- ... (outras reversões)

-- SQLite
-- SQLite não suporta DROP COLUMN diretamente
-- Será necessário recriar a tabela sem as colunas
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do backend
2. Verifique as permissões do banco de dados
3. Consulte a documentação do PostgreSQL/SQLite
4. Verifique se todas as dependências estão instaladas

---

**Última atualização:** 2024  
**Versão:** 1.0.0
