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
    <div className="flex items-center gap-2">
      {/* Ícone de relógio e texto "TERMINA EM" */}
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="text-gray-600 font-medium text-sm">TERMINA EM</span>
      </div>
      
      {/* Módulo de Dias (apenas se houver dias) - formato "30D" */}
      {timeLeft.days > 0 && (
        <>
          <div className="bg-black rounded px-2.5 py-1.5">
            <span className="text-white font-bold text-sm tabular-nums">
              {timeLeft.days}D
            </span>
          </div>
          <span className="text-gray-500 font-bold text-sm">:</span>
        </>
      )}
      
      {/* Módulo de Horas */}
      <div className="bg-black rounded px-2.5 py-1.5">
        <span className="text-white font-bold text-sm tabular-nums">
          {String(timeLeft.hours).padStart(2, '0')}H
        </span>
      </div>
      
      {/* Separador */}
      <span className="text-gray-500 font-bold text-sm">:</span>
      
      {/* Módulo de Minutos */}
      <div className="bg-black rounded px-2.5 py-1.5">
        <span className="text-white font-bold text-sm tabular-nums">
          {String(timeLeft.minutes).padStart(2, '0')}M
        </span>
      </div>
      
      {/* Separador */}
      <span className="text-gray-500 font-bold text-sm">:</span>
      
      {/* Módulo de Segundos */}
      <div className="bg-black rounded px-2.5 py-1.5">
        <span className="text-white font-bold text-sm tabular-nums">
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
                  className="relative w-full rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  style={{ height: '110px' }}
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
                        className="absolute top-2 left-2 px-2 py-1 rounded text-white font-bold text-xs shadow-lg z-10"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {campaign.badge_text}
                      </div>
                    )}
                    
                    {/* Texto da campanha sobre a imagem */}
                    {campaign.banner_text && (
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <h3 className="text-lg font-bold text-white drop-shadow-lg">
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
                        className="absolute top-2 left-2 px-2 py-1 rounded text-white font-bold text-xs shadow-lg z-10"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {campaign.badge_text}
                      </div>
                    )}
                    
                    {/* Conteúdo centralizado */}
                    <div className="text-center text-white px-4">
                      <h3 className="text-lg font-bold">
                        {campaign.banner_text || campaign.name || "Super Ofertas"}
                      </h3>
                    </div>
                  </div>
                )}
                </div>
              </Link>

              {/* Quadro com Nome da Campanha e Carrossel */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 w-full">
                {/* Cabeçalho com Nome da Campanha */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 px-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold" style={{ color: badgeColor }}>
                      {campaign.name}
                    </h3>
                    <CampaignTimer endDate={campaign.end_date} badgeColor={badgeColor} />
                  </div>
                  <Link to={`/campanhas/${campaign.slug || campaign.id}`}>
                    <Button variant="outline" className="flex items-center gap-2">
                      Ver Todos
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* Carrossel de Produtos */}
                <CampaignProductsCarousel 
                  campaign={campaign}
                  appearanceSettings={appearanceSettings}
                />
              </div>
            </motion.div>
          );
        })}
    </motion.div>
  );
}

