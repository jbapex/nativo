import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromotionalBanners({ banners = [], appearanceSettings = {} }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtrar apenas banners ativos
  const activeBanners = banners.filter(banner => banner.active && banner.image);

  // Se não houver banners ativos, não renderizar nada
  if (!activeBanners || activeBanners.length === 0) {
    return null;
  }

  // Auto-play: trocar banner a cada 5 segundos
  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === activeBanners.length - 1 ? 0 : prev + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full mb-8 overflow-hidden rounded-xl shadow-lg">
      <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {activeBanners[currentIndex].link ? (
              <Link to={activeBanners[currentIndex].link} className="block h-full">
                <img
                  src={activeBanners[currentIndex].image}
                  alt={activeBanners[currentIndex].title || `Banner ${currentIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {(activeBanners[currentIndex].title || activeBanners[currentIndex].subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                    <div className="w-full p-3 sm:p-4 md:p-6 text-white">
                      {activeBanners[currentIndex].title && (
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-1">
                          {activeBanners[currentIndex].title}
                        </h2>
                      )}
                      {activeBanners[currentIndex].subtitle && (
                        <p className="text-xs sm:text-sm md:text-base text-white/90">
                          {activeBanners[currentIndex].subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ) : (
              <>
                <img
                  src={activeBanners[currentIndex].image}
                  alt={activeBanners[currentIndex].title || `Banner ${currentIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {(activeBanners[currentIndex].title || activeBanners[currentIndex].subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                    <div className="w-full p-3 sm:p-4 md:p-6 text-white">
                      {activeBanners[currentIndex].title && (
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-1">
                          {activeBanners[currentIndex].title}
                        </h2>
                      )}
                      {activeBanners[currentIndex].subtitle && (
                        <p className="text-xs sm:text-sm md:text-base text-white/90">
                          {activeBanners[currentIndex].subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Botões de navegação */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all z-10"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: appearanceSettings.primaryColor || '#2563eb' }} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all z-10"
              aria-label="Próximo banner"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: appearanceSettings.primaryColor || '#2563eb' }} />
            </button>

            {/* Indicadores de página */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-6 sm:w-8 bg-white' 
                      : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Ir para banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

