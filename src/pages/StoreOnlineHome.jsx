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
  Store as StoreIcon,
  Percent,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { StoreOnlineHeader, StoreOnlineFooter } from "@/components/store/StoreOnlineLayout";
import { useToast } from "@/components/ui/use-toast";
import LoginDialog from "@/components/LoginDialog";
import { formatCurrency } from "@/lib/utils";

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
function ProductCard({ product, theme, store, customizations, onAddToCart, user, addingToCart }) {
  // Verificar se tem promoção ou compare_price
  const hasDiscount = (product.compare_price && product.compare_price > product.price) || 
                     (product.has_promotion && product.promotion);
  const discountPercent = hasDiscount 
    ? (product.discount_percent || (product.compare_price && product.price 
        ? Math.round((1 - product.price / product.compare_price) * 100)
        : 0))
    : 0;

  // Calcular preço Pix (5% de desconto)
  const pixPrice = product.price ? product.price * 0.95 : 0;
  
  // Média de avaliação (se disponível)
  const averageRating = product.average_rating || 0;
  const ratingStars = Math.round(averageRating) || 0;

  // formatCurrency agora vem de @/lib/utils

  // WhatsApp da loja
  const whatsappNumber = customizations?.whatsapp_number || store?.whatsapp_number;
  const whatsappLink = whatsappNumber 
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=Olá! Tenho interesse no produto: ${encodeURIComponent(product.name)}`
    : '#';

  const priceColor = customizations?.product_price_color || theme.product_price || '#f97316';
  const buttonColor = customizations?.product_button_color || theme.product_button || '#f97316';

  return (
    <Card className="h-full overflow-hidden border border-gray-200 hover:border-opacity-100 hover:shadow-lg transition-all duration-300 bg-white flex flex-col">
      <div className="aspect-square relative bg-gray-100 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
          </div>
        )}
        
        {/* Badge de desconto no canto superior direito */}
        {hasDiscount && discountPercent > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-orange-500 text-white font-bold px-2 py-1 text-sm">
              ↓{discountPercent}%
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col items-center text-center">
        {/* Título do produto */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2 min-h-[3rem] text-gray-900">
          {product.name}
        </h3>
        
        {/* Avaliação com estrelas */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < ratingStars
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Preços */}
        <div className="mb-3 text-center">
          {hasDiscount && product.compare_price && (
            <div className="text-sm text-gray-500 line-through mb-1">
              {formatCurrency(product.compare_price)}
            </div>
          )}
          <div className="text-2xl font-bold mb-1" style={{ color: priceColor }}>
            {formatCurrency(product.price)}
          </div>
          <div className="text-sm text-gray-600">
            {formatCurrency(pixPrice)} à vista com desconto Pix
          </div>
        </div>

        {/* Botões */}
        <div className="mt-auto space-y-2 w-full">
          <Button
            className="w-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
            style={{ backgroundColor: buttonColor, color: 'white', width: '100%' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Usar slug se disponível, senão usar ID
              const productLink = store?.slug 
                ? `/${store.slug}/produto/${product.id}`
                : `/loja-online/${store.id}/produto/${product.id}`;
              window.location.href = productLink;
            }}
          >
            Ver produto
          </Button>
          
          {whatsappNumber && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-md shadow-sm hover:shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Dúvidas? Fale no WhatsApp
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StoreOnlineHome() {
  const { id: urlStoreId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Tentar pegar o storeId resolvido do sessionStorage (do router)
  // Se não tiver, usar o da URL e tentar resolver (pode ser slug)
  const [storeId, setStoreId] = useState(() => {
    const resolved = sessionStorage.getItem('resolvedStoreId');
    if (resolved) {
      sessionStorage.removeItem('resolvedStoreId'); // Limpar após usar
      return resolved;
    }
    return urlStoreId;
  });
  
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

  // Quando a URL mudar, verificar se precisa resolver o slug
  useEffect(() => {
    const resolved = sessionStorage.getItem('resolvedStoreId');
    if (resolved) {
      sessionStorage.removeItem('resolvedStoreId');
      setStoreId(resolved);
      return;
    }
    
    // Se o urlStoreId mudou e não é o mesmo do storeId atual, atualizar
    if (urlStoreId && urlStoreId !== storeId) {
      setStoreId(urlStoreId);
    }
  }, [urlStoreId]);
  
  useEffect(() => {
    // Se o storeId não é um UUID, pode ser um slug - tentar resolver
    const isUUID = storeId && storeId.length === 36 && storeId.includes('-');
    
    if (!isUUID && storeId) {
      // Tentar buscar a loja pelo slug para obter o ID real
      const resolveSlug = async () => {
        try {
          console.log('🔄 Resolvendo slug para ID:', storeId);
          const { Store } = await import("@/api/entities");
          const store = await Store.get(storeId);
          if (store && store.id) {
            console.log('✅ Slug resolvido para ID:', store.id);
            setStoreId(store.id);
            return;
          }
        } catch (error) {
          console.error('❌ Erro ao resolver slug:', error);
        }
      };
      resolveSlug();
      return; // Não carregar ainda, esperar o ID ser resolvido
    }
    
    // Se for UUID ou não tiver storeId, carregar normalmente
    if (isUUID || !storeId) {
      // Marcar que estamos na página StoreOnline (loja individual)
      sessionStorage.setItem('lastPageSource', 'store');
      loadStoreOnline();
      checkUser();
    }
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

      console.log('🔄 Carregando loja online, storeId:', storeId);
      
      // Buscar a loja primeiro para garantir que temos o ID real
      const storeData = await Store.get(storeId).catch(() => null);
      
      if (!storeData) {
        setError('Loja não encontrada');
        setLoading(false);
        return;
      }
      
      // Usar o ID real da loja para buscar customizações
      const actualStoreId = storeData.id;
      console.log('✅ Loja encontrada, ID real:', actualStoreId);
      
      // Buscar customizações usando o ID real
      const customizationsData = await StoreCustomizations.getByStore(actualStoreId).catch((error) => {
        console.error('⚠️ Erro ao buscar customizações:', error);
        return null;
      });
      
      console.log('🎨 Customizações encontradas:', customizationsData ? 'Sim' : 'Não');
      console.log('🎨 Detalhes das customizações:', customizationsData);
      
      if (storeData.status !== "approved") {
        setError('Esta loja ainda não está disponível');
        setLoading(false);
        return;
      }
      
      // Se a loja tem slug personalizado, ela DEVE mostrar a loja premium
      // Isso garante que links personalizados sempre mostrem a loja premium
      const hasSlug = storeData.slug && storeData.slug.trim() !== '';
      const hasPremiumPlan = storeData.plan_id === 'plan-enterprise';
      
      console.log('🏪 Carregando loja premium:', {
        storeId: storeData.id,
        storeName: storeData.name,
        hasSlug: hasSlug,
        slug: storeData.slug,
        hasPremiumPlan: hasPremiumPlan,
        planId: storeData.plan_id,
        hasCustomizations: !!customizationsData
      });
      
      // Se tem slug mas não tem customizações, criar customizações padrão
      // Isso garante que a loja premium sempre tenha customizações para exibir
      if (hasSlug && !customizationsData) {
        console.log('⚠️ Loja com slug mas sem customizações - usando padrões');
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
        categories_bar_color: '#f97316',
        product_price_color: '#f97316',
        product_button_color: '#f97316',
        categories_card_bg_color: '#ffffff',
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
      
      console.log('🎨 Customizações finais aplicadas:', finalCustomizations);
      console.log('🎨 Cores principais:', {
        primary: finalCustomizations.primary_color,
        secondary: finalCustomizations.secondary_color,
        background: finalCustomizations.background_color
      });
      
      setCustomizations(finalCustomizations);
      
      const storeInfo = {
        id: storeData.id,
        name: storeData.name || storeData.display_name || storeData.fantasy_name,
        logo: storeData.logo_url || storeData.logo || storeData.banner_image || null,
        city: storeData.city_name || storeData.city,
        plan: storeData.plan_id,
      };
      
      // Usar o ID real da loja (não o slug) para todas as operações
      // actualStoreId já foi declarado acima na linha 266
      
      // Salvar customizações no sessionStorage para aplicar em todas as páginas
      sessionStorage.setItem('storeOnlineCustomizations', JSON.stringify(finalCustomizations));
      sessionStorage.setItem('storeOnlineStoreId', actualStoreId);
      sessionStorage.setItem('storeOnlineStoreInfo', JSON.stringify(storeInfo));
      sessionStorage.setItem('isInStoreOnline', 'true');
      
      // Disparar evento para que Layout e outras páginas saibam que estamos na loja premium
      window.dispatchEvent(new CustomEvent('storeOnlineEntered', { 
        detail: { customizations: finalCustomizations, storeId: actualStoreId, store: storeInfo } 
      }));

      // Usar o ID real da loja (não o slug) para buscar produtos
      const storeProducts = await Product.filter({ store_id: actualStoreId });
      let activeProducts = storeProducts.filter(p => 
        p.active === true || p.active === 1
      );
      
      // Aplicar promoções aos produtos (usar ID real da loja)
      activeProducts = await fetchAndApplyPromotions(activeProducts, actualStoreId);
      
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

  // Função auxiliar para gerar link da loja (usa slug se disponível, senão ID)
  const getStoreLink = (path = '') => {
    if (store?.slug) {
      return `/${store.slug}${path ? path : ''}`;
    }
    return `/loja-online/${store?.id || storeId}${path ? path : ''}`;
  };

  const handleSearch = () => {
    const link = getStoreLink(`?view=products&search=${encodeURIComponent(searchTerm)}`);
    navigate(link);
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
    header: customizations.header_color || '#1e3a8a',
    categories_bar: customizations.categories_bar_color || '#f97316',
    footer: customizations.footer_color || '#f9fafb',
    product_price: customizations.product_price_color || '#f97316',
    product_button: customizations.product_button_color || '#f97316',
    categories_card_bg: customizations.categories_card_bg_color || '#ffffff',
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

      {/* Seção de Benefícios - Abaixo do Banner */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-full px-12 sm:px-16 lg:px-20 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Anos no Mercado */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary + '20' }}>
                <StoreIcon className="w-6 h-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">HÁ 20 ANOS</p>
                <p className="text-xs text-gray-600">No Mercado</p>
              </div>
            </div>

            {/* Frete Grátis */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary + '20' }}>
                <Truck className="w-6 h-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">FRETE GRÁTIS</p>
                <p className="text-xs text-gray-600">a partir de R$ 1.000,00</p>
              </div>
            </div>

            {/* Desconto PIX */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary + '20' }}>
                <Percent className="w-6 h-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">PAGUE COM DESCONTO</p>
                <p className="text-xs text-gray-600">5% no PIX ou Transferência</p>
              </div>
            </div>

            {/* Parcelamento */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary + '20' }}>
                <CreditCard className="w-6 h-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">PARCELE SEM JUROS</p>
                <p className="text-xs text-gray-600">Em até 10 vezes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-12 sm:px-16 lg:px-20 py-8">
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
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">PRODUTOS EM DESTAQUE</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {featuredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  theme={theme} 
                  store={store}
                  customizations={customizations}
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
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">MAIS VENDIDOS</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {bestSellers.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  theme={theme} 
                  store={store}
                  customizations={customizations}
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
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">NOVIDADES</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recentProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  theme={theme} 
                  store={store}
                  customizations={customizations}
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

