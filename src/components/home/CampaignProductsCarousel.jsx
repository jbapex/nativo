import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Zap, Clock, Store, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Product, Reviews } from "@/api/entities";
import { MarketplaceCampaigns } from "@/api/apiClient";
import { trackProduct } from "@/utils/navigationTracker";

// Timer compacto estilo Shopee
function CampaignTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="bg-black text-white px-3 py-1 rounded text-sm font-mono">
      {String(timeLeft.hours).padStart(2, '0')} {String(timeLeft.minutes).padStart(2, '0')} {String(timeLeft.seconds).padStart(2, '0')}
    </div>
  );
}

export default function CampaignProductsCarousel({ campaign, appearanceSettings = {} }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [productRatings, setProductRatings] = useState({});
  const [productsPerView, setProductsPerView] = useState(2); // Iniciar com 2 (mobile-first)
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    if (campaign) {
      loadCampaignProducts();
    }
    
    // Ajustar produtos por visualização baseado no tamanho da tela
    const updateProductsPerView = () => {
      const width = window.innerWidth;
      setIsSmallScreen(width < 640);
      if (width >= 1024) setProductsPerView(4); // lg - 4 produtos
      else if (width >= 768) setProductsPerView(3); // md - 3 produtos
      else if (width >= 640) setProductsPerView(2); // sm - 2 produtos
      else setProductsPerView(2); // mobile - 2 produtos (alterado de 1 para 2)
    };

    updateProductsPerView();
    window.addEventListener('resize', updateProductsPerView);
    return () => window.removeEventListener('resize', updateProductsPerView);
  }, [campaign]);

  // Resetar índice quando productsPerView mudar (ex: ao redimensionar tela)
  useEffect(() => {
    setCurrentIndex(0);
  }, [productsPerView]);

  // Auto-play do carrossel
  useEffect(() => {
    // Verificar se há produtos suficientes para navegar
    if (products.length <= productsPerView) return;

    const autoPlayInterval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + productsPerView;
        if (nextIndex >= products.length) {
          return 0; // Voltar ao início
        }
        return nextIndex;
      });
    }, 5000); // Avançar a cada 5 segundos

    return () => clearInterval(autoPlayInterval);
  }, [products.length, productsPerView]);

  const loadCampaignProducts = async () => {
    try {
      setLoading(true);
      
      // Buscar participações aprovadas da campanha (público - não requer autenticação)
      const participations = await MarketplaceCampaigns.getPublicParticipations(campaign.id);
      
      if (!participations || participations.length === 0) {
        setProducts([]);
        return;
      }

      // Filtrar apenas participações aprovadas
      const approvedParticipations = participations.filter(p => p.status === "approved");
      
      if (approvedParticipations.length === 0) {
        setProducts([]);
        return;
      }

      // Buscar produtos pelos IDs
      const productIds = approvedParticipations.map(p => p.product_id);
      const allProducts = await Product.filter({});
      
      // Mapear produtos com informações da campanha
      const campaignProducts = allProducts
        .filter(product => productIds.includes(product.id))
        .map(product => {
          const participation = approvedParticipations.find(p => p.product_id === product.id);
          
          return {
            ...product,
            campaign: {
              ...campaign,
              discount_percent: participation.discount_percent,
              discount_fixed: participation.discount_fixed,
              promo_price: participation.promo_price,
              original_price: participation.original_price
            },
            // Aplicar preço promocional
            price: participation.promo_price || product.price,
            compare_price: participation.original_price || product.compare_price || product.price
          };
        })
        .slice(0, 20); // Limitar a 20 produtos para performance
      
      setProducts(campaignProducts);
      
      // Carregar avaliações dos produtos
      try {
        const ratingsPromises = campaignProducts.map(async (product) => {
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
    } catch (error) {
      console.error("Erro ao carregar produtos da campanha:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (products.length <= productsPerView) return;
    setCurrentIndex((prev) => {
      const nextIndex = prev + productsPerView;
      // Se passar do limite, voltar ao início
      if (nextIndex >= products.length) {
        return 0;
      }
      return nextIndex;
    });
  };

  const prevSlide = () => {
    if (products.length <= productsPerView) return;
    setCurrentIndex((prev) => {
      const prevIndex = prev - productsPerView;
      // Se for menor que 0, ir para o último grupo possível
      if (prevIndex < 0) {
        const lastGroupIndex = Math.floor((products.length - 1) / productsPerView) * productsPerView;
        return lastGroupIndex;
      }
      return prevIndex;
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(price);
  };

  const calculateDiscount = (originalPrice, promoPrice) => {
    if (!originalPrice || !promoPrice) return 0;
    return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
  };

  if (loading || products.length === 0) {
    return null;
  }

  const badgeColor = campaign.badge_color || "#EF4444";
  const canNavigate = products.length > productsPerView;
  
  // Calcular produtos visíveis baseado no índice atual
  const getVisibleProducts = () => {
    return products.slice(currentIndex, currentIndex + productsPerView);
  };

  // Calcular o deslocamento X para a animação
  // Se currentIndex = 2 e productsPerView = 2, queremos mover 2 produtos = 100% do container visível
  // Como o motion.div tem (products.length / productsPerView) * 100% de largura,
  // para mover 100% do container visível, precisamos mover (100 / containerWidthFactor)% do motion.div
  const containerWidthFactor = products.length / productsPerView;
  const translateX = (currentIndex / productsPerView) * (100 / containerWidthFactor);

  return (
    <div className="w-full">

      {/* Carrossel */}
      <div className="relative">
        {canNavigate && (
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Produtos anteriores"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <div className="overflow-hidden w-full" style={{ position: 'relative' }}>
          <motion.div 
            className="flex"
            style={{ 
              gap: isSmallScreen ? '0.75rem' : '1.5rem',
              width: `${(products.length / productsPerView) * 100}%`
            }}
            animate={{ 
              x: `-${translateX}%`
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {products.map((product) => {
              const discount = calculateDiscount(
                product.compare_price || product.price,
                product.campaign?.promo_price || product.price
              );
              const finalPrice = product.campaign?.promo_price || product.price;

              // Calcular largura correta para exibir 2 produtos lado a lado em mobile
              // O motion.div tem width de (products.length / productsPerView) * 100%
              // Exemplo: 4 produtos, productsPerView = 2 → motion.div width = 200%
              // Container visível = 100% (overflow-hidden)
              // Para mostrar 2 produtos lado a lado: cada card = (100% - gap) / 2 do container visível
              // Como o motion.div tem 200%, cada card deve ter: ((100% - gap) / 2) / 2 = (100% - gap) / 4
              const gap = isSmallScreen ? 0.75 : 1.5; // rem
              const containerWidthFactor = products.length / productsPerView;
              const totalGap = (productsPerView - 1) * gap;
              // Fórmula correta: cardWidth = ((100% - totalGap) / productsPerView) / containerWidthFactor
              const cardWidth = `calc(((100% - ${totalGap}rem) / ${productsPerView}) / ${containerWidthFactor})`;

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0"
                  style={{ 
                    width: cardWidth,
                    minWidth: 0
                  }}
                >
                  <Link 
                    to={`/produto/${product.id}`} 
                    className="h-full block"
                    onClick={() => trackProduct(product)}
                  >
                    <Card className="overflow-hidden h-full border hover:shadow-md transition-all duration-300 group"
                          style={{
                            borderColor: appearanceSettings?.cardBorderColor || '#f3f4f6',
                            backgroundColor: appearanceSettings?.cardBackgroundColor || '#ffffff',
                            boxShadow: appearanceSettings?.cardShadowColor || '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = appearanceSettings?.inputFocusColor || '#93c5fd';
                            e.currentTarget.style.boxShadow = `0 4px 6px ${appearanceSettings?.cardShadowColor || 'rgba(0, 0, 0, 0.1)'}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = appearanceSettings?.cardBorderColor || '#f3f4f6';
                            e.currentTarget.style.boxShadow = appearanceSettings?.cardShadowColor || '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                          }}>
                      <div className="relative">
                        <img
                          src={product.images?.[0] || product.image_url || "https://placehold.co/300x300/e2e8f0/a1a1aa?text=Sem+Imagem"}
                          alt={product.name}
                          className="w-full h-48 xs:h-56 sm:h-64 md:h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Badge de desconto */}
                        {discount > 0 && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white font-medium">
                            {discount}% OFF
                          </div>
                        )}

                        {/* Badge de campanha */}
                        {product.campaign && (
                          <div 
                            className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: badgeColor }}
                          >
                            {product.campaign.badge_text || "EM PROMOÇÃO"}
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3 sm:p-4">
                        {/* Nome do Produto */}
                        {product.name && (
                          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors mb-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                        )}
                        
                        {/* Avaliação com Estrelas */}
                        {productRatings[product.id] && productRatings[product.id].total_reviews > 0 && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const avgRating = Number(productRatings[product.id].average_rating) || 0;
                                return (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= Math.round(avgRating)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-xs text-gray-600">
                              {(Number(productRatings[product.id].average_rating) || 0).toFixed(1)} ({productRatings[product.id].total_reviews})
                            </span>
                          </div>
                        )}
                        
                        {/* Preços - De/Por */}
                        <div className="mb-2">
                          {(product.compare_price && product.compare_price > finalPrice) || (product.campaign?.original_price && product.campaign.original_price > finalPrice) ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">De:</span>
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(product.compare_price || product.campaign?.original_price || finalPrice)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Por:</span>
                                <span className="text-base sm:text-lg font-bold text-green-600">
                                  {formatPrice(finalPrice)}
                                </span>
                              </div>
                              {discount > 0 && (
                                <span className="text-xs font-semibold text-red-600">
                                  Economize {formatPrice((product.compare_price || product.campaign?.original_price || finalPrice) - finalPrice)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-base sm:text-lg font-bold text-gray-900">
                              {formatPrice(finalPrice)}
                            </span>
                          )}
                        </div>
                        
                        {/* Informações Adicionais */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Truck className="w-3 h-3" />
                            <span>Frete calculado</span>
                          </div>
                          {product.stock !== null && product.stock !== undefined && (
                            <span className={`text-xs font-medium ${
                              product.stock > 10 ? "text-green-600" : product.stock > 0 ? "text-orange-600" : "text-red-600"
                            }`}>
                              {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </motion.div>
        </div>

        {canNavigate && (
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Próximos produtos"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}

