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
      else setProductsPerView(3); // mobile - 3 produtos (alterado de 2 para 3)
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
      // Garantir que não ultrapasse o limite e sempre mostre produtos completos
      const maxIndex = products.length - productsPerView;
      if (nextIndex > maxIndex) {
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
        // Ir para o último grupo que mostra produtos completos
        const lastGroupIndex = Math.max(0, products.length - productsPerView);
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
  const primaryColor = appearanceSettings?.primaryColor || appearanceSettings?.buttonPrimaryColor || '#2563eb';
  
  // Calcular o deslocamento X para a animação - garantir que não corte produtos
  // O translateX deve mover exatamente o número de produtos visíveis por vez
  // Cada movimento deve mostrar produtosPerView produtos completos
  const containerWidthFactor = products.length / productsPerView;
  const translateX = (currentIndex / products.length) * 100;

  return (
    <div className="w-full" style={{
      opacity: 1,
      borderRadius: '0px',
      paddingLeft: '0',
      paddingRight: '0'
    }}>
      {/* Carrossel com setas */}
      <div className="relative w-full flex items-center" style={{ 
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        width: '100%',
        paddingTop: '20px',
        paddingBottom: '20px'
      }}>
        {canNavigate && (
          <button
            onClick={prevSlide}
            className="flex-shrink-0 shadow-md transition-all hover:scale-110 hover:opacity-100 flex items-center justify-center z-20 -ml-1"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              color: primaryColor,
              width: '1.5rem',
              height: '2rem',
              flexShrink: 0,
              opacity: 0.7,
              border: `1px solid ${primaryColor}20`,
              borderRight: 'none',
              borderTopLeftRadius: '9999px',
              borderBottomLeftRadius: '9999px',
              paddingLeft: '0.25rem',
              paddingRight: '0.125rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.color = primaryColor;
              e.currentTarget.style.opacity = '0.7';
            }}
            aria-label="Produtos anteriores"
          >
            <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        )}

        <div className="overflow-hidden flex-1" style={{
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
          flex: 1
        }}>
          <motion.div 
            className="flex"
            style={{ 
              gap: isSmallScreen ? '0.5rem' : '0.75rem',
              width: `${(products.length / productsPerView) * 100}%`,
              flexDirection: 'row',
              flexWrap: 'nowrap',
              display: 'flex',
              willChange: 'transform'
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

              // Calcular largura correta para cada card - garantir que não corte
              // A largura deve ser calculada em relação ao container interno (motion.div)
              const gap = isSmallScreen ? 0.5 : 0.75; // rem
              const totalGap = (products.length - 1) * gap;
              // Cada card ocupa 1/products.length do container interno
              const cardWidth = `calc((100% - ${totalGap}rem) / ${products.length})`;

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0"
                  style={{ 
                    width: cardWidth,
                    minWidth: 0,
                    flexShrink: 0,
                    flexGrow: 0
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
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={product.images?.[0] || product.image_url || "https://placehold.co/400x400/e2e8f0/a1a1aa?text=Sem+Imagem"}
                      alt={product.name}
                      className="w-full h-full group-hover:opacity-95 transition-opacity duration-200"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center',
                        width: '100%',
                        height: '100%'
                      }}
                      loading="lazy"
                    />
                    
                    {/* Badge de Desconto Verde (estilo dos cards) */}
                    {discount > 0 && (
                      <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 z-20 bg-green-600 flex items-center justify-center px-0.5 sm:px-1 py-0.25 sm:py-0.5 rounded text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] leading-tight whitespace-nowrap">
                        -{discount}%
                      </div>
                    )}

                    {/* Badge de campanha */}
                    {product.campaign?.badge_text && (
                      <div 
                        className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 px-0.5 sm:px-1 py-0.25 sm:py-0.5 rounded text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] whitespace-nowrap truncate max-w-[60%]"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {product.campaign.badge_text}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-1 sm:p-1.5 md:p-2 space-y-0.5">
                    {/* Nome do Produto */}
                    {product.name && (
                      <h3 className="font-medium text-[9px] sm:text-[10px] md:text-[11px] line-clamp-2 text-gray-900 leading-tight break-words overflow-hidden">
                        {product.name}
                      </h3>
                    )}
                    
                    {/* Avaliação com Estrelas (estilo Havan) */}
                    {productRatings[product.id] && productRatings[product.id].total_reviews > 0 && (
                      <div className="flex items-center gap-0.5 flex-wrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const avgRating = Number(productRatings[product.id].average_rating) || 0;
                            return (
                              <Star
                                key={star}
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0 ${
                                  star <= Math.round(avgRating)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-gray-500 whitespace-nowrap">
                          ({productRatings[product.id].total_reviews})
                        </span>
                      </div>
                    )}
                    
                    {/* Preços (estilo Havan - mais compacto) */}
                    <div className="space-y-0">
                      {(product.compare_price && product.compare_price > finalPrice) || (product.campaign?.original_price && product.campaign.original_price > finalPrice) ? (
                        <>
                          <span className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 line-through block truncate">
                            {formatCurrency(product.compare_price || product.campaign?.original_price || finalPrice)}
                          </span>
                          <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 block truncate">
                            {formatCurrency(finalPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 block truncate">
                          {formatCurrency(finalPrice)}
                        </span>
                      )}
                      
                      {/* Parcelamento (estilo Havan) */}
                      {finalPrice && (
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 block truncate">
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
            className="flex-shrink-0 shadow-md transition-all hover:scale-110 hover:opacity-100 flex items-center justify-center z-20 -mr-1"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              color: primaryColor,
              width: '1.5rem',
              height: '2rem',
              flexShrink: 0,
              opacity: 0.7,
              border: `1px solid ${primaryColor}20`,
              borderLeft: 'none',
              borderTopRightRadius: '9999px',
              borderBottomRightRadius: '9999px',
              paddingLeft: '0.125rem',
              paddingRight: '0.25rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.color = primaryColor;
              e.currentTarget.style.opacity = '0.7';
            }}
            aria-label="Próximos produtos"
          >
            <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

