import React, { useState, useEffect } from 'react';
import { Store } from "@/api/entities";
import { City } from "@/api/entities";
import { Plan } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Store as StoreIcon, 
  Search, 
  Plus, 
  Camera, 
  Upload,
  AlertCircle,
  CheckCircle 
} from "lucide-react";

export default function StoresManagementContent() {
  const [stores, setStores] = useState([]);
  const [cities, setCities] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const bannerRef = React.useRef(null);
  const editBannerRef = React.useRef(null);

  const [newStore, setNewStore] = useState({
    name: "",
    email: "",
    whatsapp: "",
    description: "",
    city_id: "",
    status: "pending",
    banner: "",
    logo: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storesData, citiesData, plansData] = await Promise.all([
        Store.list(),
        City.list(),
        Plan.list()
      ]);
      setStores(storesData || []);
      setCities(citiesData || []);
      setPlans(plansData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingBanner(true);
    setError("");
    
    try {
      const { file_url } = await UploadFile({ file });
      setNewStore(prev => ({ ...prev, banner: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      setError("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      if (!newStore.name?.trim() || !newStore.email?.trim() || !newStore.whatsapp?.trim()) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      await Store.create(newStore);
      setShowAddDialog(false);
      setNewStore({
        name: "",
        email: "",
        whatsapp: "",
        description: "",
        city_id: "",
        status: "pending",
        banner: "",
        logo: ""
      });
      setSuccess("Loja criada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
      loadData();
    } catch (error) {
      console.error("Erro ao criar loja:", error);
      setError("Erro ao criar loja. Verifique os dados e tente novamente.");
    }
  };

  const handleEditStore = async (store) => {
    try {
      // Buscar assinatura ativa da loja para pegar o plan_id
      let planId = store.plan_id || null;
      
      if (!planId) {
        const subscriptions = await Subscription.list();
        const activeSubscription = subscriptions.find(
          sub => sub.store_id === store.id && sub.status === 'active'
        );
        if (activeSubscription) {
          planId = activeSubscription.plan_id;
        }
      }

      setEditingStore({
        ...store,
        city_id: store.city_id || "",
        plan_id: planId || "none",
        status: store.status || "pending" // Garantir que status está presente
      });
      setShowEditDialog(true);
      setError("");
    } catch (error) {
      console.error("Erro ao carregar dados da loja:", error);
      // Mesmo com erro, abrir dialog com dados básicos
      setEditingStore({
        ...store,
        city_id: store.city_id || "",
        plan_id: store.plan_id || "none",
        status: store.status || "pending" // Garantir que status está presente
      });
      setShowEditDialog(true);
      setError("");
    }
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!editingStore) return;

    try {
      if (!editingStore.name?.trim() || !editingStore.whatsapp?.trim()) {
        setError("Por favor, preencha todos os campos obrigatórios (Nome e WhatsApp).");
        return;
      }

      // Preparar dados da loja (incluindo plan_id e status)
      const planId = editingStore.plan_id;
      const storeUpdateData = {
        name: editingStore.name?.trim(),
        description: editingStore.description?.trim() || '',
        logo: editingStore.logo?.trim() || '',
        whatsapp: editingStore.whatsapp?.trim() || '',
        city_id: editingStore.city_id && editingStore.city_id !== "" ? editingStore.city_id : null,
        category_id: editingStore.category_id && editingStore.category_id !== "" ? editingStore.category_id : null,
        plan_id: planId && planId !== "none" && planId !== "" ? planId : null,
        status: editingStore.status || 'pending' // Incluir status para aprovação/rejeição
      };
      
      console.log('Atualizando loja com dados:', storeUpdateData);
      console.log('ID da loja:', editingStore.id);
      
      // Atualizar loja (incluindo plan_id)
      const updatedStore = await Store.update(editingStore.id, storeUpdateData);
      console.log('Loja atualizada com sucesso:', updatedStore);

      // Gerenciar assinatura
      try {
        // Verificar se já existe assinatura ativa
        const subscriptions = await Subscription.list();
        const existingSubscription = subscriptions.find(
          sub => sub.store_id === editingStore.id && sub.status === 'active'
        );

        if (planId && planId !== "none") {
          // Se um plano foi selecionado, criar ou atualizar assinatura
          const selectedPlan = plans.find(p => p.id === planId);
          console.log("Plano selecionado:", selectedPlan);
          console.log("Plan ID:", planId);
          
          if (selectedPlan) {
            if (existingSubscription) {
              // Atualizar assinatura existente
              console.log("Atualizando assinatura existente:", existingSubscription.id);
              await Subscription.update(existingSubscription.id, {
                plan_id: planId,
                status: 'active'
              });
              console.log("Assinatura atualizada com sucesso");
            } else {
              // Criar nova assinatura (backend busca user_id da loja automaticamente)
              console.log("Criando nova assinatura para loja:", editingStore.id, "com plano:", planId);
              const newSubscription = await Subscription.create({
                store_id: editingStore.id,
                plan_id: planId
              });
              console.log("Assinatura criada com sucesso:", newSubscription);
            }
          } else {
            console.error("Plano não encontrado:", planId);
          }
        } else if (existingSubscription) {
          // Se nenhum plano foi selecionado, cancelar assinatura ativa
          await Subscription.update(existingSubscription.id, {
            status: 'cancelled'
          });
        }
      } catch (subError) {
        console.error("Erro ao criar/atualizar assinatura:", subError);
        const subErrorMessage = subError.message || subError.details || "Erro ao atualizar assinatura";
        console.warn("Aviso: Erro na assinatura, mas loja foi atualizada:", subErrorMessage);
        // Não bloquear a atualização da loja se houver erro na assinatura
        // Apenas mostrar aviso no console
      }

      setShowEditDialog(false);
      setEditingStore(null);
      setSuccess("Loja atualizada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      const errorMessage = error.message || error.details || "Erro ao atualizar loja. Verifique os dados e tente novamente.";
      setError(errorMessage);
    }
  };

  const handleEditBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingBanner(true);
    setError("");
    
    try {
      const { file_url } = await UploadFile({ file });
      setEditingStore(prev => ({ ...prev, banner: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      setError("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = !searchTerm || 
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || store.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pendente" },
      approved: { color: "bg-green-100 text-green-800", text: "Aprovada" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rejeitada" }
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", text: "Desconhecido" };

    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Buscar lojas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Loja
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banner</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>
                  {store.banner ? (
                    <img 
                      src={store.banner} 
                      alt={store.name}
                      className="w-20 h-12 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-20 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                      <Camera className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>{store.name}</TableCell>
                <TableCell>{store.email}</TableCell>
                <TableCell>{store.whatsapp}</TableCell>
                <TableCell>
                  {cities.find(c => c.id === store.city_id)?.name || "-"}
                </TableCell>
                <TableCell>{getStatusBadge(store.status)}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditStore(store)}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Loja</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova loja no sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStore}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Banner da Loja</Label>
                <div className="border rounded-lg p-4">
                  {newStore.banner ? (
                    <div className="relative">
                      <img 
                        src={newStore.banner} 
                        alt="Banner" 
                        className="w-full h-40 object-cover rounded-md" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => bannerRef.current?.click()}
                      >
                        Alterar Banner
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bannerRef.current?.click()}
                        disabled={uploadingBanner}
                      >
                        {uploadingBanner ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            Carregando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Banner
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={bannerRef}
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Recomendado: 1200x400 pixels, máximo 5MB
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Loja *</Label>
                <Input
                  id="name"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={newStore.whatsapp}
                  onChange={(e) => setNewStore({ ...newStore, whatsapp: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newStore.description}
                  onChange={(e) => setNewStore({ ...newStore, description: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="city">Cidade</Label>
                <Select
                  value={newStore.city_id}
                  onValueChange={(value) => setNewStore({ ...newStore, city_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name} - {city.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploadingBanner}>
                Criar Loja
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
            <DialogDescription>
              Atualize as informações da loja. Você pode alterar o plano e o status.
            </DialogDescription>
          </DialogHeader>
          {editingStore && (
            <form onSubmit={handleUpdateStore}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Banner da Loja</Label>
                  <div className="border rounded-lg p-4">
                    {editingStore.banner ? (
                      <div className="relative">
                        <img 
                          src={editingStore.banner} 
                          alt="Banner" 
                          className="w-full h-40 object-cover rounded-md" 
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => editBannerRef.current?.click()}
                        >
                          Alterar Banner
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editBannerRef.current?.click()}
                          disabled={uploadingBanner}
                        >
                          {uploadingBanner ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                              Carregando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Banner
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={editBannerRef}
                      className="hidden"
                      onChange={handleEditBannerUpload}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Recomendado: 1200x400 pixels, máximo 5MB
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nome da Loja *</Label>
                  <Input
                    id="edit-name"
                    value={editingStore.name}
                    onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingStore.email}
                    onChange={(e) => setEditingStore({ ...editingStore, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-whatsapp">WhatsApp *</Label>
                  <Input
                    id="edit-whatsapp"
                    value={editingStore.whatsapp}
                    onChange={(e) => setEditingStore({ ...editingStore, whatsapp: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea
                    id="edit-description"
                    value={editingStore.description || ""}
                    onChange={(e) => setEditingStore({ ...editingStore, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Select
                    value={editingStore.city_id || ""}
                    onValueChange={(value) => setEditingStore({ ...editingStore, city_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name} - {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingStore.status}
                    onValueChange={(value) => setEditingStore({ ...editingStore, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovada</SelectItem>
                      <SelectItem value="rejected">Rejeitada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-plan">Plano</Label>
                  <Select
                    value={editingStore.plan_id || "none"}
                    onValueChange={(value) => setEditingStore({ ...editingStore, plan_id: value === "none" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum plano</SelectItem>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.price?.toFixed(2) || '0.00'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Ao selecionar um plano, uma assinatura será criada automaticamente quando a loja for aprovada.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingStore(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploadingBanner}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}