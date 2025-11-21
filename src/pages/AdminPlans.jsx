import React, { useState, useEffect } from "react";
import { Plan } from "@/api/entities";
import AdminLayout from "../components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Edit, PackageOpen, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "standard",
    description: "",
    price: 0,
    yearly_price: 0,
    features: [],
    product_limit: 10,
    featured: false,
    active: true,
    badge_text: "",
    badge_color: "#4F46E5"
  });
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await Plan.list();
      setPlans(plansData);

      // Se não existirem planos, criar os planos padrão
      if (plansData.length === 0) {
        await createDefaultPlans();
        const updatedPlans = await Plan.list();
        setPlans(updatedPlans);
      }
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPlans = async () => {
    const defaultPlans = [
      {
        name: "Gratuito",
        slug: "free",
        description: "Ideal para quem está começando sua jornada de vendas online.",
        price: 0,
        yearly_price: 0,
        features: [
          "Até 5 produtos",
          "Perfil básico da loja",
          "Suporte por email"
        ],
        product_limit: 5,
        featured: false,
        active: true
      },
      {
        name: "Standard",
        slug: "standard",
        description: "Perfeito para lojistas que desejam expandir seu alcance digital.",
        price: 49.90,
        yearly_price: 479.90,
        features: [
          "Até 50 produtos",
          "Perfil avançado da loja",
          "Suporte prioritário",
          "Loja aparece nos destaques",
          "Estatísticas básicas"
        ],
        product_limit: 50,
        featured: true,
        active: true,
        badge_text: "POPULAR",
        badge_color: "#4F46E5"
      },
      {
        name: "Premium",
        slug: "premium",
        description: "A solução definitiva para lojistas profissionais",
        price: 99.90,
        yearly_price: 959.90,
        features: [
          "Produtos ilimitados",
          "Perfil completo da loja",
          "Suporte 24/7",
          "Loja em destaque",
          "Estatísticas avançadas",
          "Gerenciamento de cupons",
          "API de integração"
        ],
        product_limit: 9999,
        featured: false,
        active: true,
        badge_text: "COMPLETO",
        badge_color: "#047857"
      },
      {
        name: "Enterprise",
        slug: "enterprise",
        description: "Loja Online Premium com personalização completa",
        price: 199.90,
        yearly_price: 1999.90,
        features: [
          "Produtos ilimitados",
          "Loja Online Premium",
          "Personalização completa de cores",
          "Banner personalizado",
          "Seções editáveis",
          "Redes sociais integradas",
          "Analytics avançado",
          "Suporte prioritário 24/7"
        ],
        product_limit: 9999,
        featured: false,
        active: true,
        badge_text: "PREMIUM",
        badge_color: "#7C3AED"
      }
    ];

    try {
      await Plan.bulkCreate(defaultPlans);
    } catch (error) {
      console.error("Erro ao criar planos padrão:", error);
    }
  };

  const handleAddPlan = () => {
    setFormData({
      name: "",
      slug: "standard",
      description: "",
      price: 0,
      yearly_price: 0,
      features: [],
      product_limit: 10,
      featured: false,
      active: true,
      badge_text: "",
      badge_color: "#4F46E5"
    });
    setShowAddDialog(true);
  };

  const handleEditPlan = (plan) => {
    setCurrentPlan(plan);
    // Extrair slug do ID (remover prefixo "plan-" se existir)
    let slug = plan.slug;
    if (!slug && plan.id) {
      slug = plan.id.replace(/^plan-/, '');
    }
    setFormData({
      name: plan.name,
      slug: slug || "standard",
      description: plan.description || "",
      price: plan.price,
      yearly_price: plan.yearly_price || plan.price * 10,
      features: plan.features || [],
      product_limit: plan.product_limit,
      featured: plan.featured || false,
      active: plan.active !== false,
      badge_text: plan.badge_text || "",
      badge_color: plan.badge_color || "#4F46E5"
    });
    setShowEditDialog(true);
  };

  const handleDeletePlan = (plan) => {
    setCurrentPlan(plan);
    setShowDeleteDialog(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const savePlan = async () => {
    try {
      if (currentPlan) {
        await Plan.update(currentPlan.id, formData);
      } else {
        await Plan.create(formData);
      }
      loadPlans();
      setShowAddDialog(false);
      setShowEditDialog(false);
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
    }
  };

  const deletePlan = async () => {
    try {
      await Plan.delete(currentPlan.id);
      loadPlans();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Gerenciamento de Planos</h1>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const PlanForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Plano</Label>
          <Input 
            id="name" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: Plano Standard"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Identificador</Label>
          <Input 
            id="slug" 
            value={formData.slug}
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
            placeholder="Ex: free, standard, premium, enterprise"
          />
          <p className="text-xs text-gray-500">
            Identificador único do plano (usado internamente)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea 
          id="description" 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descreva as características deste plano"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço Mensal (R$)</Label>
          <Input 
            id="price" 
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
            placeholder="0.00"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="yearly_price">Preço Anual (R$)</Label>
          <Input 
            id="yearly_price" 
            type="number"
            value={formData.yearly_price}
            onChange={(e) => setFormData({...formData, yearly_price: parseFloat(e.target.value)})}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_limit">Limite de Produtos</Label>
        <Input 
          id="product_limit" 
          type="number"
          value={formData.product_limit}
          onChange={(e) => setFormData({...formData, product_limit: parseInt(e.target.value)})}
          placeholder="10"
        />
      </div>

      <div className="space-y-4">
        <Label>Recursos do Plano</Label>
        
        <div className="flex gap-2">
          <Input 
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="Adicionar novo recurso"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <Button type="button" onClick={addFeature}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
          {formData.features.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-2">
              Nenhum recurso adicionado
            </p>
          ) : (
            formData.features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>{feature}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeFeature(index)}
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="badge_text">Texto do Badge</Label>
          <Input 
            id="badge_text" 
            value={formData.badge_text}
            onChange={(e) => setFormData({...formData, badge_text: e.target.value})}
            placeholder="Ex: POPULAR, RECOMENDADO"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="badge_color">Cor do Badge</Label>
          <div className="flex gap-2">
            <Input 
              id="badge_color" 
              value={formData.badge_color}
              onChange={(e) => setFormData({...formData, badge_color: e.target.value})}
              placeholder="#4F46E5"
            />
            <div 
              className="w-10 h-10 rounded-md border"
              style={{ backgroundColor: formData.badge_color }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="flex items-center space-x-2">
          <Switch 
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
          />
          <Label htmlFor="featured">Plano em Destaque</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({...formData, active: checked})}
          />
          <Label htmlFor="active">Plano Ativo</Label>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Planos</h1>
          <Button onClick={handleAddPlan}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen className="w-5 h-5" />
              Planos de Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Preço Mensal</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum plano encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{plan.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {plan.slug === "free" ? "Gratuito" : 
                           plan.slug === "standard" ? "Standard" : 
                           plan.slug === "premium" ? "Premium" :
                           plan.slug === "enterprise" ? "Enterprise" : plan.slug}
                        </Badge>
                        {plan.featured && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">
                            Destaque
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {plan.price === 0 ? (
                          <span className="text-green-600 font-medium">Grátis</span>
                        ) : (
                          <span>R$ {plan.price.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {plan.product_limit >= 9999 ? (
                          <span>Ilimitado</span>
                        ) : (
                          <span>{plan.product_limit} produtos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.active !== false ? "default" : "secondary"}>
                          {plan.active !== false ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePlan(plan)}
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

      {/* Diálogo de Adicionar Plano */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Plano</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo plano de assinatura.
            </DialogDescription>
          </DialogHeader>
          
          <PlanForm />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={savePlan}>
              Salvar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Editar Plano */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualize as informações do plano.
            </DialogDescription>
          </DialogHeader>
          
          <PlanForm />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={savePlan}>
              Atualizar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Excluir Plano */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O plano será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deletePlan} className="bg-red-600 hover:bg-red-700">
              Excluir Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}