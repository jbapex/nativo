import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { MarketplaceCampaigns } from "@/api/apiClient";
import { Link } from "react-router-dom";
import CampaignProductsCarousel from "./CampaignProductsCarousel";

// Componente de Timer Compacto para Campanhas (estilo digital)
function CampaignTimer({ endDate, badgeColor }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false
      };
    };

    // Calcular imediatamente
    setTimeLeft(calculateTimeLeft());

    // Atualizar a cada segundo
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.expired) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      {/* Ícone de relógio e texto "TERMINA EM" */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
        <span className="text-gray-600 font-medium text-[10px] sm:text-xs">TERMINA EM</span>
      </div>
      
      {/* Módulo de Dias (apenas se houver dias) - formato "30D" */}
      {timeLeft.days > 0 && (
        <>
          <div className="bg-black rounded px-1.5 sm:px-2.5 py-1 sm:py-1.5">
            <span className="text-white font-bold text-[10px] sm:text-xs tabular-nums">
              {timeLeft.days}D
            </span>
          </div>
          <span className="text-gray-500 font-bold text-[10px] sm:text-xs">:</span>
        </>
      )}
      
      {/* Módulo de Horas */}
      <div className="bg-black rounded px-1.5 sm:px-2.5 py-1 sm:py-1.5">
        <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm tabular-nums">
          {String(timeLeft.hours).padStart(2, '0')}H
        </span>
      </div>
      
      {/* Separador */}
      <span className="text-gray-500 font-bold text-[10px] sm:text-xs md:text-sm">:</span>
      
      {/* Módulo de Minutos */}
      <div className="bg-black rounded px-1.5 sm:px-2.5 py-1 sm:py-1.5">
        <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm tabular-nums">
          {String(timeLeft.minutes).padStart(2, '0')}M
        </span>
      </div>
      
      {/* Separador */}
      <span className="text-gray-500 font-bold text-[10px] sm:text-xs md:text-sm">:</span>
      
      {/* Módulo de Segundos */}
      <div className="bg-black rounded px-1.5 sm:px-2.5 py-1 sm:py-1.5">
        <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm tabular-nums">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

export default function CampaignsSection({ appearanceSettings = {} }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Evitar carregar múltiplas vezes
    if (hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await MarketplaceCampaigns.getActive();
      
      // Filtrar apenas campanhas ativas e em período válido
      const now = new Date();
      const activeCampaigns = (data || []).filter(campaign => {
        if (!campaign.active) {
          return false;
        }
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        const isInPeriod = now >= startDate && now <= endDate;
        
        return isInPeriod;
      });
      
      setCampaigns(activeCampaigns);
    } catch (error) {
      console.error("❌ Erro ao carregar campanhas:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return null; // Não mostrar nada enquanto carrega
  }

  if (campaigns.length === 0) {
    return null; // Não mostrar seção se não houver campanhas
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-12"
    >
      {campaigns.map((campaign, index) => {
          const badgeColor = campaign.badge_color || "#EF4444";
          
          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mb-8"
            >
              {/* Banner da Campanha */}
              <Link
                to={`/campanhas/${campaign.slug || campaign.id}`}
                className="block mb-4 w-full"
              >
                <div
                  className="relative w-full rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36"
                >
                {campaign.banner_image ? (
                  // Se tiver imagem cadastrada, mostrar apenas a imagem
                  <div className="relative w-full h-full">
                    <img
                      src={campaign.banner_image}
                      alt={campaign.name}
                      className="w-full h-full object-cover object-center"
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    {/* Overlay escuro para melhorar legibilidade do texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Badge da Campanha */}
                    {campaign.badge_text && (
                      <div
                        className="absolute top-1 left-1 sm:top-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-white font-bold text-[10px] sm:text-xs shadow-lg z-10"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {campaign.badge_text}
                      </div>
                    )}
                    
                    {/* Texto da campanha sobre a imagem */}
                    {campaign.banner_text && (
                      <div className="absolute bottom-1 left-1 right-1 sm:bottom-2 sm:left-2 sm:right-2 z-10">
                        <h3 className="text-xs sm:text-sm md:text-base font-bold text-white drop-shadow-lg">
                          {campaign.banner_text}
                        </h3>
                      </div>
                    )}
                  </div>
                ) : (
                  // Se não tiver imagem, mostrar banner padrão com gradiente
                  <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 w-full h-full flex items-center justify-center">
                    {/* Badge da Campanha */}
                    {campaign.badge_text && (
                      <div
                        className="absolute top-1 left-1 sm:top-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-white font-bold text-[10px] sm:text-xs shadow-lg z-10"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {campaign.badge_text}
                      </div>
                    )}
                    
                    {/* Conteúdo centralizado */}
                    <div className="text-center text-white px-2 sm:px-4">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold">
                        {campaign.banner_text || campaign.name || "Super Ofertas"}
                      </h3>
                    </div>
                  </div>
                )}
                </div>
              </Link>

              {/* Quadro com Nome da Campanha e Carrossel */}
              <div className="bg-white rounded-lg shadow-md p-1 sm:p-2 md:p-2 w-full">
                {/* Cabeçalho com Nome da Campanha */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-1 sm:mb-2 px-1 sm:px-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold" style={{ color: badgeColor }}>
                      {campaign.name}
                    </h3>
                    <CampaignTimer endDate={campaign.end_date} badgeColor={badgeColor} />
                  </div>
                </div>

                {/* Carrossel de Produtos */}
                <CampaignProductsCarousel 
                  campaign={campaign}
                  appearanceSettings={appearanceSettings}
                />

                {/* Botão Ver Todos embaixo dos cards */}
                <div className="mt-2 sm:mt-3 flex justify-center">
                  <Link to={`/campanhas/${campaign.slug || campaign.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                      Ver Todos
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
    </motion.div>
  );
}

