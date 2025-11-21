import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  BarChart3,
  MessageSquare,
  Settings,
  Package,
  ArrowLeft,
  Home,
  Store as StoreIconLucide,
  CreditCard
} from "lucide-react";

export default function StoreLayout({ children, store, plan, isStoreOnlineActive }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      page: "dashboard",
    },
    {
      name: "Produtos",
      icon: <ShoppingBag className="w-5 h-5" />,
      page: "products",
    },
    {
      name: "Pedidos",
      icon: <Package className="w-5 h-5" />,
      page: "orders",
    },
    {
      name: "Minha Assinatura",
      icon: <CreditCard className="w-5 h-5" />,
      page: "subscription",
    },
    {
      name: "Estatísticas",
      icon: <BarChart3 className="w-5 h-5" />,
      page: "analytics",
    },
    ...(isStoreOnlineActive ? [{
      name: "Loja Online",
      icon: <StoreIconLucide className="w-5 h-5" />,
      page: "online",
    }] : []),
    {
      name: "Marketing",
      icon: <MessageSquare className="w-5 h-5" />,
      page: "marketing",
    },
    {
      name: "Configurações",
      icon: <Settings className="w-5 h-5" />,
      page: "settings",
    },
  ];

  const getPageFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('page') || 'dashboard';
  };

  const isActive = (item) => {
    const currentPage = getPageFromUrl();
    return currentPage === item.page;
  };

  const handleMenuClick = (page) => {
    navigate(`${createPageUrl("StoreProfile")}?page=${page}`);
  };

  // Botão mobile para retornar à página inicial
  const MobileHomeButton = () => (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => navigate(createPageUrl("Home"))}
      className="flex items-center"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      <span>Voltar ao site</span>
    </Button>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            {store?.logo ? (
              <img 
                src={store.logo} 
                alt={store.name} 
                className="w-8 h-8 rounded-full object-cover border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">{store?.name || "Minha Loja"}</span>
              <span className="text-xs text-gray-500">{plan?.name || "Plano Básico"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleMenuClick(item.page)}
                className={`w-full flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive(item)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" className="w-full justify-start">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="md:hidden bg-white p-4 border-b">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {store?.logo ? (
                  <img 
                    src={store.logo} 
                    alt={store.name} 
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{store?.name || "Minha Loja"}</span>
                  <span className="text-xs text-gray-500">{plan?.name || "Plano Básico"}</span>
                </div>
              </div>
              <MobileHomeButton />
            </div>
            
            <div className="flex overflow-x-auto pb-2 gap-2">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item.page)}
                  className={`flex flex-col items-center p-2 rounded-md min-w-[60px] transition-colors ${
                    isActive(item)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

