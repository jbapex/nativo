import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketplaceCampaigns } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CampaignBanner() {
  const [campaigns, setCampaigns] = useState([]);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissedCampaigns, setDismissedCampaigns] = useState(() => {
    // Carregar campanhas dispensadas do localStorage
    try {
      const saved = localStorage.getItem("dismissedCampaigns");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await MarketplaceCampaigns.getActive();
      const now = new Date();
      
      // Filtrar campanhas ativas, em período válido, featured e não dispensadas
      const activeCampaigns = (data || [])
        .filter(campaign => {
          if (!campaign.active || !campaign.featured) return false;
          if (dismissedCampaigns.includes(campaign.id)) return false;
          
          const startDate = new Date(campaign.start_date);
          const endDate = new Date(campaign.end_date);
          return now >= startDate && now <= endDate;
        })
        .sort((a, b) => {
          // Ordenar por data de início (mais recente primeiro)
          return new Date(b.start_date) - new Date(a.start_date);
        });

      setCampaigns(activeCampaigns);
      
      // Mostrar a primeira campanha
      if (activeCampaigns.length > 0) {
        setCurrentCampaign(activeCampaigns[0]);
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Erro ao carregar campanhas para banner:", error);
    }
  };

  const handleDismiss = () => {
    if (currentCampaign) {
      const newDismissed = [...dismissedCampaigns, currentCampaign.id];
      setDismissedCampaigns(newDismissed);
      localStorage.setItem("dismissedCampaigns", JSON.stringify(newDismissed));
      
      // Mostrar próxima campanha se houver
      const remaining = campaigns.filter(c => !newDismissed.includes(c.id));
      if (remaining.length > 0) {
        setCurrentCampaign(remaining[0]);
      } else {
        setIsVisible(false);
      }
    }
  };

  if (!isVisible || !currentCampaign) {
    return null;
  }

  const badgeColor = currentCampaign.badge_color || "#EF4444";

  return (
    <AnimatePresence>
      {isVisible && currentCampaign && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 left-0 right-0 z-40 shadow-lg"
          style={{
            backgroundColor: badgeColor,
            color: "#ffffff",
          }}
        >
          <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Megaphone className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base truncate">
                    {currentCampaign.name}
                  </p>
                  {currentCampaign.banner_text && (
                    <p className="text-xs sm:text-sm opacity-90 truncate">
                      {currentCampaign.banner_text}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Link to={`/campanhas/${currentCampaign.slug || currentCampaign.id}`}>
                    Ver Produtos
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>

                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Fechar banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

