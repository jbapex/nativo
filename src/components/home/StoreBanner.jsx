
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingBag, Star, Store } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function StoreBanner() {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:16px_16px]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-white/10 transform skew-x-12 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.h1 
              className="text-4xl sm:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Venda seus produtos online
            </motion.h1>
            <motion.p 
              className="text-lg sm:text-xl mb-8 text-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Cadastre sua loja gratuitamente e alcance milhares de clientes
            </motion.p>
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => window.location.href = createPageUrl("StoreProfile")}
              >
                <Store className="w-5 h-5 mr-2" />
                Criar Minha Loja
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white hover:bg-white/20"
                onClick={() => window.location.href = "#featured-stores"}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Explorar Lojas
              </Button>
            </motion.div>
            <motion.div 
              className="mt-8 flex items-center gap-8 text-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>100% Grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>Suporte 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>Chat WhatsApp</span>
              </div>
            </motion.div>
          </div>
          
          <div className="hidden md:block">
            <motion.img
              src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800"
              alt="Loja Online"
              className="rounded-lg shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
