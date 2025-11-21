import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function SalesChart({ data, loading }) {
  // Calcular dados de receita usando os dados passados como props
  const salesData = useMemo(() => {
    if (loading || !data || !data.subscriptions || !data.plans) {
      return [];
    }

    const { subscriptions, plans } = data;

    // Criar um mapa de planos para acesso rápido
    const plansMap = plans.reduce((acc, plan) => {
      acc[plan.id] = plan;
      return acc;
    }, {});

    // Obter os últimos 6 meses
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        date,
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear()
      });
    }

    // Calcular receita por mês
    return months.map(({ date, month, year }) => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRevenue = subscriptions.reduce((total, sub) => {
        // Verificar se a assinatura estava ativa no mês
        const startDate = sub.start_date ? new Date(sub.start_date) : null;
        const endDate = sub.end_date ? new Date(sub.end_date) : new Date();
        
        if (startDate && startDate <= monthEnd && endDate >= monthStart && sub.status === 'active') {
          const plan = plansMap[sub.plan_id];
          if (plan) {
            // Se for cobrança anual, dividir por 12 para ter o valor mensal
            const monthlyValue = sub.billing_cycle === 'yearly' 
              ? (plan.yearly_price || plan.price * 12) / 12 
              : plan.price;
            
            return total + monthlyValue;
          }
        }
        return total;
      }, 0);

      return {
        name: `${month}/${year.toString().slice(2)}`,
        valor: Number(monthRevenue.toFixed(2))
      };
    });
  }, [data, loading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {salesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${value}`, 'Receita']}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}