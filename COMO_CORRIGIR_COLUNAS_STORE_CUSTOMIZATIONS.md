# Como Corrigir Colunas Faltantes em store_customizations

## Problema
A tabela `store_customizations` no PostgreSQL está faltando várias colunas necessárias, causando erro ao salvar customizações.

## Solução Automática (Recomendada)

1. **Reinicie o servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. O servidor tentará criar as colunas automaticamente ao iniciar. Verifique os logs do console para ver se as colunas foram criadas com sucesso.

## Solução Manual (Se a automática falhar)

Se você ver erros de permissão nos logs, execute manualmente no PostgreSQL:

### Opção 1: Usando pgAdmin

1. Abra o pgAdmin
2. Conecte-se ao banco `local_mart`
3. Clique com botão direito em `store_customizations` → `Scripts` → `CREATE Script`
4. Ou execute diretamente no Query Tool:

```sql
-- Adicionar todas as colunas faltantes
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS footer_color VARCHAR(7) DEFAULT '#f9fafb';
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS banner_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS banners TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS about_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS featured_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS categories_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS contact_section_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS layout_style VARCHAR(50) DEFAULT 'modern';
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_search BOOLEAN DEFAULT TRUE;
ALTER TABLE store_customizations ADD COLUMN IF NOT EXISTS show_categories BOOLEAN DEFAULT TRUE;
```

### Opção 2: Usando psql (Terminal)

```bash
# Conectar ao PostgreSQL
psql -h localhost -p 5433 -U localmart -d local_mart

# Executar os comandos SQL acima
```

### Opção 3: Executar o Script SQL

```bash
# Se você tiver acesso como superusuário
psql -h localhost -p 5433 -U seu_superusuario -d local_mart -f backend/database/fix_store_customizations.sql
```

## Verificar se as Colunas Foram Criadas

Execute no PostgreSQL:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'store_customizations'
ORDER BY ordinal_position;
```

Você deve ver todas as colunas listadas acima.

## Colunas Necessárias

A tabela `store_customizations` deve ter as seguintes colunas:

### Cores
- `primary_color` (VARCHAR(7))
- `secondary_color` (VARCHAR(7))
- `background_color` (VARCHAR(7)) ⚠️ **FALTANDO**
- `text_color` (VARCHAR(7))
- `header_color` (VARCHAR(7))
- `footer_color` (VARCHAR(7)) ⚠️ **FALTANDO**

### Banners
- `banner_image` (TEXT)
- `banner_text` (TEXT)
- `banner_enabled` (BOOLEAN) ⚠️ **FALTANDO**
- `banners` (TEXT) ⚠️ **FALTANDO** - JSON array

### Seções
- `about_section_enabled` (BOOLEAN) ⚠️ **FALTANDO**
- `about_text` (TEXT) ⚠️ **FALTANDO**
- `featured_section_enabled` (BOOLEAN) ⚠️ **FALTANDO**
- `categories_section_enabled` (BOOLEAN) ⚠️ **FALTANDO**
- `contact_section_enabled` (BOOLEAN) ⚠️ **FALTANDO**

### Social
- `instagram_url` (TEXT) ⚠️ **FALTANDO**
- `facebook_url` (TEXT) ⚠️ **FALTANDO**
- `whatsapp_number` (TEXT) ⚠️ **FALTANDO**

### Layout
- `layout_style` (VARCHAR(50)) ⚠️ **FALTANDO**
- `show_search` (BOOLEAN) ⚠️ **FALTANDO**
- `show_categories` (BOOLEAN) ⚠️ **FALTANDO**

### Sistema
- `id` (UUID/TEXT)
- `store_id` (UUID/TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Após Corrigir

1. Reinicie o servidor backend
2. Tente salvar as customizações novamente
3. O erro deve desaparecer

