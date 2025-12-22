
import React, { useState, useEffect } from "react";
import { Store } from "@/api/entities";
import { City } from "@/api/entities";
import { Plan } from "@/api/entities";
import { MercadoPago } from "@/api/apiClient";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UploadFile } from "@/api/integrations";
import { 
  AlertCircle, 
  CheckCircle, 
  Store as StoreIcon, 
  Camera, 
  Phone,
  Mail,
  Edit2,
  MapPin,
  Info,
  Link2,
  Unlink
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "@/components/ui/use-toast";

export default function StoreSettings({ store, user, subscription, plan, onUpdate }) {
  const [cities, setCities] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mercadopagoConnecting, setMercadopagoConnecting] = useState(false);
  const [mercadopagoAccessToken, setMercadopagoAccessToken] = useState("");
  const [mercadopagoPublicKey, setMercadopagoPublicKey] = useState("");
  const [paymentMethods, setPaymentMethods] = useState(['whatsapp']); // Métodos aceitos: ['whatsapp', 'mercadopago']
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false);
  
  // Debug: verificar props recebidas
  useEffect(() => {
    console.log("StoreSettings - Props recebidas:", {
      store: store ? { id: store.id, name: store.name } : null,
      hasOnUpdate: !!onUpdate,
      user: user ? { id: user.id, email: user.email } : null
    });
  }, [store, onUpdate, user]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    description: "",
    city_id: "",
    logo: "",
    banner: "",
    autoReply: true,
    showWhatsapp: true,
    checkout_enabled: false,
    installments_enabled: false,
    // Campos de pagamento
    pix_key: "",
    payment_link: "",
    payment_instructions: "",
    // Campos de frete
    shipping_fixed_price: "",
    shipping_calculate_on_whatsapp: false,
    shipping_free_threshold: "",
    storeId: null
  });

  const logoInputRef = React.useRef(null);
  const bannerInputRef = React.useRef(null);
  const initializedStoreIdRef = React.useRef(null); // Para rastrear qual loja foi inicializada

  useEffect(() => {
    if (store && store.id) {
      console.log("=== Carregando dados da loja no formulário ===");
      console.log("store.id:", store.id);
      console.log("store.city_id:", store.city_id);
      console.log("store.city_name:", store.city_name);
      console.log("formData atual - city_id:", formData.city_id);
      console.log("initializedStoreIdRef.current:", initializedStoreIdRef.current);
      
      // Só atualizar se o formData ainda não foi inicializado ou se a loja mudou
      if (initializedStoreIdRef.current === store.id) {
        console.log("Preservando formData existente - loja já foi inicializada");
        console.log("Mantendo city_id atual:", formData.city_id);
        return; // Não fazer nada, preservar o formData atual
      }
      
      console.log("Inicializando formData com dados da loja");
      initializedStoreIdRef.current = store.id; // Marcar como inicializado
      
      setFormData({
        name: store.name || "",
        email: store.email || "",
        whatsapp: store.whatsapp || "",
        description: store.description || "",
        city_id: store.city_id || "",
        logo: store.logo || "",
        banner: store.banner || "",
        autoReply: store.autoReply !== false,
        showWhatsapp: store.showWhatsapp !== false,
        checkout_enabled: store.checkout_enabled === true || store.checkout_enabled === 1,
        installments_enabled: store.installments_enabled === true || store.installments_enabled === 1,
        // Campos de pagamento
        pix_key: store.pix_key || "",
        payment_link: store.payment_link || "",
        payment_instructions: store.payment_instructions || "",
        // Campos de frete
        shipping_fixed_price: store.shipping_fixed_price || "",
        shipping_calculate_on_whatsapp: store.shipping_calculate_on_whatsapp === true || store.shipping_calculate_on_whatsapp === 1,
        shipping_free_threshold: store.shipping_free_threshold || "",
        storeId: store.id
      });
      
      // Carregar métodos de pagamento
      if (store.payment_methods) {
        try {
          const methods = typeof store.payment_methods === 'string' 
            ? JSON.parse(store.payment_methods) 
            : store.payment_methods;
          setPaymentMethods(Array.isArray(methods) && methods.length > 0 ? methods : ['whatsapp']);
        } catch (e) {
          setPaymentMethods(['whatsapp']);
        }
      } else {
        setPaymentMethods(['whatsapp']); // Default
      }
      
      console.log("formData.city_id definido como:", store.city_id || "");
    }
    
    loadCities();
    loadPlans();
  }, [store?.id]); // Só recarregar se o ID da loja mudar

  const loadCities = async () => {
    try {
      const citiesData = await City.list();
      console.log("Cidades carregadas:", citiesData?.length || 0);
      console.log("Exemplo de cidade:", citiesData?.[0]);
      setCities(citiesData || []);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
      setError("Erro ao carregar lista de cidades. Tente recarregar a página.");
    }
  };

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const plansData = await Plan.list();
      // Filtrar apenas planos ativos e ordenar por preço
      const activePlans = (plansData || [])
        .filter(p => p.active === true || p.active === 1)
        .sort((a, b) => (a.price || 0) - (b.price || 0));
      setAllPlans(activePlans);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      setAllPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    console.log(`=== Atualizando ${name} ===`);
    console.log("Valor recebido:", value);
    console.log("Tipo:", typeof value);
    
    // Se for "none", converter para string vazia (que será convertida para null no submit)
    // Caso contrário, manter o valor (que é o ID da cidade)
    const finalValue = value === "none" || value === "" ? "" : String(value);
    console.log("Valor final a ser salvo:", finalValue);
    
    setFormData(prev => {
      const newData = { 
        ...prev, 
        [name]: finalValue,
        storeId: prev.storeId || store?.id // Garantir que storeId seja mantido
      };
      console.log("Novo formData após handleSelectChange:", newData);
      console.log("city_id no novo formData:", newData.city_id);
      console.log("storeId no novo formData:", newData.storeId);
      return newData;
    });
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Salvar métodos de pagamento
  const handleSavePaymentMethods = async () => {
    if (!store || !store.id) {
      toast({
        title: "Erro",
        description: "Loja não encontrada",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethods.length === 0) {
      toast({
        title: "Erro",
        description: "Pelo menos um método de pagamento deve estar ativo",
        variant: "destructive",
      });
      return;
    }

    setSavingPaymentMethods(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/stores/${store.id}/payment-methods`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          payment_methods: paymentMethods,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar métodos de pagamento');
      }

      const updatedStore = await response.json();
      
      toast({
        title: "Sucesso!",
        description: "Métodos de pagamento atualizados com sucesso!",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao salvar métodos de pagamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar métodos de pagamento",
        variant: "destructive",
      });
    } finally {
      setSavingPaymentMethods(false);
    }
  };

  // Toggle método de pagamento
  const togglePaymentMethod = (method) => {
    setPaymentMethods(prev => {
      if (prev.includes(method)) {
        // Se está ativo e é o último método, não permitir desativar
        if (prev.length === 1) {
          toast({
            title: "Atenção",
            description: "Pelo menos um método de pagamento deve estar ativo",
            variant: "default",
          });
          return prev;
        }
        return prev.filter(m => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    setError("");
    
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, logo: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload do logo:", error);
      setError("Erro ao fazer upload do logo. Tente novamente.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingBanner(true);
    setError("");
    
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, banner: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload do banner:", error);
      setError("Erro ao fazer upload do banner. Tente novamente.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
    e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("=== handleSubmit chamado ===");
    console.log("formData:", formData);
    console.log("store:", store);
    
    if (!formData.name || !formData.whatsapp) {
      console.log("Validação falhou - campos obrigatórios");
      setError("Nome e WhatsApp são campos obrigatórios.");
      return;
    }
    
    if (!store || !store.id) {
      console.error("Store ou store.id não encontrado");
      setError("Erro: Loja não encontrada. Recarregue a página.");
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      // Preparar dados para envio - remover campos vazios e converter para null quando necessário
      console.log("=== Preparando dados para envio ===");
      console.log("formData.city_id original:", formData.city_id);
      console.log("Tipo de city_id:", typeof formData.city_id);
      
      // Processar city_id: converter string vazia, "none" ou valores inválidos para null
      // Mas manter o valor se for um UUID válido
      let cityIdValue = null;
      if (formData.city_id && 
          formData.city_id !== "" && 
          formData.city_id !== "none" && 
          formData.city_id !== null &&
          formData.city_id !== undefined) {
        // Verificar se é um UUID válido (formato básico)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cityIdStr = String(formData.city_id).trim();
        if (uuidRegex.test(cityIdStr)) {
          cityIdValue = cityIdStr;
        } else {
          console.warn("city_id não é um UUID válido:", formData.city_id);
          cityIdValue = null;
        }
      }
      
      console.log("city_id processado:", cityIdValue);
      
      const updateData = {
        name: formData.name.trim(),
        whatsapp: formData.whatsapp.trim(),
        description: formData.description?.trim() || null,
        // Campos de pagamento
        pix_key: formData.pix_key?.trim() || null,
        payment_link: formData.payment_link?.trim() || null,
        payment_instructions: formData.payment_instructions?.trim() || null,
        // Campos de frete
        shipping_fixed_price: formData.shipping_fixed_price ? parseFloat(formData.shipping_fixed_price) : null,
        shipping_calculate_on_whatsapp: formData.shipping_calculate_on_whatsapp || false,
        shipping_free_threshold: formData.shipping_free_threshold ? parseFloat(formData.shipping_free_threshold) : null,
        city_id: cityIdValue, // Pode ser null ou UUID válido
        logo: formData.logo || null,
        checkout_enabled: formData.checkout_enabled || false,
        installments_enabled: formData.installments_enabled || false,
        // banner não existe na tabela stores, apenas em store_customizations
        // Remover campos que não existem na tabela stores
        // email, autoReply, showWhatsapp, banner não são campos da tabela stores
      };
      
      // Remover campos que não devem ser enviados ao backend
      // Remover campos undefined para não enviar (mas manter null para city_id se necessário)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
        // Remover campos que não existem na tabela stores
        if (['storeId', 'email', 'autoReply', 'showWhatsapp', 'banner'].includes(key)) {
          delete updateData[key];
        }
      });
      
      // Garantir que city_id seja sempre enviado (mesmo que seja null) se foi alterado
      if ('city_id' in formData) {
        updateData.city_id = cityIdValue; // Pode ser null ou UUID válido
      }
      
      // Verificar se há pelo menos um campo para atualizar (além de updated_at)
      const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'storeId');
      if (fieldsToUpdate.length === 0) {
        setError("Nenhuma alteração foi feita.");
        setSaving(false);
        return;
      }
      
      console.log("Dados preparados para atualização:", updateData);
      console.log("Campos a atualizar:", fieldsToUpdate);
      console.log("city_id específico:", updateData.city_id);
      console.log("Tipo de city_id:", typeof updateData.city_id);
      
      console.log("Enviando dados para atualização:", updateData);
      console.log("Store ID:", store.id);
      
      const updatedStore = await Store.update(store.id, updateData);
      console.log("Resposta do servidor:", updatedStore);
      console.log("Loja atualizada com sucesso:", updatedStore);
      
      if (!updatedStore) {
        throw new Error("Resposta vazia do servidor. Verifique se o backend está funcionando.");
      }
      
      setSuccess("Informações da loja atualizadas com sucesso!");
      
      // Mostrar toast de sucesso
      toast({
        title: "Sucesso!",
        description: "Informações da loja atualizadas com sucesso!",
      });
      
      // Atualizar formData com os dados retornados do servidor ANTES de chamar onUpdate
      // Isso evita que o useEffect resete o valor antes de receber os dados atualizados
      if (updatedStore) {
        console.log("=== Atualizando formData com dados do servidor ===");
        console.log("updatedStore.city_id:", updatedStore.city_id);
        console.log("updatedStore completo:", updatedStore);
        
        // Atualizar formData com os dados retornados do servidor
        setFormData(prev => {
          const newData = {
            ...prev,
            name: updatedStore.name || prev.name,
            whatsapp: updatedStore.whatsapp || prev.whatsapp,
            description: updatedStore.description || prev.description,
            city_id: updatedStore.city_id || prev.city_id || "",
            logo: updatedStore.logo || prev.logo,
            // Campos de pagamento
            pix_key: updatedStore.pix_key || prev.pix_key || "",
            payment_link: updatedStore.payment_link || prev.payment_link || "",
            payment_instructions: updatedStore.payment_instructions || prev.payment_instructions || "",
            // Campos de frete
            shipping_fixed_price: updatedStore.shipping_fixed_price || prev.shipping_fixed_price || "",
            shipping_calculate_on_whatsapp: updatedStore.shipping_calculate_on_whatsapp === true || updatedStore.shipping_calculate_on_whatsapp === 1 || prev.shipping_calculate_on_whatsapp,
            shipping_free_threshold: updatedStore.shipping_free_threshold || prev.shipping_free_threshold || "",
            checkout_enabled: updatedStore.checkout_enabled === true || updatedStore.checkout_enabled === 1 || prev.checkout_enabled,
            storeId: updatedStore.id
          };
          console.log("Novo formData após atualização:", newData);
          console.log("city_id no novo formData:", newData.city_id);
          console.log("checkout_enabled no novo formData:", newData.checkout_enabled);
          
          // Atualizar o ref para evitar que o useEffect resete
          if (updatedStore.id) {
            initializedStoreIdRef.current = updatedStore.id;
          }
          
          return newData;
        });
      }
      
      // Atualizar a store local com os dados retornados para evitar recarregar
      // Isso evita que o useEffect resete o formData
      if (onUpdate) {
        console.log("Chamando onUpdate para recarregar dados...");
        // Aguardar um pouco para garantir que formData foi atualizado
        await new Promise(resolve => setTimeout(resolve, 200));
        await onUpdate(); // Aguardar atualização para recarregar dados
      }
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao atualizar loja:", error);
      console.error("Erro completo:", {
        message: error.message,
        status: error.status,
        details: error.details,
        stack: error.stack
      });
      
      let errorMessage = "Erro ao atualizar informações da loja. Tente novamente.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.status) {
        errorMessage = `Erro ${error.status}: ${error.statusText || 'Erro ao salvar'}`;
      }
      
      setError(errorMessage);
      
      // Mostrar toast de erro também
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensagens de erro/sucesso movidas para próximo ao botão */}
      
      <Card>
        <CardHeader>
          <CardTitle>Seu Plano</CardTitle>
          <CardDescription>
            Detalhes do seu plano atual e opções de upgrade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg text-blue-900">
                  {plan?.name || "Plano Básico"}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {subscription?.status === "active" ? (
                    <>
                      Válido até {new Date(subscription.end_date).toLocaleDateString()}
                    </>
                  ) : (
                    "Aguardando confirmação de pagamento"
                  )}
                </p>
              </div>
              <Badge className={
                subscription?.status === "active" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }>
                {subscription?.status === "active" ? "Ativo" : "Pendente"}
              </Badge>
            </div>
          </div>

          {/* Status do Modo Loja Online */}
          <div className={`border rounded-lg p-4 ${
            (plan?.id === 'plan-enterprise' || plan?.slug === 'enterprise' || subscription?.plan?.slug === 'enterprise')
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  (plan?.id === 'plan-enterprise' || plan?.slug === 'enterprise' || subscription?.plan?.slug === 'enterprise')
                    ? 'bg-purple-100' 
                    : 'bg-gray-200'
                }`}>
                  <StoreIcon className={`w-5 h-5 ${
                    (plan?.id === 'plan-enterprise' || plan?.slug === 'enterprise' || subscription?.plan?.slug === 'enterprise')
                      ? 'text-purple-600' 
                      : 'text-gray-400'
                  }`} />
                </div>
          <div>
                  <h4 className="font-medium">
                    Modo Loja Online Premium
                  </h4>
                  <p className="text-sm text-gray-600">
                    {(plan?.id === 'plan-enterprise' || plan?.slug === 'enterprise' || subscription?.plan?.slug === 'enterprise') 
                      ? "Ativo - Personalize sua loja online" 
                      : "Inativo - Faça upgrade para Enterprise"}
                  </p>
                    </div>
                  </div>
              <Badge className={
                (plan?.id === 'plan-enterprise' || plan?.slug === 'enterprise' || subscription?.plan?.slug === 'enterprise')
                  ? "bg-purple-100 text-purple-800 border-purple-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }>
                {(plan?.id === 'plan-enterprise' || plan?.slug === 'enterprise' || subscription?.plan?.slug === 'enterprise') 
                  ? "✓ Ativo" 
                  : "Inativo"}
              </Badge>
            </div>
            {(plan?.id === 'plan-enterprise' || plan?.slug === 'enterprise' || subscription?.plan?.slug === 'enterprise') && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-sm text-purple-700">
                  Acesse a aba <strong>"Loja Online"</strong> para personalizar cores, banner, seções e muito mais!
                </p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-lg font-medium mb-4">Faça Upgrade do seu Plano</h4>
            {loadingPlans ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : allPlans.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum plano disponível no momento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className={`grid gap-4 ${
                allPlans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                allPlans.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-3'
              }`}>
                {allPlans
                  .filter(p => p.id !== plan?.id) // Excluir o plano atual
                  .map((availablePlan, index) => {
                    const features = Array.isArray(availablePlan.features) ? availablePlan.features : [];
                    const hasProductLimit = availablePlan.product_limit !== null && availablePlan.product_limit !== undefined;
                    
                    // Adicionar limite de produtos às features se existir
                    const displayFeatures = [...features];
                    if (hasProductLimit) {
                      if (availablePlan.product_limit === 0 || availablePlan.product_limit === null) {
                        displayFeatures.unshift("Produtos ilimitados");
                      } else {
                        displayFeatures.unshift(`Até ${availablePlan.product_limit} produtos`);
                      }
                    }
                    
                    // Determinar se é plano popular (meio da lista)
                    const filteredPlans = allPlans.filter(p => p.id !== plan?.id);
                    const isPopular = filteredPlans.length >= 3 && index === Math.floor(filteredPlans.length / 2);
                    
                    // Cores por posição
                    const getBorderColor = () => {
                      if (isPopular) return 'border-indigo-500';
                      if (index === 0) return 'border-blue-200';
                      return 'border-purple-200';
                    };
                    
                    const getButtonColor = () => {
                      if (isPopular) return 'bg-indigo-600 hover:bg-indigo-700';
                      if (index === 0) return 'bg-blue-600 hover:bg-blue-700';
                      return 'bg-purple-600 hover:bg-purple-700';
                    };
                    
                    return (
                      <Card key={availablePlan.id} className={`border-2 ${getBorderColor()} relative`}>
                        {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-indigo-100 text-indigo-800">Mais Popular</Badge>
                </div>
                        )}
                <CardHeader>
                          <CardTitle>{availablePlan.name}</CardTitle>
                  <CardDescription>
                            {availablePlan.slug || "Plano disponível"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                              {availablePlan.price === 0 || !availablePlan.price ? (
                                <span className="text-2xl font-bold">Grátis</span>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold">
                                    R$ {parseFloat(availablePlan.price).toFixed(2).replace('.', ',')}
                                  </span>
                      <span className="text-gray-500">/mês</span>
                                </>
                              )}
                    </div>
                            {displayFeatures.length > 0 ? (
                    <ul className="space-y-2">
                                {displayFeatures.map((feature, i) => (
                                  <li key={i} className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                    <span className="text-sm">{typeof feature === 'string' ? feature : JSON.stringify(feature)}</span>
                      </li>
                                ))}
                    </ul>
                            ) : (
                              <p className="text-sm text-gray-500">Sem recursos especificados</p>
                            )}
                    <Button 
                              className={`w-full ${getButtonColor()}`}
                              onClick={() => window.location.href = createPageUrl(`UpgradePlan?plan=${availablePlan.id}`)}
                    >
                      Fazer Upgrade
                    </Button>
                  </div>
                </CardContent>
              </Card>
                    );
                  })}
                    </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-600 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Economize até 20% optando por planos anuais. Entre em contato para mais informações.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <form 
        onSubmit={handleSubmit}
        noValidate
      >
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Gerencie as informações gerais da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Loja</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email de Contato</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    type="email"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none z-10" />
                  <Select
                    value={formData.city_id && formData.city_id !== "" && formData.city_id !== "none" ? String(formData.city_id) : ""}
                    onValueChange={(value) => {
                      console.log("=== onValueChange chamado ===");
                      console.log("Cidade selecionada:", value);
                      console.log("Cidades disponíveis:", cities.length);
                      console.log("formData.city_id antes:", formData.city_id);
                      
                      // Atualizar imediatamente
                      handleSelectChange("city_id", value);
                      
                      // Verificar se foi atualizado
                      setTimeout(() => {
                        setFormData(prev => {
                          console.log("Verificando formData após seleção - city_id:", prev.city_id);
                          return prev;
                        });
                      }, 50);
                    }}
                    onOpenChange={(open) => {
                      if (open) {
                        console.log("Select aberto - Cidades disponíveis:", cities.length);
                        console.log("Cidades:", cities.map(c => ({ id: c.id, name: c.name })));
                        console.log("formData.city_id atual:", formData.city_id);
                      }
                    }}
                  >
                    <SelectTrigger 
                      className="pl-10 w-full"
                      id="city"
                    >
                      <SelectValue placeholder="Selecione uma cidade" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {cities.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          Carregando cidades...
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">
                            <span className="text-gray-500">Nenhuma cidade</span>
                          </SelectItem>
                      {cities
                            .filter(city => {
                              const isValid = city.id && city.active !== false;
                              if (!isValid && formData.city_id === city.id) {
                                console.warn("Cidade selecionada foi filtrada:", city);
                              }
                              return isValid;
                            })
                            .map((city) => {
                              const isSelected = formData.city_id === city.id;
                              if (isSelected) {
                                console.log("Cidade selecionada encontrada na lista:", city);
                              }
                              return (
                          <SelectItem key={city.id} value={city.id}>
                                  {city.name} {city.state ? `- ${city.state}` : ''}
                          </SelectItem>
                              );
                            })}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {cities.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {cities.length} {cities.length === 1 ? 'cidade disponível' : 'cidades disponíveis'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Loja</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva sua loja, produtos e diferenciais"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Imagens da Loja</CardTitle>
            <CardDescription>
              Personalize a aparência da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">Logo da Loja</Label>
                <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                  {formData.logo ? (
                    <div className="relative">
                      <img 
                        src={formData.logo} 
                        alt="Logo" 
                        className="w-32 h-32 object-contain mb-3" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Alterar Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                        {uploadingLogo ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        Enviar Logo
                      </Button>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Banner da Loja</Label>
                <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                  {formData.banner ? (
                    <div className="relative">
                      <img 
                        src={formData.banner} 
                        alt="Banner" 
                        className="w-full h-32 object-cover mb-3 rounded-md" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Alterar Banner
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        {uploadingBanner ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                      >
                        Enviar Banner
                      </Button>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preferências de Contato</CardTitle>
            <CardDescription>
              Configure como seus clientes podem interagir com você
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exibir WhatsApp nos Produtos</Label>
                <p className="text-sm text-gray-500">
                  Mostrar seu número de WhatsApp nos produtos para facilitar o contato
                </p>
              </div>
              <Switch
                checked={formData.showWhatsapp}
                onCheckedChange={(checked) => handleSwitchChange("showWhatsapp", checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Checkout na Loja</Label>
                <p className="text-sm text-gray-500">
                  Se ativado, clientes poderão adicionar produtos ao carrinho e finalizar pedidos diretamente na sua loja. 
                  Se desativado, apenas contato via WhatsApp estará disponível.
                </p>
              </div>
              <Switch
                checked={formData.checkout_enabled}
                onCheckedChange={(checked) => handleSwitchChange("checkout_enabled", checked)}
              />
            </div>
            
            <Separator />
            
            {/* Parcelamento */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="installments_enabled" className="text-base font-semibold">
                  Exibir Parcelamento
                </Label>
                <p className="text-sm text-gray-500">
                  Mostra opções de parcelamento para os clientes nos produtos
                </p>
              </div>
              <Switch
                checked={formData.installments_enabled}
                onCheckedChange={(checked) => handleSwitchChange("installments_enabled", checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resposta Automática</Label>
                <p className="text-sm text-gray-500">
                  Enviar mensagem automática quando um cliente entrar em contato
                </p>
              </div>
              <Switch
                checked={formData.autoReply}
                onCheckedChange={(checked) => handleSwitchChange("autoReply", checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Seção de Métodos de Pagamento */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Métodos de Pagamento Aceitos
            </CardTitle>
            <CardDescription>
              Escolha quais métodos de pagamento seus clientes podem usar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Selecione quais métodos de pagamento você deseja aceitar. Seus clientes verão apenas os métodos que você ativar.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* WhatsApp */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="payment_method_whatsapp"
                        checked={paymentMethods.includes('whatsapp')}
                        onChange={() => togglePaymentMethod('whatsapp')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={paymentMethods.length === 1 && paymentMethods.includes('whatsapp')}
                      />
                      <Label htmlFor="payment_method_whatsapp" className="text-base font-medium cursor-pointer">
                        WhatsApp
                      </Label>
                    </div>
                    {paymentMethods.includes('whatsapp') && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-7">
                    Cliente finaliza o pedido e você recebe via WhatsApp. Ideal para pequenos negócios.
                  </p>
                </div>
              </div>

              {/* Mercado Pago */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="payment_method_mercadopago"
                        checked={paymentMethods.includes('mercadopago')}
                        onChange={() => togglePaymentMethod('mercadopago')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="payment_method_mercadopago" className="text-base font-medium cursor-pointer">
                        Mercado Pago
                      </Label>
                    </div>
                    {paymentMethods.includes('mercadopago') && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 ml-7">
                    Pagamento online com PIX, cartão de crédito, boleto e mais. Requer configuração de credenciais.
                  </p>
                  {paymentMethods.includes('mercadopago') && !store?.mercadopago_access_token && (
                    <Alert className="mt-3 bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Você precisa configurar as credenciais do Mercado Pago abaixo para usar este método.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
          <Button 
                type="button"
                onClick={handleSavePaymentMethods}
                disabled={savingPaymentMethods}
              >
                {savingPaymentMethods ? "Salvando..." : "Salvar Métodos de Pagamento"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Seção de Pagamento - Mostrar apenas se checkout estiver habilitado */}
        {formData.checkout_enabled && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Configurações de Pagamento
              </CardTitle>
              <CardDescription>
                Configure como seus clientes vão pagar pelos pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input
                  id="pix_key"
                  placeholder="00000000000 ou email@exemplo.com"
                  value={formData.pix_key}
                  onChange={(e) => handleChange({ target: { name: "pix_key", value: e.target.value } })}
                />
                <p className="text-xs text-gray-500">
                  Chave PIX para recebimento de pagamentos. Pode ser CPF, CNPJ, e-mail ou chave aleatória.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_link">Link de Pagamento</Label>
                <Input
                  id="payment_link"
                  type="url"
                  placeholder="https://www.mercadopago.com.br/checkout/v1/redirect..."
                  value={formData.payment_link}
                  onChange={(e) => handleChange({ target: { name: "payment_link", value: e.target.value } })}
                />
                <p className="text-xs text-gray-500">
                  Link do Mercado Pago, PagSeguro ou outro gateway de pagamento (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_instructions">Instruções de Pagamento</Label>
                <Textarea
                  id="payment_instructions"
                  placeholder="Ex: Envie o comprovante via WhatsApp após o pagamento"
                  value={formData.payment_instructions}
                  onChange={(e) => handleChange({ target: { name: "payment_instructions", value: e.target.value } })}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Instruções personalizadas que aparecerão para o cliente após o pedido
                </p>
              </div>

              <Separator className="my-4" />

              {/* Integração Mercado Pago */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Integração Mercado Pago</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Conecte sua conta do Mercado Pago para gerar QR Codes PIX com valor automaticamente
                    </p>
                  </div>
                  {store?.mercadopago_access_token ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Conectado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500">Não conectado</span>
                    </div>
                  )}
                </div>

                {!store?.mercadopago_access_token ? (
                  <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Importante:</p>
                      <p className="text-xs text-yellow-700">
                        Use <strong>Credenciais de Produção</strong> (começam com <code>APP_USR-</code>) para gerar QR Codes que podem ser escaneados.
                        Credenciais de Teste (<code>TEST-</code>) geram QR Codes que <strong>não podem ser escaneados</strong> por apps de banco reais.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mp_access_token">Access Token do Mercado Pago</Label>
                      <Input
                        id="mp_access_token"
                        type="password"
                        placeholder="APP_USR-... (Produção) ou TEST-... (Teste)"
                        value={mercadopagoAccessToken}
                        onChange={(e) => setMercadopagoAccessToken(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Encontre em: Mercado Pago → Desenvolvedores → Suas integrações → Credenciais → Access Token
                      </p>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-green-600">✅ Produção:</span>
                        <span className="text-gray-600">Começa com <code>APP_USR-</code> - QR Codes podem ser escaneados</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-orange-600">⚠️ Teste:</span>
                        <span className="text-gray-600">Começa com <code>TEST-</code> - QR Codes NÃO podem ser escaneados</span>
                      </div>
                      <a 
                        href="https://www.mercadopago.com.br/developers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        📖 Ver guia completo de como obter o token
                      </a>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mp_public_key">Public Key (Opcional)</Label>
                      <Input
                        id="mp_public_key"
                        type="text"
                        placeholder="APP_USR-..."
                        value={mercadopagoPublicKey}
                        onChange={(e) => setMercadopagoPublicKey(e.target.value)}
                      />
                    </div>
          <Button 
                      type="button"
                      onClick={async () => {
                        if (!mercadopagoAccessToken) {
                          toast({
                            title: "Erro",
                            description: "Access Token é obrigatório",
                            variant: "destructive",
                          });
                          return;
                        }
                        try {
                          setMercadopagoConnecting(true);
                          await MercadoPago.connect(store.id, mercadopagoAccessToken, mercadopagoPublicKey || null);
                          toast({
                            title: "Sucesso!",
                            description: "Conta do Mercado Pago conectada com sucesso",
                          });
                          setMercadopagoAccessToken("");
                          setMercadopagoPublicKey("");
                          if (onUpdate) onUpdate();
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: error.message || "Erro ao conectar conta do Mercado Pago",
                            variant: "destructive",
                          });
                        } finally {
                          setMercadopagoConnecting(false);
                        }
                      }}
                      disabled={mercadopagoConnecting}
                      className="w-full"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      {mercadopagoConnecting ? "Conectando..." : "Conectar Conta"}
                    </Button>
                    <p className="text-xs text-blue-600">
                      💡 Ao conectar, o sistema gerará QR Codes PIX com valor automaticamente nos pedidos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    {store.mercadopago_access_token?.startsWith('TEST-') ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Modo Teste Ativo</p>
                        <p className="text-xs text-yellow-700">
                          Você está usando credenciais de <strong>TESTE</strong>. Os QR Codes gerados <strong>não podem ser escaneados</strong> por apps de banco reais.
                          Para produção, use credenciais que começam com <code>APP_USR-</code>.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-green-800">
                        ✅ Sua conta do Mercado Pago está conectada. Os QR Codes PIX serão gerados automaticamente com o valor do pedido.
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        if (!confirm("Tem certeza que deseja desconectar a conta do Mercado Pago?")) {
                          return;
                        }
                        try {
                          setMercadopagoConnecting(true);
                          await MercadoPago.disconnect(store.id);
                          toast({
                            title: "Sucesso!",
                            description: "Conta do Mercado Pago desconectada",
                          });
                          if (onUpdate) onUpdate();
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: error.message || "Erro ao desconectar conta do Mercado Pago",
                            variant: "destructive",
                          });
                        } finally {
                          setMercadopagoConnecting(false);
                        }
                      }}
                      disabled={mercadopagoConnecting}
                      className="w-full"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      {mercadopagoConnecting ? "Desconectando..." : "Desconectar Conta"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção de Frete */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Configurações de Frete
            </CardTitle>
            <CardDescription>
              Configure o valor e condições de entrega
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Calcular Frete no WhatsApp</Label>
                <p className="text-sm text-gray-500">
                  Se ativado, o frete será calculado e informado via WhatsApp (não aparecerá no checkout)
                </p>
              </div>
              <Switch
                checked={formData.shipping_calculate_on_whatsapp}
                onCheckedChange={(checked) => handleSwitchChange("shipping_calculate_on_whatsapp", checked)}
              />
            </div>

            {!formData.shipping_calculate_on_whatsapp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shipping_fixed_price">Valor Fixo do Frete (R$)</Label>
                  <Input
                    id="shipping_fixed_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="10.00"
                    value={formData.shipping_fixed_price}
                    onChange={(e) => handleChange({ target: { name: "shipping_fixed_price", value: e.target.value } })}
                  />
                  <p className="text-xs text-gray-500">
                    Valor fixo do frete que será cobrado em todos os pedidos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_free_threshold">Frete Grátis Acima de (R$)</Label>
                  <Input
                    id="shipping_free_threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    value={formData.shipping_free_threshold}
                    onChange={(e) => handleChange({ target: { name: "shipping_free_threshold", value: e.target.value } })}
                  />
                  <p className="text-xs text-gray-500">
                    Pedidos acima deste valor terão frete grátis (deixe em branco para desabilitar)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-6 flex justify-end gap-4">
          {error && (
            <Alert variant="destructive" className="flex-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="flex-1 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving || uploadingLogo || uploadingBanner || !store}
            onClick={async (e) => {
              console.log("=== BOTÃO CLICADO ===");
              console.log("saving:", saving);
              console.log("uploadingLogo:", uploadingLogo);
              console.log("uploadingBanner:", uploadingBanner);
              console.log("store:", store);
              console.log("formData:", formData);
              console.log("checkout_enabled:", formData.checkout_enabled);
              console.log("Botão desabilitado?", saving || uploadingLogo || uploadingBanner || !store);
              
              // Prevenir comportamento padrão
              e.preventDefault();
              e.stopPropagation();
              
              // Se o botão estiver desabilitado, mostrar por quê
              if (!store) {
                console.error("ERRO: Store não encontrado!");
                setError("Erro: Loja não encontrada. Recarregue a página.");
                return;
              }
              if (saving) {
                console.warn("Já está salvando...");
                return;
              }
              if (uploadingLogo) {
                console.warn("Upload de logo em andamento...");
                return;
              }
              if (uploadingBanner) {
                console.warn("Upload de banner em andamento...");
                return;
              }
              
              // Chamar handleSubmit diretamente
              await handleSubmit(e);
            }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
