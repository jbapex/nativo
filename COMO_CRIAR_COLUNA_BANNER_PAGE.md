# Como Criar a Coluna banner_page_image

## Problema
A coluna `banner_page_image` não existe no banco PostgreSQL, então o banner da página da campanha não está sendo salvo.

## Solução

### Opção 1: Via Terminal (Recomendado)

1. Abra o terminal
2. Execute um dos comandos abaixo (substitua `SEU_USUARIO` pelo seu usuário PostgreSQL com permissões de superusuário):

```bash
# Se você souber o caminho do psql
/usr/local/bin/psql -h localhost -p 5433 -U SEU_USUARIO -d local_mart -c "ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;"

# Ou se o psql estiver no PATH
psql -h localhost -p 5433 -U SEU_USUARIO -d local_mart -c "ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;"
```

3. Dar permissões ao usuário localmart:
```bash
psql -h localhost -p 5433 -U SEU_USUARIO -d local_mart -c "GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;"
```

### Opção 2: Via Script SQL

1. Abra o arquivo: `backend/scripts/add_banner_page_image.sql`
2. Copie o conteúdo
3. Execute no seu cliente PostgreSQL (pgAdmin, DBeaver, etc.) como superusuário

### Opção 3: Via pgAdmin ou DBeaver

1. Conecte-se ao banco `local_mart` como superusuário
2. Execute este SQL:

```sql
ALTER TABLE marketplace_campaigns 
ADD COLUMN IF NOT EXISTS banner_page_image TEXT;

GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

## Verificar se foi criada

Execute:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns' 
AND column_name = 'banner_page_image';
```

Se retornar uma linha, a coluna foi criada com sucesso!

## Após criar a coluna

1. Reinicie o servidor backend
2. Tente salvar o banner da página da campanha novamente
3. O valor será salvo corretamente
4. Ao editar, o campo aparecerá preenchido
5. Na página da campanha, o banner será exibido

