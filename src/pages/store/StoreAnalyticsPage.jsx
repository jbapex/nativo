import React from "react";
import StoreAnalytics from "@/components/store/StoreAnalytics";

export default function StoreAnalyticsPage({ store, products }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estatísticas</h1>
        <p className="text-gray-600 mt-1">Acompanhe o desempenho da sua loja</p>
      </div>
      <StoreAnalytics store={store} products={products} />
    </div>
  );
}

