import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Eye, 
  MessageSquare, 
  Heart, 
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Share2,
  ExternalLink,
  Copy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Orders as OrdersAPI } from "@/api/entities";
import StoreDashboard from "@/components/store/StoreDashboard";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StoreDashboardPage({ store, products, plan, isStoreOnlineActive }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    viewsFromMarketplace: 0,
    viewsFromStore: 0,
    totalMessages: 0,
    totalFavorites: 0,
    pendingOrders: 0,
    totalOrders: 0
  });

  useEffect(() => {
    if (store) {
      calculateStats();
      loadOrders();
    }
  }, [store, products]);

  const calculateStats = () => {
    const totalProducts = products?.length || 0;
    const totalViews = products?.reduce((sum, p) => sum + (Number(p.total_views) || 0), 0) || 0;
    const viewsFromMarketplace = products?.reduce((sum, p) => sum + (Number(p.views_from_marketplace) || 0), 0) || 0;
    const viewsFromStore = products?.reduce((sum, p) => sum + (Number(p.views_from_store) || 0), 0) || 0;
    const totalMessages = products?.reduce((sum, p) => sum + (Number(p.total_messages) || 0), 0) || 0;
    const totalFavorites = products?.reduce((sum, p) => sum + (Number(p.total_favorites) || 0), 0) || 0;

    setStats({
      totalProducts,
      totalViews,
      viewsFromMarketplace,
      viewsFromStore,
      totalMessages,
      totalFavorites,
      pendingOrders: 0, // Será atualizado quando carregar pedidos
      totalOrders: 0
    });
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const ordersData = await OrdersAPI.list();
      setOrders(ordersData || []);
      
      const pendingOrders = ordersData?.filter(o => 
        o.status === 'pending' || o.status === 'processing'
      ).length || 0;

      setStats(prev => ({
        ...prev,
        pendingOrders,
        totalOrders: ordersData?.length || 0
      }));
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCopyLink = (type = 'storefront') => {
    const link = type === 'storeonline' 
      ? `${window.location.origin}${createPageUrl(`StoreOnline?id=${store?.id}`)}`
      : `${window.location.origin}${createPageUrl(`StoreFront?id=${store?.id}`)}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: `O link da sua ${type === 'storeonline' ? 'loja online premium' : 'loja'} foi copiado para a área de transferência.`,
    });
  };

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral da sua loja</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(createPageUrl("AddProduct"))}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={store?.status !== "approved"}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
          {store?.status === "approved" && (
            <Button
              variant="outline"
              onClick={handleCopyLink}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar Loja
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {store?.status !== "approved" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800">Loja aguardando aprovação</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Sua loja está aguardando aprovação por um administrador. Algumas funcionalidades estarão disponíveis apenas após a aprovação.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Produtos</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalProducts}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full"
              onClick={() => navigate(createPageUrl("StoreProducts"))}
            >
              Ver todos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pedidos Pendentes</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pendingOrders}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full"
              onClick={() => navigate(createPageUrl("StoreOrders"))}
            >
              Ver pedidos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Visualizações</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalViews.toLocaleString('pt-BR')}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">NATIVO Home:</span>
                    <span className="font-semibold text-blue-600">{stats.viewsFromMarketplace?.toLocaleString('pt-BR') || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Sua Loja:</span>
                    <span className="font-semibold text-green-600">{stats.viewsFromStore?.toLocaleString('pt-BR') || 0}</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full"
              onClick={() => navigate(createPageUrl("StoreAnalytics"))}
            >
              Ver estatísticas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Favoritos</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalFavorites}</h3>
                <p className="text-xs text-gray-500 mt-1">Total de favoritos</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Link Card */}
      {store?.status === "approved" && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              Sua Vitrine
            </CardTitle>
            <CardDescription>
              Compartilhe sua loja com seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white rounded-md p-2 border">
                  <p className="text-sm text-gray-600 truncate">
                    {window.location.origin}{createPageUrl(`StoreFront?id=${store?.id}`)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(createPageUrl(`StoreFront?id=${store?.id}`), '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
              </div>

              {isStoreOnlineActive && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-800 font-medium mb-3">
                    <CheckCircle className="w-4 h-4" />
                    <span>Modo Loja Online Premium Ativo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-md p-2 border">
                      <p className="text-sm text-gray-600 truncate">
                        {window.location.origin}{createPageUrl(`StoreOnline?id=${store?.id}`)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink('storeonline')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(createPageUrl(`StoreOnline?id=${store?.id}`), '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>Últimos 5 pedidos recebidos</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl("StoreOrders"))}
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(createPageUrl(`OrderDetail?id=${order.id}`))}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                      <Badge
                        variant={
                          order.status === 'pending' ? 'outline' :
                          order.status === 'confirmed' ? 'default' :
                          order.status === 'delivered' ? 'default' : 'secondary'
                        }
                        className={
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {order.status === 'pending' ? 'Pendente' :
                         order.status === 'confirmed' ? 'Confirmado' :
                         order.status === 'processing' ? 'Processando' :
                         order.status === 'shipped' ? 'Enviado' :
                         order.status === 'delivered' ? 'Entregue' :
                         order.status === 'cancelled' ? 'Cancelado' : order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.user_name || 'Cliente'} • {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {parseFloat(order.total_amount || 0).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Preview */}
      {products && products.length > 0 && (
        <StoreDashboard
          store={store}
          products={products}
          stats={{
            totalProducts: stats.totalProducts,
            totalViews: stats.totalViews,
            totalMessages: stats.totalMessages,
            totalFavorites: stats.totalFavorites
          }}
        />
      )}
    </div>
  );
}

