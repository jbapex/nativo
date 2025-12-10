
import React, { useState, useEffect } from "react";
import { Subscription } from "@/api/entities";
import { Plan } from "@/api/entities";
import { User } from "@/api/entities";
import AdminLayout from "../components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Calendar, CheckCircle, CreditCard, Edit, Plus, Search, Store as StoreIcon, Trash2, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Store as StoreEntity } from "@/api/entities";  

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [stores, setStores] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [formData, setFormData] = useState({
    store_id: "",
    plan_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "", 
    status: "active",
    payment_method: "credit_card",
    auto_renew: true,
    billing_cycle: "monthly",
    price_paid: 0,
    subscription_notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Carregando dados de assinaturas...");
      
      const [subsData, storesData, plansData] = await Promise.all([
        Subscription.list().catch(err => {
          console.error("Erro ao carregar assinaturas:", err);
          throw new Error(`Erro ao carregar assinaturas: ${err.message}`);
        }),
        // Usar StoreEntity.list() em vez de User.filter() pois não há rota de usuários com filtro por role
        StoreEntity.list().catch(err => {
          console.error("Erro ao carregar lojas:", err);
          return [];
        }),
        Plan.list().catch(err => {
          console.error("Erro ao carregar planos:", err);
          return [];
        })
      ]);

      console.log("Assinaturas carregadas:", subsData);
      console.log("Lojas carregadas:", storesData);
      console.log("Planos carregados:", plansData);

      let allStores = storesData || [];
      if (allStores.length === 0) {
        try {
          const storeEntities = await StoreEntity.filter({ status: "approved" });
          allStores = storeEntities.map(store => ({
            id: store.id,
            store_name: store.name,
            email: store.email,
            store_logo: store.logo
          }));
          console.log("Lojas carregadas via StoreEntity:", allStores);
        } catch (err) {
          console.error("Erro ao carregar lojas via StoreEntity:", err);
        }
      }

      const enrichedSubscriptions = (subsData || []).map((sub) => {
        const store = allStores.find(s => s.id === sub.store_id) || {};
        const plan = (plansData || []).find(p => p.id === sub.plan_id) || {};
        
        return {
          ...sub,
          store_name: store.store_name || store.name || "Loja sem nome",
          store_email: store.email,
          store_logo: store.store_logo || store.logo,
          plan_name: plan.name || "Plano desconhecido",
          plan_slug: plan.slug || "unknown",
          plan_price: Number(plan.price) || 0 // Converter para número
        };
      });

      console.log("Assinaturas enriquecidas:", enrichedSubscriptions);

      setSubscriptions(enrichedSubscriptions);
      setStores(allStores);
      setPlans(plansData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError(error.message || "Erro ao carregar dados. Verifique o console para mais detalhes.");
      setSubscriptions([]);
      setStores([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscription = () => {
    setFormData({
      store_id: "",
      plan_id: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "", 
      status: "active",
      payment_method: "credit_card",
      auto_renew: true,
      billing_cycle: "monthly",
      price_paid: 0,
      subscription_notes: ""
    });
    setShowAddDialog(true);
  };

  const handleEditSubscription = (subscription) => {
    setCurrentSubscription(subscription);
    setFormData({
      store_id: subscription.store_id,
      plan_id: subscription.plan_id,
      start_date: subscription.start_date ? new Date(subscription.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: subscription.end_date || "", 
      status: subscription.status || "active",
      payment_method: subscription.payment_method || "credit_card",
      auto_renew: subscription.auto_renew !== false,
      billing_cycle: subscription.billing_cycle || "monthly",
      price_paid: Number(subscription.price_paid) || Number(subscription.plan_price) || 0, // Converter para número
      subscription_notes: subscription.subscription_notes || ""
    });
    setShowEditDialog(true);
  };

  const handleDeleteSubscription = (subscription) => {
    setCurrentSubscription(subscription);
    setShowDeleteDialog(true);
  };

  const saveSubscription = async () => {
    try {
      const selectedPlan = plans.find(p => p.id === formData.plan_id);
      
      if (!formData.price_paid && selectedPlan) {
        const planPrice = Number(selectedPlan.price) || 0;
        const yearlyPrice = Number(selectedPlan.yearly_price) || 0;
        formData.price_paid = formData.billing_cycle === "yearly" 
          ? (yearlyPrice || planPrice * 10) 
          : planPrice;
      }
      
      const subscriptionData = {
        ...formData,
        end_date: selectedPlan?.price === 0 ? formData.end_date || null : formData.end_date
      };
      
      if (currentSubscription) {
        await Subscription.update(currentSubscription.id, subscriptionData);
      } else {
        await Subscription.create(subscriptionData);
      }
      
      loadData();
      setShowAddDialog(false);
      setShowEditDialog(false);
    } catch (error) {
      console.error("Erro ao salvar assinatura:", error);
    }
  };

  const deleteSubscription = async () => {
    try {
      await Subscription.delete(currentSubscription.id);
      loadData();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Erro ao excluir assinatura:", error);
    }
  };

  const handlePlanChange = (value) => {
    const selectedPlan = plans.find(p => p.id === value);
    let endDate = "";
    
    if (selectedPlan && Number(selectedPlan.price) > 0) {
      const startDate = new Date(formData.start_date);
      const monthsToAdd = formData.billing_cycle === "yearly" ? 12 : 1;
      endDate = new Date(startDate.setMonth(startDate.getMonth() + monthsToAdd)).toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      plan_id: value,
      price_paid: Number(selectedPlan?.price) || 0, // Converter para número
      end_date: endDate 
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchTerm
      ? sub.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.store_email?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPlan = planFilter === "all" || sub.plan_slug === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativa
          </Badge>
        );
      case "trial":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Calendar className="w-3 h-3 mr-1" />
            Período de Teste
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Calendar className="w-3 h-3 mr-1" />
            Expirada
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPlanBadge = (planSlug) => {
    const normalized = (planSlug || "").toLowerCase();
    switch (normalized) {
      case "free":
        return <Badge variant="outline">Gratuito</Badge>;
      case "standard":
        return <Badge className="bg-blue-100 text-blue-800">Standard</Badge>;
      case "premium":
      case "plan-premium":
      case "premium-plan":
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      default:
        return planSlug ? (
          <Badge variant="secondary">{planSlug}</Badge>
        ) : (
          <Badge variant="secondary">Personalizado</Badge>
        );
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Gerenciamento de Assinaturas</h1>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Assinaturas</h1>
            <p className="text-sm text-gray-500 mt-1">
              {subscriptions.length > 0 
                ? `${subscriptions.length} assinatura(s) cadastrada(s)`
                : "Gerencie as assinaturas das lojas"}
            </p>
          </div>
          <Button onClick={handleAddSubscription}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Assinatura
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Erro ao carregar dados</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por loja ou plano..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="trial">Em Teste</SelectItem>
                  <SelectItem value="canceled">Canceladas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-12 h-12 text-gray-400" />
                        <p className="font-medium">Nenhuma assinatura encontrada</p>
                        <p className="text-sm">
                          {subscriptions.length === 0 
                            ? "Não há assinaturas cadastradas no sistema."
                            : "Nenhuma assinatura corresponde aos filtros selecionados."}
                        </p>
                        {subscriptions.length === 0 && (
                          <Button 
                            onClick={handleAddSubscription}
                            className="mt-2"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeira Assinatura
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {subscription.store_logo ? (
                              <AvatarImage src={subscription.store_logo} alt={subscription.store_name} />
                            ) : (
                              <AvatarFallback>
                                <StoreIcon className="w-4 h-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{subscription.store_name}</div>
                            <div className="text-sm text-gray-500">{subscription.store_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{subscription.plan_name}</span>
                          {getPlanBadge(subscription.plan_slug)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <span>Início:</span>
                            <span className="font-medium">
                              {subscription.start_date ? format(new Date(subscription.start_date), "dd/MM/yyyy") : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Término:</span>
                            <span className="font-medium">
                              {subscription.end_date ? format(new Date(subscription.end_date), "dd/MM/yyyy") : "N/A"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.plan_slug === "free" ? (
                          <span className="text-green-600 font-medium">Grátis</span>
                        ) : (
                          <div className="text-sm">
                            <div className="font-medium">
                              R$ {
                                (Number(subscription.price_paid) || Number(subscription.plan_price) || 0).toFixed(2)
                              }
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {subscription.billing_cycle === "yearly" ? "Anual" : "Mensal"}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSubscription(subscription)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteSubscription(subscription)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showAddDialog ? "Nova Assinatura" : "Editar Assinatura"}
            </DialogTitle>
            <DialogDescription>
              {showAddDialog ? "Adicione uma nova assinatura para uma loja." : "Atualize os detalhes da assinatura."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loja</label>
              <Select
                value={formData.store_id}
                onValueChange={(value) => setFormData({...formData, store_id: value})}
                disabled={showEditDialog}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.length > 0 ? (
                    stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_name || store.name || store.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={null} disabled>
                      Nenhuma loja disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Plano</label>
              <Select
                value={formData.plan_id}
                onValueChange={handlePlanChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => {
                    const planPrice = Number(plan.price) || 0;
                    return (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {planPrice === 0 ? "Grátis" : `R$ ${planPrice.toFixed(2)}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Início</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    const selectedPlan = plans.find(p => p.id === formData.plan_id);
                    let newEndDate = formData.end_date;

                    if (selectedPlan && Number(selectedPlan.price) > 0) {
                      const startDate = new Date(newStartDate);
                      const monthsToAdd = formData.billing_cycle === "yearly" ? 12 : 1;
                      newEndDate = new Date(startDate.setMonth(startDate.getMonth() + monthsToAdd))
                        .toISOString().split('T')[0];
                    }

                    setFormData({
                      ...formData,
                      start_date: newStartDate,
                      end_date: newEndDate
                    });
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Data de Término
                  {formData.plan_id && plans.find(p => p.id === formData.plan_id)?.price === 0 && (
                    <span className="text-xs text-gray-500 ml-2">(Opcional para plano gratuito)</span>
                  )}
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  min={formData.start_date}
                  disabled={!formData.plan_id || plans.find(p => p.id === formData.plan_id)?.price === 0}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="trial">Período de Teste</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciclo de Cobrança</label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(value) => {
                    const selectedPlan = plans.find(p => p.id === formData.plan_id);
                    let newPrice = 0;
                    
                    if (selectedPlan) {
                      const planPrice = Number(selectedPlan.price) || 0;
                      const yearlyPrice = Number(selectedPlan.yearly_price) || 0;
                      newPrice = value === "yearly" 
                        ? (yearlyPrice || planPrice * 10) 
                        : planPrice;
                    }
                    
                    setFormData({
                      ...formData, 
                      billing_cycle: value,
                      price_paid: Number(newPrice) // Garantir que é número
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({...formData, payment_method: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="bank_slip">Boleto</SelectItem>
                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Pago</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_paid}
                  onChange={(e) => setFormData({...formData, price_paid: parseFloat(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={formData.auto_renew}
                  onChange={(e) => setFormData({...formData, auto_renew: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto_renew" className="text-sm font-medium">
                  Renovação Automática
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input
                value={formData.subscription_notes}
                onChange={(e) => setFormData({...formData, subscription_notes: e.target.value})}
                placeholder="Observações adicionais sobre a assinatura"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setShowEditDialog(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={saveSubscription}>
              {showAddDialog ? "Adicionar Assinatura" : "Atualizar Assinatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta assinatura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSubscription} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
