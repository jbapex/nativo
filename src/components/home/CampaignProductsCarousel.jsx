import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowLeft, ArrowRight } from "lucide-react";
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
  const [productsPerView, setProductsPerView] = useState(6);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    if (campaign) {
      loadCampaignProducts();
    }
    
    // Ajustar produtos por visualização baseado no tamanho da tela
    const updateProductsPerView = () => {
      const width = window.innerWidth;
      setIsSmallScreen(width < 640);
      if (width >= 1280) setProductsPerView(6); // xl - 6 produtos
      else if (width >= 1024) setProductsPerView(5); // lg - 5 produtos
      else if (width >= 768) setProductsPerView(4); // md - 4 produtos
      else if (width >= 640) setProductsPerView(3); // sm - 3 produtos
      else setProductsPerView(2); // mobile - 2 produtos
    };

    updateProductsPerView();
    window.addEventListener('resize', updateProductsPerView);
    return () => window.removeEventListener('resize', updateProductsPerView);
  }, [campaign]);

  // Resetar índice quando productsPerView mudar
  useEffect(() => {
    setCurrentIndex(0);
  }, [productsPerView]);

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

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateDiscount = (originalPrice, promoPrice) => {
    if (!originalPrice || !promoPrice) return 0;
    return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
  };

  const nextSlide = () => {
    if (products.length <= productsPerView) return;
    setCurrentIndex((prev) => {
      const nextIndex = prev + productsPerView;
      if (nextIndex >= products.length) {
        return 0; // Voltar ao início
      }
      return nextIndex;
    });
  };

  const prevSlide = () => {
    if (products.length <= productsPerView) return;
    setCurrentIndex((prev) => {
      const prevIndex = prev - productsPerView;
      if (prevIndex < 0) {
        const lastGroupIndex = Math.floor((products.length - 1) / productsPerView) * productsPerView;
        return lastGroupIndex;
      }
      return prevIndex;
    });
  };

  if (loading || products.length === 0) {
    return null;
  }

  const badgeColor = campaign.badge_color || "#EF4444";
  const canNavigate = products.length > productsPerView;
  
  // Calcular o deslocamento X para a animação
  const containerWidthFactor = products.length / productsPerView;
  const translateX = (currentIndex / productsPerView) * (100 / containerWidthFactor);

  return (
    <div className="w-full">
      {/* Carrossel com setas */}
      <div className="relative px-8 sm:px-10 md:px-12">
        {canNavigate && (
          <button
            onClick={prevSlide}
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Produtos anteriores"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
        )}

        <div className="overflow-hidden w-full">
          <motion.div 
            className="flex"
            style={{ 
              gap: isSmallScreen ? '0.5rem' : '0.75rem',
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
              const primaryColor = appearanceSettings?.primaryColor || appearanceSettings?.buttonPrimaryColor || '#2563eb';

              // Calcular largura correta para cada card
              const gap = isSmallScreen ? 0.5 : 0.75; // rem
              const containerWidthFactor = products.length / productsPerView;
              const totalGap = (productsPerView - 1) * gap;
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
                <Card className="overflow-hidden h-full border-2 hover:shadow-sm transition-all duration-200 group bg-white relative"
                      style={{
                        borderColor: (() => {
                          const hex = primaryColor.replace('#', '');
                          const r = parseInt(hex.substr(0, 2), 16);
                          const g = parseInt(hex.substr(2, 2), 16);
                          const b = parseInt(hex.substr(4, 2), 16);
                          return `rgba(${r}, ${g}, ${b}, 0.3)`;
                        })(),
                        backgroundColor: appearanceSettings?.cardBackgroundColor || '#ffffff',
                        boxShadow: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                        const hex = primaryColor.replace('#', '');
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        e.currentTarget.style.borderColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
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
                    
                    {/* Badge de Desconto Verde (estilo dos cards) */}
                    {discount > 0 && (
                      <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-20 bg-green-600 flex items-center justify-center px-1 sm:px-1.5 py-0.5 rounded text-white font-semibold text-[9px] sm:text-[10px] leading-tight">
                        -{discount}%
                      </div>
                    )}

                    {/* Badge de campanha */}
                    {product.campaign?.badge_text && (
                      <div 
                        className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 px-1 sm:px-1.5 py-0.5 rounded text-white font-semibold text-[9px] sm:text-[10px]"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {product.campaign.badge_text}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-1.5 sm:p-2 md:p-2.5 space-y-0.5">
                    {/* Nome do Produto */}
                    {product.name && (
                      <h3 className="font-medium text-[10px] sm:text-[11px] md:text-xs line-clamp-2 text-gray-900 leading-tight min-h-[1.75rem] sm:min-h-[2rem]">
                        {product.name}
                      </h3>
                    )}
                    
                    {/* Avaliação com Estrelas (estilo Havan) */}
                    {productRatings[product.id] && productRatings[product.id].total_reviews > 0 && (
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const avgRating = Number(productRatings[product.id].average_rating) || 0;
                            return (
                              <Star
                                key={star}
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${
                                  star <= Math.round(avgRating)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-gray-500">
                          ({productRatings[product.id].total_reviews})
                        </span>
                      </div>
                    )}
                    
                    {/* Preços (estilo Havan - mais compacto) */}
                    <div className="space-y-0.5">
                      {(product.compare_price && product.compare_price > finalPrice) || (product.campaign?.original_price && product.campaign.original_price > finalPrice) ? (
                        <>
                          <span className="text-[9px] sm:text-[10px] text-gray-400 line-through block">
                            {formatCurrency(product.compare_price || product.campaign?.original_price || finalPrice)}
                          </span>
                          <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 block">
                            {formatCurrency(finalPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 block">
                          {formatCurrency(finalPrice)}
                        </span>
                      )}
                      
                      {/* Parcelamento (estilo Havan) */}
                      {finalPrice && (
                        <span className="text-[9px] sm:text-[10px] text-gray-500 block">
                          10x de {formatCurrency(finalPrice / 10)}
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
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Próximos produtos"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}

