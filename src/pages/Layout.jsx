
import React, { useEffect } from 'react';
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  ShoppingBag,
  Store as StoreIcon,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Shield,
  Heart,
  ShoppingCart,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoginDialog from "@/components/LoginDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Notifications as NotificationsAPI } from "@/api/entities";
import { Settings } from "@/api/entities-local";
import { applyAppearanceColors, applyFavicon } from "@/utils/applyColors";
import FacebookPixel from "@/components/tracking/FacebookPixel";
import CampaignBanner from "@/components/home/CampaignBanner";
import Footer from "@/components/layout/Footer";
import { MarketplaceCampaigns } from "@/api/apiClient";

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [hasApprovedStore, setHasApprovedStore] = React.useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [cartItemsCount, setCartItemsCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [storeOnlineCustomizations, setStoreOnlineCustomizations] = React.useState(null);
  const [storeOnlineStoreInfo, setStoreOnlineStoreInfo] = React.useState(null);
  const [isInStoreOnline, setIsInStoreOnline] = React.useState(false);
  const [facebookPixelId, setFacebookPixelId] = React.useState("");
  const [heroPrimaryColor, setHeroPrimaryColor] = React.useState("#2563eb");
  const [heroSecondaryColor, setHeroSecondaryColor] = React.useState("#06b6d4");
  const hasAppliedCachedTheme = React.useRef(false);
  const [campaignColors, setCampaignColors] = React.useState(null);

  useEffect(() => {
    // Aplicar aparência em cache imediatamente para evitar flash
    if (!hasAppliedCachedTheme.current) {
      try {
        const cachedAppearance = localStorage.getItem("appearanceSettings");
        if (cachedAppearance) {
          const parsed = JSON.parse(cachedAppearance);
          applyAppearanceColors(parsed);
          if (parsed.primaryColor) setHeroPrimaryColor(parsed.primaryColor);
          if (parsed.secondaryColor) setHeroSecondaryColor(parsed.secondaryColor);
        }
        hasAppliedCachedTheme.current = true;
      } catch (error) {
        console.warn("Não foi possível aplicar aparência em cache:", error);
      }
    }

    checkAuth();
    loadAppearanceSettings();
    loadCampaignColors();
    
    // Verificar se está no modo loja premium
    const checkStoreOnlineMode = () => {
      const isInStoreOnlineMode = sessionStorage.getItem('isInStoreOnline') === 'true';
      const savedCustomizations = sessionStorage.getItem('storeOnlineCustomizations');
      const savedStoreInfo = sessionStorage.getItem('storeOnlineStoreInfo');
      
      setIsInStoreOnline(isInStoreOnlineMode);
      
      if (isInStoreOnlineMode && savedCustomizations) {
        try {
          setStoreOnlineCustomizations(JSON.parse(savedCustomizations));
        } catch (e) {
          console.error("Erro ao parsear customizações:", e);
          setStoreOnlineCustomizations(null);
        }
      } else {
        setStoreOnlineCustomizations(null);
      }
      
      if (isInStoreOnlineMode && savedStoreInfo) {
        try {
          setStoreOnlineStoreInfo(JSON.parse(savedStoreInfo));
        } catch (error) {
          console.error("Erro ao parsear dados da loja:", error);
          setStoreOnlineStoreInfo(null);
        }
      } else {
        setStoreOnlineStoreInfo(null);
      }
    };
    
    checkStoreOnlineMode();
    
    // Ouvir eventos de entrada/saída da loja premium
    const handleStoreOnlineEntered = (event) => {
      if (event.detail?.customizations) {
        setStoreOnlineCustomizations(event.detail.customizations);
        setIsInStoreOnline(true);
      }
      if (event.detail?.store) {
        setStoreOnlineStoreInfo(event.detail.store);
      }
    };
    
    const handleStoreOnlineExited = () => {
      setStoreOnlineCustomizations(null);
      setStoreOnlineStoreInfo(null);
      setIsInStoreOnline(false);
    };
    
    window.addEventListener('storeOnlineEntered', handleStoreOnlineEntered);
    window.addEventListener('storeOnlineExited', handleStoreOnlineExited);
    
    // Verificar periodicamente (para casos de navegação direta)
    const interval = setInterval(checkStoreOnlineMode, 1000);
    
    // Ouvir mudanças nas configurações de aparência
    const handleAppearanceChange = () => {
      loadAppearanceSettings();
    };
    
    window.addEventListener('appearanceChanged', handleAppearanceChange);
    
    return () => {
      window.removeEventListener('storeOnlineEntered', handleStoreOnlineEntered);
      window.removeEventListener('storeOnlineExited', handleStoreOnlineExited);
      window.removeEventListener('appearanceChanged', handleAppearanceChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCartCount();
      loadNotifications();
      checkApprovedStore();
    } else {
      // Limpar dados quando não autenticado
      setCartItemsCount(0);
      setNotifications([]);
      setUnreadCount(0);
      setHasApprovedStore(false);
    }

    // Ouvir para saber quando um produto é adicionado
    const handleProductAdded = (event) => {
      if (event.key === 'product_added' && event.newValue) {
        // Armazenar flag em sessionStorage para que outros componentes possam reagir
        sessionStorage.setItem('product_just_added', 'true');
      }
    };

    // Ouvir mudanças no carrinho
    const handleCartChange = () => {
      if (isAuthenticated) {
        loadCartCount();
      }
    };

    // Ouvir eventos de login/logout
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleProductAdded);
    window.addEventListener('cartUpdated', handleCartChange);
    window.addEventListener('authChanged', handleAuthChange);
    
    // Verificar carrinho periodicamente
    const cartInterval = setInterval(() => {
      if (isAuthenticated) loadCartCount();
    }, 5000);
    
    // Verificar notificações periodicamente
    const notificationsInterval = setInterval(() => {
      if (isAuthenticated) loadNotifications();
    }, 30000); // A cada 30 segundos
    
    return () => {
      window.removeEventListener('storage', handleProductAdded);
      window.removeEventListener('cartUpdated', handleCartChange);
      window.removeEventListener('authChanged', handleAuthChange);
      clearInterval(cartInterval);
      clearInterval(notificationsInterval);
    };
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      const [notificationsData, unreadData] = await Promise.all([
        NotificationsAPI.list({ limit: 10 }),
        NotificationsAPI.getUnreadCount()
      ]);
      // Garantir que notificationsData seja sempre um array
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setUnreadCount(unreadData?.count || 0);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      // Em caso de erro, garantir que seja um array vazio
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        (Array.isArray(prev) ? prev : []).map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const loadCartCount = async () => {
    if (!isAuthenticated) {
      setCartItemsCount(0);
      return;
    }
    
    try {
      const { Cart } = await import("@/api/apiClient");
      const cartData = await Cart.get();
      setCartItemsCount(cartData?.total_items || 0);
    } catch (error) {
      // Ignorar erros silenciosamente
      setCartItemsCount(0);
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(userData.role === "admin");
      return true; // Retornar true para indicar sucesso
    } catch (error) {
      // Erro 401/403 é esperado quando usuário não está logado ou token expirou - não logar no console
      if (error.status !== 401 && error.status !== 403 && !error.silent) {
        console.error("Erro ao verificar autenticação:", error);
      }
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setHasApprovedStore(false);
      return false; // Retornar false para indicar falha
    } finally {
      setLoading(false);
    }
  };

  const loadAppearanceSettings = async () => {
    try {
      const allSettings = await Settings.getAll();
      
      // Carregar Facebook Pixel ID
      const pixelId = allSettings.facebook_pixel_id?.value || "";
      setFacebookPixelId(pixelId);
      
      // Salvar cores do Hero para usar no header
      setHeroPrimaryColor(allSettings.primary_color?.value || "#2563eb");
      setHeroSecondaryColor(allSettings.secondary_color?.value || "#06b6d4");
      
      const appearance = {
        primaryColor: allSettings.primary_color?.value || "#2563eb",
        secondaryColor: allSettings.secondary_color?.value || "#06b6d4",
        accentColor: allSettings.accent_color?.value || "#10b981",
        backgroundColor: allSettings.background_color?.value || "#ffffff",
        textColor: allSettings.text_color?.value || "#1f2937",
        headerColor: allSettings.header_color?.value || "#ffffff",
        footerColor: allSettings.footer_color?.value || "#f9fafb",
        buttonPrimaryColor: allSettings.button_primary_color?.value || "#2563eb",
        buttonSecondaryColor: allSettings.button_secondary_color?.value || "#06b6d4",
        buttonTextColor: allSettings.button_text_color?.value || "#ffffff",
        linkColor: allSettings.link_color?.value || "#2563eb",
        linkHoverColor: allSettings.link_hover_color?.value || "#1d4ed8",
        cardBackgroundColor: allSettings.card_background_color?.value || "#ffffff",
        cardBorderColor: allSettings.card_border_color?.value || "#e5e7eb",
        cardShadowColor: allSettings.card_shadow_color?.value || "rgba(0, 0, 0, 0.1)",
        inputBackgroundColor: allSettings.input_background_color?.value || "#ffffff",
        inputBorderColor: allSettings.input_border_color?.value || "#d1d5db",
        inputFocusColor: allSettings.input_focus_color?.value || "#2563eb",
        textSecondaryColor: allSettings.text_secondary_color?.value || "#6b7280",
        textMutedColor: allSettings.text_muted_color?.value || "#9ca3af",
        borderColor: allSettings.border_color?.value || "#e5e7eb",
        sectionBackgroundColor: allSettings.section_background_color?.value || "#f9fafb",
        badgePrimaryColor: allSettings.badge_primary_color?.value || "#2563eb",
        badgeSecondaryColor: allSettings.badge_secondary_color?.value || "#06b6d4",
        badgeSuccessColor: allSettings.badge_success_color?.value || "#10b981",
        badgeErrorColor: allSettings.badge_error_color?.value || "#ef4444",
        badgeWarningColor: allSettings.badge_warning_color?.value || "#f59e0b",
        hoverColor: allSettings.hover_color?.value || "rgba(37, 99, 235, 0.1)",
        focusRingColor: allSettings.focus_ring_color?.value || "#2563eb",
        favicon: allSettings.favicon?.value || "",
      };
      
      // Salvar cores do Hero para usar no header
      setHeroPrimaryColor(allSettings.primary_color?.value || "#2563eb");
      setHeroSecondaryColor(allSettings.secondary_color?.value || "#06b6d4");
      
      // Aplicar todas as cores
      applyAppearanceColors(appearance);

      // Guardar aparência em cache para evitar flash em próximos carregamentos
      try {
        localStorage.setItem("appearanceSettings", JSON.stringify(appearance));
      } catch (error) {
        console.warn("Não foi possível salvar aparência em cache:", error);
      }
      
      // Aplicar favicon
      if (appearance.favicon) {
        applyFavicon(appearance.favicon);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de aparência:", error);
    }
  };

  const loadCampaignColors = async () => {
    try {
      const pathname = location.pathname;
      const campaignMatch = pathname.match(/\/(campanhas|campaigns)\/([^\/]+)/);
      
      if (campaignMatch) {
        const slug = campaignMatch[2];
        // Buscar campanha ativa que corresponda ao slug
        const activeCampaigns = await MarketplaceCampaigns.getActive();
        const campaign = Array.isArray(activeCampaigns) 
          ? activeCampaigns.find(c => c.slug === slug || c.id === slug)
          : null;
        
        if (campaign && campaign.badge_color) {
          setCampaignColors({
            badgeColor: campaign.badge_color,
            primaryColor: campaign.badge_color,
            secondaryColor: campaign.badge_color
          });
        } else {
          setCampaignColors(null);
        }
      } else {
        setCampaignColors(null);
      }
    } catch (error) {
      // Se não encontrar campanha ou erro, limpar cores
      setCampaignColors(null);
    }
  };

  useEffect(() => {
    loadCampaignColors();
  }, [location.pathname]);

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

  const handleLogout = async () => {
    try {
      await User.logout();
      // Limpar todos os estados
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setCartItemsCount(0);
      setNotifications([]);
      setUnreadCount(0);
      // Disparar evento para que outras páginas reajam
      window.dispatchEvent(new Event('authChanged'));
      // Redirecionar usando React Router (sem recarregar a página)
      navigate(createPageUrl("Home"), { replace: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo em caso de erro, limpar o estado local
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setCartItemsCount(0);
      setNotifications([]);
      setUnreadCount(0);
      // Disparar evento mesmo em caso de erro
      window.dispatchEvent(new Event('authChanged'));
      navigate(createPageUrl("Home"), { replace: true });
    }
  };

  const handleLoginSuccess = async () => {
    // Recarregar dados do usuário após login
    const authSuccess = await checkAuth();
    
    if (authSuccess) {
      // Aguardar um pouco para garantir que o estado foi atualizado
      // O useEffect com dependência em isAuthenticated vai disparar automaticamente
      // mas vamos forçar o recarregamento também
      setTimeout(async () => {
        try {
          // Forçar recarregamento do carrinho, notificações e verificação de loja
          await loadCartCount();
          await loadNotifications();
          await checkApprovedStore();
          // Disparar evento para outros componentes
          window.dispatchEvent(new Event('authChanged'));
        } catch (error) {
          // Ignorar erros silenciosamente
        }
      }, 100);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Não mostrar o layout para as páginas de admin
  if (currentPageName && currentPageName.startsWith("Admin")) {
    return <>{children}</>;
  }

  // Não mostrar o header nativo para a loja online premium
  // Verificar se está na loja online premium através do sessionStorage ou da rota
  const pathname = location.pathname;
  const isStoreOnlineRoute = pathname.startsWith('/loja-online/') || 
                             pathname.startsWith('/store-online/') || 
                             currentPageName === "StoreOnline" || 
                             currentPageName === "storeonline";
  
  // Verificar se é um slug personalizado (rota curta que não é reservada)
  // Se sessionStorage indica que está na loja online, ocultar rodapé do NATIVO
  const isCustomSlugStore = isInStoreOnline && pathname.length > 1 && 
    !pathname.startsWith('/loja-online/') && 
    !pathname.startsWith('/store-online/') &&
    !pathname.startsWith('/produto/') &&
    !pathname.startsWith('/product/') &&
    !pathname.startsWith('/loja/') &&
    !pathname.startsWith('/store/') &&
    !pathname.startsWith('/admin/') &&
    !pathname.startsWith('/home') &&
    !pathname.startsWith('/campanhas/') &&
    !pathname.startsWith('/campaigns/');
  
  const shouldHideNativeFooter = isInStoreOnline || isStoreOnlineRoute || isCustomSlugStore;
  
  // Ocultar header nativo apenas quando estiver na rota da loja online ou página de campanha
  // NÃO ocultar quando estiver em /produto/:id, mesmo que venha da loja online
  const isProductPage = pathname.startsWith('/produto/') || pathname.startsWith('/product/');
  const isCampaignPage = pathname.startsWith('/campanhas/') || pathname.startsWith('/campaigns/');
  const hideNativeHeader = ((isInStoreOnline || isStoreOnlineRoute) && !isProductPage) || isCampaignPage;
  
  // Tema da loja premium (se estiver no modo loja)
  const storeTheme = isInStoreOnline && storeOnlineCustomizations ? (() => {
    const primaryColor = storeOnlineCustomizations.primary_color || '#2563eb';
    const secondaryColor = storeOnlineCustomizations.secondary_color || '#06b6d4';
    const headerColorRaw = (storeOnlineCustomizations.header_color || '').trim().toLowerCase();
    const invalidHeaderColors = ['', 'white', '#fff', '#ffffff', 'rgb(255,255,255)', 'rgba(255,255,255,1)'];
    const resolvedHeaderColor = invalidHeaderColors.includes(headerColorRaw)
      ? primaryColor
      : (storeOnlineCustomizations.header_color || primaryColor);
    
    return {
      primary: primaryColor,
      secondary: secondaryColor,
      header: resolvedHeaderColor,
      text: storeOnlineCustomizations.text_color || '#1f2937',
    };
  })() : null;
  
  // Função para determinar se uma cor é clara ou escura e retornar a cor de texto apropriada
  const getContrastTextColor = (backgroundColor) => {
    if (!backgroundColor) return '#1f2937'; // padrão escuro
    
    // Se for um gradiente, usar a primeira cor
    let color = backgroundColor;
    if (backgroundColor.includes('gradient')) {
      // Extrair primeira cor do gradiente
      const match = backgroundColor.match(/linear-gradient\([^,]+,\s*([^,)]+)/);
      if (match) color = match[1].trim();
    }
    
    // Converter hex para RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    // Converter rgb() para objeto
    const rgbToObject = (rgb) => {
      const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
      return null;
    };
    
    let rgb = null;
    if (color.startsWith('#')) {
      rgb = hexToRgb(color);
    } else if (color.startsWith('rgb')) {
      rgb = rgbToObject(color);
    }
    
    if (!rgb) return '#1f2937'; // padrão se não conseguir converter
    
    // Calcular luminância relativa (fórmula WCAG)
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    
    // Se a luminância for menor que 0.5, a cor é escura, então usar texto branco
    // Se for maior ou igual a 0.5, a cor é clara, então usar texto escuro
    return luminance < 0.5 ? '#ffffff' : '#1f2937';
  };
  
  // Verificar se está na página do logista (StoreProfile)
  const isStoreProfilePage = pathname.includes('/perfil-loja') || pathname.includes('/store-profile') || 
                             currentPageName === "StoreProfile" || currentPageName === "store-profile";
  
  // Verificar se está na página de produto
  const isProductPageRoute = pathname.startsWith('/produto/') || pathname.startsWith('/product/') || 
                             currentPageName === "ProductDetail" || currentPageName === "product-detail";
  
  // Header azul em todas as páginas exceto Home, Campanha e StoreProfile (ou usar cor da loja premium se estiver no modo loja)
  // Se estiver no modo loja premium, sempre usar cor da loja (mesmo na Home)
  // Se estiver na página de campanha ou StoreProfile, não aplicar gradiente do Hero
  // Página de produto DEVE usar o gradiente do Hero (mesmo que currentPageName não seja detectado)
  // Aplicar gradiente se: não for loja premium, não for campanha, não for StoreProfile, e (não for Home OU for página de produto)
  const shouldUseHeroGradient = !storeTheme && !isCampaignPage && !isStoreProfilePage && 
                                (isProductPageRoute || (currentPageName !== "Home" && currentPageName !== "home"));
  const isHeaderBlue = storeTheme ? true : (currentPageName !== "Home");
  
  // Determinar cor de fundo do header e cor de texto correspondente
  let headerBackground = '';
  let headerTextColor = '#1f2937'; // padrão escuro
  
  // Prioridade: 1. Cores da campanha (se estiver na rota de campanha), 2. Tema da loja, 3. Gradiente do Hero, 4. Azul padrão, 5. Branco
  if (campaignColors && isCampaignPage) {
    headerBackground = campaignColors.badgeColor;
    headerTextColor = getContrastTextColor(campaignColors.badgeColor);
  } else if (storeTheme) {
    headerBackground = storeTheme.header;
    headerTextColor = getContrastTextColor(storeTheme.header);
  } else if (shouldUseHeroGradient) {
    headerBackground = `linear-gradient(to right, ${heroPrimaryColor}, ${heroSecondaryColor})`;
    // Para gradiente, usar a cor primária para calcular contraste
    headerTextColor = getContrastTextColor(heroPrimaryColor);
  } else if (isHeaderBlue) {
    headerBackground = '#2563eb';
    headerTextColor = getContrastTextColor('#2563eb');
  } else {
    headerBackground = '#ffffff';
    headerTextColor = getContrastTextColor('#ffffff');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNativeHeader && (
      <header 
        className="shadow-sm sticky top-0 z-50"
        style={{
          background: headerBackground,
          color: headerTextColor
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {isHeaderBlue && storeTheme && storeOnlineStoreInfo ? (
                <Link 
                  to={`/loja-online/${storeOnlineStoreInfo.id}`} 
                  className="flex-shrink-0 flex items-center hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    {storeOnlineStoreInfo.logo ? (
                      <img 
                        src={storeOnlineStoreInfo.logo} 
                        alt={storeOnlineStoreInfo.name || "Loja"}
                        className="w-10 h-10 rounded-full object-cover border border-white/30"
                      />
                    ) : (
                      <StoreIcon className="w-8 h-8" style={{ color: headerTextColor }} />
                    )}
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold text-lg" style={{ color: headerTextColor }}>
                        {storeOnlineStoreInfo.name || "Loja Premium"}
                      </span>
                      <span className="text-xs" style={{ color: headerTextColor, opacity: 0.8 }}>
                        Loja Premium na NATIVO
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
              <Link to={createPageUrl("Home")} className="flex-shrink-0 flex items-center">
                  <span 
                    className="font-bold text-xl"
                    style={{ color: headerTextColor }}
                  >
                    NATIVO
                  </span>
              </Link>
              )}
              <nav className="hidden md:ml-6 md:flex md:space-x-8">
                {!storeTheme && (
                <Link 
                  to={createPageUrl("Home")} 
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    currentPageName === "Home" 
                        ? 'border-b-2' 
                        : 'hover:border-b-2'
                  }`}
                  style={{
                    color: currentPageName === "Home" ? headerTextColor : headerTextColor,
                    opacity: currentPageName === "Home" ? 1 : 0.8,
                    borderColor: headerTextColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.borderColor = headerTextColor;
                  }}
                  onMouseLeave={(e) => {
                    if (currentPageName !== "Home") {
                      e.currentTarget.style.opacity = '0.8';
                    }
                  }}
                >
                  <Home className="w-4 h-4 mr-1" style={{ color: 'inherit' }} />
                  Início
                </Link>
                )}
                {isAuthenticated && (
                  <>
                    {hasApprovedStore && (
                    <Link 
                      to="/loja/dashboard" 
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        currentPageName === "StoreProfile" 
                            ? 'border-b-2' 
                            : 'hover:border-b-2'
                        }`}
                        style={{
                          color: headerTextColor,
                          opacity: currentPageName === "StoreProfile" ? 1 : 0.8,
                          borderColor: headerTextColor
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.borderColor = headerTextColor;
                        }}
                        onMouseLeave={(e) => {
                          if (currentPageName !== "StoreProfile") {
                            e.currentTarget.style.opacity = '0.8';
                          }
                        }}
                      >
                        <StoreIcon className="w-4 h-4 mr-1" style={{ color: 'inherit' }} />
                      Minha Loja
                    </Link>
                    )}
                    {isAdmin && (
                      <Link 
                        to={createPageUrl("AdminDashboard")} 
                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                          currentPageName.startsWith("Admin") 
                            ? 'border-b-2' 
                            : 'hover:border-b-2'
                        }`}
                        style={{
                          color: headerTextColor,
                          opacity: currentPageName.startsWith("Admin") ? 1 : 0.8,
                          borderColor: headerTextColor
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.borderColor = headerTextColor;
                        }}
                        onMouseLeave={(e) => {
                          if (!currentPageName.startsWith("Admin")) {
                            e.currentTarget.style.opacity = '0.8';
                          }
                        }}
                      >
                        <Shield className="w-4 h-4 mr-1" style={{ color: 'inherit' }} />
                        Admin
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </div>

            <div className="hidden md:ml-6 md:flex md:items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative hover:bg-black/10"
                        style={{ color: headerTextColor }}
                      >
                        <Bell className="w-5 h-5" style={{ color: 'inherit' }} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between p-2 border-b">
                        <h3 className="font-semibold">Notificações</h3>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs h-auto py-1"
                          >
                            Marcar todas como lidas
                          </Button>
                        )}
                      </div>
                      {(!notifications || !Array.isArray(notifications) || notifications.length === 0) ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Nenhuma notificação
                        </div>
                      ) : (
                        (Array.isArray(notifications) ? notifications : []).map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className={`p-3 cursor-pointer ${(notification.read === false || notification.read === 0) ? 'bg-blue-50' : ''}`}
                            onClick={() => {
                              if (notification.read === false || notification.read === 0) {
                                handleMarkAsRead(notification.id);
                              }
                              if (notification.link) {
                                window.location.href = notification.link;
                              }
                              setNotificationsOpen(false);
                            }}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {(notification.read === false || notification.read === 0) && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                            )}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Link
                    to={createPageUrl("Cart")}
                    className="relative inline-flex items-center p-2 hover:opacity-80 transition-opacity"
                    style={{ color: headerTextColor, opacity: 0.9 }}
                  >
                    <ShoppingCart className="w-5 h-5" style={{ color: 'inherit' }} />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={createPageUrl("Favorites")}
                    className={`inline-flex items-center p-2 ${isHeaderBlue ? 'text-white/80 hover:text-white' : (storeTheme ? '' : 'text-gray-500 hover:text-gray-700')}`}
                    style={!isHeaderBlue && storeTheme ? {
                      color: storeTheme.text
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!isHeaderBlue && storeTheme) {
                        e.currentTarget.style.color = storeTheme.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isHeaderBlue && storeTheme) {
                        e.currentTarget.style.color = storeTheme.text;
                      }
                    }}
                  >
                    <Heart className="w-5 h-5" />
                  </Link>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: headerTextColor }}
                  >
                    Olá, {user?.full_name?.split(' ')[0] || "Usuário"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center"
                        style={{
                          color: headerTextColor,
                          borderColor: headerTextColor + '40',
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = headerTextColor + '10';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <UserIcon className="w-4 h-4 mr-1" style={{ color: 'inherit' }} />
                        Conta
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Profile")} className="cursor-pointer">
                          <UserIcon className="w-4 h-4 mr-2" />
                          Meu Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : loading ? (
                <div className={`animate-pulse h-8 w-20 rounded ${isHeaderBlue ? 'bg-white/20' : 'bg-gray-200'}`}></div>
              ) : (
                <Button 
                  onClick={() => setLoginDialogOpen(true)}
                  className="flex items-center"
                  style={{
                    color: headerTextColor,
                    borderColor: headerTextColor + '40',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = headerTextColor + '10';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <UserIcon className="w-4 h-4 mr-1" style={{ color: 'inherit' }} />
                  Entrar
                </Button>
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset hover:bg-black/10"
                style={{ color: headerTextColor }}
              >
                <span className="sr-only">Abrir menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" style={{ color: 'inherit' }} />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" style={{ color: 'inherit' }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} ${isHeaderBlue ? (storeTheme ? '' : 'bg-blue-600') : 'bg-white'}`}
          style={storeTheme ? {
            backgroundColor: storeTheme.header
          } : (isHeaderBlue ? {
            backgroundColor: '#2563eb'
          } : {})}
        >
          <div className="pt-2 pb-3 space-y-1">
            {!storeTheme && (
            <Link
              to={createPageUrl("Home")}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                currentPageName === "Home"
                    ? isHeaderBlue
                      ? "border-white text-white bg-white/10"
                      : "border-blue-500 text-blue-700 bg-blue-50"
                    : isHeaderBlue
                      ? "border-transparent text-white/80 hover:bg-white/10 hover:border-white/50 hover:text-white"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              }`}
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Home className="w-5 h-5 mr-2" />
                Início
              </div>
            </Link>
            )}
            {isAuthenticated && (
              <>
                {hasApprovedStore && (
                <Link
                  to={createPageUrl("StoreProfile")}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    currentPageName === "StoreProfile"
                        ? isHeaderBlue
                          ? "border-white text-white bg-white/10"
                          : "border-blue-500 text-blue-700 bg-blue-50"
                        : isHeaderBlue
                          ? "border-transparent text-white/80 hover:bg-white/10 hover:border-white/50 hover:text-white"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                      <StoreIcon className="w-5 h-5 mr-2" />
                    Minha Loja
                  </div>
                </Link>
                )}
                {isAdmin && (
                  <Link
                    to={createPageUrl("AdminDashboard")}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      currentPageName.startsWith("Admin")
                        ? isHeaderBlue
                          ? "border-white text-white bg-white/10"
                          : "border-blue-500 text-blue-700 bg-blue-50"
                        : isHeaderBlue
                          ? "border-transparent text-white/80 hover:bg-white/10 hover:border-white/50 hover:text-white"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Admin
                    </div>
                  </Link>
                )}
              </>
            )}
          </div>
          
          <div className={`pt-4 pb-3 border-t ${isHeaderBlue ? 'border-white/20' : 'border-gray-200'}`}>
            {isAuthenticated ? (
              <div className="space-y-1">
                <div className={`px-4 py-2 text-sm ${isHeaderBlue ? 'text-white/80' : 'text-gray-500'}`}>
                  Olá, {user?.full_name || "Usuário"}
                </div>
                <Link
                  to={createPageUrl("Cart")}
                  onClick={closeMobileMenu}
                  className={`block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium w-full text-left ${
                    isHeaderBlue
                      ? 'text-white/80 hover:bg-white/10 hover:border-white/50 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Carrinho
                    </div>
                    {cartItemsCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </div>
                </Link>
                <Link
                  to={createPageUrl("Profile")}
                  onClick={closeMobileMenu}
                  className={`block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium ${
                    isHeaderBlue
                      ? 'text-white/80 hover:bg-white/10 hover:border-white/50 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 mr-2" />
                    Meu Perfil
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className={`block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium w-full text-left ${
                    isHeaderBlue
                      ? 'text-white/80 hover:bg-white/10 hover:border-white/50 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 mr-2" />
                    Sair
                  </div>
                </button>
              </div>
            ) : loading ? (
              <div className="animate-pulse h-8 mx-4 bg-gray-200 rounded"></div>
            ) : (
              <div className="px-4">
                <Button 
                  onClick={() => {
                    setLoginDialogOpen(true);
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center justify-center"
                >
                  <UserIcon className="w-5 h-5 mr-2" />
                  Entrar
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      <main className="flex-1" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        {/* Banner de Campanha Fixo */}
        {!isInStoreOnline && <CampaignBanner />}
        {children ? (
          <div style={{ minHeight: '400px' }}>
        {children}
            </div>
        ) : (
          <div className="p-8 text-center bg-red-50 border-2 border-red-200 rounded m-4">
            <p className="font-bold text-red-600">⚠️ ERRO: Nenhum conteúdo foi passado para Layout</p>
            <p className="text-sm mt-2 text-red-500">currentPageName: {currentPageName}</p>
            <p className="text-sm text-red-500">pathname: {pathname}</p>
          </div>
        )}
      </main>

      {/* Não mostrar rodapé do NATIVO quando estiver na loja online do lojista */}
      {!shouldHideNativeFooter && <Footer />}

      {/* Facebook Pixel */}
      {facebookPixelId && <FacebookPixel pixelId={facebookPixelId} />}

      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={handleLoginSuccess}
    />
    </div>
  );
}
