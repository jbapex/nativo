import React, { useState, useEffect } from "react";
import { Orders as OrdersAPI } from "@/api/apiClient";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Search, 
  Filter,
  Eye,
  Calendar,
  Store,
  User as UserIcon,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userStore, setUserStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [orderTypeTab, setOrderTypeTab] = useState("all"); // "all", "received", "purchases"

  useEffect(() => {
    loadUser();
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, activeTab, orderTypeTab, userStore]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Se for lojista, carregar a loja do usuário
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
      setError(null);
      const ordersData = await OrdersAPI.list();
      // Garantir que sempre seja um array
      const safeOrders = Array.isArray(ordersData) ? ordersData : [];
      setOrders(safeOrders);
      setFilteredOrders(safeOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setError(error.message || "Não foi possível carregar os pedidos. Tente novamente.");
      // Em caso de erro, definir arrays vazios
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    // Garantir que orders seja um array
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Filtrar por tipo de pedido (para lojistas: recebidos vs compras)
    if (isStore && userStore && orderTypeTab !== "all") {
      if (orderTypeTab === "received") {
        // Apenas pedidos recebidos (da loja do usuário)
        filtered = filtered.filter(order => order && order.store_id === userStore.id);
      } else if (orderTypeTab === "purchases") {
        // Apenas compras feitas (pedidos onde o usuário é o comprador)
        filtered = filtered.filter(order => order && order.user_id === user?.id && order.store_id !== userStore.id);
      }
    }

    // Filtrar por aba (all, pending, confirmed, processing, shipped, delivered, cancelled)
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order && order.status === activeTab);
    }

    // Filtrar por status adicional (se não for "all")
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order && order.status === statusFilter);
    }

    // Filtrar por busca (nome do produto, ID do pedido, nome da loja/cliente)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        if (!order) return false;
        const orderId = order.id?.toLowerCase() || "";
        const storeName = order.store_name?.toLowerCase() || "";
        const userName = order.user_name?.toLowerCase() || "";
        const itemsText = Array.isArray(order.items) 
          ? order.items.map(item => item?.product_name?.toLowerCase() || "").join(" ") 
          : "";
        
        return orderId.includes(term) || 
               storeName.includes(term) || 
               userName.includes(term) ||
               itemsText.includes(term);
      });
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => {
      if (!a || !b) return 0;
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      confirmed: { label: "Confirmado", variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      processing: { label: "Processando", variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
      shipped: { label: "Enviado", variant: "outline", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      delivered: { label: "Entregue", variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      cancelled: { label: "Cancelado", variant: "outline", className: "bg-red-50 text-red-700 border-red-200" },
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
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isStore = user?.role === 'store';
  const isAdmin = user?.role === 'admin';

  const getStatusCounts = () => {
    if (!Array.isArray(orders)) {
      return {
        all: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
    }
    
    // Filtrar pedidos baseado no orderTypeTab se for lojista
    let ordersToCount = orders;
    if (isStore && userStore && orderTypeTab !== "all") {
      if (orderTypeTab === "received") {
        ordersToCount = orders.filter(o => o && o.store_id === userStore.id);
      } else if (orderTypeTab === "purchases") {
        ordersToCount = orders.filter(o => o && o.user_id === user?.id && o.store_id !== userStore.id);
      }
    }
    
    return {
      all: ordersToCount.length,
      pending: ordersToCount.filter(o => o && o.status === 'pending').length,
      confirmed: ordersToCount.filter(o => o && o.status === 'confirmed').length,
      processing: ordersToCount.filter(o => o && o.status === 'processing').length,
      shipped: ordersToCount.filter(o => o && o.status === 'shipped').length,
      delivered: ordersToCount.filter(o => o && o.status === 'delivered').length,
      cancelled: ordersToCount.filter(o => o && o.status === 'cancelled').length,
    };
  };
  
  const getOrderTypeCounts = () => {
    if (!isStore || !userStore || !Array.isArray(orders)) {
      return { received: 0, purchases: 0 };
    }
    
    const received = orders.filter(o => o && o.store_id === userStore.id).length;
    const purchases = orders.filter(o => o && o.user_id === user?.id && o.store_id !== userStore.id).length;
    
    return { received, purchases };
  };

  const statusCounts = getStatusCounts();
  const orderTypeCounts = getOrderTypeCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erro ao carregar pedidos
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadOrders} variant="outline">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {isStore ? "Pedidos da Loja" : isAdmin ? "Todos os Pedidos" : "Meus Pedidos"}
            </h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {isStore 
                ? "Gerencie os pedidos recebidos na sua loja"
                : isAdmin
                ? "Visualize e gerencie todos os pedidos do sistema"
                : "Acompanhe o status dos seus pedidos"
              }
            </p>
            {isStore && userStore && (
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("MyPurchases"))}
                className="flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Minhas Compras
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por ID, produto, loja ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Tipo de Pedido (apenas para lojistas) */}
        {isStore && userStore && (
          <Tabs value={orderTypeTab} onValueChange={setOrderTypeTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">
                Todos os Pedidos ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="received">
                Pedidos Recebidos ({orderTypeCounts.received})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Tabs de Status */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">
              Todos ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendente ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmado ({statusCounts.confirmed})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processando ({statusCounts.processing})
            </TabsTrigger>
            <TabsTrigger value="shipped">
              Enviado ({statusCounts.shipped})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Entregue ({statusCounts.delivered})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelado ({statusCounts.cancelled})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de Pedidos */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" || activeTab !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : isStore
                  ? "Ainda não há pedidos na sua loja"
                  : "Você ainda não fez nenhum pedido"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              // Verificar se o pedido é da loja do usuário (recebido) ou uma compra feita por ele
              const isMyPurchase = user && order.user_id === user.id;
              const isMyStoreOrder = isStore && userStore && order.store_id === userStore.id;
              
              return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Pedido #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            {isStore && (
                              <>
                                {isMyStoreOrder && (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                    Pedido Recebido
                                  </Badge>
                                )}
                                {isMyPurchase && !isMyStoreOrder && (
                                  <Badge className="bg-green-50 text-green-700 border-green-200">
                                    Minha Compra
                                  </Badge>
                                )}
                              </>
                            )}
                            {getStatusBadge(order.status)}
                            {getPaymentStatusBadge(order.payment_status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.created_at)}
                            </div>
                            {isStore && isMyStoreOrder && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                Cliente: {order.user_name || order.user_email}
                              </div>
                            )}
                            {isStore && isMyPurchase && !isMyStoreOrder && (
                              <div className="flex items-center gap-1">
                                <Store className="w-4 h-4" />
                                Loja: {order.store_name}
                              </div>
                            )}
                            {!isStore && order.store_name && (
                              <div className="flex items-center gap-1">
                                <Store className="w-4 h-4" />
                                {order.store_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Itens do pedido */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item.product_name} x{item.quantity}
                            </Badge>
                          ))}
                          {order.items?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{order.items.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Total e ações */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-end lg:items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(createPageUrl(`OrderDetail?id=${order.id}`))}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

