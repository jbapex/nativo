# Como Descobrir o Superusuário do PostgreSQL

## Método 1: Verificar no pgAdmin (Mais Fácil)

1. Abra o **pgAdmin**
2. Expanda: **Servidores** → **PostgreSQL** (ou o nome do seu servidor)
3. Clique com botão direito → **Propriedades**
4. Na aba **Connection**, veja o campo **Username**
5. Esse é o usuário que você usa para conectar

**OU**

1. No pgAdmin, vá em: **Servidores** → **PostgreSQL** → **Login/Group Roles**
2. Procure por usuários com ícone de "superusuário" (geralmente um ícone especial)
3. Os superusuários mais comuns são:
   - `postgres` (padrão)
   - Seu nome de usuário do sistema (ex: `josiasbonfimdefaria`)

## Método 2: Verificar no Terminal (se tiver psql)

```bash
psql -h localhost -p 5433 -U localmart -d local_mart -c "\du"
```

Isso listará todos os usuários e mostrará quais são superusuários.

## Método 3: Tentar os Mais Comuns

Tente executar o script com estes usuários (um de cada vez):

### Tentativa 1: postgres (mais comum)
```bash
cd /Users/josiasbonfimdefaria/Downloads/local-mart-4ffccbdb
SUPERUSER=postgres SUPERPASSWORD=sua_senha node backend/scripts/criar_colunas_env.js
```

### Tentativa 2: Seu nome de usuário do sistema
```bash
SUPERUSER=josiasbonfimdefaria SUPERPASSWORD=sua_senha node backend/scripts/criar_colunas_env.js
```

## Método 4: Verificar no Arquivo de Configuração

Se você instalou o PostgreSQL localmente, verifique:
- Arquivo de configuração do PostgreSQL
- Documentação da instalação
- Senha que você definiu durante a instalação

## Dica

Se você não souber a senha também, tente:
- Senha vazia (sem SUPERPASSWORD)
- `postgres`
- `admin`
- `123456`
- A mesma senha que você usa para o usuário `localmart`

## Exemplo Completo

```bash
# Tentar com postgres
SUPERUSER=postgres SUPERPASSWORD=postgres node backend/scripts/criar_colunas_env.js

# Se não funcionar, tentar com seu nome de usuário
SUPERUSER=josiasbonfimdefaria SUPERPASSWORD= node backend/scripts/criar_colunas_env.js
```

