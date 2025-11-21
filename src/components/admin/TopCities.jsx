import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function TopCities({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Principais Cidades</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas das cidades usando os dados recebidos
  const citiesStats = data.cities.map(city => {
    const storesInCity = data.stores.filter(store => 
      store.city_id === city.id && store.status === "approved"
    ).length;

    const productsInCity = data.products.filter(product => {
      const store = data.stores.find(s => s.id === product.store_id);
      return store?.city_id === city.id && store.status === "approved";
    }).length;

    return {
      ...city,
      stores: storesInCity,
      products: productsInCity
    };
  });

  // Ordenar e pegar top 5
  const topCities = citiesStats
    .filter(city => city.stores > 0)
    .sort((a, b) => b.stores - a.stores)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Principais Cidades</CardTitle>
      </CardHeader>
      <CardContent>
        {topCities.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Nenhuma cidade com lojas encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {topCities.map((city) => (
              <div key={city.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="font-medium">{city.name}</span>
                    <span className="text-gray-500 text-sm ml-1">({city.state})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{city.stores} lojas</span>
                    <span className="text-xs text-gray-500">{city.products} produtos</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${(city.stores / Math.max(...topCities.map(c => c.stores))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}