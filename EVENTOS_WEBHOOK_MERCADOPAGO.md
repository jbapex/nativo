# 📋 Eventos do Webhook do Mercado Pago

## ✅ Eventos Recomendados para Checkout Transparente

### **1. Pagamentos** ✅ (OBRIGATÓRIO - JÁ CONFIGURADO)
- **O que é:** Notificações quando um pagamento é criado, atualizado ou cancelado
- **Quando acontece:**
  - Cliente faz um pagamento
  - Status do pagamento muda (aprovado, pendente, rejeitado)
  - Pagamento é cancelado ou estornado
- **Relevância:** ✅ **ESSENCIAL** - É o evento principal que você precisa
- **Status no sistema:** ✅ **IMPLEMENTADO** - O sistema já processa este evento

### **2. Alertas de Fraude** ⚠️ (Opcional)
- **O que é:** Notificações quando o sistema de fraude do Mercado Pago detecta algo suspeito
- **Quando acontece:**
  - Transação suspeita detectada
  - Análise de risco identifica problema
- **Relevância:** ⚠️ **Útil para segurança**, mas não essencial
- **Status no sistema:** ❌ Não implementado (pode ser adicionado no futuro)

### **3. Card Updater** ⚠️ (Opcional)
- **O que é:** Notificações sobre atualizações de cartões de crédito
- **Quando acontece:**
  - Cartão expirado foi atualizado automaticamente
  - Novo número de cartão disponível
- **Relevância:** ⚠️ **Útil para assinaturas recorrentes**, mas não essencial para checkout único
- **Status no sistema:** ❌ Não implementado (não necessário para checkout único)

### **4. Order (Mercado Pago)** ⚠️ (Opcional)
- **O que é:** Notificações sobre pedidos comerciais do Mercado Pago
- **Quando acontece:**
  - Pedido comercial criado ou atualizado
  - Status do pedido comercial mudou
- **Relevância:** ⚠️ **Diferente do nosso sistema** - é para pedidos do próprio Mercado Pago
- **Status no sistema:** ❌ Não implementado (não relevante para nosso sistema)

### **5. Vinculação de Aplicações** ❌ (Não relevante)
- **O que é:** Notificações sobre vinculação de aplicações externas
- **Relevância:** ❌ **Não relevante** para nosso caso de uso

### **6. Reclamações** ⚠️ (Opcional)
- **O que é:** Notificações quando um cliente abre uma reclamação
- **Quando acontece:**
  - Cliente abre disputa/reclamação
  - Status da reclamação muda
- **Relevância:** ⚠️ **Útil para suporte**, mas não essencial
- **Status no sistema:** ❌ Não implementado (pode ser adicionado no futuro)

### **7. Contestações** ⚠️ (Opcional)
- **O que é:** Notificações sobre contestações de pagamento
- **Quando acontece:**
  - Cliente contesta um pagamento
  - Contestação é resolvida
- **Relevância:** ⚠️ **Útil para gestão de disputas**, mas não essencial
- **Status no sistema:** ❌ Não implementado (pode ser adicionado no futuro)

### **8. Envios (Mercado Pago)** ❌ (Não relevante)
- **O que é:** Notificações sobre envios do Mercado Envios
- **Relevância:** ❌ **Não relevante** - você gerencia envios no seu próprio sistema

---

## 📦 Outros Eventos

### **1. Planos e Assinaturas** ❌ (Não relevante)
- **O que é:** Notificações sobre planos de assinatura recorrente
- **Relevância:** ❌ **Não relevante** - seu sistema não usa assinaturas do Mercado Pago
- **Status no sistema:** ❌ Não implementado

### **2. Delivery (proximity marketplace)** ❌ (Não relevante)
- **O que é:** Notificações sobre entregas do Mercado Pago
- **Relevância:** ❌ **Não relevante** - você gerencia entregas no seu próprio sistema

### **3. Pedidos Comerciais** ❌ (Não relevante)
- **O que é:** Notificações sobre pedidos comerciais do Mercado Pago
- **Relevância:** ❌ **Não relevante** - diferente do nosso sistema de pedidos

### **4. Integrações Point** ❌ (Não relevante)
- **O que é:** Notificações sobre pagamentos em máquinas Point do Mercado Pago
- **Relevância:** ❌ **Não relevante** - você não usa máquinas Point

### **5. Wallet Connect** ❌ (Não relevante)
- **O que é:** Notificações sobre conexões de carteira digital
- **Relevância:** ❌ **Não relevante** para nosso caso de uso

---

## 🎯 Recomendação

### **Para seu sistema, você precisa apenas:**

✅ **Pagamentos** (já configurado) - **OBRIGATÓRIO**

Este é o único evento essencial. Os outros são opcionais e podem ser adicionados no futuro se necessário.

### **Eventos que podem ser úteis no futuro:**

⚠️ **Alertas de Fraude** - Para melhorar a segurança
⚠️ **Reclamações** - Para gerenciar disputas
⚠️ **Contestações** - Para resolver problemas de pagamento

Mas por enquanto, **apenas "Pagamentos" é suficiente**.

---

## 📝 Resumo

| Evento | Relevância | Status |
|--------|-----------|--------|
| **Pagamentos** | ✅ Essencial | ✅ Implementado |
| Alertas de Fraude | ⚠️ Útil | ❌ Não implementado |
| Reclamações | ⚠️ Útil | ❌ Não implementado |
| Contestações | ⚠️ Útil | ❌ Não implementado |
| Outros eventos | ❌ Não relevantes | ❌ Não implementado |

**Conclusão:** Mantenha apenas "Pagamentos" marcado. Os outros eventos não são necessários para o funcionamento básico do sistema.

