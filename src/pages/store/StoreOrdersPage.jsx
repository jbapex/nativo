import React, { useState, useEffect } from "react";
import { Orders as OrdersAPI } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Search, Package, CheckCircle, XCircle, Clock, Truck, AlertCircle } from "lucide-react";

export default function StoreOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userStore, setUserStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadUser();
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, activeTab, userStore]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Carregar a loja do usuário
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

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await OrdersAPI.list();
      setOrders(ordersData || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // IMPORTANTE: Filtrar APENAS pedidos recebidos (da loja do usuário)
    // NÃO mostrar compras feitas pelo lojista em outras lojas
    // Apenas pedidos onde a loja do pedido (store_id) é igual à loja do usuário logado
    if (userStore && userStore.id) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(order => {
        // Garantir que o pedido existe e que o store_id corresponde à loja do usuário
        // EXCLUIR pedidos onde o user_id é igual ao user.id (compras do lojista)
        const isReceivedOrder = order && 
                                order.store_id && 
                                order.store_id === userStore.id;
        return isReceivedOrder;
      });
      console.log(`[StoreOrdersPage] Filtro aplicado: ${beforeFilter} pedidos -> ${filtered.length} pedidos recebidos (loja: ${userStore.id})`);
    } else {
      // Se não tiver loja carregada ainda, não mostrar nenhum pedido
      filtered = [];
      if (orders.length > 0) {
        console.log('[StoreOrdersPage] Aguardando carregamento da loja do usuário...');
      }
    }

    // Filtrar por status
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.id?.toLowerCase().includes(term) ||
        order.user_name?.toLowerCase().includes(term) ||
        order.user_email?.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800", icon: Clock },
      confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-800", icon: CheckCircle },
      processing: { label: "Processando", className: "bg-purple-100 text-purple-800", icon: Package },
      shipped: { label: "Enviado", className: "bg-indigo-100 text-indigo-800", icon: Truck },
      delivered: { label: "Entregue", className: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Pago", className: "bg-green-100 text-green-800" },
      refunded: { label: "Reembolsado", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[paymentStatus] || { label: paymentStatus, className: "bg-gray-100 text-gray-800" };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusCounts = () => {
    // IMPORTANTE: Filtrar APENAS pedidos recebidos (da loja do usuário)
    // NÃO incluir compras feitas pelo lojista em outras lojas
    const receivedOrders = userStore && userStore.id
      ? orders.filter(o => o && o.store_id && o.store_id === userStore.id)
      : [];
    
    return {
      all: receivedOrders.length,
      pending: receivedOrders.filter(o => o.status === 'pending').length,
      confirmed: receivedOrders.filter(o => o.status === 'confirmed').length,
      processing: receivedOrders.filter(o => o.status === 'processing').length,
      shipped: receivedOrders.filter(o => o.status === 'shipped').length,
      delivered: receivedOrders.filter(o => o.status === 'delivered').length,
      cancelled: receivedOrders.filter(o => o.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-600 mt-1">Gerencie os pedidos da sua loja</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">Todos ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmados ({statusCounts.confirmed})</TabsTrigger>
          <TabsTrigger value="processing">Processando ({statusCounts.processing})</TabsTrigger>
          <TabsTrigger value="shipped">Enviados ({statusCounts.shipped})</TabsTrigger>
          <TabsTrigger value="delivered">Entregues ({statusCounts.delivered})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados ({statusCounts.cancelled})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum pedido encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(createPageUrl(`OrderDetail?id=${order.id}`))}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">Pedido #{order.id.slice(0, 8)}</h3>
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Cliente:</strong> {order.user_name || 'N/A'} ({order.user_email || 'N/A'})</p>
                          <p><strong>Data:</strong> {formatDate(order.created_at)}</p>
                          <p><strong>Itens:</strong> {order.items?.length || 0} produto(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(parseFloat(order.total_amount || 0))}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(createPageUrl(`OrderDetail?id=${order.id}`));
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}