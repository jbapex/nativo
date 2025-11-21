import React from "react";
import StoreSettings from "@/components/store/StoreSettings";

export default function StoreSettingsPage({ store, user, subscription, plan, onUpdate }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações da sua loja</p>
      </div>
      <StoreSettings 
        store={store} 
        user={user}
        subscription={subscription}
        plan={plan}
        onUpdate={onUpdate}
      />
    </div>
  );
}

