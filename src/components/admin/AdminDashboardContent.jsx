import React, { useState, useEffect } from "react";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Product } from "@/api/entities";
import { City } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { Plan } from "@/api/entities";
import StatsCards from "./StatsCards";
import SalesChart from "./SalesChart";
import TopCities from "./TopCities";
import RecentStores from "./RecentStores";
import PopularProducts from "./PopularProducts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function AdminDashboardContent() {
  const [data, setData] = useState({
    stores: [],
    products: [],
    subscriptions: [],
    plans: [],
    cities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fazer todas as chamadas em paralelo para melhor performance
      const [storesData, productsData, subscriptionsData, plansData, citiesData] = await Promise.all([
        Store.list().catch(() => []),
        Product.list().catch(() => []),
        Subscription.list().catch(() => []),
        Plan.list().catch(() => []),
        City.list().catch(() => [])
      ]);

      setData({
        stores: storesData || [],
        products: productsData || [],
        subscriptions: subscriptionsData || [],
        plans: plansData || [],
        cities: citiesData || []
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <StatsCards data={data} loading={loading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={data} loading={loading} />
        <TopCities data={data} loading={loading} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentStores data={data} loading={loading} />
        <PopularProducts data={data} loading={loading} />
      </div>
    </div>
  );
}