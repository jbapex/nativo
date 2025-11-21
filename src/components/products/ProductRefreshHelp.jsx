import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  RefreshCw,
  AlertCircle,
  PackageCheck,
  ArrowRight
} from "lucide-react";

export default function ProductRefreshHelp() {
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Se você não está vendo seus produtos, tente uma das soluções abaixo.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Soluções para visualizar seus produtos</h3>
            
            <div className="p-4 border rounded-md">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium">Atualize a página</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Às vezes, uma simples atualização da página resolve o problema de carregamento.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Atualizar Página
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <div className="flex items-start gap-3">
                <PackageCheck className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium">Verifique seus produtos</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Certifique-se de que seus produtos estão marcados como "ativos" e não como rascunhos.
                    Produtos em rascunho não aparecem para os clientes.
                  </p>
                  <div className="mt-3 text-sm border-l-4 border-yellow-200 pl-3 py-2 bg-yellow-50">
                    <p>Dica: Na tela de edição de produto, verifique se a opção "Visível" está ativada.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium">Acesse sua vitrine</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Verifique como sua loja aparece para os clientes acessando sua vitrine.
                    Isso pode ajudar a confirmar se seus produtos estão visíveis.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    variant="outline"
                    onClick={() => window.open(window.location.origin + `/StoreFront?id=${localStorage.getItem('storeId')}`, '_blank')}
                  >
                    Ver Minha Vitrine
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}