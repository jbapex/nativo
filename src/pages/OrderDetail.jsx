import React, { useState, useEffect } from "react";
import { Orders as OrdersAPI } from "@/api/apiClient";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ArrowLeft,
  Calendar,
  Store,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  CreditCard,
  MessageSquare,
  BarChart3,
  Eye,
  Settings,
  Lightbulb,
  FileText
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, PackageSearch } from "lucide-react";

// Componente de ícone do WhatsApp
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userStore, setUserStore] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState(null);

  useEffect(() => {
    loadUser();
    loadOrder();
    
    // Verificar se há parâmetros de status na URL (retorno do Mercado Pago)
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    
    if (paymentStatus) {
      // Remover parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Mostrar mensagem apropriada
      if (paymentStatus === 'approved') {
        toast({
          title: "Pagamento aprovado!",
          description: "Seu pagamento foi processado com sucesso. Aguardando confirmação da loja.",
        });
      } else if (paymentStatus === 'pending') {
        toast({
          title: "Pagamento pendente",
          description: "Seu pagamento está sendo processado. Verificando status automaticamente...",
        });
      } else if (paymentStatus === 'failure') {
        toast({
          title: "Pagamento não aprovado",
          description: "Não foi possível processar seu pagamento. Tente novamente ou escolha outro método.",
          variant: "destructive",
        });
      }
      
      // Recarregar pedido imediatamente e depois novamente após delay
      loadOrder();
      setTimeout(async () => {
        await loadOrder();
        // Após recarregar, verificar se tem payment_id e verificar status
        const currentOrder = await OrdersAPI.get(id);
        if (currentOrder?.payment_id) {
          checkPaymentStatus(currentOrder.payment_id);
        }
      }, 3000);
      
      // Se o pagamento está pendente, verificar periodicamente
      if (paymentStatus === 'pending') {
        const checkInterval = setInterval(async () => {
          await loadOrder();
          const currentOrder = await OrdersAPI.get(id);
          if (currentOrder?.payment_status === 'paid' || currentOrder?.payment_status === 'approved') {
            clearInterval(checkInterval);
            toast({
              title: "Pagamento confirmado!",
              description: "Seu pagamento foi processado com sucesso.",
            });
          }
        }, 5000); // Verificar a cada 5 segundos
        
        // Parar após 2 minutos (24 verificações)
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 120000);
      }
    }
  }, [id]); // Recarregar quando o ID mudar
  
  // Função para verificar status do pagamento manualmente
  const checkPaymentStatus = async (paymentId) => {
    if (!paymentId) return;
    
    try {
      console.log('Verificando status do pagamento:', paymentId);
      const { Payments } = await import("@/api/apiClient");
      const paymentStatus = await Payments.getStatus(paymentId);
      console.log('Status do pagamento:', paymentStatus);
      
      // Recarregar pedido para ver se o status mudou
      await loadOrder();
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Se for lojista, buscar a loja do usuário
      if (userData?.role === 'store') {
        try {
          const { Store } = await import("@/api/entities");
          const stores = await Store.list();
          const store = stores.find(s => s.user_id === userData.id);
          if (store) {
            setUserStore(store);
          }
        } catch (error) {
          console.error("Erro ao carregar loja do usuário:", error);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderId = id;
      if (!orderId) {
        navigate("/pedidos");
        return;
      }

      const orderData = await OrdersAPI.get(orderId);
      setOrder(orderData);
      setNewStatus(orderData.status);
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o pedido",
        variant: "destructive",
      });
      navigate(createPageUrl("Orders"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    console.log("handleStatusUpdate chamado", { order: order?.id, newStatus, currentStatus: order?.status });
    
    if (!order) {
      console.log("Erro: order não existe");
      return;
    }
    
    if (newStatus === order.status) {
      console.log("Status não mudou, ignorando");
      return;
    }

    // Se for cancelar, mostrar confirmação
    if (newStatus === 'cancelled') {
      console.log("Abrindo dialog de cancelamento");
      setShowCancelDialog(true);
      return;
    }

    // Se for enviado, mostrar dialog para rastreamento
    if (newStatus === 'shipped') {
      console.log("Abrindo dialog de envio");
      setShowStatusDialog(true);
      return;
    }

    // Para outros status, atualizar diretamente
    console.log("Atualizando status diretamente");
    await performStatusUpdate();
  };

  const performStatusUpdate = async (notes = statusNotes, tracking = trackingNumber) => {
    if (!order) {
      console.log("Erro: order não existe em performStatusUpdate");
      return;
    }

    try {
      console.log("Iniciando atualização de status:", { orderId: order.id, newStatus, tracking, notes });
      setUpdating(true);
      
      const result = await OrdersAPI.updateStatus(order.id, newStatus, tracking, notes);
      console.log("Status atualizado com sucesso:", result);
      
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado com sucesso!",
      });
      
      setStatusNotes("");
      setTrackingNumber("");
      setShowStatusDialog(false);
      setShowCancelDialog(false);
      
      await loadOrder(); // Recarregar pedido
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status do pedido",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCancel = async () => {
    await performStatusUpdate(statusNotes || "Pedido cancelado pelo lojista");
  };

  const handlePaymentStatusUpdate = async (paymentStatus) => {
    if (!order) return;

    // Mostrar dialog para adicionar observação
    setPendingPaymentStatus(paymentStatus);
    setShowPaymentDialog(true);
  };

  const performPaymentStatusUpdate = async () => {
    if (!order || !pendingPaymentStatus) return;

    try {
      setUpdating(true);
      await OrdersAPI.updatePaymentStatus(order.id, pendingPaymentStatus, paymentNotes);
      
      toast({
        title: "Sucesso",
        description: "Status de pagamento atualizado com sucesso!",
      });
      
      setPaymentNotes("");
      setShowPaymentDialog(false);
      setPendingPaymentStatus(null);
      
      await loadOrder(); // Recarregar pedido
    } catch (error) {
      console.error("Erro ao atualizar status de pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de pagamento",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      confirmed: { label: "Confirmado", className: "bg-blue-50 text-blue-700 border-blue-200" },
      processing: { label: "Processando", className: "bg-purple-50 text-purple-700 border-purple-200" },
      shipped: { label: "Enviado", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      delivered: { label: "Entregue", className: "bg-green-50 text-green-700 border-green-200" },
      cancelled: { label: "Cancelado", className: "bg-red-50 text-red-700 border-red-200" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      paid: { label: "Pago", className: "bg-green-50 text-green-700 border-green-200" },
      failed: { label: "Falhou", className: "bg-red-50 text-red-700 border-red-200" },
      refunded: { label: "Reembolsado", className: "bg-gray-50 text-gray-700 border-gray-200" },
    };

    const config = statusConfig[paymentStatus] || statusConfig.pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isStore = user?.role === 'store';
  const isAdmin = user?.role === 'admin';
  // Verificar se o usuário é dono da loja do pedido (se for lojista)
  const isOrderStoreOwner = isStore && userStore && order && order.store_id === userStore.id;
  // Só pode atualizar status se for admin OU se for lojista dono da loja do pedido
  const canUpdateStatus = isAdmin || isOrderStoreOwner;

  // Função para renderizar preview da timeline para o lojista
  const renderOrderTimelinePreview = () => {
    if (!order) return null;

    // Determinar quais etapas mostrar baseado no status atual
    const allSteps = [
      { key: 'order_placed', label: 'Pedido Realizado', icon: Package, status: 'completed' },
      { key: 'payment', label: 'Pagamento', icon: CreditCard, status: order.payment_status === 'paid' ? 'completed' : 'pending' },
      { key: 'confirmed', label: 'Confirmado', icon: CheckCircle2, status: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending' },
      { key: 'processing', label: 'Em Preparação', icon: Package, status: ['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending' },
      { key: 'shipped', label: 'Enviado', icon: Truck, status: ['shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending' },
      { key: 'delivered', label: 'Entregue', icon: CheckCircle2, status: order.status === 'delivered' ? 'completed' : 'pending' },
    ];

    if (order.status === 'cancelled') {
      allSteps.push({ key: 'cancelled', label: 'Cancelado', icon: XCircle, status: 'error' });
    }

    // Filtrar apenas etapas relevantes (até a etapa atual + próximas 2)
    let relevantSteps = [];
    let currentStepIndex = -1;

    // Encontrar índice da etapa atual
    if (order.status === 'cancelled') {
      currentStepIndex = allSteps.findIndex(s => s.key === 'cancelled');
    } else if (order.status === 'delivered') {
      currentStepIndex = allSteps.findIndex(s => s.key === 'delivered');
    } else if (order.status === 'shipped') {
      currentStepIndex = allSteps.findIndex(s => s.key === 'shipped');
    } else if (order.status === 'processing') {
      currentStepIndex = allSteps.findIndex(s => s.key === 'processing');
    } else if (order.status === 'confirmed') {
      currentStepIndex = allSteps.findIndex(s => s.key === 'confirmed');
    } else {
      currentStepIndex = allSteps.findIndex(s => s.key === 'order_placed');
    }

    // Mostrar etapas até a atual + próximas 2, ou todas se cancelado
    if (order.status === 'cancelled') {
      relevantSteps = allSteps;
    } else {
      const startIndex = Math.max(0, currentStepIndex - 1);
      const endIndex = Math.min(allSteps.length, currentStepIndex + 3);
      relevantSteps = allSteps.slice(startIndex, endIndex);
      currentStepIndex = currentStepIndex - startIndex; // Ajustar índice relativo
    }

    return (
      <div className="relative">
        {relevantSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'completed';
          const isCurrent = index === currentStepIndex && step.status !== 'error';
          const isError = step.status === 'error';
          const isPending = step.status === 'pending' && !isCurrent;
          const isLast = index === relevantSteps.length - 1;

          return (
            <div key={step.key} className="relative flex gap-3 pb-3 last:pb-0">
              {!isLast && (
                <div className={`absolute left-4 top-8 w-0.5 h-full ${
                  isCompleted ? 'bg-green-400' : isError ? 'bg-red-400' : 'bg-gray-300'
                }`} />
              )}
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isError 
                  ? 'bg-red-500 text-white' 
                  : isCurrent 
                  ? 'bg-blue-500 text-white ring-2 ring-blue-200' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-1">
                <p className={`text-xs font-medium ${
                  isCompleted || isCurrent ? 'text-gray-900' : isError ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {isCurrent && step.status !== 'error' && (
                  <p className="text-xs text-blue-600 mt-0.5">← Etapa atual</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Função para renderizar timeline de status do pedido
  const renderOrderTimeline = () => {
    if (!order) return null;

    const statusSteps = [
      {
        key: 'order_placed',
        label: 'Pedido Realizado',
        description: 'Seu pedido foi recebido',
        icon: Package,
        status: 'completed',
        date: order.created_at,
      },
      {
        key: 'payment',
        label: 'Pagamento Confirmado',
        description: order.payment_status === 'paid' 
          ? 'Pagamento aprovado' 
          : order.payment_status === 'failed' 
          ? 'Pagamento falhou' 
          : 'Aguardando pagamento',
        icon: CreditCard,
        status: order.payment_status === 'paid' ? 'completed' : order.payment_status === 'failed' ? 'error' : 'pending',
        date: order.history?.find(h => h.change_type === 'payment_status' && h.new_value === 'paid')?.created_at,
      },
      {
        key: 'confirmed',
        label: 'Pedido Confirmado',
        description: 'Loja confirmou seu pedido',
        icon: CheckCircle2,
        status: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        date: order.history?.find(h => h.change_type === 'status' && h.new_value === 'confirmed')?.created_at,
      },
      {
        key: 'processing',
        label: 'Em Preparação',
        description: 'Seu pedido está sendo preparado',
        icon: Package,
        status: ['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        date: order.history?.find(h => h.change_type === 'status' && h.new_value === 'processing')?.created_at,
      },
      {
        key: 'shipped',
        label: 'Enviado',
        description: order.tracking_number 
          ? `Código de rastreamento: ${order.tracking_number}` 
          : 'Seu pedido foi enviado',
        icon: Truck,
        status: ['shipped', 'delivered'].includes(order.status) ? 'completed' : 'pending',
        date: order.history?.find(h => h.change_type === 'status' && h.new_value === 'shipped')?.created_at,
        tracking: order.tracking_number,
      },
      {
        key: 'delivered',
        label: 'Entregue',
        description: 'Pedido entregue com sucesso',
        icon: CheckCircle2,
        status: order.status === 'delivered' ? 'completed' : 'pending',
        date: order.history?.find(h => h.change_type === 'status' && h.new_value === 'delivered')?.created_at,
      },
    ];

    // Se cancelado, mostrar etapa de cancelamento
    if (order.status === 'cancelled') {
      statusSteps.push({
        key: 'cancelled',
        label: 'Pedido Cancelado',
        description: 'Este pedido foi cancelado',
        icon: XCircle,
        status: 'error',
        date: order.history?.find(h => h.change_type === 'status' && h.new_value === 'cancelled')?.created_at,
      });
    }

    // Encontrar o índice da etapa atual
    const currentStepIndex = statusSteps.findIndex(step => {
      if (order.status === 'cancelled') return step.key === 'cancelled';
      if (order.status === 'delivered') return step.key === 'delivered';
      if (order.status === 'shipped') return step.key === 'shipped';
      if (order.status === 'processing') return step.key === 'processing';
      if (order.status === 'confirmed') return step.key === 'confirmed';
      if (order.payment_status === 'paid' && order.status === 'pending') return step.key === 'payment';
      return step.key === 'order_placed';
    });

    return (
      <div className="relative">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'completed';
          const isCurrent = index === currentStepIndex && step.status !== 'error';
          const isError = step.status === 'error';
          const isPending = step.status === 'pending' && !isCurrent;
          const isLast = index === statusSteps.length - 1;

          return (
            <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Linha vertical */}
              {!isLast && (
                <div className={`absolute left-4 top-10 w-0.5 h-full ${
                  isCompleted ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-gray-200'
                }`} />
              )}

              {/* Ícone */}
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isError 
                  ? 'bg-red-500 text-white' 
                  : isCurrent 
                  ? 'bg-blue-500 text-white ring-4 ring-blue-100' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      isCompleted || isCurrent 
                        ? 'text-gray-900' 
                        : isError 
                        ? 'text-red-600' 
                        : 'text-gray-400'
                    }`}>
                      {step.label}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      isCompleted || isCurrent 
                        ? 'text-gray-600' 
                        : isError 
                        ? 'text-red-500' 
                        : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                    {step.tracking && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Tentar abrir link de rastreamento (Correios, transportadoras, etc)
                            const trackingUrl = `https://www.google.com/search?q=rastreamento+${step.tracking}`;
                            window.open(trackingUrl, '_blank');
                          }}
                          className="text-xs"
                        >
                          <PackageSearch className="w-3 h-3 mr-1" />
                          Rastrear Pedido
                        </Button>
                      </div>
                    )}
                  </div>
                  {step.date && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(step.date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Pedido não encontrado</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Orders"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pedidos
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            {getPaymentStatusBadge(order.payment_status)}
          </div>
        </div>

        {/* Timeline de Status do Pedido */}
        {!canUpdateStatus && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Acompanhe seu pedido</CardTitle>
            </CardHeader>
            <CardContent>
              {renderOrderTimeline()}
            </CardContent>
          </Card>
        )}

        {/* Botão WhatsApp em Destaque - Apenas para pedidos com método WhatsApp */}
        {!canUpdateStatus && order.payment_method === 'whatsapp' && order.store_whatsapp && (
          <Card className="mb-6 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Envie seu pedido para a loja
                  </h3>
                  <p className="text-sm text-gray-600">
                    Clique no botão abaixo para enviar os detalhes do pedido via WhatsApp e finalizar sua compra.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-base"
                  onClick={() => {
                    const formatOrderMessage = (order) => {
                      const itemsText = order.items?.map(item => 
                        `• ${item.product_name} x${item.quantity} - ${formatCurrency(item.subtotal || item.product_price * item.quantity)}`
                      ).join('\n') || 'Nenhum item';
                      
                      let message = `Olá! Acabei de fazer um pedido:\n\n`;
                      message += `📦 *Pedido #${order.id.slice(0, 8).toUpperCase()}*\n\n`;
                      message += `*Produtos:*\n${itemsText}\n\n`;
                      
                      if (order.subtotal && order.shipping_cost !== undefined) {
                        message += `Subtotal: ${formatCurrency(order.subtotal)}\n`;
                        if (order.shipping_cost > 0) {
                          message += `Frete: ${formatCurrency(order.shipping_cost)}\n`;
                        } else {
                          message += `Frete: Grátis\n`;
                        }
                      }
                      
                      message += `*Total: ${formatCurrency(order.total_amount)}*\n\n`;
                      
                      if (order.shipping_address) {
                        message += `*Endereço de entrega:*\n`;
                        message += `${order.shipping_address}\n`;
                        if (order.shipping_city) {
                          message += `${order.shipping_city}`;
                          if (order.shipping_state) message += `, ${order.shipping_state}`;
                          if (order.shipping_zip) message += ` - ${order.shipping_zip}`;
                          message += `\n`;
                        }
                        if (order.shipping_phone) {
                          message += `Telefone: ${order.shipping_phone}\n`;
                        }
                        message += `\n`;
                      }
                      
                      if (order.notes) {
                        message += `*Observações:*\n${order.notes}\n\n`;
                      }
                      
                      message += `Por favor, confirme o pedido e envie as informações de pagamento.`;
                      
                      return message;
                    };
                    
                    const message = formatOrderMessage(order);
                    const url = `https://wa.me/${order.store_whatsapp}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                  }}
                >
                  <WhatsAppIcon className="w-5 h-5 mr-2" />
                  Enviar Pedido via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Itens do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.original_price && item.original_price > item.product_price ? (
                            <>
                              <p className="text-sm text-gray-400 line-through">
                                {formatCurrency(item.original_price)}
                              </p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(item.product_price)}
                              </p>
                              {item.discount_percent > 0 && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  -{item.discount_percent}%
                                </Badge>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">
                              Preço unitário: {formatCurrency(item.product_price)}
                            </p>
                          )}
                        </div>
                        {item.promotion_name && (
                          <p className="text-xs text-green-600 mt-1">
                            🎉 {item.promotion_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                        {item.original_price && item.original_price > item.product_price && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatCurrency(item.original_price * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações de Entrega */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{order.shipping_address}</p>
                    {order.shipping_city && (
                      <p className="text-gray-600">
                        {order.shipping_city}
                        {order.shipping_state && `, ${order.shipping_state}`}
                        {order.shipping_zip && ` - ${order.shipping_zip}`}
                      </p>
                    )}
                    {order.shipping_phone && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {order.shipping_phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Gerenciar Pedido (Lojista/Admin) - Abaixo do Endereço de Entrega */}
            {canUpdateStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Pedido</CardTitle>
                  <CardDescription>
                    Atualize o status do pedido. O cliente verá essas mudanças na timeline de acompanhamento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preview da Timeline para o Lojista */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-900" />
                        <p className="text-sm font-semibold text-blue-900">Status Atual do Pedido</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.payment_status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3 text-blue-700" />
                      <p className="text-xs text-blue-700">
                        Preview: Esta é a timeline que o cliente está vendo agora
                      </p>
                    </div>
                  </div>

                  {/* Preview Visual da Timeline */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3">Visualização do Cliente:</p>
                    {renderOrderTimelinePreview()}
                  </div>

                  <div className="border-t pt-4">
                    <label className="text-sm font-semibold mb-3 block text-gray-900 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Alterar Status do Pedido
                    </label>
                    <Select 
                      value={newStatus} 
                      onValueChange={(value) => {
                        console.log("Status selecionado:", value);
                        setNewStatus(value);
                      }}
                    >
                      <SelectTrigger className="h-auto py-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-start gap-3 py-1">
                            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">Pendente</span>
                              <span className="text-xs text-gray-500">Aguardando confirmação da loja</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="confirmed">
                          <div className="flex items-start gap-3 py-1">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">Confirmado</span>
                              <span className="text-xs text-gray-500">Pedido confirmado pela loja</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="processing">
                          <div className="flex items-start gap-3 py-1">
                            <Package className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">Processando</span>
                              <span className="text-xs text-gray-500">Em preparação/separando produtos</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="shipped">
                          <div className="flex items-start gap-3 py-1">
                            <Truck className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">Enviado</span>
                              <span className="text-xs text-gray-500">Pedido enviado para entrega</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="delivered">
                          <div className="flex items-start gap-3 py-1">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">Entregue</span>
                              <span className="text-xs text-gray-500">Pedido entregue ao cliente</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-start gap-3 py-1">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">Cancelado</span>
                              <span className="text-xs text-gray-500">Pedido cancelado</span>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {newStatus !== order.status && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-green-800" />
                          <p className="text-xs font-medium text-green-800">
                            Mudança será aplicada
                          </p>
                        </div>
                        <p className="text-xs text-green-700">
                          O cliente verá esta atualização na timeline de acompanhamento do pedido.
                        </p>
                      </div>
                    )}
                    {newStatus !== order.status && (
                      <>
                        <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          {newStatus === 'shipped' && (
                            <div>
                              <Label htmlFor="tracking" className="text-sm font-medium flex items-center gap-2 mb-2">
                                <PackageSearch className="w-4 h-4 text-indigo-600" />
                                Código de Rastreamento
                                <span className="text-xs text-gray-500 font-normal">(opcional mas recomendado)</span>
                              </Label>
                              <Input
                                id="tracking"
                                placeholder="Ex: BR123456789BR, AA123456789BR, etc."
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="mt-1"
                              />
                              <div className="flex items-start gap-2 mt-1">
                                <Lightbulb className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-500">
                                  O cliente poderá rastrear o pedido usando este código
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {(newStatus === 'shipped' || newStatus === 'cancelled' || newStatus === 'confirmed' || newStatus === 'processing' || newStatus === 'delivered') && (
                            <div>
                              <Label htmlFor="status-notes" className="text-sm font-medium flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-gray-600" />
                                Observações Internas
                                <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                              </Label>
                              <Textarea
                                id="status-notes"
                                placeholder={
                                  newStatus === 'shipped' 
                                    ? "Ex: Enviado via Correios, prazo de entrega: 5-7 dias úteis..."
                                    : newStatus === 'cancelled'
                                    ? "Ex: Cancelado por falta de estoque, cliente será reembolsado..."
                                    : newStatus === 'delivered'
                                    ? "Ex: Entregue na portaria, assinado por: João Silva..."
                                    : "Adicione observações sobre esta alteração..."
                                }
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                className="mt-1"
                                rows={3}
                              />
                              <div className="flex items-start gap-2 mt-1">
                                <FileText className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-500">
                                  Estas observações ficam apenas para você (não são visíveis ao cliente)
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Botão clicado!", { 
                              newStatus, 
                              currentStatus: order?.status, 
                              updating,
                              orderExists: !!order
                            });
                            if (!updating && newStatus && newStatus !== order?.status) {
                              handleStatusUpdate();
                            } else {
                              console.log("Botão desabilitado ou condições não atendidas");
                            }
                          }}
                          disabled={updating || !newStatus || !order || newStatus === order?.status}
                          className="w-full mt-4 h-11 text-base font-medium"
                          size="lg"
                          type="button"
                        >
                          {updating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Atualizando Status...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Confirmar Alteração de Status
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <label className="text-sm font-semibold mb-3 block text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Status de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={order.payment_status === 'paid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePaymentStatusUpdate('paid')}
                        disabled={updating || order.payment_status === 'paid'}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Pago
                      </Button>
                      <Button
                        variant={order.payment_status === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePaymentStatusUpdate('pending')}
                        disabled={updating || order.payment_status === 'pending'}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Pendente
                      </Button>
                      <Button
                        variant={order.payment_status === 'failed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePaymentStatusUpdate('failed')}
                        disabled={updating || order.payment_status === 'failed'}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Falhou
                      </Button>
                      <Button
                        variant={order.payment_status === 'refunded' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePaymentStatusUpdate('refunded')}
                        disabled={updating || order.payment_status === 'refunded'}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Reembolsado
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data do pedido:</span>
                  <span className="font-medium">{formatDate(order.created_at)}</span>
                </div>
                
                {isStore && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{order.user_name || order.user_email}</span>
                    </div>
                    {order.user_email && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{order.user_email}</span>
                      </div>
                    )}
                    {order.user_phone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Telefone:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.user_phone}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {!isStore && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Loja:</span>
                    <span className="font-medium">{order.store_name}</span>
                  </div>
                )}

                {order.payment_method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Método de pagamento:</span>
                    <span className="font-medium capitalize">{order.payment_method}</span>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  {order.original_subtotal && order.original_subtotal > (order.subtotal || order.total_amount) ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal original:</span>
                        <span className="text-gray-400 line-through">
                          {formatCurrency(order.original_subtotal)}
                        </span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 font-medium">Desconto:</span>
                          <span className="text-green-600 font-semibold">
                            -{formatCurrency(order.discount_amount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">
                          {formatCurrency(order.subtotal || order.total_amount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(order.subtotal || order.total_amount)}
                      </span>
                    </div>
                  )}
                  {order.shipping_cost > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete:</span>
                      <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete:</span>
                      <span className="font-medium text-green-600">Grátis</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato / WhatsApp - Apenas para outros métodos de pagamento */}
            {order.store_whatsapp && order.payment_method !== 'whatsapp' && (
              <Card>
                <CardHeader>
                  <CardTitle>Contato</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => {
                      const message = `Olá! Tenho uma dúvida sobre o pedido #${order.id.slice(0, 8).toUpperCase()}`;
                      const url = `https://wa.me/${order.store_whatsapp}?text=${encodeURIComponent(message)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contatar via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Rastreamento */}
            {order.tracking_number && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackageSearch className="w-5 h-5" />
                    Rastreamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{order.tracking_number}</p>
                </CardContent>
              </Card>
            )}

            {/* Histórico de Alterações */}
            {order.history && order.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Histórico de Alterações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.history.map((item, idx) => (
                      <div key={idx} className="border-l-2 border-gray-200 pl-3 pb-3 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.change_type === 'status' && 'Status alterado'}
                              {item.change_type === 'payment_status' && 'Status de pagamento alterado'}
                              {item.change_type === 'tracking' && 'Rastreamento adicionado'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {item.old_value && `${item.old_value} → `}
                              <span className="font-semibold">{item.new_value}</span>
                            </p>
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {formatDate(item.created_at)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {item.changed_by_name || 'Sistema'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Confirmação de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cancelamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-notes">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="cancel-notes"
                placeholder="Descreva o motivo do cancelamento..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Envio */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Envio do Pedido</DialogTitle>
            <DialogDescription>
              Adicione o código de rastreamento e observações sobre o envio (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dialog-tracking" className="flex items-center gap-2">
                <PackageSearch className="w-4 h-4 text-indigo-600" />
                Código de Rastreamento
                <span className="text-xs text-gray-500 font-normal">(opcional mas recomendado)</span>
              </Label>
              <Input
                id="dialog-tracking"
                placeholder="Ex: BR123456789BR, AA123456789BR, etc."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-2"
              />
              <div className="flex items-start gap-2 mt-1">
                <Lightbulb className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  O cliente poderá rastrear o pedido usando este código
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="dialog-status-notes" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                Observações Internas
                <span className="text-xs text-gray-500 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="dialog-status-notes"
                placeholder="Ex: Enviado via Correios, prazo de entrega: 5-7 dias úteis..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
              <div className="flex items-start gap-2 mt-1">
                <FileText className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  Estas observações ficam apenas para você (não são visíveis ao cliente)
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowStatusDialog(false);
              setTrackingNumber("");
              setStatusNotes("");
            }}>
              Cancelar
            </Button>
            <Button onClick={async () => {
              console.log("Confirmando envio do pedido", { newStatus, trackingNumber, statusNotes });
              await performStatusUpdate();
            }} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Confirmar Envio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Status de Pagamento */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status de Pagamento</DialogTitle>
            <DialogDescription>
              Adicione uma observação sobre a alteração do status de pagamento (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="payment-notes">Observações</Label>
              <Textarea
                id="payment-notes"
                placeholder="Ex: Pagamento confirmado via PIX, comprovante anexado..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={performPaymentStatusUpdate} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

