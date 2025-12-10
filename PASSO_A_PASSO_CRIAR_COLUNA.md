# 📋 Passo a Passo: Criar Coluna banner_page_image

## Método 1: Usando Terminal (Mais Rápido)

### Passo 1: Abrir o Terminal
- No Mac: Pressione `Cmd + Espaço`, digite "Terminal" e pressione Enter
- Ou vá em: Aplicações > Utilitários > Terminal

### Passo 2: Encontrar o psql
Execute este comando para encontrar onde o PostgreSQL está instalado:

```bash
which psql
```

Ou tente:

```bash
find /usr -name psql 2>/dev/null
find /usr/local -name psql 2>/dev/null
```

### Passo 3: Executar o Comando SQL

**Opção A - Se o psql estiver no PATH:**
```bash
psql -h localhost -p 5433 -U josiasbonfimdefaria -d local_mart
```

**Opção B - Se encontrar o caminho completo (exemplo):**
```bash
/usr/local/bin/psql -h localhost -p 5433 -U josiasbonfimdefaria -d local_mart
```

**Opção C - Se usar o usuário postgres:**
```bash
psql -h localhost -p 5433 -U postgres -d local_mart
```

### Passo 4: Quando conectar, execute os comandos SQL:

```sql
ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;
```

```sql
GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns' 
AND column_name = 'banner_page_image';
```

### Passo 5: Sair do psql
Digite: `\q` e pressione Enter

---

## Método 2: Usando pgAdmin (Interface Gráfica)

### Passo 1: Abrir pgAdmin
- Abra o aplicativo pgAdmin no seu Mac

### Passo 2: Conectar ao Servidor
- Clique com botão direito em "Servers" > "Create" > "Server"
- Ou se já tiver servidor configurado, clique nele para conectar

### Passo 3: Conectar ao Banco
- Expanda o servidor
- Expanda "Databases"
- Clique com botão direito em "local_mart" > "Query Tool"

### Passo 4: Executar o SQL
Cole este código na janela de query:

```sql
ALTER TABLE marketplace_campaigns 
ADD COLUMN IF NOT EXISTS banner_page_image TEXT;

GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

### Passo 5: Executar
- Clique no botão "Execute" (ou pressione F5)
- Você deve ver: "ALTER TABLE" e "GRANT" com sucesso

### Passo 6: Verificar
Execute esta query para verificar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns' 
AND column_name = 'banner_page_image';
```

Deve retornar uma linha com os dados da coluna.

---

## Método 3: Usando TablePlus ou DBeaver

### Passo 1: Abrir o aplicativo
- Abra TablePlus, DBeaver ou outro cliente PostgreSQL

### Passo 2: Conectar ao banco
- Crie uma nova conexão ou use uma existente
- Host: `localhost`
- Porta: `5433`
- Database: `local_mart`
- Usuário: `josiasbonfimdefaria` (ou outro superusuário)
- Senha: (sua senha)

### Passo 3: Abrir Query Editor
- Clique em "New Query" ou "Query Editor"

### Passo 4: Executar o SQL
Cole e execute:

```sql
ALTER TABLE marketplace_campaigns 
ADD COLUMN IF NOT EXISTS banner_page_image TEXT;

GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

### Passo 5: Verificar
Execute:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_campaigns' 
AND column_name = 'banner_page_image';
```

---

## ✅ Após Criar a Coluna

1. **Reinicie o servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Teste salvando uma campanha:**
   - Vá em Admin > Campanhas
   - Edite uma campanha
   - Adicione o "Banner da Página da Campanha"
   - Salve
   - Edite novamente - o campo deve aparecer preenchido!

3. **Verifique na página da campanha:**
   - Acesse a página da campanha
   - O banner da página deve aparecer no topo

---

## ❓ Problemas Comuns

**Erro: "must be owner of table"**
- Você precisa usar um superusuário (não o usuário `localmart`)
- Tente com `josiasbonfimdefaria` ou `postgres`

**Erro: "psql: command not found"**
- O PostgreSQL não está no PATH
- Use pgAdmin ou outro cliente gráfico (Método 2 ou 3)

**Erro: "password authentication failed"**
- Verifique se a senha está correta
- Ou use um usuário diferente

