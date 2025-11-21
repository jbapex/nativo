# 🔑 Guia: Como Obter Access Token do Mercado Pago

Este guia explica passo a passo como obter suas credenciais do Mercado Pago para integrar com o sistema.

---

## 📋 Pré-requisitos

1. **Conta no Mercado Pago**
   - Se não tiver, crie em: https://www.mercadopago.com.br
   - Você pode usar conta pessoal ou criar uma conta de vendedor

2. **Documentação necessária** (para conta de vendedor)
   - CPF ou CNPJ
   - Documento de identidade
   - Comprovante de endereço

---

## 🚀 Passo a Passo

### **1. Acesse o Painel do Mercado Pago**

1. Acesse: https://www.mercadopago.com.br
2. Faça login na sua conta
3. No menu superior, clique em **"Desenvolvedores"** ou acesse diretamente: https://www.mercadopago.com.br/developers

### **2. Acesse a Seção de Credenciais**

1. No painel de desenvolvedores, clique em **"Suas integrações"** no menu lateral
2. Se você ainda não criou uma aplicação, clique em **"Criar aplicação"**
3. Preencha os dados:
   - **Nome da aplicação**: Ex: "Minha Loja Online"
   - **Descrição**: Ex: "Integração para recebimento de pagamentos"
   - **Categoria**: Selecione a mais adequada (ex: "E-commerce")
4. Clique em **"Criar aplicação"**

### **3. Obtenha suas Credenciais**

Após criar a aplicação, você verá duas abas:

#### **🔴 Credenciais de Teste (Sandbox)**
- Use para testar a integração sem processar pagamentos reais
- **Access Token**: Começa com `TEST-...`
- **Public Key**: Começa com `TEST-...`

#### **🟢 Credenciais de Produção**
- Use para processar pagamentos reais
- **Access Token**: Começa com `APP_USR-...`
- **Public Key**: Começa com `APP_USR-...`

### **4. Copie o Access Token**

1. Clique na aba **"Credenciais de Produção"** (ou Teste, se estiver testando)
2. Localize o campo **"Access Token"**
3. Clique no ícone de **👁️ (olho)** para revelar o token
4. Clique em **"Copiar"** para copiar o token
5. **⚠️ IMPORTANTE**: Guarde este token com segurança! Não compartilhe publicamente.

### **5. (Opcional) Copie a Public Key**

1. Na mesma página, localize o campo **"Public Key"**
2. Clique em **"Copiar"** para copiar a chave pública
3. Esta chave é opcional, mas pode ser útil para algumas funcionalidades

---

## 🔐 Onde Usar no Sistema

### **No Sistema (StoreSettings)**

1. Acesse: **Configurações da Loja** → **Configurações de Pagamento**
2. Role até a seção **"Integração Mercado Pago"**
3. Cole o **Access Token** no campo correspondente
4. (Opcional) Cole a **Public Key** se tiver
5. Clique em **"Conectar Conta"**

---

## ⚠️ Importante: Credenciais de Teste vs Produção

### **Credenciais de Teste (Sandbox)**
- ✅ Use para testar a integração
- ✅ Não processa pagamentos reais
- ✅ Não cobra taxas
- ❌ Não recebe dinheiro real
- **Access Token**: Começa com `TEST-...`

### **Credenciais de Produção**
- ✅ Processa pagamentos reais
- ✅ Recebe dinheiro na sua conta
- ⚠️ Cobra taxas por transação
- ⚠️ Requer conta verificada
- **Access Token**: Começa com `APP_USR-...`

---

## 🔒 Segurança

### **Boas Práticas:**

1. **Nunca compartilhe** seu Access Token publicamente
2. **Não commite** credenciais no código (use variáveis de ambiente)
3. **Use credenciais de teste** durante o desenvolvimento
4. **Revogue e recrie** credenciais se suspeitar de comprometimento
5. **Mude as credenciais** periodicamente

### **Se o Token for Comprometido:**

1. Acesse o painel do Mercado Pago
2. Vá em **"Suas integrações"**
3. Selecione sua aplicação
4. Clique em **"Regenerar credenciais"**
5. Atualize o token no sistema

---

## 📱 Verificar Conta do Mercado Pago

Para usar credenciais de **produção**, sua conta precisa estar verificada:

1. Acesse: https://www.mercadopago.com.br/account
2. Complete a verificação de identidade
3. Adicione e verifique seus dados bancários
4. Aguarde a aprovação (geralmente 24-48h)

---

## 🧪 Testar a Integração

### **1. Usando Credenciais de Teste:**

1. Use um Access Token que comece com `TEST-...`
2. Faça um pedido de teste no sistema
3. Use os cartões de teste do Mercado Pago:
   - **Cartão aprovado**: 5031 4332 1540 6351
   - **CVV**: 123
   - **Data**: Qualquer data futura
   - **Nome**: Qualquer nome

### **2. Verificar se Funcionou:**

1. Acesse o painel do Mercado Pago
2. Vá em **"Atividade"** → **"Pagamentos"**
3. Você verá os pagamentos de teste processados

---

## ❓ Problemas Comuns

### **"Token inválido"**
- ✅ Verifique se copiou o token completo
- ✅ Certifique-se de estar usando o token correto (Teste ou Produção)
- ✅ Verifique se não há espaços antes ou depois do token

### **"Conta não verificada"**
- ✅ Complete a verificação de identidade no Mercado Pago
- ✅ Use credenciais de teste enquanto aguarda aprovação

### **"Erro ao gerar pagamento"**
- ✅ Verifique se o token está correto
- ✅ Certifique-se de que a conta está ativa
- ✅ Verifique os logs do servidor para mais detalhes

---

## 📞 Suporte

- **Documentação oficial**: https://www.mercadopago.com.br/developers/pt/docs
- **Suporte Mercado Pago**: https://www.mercadopago.com.br/help
- **Status da API**: https://status.mercadopago.com

---

## 🎯 Resumo Rápido

1. ✅ Acesse: https://www.mercadopago.com.br/developers
2. ✅ Clique em "Suas integrações"
3. ✅ Crie uma aplicação (se necessário)
4. ✅ Copie o **Access Token** (começa com `APP_USR-...` ou `TEST-...`)
5. ✅ Cole no sistema em **Configurações da Loja** → **Integração Mercado Pago**
6. ✅ Clique em **"Conectar Conta"**

Pronto! 🎉 Sua loja agora pode gerar QR Codes PIX com valor automaticamente!

