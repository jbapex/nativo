
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Eye, MessageSquare } from "lucide-react";

export default function PopularProducts({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos Populares</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  const activeProducts = data.products.filter(product => {
    const store = data.stores.find(s => s.id === product.store_id);
    return product.status === "active" && store?.status === "approved";
  });

  const popularProducts = activeProducts
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 5)
    .map(product => ({
      ...product,
      store: data.stores.find(s => s.id === product.store_id)
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Populares</CardTitle>
      </CardHeader>
      <CardContent>
        {popularProducts.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Nenhum produto encontrado
          </div>
        ) : (
          <div className="space-y-4">
            {popularProducts.map((product) => (
              <div key={product.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{product.store?.name || "Loja não encontrada"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(product.price)}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">{product.total_views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs">{product.total_messages || 0}</span>
                    </div>
                  </div>
                </div>
                
                <Badge 
                  className={product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {product.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
