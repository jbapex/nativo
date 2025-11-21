
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { City } from "@/api/entities";
import { Plan } from "@/api/entities";
import { Category } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/api/integrations";
import { 
  Store as StoreIcon, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Camera,
  RefreshCw,
  ArrowLeft,
  Tag
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BecomeSeller({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    description: "",
    city_id: "",
    category_id: "",
    logo: null,
    banner: null,
    plan_id: "",
    billing_cycle: "monthly"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const userData = await User.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        email: userData.email || "",
        name: userData.full_name || ""
      }));

      try {
        const [citiesData, plansData, categoriesData] = await Promise.all([
          City.list(),
          Plan.list(),
          Category.list()
        ]);

        setCities(citiesData);
        setPlans(plansData);
        setCategories(categoriesData);
      } catch (listError) {
        console.error("Erro ao carregar listas:", listError);
        try {
          const categoriesData = await Category.list();
          setCategories(categoriesData);
        } catch (catError) {
          console.error("Erro ao carregar categorias:", catError);
        }
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados iniciais. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!formData.name || !formData.whatsapp) {
        setError("Nome e WhatsApp são campos obrigatórios");
        setSaving(false);
        return;
      }

      const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');
      if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 11) {
        setError("Número de WhatsApp inválido");
        setSaving(false);
        return;
      }

      const storeData = {
        name: formData.name.trim(),
        whatsapp: cleanWhatsapp,
        description: formData.description?.trim() || "",
        city_id: formData.city_id || null,
        category_id: formData.category_id || null,
        logo: formData.logo || null,
        store_type: 'physical', // Valor padrão
        has_physical_store: false,
        // status será definido automaticamente como 'pending' no backend
      };

      console.log("Criando loja com dados:", storeData);
      const newStore = await Store.create(storeData);
      console.log("Loja criada:", newStore);

      if (formData.plan_id) {
        const selectedPlan = plans.find(p => p.id === formData.plan_id);
        if (selectedPlan) {
          const price = formData.billing_cycle === "yearly" 
            ? (selectedPlan.yearly_price || selectedPlan.price * 10) 
            : selectedPlan.price;

          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (formData.billing_cycle === "yearly" ? 12 : 1));

          const subscriptionData = {
            store_id: newStore.id,
            plan_id: formData.plan_id,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: "pending",
            billing_cycle: formData.billing_cycle,
            price_paid: price
          };

          console.log("Criando assinatura:", subscriptionData);
          await Subscription.create(subscriptionData);
        }
      }

      setSuccess("Loja cadastrada com sucesso! Aguardando aprovação pelo administrador.");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        else window.location.href = createPageUrl("StoreProfile");
      }, 2000);

    } catch (error) {
      console.error("Erro ao cadastrar loja:", error);
      // Mostrar mensagem de erro mais específica
      let errorMessage = "Erro ao cadastrar loja. Por favor, tente novamente.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Mensagens específicas para erros comuns
      if (errorMessage.includes('Token não fornecido') || errorMessage.includes('Não autenticado')) {
        errorMessage = "Você precisa estar logado para cadastrar uma loja. Por favor, faça login primeiro.";
      } else if (errorMessage.includes('Acesso negado') || errorMessage.includes('Autenticação necessária')) {
        errorMessage = "Você não tem permissão para realizar esta ação. Faça login novamente.";
      } else if (errorMessage.includes('Cidade ou categoria inválida')) {
        errorMessage = "Por favor, selecione uma cidade e categoria válidas.";
      } else if (errorMessage.includes('já possui uma loja')) {
        errorMessage = "Você já possui uma loja cadastrada. Acesse sua loja em 'Minha Loja'.";
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-full">
          <StoreIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Cadastrar Loja</h2>
          <p className="text-sm text-gray-500">
            Preencha os dados para começar a vender no NATIVO
          </p>
        </div>
      </div>

      <Alert className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Após o cadastro, sua loja precisará ser aprovada por um administrador antes de ficar visível para os clientes.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nome da Loja</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1"
            required
            readOnly
          />
        </div>

        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            className="mt-1"
            placeholder="(00) 00000-0000"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="city_id">Cidade</Label>
            <Select
              value={formData.city_id}
              onValueChange={(value) => handleSelectChange("city_id", value)}
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

          <div>
            <Label htmlFor="category_id">Categoria da Loja</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => handleSelectChange("category_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição da Loja</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Logo da Loja</Label>
            <div className="mt-2 border rounded-lg p-4 text-center">
              {formData.logo ? (
                <div className="relative">
                  <img
                    src={formData.logo}
                    alt="Logo"
                    className="w-32 h-32 mx-auto object-contain"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Alterar Logo
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div>
            <Label>Banner da Loja</Label>
            <div className="mt-2 border rounded-lg p-4 text-center">
              {formData.banner ? (
                <div className="relative">
                  <img
                    src={formData.banner}
                    alt="Banner"
                    className="h-32 w-full mx-auto object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    Alterar Banner
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                  >
                    {uploadingBanner ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
              <input
                type="file"
                ref={bannerInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleBannerUpload}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : (
              "Cadastrar Loja"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
