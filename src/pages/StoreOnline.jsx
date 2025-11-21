import React, { useState, useEffect, useMemo } from 'react';
import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { StoreCustomizations } from "@/api/entities";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { fetchAndApplyPromotions } from "@/utils/promotions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  AlertCircle,
  Star,
  Truck,
  Filter,
  X,
  Instagram,
  Facebook,
  MessageSquare,
} from "lucide-react";
import { StoreOnlineHeader, StoreOnlineFooter } from "@/components/store/StoreOnlineLayout";

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function StoreOnline() {
  const { id: storeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [customizations, setCustomizations] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    loadStoreOnline();
  }, [storeId, searchParams]);

  useEffect(() => {
    // Verificar se há busca na URL
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    
    // Verificar categoria na URL
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (products.length > 0) {
      filterAndSortProducts();
    }
  }, [products, searchTerm, selectedCategory, sortBy, minPrice, maxPrice]);

  const loadStoreOnline = async () => {
    try {
      if (!storeId) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }

      // Carregar loja e customizações em paralelo
      const [storeData, customizationsData] = await Promise.all([
        Store.get(storeId).catch(() => null),
        StoreCustomizations.getByStore(storeId).catch(() => null)
      ]);

      if (!storeData) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }
      
      if (storeData.status !== "approved") {
        setError('Esta loja ainda não está disponível');
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
        banner_enabled: true,
        about_section_enabled: true,
        featured_section_enabled: true,
        categories_section_enabled: true,
        contact_section_enabled: true,
        layout_style: 'modern',
        show_search: true,
        show_categories: true
      };
      
      setCustomizations(finalCustomizations);
      
      const storeInfo = {
        id: storeData.id,
        name: storeData.name || storeData.display_name || storeData.fantasy_name,
        logo: storeData.logo_url || storeData.logo || storeData.banner_image || null,
        city: storeData.city_name || storeData.city,
        plan: storeData.plan_id,
      };
      
      // Salvar customizações no sessionStorage para aplicar em todas as páginas
      sessionStorage.setItem('storeOnlineCustomizations', JSON.stringify(finalCustomizations));
      sessionStorage.setItem('storeOnlineStoreId', storeId);
      sessionStorage.setItem('storeOnlineStoreInfo', JSON.stringify(storeInfo));
      sessionStorage.setItem('isInStoreOnline', 'true');
      
      // Disparar evento para que Layout e outras páginas saibam que estamos na loja premium
      window.dispatchEvent(new CustomEvent('storeOnlineEntered', { 
        detail: { customizations: finalCustomizations, storeId, store: storeInfo } 
      }));

      // Carregar produtos
      const storeProducts = await Product.filter({ store_id: storeId });
      let activeProducts = storeProducts.filter(p => 
        p.active === true || p.active === 1
      );
      
      // Aplicar promoções aos produtos
      activeProducts = await fetchAndApplyPromotions(activeProducts, storeId);
      
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

    // Filtro de preço
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter(p => (p.price || 0) >= min);
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter(p => (p.price || 0) <= max);
      }
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
      default:
        break;
    }
    
    setFilteredProducts(filtered);
  };

  const handleSearch = () => {
    const storeId = searchParams.get('id');
    navigate(`/StoreOnline?id=${storeId}&view=products&search=${encodeURIComponent(searchTerm)}`);
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 mx-auto mb-4" style={{ borderColor: '#2563eb' }}></div>
          <p className="text-gray-600">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
              <h1 className="text-2xl font-bold mb-4">{error}</h1>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!store || !customizations) return null;

  const theme = {
    primary: customizations.primary_color || '#2563eb',
    secondary: customizations.secondary_color || '#06b6d4',
    background: customizations.background_color || '#ffffff',
    text: customizations.text_color || '#1f2937',
    header: customizations.header_color || '#ffffff',
    footer: customizations.footer_color || '#f9fafb',
  };

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <StoreOnlineHeader
        store={store}
        customizations={customizations}
        theme={theme}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botão de Filtros Mobile */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar de Filtros */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Filtros</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filtro de Preço */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">Preço</label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Mínimo"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Máximo"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Ordenação */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="price_asc">Menor preço</SelectItem>
                      <SelectItem value="price_desc">Maior preço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contador de Resultados */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>{filteredProducts.length}</strong> produto(s) encontrado(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1">
            {/* Todos os Produtos */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Todos os Produtos</h2>
              
              {filteredProducts.length === 0 ? (
                <Card className="text-center p-12">
                  <CardContent>
                    <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">Nenhum produto encontrado</p>
                    <p className="text-gray-500 text-sm mt-2">Tente ajustar os filtros</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} theme={theme} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <StoreOnlineFooter store={store} customizations={customizations} theme={theme} />
    </div>
  );
}

// Componente de Card de Produto Estilo Mercado Livre
function ProductCard({ product, theme }) {
  // Verificar se tem promoção ou compare_price
  const hasDiscount = (product.compare_price && product.compare_price > product.price) || 
                     (product.has_promotion && product.promotion);
  const discountPercent = hasDiscount 
    ? (product.discount_percent || (product.compare_price && product.price 
        ? Math.round((1 - product.price / product.compare_price) * 100)
        : 0))
    : 0;

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Link 
      to={`/produto/${product.id}`}
      className="block group"
    >
      <Card className="h-full overflow-hidden border-2 hover:border-opacity-100 transition-all duration-300 hover:shadow-xl bg-white">
        <div className="aspect-square relative bg-gray-100 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
          )}
          
          {/* Badge de Desconto */}
          {hasDiscount && discountPercent > 0 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white font-bold px-2 py-1 text-xs">
                {discountPercent}% OFF
              </Badge>
            </div>
          )}
          
          {/* Badge de Frete Grátis */}
          {product.promotion && product.promotion.discount_type === 'free_shipping' && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-500 text-white font-bold px-2 py-1 text-xs">
                Frete Grátis
              </Badge>
            </div>
          )}

          {/* Badge de Destaque */}
          {product.featured && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-500 text-white font-bold px-2 py-1 text-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                Destaque
              </Badge>
            </div>
          )}

          {/* Overlay no hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity duration-300"></div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-opacity-80 transition-colors">
            {product.name}
          </h3>
          
          {/* Preço */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span 
                className="text-xl font-bold"
                style={{ color: theme.primary }}
              >
                {formatCurrency(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-500 line-through">
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>
            {product.price > 100 && (
              <p className="text-xs text-gray-600 mt-1">
                em até 12x sem juros
              </p>
            )}
          </div>

          {/* Frete Grátis */}
          {product.price > 19 && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
              <Truck className="w-3 h-3" />
              Frete grátis
            </div>
          )}

          {/* Botão de Ação */}
          <Button
            className="w-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
            style={{ backgroundColor: theme.primary, color: 'white' }}
            onClick={(e) => e.preventDefault()}
          >
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
