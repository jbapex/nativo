# 🎯 PASSO A PASSO SUPER SIMPLES

## ✅ Método Mais Fácil: Usando pgAdmin (Você já tem instalado!)

### 📍 Passo 1: Abrir o pgAdmin
1. Pressione `Cmd + Espaço` (Spotlight)
2. Digite: **pgAdmin**
3. Pressione Enter

### 📍 Passo 2: Conectar ao Servidor
1. No pgAdmin, você verá "Servers" no lado esquerdo
2. **Clique** no servidor (ou crie um novo se necessário)
3. Se pedir senha, digite a senha do PostgreSQL

### 📍 Passo 3: Abrir o Banco de Dados
1. **Expanda** o servidor (clique na setinha)
2. **Expanda** "Databases"
3. **Clique com botão direito** em **"local_mart"**
4. **Clique** em **"Query Tool"** (ou "Ferramenta de Consulta")

### 📍 Passo 4: Executar o SQL
1. Uma janela de query vai abrir
2. **Cole este código** na janela:

```sql
ALTER TABLE marketplace_campaigns 
ADD COLUMN IF NOT EXISTS banner_page_image TEXT;

GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

3. **Clique no botão "Execute"** (ou pressione **F5**)

### 📍 Passo 5: Verificar
Você deve ver mensagens de sucesso:
- ✅ "ALTER TABLE"
- ✅ "GRANT"

### 📍 Passo 6: Pronto!
A coluna foi criada! Agora:
1. **Reinicie o servidor backend**
2. **Tente salvar o banner da página da campanha novamente**
3. O campo deve aparecer preenchido quando você editar!

---

## 🔄 Alternativa: SQL Shell (Terminal do PostgreSQL)

Se preferir usar o terminal:

### Passo 1: Abrir SQL Shell
1. Pressione `Cmd + Espaço`
2. Digite: **SQL Shell**
3. Pressione Enter

### Passo 2: Conectar
1. Quando abrir, pressione **Enter** para cada pergunta (usa valores padrão)
2. Ou digite:
   - Server: `localhost`
   - Database: `local_mart`
   - Port: `5433`
   - Username: `josiasbonfimdefaria`
   - Password: (sua senha)

### Passo 3: Executar SQL
Quando conectar, você verá: `local_mart=#`

Digite e pressione Enter:

```sql
ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;
```

Depois:

```sql
GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

Para sair, digite: `\q`

---

## 📝 Resumo dos Comandos SQL

Copie e cole estes comandos:

```sql
ALTER TABLE marketplace_campaigns 
ADD COLUMN IF NOT EXISTS banner_page_image TEXT;

GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

---

## ✅ Depois de Executar

1. Reinicie o servidor backend
2. Vá em Admin > Campanhas
3. Edite uma campanha
4. Adicione o "Banner da Página da Campanha"
5. Salve
6. Edite novamente - o campo deve aparecer preenchido! 🎉

