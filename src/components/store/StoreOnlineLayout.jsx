import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
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

  return (
    <header 
      className="sticky top-0 z-50 shadow-lg"
      style={{ 
        backgroundColor: theme.primary,
        color: 'white'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-3 border-b border-white/20">
          <Link 
            to={`/loja-online/${store.id}`}
            className="flex items-center gap-4 hover:opacity-90 transition-opacity"
          >
            {store.logo ? (
              <img 
                src={store.logo} 
                alt={store.name} 
                className="w-16 h-16 rounded-lg object-cover border-2 border-white/30 shadow-md"
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center shadow-md bg-white/20 backdrop-blur-sm"
              >
                <StoreIcon className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{store.name}</h1>
              {store.description && (
                <p className="text-sm opacity-90 line-clamp-1 text-white/90">{store.description}</p>
              )}
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Carrinho (se usuário estiver logado) */}
            {isAuthenticated && (
              <Link
                to={createPageUrl("Cart")}
                className="relative inline-flex items-center p-2 text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </Badge>
                )}
              </Link>
            )}
            
            {/* Link para Meus Pedidos (se usuário estiver logado) */}
            {isAuthenticated && (
              <Button
                asChild
                variant="ghost"
                className="flex items-center gap-2 text-white hover:bg-white/10"
              >
                <Link to={`/loja-online/${store.id}/meus-pedidos`}>
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Meus Pedidos</span>
                </Link>
              </Button>
            )}
            
            {/* Botão de Login/Logout */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-white hover:bg-white/10"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{user?.full_name || "Conta"}</span>
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
                className="flex items-center gap-2 text-white hover:bg-white/10"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            )}
            
            {customizations.whatsapp_number && (
              <Button
                asChild
                className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow bg-white hover:bg-white/95"
                style={{ color: theme.primary }}
              >
                <a 
                  href={`https://wa.me/${customizations.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Barra de Busca Grande - Estilo Mercado Livre */}
        {customizations.show_search && (
          <div className="py-4">
            <form onSubmit={handleSearch} className="relative max-w-4xl mx-auto">
              <Input
                placeholder="Busque produtos, marcas e muito mais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-32 text-lg border-2 rounded-lg shadow-lg focus:shadow-xl transition-shadow bg-white text-gray-900"
                style={{ 
                  borderColor: 'white',
                  color: '#111827', // Garantir que o texto seja visível (cinza escuro)
                }}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-6 shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: theme.secondary || theme.primary, 
                  color: 'white' 
                }}
              >
                Buscar
              </Button>
            </form>
          </div>
        )}

        {/* Menu de Categorias Horizontal */}
        {customizations.show_categories && categories.length > 0 && (
          <div className="py-2 border-t border-white/20 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max px-2">
              <span className="text-sm font-semibold px-3 py-2 whitespace-nowrap text-white">Categorias:</span>
              <Link
                to={`/loja-online/${store.id}?view=products`}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'text-white shadow-md bg-white/20 backdrop-blur-sm'
                    : 'hover:bg-white/10 text-white/90'
                }`}
              >
                Todas
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat}
                  to={`/loja-online/${store.id}?view=products&category=${encodeURIComponent(cat)}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'text-white shadow-md bg-white/20 backdrop-blur-sm'
                      : 'hover:bg-white/10 text-white/90'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={handleLoginSuccess}
      />
    </header>
  );
}

export function StoreOnlineFooter({ store, customizations, theme }) {
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
                  to={`/loja-online/${store.id}`}
                  className="text-sm hover:underline opacity-80"
                  style={{ color: theme.primary }}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link 
                  to={`/loja-online/${store.id}?view=products`}
                  className="text-sm hover:underline opacity-80"
                  style={{ color: theme.primary }}
                >
                  Todos os Produtos
                </Link>
              </li>
              {typeof window !== 'undefined' && localStorage.getItem('token') && (
                <li>
                  <Link 
                    to={`/loja-online/${store.id}/meus-pedidos`}
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
            <div>
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

