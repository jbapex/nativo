import React, { useState } from "react";
import { ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentInstallments({ price, comparePrice = null }) {
  const [showAll, setShowAll] = useState(false);

  // Calcular parcelamento
  const installments = [];
  const installmentOptions = [3, 6, 12, 24];
  
  installmentOptions.forEach(installmentsCount => {
    const installmentValue = price / installmentsCount;
    installments.push({
      count: installmentsCount,
      value: installmentValue,
      hasInterest: false, // Por enquanto, sem juros
    });
  });

  // Calcular desconto no Pix (5% de exemplo)
  const pixDiscount = price * 0.05;
  const pixPrice = price - pixDiscount;

  const displayInstallments = showAll ? installments : installments.slice(0, 2);

  return (
    <div>
      {/* Desconto no Pix */}
      {comparePrice && (
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg p-3 mb-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-800">
                {Math.round((1 - price / comparePrice) * 100)}% OFF no Pix ou Saldo
              </p>
              <p className="text-xs text-green-700 font-medium mt-0.5">
                R$ {comparePrice.toFixed(2)} → R$ {price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Parcelamento */}
      <div className="space-y-2">
        {displayInstallments.map((installment, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 border border-green-200"
          >
            <span className="text-sm text-gray-800 font-medium">
              {installment.count}x de{" "}
              <span className="font-bold text-gray-900">
                R$ {installment.value.toFixed(2)}
              </span>
            </span>
            {!installment.hasInterest && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                sem juros
              </span>
            )}
          </div>
        ))}

        {installments.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold h-8 transition-all duration-200"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                Ver menos opções
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-1" />
                Ver mais opções de parcelamento
              </>
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-3 font-medium">
        Ver meios de pagamento e promoções
      </p>
    </div>
  );
}

