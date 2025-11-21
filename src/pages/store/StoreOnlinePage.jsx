import React from "react";
import StoreOnlineEditor from "@/components/store/StoreOnlineEditor";
import { toast } from "@/components/ui/use-toast";

export default function StoreOnlinePage({ store }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Loja Online</h1>
        <p className="text-gray-600 mt-1">Personalize sua loja online premium</p>
      </div>
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

