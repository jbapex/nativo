import React, { useState, useEffect } from "react";
import { Subscription } from "@/api/entities";
import { Plan } from "@/api/entities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function StoreSubscriptionPage({ store, subscription, plan }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (store?.id) {
      loadSubscriptions();
    }
  }, [store?.id]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError("");
      const subscriptionsData = await Subscription.filter({ store_id: store.id });
      setSubscriptions(subscriptionsData || []);
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error);
      setError("Erro ao carregar assinaturas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = (sub) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetar horas para comparação apenas de data
    
    const endDate = sub.end_date ? new Date(sub.end_date) : null;
    if (endDate) {
      endDate.setHours(0, 0, 0, 0);
    }
    
    if (sub.status === 'cancelled') {
      return { type: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800' };
    }
    
    if (sub.status === 'expired') {
      return { type: 'expired', label: 'Expirada', color: 'bg-red-100 text-red-800' };
    }
    
    // Verificar se está atrasada (end_date passou e status é active ou pending)
    if (endDate && endDate < today && (sub.status === 'active' || sub.status === 'pending')) {
      return { type: 'overdue', label: 'Atrasada', color: 'bg-red-100 text-red-800' };
    }
    
    if (sub.status === 'pending') {
      return { type: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (sub.status === 'active') {
      return { type: 'active', label: 'Ativa', color: 'bg-green-100 text-green-800' };
    }
    
    return { type: 'unknown', label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  // Separar assinaturas por status
  const activeSubscription = subscriptions.find(s => {
    const status = getSubscriptionStatus(s);
    return status.type === 'active';
  });
  
  const overdueSubscriptions = subscriptions.filter(s => {
    const status = getSubscriptionStatus(s);
    return status.type === 'overdue';
  });
  
  const pendingSubscriptions = subscriptions.filter(s => {
    const status = getSubscriptionStatus(s);
    return status.type === 'pending';
  });
  
  const otherSubscriptions = subscriptions.filter(s => {
    const status = getSubscriptionStatus(s);
    return !['active', 'overdue', 'pending'].includes(status.type);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Minha Assinatura</h1>
        <p className="text-gray-600 mt-1">Gerencie sua assinatura e faturamentos</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Assinatura Atual */}
      {activeSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assinatura Atual</CardTitle>
                <CardDescription>
                  Plano ativo da sua loja
                </CardDescription>
              </div>
              <Badge className={getSubscriptionStatus(activeSubscription).color}>
                {getStatusIcon(getSubscriptionStatus(activeSubscription).type)}
                <span className="ml-1">{getSubscriptionStatus(activeSubscription).label}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plano</p>
                <p className="text-lg font-semibold">{activeSubscription.plan_name || plan?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(activeSubscription.plan_price || plan?.price || 0)}/mês
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Válido até</p>
                <p className="text-lg font-semibold">
                  {activeSubscription.end_date ? formatDate(activeSubscription.end_date) : "-"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline"
                onClick={() => window.location.href = createPageUrl("StoreProfile") + "?page=settings"}
              >
                Alterar Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Faturamentos Atrasados */}
      {overdueSubscriptions.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Faturamentos Atrasados</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              Você tem {overdueSubscriptions.length} faturamento(s) atrasado(s) que precisam ser pagos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueSubscriptions.map((sub) => {
                const status = getSubscriptionStatus(sub);
                return (
                  <div 
                    key={sub.id} 
                    className="bg-white border border-red-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {sub.plan_name || "Plano"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Vencido em {formatDate(sub.end_date)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-12 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Valor: </span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(sub.plan_price || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Período: </span>
                          <span className="font-semibold">
                            {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={status.color}>
                        {getStatusIcon(status.type)}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                      <Button 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => window.location.href = createPageUrl("StoreProfile") + "?page=settings"}
                      >
                        Pagar Agora
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Faturamentos Pendentes */}
      {pendingSubscriptions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Faturamentos Pendentes</CardTitle>
            </div>
            <CardDescription className="text-yellow-700">
              Você tem {pendingSubscriptions.length} faturamento(s) aguardando pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSubscriptions.map((sub) => {
                const status = getSubscriptionStatus(sub);
                return (
                  <div 
                    key={sub.id} 
                    className="bg-white border border-yellow-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {sub.plan_name || "Plano"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sub.end_date ? `Vence em ${formatDate(sub.end_date)}` : "Aguardando confirmação"}
                          </p>
                        </div>
                      </div>
                      <div className="ml-12 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Valor: </span>
                          <span className="font-semibold text-yellow-600">
                            {formatCurrency(sub.plan_price || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Período: </span>
                          <span className="font-semibold">
                            {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={status.color}>
                        {getStatusIcon(status.type)}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = createPageUrl("StoreProfile") + "?page=settings"}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Assinaturas */}
      {otherSubscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Assinaturas</CardTitle>
            <CardDescription>
              Assinaturas anteriores e canceladas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherSubscriptions.map((sub) => {
                const status = getSubscriptionStatus(sub);
                return (
                  <div 
                    key={sub.id} 
                    className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {sub.plan_name || "Plano"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-12 text-sm">
                        <span className="text-gray-500">Valor: </span>
                        <span className="font-semibold">
                          {formatCurrency(sub.plan_price || 0)}
                        </span>
                      </div>
                    </div>
                    <Badge className={status.color}>
                      {getStatusIcon(status.type)}
                      <span className="ml-1">{status.label}</span>
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há assinaturas */}
      {subscriptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma assinatura encontrada
            </h3>
            <p className="text-gray-500 mb-4">
              Você ainda não possui assinaturas cadastradas.
            </p>
            <Button 
              onClick={() => window.location.href = createPageUrl("StoreProfile") + "?page=settings"}
            >
              Ver Planos Disponíveis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

