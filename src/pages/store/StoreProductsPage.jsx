import React from "react";
import StoreProducts from "@/components/store/StoreProducts";

export default function StoreProductsPage({ store, products, onProductsChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Produtos</h1>
        <p className="text-gray-600 mt-1">Gerencie seus produtos</p>
      </div>
      <StoreProducts 
        products={products} 
        storeId={store?.id} 
        onProductsChange={onProductsChange} 
      />
    </div>
  );
}

