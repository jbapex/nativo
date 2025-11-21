import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store as StoreIcon, MapPin, Calendar } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Funções auxiliares para status
const getStatusColor = (status) => {
  const colors = {
    'approved': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'rejected': 'bg-red-100 text-red-800',
    'inactive': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status) => {
  const texts = {
    'approved': 'Aprovada',
    'pending': 'Pendente',
    'rejected': 'Rejeitada',
    'inactive': 'Inativa'
  };
  return texts[status] || 'Desconhecido';
};

export default function RecentStores({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lojas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar lojas por data de criação e pegar as 5 mais recentes
  const recentStores = [...data.stores]
    .filter(store => store.created_date) // Filtrar lojas sem data
    .sort((a, b) => {
      const dateA = new Date(a.created_date || a.created_at || 0);
      const dateB = new Date(b.created_date || b.created_at || 0);
      return dateB - dateA;
    })
    .slice(0, 5)
    .map(store => ({
      ...store,
      city: data.cities.find(c => c.id === store.city_id)
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lojas Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {recentStores.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Nenhuma loja encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {recentStores.map((store) => (
              <div key={store.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                {store.logo ? (
                  <img 
                    src={store.logo} 
                    alt={store.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <StoreIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{store.name}</h3>
                    <Badge className={getStatusColor(store.status)}>
                      {getStatusText(store.status)}
                    </Badge>
                  </div>
                  
                  {(store.city?.name || store.city?.state) && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {store.city?.name}
                        {store.city?.state && ` - ${store.city.state}`}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {(() => {
                        try {
                          const dateStr = store.created_date || store.created_at;
                          if (!dateStr) return 'Data não disponível';
                          const date = new Date(dateStr);
                          if (isNaN(date.getTime())) return 'Data inválida';
                          return format(date, "d 'de' MMMM", { locale: ptBR });
                        } catch (error) {
                          return 'Data inválida';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}