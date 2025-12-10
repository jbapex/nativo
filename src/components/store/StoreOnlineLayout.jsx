import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import {
  Store as StoreIcon,
  Search,
  MessageSquare,
  Instagram,
  Facebook,
  Package,
  ShoppingCart,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import LoginDialog from "@/components/LoginDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function StoreOnlineHeader({ 
  store, 
  customizations, 
  theme, 
  searchTerm, 
  setSearchTerm, 
  categories, 
  selectedCategory, 
  setSelectedCategory,
  onSearch 
}) {
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Função auxiliar para gerar link da loja (usa slug se disponível, senão ID)
  const getStoreLink = (path = '') => {
    if (store?.slug) {
      return `/${store.slug}${path ? path : ''}`;
    }
    return `/loja-online/${store?.id || ''}${path ? path : ''}`;
  };

  useEffect(() => {
    checkAuth();
    loadCartCount();

    // Ouvir mudanças no carrinho
    const handleCartChange = () => {
      if (isAuthenticated) {
        loadCartCount();
      }
    };

    // Ouvir eventos de login/logout
    const handleAuthChange = () => {
      checkAuth();
      loadCartCount();
    };

    window.addEventListener('cartUpdated', handleCartChange);
    window.addEventListener('authChanged', handleAuthChange);
    
    // Verificar carrinho periodicamente
    const cartInterval = setInterval(() => {
      if (isAuthenticated) loadCartCount();
    }, 5000);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartChange);
      window.removeEventListener('authChanged', handleAuthChange);
      clearInterval(cartInterval);
    };
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const { User } = await import("@/api/entities");
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setCartItemsCount(0);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      const { User } = await import("@/api/entities");
      await User.logout();
      setUser(null);
      setIsAuthenticated(false);
      setCartItemsCount(0);
      window.dispatchEvent(new Event('authChanged'));
      // Não redirecionar, apenas atualizar o estado
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setUser(null);
      setIsAuthenticated(false);
      setCartItemsCount(0);
      window.dispatchEvent(new Event('authChanged'));
    }
  };

  const handleLoginSuccess = async () => {
    const authSuccess = await checkAuth();
    if (authSuccess) {
      setTimeout(async () => {
        await loadCartCount();
        window.dispatchEvent(new Event('authChanged'));
      }, 100);
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
      setCartItemsCount(0);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch();
    }
  };

  // Cor do header (usar header_color se disponível, senão primary)
  const headerColor = customizations?.header_color || theme.primary;
  // Cor da barra de categorias
  const categoriesBarColor = customizations?.categories_bar_color || '#f97316';
  
  // Função para determinar cor do texto baseado no background
  const getContrastTextColor = (bgColor) => {
    if (!bgColor) return 'white';
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const handleSupportClick = () => {
    const whatsapp = customizations?.whatsapp_number || store?.whatsapp_number;
    if (whatsapp) {
      const link = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        "Olá! Preciso de atendimento na loja online."
      )}`;
      window.open(link, '_blank');
      return;
    }
    // Fallback: rolar até a seção de contato no rodapé, se existir
    const contactEl = document.getElementById('store-contact-section');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTrackOrderClick = () => {
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }
    navigate(getStoreLink('/meus-pedidos'));
  };

  return (
    <>
      {/* Header Principal - Escuro */}
      <header 
        className="sticky top-0 z-50 shadow-lg"
        style={{ 
          backgroundColor: headerColor,
          color: getContrastTextColor(headerColor)
        }}
      >
        <div className="w-full px-12 sm:px-16 lg:px-20">
          {/* Top Bar - Logo, busca e ícones na mesma linha */}
          <div className="flex items-center gap-4 py-3">
            {/* Logo da Loja à esquerda */}
            <Link 
              to={getStoreLink()}
              className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0"
            >
              {store.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.name} 
                  className="w-24 h-24 rounded object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded flex items-center justify-center bg-white/20">
                  <StoreIcon className="w-12 h-12" style={{ color: getContrastTextColor(headerColor) }} />
                </div>
              )}
            </Link>
            
            {/* Barra de Busca - Centralizada e expansível */}
            {customizations.show_search && (
              <form onSubmit={handleSearch} className="flex-1 relative max-w-3xl mx-auto">
                <Input
                  placeholder="O que deseja procurar?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-16 pl-6 pr-14 text-xl border-2 rounded-lg shadow-md focus:shadow-lg transition-shadow bg-white text-gray-900 placeholder:text-xl placeholder:text-gray-500"
                  style={{ 
                    borderColor: 'transparent',
                    color: '#111827',
                    fontSize: '1.25rem',
                  }}
                />
                <Search 
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 w-7 h-7" 
                  style={{ color: categoriesBarColor }}
                />
              </form>
            )}
            
            {/* Ícones à direita */}
            <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
              {/* Atendimento */}
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-12 px-4"
                style={{ color: getContrastTextColor(headerColor) }}
                onClick={handleSupportClick}
              >
                <span className="text-3xl font-normal">?</span>
                <span className="hidden lg:inline text-lg font-normal">Atendimento</span>
              </Button>
              
              {/* Rastrear Pedido */}
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-12 px-4"
                style={{ color: getContrastTextColor(headerColor) }}
                onClick={handleTrackOrderClick}
              >
                <Package className="w-7 h-7" />
                <span className="hidden lg:inline text-lg font-normal">Rastrear pedido</span>
              </Button>
              
              {/* Minha Conta / Login */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-12 px-4"
                      style={{ color: getContrastTextColor(headerColor) }}
                    >
                      <UserIcon className="w-7 h-7" />
                      <span className="hidden lg:inline text-lg font-normal">Minha Conta</span>
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
              ) : (
                <Button 
                  onClick={() => setLoginDialogOpen(true)}
                  variant="ghost"
                  className="flex items-center gap-2 h-12 px-4"
                  style={{ color: getContrastTextColor(headerColor) }}
                >
                  <UserIcon className="w-7 h-7" />
                  <span className="hidden lg:inline text-lg font-normal">Minha Conta</span>
                </Button>
              )}
              
              {/* Carrinho */}
              <Link
                to={createPageUrl("Cart")}
                className="relative inline-flex items-center p-4 rounded-md transition-colors hover:bg-white/10"
                style={{ color: getContrastTextColor(headerColor) }}
              >
                <ShoppingCart className="w-8 h-8" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center p-0 text-sm font-bold"
                  >
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </Badge>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Categorias Separada - Cor customizável */}
      {customizations.show_categories && categories.length > 0 && (
        <div 
          className="sticky top-[var(--header-height)] z-40 shadow-md"
          style={{ 
            backgroundColor: categoriesBarColor,
            color: getContrastTextColor(categoriesBarColor),
            '--header-height': 'auto'
          }}
        >
          <div className="w-full px-12 sm:px-16 lg:px-20">
            <div className="flex items-center justify-between gap-2 py-5">
              {/* Limitar a 8 categorias visíveis */}
              {categories.slice(0, 8).map(cat => (
                <Link
                  key={cat}
                  to={getStoreLink(`?view=products&category=${encodeURIComponent(cat)}`)}
                  className={`flex-1 px-4 py-3 rounded text-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-2 text-center ${
                    selectedCategory === cat
                      ? 'bg-white/20 font-bold shadow-sm'
                      : 'hover:bg-white/10'
                  }`}
                  style={{ color: getContrastTextColor(categoriesBarColor) }}
                >
                  {cat}
                  <span className="text-base">▼</span>
                </Link>
              ))}
              
              {/* Botão "Mais" se houver mais de 8 categorias */}
              {categories.length > 8 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex-shrink-0 px-4 py-3 text-lg font-semibold whitespace-nowrap transition-colors flex items-center justify-center gap-2"
                      style={{ color: getContrastTextColor(categoriesBarColor) }}
                    >
                      Mais
                      <span className="text-base">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
                    {categories.slice(8).map(cat => (
                      <DropdownMenuItem key={cat} asChild>
                        <Link
                          to={getStoreLink(`?view=products&category=${encodeURIComponent(cat)}`)}
                          className="cursor-pointer w-full"
                        >
                          {cat}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      )}
      
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

export function StoreOnlineFooter({ store, customizations, theme }) {
  // Função auxiliar para gerar link da loja (usa slug se disponível, senão ID)
  const getStoreLink = (path = '') => {
    if (store?.slug) {
      return `/${store.slug}${path ? path : ''}`;
    }
    return `/loja-online/${store?.id || ''}${path ? path : ''}`;
  };
  
  return (
    <footer 
      className="mt-12 py-12 border-t-2"
      style={{ backgroundColor: theme.footer }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Sobre */}
          <div>
            <h3 className="font-bold text-lg mb-4">{store.name}</h3>
            {store.description && (
              <p className="text-sm opacity-80 mb-4">{store.description}</p>
            )}
          </div>

          {/* Categorias */}
          <div>
            <h3 className="font-bold text-lg mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to={getStoreLink()}
                  className="text-sm hover:underline opacity-80"
                  style={{ color: theme.primary }}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link 
                  to={getStoreLink('?view=products')}
                  className="text-sm hover:underline opacity-80"
                  style={{ color: theme.primary }}
                >
                  Todos os Produtos
                </Link>
              </li>
              {typeof window !== 'undefined' && localStorage.getItem('token') && (
                <li>
                  <Link 
                    to={getStoreLink('/meus-pedidos')}
                    className="text-sm hover:underline opacity-80 flex items-center gap-2"
                    style={{ color: theme.primary }}
                  >
                    <Package className="w-3 h-3" />
                    Meus Pedidos
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contato */}
          {customizations.contact_section_enabled && (
            <div id="store-contact-section">
              <h3 className="font-bold text-lg mb-4">Contato</h3>
              <div className="space-y-3">
                {customizations.whatsapp_number && (
                  <a
                    href={`https://wa.me/${customizations.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline"
                    style={{ color: theme.primary }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {customizations.instagram_url && (
                  <a
                    href={customizations.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline"
                    style={{ color: theme.primary }}
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                )}
                {customizations.facebook_url && (
                  <a
                    href={customizations.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline"
                    style={{ color: theme.primary }}
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Informações */}
          <div>
            <h3 className="font-bold text-lg mb-4">Informações</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#" className="hover:underline opacity-80">Sobre nós</Link>
              </li>
              <li>
                <Link to="#" className="hover:underline opacity-80">Política de privacidade</Link>
              </li>
              <li>
                <Link to="#" className="hover:underline opacity-80">Termos de uso</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t text-center text-sm opacity-60">
          <p>&copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

