# Solução Rápida - Criar Colunas Faltantes

## O Problema
A tabela `store_customizations` no PostgreSQL está faltando a coluna `background_color` (e outras).

## Solução Imediata

### Opção 1: Executar SQL no pgAdmin (Mais Fácil)

1. Abra o **pgAdmin**
2. Conecte-se ao banco `local_mart`
3. Clique com botão direito em `store_customizations` → **Query Tool**
4. Cole e execute este SQL:

```sql
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

5. Clique em **Execute** (F5)
6. Verifique se apareceu "SUCCESS" para cada comando
7. Tente salvar as customizações novamente

### Opção 2: Executar via Terminal

```bash
psql -h localhost -p 5433 -U localmart -d local_mart -f EXECUTAR_AGORA.sql
```

### Opção 3: Copiar e Colar no Terminal psql

```bash
psql -h localhost -p 5433 -U localmart -d local_mart
```

Depois cole os comandos ALTER TABLE acima.

## Verificar se Funcionou

Execute este SQL para ver todas as colunas:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'store_customizations'
ORDER BY column_name;
```

Você deve ver `background_color`, `footer_color`, `banner_enabled`, etc. na lista.

## Depois de Criar as Colunas

1. Reinicie o servidor backend (se estiver rodando)
2. Tente salvar as customizações novamente
3. O erro deve desaparecer

