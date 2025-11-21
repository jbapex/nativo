
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { Subscription } from "@/api/entities"; // Adicionando importação
import { Plan } from "@/api/entities"; // Adicionando importação
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/api/integrations";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  ShoppingBag,
  ImagePlus,
  Tags,
  DollarSign,
  LayoutGrid,
  AlertCircle,
  CheckCircle,
  EyeOff,
} from "lucide-react";

export default function AddProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingProduct = location.state?.product;
  const isEditing = !!editingProduct;

  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compare_price: "",
    category: "",
    subcategory: "",
    status: "active",
    featured: false,
    whatsapp: "",
    images: [],
    tags: "",
    stock: "10",
    store_name: "",
    store_logo: ""
  });
  const [imageUrl, setImageUrl] = useState("");
  const [addingImageUrl, setAddingImageUrl] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (editingProduct) {
      console.log("Carregando produto para edição:", editingProduct);
      setFormData({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        price: editingProduct.price !== undefined ? editingProduct.price : "",
        compare_price: editingProduct.compare_price !== undefined ? editingProduct.compare_price : "",
        category: editingProduct.category_id || editingProduct.category || "", // Backend retorna category_id
        subcategory: editingProduct.subcategory || "",
        status: editingProduct.status || "active",
        featured: editingProduct.featured || false,
        whatsapp: editingProduct.whatsapp || "",
        images: editingProduct.images || [],
        tags: editingProduct.tags?.join(", ") || "",
        stock: editingProduct.stock?.toString() || "10",
        store_name: editingProduct.store_name || "",
        store_logo: editingProduct.store_logo || ""
      });
    }
  }, [editingProduct]);

  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const loadInitialData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const stores = await Store.list();
      const userStore = stores.find(s => 
        (s.email === userData.email || s.created_by === userData.email) && 
        s.status === "approved"
      );
      
      if (userStore) {
        setStore(userStore);
        
        // Carregar categorias globais + categorias da loja
        // Usar query string para passar store_id
        const categoriesData = await Category.filter({ active: 'true', store_id: userStore.id });
        setCategories(categoriesData);
        
        setFormData(prev => ({
          ...prev,
          store_name: userStore.name || "",
          store_logo: userStore.logo || "",
          whatsapp: userStore.whatsapp || ""
        }));
      } else {
        // Se não tiver loja, carregar apenas categorias globais
        const categoriesData = await Category.filter({ active: 'true' });
        setCategories(categoriesData);
        setError("Você não possui uma loja aprovada para cadastrar produtos.");
        setTimeout(() => {
          navigate(createPageUrl("StoreProfile"));
        }, 3000);
      }
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados iniciais. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const checkProductLimit = async () => {
    try {
      const userData = await User.me();
      const stores = await Store.list();
      const userStore = stores.find(s => s.email === userData.email || s.created_by === userData.email);
      
      if (!userStore) return false;

      const allProducts = await Product.list();
      const storeProducts = allProducts.filter(p => p.store_id === userStore.id);
      
      const subscriptions = await Subscription.filter({ store_id: userStore.id, status: "active" });
      const activeSubscription = subscriptions?.[0];
      
      let currentPlan = null;
      if (activeSubscription) {
        const plans = await Plan.list();
        currentPlan = plans.find(p => p.id === activeSubscription.plan_id);
      }

      const productLimit = currentPlan?.product_limit || 3;
      
      if (storeProducts.length >= productLimit) {
        setError({
          title: "Limite de produtos atingido",
          message: `Você atingiu o limite de ${productLimit} produtos do seu plano atual. Faça upgrade para adicionar mais produtos.`,
          type: "limit",
          limit: productLimit,
          current: storeProducts.length
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao verificar limite de produtos:", error);
      return false;
    }
  };

  const formatPriceForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    return typeof value === 'number' ? value.toFixed(2).replace('.', ',') : '';
  };

  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return null;
    const numericValue = formattedValue
      .replace(/[R$\s.]/g, '')
      .replace(',', '.');
    return parseFloat(numericValue);
  };

  const handlePriceChange = (e, field) => {
    const { value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, '');
    const decimalValue = numericValue ? parseFloat(numericValue) / 100 : '';
    setFormData(prev => ({
      ...prev,
      [field]: decimalValue || null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    if (value === "new_category") {
      setNewCategoryDialogOpen(true);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    if (!store) {
      alert("Você precisa ter uma loja cadastrada para criar categorias");
      return;
    }

    setCreatingCategory(true);
    try {
      const newCategory = await Category.create({
        name: newCategoryName.trim(),
        active: true
      });

      // Recarregar categorias (globais + da loja)
      const categoriesData = await Category.filter({ active: 'true', store_id: store.id });
      setCategories(categoriesData);

      // Selecionar a nova categoria
      setFormData(prev => ({ ...prev, category: newCategory.id }));

      setNewCategoryName("");
      setNewCategoryDialogOpen(false);
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      alert("Erro ao criar categoria. Tente novamente.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingImage(true);
    setError("");
    setSuccess("");
    
    try {
      for (const file of files) {
        // Validar tamanho do arquivo (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`O arquivo "${file.name}" é muito grande. Tamanho máximo: 5MB`);
          setUploadingImage(false);
          return;
        }

        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          setError(`O arquivo "${file.name}" não é uma imagem válida. Use JPEG, PNG, GIF ou WEBP.`);
          setUploadingImage(false);
          return;
        }

        const { file_url } = await UploadFile({ file });
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file_url]
        }));
      }
      setSuccess("Imagem(s) adicionada(s) com sucesso!");
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(""), 3000);
      // Limpar input de arquivo
      e.target.value = '';
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      const errorMessage = error.message || "Erro ao fazer upload da imagem. Tente novamente.";
      
      // Mensagens específicas
      if (errorMessage.includes('Token não fornecido') || errorMessage.includes('Não autenticado')) {
        setError("Você precisa estar logado para fazer upload de imagens. Faça login novamente.");
      } else if (errorMessage.includes('Apenas imagens são permitidas')) {
        setError("Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP).");
      } else {
        setError(errorMessage);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      setError("Por favor, insira uma URL de imagem válida.");
      return;
    }
    
    try {
      new URL(imageUrl);
    } catch (e) {
      setError("Por favor, insira uma URL válida. Exemplo: https://exemplo.com/imagem.jpg");
      return;
    }
    
    setAddingImageUrl(true);
    
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      
      setImageUrl("");
      setAddingImageUrl(false);
    }, 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const canAddProduct = await checkProductLimit();
    if (!canAddProduct) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!store) {
      setError("Você não possui uma loja aprovada para cadastrar produtos.");
      return;
    }
    
    if (formData.images.length === 0) {
      setError("É necessário adicionar pelo menos uma imagem do produto.");
      return;
    }

    if (!formData.name || !formData.price) {
      setError("Nome e preço são campos obrigatórios.");
      setSaving(false);
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      // Preparar dados no formato esperado pelo backend
      // Converter preço de formato brasileiro (R$ 10,50) para número
      const priceValue = typeof formData.price === 'string' 
        ? parseCurrency(formData.price) 
        : parseFloat(formData.price);

      // Calcular estoque - garantir que seja número ou null
      let stockValue = null;
      if (formData.stock) {
        const parsed = parseInt(formData.stock);
        stockValue = isNaN(parsed) ? null : parsed;
      }
      
      console.log("Estoque sendo salvo:", stockValue, "Tipo:", typeof stockValue);
      console.log("Categoria selecionada:", formData.category);

      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        price: priceValue,
        category_id: formData.category && formData.category !== "" ? formData.category : null, // Backend espera category_id, não category
        images: formData.images || [],
        tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag) : [],
        stock: stockValue
      };
      
      console.log("Dados do produto sendo enviados:", productData);

      // Validar campos obrigatórios
      if (!productData.name || productData.name.trim() === '') {
        setError("Nome do produto é obrigatório.");
        setSaving(false);
        return;
      }

      if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
        setError("Preço válido é obrigatório. Exemplo: R$ 10,50");
        setSaving(false);
        return;
      }
      
      console.log("Salvando produto:", productData);
      
      if (isEditing) {
        await Product.update(editingProduct.id, productData);
        setSuccess("Produto atualizado com sucesso!");
      } else {
        await Product.create(productData);
        setSuccess("Produto cadastrado com sucesso!");
      }

      // Limpar mensagem de erro se houver
      setError("");

      setTimeout(() => {
        navigate(createPageUrl("StoreProfile"));
      }, 1500);
      
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      
      // Mostrar mensagem de erro mais específica
      let errorMessage = "Erro ao salvar produto. Verifique os dados e tente novamente.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Mensagens específicas para erros comuns
      if (errorMessage.includes('Token não fornecido') || errorMessage.includes('Não autenticado')) {
        errorMessage = "Você precisa estar logado para cadastrar produtos. Faça login novamente.";
      } else if (errorMessage.includes('loja aprovada')) {
        errorMessage = "Você não possui uma loja aprovada. Aguarde a aprovação do administrador.";
      } else if (errorMessage.includes('Nome e preço são obrigatórios')) {
        errorMessage = "Nome e preço são campos obrigatórios.";
      } else if (errorMessage.includes('Acesso negado')) {
        errorMessage = "Você não tem permissão para realizar esta ação.";
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      status: checked ? "active" : "draft"
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {error && (
          <div className="mb-6">
            {error.type === "limit" ? (
              <div className="bg-white border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {error.title}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{error.message}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">{error.current}</span> de <span className="font-medium">{error.limit}</span> produtos utilizados
                        </div>
                        <Button
                          onClick={() => window.location.href = createPageUrl("StoreSettings")}
                          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        >
                          Ver Planos Disponíveis
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{typeof error === 'string' ? error : (error.message || "Erro ao processar sua requisição")}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(createPageUrl("StoreProfile"))}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à loja
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? "Editar Produto" : "Cadastrar Novo Produto"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {isEditing ? "Editar Produto" : "Novo Produto"}
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Atualize os detalhes do produto" : "Adicione um novo produto à sua loja"}
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="product-status"
                  checked={formData.status === "active"}
                  onCheckedChange={handleStatusChange}
                />
                <Label htmlFor="product-status" className="text-sm">
                  {formData.status === "active" ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Visível
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500">
                      <EyeOff className="w-4 h-4 mr-1" />
                      Oculto
                    </span>
                  )}
                </Label>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome do Produto*</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="Nome do produto"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        placeholder="Descreva seu produto detalhadamente"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <ImagePlus className="w-5 h-5 text-blue-600" />
                    Imagens do Produto*
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden">
                          <img 
                            src={image} 
                            alt={`Produto ${index + 1}`} 
                            className="w-full aspect-square object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://placehold.co/400x400/e2e8f0/a1a1aa?text=Imagem+Inválida";
                            }}
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center aspect-square">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        <Label 
                          htmlFor="image-upload" 
                          className="cursor-pointer flex flex-col items-center justify-center h-full"
                        >
                          {uploadingImage ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 mb-1">
                                {formData.images.length === 0 ? "Adicione imagens do produto" : "Adicionar mais imagens"}
                              </p>
                              <p className="text-xs text-gray-400">
                                PNG, JPG até 5MB
                              </p>
                            </>
                          )}
                        </Label>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium mb-2">Ou adicione imagem a partir de URL</h4>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="url"
                            placeholder="https://exemplo.com/imagem.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            disabled={addingImageUrl}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddImageUrl}
                          disabled={addingImageUrl}
                        >
                          {addingImageUrl ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Adicionar
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Certifique-se que a URL termina com .jpg, .png ou .webp e que a imagem seja de domínio público
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Preço e Estoque
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="price">Preço*</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <Input
                          id="price"
                          type="text"
                          value={formatPriceForInput(formData.price)}
                          onChange={(e) => handlePriceChange(e, 'price')}
                          className="pl-10"
                          placeholder="0,00"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="compare_price">Preço Original (opcional)</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <Input
                          id="compare_price"
                          type="text"
                          value={formatPriceForInput(formData.compare_price)}
                          onChange={(e) => handlePriceChange(e, 'compare_price')}
                          className="pl-10"
                          placeholder="0,00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Preço antes do desconto, será exibido riscado
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="stock">Estoque (opcional)</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="10"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Deixe vazio ou 0 para produtos sem estoque. O status será atualizado automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <LayoutGrid className="w-5 h-5 text-blue-600" />
                    Categoria e Tags
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="category">Categoria*</Label>
                          {store && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setNewCategoryDialogOpen(true)}
                              className="text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Nova Categoria
                            </Button>
                          )}
                        </div>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => handleSelectChange("category", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length > 0 ? (
                              <>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                    {category.store_id && (
                                      <span className="ml-2 text-xs text-gray-500">(Minha)</span>
                                    )}
                                  </SelectItem>
                                ))}
                              </>
                            ) : (
                              <>
                                <SelectItem value="roupas_femininas">Roupas Femininas</SelectItem>
                                <SelectItem value="roupas_masculinas">Roupas Masculinas</SelectItem>
                                <SelectItem value="calcados">Calçados</SelectItem>
                                <SelectItem value="acessorios">Acessórios</SelectItem>
                                <SelectItem value="joias_bijuterias">Joias e Bijuterias</SelectItem>
                                <SelectItem value="casa_decoracao">Casa e Decoração</SelectItem>
                                <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                                <SelectItem value="esporte_lazer">Esporte e Lazer</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                      <div className="relative">
                        <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input 
                          id="tags" 
                          name="tags" 
                          value={formData.tags} 
                          onChange={handleChange} 
                          placeholder="moda, verão, casual, ..."
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Configurações Adicionais</h3>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="featured" className="block">Destacar Produto</Label>
                        <p className="text-sm text-gray-500">Mostrar este produto em áreas destacadas</p>
                      </div>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => handleSwitchChange("featured", checked)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status do Produto</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo (Visível para todos)</SelectItem>
                          <SelectItem value="draft">Rascunho (Não visível)</SelectItem>
                          <SelectItem value="out_of_stock">Fora de Estoque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("StoreProfile"))}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving || uploadingImage}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? "Atualizando..." : "Salvando..."}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isEditing ? "Atualizar Produto" : "Cadastrar Produto"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Dialog para criar nova categoria */}
      <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria personalizada para seus produtos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newCategoryName">Nome da Categoria*</Label>
              <Input
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Roupas de Verão"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewCategoryDialogOpen(false);
                setNewCategoryName("");
              }}
              disabled={creatingCategory}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || creatingCategory}
            >
              {creatingCategory ? "Criando..." : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
