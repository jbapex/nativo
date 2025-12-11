#!/bin/bash
# Script de Atualização Automática para VPS
# Local Mart - Sistema de Marketplace

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações - NATIVO.CONTAAE.ONLINE
PROJECT_DIR="/root/nativo"              # Caminho do projeto
DB_TYPE="sqlite"                         # Tipo de banco: sqlite ou postgres
DB_PATH="/root/nativo/backend/database.sqlite"  # Caminho do banco SQLite
DB_USER=""                               # Não usado para SQLite
DB_NAME=""                               # Não usado para SQLite
BACKUP_DIR="$PROJECT_DIR/backups"        # Diretório de backups

echo -e "${GREEN}🔄 Iniciando atualização do sistema Local Mart...${NC}\n"

# Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

# 1. Backup do banco de dados
echo -e "${YELLOW}📦 Passo 1/6: Fazendo backup do banco de dados...${NC}"

# Verificar tipo de banco e fazer backup
if [ "$DB_TYPE" = "sqlite" ]; then
    # SQLite - backup do arquivo
    if [ -f "$DB_PATH" ]; then
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).db"
        cp "$DB_PATH" "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backup SQLite criado: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Arquivo do banco SQLite não encontrado em: $DB_PATH${NC}"
        read -p "Continuar mesmo assim? (s/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            exit 1
        fi
    fi
elif [ "$DB_TYPE" = "postgres" ]; then
    # PostgreSQL
    if command -v pg_dump &> /dev/null; then
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
        pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backup PostgreSQL criado: $BACKUP_FILE${NC}"
    else
        echo -e "${RED}❌ pg_dump não encontrado. Instale o PostgreSQL client.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Tipo de banco não configurado corretamente (DB_TYPE=$DB_TYPE)${NC}"
    read -p "Continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# 2. Atualizar código do repositório
echo -e "\n${YELLOW}📥 Passo 2/6: Atualizando código do repositório...${NC}"
cd "$PROJECT_DIR"

# Verificar se é um repositório Git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Erro: Diretório não é um repositório Git${NC}"
    exit 1
fi

# Verificar mudanças locais
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Há mudanças locais não commitadas${NC}"
    git status
    read -p "Deseja descartar as mudanças locais? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git reset --hard HEAD
        git clean -fd
    else
        echo -e "${RED}❌ Atualização cancelada${NC}"
        exit 1
    fi
fi

# Fazer pull
git fetch origin
git pull origin main
echo -e "${GREEN}✅ Código atualizado${NC}"

# 3. Instalar dependências
echo -e "\n${YELLOW}📦 Passo 3/6: Instalando dependências...${NC}"
npm install
if [ -d "backend" ]; then
    cd backend
    npm install
    cd ..
fi
echo -e "${GREEN}✅ Dependências instaladas${NC}"

# 4. Aplicar migrações do banco de dados
echo -e "\n${YELLOW}🗄️  Passo 4/6: Aplicando migrações do banco de dados...${NC}"
if [ -f "backend/scripts/aplicar-migracoes.js" ]; then
    cd backend
    node scripts/aplicar-migracoes.js
    cd ..
    echo -e "${GREEN}✅ Migrações aplicadas${NC}"
else
    echo -e "${YELLOW}⚠️  Script de migrações não encontrado. Pulando...${NC}"
fi

# 5. Reiniciar serviços
echo -e "\n${YELLOW}🔄 Passo 5/6: Reiniciando serviços...${NC}"

# Verificar se PM2 está instalado
if command -v pm2 &> /dev/null; then
    pm2 restart all || pm2 start ecosystem.config.js || echo -e "${YELLOW}⚠️  PM2 não conseguiu reiniciar. Verifique manualmente.${NC}"
    echo -e "${GREEN}✅ Serviços reiniciados via PM2${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 não encontrado. Reinicie os serviços manualmente.${NC}"
    echo "   Execute: npm run dev (ou seus comandos de inicialização)"
fi

# 6. Verificar status
echo -e "\n${YELLOW}🔍 Passo 6/6: Verificando status...${NC}"
sleep 3

# Verificar backend
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend respondendo corretamente${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo${NC}"
fi

# Verificar PM2
if command -v pm2 &> /dev/null; then
    echo -e "\n${YELLOW}Status dos processos PM2:${NC}"
    pm2 status
fi

# Resumo
echo -e "\n${GREEN}✨ Atualização concluída!${NC}\n"
echo -e "📊 Resumo:"
echo -e "  ✅ Backup criado"
echo -e "  ✅ Código atualizado"
echo -e "  ✅ Dependências instaladas"
echo -e "  ✅ Migrações aplicadas"
echo -e "  ✅ Serviços reiniciados"
echo -e "\n${YELLOW}💡 Dica: Verifique os logs com 'pm2 logs' ou 'tail -f backend/logs/combined.log'${NC}\n"

