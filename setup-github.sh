#!/bin/bash

# Script para configurar e fazer push inicial para GitHub

echo "🚀 Configurando repositório Git para GitHub"
echo ""

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado. Instale primeiro: https://git-scm.com/"
    exit 1
fi

# Verificar se já está inicializado
if [ -d ".git" ]; then
    echo "✅ Repositório Git já inicializado"
else
    echo "📦 Inicializando repositório Git..."
    git init
fi

# Verificar configuração do usuário
echo ""
echo "📋 Configuração do Git:"
echo "Nome: $(git config user.name || echo 'NÃO CONFIGURADO')"
echo "Email: $(git config user.email || echo 'NÃO CONFIGURADO')"
echo ""

# Perguntar se quer configurar
read -p "Deseja configurar nome e email do Git? (s/n): " config_user
if [ "$config_user" = "s" ] || [ "$config_user" = "S" ]; then
    read -p "Digite seu nome: " user_name
    read -p "Digite seu email: " user_email
    git config user.name "$user_name"
    git config user.email "$user_email"
    echo "✅ Configuração salva!"
fi

echo ""
echo "📝 Adicionando arquivos ao Git..."
git add .

echo ""
echo "📊 Status do repositório:"
git status --short | head -20

echo ""
echo "✅ Arquivos preparados!"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Crie um repositório no GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. Adicione o remote (substitua SEU-USUARIO):"
echo "   git remote add origin https://github.com/SEU-USUARIO/local-mart.git"
echo ""
echo "3. Faça o commit inicial:"
echo "   git commit -m 'feat: Initial commit - Sistema completo de marketplace local'"
echo ""
echo "4. Faça push para GitHub:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "📚 Veja o guia completo em: GUIA_GITHUB.md"
echo ""

