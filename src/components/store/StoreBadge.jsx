import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function StoreBadge({ subscription }) {
  if (!subscription || !subscription.plan_id) return null;

  const isEnterprise = subscription.plan?.slug === "enterprise";
  
  if (!isEnterprise) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1">
            <div className="bg-blue-100 p-1 rounded-full">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <CheckCircle className="w-4 h-4 text-blue-600 fill-current" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Loja Verificada - Plano Enterprise</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}