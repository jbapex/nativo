
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";

export default function ProductCard({ product, onFavoriteClick }) {
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
    
    // Ouvir mudanças de autenticação
    const handleAuthChange = () => {
      checkUser();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (user && product?.id) {
      checkFavoriteStatus();
    } else {
      setIsFavorite(false);
    }
  }, [user, product?.id]);

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || !product?.id) return;
    
    try {
      const { Favorites: FavoritesAPI } = await import("@/api/apiClient");
      const favoritesList = await FavoritesAPI.list();
      const favoriteIds = favoritesList.map(fav => fav.product_id || fav.id);
      setIsFavorite(favoriteIds.includes(product.id));
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
    }
  };
  const handleContactClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product?.id) return;
    
    try {
      // Obter produto atual
      const currentProduct = await Product.get(product.id);
      
      // Garantir que o valor é um número
      const currentMessages = Number(currentProduct.total_messages || 0);
      
      // Incrementar contagem
      await Product.update(product.id, {
        total_messages: currentMessages + 1
      });

      // Buscar WhatsApp da loja se o produto não tiver
      let storeWhatsapp = null;
      if (!product.whatsapp && product.store_id) {
        try {
          const { Store } = await import("@/api/entities");
          const storeData = await Store.get(product.store_id);
          storeWhatsapp = storeData?.whatsapp;
        } catch (error) {
          console.error('Erro ao buscar WhatsApp da loja:', error);
        }
      }
      
      // Formatar número do WhatsApp (remover caracteres não numéricos e adicionar código do país se necessário)
      let whatsappNumber = (product.whatsapp || storeWhatsapp)?.replace(/\D/g, '') || '';
      if (whatsappNumber && !whatsappNumber.startsWith('55')) {
        // Se não começar com 55 (código do Brasil), adicionar
        whatsappNumber = '55' + whatsappNumber;
      }
      
      if (!whatsappNumber) {
        alert("Número de WhatsApp não disponível para este produto");
        return;
      }

      // Abrir WhatsApp - sempre do marketplace (NATIVO)
      const message = `Olá! Vi seu produto "${product.name}" no NATIVO e gostaria de mais informações.`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error);
    }
  };

  const handleFavorite = async (e) => {
    e.preventDefault(); // Previne navegação do Link
    e.stopPropagation();
    
    if (!user) {
      // Se não estiver logado, chamar callback para abrir login
      if (onFavoriteClick) {
        onFavoriteClick(product);
      }
      return;
    }
    
    if (loading) return;
    
    setLoading(true);
    const wasFavorite = isFavorite;
    
    try {
      // Otimistic update
      setIsFavorite(!wasFavorite);
      
      const { Favorites: FavoritesAPI } = await import("@/api/apiClient");
      
      if (wasFavorite) {
        // Remover dos favoritos
        await FavoritesAPI.remove(product.id);
      } else {
        // Adicionar aos favoritos
        await FavoritesAPI.add(product.id);
        // Incrementar contador de favoritos do produto
        try {
          await Product.update(product.id, {
            total_favorites: (product.total_favorites || 0) + 1
          });
        } catch (error) {
          console.error("Erro ao incrementar contador de favoritos:", error);
        }
      }

      if (onFavoriteClick) {
        onFavoriteClick(product);
      }
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
      // Reverter estado em caso de erro
      setIsFavorite(wasFavorite);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className={`bg-white/90 backdrop-blur-sm hover:bg-white ${
                isFavorite ? 'text-red-500' : ''
              }`}
              onClick={handleFavorite}
              disabled={loading}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {product.compare_price && product.compare_price > product.price && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium text-lg truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="block text-sm text-gray-400 line-through">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(product.compare_price)}
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={handleContactClick}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Contato
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
