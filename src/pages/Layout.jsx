
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

  useEffect(() => {
    checkAuth();
    
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
    
    return () => {
      window.removeEventListener('storeOnlineEntered', handleStoreOnlineEntered);
      window.removeEventListener('storeOnlineExited', handleStoreOnlineExited);
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
    if (!isAuthenticated) return;
    
    try {
      const [notificationsData, unreadData] = await Promise.all([
        NotificationsAPI.list({ limit: 10 }),
        NotificationsAPI.getUnreadCount()
      ]);
      setNotifications(notificationsData || []);
      setUnreadCount(unreadData?.count || 0);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: 1 } : n)
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
      // Erro 401 é esperado quando usuário não está logado - não logar no console
      if (error.status !== 401 && !error.silent) {
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
  const isStoreOnlineRoute = pathname.startsWith('/loja-online/') || pathname.startsWith('/store-online/') || 
                             currentPageName === "StoreOnline" || currentPageName === "storeonline";
  
  // Ocultar header nativo apenas quando estiver na rota da loja online
  // NÃO ocultar quando estiver em /produto/:id, mesmo que venha da loja online
  const isProductPage = pathname.startsWith('/produto/') || pathname.startsWith('/product/');
  const hideNativeHeader = (isInStoreOnline || isStoreOnlineRoute) && !isProductPage;
  
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
  
  // Header azul em todas as páginas exceto Home (ou usar cor da loja premium se estiver no modo loja)
  // Se estiver no modo loja premium, sempre usar cor da loja (mesmo na Home)
  const isHeaderBlue = storeTheme ? true : (currentPageName !== "Home");

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNativeHeader && (
      <header 
        className={`${isHeaderBlue ? (storeTheme ? 'text-white' : 'bg-blue-600 text-white') : 'bg-white'} shadow-sm sticky top-0 z-50`}
        style={storeTheme ? {
          backgroundColor: storeTheme.header,
          color: 'white'
        } : (isHeaderBlue ? {
          backgroundColor: '#2563eb',
          color: 'white'
        } : {})}
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
                      <StoreIcon className="w-8 h-8 text-white" />
                    )}
                    <div className="flex flex-col leading-tight">
                      <span className="font-bold text-lg text-white">
                        {storeOnlineStoreInfo.name || "Loja Premium"}
                      </span>
                      <span className="text-xs text-white/80">
                        Loja Premium na NATIVO
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
              <Link to={createPageUrl("Home")} className="flex-shrink-0 flex items-center">
                  <span 
                    className={`${isHeaderBlue ? 'text-white' : (storeTheme ? '' : 'text-blue-600')} font-bold text-xl`}
                    style={!isHeaderBlue && storeTheme ? { color: storeTheme.primary } : {}}
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
                        ? `${isHeaderBlue ? 'text-white border-b-2 border-white' : 'text-blue-600 border-b-2 border-blue-500'}` 
                        : `${isHeaderBlue ? 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/50' : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'}`
                  }`}
                >
                  <Home className="w-4 h-4 mr-1" />
                  Início
                </Link>
                )}
                {isAuthenticated && (
                  <>
                    {hasApprovedStore && (
                    <Link 
                      to={createPageUrl("StoreProfile")} 
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        currentPageName === "StoreProfile" 
                            ? `${isHeaderBlue ? 'text-white border-b-2 border-white' : (storeTheme ? 'border-b-2' : 'text-blue-600 border-b-2 border-blue-500')}` 
                            : `${isHeaderBlue ? 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/50' : (storeTheme ? 'hover:border-b-2' : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300')}`
                        }`}
                        style={!isHeaderBlue && storeTheme ? {
                          color: currentPageName === "StoreProfile" ? storeTheme.primary : storeTheme.text,
                          borderColor: currentPageName === "StoreProfile" ? storeTheme.primary : 'transparent'
                        } : {}}
                        onMouseEnter={(e) => {
                          if (!isHeaderBlue && storeTheme && currentPageName !== "StoreProfile") {
                            e.currentTarget.style.color = storeTheme.primary;
                            e.currentTarget.style.borderColor = storeTheme.primary + '50';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isHeaderBlue && storeTheme && currentPageName !== "StoreProfile") {
                            e.currentTarget.style.color = storeTheme.text;
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <StoreIcon className="w-4 h-4 mr-1" />
                      Minha Loja
                    </Link>
                    )}
                    {isAdmin && (
                      <Link 
                        to={createPageUrl("AdminDashboard")} 
                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                          currentPageName.startsWith("Admin") 
                            ? `${isHeaderBlue ? 'text-white border-b-2 border-white' : (storeTheme ? 'border-b-2' : 'text-blue-600 border-b-2 border-blue-500')}` 
                            : `${isHeaderBlue ? 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/50' : (storeTheme ? 'hover:border-b-2' : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300')}`
                        }`}
                        style={!isHeaderBlue && storeTheme ? {
                          color: currentPageName.startsWith("Admin") ? storeTheme.primary : storeTheme.text,
                          borderColor: currentPageName.startsWith("Admin") ? storeTheme.primary : 'transparent'
                        } : {}}
                        onMouseEnter={(e) => {
                          if (!isHeaderBlue && storeTheme && !currentPageName.startsWith("Admin")) {
                            e.currentTarget.style.color = storeTheme.primary;
                            e.currentTarget.style.borderColor = storeTheme.primary + '50';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isHeaderBlue && storeTheme && !currentPageName.startsWith("Admin")) {
                            e.currentTarget.style.color = storeTheme.text;
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <Shield className="w-4 h-4 mr-1" />
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
                        className={`relative ${isHeaderBlue ? 'text-white hover:bg-white/10' : (storeTheme ? '' : '')}`}
                        style={!isHeaderBlue && storeTheme ? {
                          color: storeTheme.text
                        } : {}}
                        onMouseEnter={(e) => {
                          if (!isHeaderBlue && storeTheme) {
                            e.currentTarget.style.color = storeTheme.primary;
                            e.currentTarget.style.backgroundColor = storeTheme.primary + '10';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isHeaderBlue && storeTheme) {
                            e.currentTarget.style.color = storeTheme.text;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <Bell className="w-5 h-5" />
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
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Nenhuma notificação
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className={`p-3 cursor-pointer ${notification.read === 0 ? 'bg-blue-50' : ''}`}
                            onClick={() => {
                              if (notification.read === 0) {
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
                            {notification.read === 0 && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                            )}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Link
                    to={createPageUrl("Cart")}
                    className={`relative inline-flex items-center p-2 ${isHeaderBlue ? 'text-white/80 hover:text-white' : (storeTheme ? '' : 'text-gray-500 hover:text-gray-700')}`}
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
                    <ShoppingCart className="w-5 h-5" />
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
                    className={`text-sm ${isHeaderBlue ? 'text-white' : (storeTheme ? '' : 'text-gray-700')}`}
                    style={!isHeaderBlue && storeTheme ? {
                      color: storeTheme.text
                    } : {}}
                  >
                    Olá, {user?.full_name?.split(' ')[0] || "Usuário"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                  <Button 
                        variant={isHeaderBlue ? "default" : "outline"}
                    size="sm" 
                        className={`flex items-center ${
                          isHeaderBlue 
                            ? 'bg-white text-blue-600 hover:bg-white/90 border-white' 
                            : (storeTheme ? '' : '')
                        }`}
                        style={!isHeaderBlue && storeTheme ? {
                          color: storeTheme.primary,
                          borderColor: storeTheme.primary + '40'
                        } : {}}
                        onMouseEnter={(e) => {
                          if (!isHeaderBlue && storeTheme) {
                            e.currentTarget.style.backgroundColor = storeTheme.primary + '10';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isHeaderBlue && storeTheme) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <UserIcon className="w-4 h-4 mr-1" />
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
                  className={`flex items-center ${
                    isHeaderBlue 
                      ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' 
                      : ''
                  }`}
                >
                  <UserIcon className="w-4 h-4 mr-1" />
                  Entrar
                </Button>
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={toggleMobileMenu}
                className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                  isHeaderBlue 
                    ? 'text-white/80 hover:text-white hover:bg-white/10' 
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="sr-only">Abrir menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
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

      <main className="flex-1">
        {children}
      </main>

      {!hideNativeHeader && (
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <Link to={createPageUrl("Home")} className="text-blue-600 font-bold text-lg">
                NATIVO
              </Link>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} NATIVO. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
      )}

      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={handleLoginSuccess}
    />
    </div>
  );
}
