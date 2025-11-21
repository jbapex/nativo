
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Category } from "@/api/entities";
import { City } from "@/api/entities";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAndApplyPromotionsMultiStore } from "@/utils/promotions";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; 
import { Store as StoreIcon, AlertCircle, MapPin, X } from "lucide-react"; 
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

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [category, setCategory] = useState(searchParams.get("category") || "todos");
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
  const navigate = useNavigate();

  useEffect(() => {
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
    
    // Ouvir mudanças de autenticação
    const handleAuthChange = () => {
      loadInitialData();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  // Recarregar produtos quando cidade mudar
  useEffect(() => {
    if (allCities.length > 0 && !loading) {
      loadProducts();
    }
  }, [selectedCityId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      try {
        const userData = await User.me();
        setIsAuthenticated(true);
        setUser(userData);
      } catch (authError) {
        console.log("Usuário não autenticado");
        setIsAuthenticated(false);
      }

      // Carregar cidades
      try {
        const citiesData = await City.filter({ active: true });
        setAllCities(citiesData || []);
      } catch (citiesError) {
        console.error("Erro ao carregar cidades:", citiesError);
      }

      // Carregar categorias
      try {
        const categoriesData = await Category.filter({ active: true });
        setAllCategories(categoriesData || []);
      } catch (categoriesError) {
        console.error("Erro ao carregar categorias:", categoriesError);
      }

      // Carregar produtos
      await loadProducts();

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
      
      console.log("Produtos carregados:", productsData?.length || 0);
      if (productsData && productsData.length > 0) {
        console.log("Exemplo de produto:", productsData[0]);
      }
      
      // Aplicar promoções aos produtos (produtos de múltiplas lojas)
      let productsWithPromos = productsData || [];
      if (productsWithPromos.length > 0) {
        productsWithPromos = await fetchAndApplyPromotionsMultiStore(productsWithPromos);
      }
      
      setProducts(productsWithPromos);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setProducts([]);
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

  const handleLoginSuccess = () => {
    loadInitialData(); // Recarregar dados após login
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
    
    // Produto deve estar ativo (active = true ou 1)
    const isActive = product.active === true || product.active === 1;
    
    return matchesSearch && matchesCategory && isActive;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
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
          onCategoryChange={setCategory}
          selectedCategory={category}
          categories={allCategories}
        />

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
                onSelect={setCategory} 
              />
            </motion.div>

            {featuredStores.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FeaturedStores stores={featuredStores} />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FeaturedProducts 
                products={products.filter(p => (p.active === true || p.active === 1) && p.featured).slice(0, 8)} 
              />
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 sm:p-8 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="max-w-3xl mx-auto text-center text-white">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4">
                  Seja um Lojista NATIVO
                </h2>
                <p className="text-sm sm:text-lg mb-4 sm:mb-6 text-blue-100">
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
              <Testimonials />
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
            <div className="mb-4 flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <MapPin className="w-3 h-3 mr-1" />
                Produtos de {getSelectedCityName()}
              </Badge>
              <span className="text-sm text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </span>
            </div>
          )}
          <ProductGrid 
            products={filteredProducts}
            loading={loading}
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
