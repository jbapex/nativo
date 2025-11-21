import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Package } from "lucide-react";

export default function QuantitySelector({ 
  quantity, 
  onQuantityChange, 
  stock, 
  maxQuantity = null 
}) {
  const max = maxQuantity || stock || 999;
  const availableStock = stock !== null && stock !== undefined ? stock : null;

  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1 && value <= max) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <div className="bg-purple-600 p-1.5 rounded-lg">
            <Package className="w-4 h-4 text-white" />
          </div>
          Quantidade
        </label>
        {availableStock !== null && (
          <span className="text-xs">
            {availableStock > 0 ? (
              <span className="bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-md">
                {availableStock} {availableStock === 1 ? "disponível" : "disponíveis"}
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-md">Fora de estoque</span>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="h-10 w-10 border-2 border-purple-300 hover:bg-purple-100 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <Input
          type="number"
          min="1"
          max={max}
          value={quantity}
          onChange={handleInputChange}
          className="w-20 text-center h-10 text-sm font-bold border-2 border-purple-200 focus:border-purple-400 bg-white shadow-sm"
        />

        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrease}
          disabled={quantity >= max}
          className="h-10 w-10 border-2 border-purple-300 hover:bg-purple-100 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {maxQuantity && quantity >= maxQuantity && (
        <p className="text-xs text-orange-600 mt-1.5">
          Você pode comprar apenas {maxQuantity} {maxQuantity === 1 ? "unidade" : "unidades"}
        </p>
      )}
    </div>
  );
}

