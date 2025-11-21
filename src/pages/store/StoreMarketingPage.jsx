import React from "react";
import StoreMarketing from "@/components/store/StoreMarketing";

export default function StoreMarketingPage({ store, products }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-600 mt-1">Crie promoções e campanhas</p>
      </div>
      <StoreMarketing store={store} products={products} />
    </div>
  );
}

