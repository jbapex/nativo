import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  Megaphone, 
  Clock, 
  ShoppingBag, 
  Tag, 
  Store as StoreIcon,
  AlertCircle,
  Filter,
  Grid,
  List,
  Zap,
  Search,
  X,
  LogOut,
  User as UserIcon,
  Heart,
  ShoppingCart
} from "lucide-react";
import { MarketplaceCampaigns, Cart as CartAPI } from "@/api/apiClient";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { Settings } from "@/api/entities-local";
import { User, Store } from "@/api/entities";
import { trackCampaign } from "@/utils/navigationTracker";
import ProductGrid from "@/components/products/ProductGrid";
import { createPageUrl } from "@/utils";
import LoginDialog from "@/components/LoginDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Componente de Timer para o cabeçalho (fundo colorido)
function CampaignHeaderTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.expired) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {timeLeft.days > 0 && (
        <>
          <div className="bg-white/20 rounded px-2 py-1">
            <span className="text-white font-bold text-sm tabular-nums">
              {String(timeLeft.days).padStart(2, '0')}D
            </span>
          </div>
          <span className="text-white font-bold">:</span>
        </>
      )}
      <div className="bg-white/20 rounded px-2 py-1">
        <span className="text-white font-bold text-sm tabular-nums">
          {String(timeLeft.hours).padStart(2, '0')}H
        </span>
      </div>
      <span className="text-white font-bold">:</span>
      <div className="bg-white/20 rounded px-2 py-1">
        <span className="text-white font-bold text-sm tabular-nums">
          {String(timeLeft.minutes).padStart(2, '0')}M
        </span>
      </div>
      <span className="text-white font-bold">:</span>
      <div className="bg-white/20 rounded px-2 py-1">
        <span className="text-white font-bold text-sm tabular-nums">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

