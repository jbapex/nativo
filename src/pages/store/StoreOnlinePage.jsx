import React from "react";
import StoreOnlineEditor from "@/components/store/StoreOnlineEditor";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function StoreOnlinePage({ store, plan, subscription, isStoreOnlineActive }) {
  const hasEnterprisePlan = isStoreOnlineActive;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Loja Online</h1>
        <p className="text-gray-600 mt-1">Personalize sua loja online premium</p>
      </div>
      
      {!hasEnterprisePlan && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">Plano Enterprise Necessário</p>
                <p className="text-sm">
                  Para personalizar sua loja online, você precisa ter o plano Enterprise ativo.
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/loja/assinatura'}
                className="ml-4 bg-yellow-600 hover:bg-yellow-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <StoreOnlineEditor 
        store={store} 
        onSave={() => {
          toast({
            title: "Sucesso",
            description: "Customizações salvas! Sua loja online foi atualizada.",
          });
        }}
      />
    </div>
  );
}

