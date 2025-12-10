# Como Adicionar a Coluna show_timer no PostgreSQL

## Problema
A coluna `show_timer` não existe na tabela `promotions` do PostgreSQL e o usuário da aplicação não tem permissão para criá-la automaticamente.

## Solução Temporária
O código foi atualizado para funcionar **mesmo sem a coluna `show_timer`**. A aplicação agora:
1. Verifica se a coluna existe antes de inserir
2. Se não existir, insere a promoção sem a coluna `show_timer`
3. Retorna `show_timer: false` por padrão quando a coluna não existe

## Solução Permanente (Recomendada)
Execute o script SQL como superusuário do PostgreSQL para adicionar a coluna permanentemente:

```bash
# Conecte-se ao PostgreSQL como superusuário (postgres)
psql -U postgres -d local_mart

# Execute o script
\i backend/scripts/adicionar_show_timer_postgres.sql

# Ou execute diretamente:
ALTER TABLE promotions ADD COLUMN show_timer BOOLEAN DEFAULT FALSE;
```

## Verificar se a coluna foi adicionada
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'promotions' AND column_name = 'show_timer';
```

Se retornar uma linha, a coluna existe e está funcionando corretamente.

## Nota
Após adicionar a coluna, a aplicação automaticamente começará a usar ela nas próximas inserções e atualizações.

