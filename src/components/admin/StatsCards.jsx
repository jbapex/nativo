import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Store, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default function StatsCards({ data, loading }) {
  const calculateStats = () => {
    const activeStores = data.stores.filter(store => store.status === "approved").length;
    const activeProducts = data.products.filter(product => product.status === "active").length;
    
    const monthlyRevenue = data.subscriptions
      .filter(sub => sub.status === "active")
      .reduce((sum, sub) => {
        const plan = data.plans.find(p => p.id === sub.plan_id);
        // Converter price para número (pode vir como string do PostgreSQL)
        const planPrice = parseFloat(plan?.price) || 0;
        return sum + planPrice;
      }, 0);

    const salesGrowth = Math.floor(Math.random() * 30) + 5; // Simulado por enquanto

    return {
      totalStores: data.stores.length,
      activeStores,
      totalProducts: activeProducts,
      monthlyRevenue: Number(monthlyRevenue) || 0, // Garantir que é número
      salesGrowth
    };
  };

  const stats = loading ? {} : calculateStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total de Lojas"
        value={loading ? "-" : stats.totalStores}
        icon={<Store className="h-6 w-6" />}
        loading={loading}
      />
      <StatsCard
        title="Lojas Ativas"
        value={loading ? "-" : stats.activeStores}
        icon={<Store className="h-6 w-6" />}
        loading={loading}
      />
      <StatsCard
        title="Produtos Ativos"
        value={loading ? "-" : stats.totalProducts}
        icon={<ShoppingBag className="h-6 w-6" />}
        loading={loading}
      />
      <StatsCard
        title="Receita Mensal"
        value={loading ? "-" : `R$ ${(Number(stats.monthlyRevenue) || 0).toFixed(2)}`}
        subValue={loading ? "" : `+${stats.salesGrowth}% este mês`}
        icon={<TrendingUp className="h-6 w-6" />}
        loading={loading}
      />
    </div>
  );
}

function StatsCard({ title, value, subValue, icon, loading }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-24 animate-pulse bg-gray-200 rounded"></div>
              ) : (
                value
              )}
            </div>
            {subValue && (
              <p className="text-xs text-green-600">{subValue}</p>
            )}
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}