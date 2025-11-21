import React, { useState, useEffect, useCallback } from "react";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Package,
  AlertCircle,
  RefreshCw,
  Plus,
  ShoppingBag,
  Loader2,
  Info
} from "lucide-react";

export default function ProductsRefresher() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState({
    user: null,
    store: null,
    log: []
  });

  const addDiagnosticLog = useCallback((message, data = null) => {
    if (diagnosticMode) {
      console.log(`[Diagnóstico] ${message}`, data);
      setDiagnosticData(prev => ({
        ...prev,
        log: [...prev.log, { timestamp: new Date().toISOString(), message, data }]
      }));
    }
  }, [diagnosticMode]);

  // Função para carregar os produtos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      addDiagnosticLog("Iniciando carregamento de dados");

      // 1. Carregar usuário
      addDiagnosticLog("Buscando usuário...");
      const userData = await User.me();
      addDiagnosticLog("Usuário encontrado", userData);
      
      if (diagnosticMode) {
        setDiagnosticData(prev => ({ ...prev, user: userData }));
      }

      // 2. Carregar loja
      addDiagnosticLog("Buscando lojas...");
      const stores = await Store.list();
      addDiagnosticLog(`Encontradas ${stores.length} lojas`);
      
      const userStore = stores.find(
        s => s.email === userData.email || s.created_by === userData.email
      );
      
      if (!userStore) {
        addDiagnosticLog("ERRO: Nenhuma loja encontrada para este usuário", userData);
        setError("Você não possui uma loja cadastrada. Crie uma loja primeiro.");
        setLoading(false);
        return;
      }
      
      addDiagnosticLog("Loja encontrada para o usuário", userStore);
      setStore(userStore);
      
      if (diagnosticMode) {
        setDiagnosticData(prev => ({ ...prev, store: userStore }));
      }

      // 3. Carregar produtos
      addDiagnosticLog(`Buscando produtos para a loja: ${userStore.id}`);
      
      // Primeiro, tentar com Product.filter
      try {
        const productsData = await Product.filter({ store_id: userStore.id });
        addDiagnosticLog(`Produtos encontrados com Product.filter: ${productsData?.length || 0}`);
        
        if (productsData && Array.isArray(productsData)) {
          setProducts(productsData);
          if (productsData.length > 0) {
            setSuccessMessage(`${productsData.length} produtos encontrados!`);
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        } else {
          addDiagnosticLog("ALERTA: Resposta inválida do Product.filter", productsData);
        }
      } catch (filterError) {
        addDiagnosticLog("ERRO: Falha ao usar Product.filter", filterError);
        
        // Tentar com Product.list como fallback
        try {
          addDiagnosticLog("Tentando alternativa: Product.list + filtragem manual");
          const allProducts = await Product.list();
          addDiagnosticLog(`Total de produtos no sistema: ${allProducts.length}`);
          
          const filteredProducts = allProducts.filter(p => p.store_id === userStore.id);
          addDiagnosticLog(`Produtos filtrados manualmente: ${filteredProducts.length}`);
          
          setProducts(filteredProducts);
          
          if (filteredProducts.length > 0) {
            setSuccessMessage(`${filteredProducts.length} produtos encontrados!`);
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        } catch (listError) {
          addDiagnosticLog("ERRO: Falha também no Product.list", listError);
          setError("Erro ao carregar produtos. Tente novamente.");
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      addDiagnosticLog("ERRO CRÍTICO", err);
      setError("Erro ao carregar dados. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      addDiagnosticLog("Carregamento concluído");
    }
  }, [addDiagnosticLog, diagnosticMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleDiagnosticMode = () => {
    setDiagnosticMode(prev => !prev);
    setDiagnosticData({ user: null, store: null, log: [] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <Loader2 className="w-6 h-6 mr-2 animate-spin text-blue-500" />
        <span>Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          {store?.name ? `Produtos - ${store.name}` : "Seus Produtos"}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleDiagnosticMode}
            className="ml-2"
          >
            <Info className="w-4 h-4" />
          </Button>
        </h2>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button 
            onClick={() => navigate(createPageUrl("AddProduct"))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Modo de diagnóstico */}
      {diagnosticMode && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-800 mb-2">Informações de Diagnóstico</h3>
            
            <div className="space-y-2 text-sm">
              <p><strong>Usuário:</strong> {diagnosticData.user?.email || "Não encontrado"}</p>
              <p><strong>Loja ID:</strong> {diagnosticData.store?.id || "Não encontrada"}</p>
              <p><strong>Loja Nome:</strong> {diagnosticData.store?.name || "Não encontrada"}</p>
              <p><strong>Total de Produtos:</strong> {products.length}</p>
              
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-700 hover:underline">
                  Ver Log de Diagnóstico ({diagnosticData.log.length} entradas)
                </summary>
                <div className="mt-2 p-2 bg-white rounded text-xs font-mono max-h-40 overflow-y-auto">
                  {diagnosticData.log.map((entry, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      : {entry.message}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            Comece adicionando seu primeiro produto à loja
          </p>
          <Button 
            onClick={() => navigate(createPageUrl("AddProduct"))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow border border-gray-200">
              <div className="aspect-video relative bg-gray-100">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  <Badge className={`
                    ${product.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    ${product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${product.status === 'out_of_stock' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {product.status === 'active' ? 'Ativo' : 
                     product.status === 'draft' ? 'Rascunho' : 
                     product.status === 'out_of_stock' ? 'Sem Estoque' : 
                     product.status}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-medium text-lg truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-2">
                  {product.description || 'Sem descrição'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    R$ {Number(product.price || 0).toFixed(2)}
                  </span>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(createPageUrl(`AddProduct?id=${product.id}`))}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-center">
        <Button
          onClick={() => navigate(createPageUrl("StoreProductManagement"))}
          variant="outline"
          className="text-blue-600"
        >
          Gerenciar Todos os Produtos
        </Button>
      </div>
    </div>
  );
}