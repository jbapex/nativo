import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, ArrowRight, MapPin, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from 'react-router-dom';
import { User } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import LoginDialog from "@/components/LoginDialog";

export default function Hero() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const handleSellerClick = () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }

    if (user?.role === "store") {
      navigate(createPageUrl("StoreProfile"));
      return;
    }

    navigate(createPageUrl("StoreProfile"));
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500">
      {/* Padrão de fundo animado */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
        }}
      />
      
      {/* Efeito de luz/brilho */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-cyan-300/20 blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-blue-900/30 blur-3xl"></div>
      
      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <motion.div 
            className="lg:w-1/2 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Conecte-se ao comércio<br className="hidden sm:inline" /> 
              <span className="text-cyan-200 font-extrabold">local</span> com o NATIVO
            </motion.h1>
            
            <motion.p 
              className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              A plataforma que conecta você diretamente aos melhores vendedores da sua região. 
              Compre local, fortaleça sua comunidade.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                onClick={() => document.querySelector('input').focus()}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Explorar Produtos
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white/50 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                onClick={handleSellerClick}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Vender Produtos
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap gap-6 sm:gap-8 mt-8 sm:mt-10 text-white justify-center lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-bold text-2xl sm:text-3xl text-white">+2000</span>
                <span className="text-xs sm:text-sm text-blue-100">Produtos</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-bold text-2xl sm:text-3xl text-white">+500</span>
                <span className="text-xs sm:text-sm text-blue-100">Vendedores</span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-bold text-2xl sm:text-3xl text-white">+5000</span>
                <span className="text-xs sm:text-sm text-blue-100">Clientes</span>
              </div>
            </motion.div>
            
            <motion.div
              className="mt-8 flex flex-wrap gap-3 items-center justify-center lg:justify-start text-blue-100 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-cyan-300" />
                <span>100% Grátis</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-cyan-300" />
                <span>Sem intermediários</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-cyan-300" />
                <span>Contato direto</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2 mt-6 lg:mt-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 transform rotate-1 hover:rotate-0 transition-all duration-300">
                <img
                  src="https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&w=800"
                  alt="NATIVO Marketplace"
                  className="w-full rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white p-3 sm:p-4 rounded-lg shadow-xl flex items-center gap-3 sm:gap-4 transform hover:scale-105 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="bg-green-500 w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">Contato direto</p>
                  <p className="text-xs sm:text-sm text-gray-500">via WhatsApp</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-gradient-to-br from-blue-600 to-cyan-500 p-3 sm:p-4 rounded-lg shadow-xl transform hover:scale-105 transition-all"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-white font-bold text-sm sm:text-base">100% Grátis</p>
                <p className="text-xs sm:text-sm text-white">para comprar e vender</p>
              </motion.div>
              
              <motion.div 
                className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/90 backdrop-blur p-2 sm:p-3 rounded-lg shadow-xl flex items-center gap-2 sm:gap-3 transform hover:scale-105 transition-all"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">Produtos locais</p>
                  <p className="text-xs text-gray-500">perto de você</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <LoginDialog 
        open={loginPromptOpen} 
        onOpenChange={setLoginPromptOpen}
        onSuccess={() => {
          checkAuth(); // Recarregar dados após login
        }}
      />
    </div>
  );
}