import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CountdownTimer({ endDate, className = "" }) {
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

  // Versão compacta para cards de produto
  const isCompact = className.includes('text-xs') || className.includes('compact');
  
  if (isCompact) {
    return (
      <div className={`relative w-full ${className}`}>
        {/* Container principal - fundo vermelho */}
        <div className="bg-red-600 backdrop-blur-sm rounded-b-lg overflow-hidden">
          {/* Conteúdo compacto - usa toda a largura com padding mínimo */}
          <div className="px-2.5 py-1.5">
            {/* Layout horizontal compacto */}
            <div className="flex items-center justify-between gap-2">
              {/* Texto à esquerda */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-white uppercase tracking-wide whitespace-nowrap">
                  Oferta termina em
                </span>
              </div>
              
              {/* Timer compacto à direita */}
              <div className="flex items-center gap-1 flex-1 justify-end">
                {timeLeft.days > 0 && (
                  <>
                    <div className="flex items-baseline gap-0.5 bg-white rounded px-1.5 py-0.5 min-w-[26px] justify-center shadow-sm">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums leading-none">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] text-gray-600 font-semibold leading-none ml-0.5">D</span>
                    </div>
                    <span className="text-white/60 font-bold text-[10px] leading-none">:</span>
                  </>
                )}
                <div className="flex items-baseline gap-0.5 bg-white rounded px-1.5 py-0.5 min-w-[26px] justify-center shadow-sm">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums leading-none">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] text-gray-600 font-semibold leading-none ml-0.5">H</span>
                </div>
                <span className="text-white/60 font-bold text-[10px] leading-none">:</span>
                <div className="flex items-baseline gap-0.5 bg-white rounded px-1.5 py-0.5 min-w-[26px] justify-center shadow-sm">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums leading-none">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] text-gray-600 font-semibold leading-none ml-0.5">M</span>
                </div>
                <span className="text-white/60 font-bold text-[10px] leading-none">:</span>
                <div className="flex items-baseline gap-0.5 bg-white rounded px-1.5 py-0.5 min-w-[26px] justify-center shadow-sm">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums leading-none">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] text-gray-600 font-semibold leading-none ml-0.5">S</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative w-full ${className}`}>
      {/* Container principal - fundo vermelho compacto */}
      <div className="bg-red-600 rounded-lg overflow-hidden shadow-md">
        {/* Conteúdo compacto */}
        <div className="px-3 py-2">
          {/* Layout horizontal compacto */}
          <div className="flex items-center justify-between gap-3">
            {/* Texto à esquerda */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Clock className="w-3 h-3 text-red-200 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wide whitespace-nowrap">
                Oferta termina em
              </span>
            </div>
            
            {/* Timer compacto à direita */}
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              {timeLeft.days > 0 && (
                <>
                  <div className="flex items-baseline gap-0.5 bg-white rounded px-2 py-1 min-w-[32px] justify-center shadow-sm">
                    <span className="text-sm sm:text-base font-bold text-gray-900 tabular-nums leading-none">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-gray-600 font-semibold leading-none ml-0.5">D</span>
                  </div>
                  <span className="text-white/60 font-bold text-xs">:</span>
                </>
              )}
              <div className="flex items-baseline gap-0.5 bg-white rounded px-2 py-1 min-w-[32px] justify-center shadow-sm">
                <span className="text-sm sm:text-base font-bold text-gray-900 tabular-nums leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-gray-600 font-semibold leading-none ml-0.5">H</span>
              </div>
              <span className="text-white/60 font-bold text-xs">:</span>
              <div className="flex items-baseline gap-0.5 bg-white rounded px-2 py-1 min-w-[32px] justify-center shadow-sm">
                <span className="text-sm sm:text-base font-bold text-gray-900 tabular-nums leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-gray-600 font-semibold leading-none ml-0.5">M</span>
              </div>
              <span className="text-white/60 font-bold text-xs">:</span>
              <div className="flex items-baseline gap-0.5 bg-white rounded px-2 py-1 min-w-[32px] justify-center shadow-sm">
                <span className="text-sm sm:text-base font-bold text-gray-900 tabular-nums leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-gray-600 font-semibold leading-none ml-0.5">S</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

