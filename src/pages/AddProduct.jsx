
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { Subscription } from "@/api/entities"; // Adicionando importação
import { Plan } from "@/api/entities"; // Adicionando importação
import { CategoryAttributes } from "@/api/apiClient";
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
  Info,
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
    store_logo: "",
    // Novos campos para as abas
    technical_specs: "", // JSON string com especificações técnicas
    included_items: "", // Lista de itens inclusos (separados por linha)
    warranty_info: "", // Informações sobre garantia
    attributes: {} // Atributos dinâmicos da categoria (ex: {year: "2020", brand: "Chevrolet"})
  });
  const [imageUrl, setImageUrl] = useState("");
  const [addingImageUrl, setAddingImageUrl] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState([]); // Atributos da categoria selecionada
  const [editingPriceField, setEditingPriceField] = useState(null); // Campo de preço sendo editado (para não formatar durante digitação)

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadEditingProduct = async () => {
    if (editingProduct) {
        console.log("📦 Carregando produto para edição:", editingProduct);
        console.log("📋 Campos recebidos:", {
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          compare_price: editingProduct.compare_price,
          category_id: editingProduct.category_id,
          status: editingProduct.status,
          featured: editingProduct.featured,
          whatsapp: editingProduct.whatsapp,
          stock: editingProduct.stock,
          technical_specs: editingProduct.technical_specs,
          included_items: editingProduct.included_items,
          warranty_info: editingProduct.warranty_info,
          attributes: editingProduct.attributes
        });
        
        // Parse technical_specs e included_items se forem strings JSON
        let technicalSpecs = "";
        let includedItems = "";
        
        if (editingProduct.technical_specs) {
          if (typeof editingProduct.technical_specs === 'string') {
            // Se for string, tentar parse JSON primeiro
            try {
              const parsed = JSON.parse(editingProduct.technical_specs);
              // Se parseou e é objeto, converter para texto
              if (typeof parsed === 'object' && parsed !== null) {
                technicalSpecs = Object.entries(parsed).map(([key, value]) => `${key}: ${value}`).join('\n');
              } else {
                technicalSpecs = parsed;
              }
            } catch {
              // Se não for JSON, usar a string diretamente
              technicalSpecs = editingProduct.technical_specs;
            }
          } else if (typeof editingProduct.technical_specs === 'object' && editingProduct.technical_specs !== null) {
            technicalSpecs = Object.entries(editingProduct.technical_specs).map(([key, value]) => `${key}: ${value}`).join('\n');
          }
        }
        
        if (editingProduct.included_items) {
          if (typeof editingProduct.included_items === 'string') {
            try {
              const parsed = JSON.parse(editingProduct.included_items);
              includedItems = Array.isArray(parsed) ? parsed.join('\n') : (typeof parsed === 'string' ? parsed : String(parsed));
            } catch {
              includedItems = editingProduct.included_items;
            }
          } else if (Array.isArray(editingProduct.included_items)) {
            includedItems = editingProduct.included_items.join('\n');
          } else {
            includedItems = String(editingProduct.included_items);
          }
        }
        
        // Carregar atributos da categoria se houver
        let attributes = {};
        if (editingProduct.attributes) {
          console.log("📋 Atributos do produto (raw):", editingProduct.attributes);
          console.log("📋 Tipo dos atributos:", typeof editingProduct.attributes);
          
          if (typeof editingProduct.attributes === 'string') {
            try {
              attributes = JSON.parse(editingProduct.attributes);
              console.log("✅ Atributos parseados (string -> objeto):", attributes);
            } catch (parseError) {
              console.error("❌ Erro ao fazer parse dos atributos:", parseError);
              attributes = {};
            }
          } else if (typeof editingProduct.attributes === 'object' && editingProduct.attributes !== null) {
            attributes = editingProduct.attributes;
            console.log("✅ Atributos já são objeto:", attributes);
          }
        } else {
          console.log("⚠️ Produto não tem atributos salvos");
        }
        
        console.log("📦 Atributos finais para o formulário:", attributes);
        
        // Buscar atributos da categoria para renderizar os campos
        const categoryId = editingProduct.category_id || editingProduct.category;
        if (categoryId) {
          try {
            const attrs = await CategoryAttributes.listByCategory(categoryId);
            console.log("🏷️ Atributos da categoria carregados:", attrs);
            setCategoryAttributes(attrs || []);
            
            // Verificar se os valores dos atributos estão corretos
            if (attrs && attrs.length > 0 && Object.keys(attributes).length > 0) {
              console.log("🔍 Verificando correspondência entre atributos e valores:");
              attrs.forEach(attr => {
                const value = attributes[attr.name];
                console.log(`  - ${attr.name}: ${value} (tipo: ${typeof value})`);
              });
            }
          } catch (error) {
            console.error("Erro ao carregar atributos da categoria:", error);
            setCategoryAttributes([]);
          }
        }
        
        // Formatar preços corretamente ao carregar
        let formattedPrice = "";
        let formattedComparePrice = "";
        
        if (editingProduct.price !== undefined && editingProduct.price !== null) {
          // Se for número, manter como número (será formatado na exibição)
          // Se for string, converter para número primeiro
          const priceValue = typeof editingProduct.price === 'string' 
            ? parseCurrency(editingProduct.price) 
            : editingProduct.price;
          formattedPrice = priceValue !== null && !isNaN(priceValue) ? priceValue : "";
        }
        
        if (editingProduct.compare_price !== undefined && editingProduct.compare_price !== null) {
          // Se for número, manter como número (será formatado na exibição)
          // Se for string, converter para número primeiro
          const comparePriceValue = typeof editingProduct.compare_price === 'string' 
            ? parseCurrency(editingProduct.compare_price) 
            : editingProduct.compare_price;
          formattedComparePrice = comparePriceValue !== null && !isNaN(comparePriceValue) ? comparePriceValue : "";
        }
        
        const formDataToSet = {
        name: editingProduct.name || "",
        description: editingProduct.description || "",
          price: formattedPrice,
          compare_price: formattedComparePrice,
          category: categoryId || "",
        subcategory: editingProduct.subcategory || "",
        status: editingProduct.status || "active",
        featured: editingProduct.featured || false,
        whatsapp: editingProduct.whatsapp || "",
          images: Array.isArray(editingProduct.images) ? editingProduct.images : (editingProduct.images ? [editingProduct.images] : []),
          tags: Array.isArray(editingProduct.tags) ? editingProduct.tags.join(", ") : (editingProduct.tags || ""),
          stock: editingProduct.stock !== undefined && editingProduct.stock !== null ? editingProduct.stock.toString() : "10",
        store_name: editingProduct.store_name || "",
          store_logo: editingProduct.store_logo || "",
          technical_specs: technicalSpecs,
          included_items: includedItems,
          warranty_info: editingProduct.warranty_info || "",
          attributes: attributes
        };
        
        console.log("✅ Dados formatados para o formulário:", formDataToSet);
        
        setFormData(formDataToSet);
      }
    };
    
    loadEditingProduct();
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
        
        // Se estiver editando um produto, não resetar os dados do formulário
        if (!editingProduct) {
        setFormData(prev => ({
          ...prev,
          store_name: userStore.name || "",
          store_logo: userStore.logo || "",
          whatsapp: userStore.whatsapp || ""
        }));
        }
      } else {
        // Se não tiver loja, carregar apenas categorias globais
        const categoriesData = await Category.filter({ active: 'true' });
        setCategories(categoriesData);
        if (!editingProduct) {
        setError("Você não possui uma loja aprovada para cadastrar produtos.");
        setTimeout(() => {
          navigate("/loja/produtos");
        }, 3000);
        }
      }
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Se o erro for de autenticação, redirecionar para login
      if (error.message?.includes('Não autenticado') || error.message?.includes('Token')) {
        setError("Você precisa estar logado para cadastrar produtos. Redirecionando...");
        setTimeout(() => {
          navigate(createPageUrl("Home"));
        }, 2000);
      } else {
        if (!editingProduct) {
      setError("Erro ao carregar dados iniciais. Tente novamente.");
        }
      }
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

  // Formatar valor para exibição no input (1.234,56) - SEM o R$
  const formatPriceForInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    
    // Se já for string formatada (sem R$), retornar
    if (typeof value === 'string') {
      // Remover R$ se existir
      let cleanValue = value.replace(/[R$\s]/g, '');
      
      // Se tiver ponto e vírgula, verificar se está no formato brasileiro correto
      if (cleanValue.includes(',') && cleanValue.includes('.')) {
        const lastCommaIndex = cleanValue.lastIndexOf(',');
        const lastDotIndex = cleanValue.lastIndexOf('.');
        // Se a vírgula vem depois do último ponto, é formato brasileiro (20.220,00)
        if (lastCommaIndex > lastDotIndex) {
          return cleanValue;
        }
        // Se não, converter usando parseCurrency
        const numValue = parseCurrency(cleanValue);
        if (!isNaN(numValue) && numValue !== null) {
          const formatted = formatPriceInRealTime(String(numValue));
          return formatted.includes(',') ? formatted : `${formatted},00`;
        }
      }
      // Se tiver apenas vírgula, pode estar formatado (mas sem milhares)
      if (cleanValue.includes(',') && !cleanValue.includes('.')) {
        // Tentar adicionar milhares se necessário
        const numValue = parseCurrency(cleanValue);
        if (!isNaN(numValue) && numValue !== null) {
          const formatted = formatPriceInRealTime(String(numValue));
          return formatted.includes(',') ? formatted : `${formatted},00`;
        }
        return cleanValue;
      }
      // Se tiver apenas ponto, pode ser formato americano (20220.00) ou brasileiro sem vírgula (20.220)
      if (cleanValue.includes('.') && !cleanValue.includes(',')) {
        // Usar parseCurrency para detectar corretamente
        const numValue = parseCurrency(cleanValue);
        if (!isNaN(numValue) && numValue !== null) {
          const formatted = formatPriceInRealTime(String(numValue));
          return formatted.includes(',') ? formatted : `${formatted},00`;
        }
      }
      
      // Se não tiver formatação, tentar converter e formatar
      // Primeiro, usar parseCurrency para converter corretamente (detecta formato brasileiro/americano)
      const numValue = parseCurrency(cleanValue);
      if (!isNaN(numValue) && numValue !== null) {
        // Formatar usando formatPriceInRealTime e adicionar ",00" se for inteiro
        const formatted = formatPriceInRealTime(String(numValue));
        return formatted.includes(',') ? formatted : `${formatted},00`;
      }
    }
    
    // Se é número, formatar usando formatPriceInRealTime e adicionar ",00" se for inteiro
    if (typeof value === 'number') {
      const formatted = formatPriceInRealTime(String(value));
      // Se não tiver vírgula (é inteiro), adicionar ",00"
      return formatted.includes(',') ? formatted : `${formatted},00`;
    }
    
    // Converter para número usando parseCurrency (detecta formato brasileiro/americano)
    const numValue = parseCurrency(String(value));
    
    if (isNaN(numValue) || numValue === null) return '';
    
    // Formatar usando formatPriceInRealTime e adicionar ",00" se for inteiro
    const formatted = formatPriceInRealTime(String(numValue));
    return formatted.includes(',') ? formatted : `${formatted},00`;
  };

  // Converter valor formatado para número
  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return null;
    
    // Se já for número, retornar
    if (typeof formattedValue === 'number') {
      return formattedValue;
    }
    
    // Converter para string
    const str = String(formattedValue).trim();
    
    // Remover R$ e espaços
    let cleanValue = str.replace(/[R$\s]/g, '');
    
    // Detectar formato: brasileiro (vírgula decimal) ou americano (ponto decimal)
    const hasComma = cleanValue.includes(',');
    const hasDot = cleanValue.includes('.');
    
    if (hasComma && hasDot) {
      // Formato brasileiro: 1.234,56 (ponto é milhar, vírgula é decimal)
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
      // Formato brasileiro sem milhares: 1234,56
      cleanValue = cleanValue.replace(',', '.');
    } else if (hasDot && !hasComma) {
      // Tem apenas ponto - verificar se é milhar ou decimal
      // Se tiver múltiplos pontos OU se o último ponto tiver mais de 2 dígitos após ele, é milhar
      const parts = cleanValue.split('.');
      const dotCount = parts.length - 1;
      
      if (dotCount > 1) {
        // Múltiplos pontos = formato brasileiro (milhares), remover todos
        cleanValue = cleanValue.replace(/\./g, '');
      } else if (parts.length === 2) {
        // Um ponto - verificar se é decimal ou milhar
        const afterDot = parts[1];
        // Se tiver 3 dígitos após o ponto, é milhar (formato brasileiro: 20.000)
        // Se tiver 1-2 dígitos, pode ser decimal (formato americano: 20.00)
        if (afterDot && afterDot.length === 3) {
          // 3 dígitos após o ponto = formato brasileiro (milhares)
          cleanValue = cleanValue.replace(/\./g, '');
        } else if (afterDot && afterDot.length <= 2) {
          // 1-2 dígitos após o ponto = provavelmente decimal (formato americano)
          // Manter o ponto como decimal (não fazer nada)
        } else {
          // Mais de 3 dígitos após o ponto = formato brasileiro (milhares)
          cleanValue = cleanValue.replace(/\./g, '');
        }
      } else {
        // Não deveria acontecer, mas se acontecer, remover pontos
        cleanValue = cleanValue.replace(/\./g, '');
      }
    }
    // Se não tiver nem vírgula nem ponto, já é número limpo
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  };

  // Formatar número com pontos e vírgulas em tempo real
  const formatPriceInRealTime = (value) => {
    if (!value || value === '') return '';
    
    // Remover tudo exceto números, vírgula e ponto
    let cleanValue = String(value).replace(/[^0-9,.]/g, '');
    
    if (cleanValue === '') return '';
    
    // Detectar se tem vírgula (separador decimal brasileiro)
    const hasComma = cleanValue.includes(',');
    const lastCommaIndex = cleanValue.lastIndexOf(',');
    
    // Detectar se tem ponto - pode ser milhar (BR) ou decimal (US)
    const hasDot = cleanValue.includes('.');
    const lastDotIndex = cleanValue.lastIndexOf('.');
    
    // Se tiver vírgula E ponto, determinar qual é o separador decimal
    // No formato brasileiro: vírgula é decimal, ponto é milhar
    let integerPart = '';
    let decimalPart = '';
    
    if (hasComma) {
      // Formato brasileiro: vírgula é decimal
      // Separar por vírgula
      integerPart = cleanValue.substring(0, lastCommaIndex).replace(/\./g, ''); // Remover pontos (milhares)
      decimalPart = cleanValue.substring(lastCommaIndex + 1).replace(/\./g, ''); // Remover pontos dos decimais
      
      // Limitar a 2 casas decimais
      if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2);
      }
    } else if (hasDot) {
      // Se só tem ponto, verificar se é milhar ou decimal
      const parts = cleanValue.split('.');
      const dotCount = parts.length - 1;
      
      if (dotCount > 1) {
        // Múltiplos pontos = formato brasileiro (milhares), remover todos os pontos
        integerPart = cleanValue.replace(/\./g, '');
        decimalPart = '';
      } else if (parts[1] && parts[1].length <= 2) {
        // Um ponto com 1-2 dígitos após = pode ser decimal (formato americano)
        // Converter para formato brasileiro
        integerPart = parts[0] || '';
        decimalPart = parts[1] || '';
        if (decimalPart.length > 2) {
          decimalPart = decimalPart.substring(0, 2);
        }
      } else {
        // Um ponto mas muitos dígitos após = formato brasileiro (milhares)
        integerPart = cleanValue.replace(/\./g, '');
        decimalPart = '';
      }
    } else {
      // Sem vírgula nem ponto, tudo é parte inteira - PRESERVAR TODOS OS DÍGITOS
      integerPart = cleanValue;
      decimalPart = '';
    }
    
    // NÃO remover zeros - preservar todos os dígitos digitados
    if (integerPart === '') {
      integerPart = '0';
    }
    
    // Adicionar pontos como separadores de milhar (a cada 3 dígitos da direita para esquerda)
    // Função manual para garantir que funciona corretamente
    let formattedInteger = integerPart;
    if (integerPart.length >= 4) {
      // Adicionar pontos de milhar manualmente da direita para esquerda
      let result = '';
      let count = 0;
      // Percorrer da direita para esquerda
      for (let i = integerPart.length - 1; i >= 0; i--) {
        if (count > 0 && count % 3 === 0) {
          result = '.' + result;
        }
        result = integerPart[i] + result;
        count++;
      }
      formattedInteger = result;
    } else {
      // Para números menores que 4 dígitos, manter sem formatação
      formattedInteger = integerPart;
    }
    
    // Combinar parte inteira e decimal
    if (hasComma) {
      if (decimalPart !== '') {
        return `${formattedInteger},${decimalPart}`;
      } else {
        // Se digitou vírgula mas ainda não digitou decimais, mostrar vírgula
        return `${formattedInteger},`;
      }
    } else if (hasDot && decimalPart) {
      // Se tinha ponto como decimal, converter para vírgula
      return `${formattedInteger},${decimalPart}`;
    } else {
      // Sem vírgula, apenas parte inteira formatada
      return formattedInteger;
    }
  };
  
  // Manipular mudança no campo de preço - formata em tempo real
  const handlePriceChange = (e, field) => {
    const { value } = e.target;
    
    // Marcar que o campo está sendo editado
    if (editingPriceField !== field) {
      setEditingPriceField(field);
    }
    
    // Se estiver vazio, limpar
    if (!value || value.trim() === '') {
    setFormData(prev => ({
      ...prev,
        [field]: ''
      }));
      return;
    }
    
    // Formatar em tempo real
    const formatted = formatPriceInRealTime(value);
    
    // Salvar como string formatada durante a digitação
    setFormData(prev => ({
      ...prev,
      [field]: formatted
    }));
  };
  
  // Formatar preço ao sair do campo (onBlur)
  const handlePriceBlur = (e, field) => {
    const { value } = e.target;
    
    // Remover marcação de edição
    setEditingPriceField(null);
    
    if (!value || value.trim() === '') {
      setFormData(prev => ({
        ...prev,
        [field]: ''
      }));
      return;
    }
    
    // Converter para número sempre (para garantir que seja salvo corretamente)
    const numericValue = parseCurrency(value);
    
    console.log(`💾 onBlur ${field}:`, {
      valorOriginal: value,
      valorConvertido: numericValue,
      tipo: typeof numericValue
    });
    
    if (numericValue !== null && !isNaN(numericValue) && numericValue > 0) {
      // Salvar como número (será formatado corretamente na exibição)
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
      
      // Atualizar o campo visualmente com formatação completa (incluindo ,00 se for inteiro)
      // Isso garante que números inteiros apareçam como "20.000,00"
      const formatted = formatPriceForInput(numericValue);
      
      // Atualizar o valor do input diretamente para mostrar a formatação completa
      e.target.value = formatted;
    } else {
      // Se não conseguir converter, limpar o campo
      setFormData(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = async (name, value) => {
    if (value === "new_category") {
      setNewCategoryDialogOpen(true);
    } else {
    setFormData(prev => ({ ...prev, [name]: value }));
      
      // Se mudou a categoria, buscar atributos dessa categoria
      if (name === "category" && value) {
        try {
          const attributes = await CategoryAttributes.listByCategory(value);
          setCategoryAttributes(attributes || []);
          // Limpar valores de atributos anteriores
          setFormData(prev => ({ ...prev, attributes: {} }));
        } catch (error) {
          console.error("Erro ao carregar atributos da categoria:", error);
          setCategoryAttributes([]);
        }
      }
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

  // Função para atualizar atributos dinâmicos
  const handleAttributeChange = (attributeName, value) => {
    console.log(`🔄 Atualizando atributo ${attributeName}:`, value, `(tipo: ${typeof value})`);
    setFormData(prev => {
      const newAttributes = {
        ...prev.attributes,
        [attributeName]: value
      };
      console.log(`✅ Novos atributos após atualização:`, newAttributes);
      return {
        ...prev,
        attributes: newAttributes
      };
    });
  };

  // Função para renderizar campo de atributo baseado no tipo
  const renderAttributeField = (attr) => {
    // Buscar valor do atributo, tratando diferentes formatos
    let value = formData.attributes?.[attr.name];
    
    console.log(`🎨 Renderizando campo ${attr.name} (tipo: ${attr.type})`);
    console.log(`   Valor bruto do formData:`, value, `(tipo: ${typeof value})`);
    console.log(`   formData.attributes completo:`, formData.attributes);
    
    // Tratamento especial para range
    if (attr.type === 'range') {
      if (value === undefined || value === null || value === '') {
        value = { min: '', max: '' };
      } else if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          value = { min: '', max: '' };
        }
      } else if (typeof value !== 'object') {
        value = { min: '', max: '' };
      }
      // Garantir que tem min e max
      value = {
        min: value.min !== undefined && value.min !== null ? String(value.min) : '',
        max: value.max !== undefined && value.max !== null ? String(value.max) : ''
      };
      console.log(`   Range final:`, value);
    } else {
      // Para outros tipos, usar string vazia se não tiver valor
      if (value === undefined || value === null || value === '') {
        value = '';
      } else {
        value = String(value);
      }
      console.log(`   Valor final (não-range):`, value);
    }
    
    // Parse options com tratamento de erro
    let options = [];
    if (attr.options) {
      try {
        if (typeof attr.options === 'string') {
          options = JSON.parse(attr.options);
        } else if (Array.isArray(attr.options)) {
          options = attr.options;
        }
      } catch (error) {
        console.error(`Erro ao fazer parse das opções do atributo ${attr.name}:`, error);
        options = [];
      }
    }
    
    // IMPORTANTE: Se o atributo tem opções definidas, SEMPRE usar select/multi-select
    // Isso evita erros de digitação e garante consistência dos dados
    const hasOptions = options.length > 0;
    
    switch (attr.type) {
      case 'select':
        return (
          <Select
            value={String(value || '')}
            onValueChange={(val) => handleAttributeChange(attr.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${attr.label || attr.name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.length > 0 ? (
                options.map((opt, idx) => (
                  <SelectItem key={idx} value={String(opt)}>
                    {String(opt)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>Nenhuma opção disponível</SelectItem>
              )}
            </SelectContent>
          </Select>
        );
      
      case 'multi-select':
        const selectedValues = Array.isArray(value) ? value : (value ? [String(value)] : []);
        return (
          <div className="space-y-2 border rounded-md p-3">
            {options.length > 0 ? (
              options.map((opt, idx) => {
                const optValue = String(opt);
                const isSelected = selectedValues.includes(optValue);
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${attr.name}-${idx}`}
                      checked={isSelected}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, optValue]
                          : selectedValues.filter(v => v !== optValue);
                        handleAttributeChange(attr.name, newValues);
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor={`${attr.name}-${idx}`} className="text-sm cursor-pointer">
                      {optValue}
                    </label>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">Nenhuma opção disponível</p>
            )}
          </div>
        );
      
      case 'range':
        let rangeValue = { min: '', max: '' };
        if (typeof value === 'object' && value !== null) {
          rangeValue = { min: value.min || '', max: value.max || '' };
        } else if (value) {
          // Se for string, tentar parsear
          try {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            if (typeof parsed === 'object' && parsed !== null) {
              rangeValue = { min: parsed.min || '', max: parsed.max || '' };
            }
          } catch {
            // Se não conseguir parsear, usar valor vazio
          }
        }
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Mínimo"
                value={rangeValue.min}
                onChange={(e) => handleAttributeChange(attr.name, {
                  ...rangeValue,
                  min: e.target.value
                })}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Máximo"
                value={rangeValue.max}
                onChange={(e) => handleAttributeChange(attr.name, {
                  ...rangeValue,
                  max: e.target.value
                })}
              />
            </div>
          </div>
        );
      
      case 'text':
      default:
        // Se tem opções definidas, usar select mesmo que o tipo seja "text"
        // Isso evita erros de digitação e garante consistência
        if (hasOptions) {
          return (
            <Select
              value={String(value || '')}
              onValueChange={(val) => handleAttributeChange(attr.name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${attr.label || attr.name}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt, idx) => (
                  <SelectItem key={idx} value={String(opt)}>
                    {String(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        // Se não tem opções, permitir digitação livre
        return (
          <Input
            type="text"
            id={`attr-${attr.name}`}
            placeholder={`Digite ${attr.label || attr.name}`}
            value={String(value || '')}
            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
          />
        );
    }
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
      let priceValue;
      if (typeof formData.price === 'string' && formData.price.trim() !== '') {
        // Se for string, pode estar formatada ou ser número como string
        if (formData.price.includes(',') || formData.price.includes('.')) {
          // Se tiver vírgula ou ponto, usar parseCurrency
          priceValue = parseCurrency(formData.price);
        } else {
          // Se não tiver, é número como string
          priceValue = parseFloat(formData.price);
        }
      } else if (typeof formData.price === 'number') {
        priceValue = formData.price;
      } else {
        priceValue = parseFloat(formData.price) || null;
      }
      
      // Garantir que o preço seja um número válido
      if (priceValue === null || isNaN(priceValue) || priceValue <= 0) {
        setError("Preço válido é obrigatório. Exemplo: R$ 10,50");
        setSaving(false);
        return;
      }
      
      // Processar compare_price da mesma forma
      let comparePriceValue = null;
      if (formData.compare_price && formData.compare_price !== '') {
        // Sempre usar parseCurrency para garantir conversão correta (remove pontos, trata vírgula)
        if (typeof formData.compare_price === 'string') {
          comparePriceValue = parseCurrency(formData.compare_price);
        } else if (typeof formData.compare_price === 'number') {
          comparePriceValue = formData.compare_price;
        } else {
          // Tentar converter para string e depois parse
          comparePriceValue = parseCurrency(String(formData.compare_price));
        }
        
        // Validar se o valor é válido
        if (comparePriceValue === null || isNaN(comparePriceValue) || comparePriceValue <= 0) {
          comparePriceValue = null;
        }
      }
      
      console.log("💾 Compare price processado:", {
        original: formData.compare_price,
        tipo: typeof formData.compare_price,
        convertido: comparePriceValue
      });

      // Calcular estoque - garantir que seja número ou null
      let stockValue = null;
      if (formData.stock) {
        const parsed = parseInt(formData.stock);
        stockValue = isNaN(parsed) ? null : parsed;
      }
      
      console.log("Estoque sendo salvo:", stockValue, "Tipo:", typeof stockValue);
      console.log("Categoria selecionada:", formData.category);

      // Processar especificações técnicas (formato: "chave: valor" por linha)
      let technicalSpecsObj = {};
      if (formData.technical_specs) {
        formData.technical_specs.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && trimmed.includes(':')) {
            const [key, ...valueParts] = trimmed.split(':');
            technicalSpecsObj[key.trim()] = valueParts.join(':').trim();
          }
        });
      }
      
      // Processar itens inclusos (um por linha)
      const includedItemsArray = formData.included_items
        ? formData.included_items.split('\n').map(item => item.trim()).filter(item => item)
        : [];
      
      // Processar atributos dinâmicos
      const attributes = formData.attributes || {};
      console.log("💾 Atributos antes da limpeza:", attributes);
      console.log("💾 Tipo dos atributos:", typeof attributes);
      
      // Buscar tipos de atributos para validação correta
      const attributeTypes = {};
      categoryAttributes.forEach(attr => {
        attributeTypes[attr.name] = attr.type;
      });
      
      // Remover atributos vazios antes de salvar
      const cleanedAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([key, value]) => {
          const attrType = attributeTypes[key];
          
          // Para range, verificar se min e max estão preenchidos
          if (attrType === 'range' && typeof value === 'object' && value !== null) {
            const hasMin = value.min !== undefined && value.min !== null && String(value.min).trim() !== '';
            const hasMax = value.max !== undefined && value.max !== null && String(value.max).trim() !== '';
            const isValid = hasMin || hasMax;
            console.log(`  - Range ${key}: min=${value.min}, max=${value.max}, válido=${isValid}`);
            return isValid;
          }
          
          // Para outros tipos
          if (value === null || value === undefined || value === '') {
            console.log(`  - ${key}: vazio/null/undefined - removendo`);
            return false;
          }
          if (Array.isArray(value) && value.length === 0) {
            console.log(`  - ${key}: array vazio - removendo`);
            return false;
          }
          if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
            console.log(`  - ${key}: objeto vazio - removendo`);
            return false;
          }
          console.log(`  - ${key}: ${value} (tipo: ${typeof value}) - mantendo`);
          return true;
        })
      );
      
      console.log("💾 Atributos limpos para salvar:", cleanedAttributes);
      console.log("💾 Quantidade de atributos limpos:", Object.keys(cleanedAttributes).length);
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        price: priceValue,
        compare_price: (comparePriceValue !== null && !isNaN(comparePriceValue) && comparePriceValue > 0) ? comparePriceValue : null,
        category_id: formData.category && formData.category !== "" ? formData.category : null, // Backend espera category_id, não category
        images: Array.isArray(formData.images) ? formData.images : [],
        tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag) : [],
        stock: stockValue,
        technical_specs: Object.keys(technicalSpecsObj).length > 0 ? JSON.stringify(technicalSpecsObj) : null,
        included_items: includedItemsArray.length > 0 ? JSON.stringify(includedItemsArray) : null,
        warranty_info: formData.warranty_info?.trim() || null,
        attributes: Object.keys(cleanedAttributes).length > 0 ? JSON.stringify(cleanedAttributes) : null
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
        navigate("/loja/produtos");
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
            onClick={() => navigate("/loja/produtos")}
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                        <Input
                          id="price"
                          type="text"
                          value={(() => {
                            // Se está editando, usar o valor formatado em tempo real (já sem R$)
                            if (editingPriceField === 'price') {
                              const val = formData.price || '';
                              // Garantir que não tenha R$ e esteja formatado corretamente
                              return String(val).replace(/[R$\s]/g, '');
                            }
                            // Se é número, formatar corretamente
                            if (typeof formData.price === 'number') {
                              const formatted = formatPriceForInput(formData.price);
                              return String(formatted).replace(/[R$\s]/g, '');
                            }
                            // Se é string, garantir formatação correta
                            const val = formData.price || '';
                            if (!val) return '';
                            // Sempre usar formatPriceForInput para garantir formatação correta
                            // Isso converte formato americano (20220.00) para brasileiro (20.220,00)
                            const formatted = formatPriceForInput(val);
                            return String(formatted).replace(/[R$\s]/g, '');
                          })()}
                          onChange={(e) => handlePriceChange(e, 'price')}
                          onBlur={(e) => handlePriceBlur(e, 'price')}
                          className="pl-10"
                          placeholder="0,00"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Digite o valor (ex: 20000000 ou 20000000,00). Será formatado automaticamente.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="compare_price">Preço Original (opcional)</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                        <Input
                          id="compare_price"
                          type="text"
                          value={(() => {
                            // Se está editando, usar o valor formatado em tempo real (já sem R$)
                            if (editingPriceField === 'compare_price') {
                              const val = formData.compare_price || '';
                              // Garantir que não tenha R$ e esteja formatado corretamente
                              return String(val).replace(/[R$\s]/g, '');
                            }
                            // Se é número, formatar corretamente
                            if (typeof formData.compare_price === 'number') {
                              const formatted = formatPriceForInput(formData.compare_price);
                              return String(formatted).replace(/[R$\s]/g, '');
                            }
                            // Se é string, garantir formatação correta
                            const val = formData.compare_price || '';
                            if (!val) return '';
                            // Sempre usar formatPriceForInput para garantir formatação correta
                            // Isso converte formato americano (3122.00) para brasileiro (3.122,00)
                            const formatted = formatPriceForInput(val);
                            return String(formatted).replace(/[R$\s]/g, '');
                          })()}
                          onChange={(e) => handlePriceChange(e, 'compare_price')}
                          onBlur={(e) => handlePriceBlur(e, 'compare_price')}
                          className="pl-10"
                          placeholder="0,00"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Preço antes do desconto, será exibido riscado. Digite o valor (ex: 20000000 ou 20000000,00).
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
                
                {/* Seção de Atributos Dinâmicos da Categoria */}
                {categoryAttributes.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                        <LayoutGrid className="w-5 h-5 text-blue-600" />
                        Atributos da Categoria
                      </h3>
                      
                      <div className="space-y-4">
                        {categoryAttributes.map((attr) => {
                          const currentValue = formData.attributes?.[attr.name];
                          return (
                            <div key={attr.id} className="grid gap-2 p-4 border rounded-lg bg-gray-50">
                              <Label htmlFor={`attr-${attr.name}`} className="font-medium">
                                {attr.label || attr.name}
                                {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                              {renderAttributeField(attr)}
                              {attr.type === 'range' && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {attr.name === 'year' && 'Exemplo: De 2015 até 2024'}
                                  {attr.name === 'mileage' && 'Exemplo: De 0 km até 80.000 km'}
                                  {!['year', 'mileage'].includes(attr.name) && 'Digite os valores mínimo e máximo'}
                                </p>
                              )}
                              {currentValue && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Valor preenchido
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Separator />
                  </>
                )}
                
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-blue-600" />
                    Informações Detalhadas
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="technical_specs">Especificações Técnicas</Label>
                      <Textarea 
                        id="technical_specs" 
                        name="technical_specs" 
                        value={formData.technical_specs} 
                        onChange={handleChange} 
                        placeholder="Digite uma especificação por linha no formato: Nome: Valor"
                        rows={6}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Exemplo: Dimensões: 30x20x15 cm | Peso: 2,5 kg | Material: Alumínio
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="included_items">Itens Inclusos</Label>
                      <Textarea 
                        id="included_items" 
                        name="included_items" 
                        value={formData.included_items} 
                        onChange={handleChange} 
                        placeholder="Digite um item por linha"
                        rows={6}
                      />
                      <p className="text-xs text-gray-500">
                        Exemplo: 01 Produto principal | 01 Manual | 01 Cabo de energia
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="warranty_info">Informações de Garantia</Label>
                      <Textarea 
                        id="warranty_info" 
                        name="warranty_info" 
                        value={formData.warranty_info} 
                        onChange={handleChange} 
                        placeholder="Descreva as informações de garantia do produto..."
                        rows={4}
                      />
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
              onClick={() => navigate("/loja/produtos")}
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
