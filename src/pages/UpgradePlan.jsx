import React, { useState, useEffect } from "react";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Plan } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertCircle, CheckCircle, ArrowLeft, CreditCard } from "lucide-react";

export default function UpgradePlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [store, setStore] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      const stores = await Store.list();
      const userStore = stores.find(s => s.email === userData.email);
      
      if (userStore) {
        setStore(userStore);
        
        // Pegar o plano da URL se existir
        const urlParams = new URLSearchParams(window.location.search);
        const planFromUrl = urlParams.get('plan');
        if (planFromUrl) {
          const plans = await Plan.list();
          const plan = plans.find(p => p.slug === planFromUrl);
          if (plan) {
            setSelectedPlan(plan);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      setError("Selecione um plano para continuar");
      return;
    }

    setProcessing(true);
    setError("");
    
    try {
      const price = billingCycle === "yearly" 
        ? (selectedPlan.yearly_price || selectedPlan.price * 10) 
        : selectedPlan.price;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (billingCycle === "yearly" ? 12 : 1));

      const subscriptionData = {
        store_id: store.id,
        plan_id: selectedPlan.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: "pending",
        billing_cycle: billingCycle,
        price_paid: price
      };

      await Subscription.create(subscriptionData);
      
      setSuccess("Solicitação de upgrade enviada com sucesso!");
      
      setTimeout(() => {
        navigate(createPageUrl("StoreProfile"));
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao processar upgrade:", error);
      setError("Erro ao processar upgrade. Por favor, tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Upgrade de Plano
            </CardTitle>
            <CardDescription>
              Escolha o melhor plano para o seu negócio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="font-medium">Ciclo de Cobrança</h3>
              <RadioGroup
                value={billingCycle}
                onValueChange={setBillingCycle}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Mensal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly">Anual (2 meses grátis)</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handleUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={processing || !selectedPlan}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Fazer Upgrade
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}