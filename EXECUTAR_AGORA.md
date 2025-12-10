# 🚀 EXECUTE AGORA - Passo a Passo Simples

## ⚡ Método Mais Fácil: Via Interface Gráfica

### Se você tem pgAdmin, TablePlus ou DBeaver instalado:

1. **Abra o aplicativo** (pgAdmin, TablePlus, DBeaver, etc.)

2. **Conecte ao banco:**
   - Host: `localhost`
   - Porta: `5433`
   - Database: `local_mart`
   - Usuário: `josiasbonfimdefaria` (ou outro superusuário)
   - Senha: (sua senha do PostgreSQL)

3. **Abra o Editor de Query** (geralmente um botão "Query" ou "SQL Editor")

4. **Cole este código e execute:**

```sql
ALTER TABLE marketplace_campaigns 
ADD COLUMN IF NOT EXISTS banner_page_image TEXT;

GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

5. **Pronto!** A coluna foi criada.

---

## 💻 Método via Terminal (se tiver psql)

### Passo 1: Abra o Terminal
- Pressione `Cmd + Espaço`
- Digite "Terminal"
- Pressione Enter

### Passo 2: Execute este comando (substitua SEU_USUARIO pelo seu usuário PostgreSQL):

```bash
psql -h localhost -p 5433 -U josiasbonfimdefaria -d local_mart
```

**OU se pedir senha, use:**

```bash
PGPASSWORD=sua_senha psql -h localhost -p 5433 -U josiasbonfimdefaria -d local_mart
```

### Passo 3: Quando conectar, você verá algo como: `local_mart=#`

### Passo 4: Digite e pressione Enter após cada comando:

```sql
ALTER TABLE marketplace_campaigns ADD COLUMN IF NOT EXISTS banner_page_image TEXT;
```

```sql
GRANT ALL PRIVILEGES ON COLUMN marketplace_campaigns.banner_page_image TO localmart;
```

```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'marketplace_campaigns' AND column_name = 'banner_page_image';
```

### Passo 5: Para sair, digite: `\q` e pressione Enter

---

## ✅ Verificar se Funcionou

Após executar, reinicie o servidor backend e tente salvar o banner da página da campanha novamente. O campo deve aparecer preenchido quando você editar a campanha!

