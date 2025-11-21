
import React, { useState, useEffect } from 'react';
import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { Plan } from "@/api/entities";
import { fetchAndApplyPromotions } from "@/utils/promotions";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  Search,
  Filter,
  ShoppingBag,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  X,
  MessageSquare,
  Shield,
  Eye,
  AlertCircle,
  ArrowLeft,
  Home
} from "lucide-react";

export default function StoreFront() {
  const { id: storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [categories, setCategories] = useState([]);
  const [storeNotApproved, setStoreNotApproved] = useState(false);

  useEffect(() => {
    // Marcar que estamos na página StoreFront (loja individual)
    sessionStorage.setItem('lastPageSource', 'store');
    loadStorefront();
  }, [storeId]); // Recarregar quando o ID mudar

  useEffect(() => {
    if (products.length > 0) {
      filterAndSortProducts();
    }
  }, [products, searchTerm, selectedCategory, sortBy]);

  const loadStorefront = async () => {
    try {
      if (!storeId) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }

      const storeData = await Store.get(storeId);
      if (!storeData) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }
      
      if (storeData.status !== "approved") {
        setStoreNotApproved(true);
        setLoading(false);
        return;
      }
      
      setStore(storeData);

      const subscriptions = await Subscription.filter({ 
        store_id: storeId,
        status: "active"
      });
      
      if (subscriptions?.length > 0) {
        const plans = await Plan.list();
        const plan = plans.find(p => p.id === subscriptions[0].plan_id);
        setSubscription({ ...subscriptions[0], plan });
      }

      // Usar filtro direto na API em vez de carregar todos os produtos
      const storeProducts = await Product.filter({ 
        store_id: storeId 
      });
      
      // Filtrar apenas produtos ativos
      let activeProducts = storeProducts.filter(p => 
        p.active === true || p.active === 1
      );
      
      // Aplicar promoções aos produtos
      activeProducts = await fetchAndApplyPromotions(activeProducts, storeId);
      
      console.log(`Produtos encontrados para a loja ${storeId}:`, activeProducts.length);
      
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);

      const uniqueCategories = [...new Set(activeProducts.map(p => p.category_name || p.category))].filter(Boolean);
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      setError('Não foi possível carregar a loja');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        p.category === selectedCategory || 
        p.category_name === selectedCategory ||
        p.category_id === selectedCategory
      );
    }
    
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || a.created_date || 0);
          const dateB = new Date(b.created_at || b.created_date || 0);
          return dateB - dateA;
        });
        break;
      case 'popular':
        filtered.sort((a, b) => (b.total_views || 0) - (a.total_views || 0));
        break;
      default:
        break;
    }
    
    setFilteredProducts(filtered);
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (storeNotApproved) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link to={createPageUrl("Home")} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Voltar para a página inicial</span>
          </Link>
          
          <Card className="text-center p-6">
            <CardContent className="pt-10 pb-10">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Esta loja ainda não está disponível</h1>
              <p className="text-gray-600 mb-6">
                A loja que você está tentando acessar está aguardando aprovação do administrador.
                Por favor, tente novamente mais tarde.
              </p>
              
              <Button
                onClick={() => window.location.href = createPageUrl("Home")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para a página inicial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <X className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">{error || 'Loja não encontrada'}</h1>
            <p className="text-gray-600 mb-6">
              Não foi possível encontrar a loja que você está procurando.
            </p>
            
            <Button
              onClick={() => window.location.href = createPageUrl("Home")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div 
        className="h-48 md:h-64 bg-cover bg-center relative"
        style={{
          backgroundImage: store.banner 
            ? `url(${store.banner})` 
            : 'linear-gradient(to right, #4F46E5, #2563EB)'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center">
              {store.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.name} 
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <StoreIcon className="w-10 h-10 text-blue-600" />
                </div>
              )}
            </div>
            <h1 className="text-white text-2xl md:text-3xl font-bold mt-2">
              {store.name}
              {store.status !== "approved" && (
                <Badge className="ml-2 bg-red-500">Pendente de Aprovação</Badge>
              )}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600">{store.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {store.city_id && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {store.city_name || "Localização não informada"}
                    </div>
                  )}
                  {store.whatsapp && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="w-4 h-4 mr-1" />
                      {store.whatsapp}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Button 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (store.whatsapp) {
                      window.open(`https://wa.me/55${store.whatsapp}`, '_blank');
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Entrar em Contato
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-6">Produtos ({filteredProducts.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <div className="flex items-center">
                  <ArrowDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Ordenar por" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="price_asc">Menor Preço</SelectItem>
                <SelectItem value="price_desc">Maior Preço</SelectItem>
                <SelectItem value="popular">Mais Populares</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Tente ajustar seus filtros de busca' 
                    : 'Esta loja ainda não possui produtos cadastrados'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Link 
                  key={product.id}
                  to={`/produto/${product.id}`}
                  className="block"
                >
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative bg-gray-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      
                      {product.featured && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-yellow-500">Destaque</Badge>
                        </div>
                      )}

                      {product.compare_price > product.price && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-500">
                            {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-medium text-lg truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-2">{product.description}</p>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg text-green-600">
                          {formatCurrency(product.price)}
                        </span>
                        {product.compare_price > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(product.compare_price)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="w-4 h-4 mr-1" />
                        {product.total_views || 0} visualizações
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
