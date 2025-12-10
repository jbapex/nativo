# Como Executar no Terminal Local

## Opção 1: Usando Variáveis de Ambiente (Recomendado)

Execute o comando substituindo `seu_superuser` e `sua_senha` pelas credenciais do superusuário do PostgreSQL:

```bash
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb
SUPERUSER=seu_superuser SUPERPASSWORD=sua_senha node backend/scripts/criar_colunas_env.js
```

**Exemplo:**
```bash
SUPERUSER=postgres SUPERPASSWORD=minhasenha123 node backend/scripts/criar_colunas_env.js
```

## Opção 2: Exportar Variáveis Primeiro

```bash
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb
export SUPERUSER=seu_superuser
export SUPERPASSWORD=sua_senha
node backend/scripts/criar_colunas_env.js
```

## Opção 3: Script Interativo (Pede Credenciais)

```bash
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb
node backend/scripts/criar_colunas_com_superuser.js
```

O script pedirá:
- Nome do superusuário (ou Enter para usar "postgres")
- Senha do superusuário

## Qual Superusuário Usar?

Se você não souber qual é o superusuário, tente:

1. **postgres** (padrão do PostgreSQL)
2. Seu nome de usuário do sistema (no macOS, geralmente seu nome de usuário)
3. Verifique no pgAdmin: Servidores → PostgreSQL → Propriedades → Role

## Depois de Executar

1. O script criará todas as colunas faltantes
2. Concederá permissões ao usuário `localmart`
3. Mostrará um resumo do que foi feito
4. Tente salvar as customizações novamente - o erro deve desaparecer! ✅

