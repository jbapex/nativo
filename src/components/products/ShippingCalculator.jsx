import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ShippingCalculator({ product, store }) {
  const { toast } = useToast();
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null);

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 8) {
      setCep(value);
    }
  };

  const formatCep = (value) => {
    if (value.length === 8) {
      return value.replace(/(\d{5})(\d{3})/, "$1-$2");
    }
    return value;
  };

  const calculateShipping = async () => {
    if (cep.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Por favor, insira um CEP válido com 8 dígitos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulação de cálculo de frete
      // TODO: Integrar com API de frete real (Correios, Melhor Envio, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Valores simulados
      const shippingOptions = [
        {
          type: "normal",
          name: "Frete Normal",
          price: 15.90,
          days: "5-7 dias úteis",
        },
        {
          type: "express",
          name: "Frete Expresso",
          price: 29.90,
          days: "2-3 dias úteis",
        },
      ];

      setShippingInfo({
        cep: formatCep(cep),
        options: shippingOptions,
      });
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      toast({
        title: "Erro",
        description: "Não foi possível calcular o frete. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Calcular frete</h3>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          placeholder="00000-000"
          value={formatCep(cep)}
          onChange={handleCepChange}
          maxLength={9}
          className="flex-1 h-10 text-sm border-2 border-blue-200 focus:border-blue-400 bg-white shadow-sm"
        />
        <Button
          onClick={calculateShipping}
          disabled={loading || cep.length !== 8}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 px-4 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Calcular"
          )}
        </Button>
      </div>

      {shippingInfo && (
        <div className="space-y-1.5 mt-2 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1.5">
            <MapPin className="w-3 h-3" />
            <span>CEP: {shippingInfo.cep}</span>
          </div>
          {shippingInfo.options.map((option, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs"
            >
              <div>
                <p className="font-medium text-gray-900">{option.name}</p>
                <p className="text-xs text-gray-500">{option.days}</p>
              </div>
              <p className="font-semibold text-green-600 text-xs">
                R$ {option.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!shippingInfo && (
        <p className="text-xs text-gray-500">
          Informe seu CEP para calcular o frete
        </p>
      )}
    </div>
  );
}

