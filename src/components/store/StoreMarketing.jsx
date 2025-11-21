
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
  Send, 
  Copy, 
  CheckCircle, 
  AlertCircle,
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
  const [copied, setCopied] = useState(false);
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
    showTimer: false,
    active: true
  });
  
  const [messageData, setMessageData] = useState({
    title: "Novidades da nossa loja",
    message: "Olá! Temos novos produtos que podem te interessar. Confira em nossa loja NATIVO.",
    audience: "all",
    includeImage: true,
    selectedProducts: [], // Novo campo para produtos selecionados
    messageType: "promotional" // Novo campo para tipo de mensagem
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [estimatedReach, setEstimatedReach] = useState(0);

  const storeUrl = store?.id ? `https://nativo.com.br/store/${store.id}` : "";

  const handleCopyUrl = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      
      const promotionData = {
        title: promoData.title.trim(),
        description: promoData.description || null,
        discount_type: promoData.discountType,
        discount_value: promoData.discountType !== "free_shipping" ? parseFloat(promoData.discountValue) : null,
        product_id: promoData.productId && promoData.productId !== "all" ? promoData.productId : "all",
        start_date: `${promoData.startDate}T${promoData.startTime}:00`,
        end_date: `${promoData.endDate}T${promoData.endTime}:59`,
        show_timer: promoData.showTimer || false,
        active: promoData.active
      };

      if (editingPromo) {
        // Atualizar promoção existente
        await Promotions.update(editingPromo.id, promotionData);
        toast({
          title: "Sucesso",
          description: "Promoção atualizada com sucesso!",
        });
      } else {
        // Criar nova promoção
        await Promotions.create(promotionData);
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
          showTimer: false,
          active: true
        });
        loadPromotions();
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao salvar promoção:", error);
      setError(error.message || "Erro ao salvar promoção");
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar promoção",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      // Validações
      if (!messageData.title.trim() || !messageData.message.trim()) {
        throw new Error("Preencha o título e a mensagem");
      }

      if (messageData.message.length > 500) {
        throw new Error("A mensagem deve ter no máximo 500 caracteres");
      }

      // Calcula o público estimado
      let estimatedAudience = 0;
      switch (messageData.audience) {
        case "all":
          estimatedAudience = store.total_followers || 0;
          break;
        case "favorites":
          estimatedAudience = store.total_favorites || 0;
          break;
        case "contacted":
          estimatedAudience = store.total_messages || 0;
          break;
        case "recent":
          estimatedAudience = Math.floor((store.total_views || 0) * 0.1); // 10% dos visitantes recentes
          break;
      }

      // Simula o envio (aqui você implementaria a integração real)
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessageData({
          title: "",
          message: "",
          audience: "all",
          includeImage: true,
          selectedProducts: [],
          messageType: "promotional"
        });
      }, 3000);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setError(error.message);
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
  
  const handleMessageChange = (e) => {
    const { name, value } = e.target;
    setMessageData(prev => ({ ...prev, [name]: value }));
  };

  // Carregar promoções
  const loadPromotions = async () => {
    try {
      setLoadingPromotions(true);
      const data = await Promotions.list();
      setPromotions(data || []);
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
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
      showTimer: promo.show_timer === true || promo.show_timer === 1,
      active: promo.active !== false
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
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Mensagens
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
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="space-y-0.5">
                          <Label htmlFor="showTimer">Exibir Temporizador de Oferta</Label>
                          <p className="text-sm text-gray-500">
                            Mostra um contador regressivo nos produtos com esta promoção
                          </p>
                        </div>
                        <Switch
                          id="showTimer"
                          checked={promoData.showTimer}
                          onCheckedChange={(checked) => handleSwitchChange("showTimer", checked)}
                        />
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
                              endDate: "",
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
                                    {promo.discount_type === "fixed" && `R$ ${promo.discount_value} OFF`}
                                    {promo.discount_type === "free_shipping" && "Frete Grátis"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(promo.start_date).toLocaleDateString('pt-BR')} - {new Date(promo.end_date).toLocaleDateString('pt-BR')}
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
        
        {/* Aba de Mensagens */}
        <TabsContent value="messaging">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens em Massa</CardTitle>
              <CardDescription>
                Envie mensagens para clientes que já interagiram com sua loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMessageSubmit}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Tipo de Mensagem</Label>
                    <Select 
                      value={messageData.messageType}
                      onValueChange={(value) => setMessageData(prev => ({ ...prev, messageType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">Promoção</SelectItem>
                        <SelectItem value="news">Novidades</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                        <SelectItem value="announcement">Comunicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Mensagem</Label>
                    <Input 
                      id="title" 
                      name="title"
                      value={messageData.title}
                      onChange={handleMessageChange}
                      placeholder="Título que aparecerá na notificação"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      value={messageData.message}
                      onChange={handleMessageChange}
                      placeholder="O conteúdo da sua mensagem para os clientes"
                      rows={4}
                      required
                    />
                    <p className="text-sm text-gray-500">
                      {messageData.message.length}/500 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="products">Produto Relacionado (opcional)</Label>
                    <Select 
                      value={messageData.selectedProducts?.[0] || "none"}
                      onValueChange={(value) => setMessageData(prev => ({ 
                        ...prev, 
                        selectedProducts: value && value !== "none" ? [value] : []
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto para destacar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum produto</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      O produto selecionado aparecerá junto com a mensagem
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="audience">Público-alvo</Label>
                    <Select 
                      value={messageData.audience}
                      onValueChange={(value) => {
                        setMessageData(prev => ({ ...prev, audience: value }));
                        // Atualiza alcance estimado
                        let reach = 0;
                        switch (value) {
                          case "all":
                            reach = store.total_followers || 0;
                            break;
                          case "favorites":
                            reach = store.total_favorites || 0;
                            break;
                          case "contacted":
                            reach = store.total_messages || 0;
                            break;
                          case "recent":
                            reach = Math.floor((store.total_views || 0) * 0.1);
                            break;
                        }
                        setEstimatedReach(reach);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o público" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os seguidores</SelectItem>
                        <SelectItem value="favorites">Quem favoritou seus produtos</SelectItem>
                        <SelectItem value="contacted">Quem já entrou em contato</SelectItem>
                        <SelectItem value="recent">Visitantes recentes (7 dias)</SelectItem>
                      </SelectContent>
                    </Select>
                    {estimatedReach > 0 && (
                      <p className="text-sm text-blue-600">
                        Alcance estimado: {estimatedReach} pessoas
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeImage">Incluir imagem da loja</Label>
                      <p className="text-sm text-gray-500">
                        Adiciona o logo da sua loja na mensagem
                      </p>
                    </div>
                    <Switch
                      id="includeImage"
                      checked={messageData.includeImage}
                      onCheckedChange={(checked) => setMessageData(prev => ({ ...prev, includeImage: checked }))}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Dicas para Mensagens Efetivas</h3>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Seja direto e específico no seu comunicado
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Inclua uma chamada para ação clara
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Personalize a mensagem para o público selecionado
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Evite usar muitos emojis ou caracteres especiais
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </div>
              </form>
              
              <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
                <h3 className="flex items-center gap-2 text-amber-800 font-medium">
                  <AlertCircle className="w-5 h-5" />
                  Importante
                </h3>
                <p className="text-sm text-amber-700 mt-2">
                  Use este recurso com moderação. Enviar muitas mensagens pode 
                  ser considerado spam e afastar clientes. Recomendamos no máximo 
                  uma mensagem por semana.
                </p>
              </div>
            </CardContent>
          </Card>
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
                <div className="space-y-2">
                  <Label>Link da sua loja</Label>
                  <div className="flex">
                    <Input 
                      value={storeUrl}
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button 
                      type="button" 
                      onClick={handleCopyUrl}
                      className="rounded-l-none"
                      variant={copied ? "success" : "default"}
                    >
                      {copied ? (
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
                  <div className="bg-white p-4 border rounded-lg inline-block">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(storeUrl)}`}
                      alt="QR Code da Loja"
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Baixe este QR Code e use em seus materiais impressos, 
                    cartões de visita, banners, etc.
                  </p>
                  <Button variant="outline" className="mt-2">
                    Baixar QR Code
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
