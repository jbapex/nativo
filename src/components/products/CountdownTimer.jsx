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
    // Formatar tempo em formato HH:MM:SS ou MM:SS
    const formatTime = () => {
      if (timeLeft.days > 0) {
        return `${String(timeLeft.days).padStart(2, '0')}:${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
      }
      return `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
    };
    
    return (
      <div className={`bg-gradient-to-r from-red-500/90 to-pink-600/90 text-white rounded-md shadow-sm border border-red-400/30 ${className}`}>
        <div className="px-2 py-1">
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span className="font-semibold text-xs leading-tight">Oferta termina em</span>
            <span className="text-xs font-bold">{formatTime()}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Card className={`bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Clock className="w-5 h-5" />
          <span className="font-bold text-sm">Oferta termina em:</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          {timeLeft.days > 0 && (
            <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[50px]">
              <span className="text-2xl font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-xs opacity-90">dias</span>
            </div>
          )}
          <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-xs opacity-90">horas</span>
          </div>
          <span className="text-xl font-bold">:</span>
          <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-xs opacity-90">min</span>
          </div>
          <span className="text-xl font-bold">:</span>
          <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-xs opacity-90">seg</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

