import React, { useState, useEffect } from "react";
import { Orders as OrdersAPI } from "@/api/apiClient";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Search, 
  Eye,
  Calendar,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StoreOnlineHeader, StoreOnlineFooter } from "@/components/store/StoreOnlineLayout";
import { StoreCustomizations } from "@/api/entities";
import LoginDialog from "@/components/LoginDialog";
import { formatCurrency } from "@/lib/utils";

export default function StoreOnlineOrders() {
  const { id: storeId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [customizations, setCustomizations] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    // Marcar que estamos na loja online premium
    sessionStorage.setItem('isInStoreOnline', 'true');
    sessionStorage.setItem('storeOnlineStoreId', storeId);
    
    loadData();
    
    return () => {
      // Não limpar o sessionStorage aqui, pois pode estar navegando para produto
    };
  }, [storeId]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, activeTab, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar loja e customizações
      const [storeData, customizationsData] = await Promise.all([
        Store.get(storeId).catch(() => null),
        StoreCustomizations.getByStore(storeId).catch(() => null)
      ]);

      if (!storeData) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }

      setStore(storeData);
      const finalCustomizations = customizationsData || {
        primary_color: '#2563eb',
        secondary_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#1f2937',
        header_color: '#ffffff',
        footer_color: '#f9fafb',
      };
      setCustomizations(finalCustomizations);
      
      // Salvar no sessionStorage para manter contexto
      sessionStorage.setItem('storeOnlineCustomizations', JSON.stringify(finalCustomizations));
      sessionStorage.setItem('storeOnlineStoreInfo', JSON.stringify({ 
        id: storeData.id, 
        name: storeData.name, 
        logo: storeData.logo 
      }));
      
      // Disparar evento para Layout
      window.dispatchEvent(new CustomEvent('storeOnlineEntered', { 
        detail: { 
          customizations: finalCustomizations, 
          store: { id: storeData.id, name: storeData.name, logo: storeData.logo } 
        } 
      }));

      // Verificar se usuário está autenticado
      try {
        const userData = await User.me();
        setUser(userData);
        await loadOrders();
      } catch (error) {
        // Usuário não autenticado
        setUser(null);
        setOrders([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError(error.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await OrdersAPI.list();
      const safeOrders = Array.isArray(ordersData) ? ordersData : [];
      
      // Filtrar apenas pedidos do usuário logado nesta loja específica
      const storeOrders = safeOrders.filter(order => 
        order && 
        order.user_id === user?.id && 
        order.store_id === storeId
      );
      
      setOrders(storeOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setOrders([]);
    }
  };

  const filterOrders = () => {
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Filtrar por status
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order && order.status === activeTab);
    }

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        if (!order) return false;
        const orderId = order.id?.toLowerCase() || "";
        const itemsText = Array.isArray(order.items) 
          ? order.items.map(item => item?.product_name?.toLowerCase() || "").join(" ") 
          : "";
        
        return orderId.includes(term) || itemsText.includes(term);
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
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800 border-blue-200" },
      processing: { label: "Processando", color: "bg-purple-100 text-purple-800 border-purple-200" },
      shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
      delivered: { label: "Entregue", color: "bg-green-100 text-green-800 border-green-200" },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
    };

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800 border-gray-200" };
    return (
      <Badge className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach(order => {
      if (order && order.status && counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });

    return counts;
  };

  const theme = customizations ? {
    primary: customizations.primary_color || '#2563eb',
    secondary: customizations.secondary_color || '#06b6d4',
    background: customizations.background_color || '#ffffff',
    text: customizations.text_color || '#1f2937',
    header: customizations.header_color || '#ffffff',
    footer: customizations.footer_color || '#f9fafb',
  } : null;

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme?.background || '#f9fafb' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme?.primary || '#2563eb' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme?.background || '#f9fafb' }}>
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
            <Button onClick={() => navigate(`/loja-online/${storeId}`)} className="w-full mt-4">
              Voltar para a loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor: theme?.background || '#f9fafb', color: theme?.text || '#1f2937' }}
      >
        {store && customizations && (
          <StoreOnlineHeader
            store={store}
            customizations={customizations}
            theme={theme}
            searchTerm=""
            setSearchTerm={() => {}}
            categories={[]}
            selectedCategory="all"
            setSelectedCategory={() => {}}
            onSearch={() => {}}
          />
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
              <p className="text-gray-600 mb-6">
                Você precisa estar logado para visualizar seus pedidos nesta loja.
              </p>
              <Button 
                onClick={() => setLoginDialogOpen(true)}
                style={{ backgroundColor: theme?.primary || '#2563eb', color: 'white' }}
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>

        {store && customizations && (
          <StoreOnlineFooter store={store} customizations={customizations} theme={theme} />
        )}

        <LoginDialog 
          open={loginDialogOpen} 
          onOpenChange={setLoginDialogOpen}
          onSuccess={() => {
            loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: theme?.background || '#f9fafb', color: theme?.text || '#1f2937' }}
    >
      {store && customizations && (
        <StoreOnlineHeader
          store={store}
          customizations={customizations}
          theme={theme}
          searchTerm=""
          setSearchTerm={() => {}}
          categories={[]}
          selectedCategory="all"
          setSelectedCategory={() => {}}
          onSearch={() => {}}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/loja-online/${storeId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a loja
          </Button>
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">Visualize seus pedidos realizados nesta loja</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs de Status */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">Todos ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pendente ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmado ({statusCounts.confirmed})</TabsTrigger>
            <TabsTrigger value="processing">Processando ({statusCounts.processing})</TabsTrigger>
            <TabsTrigger value="shipped">Enviado ({statusCounts.shipped})</TabsTrigger>
            <TabsTrigger value="delivered">Entregue ({statusCounts.delivered})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelado ({statusCounts.cancelled})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de Pedidos */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">
                {orders.length === 0 ? "Nenhum pedido encontrado" : "Nenhum pedido encontrado com os filtros selecionados"}
              </h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0 
                  ? "Você ainda não realizou nenhum pedido nesta loja."
                  : "Tente ajustar os filtros de busca ou status."}
              </p>
              <Button 
                onClick={() => navigate(`/loja-online/${storeId}`)}
                style={{ backgroundColor: theme?.primary || '#2563eb', color: 'white' }}
              >
                Ver Produtos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Pedido #{order.id?.substring(0, 8)}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {order.created_at 
                            ? format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                            : "Data não disponível"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/pedido/${order.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Produtos:</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="font-medium">{item.product_name || "Produto"}</p>
                                <p className="text-sm text-gray-600">
                                  Quantidade: {item.quantity || 1} × {formatCurrency(item.price || 0)}
                                </p>
                              </div>
                              <p className="font-semibold">
                                {formatCurrency(item.total || 0)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold" style={{ color: theme?.primary || '#2563eb' }}>
                        {formatCurrency(order.total || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {store && customizations && (
        <StoreOnlineFooter store={store} customizations={customizations} theme={theme} />
      )}
    </div>
  );
}

