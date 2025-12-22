
import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Category } from "@/api/entities";
import { City } from "@/api/entities";
import { Settings } from "@/api/entities-local";
import VisualColorEditor, { useVisualEditor } from "@/components/admin/VisualColorEditor";
import { applyAppearanceColors, applyFavicon } from "@/utils/applyColors";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAndApplyPromotionsMultiStore } from "@/utils/promotions";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; 
import { Store as StoreIcon, AlertCircle, MapPin, X, Megaphone } from "lucide-react"; 
import { createPageUrl } from "@/utils"; 
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import FeaturedProducts from "../components/home/FeaturedProducts";
import FeaturedStores from "../components/home/FeaturedStores";
import Categories from "../components/home/Categories";
import SearchBar from "../components/home/SearchBar";
import ProductGrid from "../components/products/ProductGrid";
import Hero from "../components/home/Hero";
import Testimonials from "../components/home/Testimonials";
import BecomeSeller from "../components/store/BecomeSeller";
import LoginDialog from "@/components/LoginDialog";
import PromotionalBanners from "../components/home/PromotionalBanners";
import CampaignsSection from "../components/home/CampaignsSection";
import { trackHome, trackCategory } from "@/utils/navigationTracker";

const DEFAULT_APPEARANCE = {
  primaryColor: "#2563eb",
  secondaryColor: "#06b6d4",
  accentColor: "#10b981",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  headerColor: "#ffffff",
  footerColor: "#f9fafb",
  buttonPrimaryColor: "#2563eb",
  buttonSecondaryColor: "#06b6d4",
  buttonTextColor: "#ffffff",
  linkColor: "#2563eb",
  linkHoverColor: "#1d4ed8",
  cardBackgroundColor: "#ffffff",
  cardBorderColor: "#e5e7eb",
  cardShadowColor: "rgba(0, 0, 0, 0.1)",
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#d1d5db",
  inputFocusColor: "#2563eb",
  textSecondaryColor: "#6b7280",
  textMutedColor: "#9ca3af",
  borderColor: "#e5e7eb",
  sectionBackgroundColor: "#f9fafb",
  badgePrimaryColor: "#2563eb",
  badgeSecondaryColor: "#06b6d4",
  badgeSuccessColor: "#10b981",
  badgeErrorColor: "#ef4444",
  badgeWarningColor: "#f59e0b",
  hoverColor: "rgba(37, 99, 235, 0.1)",
  focusRingColor: "#2563eb",
  logo: "",
  favicon: "",
  banners: [],
  homeSectionsOrder: []
};

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [showAllStores, setShowAllStores] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [category, setCategory] = useState(searchParams.get("category") || "todos");
  
  // Função para atualizar categoria e rastrear navegação
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    // Se não for "todos", rastrear a categoria
    if (newCategory !== "todos") {
      const selectedCategory = allCategories.find(c => c.id === newCategory || c.slug === newCategory);
      if (selectedCategory) {
        trackCategory(selectedCategory);
      }
    }
  };
  const [selectedCityId, setSelectedCityId] = useState(() => {
    // Carregar cidade salva do localStorage
    return localStorage.getItem('selectedCityId') || null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [showCampaignOnly, setShowCampaignOnly] = useState(false);
  const [appearanceSettings, setAppearanceSettings] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("appearanceSettings");
        if (cached) {
          return { ...DEFAULT_APPEARANCE, ...JSON.parse(cached) };
        }
      } catch (error) {
        console.warn("Não foi possível ler aparência em cache:", error);
      }
    }
    return { ...DEFAULT_APPEARANCE };
  });
  const navigate = useNavigate();
  const [isEditorActive, toggleEditor] = useVisualEditor();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verificar se deve mostrar todas as lojas
    const params = new URLSearchParams(window.location.search);
    setShowAllStores(params.get('featured_stores') === 'all');
    
    // Marcar que estamos na página Home (marketplace)
    sessionStorage.setItem('lastPageSource', 'marketplace');
    
    // Limpar modo loja premium quando entrar no Home nativo
    sessionStorage.removeItem('storeOnlineCustomizations');
    sessionStorage.removeItem('storeOnlineStoreId');
    sessionStorage.removeItem('storeOnlineStoreInfo');
    sessionStorage.removeItem('isInStoreOnline');
    
    // Disparar evento para que Layout saiba que saiu da loja premium
    window.dispatchEvent(new CustomEvent('storeOnlineExited'));
    
    loadInitialData();
    
    // Rastrear navegação na Home
    trackHome();
    
    // Ouvir mudanças de autenticação
    const handleAuthChange = () => {
      loadInitialData();
    };
    
    // Ouvir mudanças nas configurações de aparência
    const handleAppearanceChange = () => {
      loadInitialData();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('appearanceChanged', handleAppearanceChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('appearanceChanged', handleAppearanceChange);
    };
  }, []);

  // Escutar mudanças no estado do editor visual
  useEffect(() => {
    const handleEditorToggle = (e) => {
      const newState = e.detail?.active ?? false;
      if (newState !== isEditorActive) {
        toggleEditor(newState);
      }
    };

    window.addEventListener('visualEditorToggle', handleEditorToggle);
    return () => window.removeEventListener('visualEditorToggle', handleEditorToggle);
  }, [isEditorActive, toggleEditor]);

  // Desativar editor automaticamente se usuário não for admin ou não estiver logado
  // Mas apenas se os valores já foram carregados (não desativar durante o carregamento)
  useEffect(() => {
    // Só desativar se já tivermos certeza de que o usuário não é admin ou não está logado
    // Não desativar se ainda estamos carregando (loading = true)
    if (isEditorActive && !loading && isAuthenticated === false) {
      // Usuário explicitamente não está logado
      toggleEditor(false);
    } else if (isEditorActive && !loading && isAuthenticated === true && isAdmin === false) {
      // Usuário está logado mas não é admin
      toggleEditor(false);
    }
    // Se loading = true ou isAuthenticated/isAdmin ainda não foram definidos, não fazer nada
  }, [isAuthenticated, isAdmin, isEditorActive, toggleEditor, loading]);

  // Recarregar produtos quando cidade mudar (apenas se já tiver carregado inicialmente)
  const hasInitialLoadRef = useRef(false);
  
  useEffect(() => {
    if (hasInitialLoadRef.current && allCities.length > 0 && !loading) {
      loadProducts();
    }
  }, [selectedCityId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      // Preservar estado do editor visual antes de carregar dados
      const editorStateFromStorage = localStorage.getItem('visualEditorActive') === 'true';

      try {
        const userData = await User.me();
        setIsAuthenticated(true);
        setUser(userData);
        const userIsAdmin = userData.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        // Se o editor estava ativo e o usuário é admin, garantir que continue ativo
        if (editorStateFromStorage && userIsAdmin && !isEditorActive) {
          // Usar setTimeout para garantir que o estado seja atualizado após o setState
          setTimeout(() => {
            toggleEditor(true);
          }, 100);
        }
      } catch (authError) {
        console.log("Usuário não autenticado");
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        
        // Se o usuário não está autenticado, desativar o editor
        if (isEditorActive) {
          toggleEditor(false);
        }
      }

      // Carregar cidades
      try {
        const citiesData = await City.filter({ active: true });
        setAllCities(citiesData || []);
      } catch (citiesError) {
        console.error("❌ Erro ao carregar cidades:", citiesError);
        setAllCities([]);
      }

      // Carregar categorias
      try {
        const categoriesData = await Category.filter({ active: true });
        setAllCategories(categoriesData || []);
      } catch (categoriesError) {
        console.error("❌ Erro ao carregar categorias:", categoriesError);
        setAllCategories([]);
      }

      // Carregar produtos
      await loadProducts();
      hasInitialLoadRef.current = true;

      // Carregar lojas em destaque (não requer autenticação)
      try {
        const featuredStoresData = await Store.filter({ 
          featured: true, 
          status: "approved" 
        }, undefined, 5);
        setFeaturedStores(featuredStoresData || []);
      } catch (storeError) {
        console.error("Erro ao carregar lojas em destaque (não crítico):", storeError);
        setFeaturedStores([]);
      }

      // Se deve mostrar todas as lojas, carregar todas
      const params = new URLSearchParams(window.location.search);
      const shouldShowAll = params.get('featured_stores') === 'all';
      if (shouldShowAll) {
        try {
          const allStoresData = await Store.filter({ 
            status: "approved" 
          }, undefined, 50);
          setAllStores(allStoresData || []);
        } catch (storeError) {
          console.error("Erro ao carregar todas as lojas:", storeError);
          setAllStores([]);
        }
      }

      // Carregar configurações de aparência
      try {
        const allSettings = await Settings.getAll();
        
        // Função helper para garantir que valores de cor sempre sejam válidos
        const ensureColor = (value, defaultValue) => {
          return (value && value.trim() !== '') ? value : defaultValue;
        };
        
        // Mapear configurações de aparência
        const appearance = {
          primaryColor: ensureColor(allSettings.primary_color?.value, "#2563eb"),
          secondaryColor: ensureColor(allSettings.secondary_color?.value, "#06b6d4"),
          accentColor: ensureColor(allSettings.accent_color?.value, "#10b981"),
          backgroundColor: ensureColor(allSettings.background_color?.value, "#ffffff"),
          textColor: ensureColor(allSettings.text_color?.value, "#1f2937"),
          headerColor: ensureColor(allSettings.header_color?.value, "#ffffff"),
          footerColor: ensureColor(allSettings.footer_color?.value, "#f9fafb"),
          buttonPrimaryColor: ensureColor(allSettings.button_primary_color?.value, "#2563eb"),
          buttonSecondaryColor: ensureColor(allSettings.button_secondary_color?.value, "#06b6d4"),
          buttonTextColor: ensureColor(allSettings.button_text_color?.value, "#ffffff"),
          linkColor: ensureColor(allSettings.link_color?.value, "#2563eb"),
          linkHoverColor: ensureColor(allSettings.link_hover_color?.value, "#1d4ed8"),
          cardBackgroundColor: ensureColor(allSettings.card_background_color?.value, "#ffffff"),
          cardBorderColor: ensureColor(allSettings.card_border_color?.value, "#e5e7eb"),
          cardShadowColor: ensureColor(allSettings.card_shadow_color?.value, "rgba(0, 0, 0, 0.1)"),
          inputBackgroundColor: ensureColor(allSettings.input_background_color?.value, "#ffffff"),
          inputBorderColor: ensureColor(allSettings.input_border_color?.value, "#d1d5db"),
          inputFocusColor: ensureColor(allSettings.input_focus_color?.value, "#2563eb"),
          textSecondaryColor: ensureColor(allSettings.text_secondary_color?.value, "#6b7280"),
          textMutedColor: ensureColor(allSettings.text_muted_color?.value, "#9ca3af"),
          borderColor: ensureColor(allSettings.border_color?.value, "#e5e7eb"),
          sectionBackgroundColor: ensureColor(allSettings.section_background_color?.value, "#f9fafb"),
          badgePrimaryColor: ensureColor(allSettings.badge_primary_color?.value, "#2563eb"),
          badgeSecondaryColor: ensureColor(allSettings.badge_secondary_color?.value, "#06b6d4"),
          badgeSuccessColor: ensureColor(allSettings.badge_success_color?.value, "#10b981"),
          badgeErrorColor: ensureColor(allSettings.badge_error_color?.value, "#ef4444"),
          badgeWarningColor: ensureColor(allSettings.badge_warning_color?.value, "#f59e0b"),
          hoverColor: ensureColor(allSettings.hover_color?.value, "rgba(37, 99, 235, 0.1)"),
          focusRingColor: ensureColor(allSettings.focus_ring_color?.value, "#2563eb"),
          logo: allSettings.logo?.value || "",
          favicon: allSettings.favicon?.value || "",
          heroTitle: allSettings.hero_title?.value || "",
          heroSubtitle: allSettings.hero_subtitle?.value || "",
          heroImage: allSettings.hero_image?.value || "",
          heroStatsProducts: allSettings.hero_stats_products?.value || "",
          heroStatsVendors: allSettings.hero_stats_vendors?.value || "",
          heroStatsClients: allSettings.hero_stats_clients?.value || "",
          heroCardFree: allSettings.hero_card_free?.value || "",
          heroCardWhatsapp: allSettings.hero_card_whatsapp?.value || "",
          heroCardLocal: allSettings.hero_card_local?.value || "",
          banners: allSettings.banners?.value ? (() => {
            try {
              return JSON.parse(allSettings.banners.value);
            } catch {
              return [];
            }
          })() : [],
          homeSectionsOrder: allSettings.home_sections_order?.value ? (() => {
            try {
              return JSON.parse(allSettings.home_sections_order.value);
            } catch {
              return [];
            }
          })() : []
        };
        
        setAppearanceSettings(appearance);
        try {
          localStorage.setItem("appearanceSettings", JSON.stringify(appearance));
        } catch (error) {
          console.warn("Não foi possível salvar aparência em cache:", error);
        }
        
        // Aplicar todas as cores via CSS variables usando utilitário
        applyAppearanceColors(appearance);
        
        // Aplicar favicon se configurado
        if (appearance.favicon) {
          applyFavicon(appearance.favicon);
        }
      } catch (settingsError) {
        console.error("Erro ao carregar configurações de aparência (não crítico):", settingsError);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      console.error("Detalhes do erro:", {
        message: error?.message,
        stack: error?.stack,
        status: error?.status,
        response: error?.response
      });
      
      if (error?.message?.includes("Rate limit")) {
        setError("Sistema temporariamente indisponível. Tente novamente em alguns instantes.");
      } else if (error?.message?.includes("Network Error") || error?.message?.includes("Failed to fetch")) {
        setError("Erro de conexão. Verifique se o backend está rodando em http://localhost:3001");
      } else if (error?.message) {
        setError(`Erro: ${error.message}`);
      } else {
        setError("Não foi possível carregar os dados. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      // Construir filtros
      const filters = {};
      if (selectedCityId) {
        filters.city_id = selectedCityId;
      }
      
      const productsData = await Product.filter(filters, "-created_date", 50);
      
      // Aplicar promoções aos produtos (produtos de múltiplas lojas)
      let productsWithPromos = productsData || [];
      if (productsWithPromos.length > 0) {
        productsWithPromos = await fetchAndApplyPromotionsMultiStore(productsWithPromos);
      }
      
      setProducts(productsWithPromos);
    } catch (err) {
      console.error("❌ Erro ao carregar produtos:", err);
      console.error("❌ Detalhes do erro:", {
        message: err?.message,
        stack: err?.stack,
        status: err?.status,
        response: err?.response
      });
      setProducts([]);
      setError(`Erro ao carregar produtos: ${err?.message || 'Erro desconhecido'}`);
    }
  };

  const handleCityChange = (cityId) => {
    // Se for "all", remover filtro
    const finalCityId = cityId === "all" ? null : (cityId || null);
    setSelectedCityId(finalCityId);
    // Salvar no localStorage
    if (finalCityId) {
      localStorage.setItem('selectedCityId', finalCityId);
    } else {
      localStorage.removeItem('selectedCityId');
    }
  };

  // TODO: Futura integração com LLM/IA para busca inteligente
  // Esta função será expandida para:
  // 1. Processar a query do usuário com IA para entender a intenção
  // 2. Identificar o que o cliente realmente quer (produto específico, categoria, características, etc)
  // 3. Extrair parâmetros relevantes (preço, marca, cor, tamanho, etc)
  // 4. Aplicar filtros inteligentes baseados na análise da IA
  // 5. Retornar resultados mais relevantes e personalizados
  const handleSearch = async (query) => {
    // Por enquanto, busca simples por texto
    // No futuro, aqui será feita a chamada para a API de IA:
    // 
    // try {
    //   const aiResponse = await fetch('/api/ai/search', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ 
    //       query,
    //       context: {
    //         categories: allCategories,
    //         cityId: selectedCityId,
    //         userPreferences: user?.preferences
    //       }
    //     })
    //   });
    //   
    //   const { intent, extractedParams, suggestedFilters } = await aiResponse.json();
    //   
    //   // Aplicar filtros sugeridos pela IA
    //   if (suggestedFilters?.category) {
    //     setCategory(suggestedFilters.category);
    //   }
    //   if (suggestedFilters?.priceRange) {
    //     // Aplicar faixa de preço sugerida
    //   }
    //   
    //   // Usar query processada pela IA ou a original
    //   setSearchTerm(intent?.processedQuery || query);
    // } catch (error) {
    //   console.error('Erro ao processar busca com IA:', error);
    //   // Fallback para busca normal
    //   setSearchTerm(query);
    // }
    
    // Busca normal (atual)
    setSearchTerm(query);
  };

  const getSelectedCityName = () => {
    if (!selectedCityId) return null;
    const city = allCities.find(c => c.id === selectedCityId);
    return city ? `${city.name}${city.state ? ` - ${city.state}` : ''}` : null;
  };

  const handleLoginSuccess = async () => {
    // Aguardar um pouco para garantir que o token foi salvo
    await new Promise(resolve => setTimeout(resolve, 200));
    // Recarregar dados após login
    loadInitialData();
  };

  const handleSellerClick = () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }

    if (user?.role === "store") {
      navigate(createPageUrl("StoreProfile"));
      return;
    }

    setSellerDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm ? (
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : true;

    const matchesCategory = category === "todos" || 
      product.category_id === category || 
      product.category === category;
    
    // Filtro de campanha
    const matchesCampaign = !showCampaignOnly || product.campaign;
    
    // Produto deve estar ativo (active = true ou 1)
    const isActive = product.active === true || product.active === 1;
    
    return matchesSearch && matchesCategory && matchesCampaign && isActive;
  });

  const handleSettingsChange = (newSettings) => {
    setAppearanceSettings(newSettings);
    // Aplicar todas as cores via CSS variables usando utilitário
    applyAppearanceColors(newSettings);
    try {
      localStorage.setItem("appearanceSettings", JSON.stringify(newSettings));
    } catch (error) {
      console.warn("Não foi possível salvar aparência em cache:", error);
    }
  };

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: appearanceSettings.backgroundColor || "#f9fafb",
        color: appearanceSettings.textColor || "#1f2937"
      }}
    >
      {/* Mostrar editor visual apenas para admins logados */}
      {isEditorActive && isAuthenticated && isAdmin && (
        <VisualColorEditor
          appearanceSettings={appearanceSettings}
          onSettingsChange={handleSettingsChange}
          isActive={isEditorActive}
          onToggle={toggleEditor}
        />
      )}
      <Hero appearanceSettings={appearanceSettings} />
      
      <motion.div 
          className="w-full max-w-[95%] 2xl:max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
          {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex-1">{error}</AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadInitialData}
              className="ml-2 bg-white"
            >
              Tentar Novamente
            </Button>
          </Alert>
        )}

        {/* Banners Promocionais */}
        {appearanceSettings.banners && appearanceSettings.banners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <PromotionalBanners 
              banners={appearanceSettings.banners} 
              appearanceSettings={appearanceSettings}
            />
          </motion.div>
        )}

        {/* Seletor de Cidade */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 flex-1">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Filtrar por cidade
                </label>
                <Select value={selectedCityId || "all"} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecione uma cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {allCities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}{city.state ? ` - ${city.state}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedCityId && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                {getSelectedCityName()}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-blue-100"
                  onClick={() => handleCityChange(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
          </div>
        </motion.div>

        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          selectedCategory={category}
          categories={allCategories}
          appearanceSettings={appearanceSettings}
        />

        {/* Seção de Campanhas */}
        {!searchTerm && category === "todos" && (
          <CampaignsSection appearanceSettings={appearanceSettings} />
        )}

        {!searchTerm && category === "todos" && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden"
            >
              <Categories 
                categories={allCategories} 
                onSelect={handleCategoryChange}
                appearanceSettings={appearanceSettings}
              />
            </motion.div>

            {!showAllStores && featuredStores.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FeaturedStores stores={featuredStores} appearanceSettings={appearanceSettings} />
              </motion.div>
            )}
            
            {showAllStores && allStores.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FeaturedStores stores={allStores} appearanceSettings={appearanceSettings} />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FeaturedProducts 
                products={products.filter(p => (p.active === true || p.active === 1) && p.featured).slice(0, 8)}
                appearanceSettings={appearanceSettings}
              />
            </motion.div>

            <motion.div
              className="rounded-xl p-4 sm:p-8 mb-12"
              style={{
                background: `linear-gradient(to right, ${appearanceSettings.primaryColor || '#2563eb'}, ${appearanceSettings.secondaryColor || '#06b6d4'})`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="max-w-3xl mx-auto text-center text-white">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4">
                  Seja um Lojista NATIVO
                </h2>
                <p className="text-sm sm:text-lg mb-4 sm:mb-6"
                   style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Alcance mais clientes, aumente suas vendas e faça parte da maior rede de comércio local.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!isAuthenticated ? (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button 
                          onClick={() => {
                            setLoginPromptOpen(true);
                          }}
                          className="bg-white !text-gray-900 hover:bg-gray-50 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                          size="lg"
                        >
                          Fazer Login
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button 
                          onClick={() => navigate(createPageUrl("StoreSignup"))}
                          className="bg-white !text-gray-900 hover:bg-gray-50 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                          size="lg"
                        >
                          <StoreIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Cadastrar Minha Loja
                        </Button>
                      </motion.div>
                    </>
                  ) : user?.role === "store" ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                <Button 
                  onClick={handleSellerClick}
                        className="bg-white !text-gray-900 hover:bg-gray-100 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold border-2 border-transparent hover:border-blue-200"
                        size="lg"
                      >
                        Acessar Minha Loja
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Button 
                        onClick={() => navigate(createPageUrl("StoreSignup"))}
                        className="bg-white !text-gray-900 hover:bg-gray-50 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                        size="lg"
                >
                  <StoreIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Cadastrar Minha Loja
                </Button>
                    </motion.div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-blue-100 mt-4">
                  {!isAuthenticated 
                    ? "Crie sua conta e cadastre sua loja. Após o cadastro, sua loja precisará ser aprovada por um administrador."
                    : "Após o cadastro, sua loja precisará ser aprovada por um administrador antes de ficar visível."
                  }
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16"
            >
              <Testimonials appearanceSettings={appearanceSettings} />
            </motion.div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          {selectedCityId && (
            <div className="mb-4">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <MapPin className="w-3 h-3 mr-1" />
                Produtos de {getSelectedCityName()}
              </Badge>
            </div>
          )}
          <ProductGrid 
            products={filteredProducts}
            loading={loading}
            appearanceSettings={appearanceSettings}
            emptyMessage={
              selectedCityId
                ? `Nenhum produto encontrado em ${getSelectedCityName()}`
                : searchTerm
                ? "Nenhum produto encontrado para sua busca"
                : "Nenhum produto disponível nesta categoria"
            }
          />
        </motion.div>
      </motion.div>

      <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <BecomeSeller onClose={() => setSellerDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <LoginDialog 
        open={loginPromptOpen} 
        onOpenChange={setLoginPromptOpen}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
