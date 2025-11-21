#!/bin/bash

echo "🚀 Iniciando servidor Local Mart..."
echo ""

cd backend

echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  Instalando dependências..."
  npm install
fi

echo ""
echo "✅ Iniciando servidor na porta 3001..."
echo "📝 Logs aparecerão abaixo:"
echo ""

npm run dev

