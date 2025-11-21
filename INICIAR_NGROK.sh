#!/bin/bash

# Script para iniciar ngrok e mostrar a URL do webhook

echo "🚀 Iniciando ngrok..."
echo ""
echo "📋 Instruções:"
echo "1. Copie a URL HTTPS gerada abaixo (ex: https://abc123.ngrok.io)"
echo "2. Configure no Mercado Pago: https://abc123.ngrok.io/api/payments/webhook"
echo "3. Mantenha este terminal aberto enquanto estiver testando"
echo ""
echo "⚠️  IMPORTANTE: A URL muda a cada vez que você reinicia o ngrok"
echo ""

# Iniciar ngrok
ngrok http 3001
