import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Store, CheckCircle, XCircle, ExternalLink, MapPin, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PendingApprovals({ onApprove }) {
  const [pendingStores, setPendingStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    loadPendingStores();
  }, [activeTab]);

  const loadPendingStores = async () => {
    try {
      // Filtrar por status pendente ou rejeitado, dependendo da aba
      const status = activeTab === "pending" ? "pending" : "rejected";
      const data = await User.filter({ role: "store", status });
      setPendingStores(data);
    } catch (error) {
      console.error("Erro ao carregar lojas pendentes:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (storeId) => {
    setProcessingAction(true);
    try {
      await User.update(storeId, { status: "approved" });
      
      // Atualizar a lista de lojas pendentes
      setPendingStores(prev => prev.filter(store => store.id !== storeId));
      setShowDialog(false);
      
      // Chamar callback para atualizar estatísticas
      if (onApprove) onApprove();
    } catch (error) {
      console.error("Erro ao aprovar loja:", error);
    }
    setProcessingAction(false);
  };

  const handleReject = async (storeId) => {
    setProcessingAction(true);
    try {
      await User.update(storeId, { status: "rejected" });
      
      // Atualizar a lista de lojas pendentes
      setPendingStores(prev => prev.filter(store => store.id !== storeId));
      setShowDialog(false);
      
      // Chamar callback para atualizar estatísticas
      if (onApprove) onApprove();
    } catch (error) {
      console.error("Erro ao rejeitar loja:", error);
    }
    setProcessingAction(false);
  };

  const StoreDetails = ({ store }) => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <Avatar className="w-16 h-16 rounded-xl">
          {store.store_logo ? (
            <AvatarImage src={store.store_logo} alt={store.store_name} />
          ) : (
            <AvatarFallback>
              <Store className="w-8 h-8 text-gray-400" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium">{store.store_name || "Loja sem nome"}</h3>
            <Badge variant="outline" className="ml-2">
              {store.store_type || "Loja física"}
            </Badge>
          </div>
          
          <p className="text-gray-600">{store.store_description || "Sem descrição"}</p>
          
          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{store.city || "Cidade não informada"}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{store.whatsapp || "WhatsApp não informado"}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Cadastro: {format(new Date(store.created_date), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Representante Legal</h3>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{store.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{store.full_name}</p>
                <p className="text-sm text-gray-500">{store.email}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Informações Adicionais</h3>
          <div className="p-3 border rounded-lg">
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Documento:</span> {store.document || "Não informado"}</p>
              <p className="text-sm"><span className="font-medium">Website:</span> {store.website || "Não informado"}</p>
              <p className="text-sm"><span className="font-medium">Instagram:</span> {store.instagram || "Não informado"}</p>
            </div>
          </div>
        </div>
      </div>
      
      {store.store_banner && (
        <div>
          <h3 className="font-medium mb-2">Banner da Loja</h3>
          <div className="rounded-lg overflow-hidden h-40 bg-gray-100">
            <img 
              src={store.store_banner} 
              alt="Banner da loja" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aprovações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Aprovações de Lojas
          </CardTitle>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        {pendingStores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Nenhuma loja {activeTab === "pending" ? "pendente" : "rejeitada"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "pending" 
                ? "Todas as solicitações de lojas foram processadas" 
                : "Nenhuma loja foi rejeitada"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingStores.map((store) => (
              <div key={store.id} className="border rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {store.store_logo ? (
                          <AvatarImage src={store.store_logo} alt={store.store_name} />
                        ) : (
                          <AvatarFallback>
                            <Store className="w-5 h-5 text-gray-400" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{store.store_name || "Loja sem nome"}</h3>
                        <p className="text-sm text-gray-500">{store.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedStore(store);
                          setShowDialog(true);
                        }}
                      >
                        Detalhes
                      </Button>
                      
                      {activeTab === "pending" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleReject(store.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                          
                          <Button 
                            size="sm"
                            className="text-white bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(store.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        </>
                      )}
                      
                      {activeTab === "rejected" && (
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(store.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Reconsiderar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50">
                      {store.created_date ? format(new Date(store.created_date), "dd/MM/yyyy") : "Data desconhecida"}
                    </Badge>
                    
                    <Badge variant="outline" className="bg-gray-50">
                      {store.city || "Cidade não informada"}
                    </Badge>
                    
                    {store.document && (
                      <Badge variant="outline" className="bg-amber-50">
                        CNPJ/CPF: {store.document}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Loja</DialogTitle>
            <DialogDescription>
              Analise as informações da loja antes de aprovar ou rejeitar.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStore && <StoreDetails store={selectedStore} />}
          
          <DialogFooter className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={processingAction}
            >
              Fechar
            </Button>
            
            {activeTab === "pending" && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => handleReject(selectedStore?.id)}
                  disabled={processingAction}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar Loja
                </Button>
                
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedStore?.id)}
                  disabled={processingAction}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Loja
                </Button>
              </>
            )}
            
            {activeTab === "rejected" && (
              <Button
                onClick={() => handleApprove(selectedStore?.id)}
                disabled={processingAction}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Reconsiderar e Aprovar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}