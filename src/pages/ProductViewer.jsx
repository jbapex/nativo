import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  AlertCircle, 
  Store as StoreIcon, 
  Package, 
  Search,
  Check,
  ArrowLeft,
  Eye,
  Loader2,
  Database,
  Pencil,
  Plus,
  Info,
  List,
  Filter,
  FileJson
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProductViewer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("produtos");
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const logDiagnostic = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      time: timestamp,
      message,
      data
    };
    console.log(`[${timestamp}] ${message}`, data);
    setDiagnosticLogs(prev => [logEntry, ...prev]);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setDiagnosticLogs([]);

    try {
      // 1. Obter usuário
      logDiagnostic("Buscando dados do usuário...");
      const userData = await User.me();
      setUser(userData);
      logDiagnostic("Usuário encontrado:", userData);

      // 2. Obter todas as lojas
      logDiagnostic("Buscando todas as lojas...");
      const stores = await Store.list();
      logDiagnostic(`${stores.length} lojas encontradas`);

      // 3. Encontrar a loja do usuário
      const userStore = stores.find(
        s => s.email === userData.email || s.created_by === userData.email
      );
      setStore(userStore);
      
      if (userStore) {
        logDiagnostic("Loja do usuário encontrada:", userStore);
      } else {
        logDiagnostic("ALERTA: Nenhuma loja encontrada para o usuário atual", userData);
        setError("Nenhuma loja encontrada para o usuário atual. Crie uma loja primeiro.");
        setLoading(false);
        return;
      }

      // 4. Obter todos os produtos
      logDiagnostic("Buscando todos os produtos...");
      const allProductsData = await Product.list();
      logDiagnostic(`${allProductsData.length} produtos encontrados no total`);
      setAllProducts(allProductsData || []);

      // 5. Filtrar produtos da loja
      const filteredProducts = allProductsData.filter(
        p => p.store_id === userStore.id
      );
      logDiagnostic(`${filteredProducts.length} produtos pertencem à loja do usuário (método filter)`);
      setStoreProducts(filteredProducts);

      // 6. Buscar diretamente produtos da loja (caminho alternativo)
      try {
        logDiagnostic(`Tentando filtrar diretamente por store_id: ${userStore.id}`);
        const directProducts = await Product.filter({ store_id: userStore.id });
        logDiagnostic(`${directProducts?.length || 0} produtos encontrados via Product.filter() direto`);
        
        if (directProducts && directProducts.length > 0) {
          // Se encontramos produtos diretamente, usamos eles
          setStoreProducts(directProducts);
        } else {
          logDiagnostic("ALERTA: Nenhum produto encontrado usando Product.filter()");
        }
      } catch (filterError) {
        logDiagnostic("ERRO ao filtrar produtos por loja", filterError);
      }

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      logDiagnostic("ERRO CRÍTICO:", err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    navigate(createPageUrl("AddProduct"));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const goBack = () => {
    navigate(createPageUrl("StoreProfile"));
  };

  // Filtrar produtos pelo termo de busca
  const filteredProducts = storeProducts.filter(
    product => 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Carregando Produtos...</h2>
          <p className="text-gray-500 mt-2">Aguarde enquanto buscamos seus produtos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Visualizador de Produtos</h1>
            {store && (
              <Badge className="bg-blue-100 text-blue-800 ml-2">
                <StoreIcon className="w-3 h-3 mr-1" /> 
                {store.name}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button
              onClick={handleAddProduct}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="diagnostico" className="flex items-center gap-2">
              <Database className="w-4 h-4" /> Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileJson className="w-4 h-4" /> JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos">
            <div className="mb-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {storeProducts.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent className="pt-6">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum produto encontrado
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Você ainda não cadastrou produtos para sua loja.
                    </p>
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleAddProduct}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                          <Badge className={
                            product.status === "active" ? "bg-green-100 text-green-800" :
                            product.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }>
                            {product.status === "active" ? "Ativo" : 
                             product.status === "draft" ? "Rascunho" : 
                             "Sem Estoque"}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-medium text-lg mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="font-bold">
                            R$ {Number(product.price).toFixed(2)}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(createPageUrl("AddProduct"), { state: { product } })}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="diagnostico">
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Diagnóstico do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Resumo</h3>
                    <div className="bg-white p-4 rounded-lg border grid gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Usuário autenticado:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {user ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Loja encontrada:</span>
                        <Badge className={store ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {store ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total de produtos na base:</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {allProducts.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Produtos desta loja:</span>
                        <Badge className={storeProducts.length > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                          {storeProducts.length}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Detalhes da Loja</h3>
                    <div className="bg-white p-4 rounded-lg border text-sm">
                      {store ? (
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <strong>ID:</strong> {store.id}
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>Nome:</strong> {store.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>Email:</strong> {store.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>Status:</strong> {store.status}
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>Criada por:</strong> {store.created_by}
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-500">Nenhuma loja encontrada</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Log de Diagnóstico</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRefresh}
                        className="text-blue-600"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Atualizar Diagnóstico
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
                      {diagnosticLogs.length === 0 ? (
                        <p className="text-gray-500 text-center">
                          Nenhum log disponível. Clique em "Atualizar Diagnóstico"
                        </p>
                      ) : (
                        <div className="space-y-2 text-xs">
                          {diagnosticLogs.map((log, index) => (
                            <div key={index} className="p-2 border-b last:border-0">
                              <div className="flex items-center text-gray-500 mb-1">
                                <span className="font-mono">{log.time}</span>
                              </div>
                              <div className="flex">
                                <span className="flex-1">{log.message}</span>
                              </div>
                              {log.data && (
                                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                  {typeof log.data === 'object' 
                                    ? JSON.stringify(log.data, null, 2)
                                    : log.data}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2 flex-wrap border-t pt-6">
                <Button 
                  variant="outline" 
                  onClick={goBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para a loja
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar Dados
                </Button>
                <Button 
                  onClick={handleAddProduct}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="json">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5" />
                  Dados de Produtos (JSON)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs">
                    {JSON.stringify({
                      user: user,
                      store: store,
                      storeProducts: storeProducts,
                      allProducts: allProducts.slice(0, 5) // Limitado a 5 para não sobrecarregar
                    }, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}