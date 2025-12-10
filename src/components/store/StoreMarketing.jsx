
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Promotions } from "@/api/apiClient";
import { toast } from "@/components/ui/use-toast";
import { 
  Megaphone, 
  MessageSquare, 
  Share2, 
  Heart, 
  Gift, 
  Tag, 
  Copy, 
  CheckCircle, 
  Instagram,
  Facebook,
  Twitter,
  RefreshCcw,
  Trash2,
  Edit,
  Calendar,
  Clock
} from "lucide-react";

export default function StoreMarketing({ store = {}, products = [] }) {
  const [activeTab, setActiveTab] = useState("promos");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const [promoData, setPromoData] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    productId: "",
    startDate: "",
    startTime: "00:00",
    endDate: "",
    endTime: "23:59",
    active: true,
    appliesTo: "both" // "store", "marketplace", "both"
  });
  

  // Gerar URLs da loja
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nativo.com.br';
  const storeUrl = store?.id ? `${baseUrl}/store/${store.id}` : "";
  const customStoreUrl = store?.slug ? `${baseUrl}/${store.slug}` : null;
  const [copiedUrl, setCopiedUrl] = useState(null);

  const handleCopyUrl = (url) => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };
  
  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      // Validações
      if (!promoData.title.trim()) {
        throw new Error("O título da promoção é obrigatório");
      }
      
      if (promoData.discountType !== "free_shipping" && !promoData.discountValue) {
        throw new Error("O valor do desconto é obrigatório");
      }
      
      if (!promoData.startDate || !promoData.endDate) {
        throw new Error("As datas de início e término são obrigatórias");
      }
      
      if (new Date(promoData.startDate) >= new Date(promoData.endDate)) {
        throw new Error("A data de término deve ser posterior à data de início");
      }
      
      // Validar e converter discount_value
      let discountValue = null;
      if (promoData.discountType !== "free_shipping") {
        const parsed = parseFloat(promoData.discountValue);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error("O valor do desconto deve ser um número maior que zero");
        }
        discountValue = parsed;
      }
      
      const promotionData = {
        title: promoData.title.trim(),
        description: promoData.description || null,
        discount_type: promoData.discountType,
        discount_value: discountValue,
        product_id: promoData.productId && promoData.productId !== "all" ? promoData.productId : "all",
        start_date: `${promoData.startDate}T${promoData.startTime}:00`,
        end_date: `${promoData.endDate}T${promoData.endTime}:59`,
        show_timer: true, // Sempre ativo - regra oficial
        active: promoData.active === true || promoData.active === 1,
        applies_to: promoData.appliesTo || "both" // "store", "marketplace", "both"
      };

      console.log('📝 Dados da promoção sendo enviados:', promotionData);

      if (editingPromo) {
        // Atualizar promoção existente
        console.log('🔄 Atualizando promoção:', editingPromo.id);
        await Promotions.update(editingPromo.id, promotionData);
        toast({
          title: "Sucesso",
          description: "Promoção atualizada com sucesso!",
        });
      } else {
        // Criar nova promoção
        console.log('➕ Criando nova promoção');
        const created = await Promotions.create(promotionData);
        console.log('✅ Promoção criada:', created);
        toast({
          title: "Sucesso",
          description: "Promoção criada com sucesso!",
        });
      }
      
      setSuccess(true);
      
      // Limpar formulário e recarregar lista
      setTimeout(() => {
        setSuccess(false);
        setEditingPromo(null);
        setPromoData({
          title: "",
          description: "",
          discountType: "percentage",
          discountValue: "",
          productId: "",
          startDate: "",
          startTime: "00:00",
          endDate: "",
          endTime: "23:59",
          active: true,
          appliesTo: "both"
        });
        loadPromotions();
      }, 1000);
      
    } catch (error) {
      console.error("❌ Erro ao salvar promoção:", error);
      console.error("Detalhes do erro:", error.details || error.response?.data);
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = error.message || "Erro ao salvar promoção";
      
      if (error.details) {
        if (typeof error.details === 'string') {
          errorMessage = error.details;
        } else if (error.details.details) {
          errorMessage = error.details.details;
        } else if (error.details.error) {
          errorMessage = error.details.error;
        }
      } else if (error.response?.data) {
        if (error.response.data.details) {
          errorMessage = error.response.data.details;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handlePromoChange = (e) => {
    const { name, value } = e.target;
    setPromoData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setPromoData(prev => ({ ...prev, [name]: checked }));
  };

  // Carregar promoções
  const loadPromotions = async () => {
    try {
      setLoadingPromotions(true);
      console.log('📋 Carregando promoções...');
      const data = await Promotions.list();
      console.log('✅ Promoções carregadas:', data);
      
      // Garantir que é um array
      if (Array.isArray(data)) {
        setPromotions(data);
      } else if (data && Array.isArray(data.data)) {
        // Se vier com paginação
        setPromotions(data.data);
      } else {
        setPromotions([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar promoções:', error);
      setPromotions([]);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar promoções",
        variant: "destructive"
      });
    } finally {
      setLoadingPromotions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "promos") {
      loadPromotions();
    }
  }, [activeTab, store.id]);

  // Editar promoção
  const handleEditPromo = (promo) => {
    setEditingPromo(promo);
    const startDateTime = promo.start_date ? new Date(promo.start_date) : new Date();
    const endDateTime = promo.end_date ? new Date(promo.end_date) : new Date();
    
    // Extrair hora no formato HH:MM
    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    setPromoData({
      title: promo.title || "",
      description: promo.description || "",
      discountType: promo.discount_type || "percentage",
      discountValue: promo.discount_value?.toString() || "",
      productId: promo.product_id && promo.product_id !== "all" ? promo.product_id : "",
      startDate: promo.start_date ? promo.start_date.split('T')[0] : "",
      startTime: formatTime(startDateTime),
      endDate: promo.end_date ? promo.end_date.split('T')[0] : "",
      endTime: formatTime(endDateTime),
      active: promo.active !== false,
      appliesTo: promo.applies_to || "both"
    });
  };

  // Deletar promoção
  const handleDeletePromo = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta promoção?')) {
      return;
    }

    try {
      await Promotions.delete(id);
      toast({
        title: "Sucesso",
        description: "Promoção deletada com sucesso!",
      });
      loadPromotions();
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar promoção",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {activeTab === "promos" ? "Promoção criada com sucesso!" : "Mensagem enviada com sucesso!"}
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="promos" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Promoções
          </TabsTrigger>
          <TabsTrigger value="share" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </TabsTrigger>
        </TabsList>
        
        {/* Aba de Promoções */}
        <TabsContent value="promos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{editingPromo ? "Editar Promoção" : "Criar Promoção"}</CardTitle>
                  <CardDescription>
                    {editingPromo ? "Edite os dados da promoção" : "Crie e gerencie promoções para seus produtos"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePromoSubmit}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Título da Promoção</Label>
                          <Input 
                            id="title" 
                            name="title"
                            value={promoData.title}
                            onChange={handlePromoChange}
                            placeholder="Ex: Oferta Especial de Verão"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea 
                            id="description" 
                            name="description"
                            value={promoData.description}
                            onChange={handlePromoChange}
                            placeholder="Descreva os detalhes da sua promoção"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discountType">Tipo de Desconto</Label>
                          <Select 
                            value={promoData.discountType}
                            onValueChange={(value) => setPromoData(prev => ({ ...prev, discountType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                              <SelectItem value="free_shipping">Frete Grátis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {promoData.discountType !== "free_shipping" && (
                          <div className="space-y-2">
                            <Label htmlFor="discountValue">Valor do Desconto</Label>
                            <Input
                              id="discountValue"
                              name="discountValue"
                              type="number"
                              value={promoData.discountValue}
                              onChange={handlePromoChange}
                              placeholder={promoData.discountType === "percentage" ? "Ex: 15" : "Ex: 50.00"}
                              required
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="productId">Aplicar a</Label>
                        <Select 
                          value={promoData.productId}
                          onValueChange={(value) => setPromoData(prev => ({ ...prev, productId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os produtos</SelectItem>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="appliesTo">Onde vale esta promoção</Label>
                        <Select 
                          value={promoData.appliesTo}
                          onValueChange={(value) => setPromoData(prev => ({ ...prev, appliesTo: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione onde vale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="store">Minha Loja</SelectItem>
                            <SelectItem value="marketplace">Nativo (Marketplace)</SelectItem>
                            <SelectItem value="both">Ambos (Minha Loja e Nativo)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500">
                          {promoData.appliesTo === "store" && "A promoção será exibida apenas na sua loja online"}
                          {promoData.appliesTo === "marketplace" && "A promoção será exibida apenas no marketplace NATIVO"}
                          {promoData.appliesTo === "both" && "A promoção será exibida tanto na sua loja quanto no marketplace NATIVO"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Data de Início</Label>
                          <Input
                            id="startDate"
                            name="startDate"
                            type="date"
                            value={promoData.startDate}
                            onChange={handlePromoChange}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Hora de Início</Label>
                          <Input
                            id="startTime"
                            name="startTime"
                            type="time"
                            value={promoData.startTime}
                            onChange={handlePromoChange}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="endDate">Data de Término</Label>
                          <Input
                            id="endDate"
                            name="endDate"
                            type="date"
                            value={promoData.endDate}
                            onChange={handlePromoChange}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="endTime">Hora de Término</Label>
                          <Input
                            id="endTime"
                            name="endTime"
                            type="time"
                            value={promoData.endTime}
                            onChange={handlePromoChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="active">Ativar Promoção</Label>
                          <p className="text-sm text-gray-500">
                            A promoção será aplicada automaticamente na data de início
                          </p>
                        </div>
                        <Switch
                          id="active"
                          checked={promoData.active}
                          onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            {editingPromo ? "Salvando..." : "Criando..."}
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            {editingPromo ? "Salvar Alterações" : "Criar Promoção"}
                          </>
                        )}
                      </Button>
                      {editingPromo && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingPromo(null);
                            setPromoData({
                              title: "",
                              description: "",
                              discountType: "percentage",
                              discountValue: "",
                              productId: "",
                              startDate: "",
                              startTime: "00:00",
                              endDate: "",
                              endTime: "23:59",
                              active: true
                            });
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Promoções */}
              <Card>
                <CardHeader>
                  <CardTitle>Promoções Criadas</CardTitle>
                  <CardDescription>
                    Gerencie suas promoções ativas e futuras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPromotions ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma promoção criada ainda</p>
                      <p className="text-sm">Crie sua primeira promoção acima</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {promotions.map((promo) => {
                        const isActive = promo.active && new Date(promo.start_date) <= new Date() && new Date(promo.end_date) >= new Date();
                        const isUpcoming = new Date(promo.start_date) > new Date();
                        const isExpired = new Date(promo.end_date) < new Date();
                        
                        return (
                          <div key={promo.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{promo.title}</h3>
                                  {isActive && (
                                    <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                                  )}
                                  {isUpcoming && (
                                    <Badge className="bg-blue-100 text-blue-800">Futura</Badge>
                                  )}
                                  {isExpired && (
                                    <Badge className="bg-gray-100 text-gray-800">Expirada</Badge>
                                  )}
                                  {!promo.active && (
                                    <Badge className="bg-red-100 text-red-800">Inativa</Badge>
                                  )}
                                </div>
                                
                                {promo.description && (
                                  <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Tag className="w-4 h-4" />
                                    {promo.discount_type === "percentage" && `${promo.discount_value}% OFF`}
                                    {promo.discount_type === "fixed" && `R$ ${Number(promo.discount_value).toFixed(2).replace('.', ',')} OFF`}
                                    {promo.discount_type === "free_shipping" && "Frete Grátis"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(promo.start_date).toLocaleDateString('pt-BR', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric' 
                                    })} - {new Date(promo.end_date).toLocaleDateString('pt-BR', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric' 
                                    })}
                                  </div>
                                  {promo.product_name ? (
                                    <div className="flex items-center gap-1">
                                      <Gift className="w-4 h-4" />
                                      {promo.product_name}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Gift className="w-4 h-4" />
                                      Todos os produtos
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-blue-600 font-medium">Temporizador ativo</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Megaphone className="w-4 h-4" />
                                    <span className="font-medium text-blue-600">
                                      {promo.applies_to === "store" && "Válida apenas na Minha Loja"}
                                      {promo.applies_to === "marketplace" && "Válida apenas no Nativo"}
                                      {(promo.applies_to === "both" || !promo.applies_to) && "Válida em Minha Loja e Nativo"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPromo(promo)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePromo(promo.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Benefícios das Promoções</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Aumenta o interesse</h3>
                      <p className="text-sm text-gray-600">
                        Descontos atraem mais visualizações e melhoram a conversão
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <RefreshCcw className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Fideliza clientes</h3>
                      <p className="text-sm text-gray-600">
                        Clientes que aproveitam promoções tendem a voltar
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Heart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Aumenta o valor da venda</h3>
                      <p className="text-sm text-gray-600">
                        Promoções incentivam a compra de mais produtos de uma vez
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t p-4">
                  <p className="text-sm text-gray-600">
                    Recomendamos fazer promoções sazonais (Black Friday, Natal) e 
                    em datas especiais para sua loja.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Aba de Compartilhamento */}
        <TabsContent value="share">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compartilhar sua Loja</CardTitle>
                <CardDescription>
                  Divulgue sua loja nas redes sociais e outros canais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Link Personalizado (se disponível) */}
                {customStoreUrl && (
                  <div className="space-y-2">
                    <Label>Link Personalizado da sua loja</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Link curto e personalizado para compartilhar
                    </p>
                    <div className="flex">
                      <Input 
                        value={customStoreUrl}
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button 
                        type="button" 
                        onClick={() => handleCopyUrl(customStoreUrl)}
                        className="rounded-l-none"
                        variant={copiedUrl === customStoreUrl ? "success" : "default"}
                      >
                        {copiedUrl === customStoreUrl ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Link Padrão */}
                <div className="space-y-2">
                  <Label>Link da sua loja</Label>
                  {customStoreUrl && (
                    <p className="text-sm text-gray-500 mb-2">
                      Link padrão (sempre disponível)
                    </p>
                  )}
                  <div className="flex">
                    <Input 
                      value={storeUrl}
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button 
                      type="button" 
                      onClick={() => handleCopyUrl(storeUrl)}
                      className="rounded-l-none"
                      variant={copiedUrl === storeUrl ? "success" : "default"}
                    >
                      {copiedUrl === storeUrl ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Label className="mb-3 block">Compartilhar nas redes sociais</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </Button>
                    <Button className="bg-pink-600 hover:bg-pink-700">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </Button>
                    <Button className="bg-sky-500 hover:bg-sky-600">
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Label className="mb-3 block">QR Code da sua Loja</Label>
                  <div className="space-y-4">
                    {/* QR Code do link personalizado (se disponível) */}
                    {customStoreUrl && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Link Personalizado</p>
                        <div className="bg-white p-4 border rounded-lg inline-block">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(customStoreUrl)}`}
                            alt="QR Code do Link Personalizado"
                            className="w-32 h-32"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          QR Code do link personalizado: {customStoreUrl}
                        </p>
                      </div>
                    )}
                    
                    {/* QR Code do link padrão */}
                    <div>
                      {customStoreUrl && (
                        <p className="text-sm font-medium text-gray-700 mb-2">Link Padrão</p>
                      )}
                      <div className="bg-white p-4 border rounded-lg inline-block">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(storeUrl)}`}
                          alt="QR Code da Loja"
                          className="w-32 h-32"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {customStoreUrl 
                          ? `QR Code do link padrão: ${storeUrl}`
                          : `Baixe este QR Code e use em seus materiais impressos, cartões de visita, banners, etc.`
                        }
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-2">
                    Baixar QR Code{customStoreUrl ? 's' : ''}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Dicas de Marketing</CardTitle>
                <CardDescription>
                  Estratégias para promover sua loja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Redes Sociais</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    As redes sociais são essenciais para divulgar sua loja e produtos. 
                    Algumas dicas:
                  </p>
                  <ul className="space-y-2 text-sm text-blue-700 list-disc pl-5">
                    <li>Poste regularmente fotos dos seus produtos</li>
                    <li>Use hashtags relacionadas ao seu nicho</li>
                    <li>Interaja com seus seguidores</li>
                    <li>Faça parcerias com influenciadores locais</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Grupos e Comunidades</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Participe de grupos relacionados ao seu segmento:
                  </p>
                  <ul className="space-y-2 text-sm text-green-700 list-disc pl-5">
                    <li>Grupos de Facebook da sua cidade</li>
                    <li>Comunidades de WhatsApp</li>
                    <li>Fóruns online do seu segmento</li>
                    <li>Eventos presenciais e feiras</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-800 mb-2">Marketing de Conteúdo</h3>
                  <p className="text-sm text-purple-700 mb-3">
                    Crie conteúdo útil para atrair clientes:
                  </p>
                  <ul className="space-y-2 text-sm text-purple-700 list-disc pl-5">
                    <li>Dicas sobre como usar seus produtos</li>
                    <li>Histórias sobre a criação dos produtos</li>
                    <li>Casos de sucesso e depoimentos</li>
                    <li>Tutoriais e demonstrações em vídeo</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
