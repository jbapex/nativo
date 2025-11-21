import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, 
  RefreshCw, 
  Bug, 
  Database,
  AlertCircle,
  Package,
  CheckCircle,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StoreDebugger() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [debugData, setDebugData] = useState({
    user: null,
    store: null,
    productsFound: [],
    logs: [],
    storeProducts: null
  });
  const [error, setError] = useState(null);
  const [fix, setFix] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    runDebug();
  }, []);

  const addLog = (message, type = 'info', data = null) => {
    console.log(`[${type.toUpperCase()}] ${message}`, data);
    setDebugData(prev => ({
      ...prev,
      logs: [...prev.logs, {
        message,
        type,
        data: data ? JSON.stringify(data) : null,
        timestamp: new Date().toISOString()
      }]
    }));
  };

  const runDebug = async () => {
    setLoading(true);
    setError(null);
    setFix(null);
    setDebugData({
      user: null,
      store: null,
      productsFound: [],
      logs: [],
      storeProducts: null
    });

    try {
      // 1. Verificar o usuário atual
      addLog("Verificando usuário atual...");
      const user = await User.me();
      addLog("Usuário encontrado", "success", user);
      setDebugData(prev => ({ ...prev, user }));

      // 2. Verificar se o usuário tem uma loja
      addLog("Buscando lojas no sistema...");
      const stores = await Store.list();
      addLog(`${stores.length} lojas encontradas no sistema`, "success");

      // Encontrar a loja do usuário
      addLog("Procurando loja do usuário atual...");
      const userStore = stores.find(s => 
        s.email === user.email || s.created_by === user.email
      );

      if (!userStore) {
        addLog("NENHUMA LOJA ENCONTRADA para este usuário", "error");
        setError("Você não possui uma loja. Cadastre-se como lojista primeiro.");
        setLoading(false);
        return;
      }

      addLog(`Loja encontrada: ${userStore.name}`, "success", userStore);
      setDebugData(prev => ({ ...prev, store: userStore }));

      // 3. Verificar produtos cadastrados para esta loja
      addLog(`Verificando produtos cadastrados para a loja ID ${userStore.id}...`);

      // Busca 1: Usando Product.filter
      try {
        addLog("MÉTODO 1: Buscando produtos com Product.filter()...");
        const productsFilter = await Product.filter({ store_id: userStore.id });
        
        if (productsFilter && Array.isArray(productsFilter)) {
          addLog(`${productsFilter.length} produtos encontrados com Product.filter()`, 
                 productsFilter.length > 0 ? "success" : "warning");
          
          setDebugData(prev => ({ 
            ...prev, 
            productsFound: [...prev.productsFound, {
              method: "Product.filter()",
              count: productsFilter.length,
              data: productsFilter
            }]
          }));
        } else {
          addLog("Resposta inválida de Product.filter()", "error", productsFilter);
        }
      } catch (filterError) {
        addLog(`Erro ao usar Product.filter(): ${filterError.message}`, "error");
      }

      // Busca 2: Usando Product.list e filtrando manualmente
      try {
        addLog("MÉTODO 2: Buscando todos os produtos com Product.list()...");
        const allProducts = await Product.list();
        
        if (allProducts && Array.isArray(allProducts)) {
          addLog(`${allProducts.length} produtos encontrados no total`, "info");
          
          const storeProducts = allProducts.filter(p => p.store_id === userStore.id);
          addLog(`${storeProducts.length} produtos pertencem à sua loja após filtragem manual`, 
                 storeProducts.length > 0 ? "success" : "warning");
          
          setDebugData(prev => ({ 
            ...prev, 
            productsFound: [...prev.productsFound, {
              method: "Product.list() + filtro manual",
              count: storeProducts.length,
              data: storeProducts
            }],
            storeProducts
          }));
        } else {
          addLog("Resposta inválida de Product.list()", "error", allProducts);
        }
      } catch (listError) {
        addLog(`Erro ao usar Product.list(): ${listError.message}`, "error");
      }

      // Verificar se temos produtos em qualquer método
      const anyProducts = debugData.productsFound.some(p => p.count > 0);
      
      if (!anyProducts) {
        addLog("NENHUM PRODUTO ENCONTRADO pelos métodos tentados", "error");
        setFix("Adicione novos produtos à sua loja ou verifique se os produtos existentes estão corretamente associados ao ID da sua loja.");
      }

    } catch (error) {
      console.error("Erro no diagnóstico:", error);
      addLog(`ERRO FATAL: ${error.message}`, "error");
      setError("Ocorreu um erro durante o diagnóstico. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    runDebug().finally(() => setRefreshing(false));
  };

  const handleAddProduct = () => {
    navigate(createPageUrl("AddProduct"));
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 rounded-lg bg-white">
        <Loader2 className="w-6 h-6 mr-2 animate-spin text-blue-500" />
        <span>Diagnosticando problema de produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader className="bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Diagnóstico de Produtos</span>
            </CardTitle>
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Resultado do Diagnóstico
              </h3>
              
              <div className="rounded-md border p-4 bg-gray-50">
                {debugData.store ? (
                  <div className="space-y-2">
                    <p><strong>Loja:</strong> {debugData.store.name} (ID: {debugData.store.id})</p>
                    
                    <Separator />
                    
                    <div>
                      <p className="font-medium mb-1">Produtos encontrados:</p>
                      {debugData.productsFound.length === 0 ? (
                        <p className="text-red-600">Nenhum método conseguiu encontrar produtos</p>
                      ) : (
                        <ul className="list-disc pl-5 space-y-2">
                          {debugData.productsFound.map((result, idx) => (
                            <li key={idx} className={result.count > 0 ? 'text-green-600' : 'text-orange-600'}>
                              Via {result.method}: <strong>{result.count}</strong> produtos
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {fix && (
                      <>
                        <Separator />
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                          <p className="font-medium text-yellow-800 mb-1">Sugestão de solução:</p>
                          <p className="text-yellow-700">{fix}</p>
                          <Button 
                            onClick={handleAddProduct}
                            className="bg-yellow-500 hover:bg-yellow-600 mt-2"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Produto
                          </Button>
                        </div>
                      </>
                    )}

                    {debugData.storeProducts && debugData.storeProducts.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium mb-2">Produtos encontrados ({debugData.storeProducts.length}):</p>
                          <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-white">
                            <ul className="divide-y">
                              {debugData.storeProducts.map((product) => (
                                <li key={product.id} className="py-2">
                                  <div className="flex items-center">
                                    <Package className="w-4 h-4 mr-2 text-blue-500" />
                                    <strong>{product.name}</strong>
                                    <span className="ml-2 text-sm text-gray-500">
                                      (ID: {product.id})
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 ml-6">
                                    Preço: R$ {product.price?.toFixed(2)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">Nenhuma loja encontrada para o usuário atual</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Log de Diagnóstico</h3>
              <div className="rounded-md border bg-black text-white p-2 overflow-y-auto h-40 font-mono text-xs">
                {debugData.logs.map((log, idx) => (
                  <div key={idx} className={`mb-1 ${getLogColor(log.type)}`}>
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                    {log.data && (
                      <pre className="ml-5 text-gray-400 mt-1 border-l-2 border-gray-700 pl-2">
                        {log.data}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(createPageUrl("StoreProductManagement"))}
            >
              Gerenciador de Produtos Alternativo
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
              onClick={handleAddProduct}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}