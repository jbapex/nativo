
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Store as StoreEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingBag, ArrowLeft, MessageCircle, Info, MapPin, Calendar, Star } from "lucide-react";
import ProductGrid from "../components/products/ProductGrid";

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function Store() {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  
  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = urlParams.get("id");
      
      if (!storeId) {
        navigate(createPageUrl("Home"));
        return;
      }
      
      const storeData = await StoreEntity.get(storeId);
      
      if (!storeData) {
        navigate(createPageUrl("Home"));
        return;
      }
      
      setStore(storeData);
      loadStoreProducts(storeId);
      
    } catch (error) {
      console.error("Erro ao carregar loja:", error);
      navigate(createPageUrl("Home"));
    }
  };
  
  const loadStoreProducts = async (storeId) => {
    try {
      const storeProducts = await Product.filter({ 
        store_id: storeId
      });
      // Filtrar apenas produtos ativos
      const activeProducts = storeProducts.filter(p => 
        p.active === true || p.active === 1
      );
      setProducts(activeProducts);
    } catch (error) {
      console.error("Erro ao carregar produtos da loja:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="relative mb-8">
          {store.banner ? (
            <div className="h-64 rounded-lg overflow-hidden">
              <img 
                src={store.banner} 
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"></div>
          )}
          
          <div className="absolute -bottom-10 left-10 border-4 border-white rounded-full">
            <div className="w-20 h-20 bg-white rounded-full overflow-hidden">
              {store.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                  {store.name?.charAt(0) || "S"}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-14 md:mt-10 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
          <p className="text-gray-600 mt-2">{store.description || "Sem descrição disponível"}</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            {store.city_name && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {store.city_name}
              </Badge>
            )}
            
            {store.created_at && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Desde {new Date(store.created_at).getFullYear()}
              </Badge>
            )}
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              4.5 (12 avaliações)
            </Badge>
          </div>
          
          <div className="flex mt-6">
            <Button
              onClick={() => {
                if (store.whatsapp) {
                  const message = `Olá! Vi sua loja ${store.name} no NATIVO e gostaria de mais informações.`;
                  const url = `https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                }
              }}
              className="bg-green-500 hover:bg-green-600 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Contatar Loja
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="flex gap-2">
              <ShoppingBag className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="about" className="flex gap-2">
              <Info className="w-4 h-4" />
              Sobre
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <ProductGrid 
              products={products}
              loading={false}
              emptyMessage="Esta loja ainda não tem produtos cadastrados"
            />
          </TabsContent>
          
          <TabsContent value="about">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Sobre a Loja</h2>
                <p className="text-gray-600 mb-6">
                  {store.description || "Esta loja ainda não adicionou uma descrição."}
                </p>
                
                <h3 className="text-lg font-semibold mb-3">Informações de Contato</h3>
                <div className="space-y-2">
                  {store.whatsapp && (
                    <div className="flex gap-2">
                      <span className="font-medium">WhatsApp:</span>
                      <span>{store.whatsapp}</span>
                    </div>
                  )}
                  
                  {store.email && (
                    <div className="flex gap-2">
                      <span className="font-medium">Email:</span>
                      <span>{store.email}</span>
                    </div>
                  )}
                  
                  {store.city_name && (
                    <div className="flex gap-2">
                      <span className="font-medium">Localização:</span>
                      <span>{store.city_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
