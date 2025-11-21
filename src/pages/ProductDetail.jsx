
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Category } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { Plan } from "@/api/entities";
import { StoreCustomizations } from "@/api/entities";
import { Cart as CartAPI } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageCircle, ChevronLeft, CheckCircle2, Share2, Heart, ShoppingBag, Store as StoreIcon, Tag, ArrowLeft, Info, Star, ShoppingCart, Eye, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAndApplyPromotions, fetchAndApplyPromotionsMultiStore } from "@/utils/promotions";
import CountdownTimer from "@/components/products/CountdownTimer";
import { useToast } from "@/components/ui/use-toast";
import LoginDialog from "@/components/LoginDialog";
import { Favorites as FavoritesAPI, Reviews as ReviewsAPI } from "@/api/entities";
import ProductReviews from "@/components/products/ProductReviews";
import Breadcrumbs from "@/components/products/Breadcrumbs";
import ProductBadges from "@/components/products/ProductBadges";
import ProductCharacteristics from "@/components/products/ProductCharacteristics";
import ShippingCalculator from "@/components/products/ShippingCalculator";
import QuantitySelector from "@/components/products/QuantitySelector";
import PaymentInstallments from "@/components/products/PaymentInstallments";

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [customizations, setCustomizations] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [averageRating, setAverageRating] = useState({ total_reviews: 0, average_rating: 0 });
  const [category, setCategory] = useState(null);
  const [categoryRank, setCategoryRank] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isFromStoreOnline, setIsFromStoreOnline] = useState(false);

  // Detectar origem da visualização (marketplace ou loja)
  const getViewSource = () => {
    const referrer = document.referrer || '';
    const currentPath = window.location.pathname;
    const currentUrl = window.location.href;
    
    // Verificar se há informação salva no sessionStorage sobre a origem
    const savedSource = sessionStorage.getItem('lastPageSource');
    
    console.log('=== Detecção de Origem ===');
    console.log('Referrer:', referrer);
    console.log('Current Path:', currentPath);
    console.log('Current URL:', currentUrl);
    console.log('Saved Source:', savedSource);
    
    // Se veio de StoreFront ou StoreOnline, é da loja individual
    if (referrer.includes('/StoreFront') || 
        referrer.includes('/StoreOnline') || 
        referrer.includes('/storefront') || 
        referrer.includes('/storeonline') ||
        currentUrl.includes('/StoreFront') ||
        currentUrl.includes('/StoreOnline')) {
      console.log('Origem detectada: STORE (loja individual)');
      return 'store';
    }
    
    // Se há informação salva no sessionStorage, usar ela
    if (savedSource === 'store') {
      console.log('Origem detectada via sessionStorage: STORE');
      return 'store';
    }
    
    // Se veio de Home ou ProductDetail, é do marketplace
    if (referrer.includes('/Home') || 
        referrer.includes('/home') || 
        referrer.includes('/ProductDetail') ||
        referrer.includes('/productdetail') ||
        savedSource === 'marketplace' ||
        !referrer) {
      console.log('Origem detectada: MARKETPLACE (NATIVO Home)');
      return 'marketplace';
    }
    
    // Por padrão, considerar marketplace
    console.log('Origem padrão: MARKETPLACE');
    return 'marketplace';
  };

  const incrementMetric = async (productId, metricType, viewSource = null) => {
    if (!productId) {
      console.error('❌ incrementMetric: productId não fornecido');
      return;
    }
    
    try {
      // Determinar origem se não foi especificada
      const source = viewSource || getViewSource();
      
      console.log('📊 Incrementando métrica:', {
        productId,
        metricType,
        viewSource: source
      });
      
      // Usar a nova rota pública de métricas (não requer autenticação)
      const result = await Product.incrementMetric(productId, metricType, source);
      
      console.log(`✅ Métrica atualizada - ${metricType} (${source}):`, result.metrics);
      console.log('Valores atualizados:', {
        total_views: result.metrics.total_views,
        views_from_marketplace: result.metrics.views_from_marketplace,
        views_from_store: result.metrics.views_from_store
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar métrica:', error);
      // Não bloquear a experiência do usuário se houver erro ao registrar métrica
    }
  };

  // Removido - visualizações agora são registradas no loadProduct com origem correta

  const handleContactClick = async () => {
    if (!product?.id) return;
    
    try {
      await incrementMetric(product.id, 'message');
      
      // Verificar se veio de uma loja específica ou do marketplace
      // Se a loja já estiver carregada, provavelmente veio de uma página de loja
      const referrer = document.referrer || '';
      const isFromStore = referrer.includes('/store/') || 
                          referrer.includes('/storeonline') || 
                          referrer.includes('/storefront');
      
      // Buscar WhatsApp da loja se não estiver carregado
      let currentStore = store;
      if (!currentStore && product.store_id) {
        try {
          currentStore = await Store.get(product.store_id);
          if (currentStore) setStore(currentStore);
        } catch (error) {
          console.error('Erro ao buscar WhatsApp da loja:', error);
        }
      }
      
      // Formatar número do WhatsApp (remover caracteres não numéricos e adicionar código do país se necessário)
      const whatsappSource = product.whatsapp || currentStore?.whatsapp;
      let whatsappNumber = whatsappSource?.replace(/\D/g, '') || '';
      if (whatsappNumber && !whatsappNumber.startsWith('55')) {
        // Se não começar com 55 (código do Brasil), adicionar
        whatsappNumber = '55' + whatsappNumber;
      }
      
      if (!whatsappNumber) {
        toast({
          title: "Erro",
          description: "Número de WhatsApp não disponível para este produto",
          variant: "destructive",
        });
        return;
      }
      
      // Criar mensagem baseada na origem
      // Se veio de uma loja específica E a loja está carregada, usar mensagem da loja
      let message;
      if (isFromStore && currentStore?.name) {
        message = `Olá! Vi seu produto "${product.name}" na loja ${currentStore.name} e gostaria de mais informações.`;
      } else {
        message = `Olá! Vi seu produto "${product.name}" no NATIVO e gostaria de mais informações.`;
      }
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Erro ao processar contato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o WhatsApp. Verifique se o número está correto.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Scroll para o topo quando a página carregar
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProduct();
    checkUser();
  }, [id]); // Recarregar quando o ID mudar
  
  useEffect(() => {
    // Scroll para o topo quando o produto mudar (navegação entre produtos)
    if (product) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.id]);

  useEffect(() => {
    if (user && product?.id) {
      checkFavorite();
    }
  }, [user, product?.id]);

  const checkFavorite = async () => {
    if (!user || !product?.id) return;
    
    try {
      const result = await FavoritesAPI.check(product.id);
      setIsFavorite(result.isFavorite || false);
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
    }
  };

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const handleViewStore = async () => {
    if (!product?.store_id) return;

    try {
      // Se a loja já estiver carregada, usar ela, senão carregar
      let currentStore = store;
      if (!currentStore) {
        currentStore = await Store.get(product.store_id);
        setStore(currentStore);
      }

      if (!currentStore) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar informações da loja",
          variant: "destructive",
        });
        return;
      }

      // Verificar se a loja tem plano com loja online
      let hasOnlineStore = false;

      // Verificar pelo plan_id da loja
      if (currentStore.plan_id === 'plan-enterprise') {
        hasOnlineStore = true;
      } else if (currentStore.plan_id) {
        // Buscar informações do plano para verificar o slug
        try {
          const planData = await Plan.get(currentStore.plan_id);
          if (planData?.slug === 'enterprise' || planData?.id === 'plan-enterprise') {
            hasOnlineStore = true;
          }
        } catch (error) {
          console.error("Erro ao buscar plano:", error);
        }
      }

      // Se não encontrou pelo plan_id, verificar pela assinatura ativa
      if (!hasOnlineStore) {
        try {
          const subscriptions = await Subscription.filter({ 
            store_id: currentStore.id, 
            status: 'active' 
          });
          if (subscriptions && subscriptions.length > 0) {
            const activeSubscription = subscriptions[0];
            if (activeSubscription.plan_id === 'plan-enterprise') {
              hasOnlineStore = true;
            } else if (activeSubscription.plan_id) {
              const planData = await Plan.get(activeSubscription.plan_id);
              if (planData?.slug === 'enterprise' || planData?.id === 'plan-enterprise') {
                hasOnlineStore = true;
              }
            }
          }
        } catch (error) {
          console.error("Erro ao verificar assinatura:", error);
        }
      }

      // Navegar para a loja apropriada
      if (hasOnlineStore) {
        navigate(`/loja-online/${currentStore.id}`);
      } else {
        navigate(`/loja/${currentStore.id}`);
      }
    } catch (error) {
      console.error("Erro ao verificar loja:", error);
      // Fallback para vitrine comum em caso de erro
      navigate(`/loja/${product.store_id}`);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    if (!product) return;

    // Verificar estoque
    if (product.stock !== null && product.stock !== undefined && quantity > product.stock) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${product.stock} ${product.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingToCart(true);
      await CartAPI.addItem(product.id, quantity);
      
      toast({
        title: "Produto adicionado!",
        description: `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'} de ${product.name} ${quantity === 1 ? 'foi' : 'foram'} adicionada${quantity === 1 ? '' : 's'} ao carrinho`,
      });

      // Disparar evento para atualizar contador do carrinho
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar ao carrinho",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    if (!product) return;

    // Verificar estoque
    if (product.stock !== null && product.stock !== undefined && quantity > product.stock) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${product.stock} ${product.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingToCart(true);
      await CartAPI.addItem(product.id, quantity);
      
      // Disparar evento para atualizar contador do carrinho
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Redirecionar para o carrinho/checkout
      navigate(createPageUrl("Cart"));
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar ao carrinho",
        variant: "destructive",
      });
      setAddingToCart(false);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      // Usar useParams para pegar o ID da rota
      const productId = id;
      
      // Verificar se está no modo loja premium (via sessionStorage)
      const isInStoreOnline = sessionStorage.getItem('isInStoreOnline') === 'true';
      const savedCustomizations = sessionStorage.getItem('storeOnlineCustomizations');
      const savedStoreId = sessionStorage.getItem('storeOnlineStoreId');
      
      setIsFromStoreOnline(isInStoreOnline);
      
      if (!productId) {
        navigate("/");
        return;
      }
      
      // Usar Product.get() em vez de Product.filter() para buscar o produto específico por ID
      let product = await Product.get(productId);
      
      if (!product) {
        navigate("/");
        return;
      }
      
      // Buscar informações da loja para verificar checkout_enabled
      if (product.store_id) {
        try {
          const storeData = await Store.get(product.store_id);
          setStore(storeData);
          
          // Se está no modo loja premium, carregar customizações do sessionStorage ou da API
          if (isInStoreOnline && storeData) {
            try {
              let customizationsData = null;
              
              // Tentar usar customizações salvas no sessionStorage
              if (savedCustomizations) {
                try {
                  customizationsData = JSON.parse(savedCustomizations);
                } catch (e) {
                  console.error("Erro ao parsear customizações do sessionStorage:", e);
                }
              }
              
              // Se não tiver no sessionStorage ou se o store_id não corresponder, buscar da API
              if (!customizationsData || (savedStoreId && savedStoreId !== storeData.id)) {
                customizationsData = await StoreCustomizations.getByStore(storeData.id);
                // Salvar no sessionStorage para próximas navegações
                if (customizationsData) {
                  sessionStorage.setItem('storeOnlineCustomizations', JSON.stringify(customizationsData));
                  sessionStorage.setItem('storeOnlineStoreId', storeData.id);
                }
              }
              
              setCustomizations(customizationsData || {
                primary_color: '#2563eb',
                secondary_color: '#06b6d4',
                background_color: '#ffffff',
                text_color: '#1f2937',
                header_color: '#ffffff',
                footer_color: '#f9fafb',
              });
            } catch (error) {
              console.error("Erro ao carregar customizações:", error);
              // Usar valores padrão se não conseguir carregar
              setCustomizations({
                primary_color: '#2563eb',
                secondary_color: '#06b6d4',
                background_color: '#ffffff',
                text_color: '#1f2937',
                header_color: '#ffffff',
                footer_color: '#f9fafb',
              });
            }
          }
        } catch (error) {
          console.error("Erro ao carregar loja:", error);
        }
        
        // Aplicar promoções ao produto principal
        const productsWithPromos = await fetchAndApplyPromotions([product], product.store_id);
        product = productsWithPromos[0] || product;
      }
      
      setProduct(product);
      
      // Carregar informações da categoria para breadcrumb
      if (product.category_id) {
        try {
          const categoryData = await Category.get(product.category_id);
          setCategory(categoryData);
        } catch (error) {
          console.error("Erro ao carregar categoria:", error);
        }
      }
      
      // Calcular rank do produto na categoria (baseado em visualizações)
      if (product.category_id) {
        try {
          const categoryProducts = await Product.filter({
            category_id: product.category_id,
            active: true
          });
          
          // Ordenar por visualizações (descendente)
          const sortedProducts = categoryProducts
            .sort((a, b) => (b.total_views || 0) - (a.total_views || 0));
          
          const rank = sortedProducts.findIndex(p => p.id === productId) + 1;
          setCategoryRank(rank);
        } catch (error) {
          console.error("Erro ao calcular rank:", error);
        }
      }
      
      // Carregar média de avaliações
      try {
        const avgData = await ReviewsAPI.getAverage(productId);
        setAverageRating(avgData || { total_reviews: 0, average_rating: 0 });
      } catch (error) {
        console.error("Erro ao carregar média de avaliações:", error);
      }
      
      // Registrar visualização com origem
      // Verificar se já foi visualizado nesta sessão para evitar duplicatas
      const viewedProducts = JSON.parse(sessionStorage.getItem('viewedProducts') || '[]');
      const hasViewed = viewedProducts.includes(productId);
      
      if (!hasViewed) {
        const viewSource = getViewSource();
        console.log('=== Registrando Visualização ===');
        console.log('Produto ID:', productId);
        console.log('Origem detectada:', viewSource);
        
        try {
          await incrementMetric(productId, 'view', viewSource);
          // Marcar como visualizado
          viewedProducts.push(productId);
          sessionStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
          console.log('✅ Visualização registrada com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao registrar visualização:', error);
        }
      } else {
        console.log('⚠️ Produto já foi visualizado nesta sessão, pulando registro.');
      }
      
      const related = await Product.filter({
        category_id: product.category_id || product.category,
        active: true
      });
      
      // Aplicar promoções aos produtos relacionados
      let relatedWithPromos = related
          .filter(p => p.id !== productId)
        .slice(0, 4);
      
      if (relatedWithPromos.length > 0) {
        relatedWithPromos = await fetchAndApplyPromotionsMultiStore(relatedWithPromos);
      }
      
      setRelatedProducts(relatedWithPromos);
      
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
    }
    setLoading(false);
  };

  // Removido - já está sendo feito no loadProduct

  const handleFavoriteClick = async () => {
    if (!product?.id) return;
    
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    try {
      if (isFavorite) {
        await FavoritesAPI.remove(product.id);
        setIsFavorite(false);
        toast({
          title: "Removido!",
          description: "Produto removido dos favoritos",
        });
      } else {
        await FavoritesAPI.add(product.id);
        setIsFavorite(true);
    await incrementMetric(product.id, 'favorite');
        toast({
          title: "Adicionado!",
          description: "Produto adicionado aos favoritos",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.name,
      text: `Confira este produto: ${product.name}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full mt-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const imageList = product.images || [product.image_url];

  // Construir breadcrumbs
  const breadcrumbItems = [];
  
  // Se vier da loja premium, ajustar breadcrumbs
  if (isFromStoreOnline && store) {
    // Adicionar link para a loja
    breadcrumbItems.push({
      label: store.name || "Loja",
      href: `/loja-online/${store.id}`
    });
    
    // Adicionar categoria se existir
    if (category) {
      breadcrumbItems.push({
        label: category.name,
        href: `/loja-online/${store.id}?view=products&category=${encodeURIComponent(category.name)}`
      });
    }
  } else {
    // Breadcrumbs padrão (marketplace)
    if (category) {
      breadcrumbItems.push({
        label: category.name,
        href: createPageUrl(`Home?category=${category.id}`)
      });
    }
  }
  
  // Sempre adicionar o nome do produto no final
  breadcrumbItems.push({
    label: product.name
  });

  // Tema baseado nas customizações da loja (se vier da loja online)
  const theme = isFromStoreOnline && customizations ? {
    primary: customizations.primary_color || '#2563eb',
    secondary: customizations.secondary_color || '#06b6d4',
    background: customizations.background_color || '#ffffff',
    text: customizations.text_color || '#1f2937',
    header: customizations.header_color || '#ffffff',
    footer: customizations.footer_color || '#f9fafb',
  } : null;

  // Função helper para obter cor primária com opacidade
  const getPrimaryColor = (opacity = 1) => {
    if (theme) {
      return theme.primary;
    }
    return opacity === 1 ? '#2563eb' : `rgba(37, 99, 235, ${opacity})`;
  };

  // Função helper para obter cor secundária
  const getSecondaryColor = () => {
    return theme ? theme.secondary : '#06b6d4';
  };

  return (
    <div 
      className="min-h-screen"
      style={theme ? { 
        backgroundColor: theme.background, 
        color: theme.text 
      } : { backgroundColor: '#f9fafb' }}
    >
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} showHome={!isFromStoreOnline} />
        
        {/* Temporizador de Oferta - Topo da Página */}
        {product && product.promotion && product.promotion.show_timer && product.promotion.end_date && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
            <CountdownTimer endDate={product.promotion.end_date} />
        </motion.div>
        )}

        {/* Card único com: Fotos, Preço, Quantidade, Frete, Botões e Loja */}
        <Card className="border-2 border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna Esquerda: Fotos */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
                {/* Badges - Visíveis apenas no mobile, acima da foto */}
                <div className="lg:hidden mb-3 space-y-2">
                  <ProductBadges product={product} categoryRank={categoryRank} />
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {(product.category_name || product.category) && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium shadow-sm"
                        style={theme ? {
                          background: `linear-gradient(to right, ${theme.primary}10, ${theme.secondary}10)`,
                          color: theme.primary,
                          borderColor: theme.primary + '40',
                        } : {
                          background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
                          color: '#1e40af',
                          borderColor: '#93c5fd',
                        }}
                      >
                        {(product.category_name || product.category || '').replace(/_/g, ' ')}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-300 text-xs font-medium shadow-sm">
                      <Eye className="w-3 h-3 mr-1" />
                      {product.total_views || 0} visualizações
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg overflow-hidden shadow-xl border-2 border-gray-100">
                  <div 
                    className="relative aspect-square cursor-pointer group"
                    onClick={() => {
                      setModalImageIndex(selectedImage);
                      setImageModalOpen(true);
                    }}
                  >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={imageList[selectedImage]}
                    alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
                    
                    {/* Overlay sutil no hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3 shadow-lg">
                        <Eye className="w-6 h-6 text-gray-700" />
                      </div>
                    </div>
                
                {product.compare_price && product.compare_price > product.price && (
                      <Badge className="absolute top-4 left-4 bg-red-500 text-base py-1 px-3 shadow-lg z-10">
                    {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                  </Badge>
                )}
              </div>
              
              {imageList.length > 1 && (
                <div className="flex p-2 gap-2 overflow-x-auto">
                  {imageList.map((image, index) => (
                    <button
                      key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(index);
                          }}
                          className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                            selectedImage === index 
                              ? 'ring-2 shadow-md scale-105'
                              : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                          }`}
                          style={selectedImage === index ? {
                            borderColor: theme ? theme.primary : '#3b82f6',
                            ringColor: theme ? theme.primary : '#3b82f6',
                          } : {}}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
                
                {/* Informações do Vendedor, Compartilhar e Compra Segura - Abaixo das fotos */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                  {/* Informações do Vendedor */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full bg-white border-2 overflow-hidden flex-shrink-0 shadow-md"
                      style={{ borderColor: theme ? theme.primary + '40' : '#93c5fd' }}
                    >
                      <img 
                        src={product.store_logo || "https://via.placeholder.com/40"} 
                        alt={product.store_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p 
                          className="font-semibold text-sm"
                          style={{ color: theme ? theme.text : '#111827' }}
                        >
                          {product.store_name}
                        </p>
                        <CheckCircle2 
                          className="w-4 h-4" 
                          style={{ color: theme ? theme.primary : '#2563eb' }}
                        />
                      </div>
                      <p 
                        className="text-xs mt-0.5"
                        style={{ color: theme ? theme.text + '80' : '#4b5563' }}
                      >
                        Vendedor verificado
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="font-medium shadow-sm" 
                      style={theme ? {
                        color: theme.primary,
                        borderColor: theme.primary + '40',
                      } : {
                        color: '#2563eb',
                        borderColor: '#93c5fd',
                      }}
                      onMouseEnter={(e) => {
                        if (theme) {
                          e.currentTarget.style.backgroundColor = theme.primary + '10';
                        } else {
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={handleViewStore}
                    >
                      Ver loja
                    </Button>
                  </div>
                  
                  {/* Botão Compartilhar */}
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="w-full border-2 shadow-md hover:shadow-lg transition-all duration-200"
                      style={theme ? {
                        borderColor: theme.primary + '40',
                        color: theme.text,
                      } : {
                        borderColor: '#e5e7eb',
                        color: '#374151',
                      }}
                      onMouseEnter={(e) => {
                        if (theme) {
                          e.currentTarget.style.borderColor = theme.primary;
                          e.currentTarget.style.color = theme.primary;
                        } else {
                          e.currentTarget.style.borderColor = '#93c5fd';
                          e.currentTarget.style.color = '#2563eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (theme) {
                          e.currentTarget.style.borderColor = theme.primary + '40';
                          e.currentTarget.style.color = theme.text;
                        } else {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.color = '#374151';
                        }
                      }}
                      onClick={handleShare}
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                  
                  {/* Informação de Compra Segura */}
                  <div 
                    className="p-3 rounded-lg border flex items-start gap-2"
                    style={theme ? {
                      backgroundColor: theme.primary + '10',
                      borderColor: theme.primary + '30',
                    } : {
                      backgroundColor: '#dbeafe',
                      borderColor: '#bfdbfe',
                    }}
                  >
                    <Info 
                      className="w-4 h-4 flex-shrink-0 mt-0.5" 
                      style={{ color: theme ? theme.primary : '#3b82f6' }}
                    />
                    <div 
                      className="text-xs"
                      style={{ color: theme ? theme.text : '#1e3a8a' }}
                    >
                      <p className="font-medium mb-0.5">Compra segura</p>
                      <p>Entre em contato com o vendedor pelo WhatsApp e combine detalhes de pagamento e entrega.</p>
                    </div>
                  </div>
                </div>
          </motion.div>

              {/* Coluna Direita: Informações do Produto */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
                {/* Badges do Produto - Visíveis apenas no desktop */}
                <div className="hidden lg:block space-y-2">
                  <ProductBadges product={product} categoryRank={categoryRank} />
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {(product.category_name || product.category) && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium shadow-sm"
                        style={theme ? {
                          background: `linear-gradient(to right, ${theme.primary}10, ${theme.secondary}10)`,
                          color: theme.primary,
                          borderColor: theme.primary + '40',
                        } : {
                          background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
                          color: '#1e40af',
                          borderColor: '#93c5fd',
                        }}
                      >
                        {(product.category_name || product.category || '').replace(/_/g, ' ')}
                </Badge>
                    )}
                    <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-300 text-xs font-medium shadow-sm">
                      <Eye className="w-3 h-3 mr-1" />
                  {product.total_views || 0} visualizações
                </Badge>
                  </div>
              </div>
              
                {/* Título e Avaliação */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
              
                  <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                          className={`w-4 h-4 ${
                            averageRating.total_reviews > 0 && star <= Math.round(parseFloat(averageRating.average_rating))
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`} 
                    />
                  ))}
                </div>
                    {averageRating.total_reviews > 0 && (
                      <span className="text-sm font-medium text-gray-700">
                        {averageRating.average_rating} <span className="text-gray-500">({averageRating.total_reviews} {averageRating.total_reviews === 1 ? 'avaliação' : 'avaliações'})</span>
                      </span>
                    )}
              </div>
                </div>
                {/* Preço e Parcelamento */}
                  <div>
                  {((product.compare_price && product.compare_price > product.price) || 
                    (product.has_promotion && product.promotion)) ? (
                    <div className="mb-3">
                      <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 line-through text-lg">
                          R$ {(product.compare_price || product.price).toFixed(2)}
                    </span>
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                          {Math.round((1 - product.price / (product.compare_price || product.price)) * 100)}% OFF
                        </Badge>
                      </div>
                      <div className="text-3xl font-extrabold text-green-700 mt-1">
                      R$ {product.price.toFixed(2)}
                    </div>
                  </div>
                ) : (
                    <div className="text-3xl font-extrabold text-green-700 mb-3">
                    R$ {product.price.toFixed(2)}
                  </div>
                )}
                
                  {/* Parcelamento Detalhado */}
                  <PaymentInstallments 
                    price={product.price} 
                    comparePrice={product.compare_price} 
                  />
            </div>
            
                {/* Quantidade */}
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  stock={product.stock}
                />
                
                {/* Informações de Entrega */}
                <ShippingCalculator product={product} store={store} />

                {/* Botões de Ação */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {store?.checkout_enabled ? (
                      <>
                        <Button 
                          onClick={handleBuyNow}
                          disabled={addingToCart}
                          className="flex-1 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2 h-12"
                          style={theme ? {
                            background: `linear-gradient(to right, ${theme.secondary || theme.primary}, ${theme.primary})`,
                          } : {
                            background: 'linear-gradient(to right, #10b981, #059669)',
                          }}
                          onMouseEnter={(e) => {
                            if (theme && !addingToCart) {
                              const primary = theme.primary;
                              const secondary = theme.secondary || primary;
                              e.currentTarget.style.background = `linear-gradient(to right, ${secondary}dd, ${primary}dd)`;
                            } else if (!theme && !addingToCart) {
                              e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (theme) {
                              e.currentTarget.style.background = `linear-gradient(to right, ${theme.secondary || theme.primary}, ${theme.primary})`;
                            } else {
                              e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #059669)';
                            }
                          }}
                          size="lg"
                        >
                          {addingToCart ? "Processando..." : "Comprar Agora"}
                        </Button>
                        <Button 
                          onClick={handleAddToCart}
                          disabled={addingToCart}
                          variant="outline"
                          className="flex-1 font-semibold shadow-md hover:shadow-lg transition-all duration-200 gap-2 h-12 border-2"
                          style={theme ? {
                            borderColor: theme.primary + '40',
                            color: theme.primary,
                          } : {
                            borderColor: '#93c5fd',
                            color: '#2563eb',
                          }}
                          onMouseEnter={(e) => {
                            if (theme && !addingToCart) {
                              e.currentTarget.style.backgroundColor = theme.primary + '10';
                            } else if (!addingToCart) {
                              e.currentTarget.style.backgroundColor = '#dbeafe';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          size="lg"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          {addingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
                        </Button>
              <Button 
                onClick={handleContactClick}
                          variant="outline"
                          className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-300 hover:from-green-100 hover:to-emerald-100 font-semibold shadow-md hover:shadow-lg transition-all duration-200 gap-2 h-12"
                          size="lg"
              >
                <MessageCircle className="w-5 h-5" />
                Contatar Vendedor
              </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={handleContactClick}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2 h-12"
                        size="lg"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Contatar Vendedor
                      </Button>
                    )}
              
              <Button
                variant="outline"
                onClick={handleFavoriteClick}
                      size="lg"
                      className={`h-12 w-12 border-2 shadow-md hover:shadow-lg transition-all duration-200 ${
                  isFavorite 
                          ? 'bg-gradient-to-br from-red-50 to-pink-50 text-red-600 border-red-300 hover:from-red-100 hover:to-pink-100' 
                          : 'hover:border-red-300 hover:text-red-600'
                }`}
              >
                <Heart 
                  className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} 
                />
              </Button>
            </div>
              </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
        
        {/* Modal de Visualização da Imagem */}
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
            <div className="relative">
                <button
                onClick={() => setImageModalOpen(false)}
                className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-2 text-white transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6 rotate-45" />
                </button>
              
              <div className="relative aspect-square max-h-[80vh] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={modalImageIndex}
                    src={imageList[modalImageIndex]}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
                
                {/* Navegação entre imagens */}
                {imageList.length > 1 && (
                  <>
                <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalImageIndex((prev) => 
                          prev > 0 ? prev - 1 : imageList.length - 1
                        );
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-200 z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalImageIndex((prev) => 
                          prev < imageList.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-200 z-10"
                    >
                      <ChevronLeft className="w-6 h-6 rotate-180" />
                    </button>
                    
                    {/* Indicador de imagem */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                      {modalImageIndex + 1} / {imageList.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Miniaturas na parte inferior */}
              {imageList.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto justify-center bg-black/50 backdrop-blur-sm">
                  {imageList.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setModalImageIndex(index)}
                      className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                        modalImageIndex === index 
                          ? 'border-white ring-2 ring-blue-400 scale-110' 
                          : 'border-white/30 opacity-60 hover:opacity-100 hover:border-white/60'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                </button>
                  ))}
              </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
            
        <LoginDialog 
          open={loginDialogOpen} 
          onOpenChange={setLoginDialogOpen}
          onSuccess={() => {
            checkUser();
            handleAddToCart();
          }}
        />

        {/* Seção abaixo: O que você precisa saber */}
        <div className="mt-8">
          <ProductCharacteristics product={product} />
        </div>
            
        {/* Bloco: Descrição */}
        {product.description && (
          <Card className="border-2 border-gray-200 shadow-sm mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descrição</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {product.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bloco: Detalhes */}
        {((product.variations && product.variations.length > 0) || product.stock !== undefined) && (
          <Card className="border-2 border-gray-200 shadow-sm mt-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes</h2>
              <div className="space-y-4">
                {product.variations && product.variations.length > 0 && (
                  <div className="space-y-3">
                    {product.variations.map((variation, index) => (
                        <div key={index}>
                        <p className="text-sm font-medium text-gray-700 mb-2">{variation.name}:</p>
                          <div className="flex flex-wrap gap-2">
                            {variation.options.map((option, i) => (
                              <Badge key={i} variant="outline" className="bg-gray-50">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                    ))}
                  </div>
                    )}
                    
                    {product.stock !== undefined && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Estoque:</p>
                        <p className="text-gray-600">{product.stock} unidades disponíveis</p>
                      </div>
                    )}
                  </div>
            </CardContent>
          </Card>
        )}

        {/* Bloco: Avaliações */}
        <Card className="border-2 border-gray-200 shadow-sm mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Avaliações</h2>
            <ProductReviews productId={product.id} />
          </CardContent>
        </Card>

        {/* Bloco 8: Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card className="border-2 border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card 
                  key={relatedProduct.id} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                        navigate(`/produto/${relatedProduct.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  <img
                    src={relatedProduct.images?.[0] || relatedProduct.image_url}
                    alt={relatedProduct.name}
                    className="w-full h-40 object-cover"
                  />
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{relatedProduct.name}</h3>
                    <p className="text-green-600 font-bold mt-1">
                      R$ {relatedProduct.price.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}
