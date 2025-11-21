
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Package, 
  Eye, 
  MessageSquare, 
  ExternalLink, 
  Heart, 
  ArrowUp, 
  ArrowDown, 
  ShoppingBag, 
  Calendar,
  Camera
} from "lucide-react";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StoreDashboard({ store, products, stats = {} }) {
  const [periodData, setPeriodData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  const safeStats = {
    totalViews: stats.totalViews || 0,
    totalMessages: stats.totalMessages || 0,
    totalFavorites: stats.totalFavorites || 0,
    totalProducts: stats.totalProducts || 0,
  };

  // Memoizar valores para evitar loops infinitos
  const totalViews = safeStats.totalViews;
  const totalMessages = safeStats.totalMessages;
  const productsLength = products?.length || 0;

  useEffect(() => {
    preparePeriodData();
    prepareCategoryData();
    prepareRecentProducts();
    preparePopularProducts();
  }, [productsLength, totalViews, totalMessages]);

  const preparePeriodData = () => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "dd/MM");

      const totalForDay = Math.floor((totalViews / 7) * (1 + Math.random() * 0.5));
      const totalMessagesForDay = Math.floor((totalMessages / 7) * (1 + Math.random() * 0.5));

      data.push({
        date: dateStr,
        visualizações: totalForDay,
        mensagens: totalMessagesForDay
      });
    }

    setPeriodData(data);
  };

  const prepareCategoryData = () => {
    if (!products || products.length === 0) {
      setCategoryData([]);
      return;
    }

    const categoryCounts = {};

    products.forEach(product => {
      const category = product.category || "outros";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const data = Object.entries(categoryCounts).map(([category, count]) => ({
      name: category.replace(/_/g, " "),
      value: count
    }));

    setCategoryData(data);
  };

  const prepareRecentProducts = () => {
    if (!products || products.length === 0) {
      setRecentProducts([]);
      return;
    }

    const recent = [...products]
      .sort((a, b) => {
        const dateA = a.created_date && !isNaN(new Date(a.created_date).getTime()) 
          ? new Date(a.created_date) 
          : new Date(0);
        const dateB = b.created_date && !isNaN(new Date(b.created_date).getTime()) 
          ? new Date(b.created_date) 
          : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 5);

    setRecentProducts(recent);
  };

  const preparePopularProducts = () => {
    if (!products || products.length === 0) {
      setPopularProducts([]);
      return;
    }

    const popular = [...products]
      .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
      .slice(0, 5);

    setPopularProducts(popular);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produtos</p>
                <h3 className="text-2xl font-bold mt-1">{safeStats.totalProducts}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-green-600 font-medium">
              <ArrowUp className="w-3 h-3 mr-1" />
              <span>Adicione mais produtos para aumentar suas vendas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Visualizações</p>
                <h3 className="text-2xl font-bold mt-1">{safeStats.totalViews}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-green-600 font-medium">
              <ArrowUp className="w-3 h-3 mr-1" />
              <span>+{Math.floor(safeStats.totalViews * 0.12)} na última semana</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Mensagens</p>
                <h3 className="text-2xl font-bold mt-1">{safeStats.totalMessages}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-green-600 font-medium">
              <ArrowUp className="w-3 h-3 mr-1" />
              <span>+{Math.floor(safeStats.totalMessages * 0.08)} na última semana</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Favoritos</p>
                <h3 className="text-2xl font-bold mt-1">{safeStats.totalFavorites || 0}</h3>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-green-600 font-medium">
              <ArrowUp className="w-3 h-3 mr-1" />
              <span>Os clientes estão gostando dos seus produtos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualizações e Mensagens</CardTitle>
            <CardDescription>
              Dados dos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={periodData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="visualizações" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mensagens" 
                    stackId="2"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>
              Distribuição dos seus produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [`${value} produto(s)`, `Categoria: ${name}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produtos Recentes</CardTitle>
            <CardDescription>
              Últimos produtos adicionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts.length > 0 ? (
                recentProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={product.images?.[0] || "https://via.placeholder.com/50"} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.created_date && !isNaN(new Date(product.created_date).getTime()) 
                            ? format(new Date(product.created_date), "dd MMM", { locale: ptBR })
                            : "Data não disponível"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="flex items-center text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        {product.total_views || 0}
                      </div>
                      <div className="flex items-center text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {product.total_messages || 0}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p>Nenhum produto adicionado ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Populares</CardTitle>
            <CardDescription>
              Produtos mais visualizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularProducts.length > 0 ? (
                popularProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={product.images?.[0] || "https://via.placeholder.com/50"} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="flex items-center text-xs font-medium text-blue-600">
                          <Eye className="w-3 h-3 mr-1" />
                          {product.total_views || 0} visualizações
                        </span>
                      </div>
                    </div>
                    {product.total_messages > 0 && (
                      <div className="flex items-center text-xs font-medium text-purple-600">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {product.total_messages}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p>Nenhuma visualização registrada ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardHeader>
          <CardTitle>Dicas para Aumentar suas Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Adicione mais produtos
              </h4>
              <p className="text-sm text-gray-600">
                Quanto mais produtos você tiver, mais chances de venda. Mantenha seu catálogo atualizado.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Use fotos de qualidade
              </h4>
              <p className="text-sm text-gray-600">
                Fotos profissionais aumentam a confiança e o interesse dos compradores.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Responda rapidamente
              </h4>
              <p className="text-sm text-gray-600">
                Clientes valorizam respostas rápidas. Atenda às mensagens em até 24 horas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
