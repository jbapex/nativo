import React, { useState, useEffect, useMemo } from 'react';
import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { StoreCustomizations } from "@/api/entities";
import { User } from "@/api/entities";
import { Cart as CartAPI } from "@/api/apiClient";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { fetchAndApplyPromotions } from "@/utils/promotions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ShoppingBag,
  AlertCircle,
  Star,
  Truck,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
  ShoppingCart,
} from "lucide-react";
import { StoreOnlineHeader, StoreOnlineFooter } from "@/components/store/StoreOnlineLayout";
import { useToast } from "@/components/ui/use-toast";
import LoginDialog from "@/components/LoginDialog";

export const pagePermissions = {
  public: true,
  loginRequired: false
};

// Componente de Auto-play do Carrossel
function BannerAutoPlay({ banners, currentIndex, setCurrentIndex }) {
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Troca a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [banners.length, setCurrentIndex]);
  
  return null;
}

// Componente de Card de Produto
function ProductCard({ product, theme, store, onAddToCart, user, addingToCart }) {
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
          
          {hasDiscount && discountPercent > 0 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-red-500 text-white font-bold px-2 py-1 text-xs">
                {discountPercent}% OFF
              </Badge>
            </div>
          )}
          
          {product.promotion && product.promotion.discount_type === 'free_shipping' && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-500 text-white font-bold px-2 py-1 text-xs">
                Frete Grátis
              </Badge>
            </div>
          )}

          {product.featured && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-yellow-500 text-white font-bold px-2 py-1 text-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                Destaque
              </Badge>
            </div>
          )}

          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity duration-300"></div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-opacity-80 transition-colors">
            {product.name}
          </h3>
          
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

          {product.price > 19 && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
              <Truck className="w-3 h-3" />
              Frete grátis
            </div>
          )}

          {/* Botões de Ação */}
          {store?.checkout_enabled ? (
            <div className="flex gap-2">
              <Button
                className="flex-1 text-sm font-semibold shadow-sm hover:shadow-md transition-shadow bg-blue-600 hover:bg-blue-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onAddToCart) onAddToCart(product);
                }}
                disabled={addingToCart?.[product.id]}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                {addingToCart?.[product.id] ? "Adicionando..." : "Carrinho"}
              </Button>
              <Button
                className="flex-1 text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: theme.primary, color: 'white' }}
                onClick={(e) => e.preventDefault()}
              >
                Ver Detalhes
              </Button>
            </div>
          ) : (
            <Button
              className="w-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: theme.primary, color: 'white' }}
              onClick={(e) => e.preventDefault()}
            >
              Ver Detalhes
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StoreOnlineHome() {
  const { id: storeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [customizations, setCustomizations] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    // Marcar que estamos na página StoreOnline (loja individual)
    sessionStorage.setItem('lastPageSource', 'store');
    loadStoreOnline();
    checkUser();
  }, [storeId]); // Recarregar quando o ID mudar

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    try {
      setAddingToCart(prev => ({ ...prev, [product.id]: true }));
      await CartAPI.addItem(product.id, 1);
      
      toast({
        title: "Produto adicionado!",
        description: `${product.name} foi adicionado ao carrinho`,
      });

      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar ao carrinho",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const loadStoreOnline = async () => {
    try {
      if (!storeId) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }

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
      
      // Garantir que banners seja um array
      let banners = [];
      if (customizationsData?.banners && Array.isArray(customizationsData.banners)) {
        banners = customizationsData.banners;
      } else if (customizationsData?.banner_image) {
        // Compatibilidade: converter banner antigo para array
        banners = [{
          image: customizationsData.banner_image,
          text: customizationsData.banner_text || '',
          order: 0
        }];
      }
      
      const finalCustomizations = {
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
        show_categories: true,
        banners: banners,
        ...customizationsData
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

      const storeProducts = await Product.filter({ store_id: storeId });
      let activeProducts = storeProducts.filter(p => 
        p.active === true || p.active === 1
      );
      
      // Aplicar promoções aos produtos
      activeProducts = await fetchAndApplyPromotions(activeProducts, storeId);
      
      setProducts(activeProducts);

      const uniqueCategories = [...new Set(activeProducts.map(p => p.category_name || p.category))].filter(Boolean);
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      setError('Não foi possível carregar a loja');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    navigate(`/loja-online/${storeId}?view=products&search=${encodeURIComponent(searchTerm)}`);
  };

  // Produtos em destaque (primeiros 8)
  const featuredProducts = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  // Produtos mais vendidos (baseado em views)
  const bestSellers = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
      .slice(0, 8);
  }, [products]);

  // Produtos recentes
  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.created_date || 0);
        const dateB = new Date(b.created_at || b.created_date || 0);
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [products]);

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

      {/* Carrossel de Banners */}
      {customizations.banner_enabled && customizations.banners && customizations.banners.length > 0 && (
        <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          {/* Container do carrossel */}
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {customizations.banners.map((banner, index) => (
              <div
                key={index}
                className="min-w-full h-full bg-cover bg-center relative"
                style={{ backgroundImage: `url(${banner.image})` }}
              >
                {banner.text && (
                  <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                      <div className="max-w-3xl">
                        <h2 
                          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg"
                          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                        >
                          {banner.text}
                        </h2>
                        <Link
                          to={`/StoreOnline?id=${store.id}&view=products`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                          style={{ color: theme.primary }}
                        >
                          Ver Produtos
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botões de navegação */}
          {customizations.banners.length > 1 && (
            <>
              <button
                onClick={() => setCurrentBannerIndex((prev) => 
                  prev === 0 ? customizations.banners.length - 1 : prev - 1
                )}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="w-6 h-6" style={{ color: theme.primary }} />
              </button>
              <button
                onClick={() => setCurrentBannerIndex((prev) => 
                  prev === customizations.banners.length - 1 ? 0 : prev + 1
                )}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                aria-label="Próximo banner"
              >
                <ChevronRight className="w-6 h-6" style={{ color: theme.primary }} />
              </button>

              {/* Indicadores de página */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {customizations.banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentBannerIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Auto-play (troca automática a cada 5 segundos) */}
          {customizations.banners.length > 1 && (
            <BannerAutoPlay
              banners={customizations.banners}
              currentIndex={currentBannerIndex}
              setCurrentIndex={setCurrentBannerIndex}
            />
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seção Sobre */}
        {customizations.about_section_enabled && customizations.about_text && (
          <Card className="mb-12 shadow-sm" style={{ backgroundColor: theme.header }}>
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">Sobre a Loja</h2>
              <p className="opacity-90 whitespace-pre-line leading-relaxed text-lg">{customizations.about_text}</p>
            </CardContent>
          </Card>
        )}

        {/* Produtos em Destaque */}
        {customizations.featured_section_enabled && featuredProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Produtos em Destaque</h2>
              <Link 
                to={`/StoreOnline?id=${store.id}&view=products`}
                className="text-lg font-medium flex items-center gap-2 hover:gap-3 transition-all"
                style={{ color: theme.primary }}
              >
                Ver todos <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {featuredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  theme={theme} 
                  store={store}
                  onAddToCart={handleAddToCart}
                  user={user}
                  addingToCart={addingToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mais Vendidos */}
        {bestSellers.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Star className="w-8 h-8" style={{ color: theme.primary }} />
                Mais Vendidos
              </h2>
              <Link 
                to={`/StoreOnline?id=${store.id}&view=products`}
                className="text-lg font-medium flex items-center gap-2 hover:gap-3 transition-all"
                style={{ color: theme.primary }}
              >
                Ver todos <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {bestSellers.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  theme={theme} 
                  store={store}
                  onAddToCart={handleAddToCart}
                  user={user}
                  addingToCart={addingToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* Produtos Recentes */}
        {recentProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Novidades</h2>
              <Link 
                to={`/StoreOnline?id=${store.id}&view=products`}
                className="text-lg font-medium flex items-center gap-2 hover:gap-3 transition-all"
                style={{ color: theme.primary }}
              >
                Ver todos <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {recentProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  theme={theme} 
                  store={store}
                  onAddToCart={handleAddToCart}
                  user={user}
                  addingToCart={addingToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* Botão Ver Todos os Produtos */}
        <div className="text-center mb-12">
          <Link
            to={`/StoreOnline?id=${store.id}&view=products`}
          >
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: theme.primary, color: 'white' }}
            >
              Ver Todos os Produtos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <StoreOnlineFooter store={store} customizations={customizations} theme={theme} />
      
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={() => {
          checkUser();
        }}
      />
    </div>
  );
}

