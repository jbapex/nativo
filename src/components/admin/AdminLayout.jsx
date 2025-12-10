import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  Users,
  Settings,
  Tag,
  MapPin,
  CreditCard,
  Home,
  Package,
  ArrowLeft,
  Megaphone
} from "lucide-react";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  const menuItems = [
    {
      name: "Lojas",
      icon: <Store className="w-5 h-5" />,
      path: createPageUrl("AdminStores")
    },
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: createPageUrl("AdminDashboard")
    },
    {
      name: "Categorias",
      icon: <Tag className="w-5 h-5" />,
      path: createPageUrl("AdminCategories")
    },
    {
      name: "Cidades",
      icon: <MapPin className="w-5 h-5" />,
      path: createPageUrl("AdminCities")
    },
    {
      name: "Planos",
      icon: <CreditCard className="w-5 h-5" />,
      path: createPageUrl("AdminPlans")
    },
    {
      name: "Produtos",
      icon: <Package className="w-5 h-5" />,
      path: createPageUrl("AdminProducts")
    },
    {
      name: "Assinaturas",
      icon: <Users className="w-5 h-5" />,
      path: createPageUrl("AdminSubscriptions")
    },
    {
      name: "Campanhas",
      icon: <Megaphone className="w-5 h-5" />,
      path: createPageUrl("AdminCampaigns")
    },
    {
      name: "Configurações",
      icon: <Settings className="w-5 h-5" />,
      path: createPageUrl("AdminSettings")
    }
  ];

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
          <Link to={createPageUrl("AdminStores")} className="flex items-center">
            <Store className="w-6 h-6 text-blue-600" />
            <span className="ml-2 text-lg font-bold">NATIVO Admin</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-2 rounded-md ${
                  currentPath === item.path
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
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
              <Link to={createPageUrl("AdminStores")} className="flex items-center">
                <Store className="w-6 h-6 text-blue-600" />
                <span className="ml-2 text-lg font-bold">NATIVO Admin</span>
              </Link>
              <MobileHomeButton />
            </div>
            
            <div className="flex overflow-x-auto pb-2 gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center p-2 rounded-md min-w-[60px] ${
                    currentPath === item.path
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}