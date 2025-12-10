# Como Criar as Colunas Faltantes

## Problema
O usuário `localmart` não tem permissão para alterar a tabela `store_customizations`.

## Solução: Usar pgAdmin com Superusuário

### Passo 1: Abrir pgAdmin
1. Abra o **pgAdmin**
2. Conecte-se ao servidor PostgreSQL (porta 5433)

### Passo 2: Executar SQL
1. Clique com botão direito em **Databases** → **local_mart** → **Query Tool**
2. Cole e execute este SQL:

```sql
-- Criar todas as colunas faltantes
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

3. Clique em **Execute** (F5)
4. Verifique se apareceu "SUCCESS" para cada comando

### Passo 3: Verificar
Execute este SQL para ver todas as colunas:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'store_customizations'
ORDER BY column_name;
```

Você deve ver todas as colunas listadas, incluindo `background_color`, `footer_color`, etc.

## Alternativa: Script Node.js com Superusuário

Se preferir usar o terminal, execute:

```bash
node backend/scripts/criar_colunas_com_superuser.js
```

O script pedirá as credenciais do superusuário do PostgreSQL.

## Depois de Criar as Colunas

1. Tente salvar as customizações novamente
2. O erro deve desaparecer ✅