// Componente de Timer para a página da campanha (formato HH MM SS)
function CampaignPageTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.expired) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {timeLeft.days > 0 && (
        <>
          <div className="bg-black rounded px-3 py-2">
            <span className="text-white font-bold text-base tabular-nums">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
          </div>
          <span className="text-gray-400 font-bold">:</span>
        </>
      )}
      <div className="bg-black rounded px-3 py-2">
        <span className="text-white font-bold text-base tabular-nums">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
      </div>
      <span className="text-gray-400 font-bold">:</span>
      <div className="bg-black rounded px-3 py-2">
        <span className="text-white font-bold text-base tabular-nums">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
      </div>
      <span className="text-gray-400 font-bold">:</span>
      <div className="bg-black rounded px-3 py-2">
        <span className="text-white font-bold text-base tabular-nums">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function CampaignPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasApprovedStore, setHasApprovedStore] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [systemLogo, setSystemLogo] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadCampaign();
    checkAuth();
    loadSystemSettings();
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCartCount();
      checkApprovedStore();
    } else {
      setCartItemsCount(0);
      setHasApprovedStore(false);
    }
  }, [isAuthenticated, user]);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const checkApprovedStore = async () => {
    if (!isAuthenticated || !user) {
      setHasApprovedStore(false);
      return;
    }

    try {
      const stores = await Store.list();
      const userStore = stores.find(s => s.created_by === user.id || s.user_id === user.id);
      setHasApprovedStore(userStore && userStore.status === 'approved');
    } catch (error) {
      console.error("Erro ao verificar loja aprovada:", error);
      setHasApprovedStore(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const cart = await CartAPI.get();
      if (cart && cart.items) {
        setCartItemsCount(cart.items.length || 0);
      }
    } catch (err) {
      setCartItemsCount(0);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const allSettings = await Settings.getAll();
      if (allSettings.appearance?.logo) {
        setSystemLogo(allSettings.appearance.logo);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
      setIsAuthenticated(false);
      setHasApprovedStore(false);
      setCartItemsCount(0);
      window.location.reload();
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  const handleLoginSuccess = async () => {
    await checkAuth();
    setLoginDialogOpen(false);
    window.dispatchEvent(new Event('authChanged'));
  };

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError("");

      // Buscar campanha por slug ou ID
      let campaignData = null;
      try {
        // Tentar buscar por slug primeiro
        const allCampaigns = await MarketplaceCampaigns.getActive();
        campaignData = allCampaigns.find(c => c.slug === slug || c.id === slug);
        
        // Se não encontrar, tentar buscar por ID direto
        if (!campaignData) {
          try {
            campaignData = await MarketplaceCampaigns.get(slug);
          } catch (e) {
            console.warn("Campanha não encontrada por ID:", e);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar campanha:", err);
        throw new Error("Campanha não encontrada");
      }

      if (!campaignData) {
        setError("Campanha não encontrada");
        setLoading(false);
        return;
      }

      // Verificar se a campanha está ativa
      const now = new Date();
      const startDate = new Date(campaignData.start_date);
      const endDate = new Date(campaignData.end_date);

      if (now < startDate) {
        setError("Esta campanha ainda não começou");
        setLoading(false);
        return;
      }

      if (now > endDate) {
        setError("Esta campanha já encerrou");
        setLoading(false);
        return;
      }

      console.log('📋 Campanha carregada:', {
        id: campaignData.id,
        name: campaignData.name,
        banner_image: campaignData.banner_image,
        banner_page_image: campaignData.banner_page_image,
        tem_banner_page_image: 'banner_page_image' in campaignData
      });
      
      setCampaign(campaignData);
      
      // Rastrear navegação na campanha
      trackCampaign(campaignData);

      // Buscar categorias
      try {
        const categoriesData = await Category.filter({ active: true });
        setCategories(categoriesData || []);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      }

      // Buscar produtos participantes da campanha
      await loadCampaignProducts(campaignData.id, campaignData);
    } catch (err) {
      console.error("Erro ao carregar campanha:", err);
      setError(err.message || "Erro ao carregar campanha");
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignProducts = async (campaignId, campaignData) => {
    try {
      // Buscar participações aprovadas (rota pública)
      const participations = await MarketplaceCampaigns.getPublicParticipations(campaignId);
      
      if (!participations || participations.length === 0) {
        setProducts([]);
        return;
      }

      // A rota pública já retorna apenas participações aprovadas, então não precisa filtrar
      // Buscar detalhes dos produtos
      const productIds = participations.map(p => p.product_id);

      if (productIds.length === 0) {
        setProducts([]);
        return;
      }

      // Buscar produtos
      const allProducts = await Product.filter({});
      const campaignProducts = allProducts
        .filter(p => productIds.includes(p.id))
        .map(product => {
          // Encontrar a participação correspondente
          const participation = participations.find(p => p.product_id === product.id);
          
          // Aplicar preço promocional se houver
          if (participation && campaignData) {
            return {
              ...product,
              campaign: {
                id: campaignId,
                name: campaignData.name,
                badge_text: campaignData.badge_text || "EM PROMOÇÃO",
                badge_color: campaignData.badge_color || "#EF4444",
                discount_percent: participation.discount_percent,
                discount_fixed: participation.discount_fixed,
                promo_price: participation.promo_price,
                original_price: participation.original_price
              },
              // Aplicar preço promocional
              price: participation.promo_price || product.price,
              compare_price: participation.original_price || product.compare_price || product.price
            };
          }
          return product;
        })
        .filter(p => p); // Remove produtos inválidos

      setAllProducts(campaignProducts);
      setProducts(campaignProducts);
    } catch (err) {
      console.error("Erro ao carregar produtos da campanha:", err);
      setProducts([]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Filtrar produtos por busca e categoria
  useEffect(() => {
    let filtered = [...allProducts];

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filtro por categoria
    if (selectedCategory && selectedCategory !== "todos") {
      filtered = filtered.filter(product => {
        if (typeof product.category_id === 'string') {
          return product.category_id === selectedCategory;
        }
        if (product.category) {
          return product.category.id === selectedCategory || product.category.slug === selectedCategory;
        }
        return false;
      });
    }

    setProducts(filtered);
  }, [searchTerm, selectedCategory, allProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Campanha não encontrada"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(campaign.end_date);
  const badgeColor = campaign.badge_color || "#EF4444";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Customizado com Cor da Campanha */}
      <header 
        className="sticky top-0 z-50 shadow-md"
        style={{
          backgroundColor: badgeColor,
        }}
      >
        <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex-shrink-0 flex items-center">
              {systemLogo ? (
                <img 
                  src={systemLogo} 
                  alt="NATIVO"
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <span className="text-white font-bold text-xl">NATIVO</span>
              )}
            </Link>

            {/* Barra de Busca (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 bg-white border-blue-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Ícones de Ação */}
            <div className="flex items-center gap-2">
              {/* Busca Mobile */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 text-white hover:bg-white/15 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Favoritos */}
              <Link
                to={createPageUrl("Favorites")}
                className="p-2 text-white hover:bg-white/15 rounded-lg transition-colors relative"
              >
                <Heart className="w-5 h-5 text-white" />
              </Link>

              {/* Carrinho */}
              <Link
                to={createPageUrl("Cart")}
                className="p-2 text-white hover:bg-white/15 rounded-lg transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Minha Loja (se for lojista) */}
              {isAuthenticated && hasApprovedStore && (
                <Link
                  to={createPageUrl("StoreProfile")}
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-colors font-medium"
                >
                  <StoreIcon className="w-4 h-4" />
                  Minha Loja
                </Link>
              )}

              {/* Conta */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-white hover:bg-white/15 rounded-lg transition-colors">
                      <UserIcon className="w-5 h-5 text-white" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-semibold border-b">
                      Olá, {user?.full_name?.split(' ')[0] || "Usuário"}
                    </div>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))}>
                      <UserIcon className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </DropdownMenuItem>
                    {hasApprovedStore && (
                      <DropdownMenuItem onClick={() => navigate(createPageUrl("StoreProfile"))}>
                        <StoreIcon className="w-4 h-4 mr-2" />
                        Minha Loja
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate(createPageUrl("MyPurchases"))}>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Minhas Compras
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setLoginDialogOpen(true)}
                  className="bg-white text-gray-900 border-white hover:bg-gray-100 font-semibold shadow-sm"
                >
                  Entrar
                </Button>
              )}
            </div>
          </div>

          {/* Barra de Busca Mobile */}
          {showSearch && (
            <div className="md:hidden pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 bg-white border-blue-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Banner Principal - Limpo no Topo */}
      {(campaign.banner_page_image || campaign.banner_image) && (
        <div 
          className="relative w-full overflow-hidden"
          style={{
            background: `url(${campaign.banner_page_image || campaign.banner_image}) center/cover no-repeat`,
            height: campaign.banner_page_image ? 'auto' : '110px',
            minHeight: campaign.banner_page_image ? '200px' : '110px'
          }}
        >
          <img
            src={campaign.banner_page_image || campaign.banner_image}
            alt={campaign.name}
            className="w-full h-full object-cover object-center"
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Quadro do Timer da Campanha */}
      <div className="bg-white border-y-2" style={{ borderColor: badgeColor }}>
        <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-gray-400">—</span>
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: badgeColor }}>
              {campaign.name.toUpperCase()}
            </h2>
            <Clock className="w-5 h-5" style={{ color: badgeColor }} />
            <span className="text-gray-700 font-medium">TERMINA EM</span>
            <CampaignPageTimer endDate={campaign.end_date} />
            <span className="text-gray-400">—</span>
          </div>
        </div>
      </div>


      {/* Login Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onSuccess={() => {
          checkAuth();
          setLoginDialogOpen(false);
        }}
      />

      {/* Categorias */}
      {categories.length > 0 && (
        <div className="bg-black border-b border-gray-800">
          <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("todos")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === "todos"
                    ? "bg-white text-black shadow-md"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? "bg-white text-black shadow-md"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-8">
        {/* Produtos */}
        <div>
          {products.length === 0 ? (
            <Alert className="bg-white">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum produto disponível nesta campanha no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <ProductGrid
              products={products}
              loading={false}
              emptyMessage="Nenhum produto encontrado"
              appearanceSettings={{
                buttonPrimaryColor: badgeColor,
                buttonTextColor: "#ffffff"
              }}
              hideHeader={true}
            />
          )}
        </div>
      </div>

      {/* Login Dialog */}
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

