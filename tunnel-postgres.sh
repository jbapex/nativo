#!/bin/bash

# Script para criar túnel SSH para PostgreSQL da VPS
# Uso: ./tunnel-postgres.sh

# Configurações (ajustar conforme necessário)
VPS_USER="root"
VPS_HOST="nativo.jbapex.com.br"
LOCAL_PORT=5433
REMOTE_PORT=5432

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔌 Criando túnel SSH para PostgreSQL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📍 Configuração:${NC}"
echo "   VPS: ${VPS_USER}@${VPS_HOST}"
echo "   Porta Local: ${LOCAL_PORT}"
echo "   Porta Remota: ${REMOTE_PORT}"
echo ""
echo -e "${YELLOW}📝 Para usar no .env:${NC}"
echo "   DB_HOST=localhost"
echo "   DB_PORT=${LOCAL_PORT}"
echo "   DB_NAME=nativo_db"
echo "   DB_USER=nativo_user"
echo "   DB_PASSWORD=Nativo2025SecureDB"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   • Deixe este terminal aberto enquanto desenvolve"
echo "   • Pressione Ctrl+C para fechar o túnel"
echo "   • Use outro terminal para desenvolver"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar se porta local já está em uso
if lsof -Pi :${LOCAL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Porta ${LOCAL_PORT} já está em uso!${NC}"
    echo "   Outro túnel pode estar ativo ou outro processo usando a porta."
    read -p "   Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Cancelado."
        exit 1
    fi
fi

# Criar túnel
echo -e "${GREEN}🚀 Conectando...${NC}"
echo ""

ssh -o ServerAliveInterval=60 -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} ${VPS_USER}@${VPS_HOST}

