# Como Criar a Tabela category_attributes

O usuário `localmart` não tem permissão para criar tabelas no PostgreSQL. Você precisa executar o script SQL com um superusuário.

## Opção 1: Via pgAdmin (Recomendado)

1. Abra o **pgAdmin**
2. Conecte-se ao servidor PostgreSQL
3. Expanda o banco de dados **`local_mart`**
4. Clique com botão direito em **"Query Tool"** (ou pressione `Alt+Shift+Q`)
5. Abra o arquivo `backend/scripts/criar_tabela_category_attributes.sql`
6. Cole o conteúdo no Query Tool
7. Execute o script (pressione `F5` ou clique no botão ▶️)

## Opção 2: Via Terminal (psql)

Se você souber qual é o seu superusuário do PostgreSQL, execute:

```bash
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb
psql -h localhost -p 5433 -U SEU_SUPERUSER -d local_mart -f backend/scripts/criar_tabela_category_attributes.sql
```

Substitua `SEU_SUPERUSER` pelo nome do seu superusuário (geralmente `postgres` ou seu nome de usuário do sistema).

## Opção 3: Via psql Interativo

1. Abra o terminal
2. Execute:
   ```bash
   psql -h localhost -p 5433 -U SEU_SUPERUSER -d local_mart
   ```
3. Cole o conteúdo do arquivo `backend/scripts/criar_tabela_category_attributes.sql`
4. Pressione Enter para executar

## Verificar se Funcionou

Após executar o script, você deve ver uma mensagem de sucesso. Para verificar se a tabela foi criada:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'category_attributes';
```

Se retornar uma linha, a tabela foi criada com sucesso! ✅

## Depois de Criar a Tabela

Após criar a tabela, você pode testar novamente criando um atributo na interface do admin. A tabela já estará disponível e funcionando.

