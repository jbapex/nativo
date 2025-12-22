
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Store, MessageCircle, Heart, Clock, Check, Star, Eye, Truck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Reviews } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import LoginDialog from "@/components/LoginDialog";
import CountdownTimer from "@/components/products/CountdownTimer";
import { trackProduct } from "@/utils/navigationTracker";

export default function ProductGrid({ products, loading, emptyMessage, appearanceSettings = {}, hideHeader = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [favoriteSuccess, setFavoriteSuccess] = useState(false);
  const [favoriteProduct, setFavoriteProduct] = useState(null);
  const [productRatings, setProductRatings] = useState({});

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

  // Carregar avaliações dos produtos
  useEffect(() => {
    if (!products || products.length === 0) return;

    const loadRatings = async () => {
      try {
        const ratingsPromises = products.map(async (product) => {
          try {
            const rating = await Reviews.getAverage(product.id);
            return { productId: product.id, rating };
          } catch (error) {
            return { productId: product.id, rating: { average_rating: 0, total_reviews: 0 } };
          }
        });
        
        const ratings = await Promise.all(ratingsPromises);
        const ratingsMap = {};
        ratings.forEach(({ productId, rating }) => {
          ratingsMap[productId] = rating;
        });
        setProductRatings(ratingsMap);
      } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
      }
    };

    loadRatings();
  }, [products]);

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Carregar favoritos usando a API correta
      try {
        const { Favorites: FavoritesAPI } = await import("@/api/apiClient");
        const favoritesList = await FavoritesAPI.list();
        // favoritesList é um array de objetos com product_id
        const favoriteIds = favoritesList.map(fav => fav.product_id || fav.id);
        setFavorites(favoriteIds);
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        // Fallback para o método antigo se a API falhar
        setFavorites(userData.favorites || []);
      }
    } catch (error) {
      // Erro 401/403/429 é esperado quando usuário não está logado ou há rate limit - não logar no console
      if (error.status !== 401 && error.status !== 403 && error.status !== 429 && !error.silent) {
        console.error("Erro ao verificar autenticação:", error);
      }
      setUser(null);
      setFavorites([]);
    }
  };

  const handleFavorite = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }
    
    const productId = product.id;
    const isCurrentlyFavorite = favorites.includes(productId);
    
    try {
      // Usar a API de favoritos correta
      const { Favorites: FavoritesAPI } = await import("@/api/apiClient");
      
      if (isCurrentlyFavorite) {
        // Remover dos favoritos
        await FavoritesAPI.remove(productId);
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        // Adicionar aos favoritos
        await FavoritesAPI.add(productId);
        setFavorites([...favorites, productId]);
        setFavoriteProduct(product);
        setFavoriteSuccess(true);
        
        setTimeout(() => {
          setFavoriteSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
      // Reverter estado em caso de erro
      if (isCurrentlyFavorite) {
        setFavorites([...favorites, productId]);
      } else {
        setFavorites(favorites.filter(id => id !== productId));
      }
    }
  };

  const handleWhatsApp = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    
    // Sempre do marketplace (NATIVO)
    const message = `Olá! Vi seu produto "${product.name}" no NATIVO e gostaria de mais informações.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Formatar preço para moeda brasileira
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 sm:h-64 w-full" />
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-6 w-1/3 mb-3" />
              <Skeleton className="h-8 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{emptyMessage || "Nenhum produto encontrado"}</h3>
          <p className="text-gray-500 mb-6">
            Tente buscar com outras palavras-chave ou categorias diferentes.
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Explorar outros produtos
          </Button>
        </div>
      </div>
    );
  }

  // Obter categorias e lojas únicas dos produtos (mantido para uso futuro se necessário)
  const uniqueCategories = [...new Set(products.map(p => ({
    id: p.category_id || p.category,
    name: p.category_name || p.category
  })).filter(c => c.id))];

  const uniqueStores = [...new Set(products.map(p => ({
    id: p.store_id,
    name: p.store_name
  })).filter(s => s.id && s.name))];

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 
            className="text-xl sm:text-2xl font-bold"
            style={{ color: appearanceSettings?.primaryColor || appearanceSettings?.buttonPrimaryColor || '#2563eb' }}
          >
            Produtos para você
          </h2>
        </div>
      )}
      
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="h-full flex"
          >
            <Link 
              to={`/produto/${product.id}`} 
              className="h-full w-full block flex flex-col"
              onClick={() => trackProduct(product)}
            >
              <Card className="overflow-hidden h-full flex flex-col border-2 hover:shadow-sm transition-all duration-200 group bg-white relative"
                    style={{
                      borderColor: (() => {
                        const primaryColor = appearanceSettings.primaryColor || appearanceSettings.buttonPrimaryColor || '#2563eb';
                        // Converter hex para rgba com opacidade 0.3
                        const hex = primaryColor.replace('#', '');
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        return `rgba(${r}, ${g}, ${b}, 0.3)`;
                      })(),
                      backgroundColor: appearanceSettings.cardBackgroundColor || '#ffffff',
                      boxShadow: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                      const primaryColor = appearanceSettings.primaryColor || appearanceSettings.buttonPrimaryColor || '#2563eb';
                      const hex = primaryColor.replace('#', '');
                      const r = parseInt(hex.substr(0, 2), 16);
                      const g = parseInt(hex.substr(2, 2), 16);
                      const b = parseInt(hex.substr(4, 2), 16);
                      e.currentTarget.style.borderColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      const primaryColor = appearanceSettings.primaryColor || appearanceSettings.buttonPrimaryColor || '#2563eb';
                      const hex = primaryColor.replace('#', '');
                      const r = parseInt(hex.substr(0, 2), 16);
                      const g = parseInt(hex.substr(2, 2), 16);
                      const b = parseInt(hex.substr(4, 2), 16);
                      e.currentTarget.style.borderColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
                    }}>
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.images?.[0] || product.image_url || "https://placehold.co/400x400/e2e8f0/a1a1aa?text=Sem+Imagem"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:opacity-95 transition-opacity duration-200"
                    loading="lazy"
                  />
                  
                  {/* Badge de Desconto Verde (estilo da foto) */}
                  {(() => {
                    let discountPercent = 0;
                    if (product.campaign && product.campaign.discount_percent) {
                      discountPercent = Math.round(product.campaign.discount_percent);
                    } else if (product.compare_price && product.compare_price > product.price) {
                      discountPercent = Math.round((1 - product.price / product.compare_price) * 100);
                    }
                    
                    if (discountPercent > 0) {
                      return (
                        <div className="absolute top-1.5 left-1.5 z-20 bg-green-600 flex items-center justify-center px-1.5 py-0.5 rounded text-white font-semibold text-[10px] leading-tight">
                          -{discountPercent}%
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {product.featured ? (
                    <Badge className="absolute top-2 right-12 bg-yellow-500 text-white font-medium">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      Destaque
                    </Badge>
                  ) : null}
                  
                  <button
                    className={`absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      favorites.includes(product.id) 
                        ? "bg-red-500 shadow-sm" 
                        : "bg-white/95 backdrop-blur-sm hover:bg-white shadow-sm"
                    }`}
                    onClick={(e) => handleFavorite(e, product)}
                  >
                    <Heart className={`w-3.5 h-3.5 transition-colors ${
                      favorites.includes(product.id) 
                        ? "text-white fill-white" 
                        : "text-gray-600"
                    }`} />
                  </button>
                  
                  {/* Temporizador de Oferta - Base da Imagem */}
                  {product.promotion && product.promotion.show_timer && product.promotion.end_date && (
                    <div className="absolute bottom-0 left-0 right-0">
                      <CountdownTimer endDate={product.promotion.end_date} className="text-xs compact" />
                    </div>
                  )}
                  
                  {/* Removido: informações de visualizações/novo que apareciam no hover */}
                </div>

                <CardContent className="p-2 sm:p-2.5 space-y-0.5 flex-1 flex flex-col">
                  {/* Nome do Produto */}
                  {product.name && (
                    <h3 className="font-medium text-[11px] sm:text-xs line-clamp-2 text-gray-900 leading-tight min-h-[2rem]">
                      {product.name}
                    </h3>
                  )}
                  
                  {/* Avaliação com Estrelas (estilo Havan) */}
                  {productRatings[product.id] && productRatings[product.id].total_reviews > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avgRating = Number(productRatings[product.id].average_rating) || 0;
                          return (
                            <Star
                              key={star}
                              className={`w-2.5 h-2.5 ${
                                star <= Math.round(avgRating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-gray-500">
                        ({productRatings[product.id].total_reviews})
                      </span>
                    </div>
                  )}
                  
                  {/* Preços (estilo Havan - mais compacto) */}
                  <div className="space-y-0.5">
                    {product.compare_price && product.compare_price > product.price ? (
                      <>
                        <span className="text-[10px] text-gray-400 line-through block">
                          {formatCurrency(product.compare_price)}
                        </span>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 block">
                          {formatCurrency(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 block">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                    
                    {/* Parcelamento (estilo Havan) */}
                    {product.price && (() => {
                      const installments = 10;
                      const installmentValue = product.price / installments;
                      return (
                        <span className="text-[10px] text-gray-500 block">
                          {installments}x de {formatCurrency(installmentValue)}
                        </span>
                      );
                    })()}
                  </div>
                  
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {products.length >= 12 && (
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            size="lg" 
            className="border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Carregar Mais Produtos
          </Button>
        </div>
      )}
      
      <LoginDialog 
        open={loginPromptOpen} 
        onOpenChange={setLoginPromptOpen}
        onSuccess={() => {
          checkUser(); // Recarregar dados após login
        }}
      />

      <AnimatePresence>
        {favoriteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-50 flex items-center gap-3 border border-green-100 max-w-xs"
          >
            <div className="bg-green-100 rounded-full p-2">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">Adicionado aos favoritos</h4>
              <p className="text-xs text-gray-500 line-clamp-1">{favoriteProduct?.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
