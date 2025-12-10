
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Plan } from "@/api/entities";
import { City } from "@/api/entities";
import { Category } from "@/api/entities";
import { Settings } from "@/api/entities-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Check, Package, Store as StoreIcon, Info, Sparkles, Zap, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function StoreSignup() {
  const [step, setStep] = useState("planos");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCitiesCategories, setLoadingCitiesCategories] = useState(true);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    full_name: ""
  });
  const [storeData, setStoreData] = useState({
    store_name: "",
    store_description: "",
    store_type: "physical",
    whatsapp: "",
    city_id: "",
    category_id: "",
    has_physical_store: false
  });

  useEffect(() => {
    loadSettings();
    loadCitiesAndCategories();
    loadPlans();
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);
      // Preencher dados do usuário logado
      setAuthData({
        email: userData.email || "",
        password: "",
        full_name: userData.full_name || ""
      });
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const storeSignupSettings = await Settings.getAll('store_signup');
      setSettings(storeSignupSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadCitiesAndCategories = async () => {
    try {
      setLoadingCitiesCategories(true);
      const [citiesData, categoriesData] = await Promise.all([
        City.list(),
        Category.list()
      ]);
      setCities(citiesData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Erro ao carregar cidades e categorias:', error);
    } finally {
      setLoadingCitiesCategories(false);
    }
  };

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const plansData = await Plan.list();
      // Filtrar apenas planos ativos e ordenar por preço
      const activePlans = (plansData || [])
        .filter(plan => plan.active === true || plan.active === 1)
        .sort((a, b) => (a.price || 0) - (b.price || 0));
      setPlans(activePlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    
    // Se o usuário estiver logado, preencher dados automaticamente
    if (!isAuthenticated) {
      try {
        const userData = await User.me();
        setUser(userData);
        setIsAuthenticated(true);
        setAuthData({
          email: userData.email || "",
          password: "",
          full_name: userData.full_name || ""
        });
      } catch (error) {
        // Usuário não está logado, continuar normalmente
      }
    }
    
    setStep("cadastro");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar campos obrigatórios
      if (!storeData.city_id) {
        setError("Selecione uma cidade");
        setLoading(false);
        return;
      }
      
      if (!storeData.category_id) {
        setError("Selecione uma categoria");
        setLoading(false);
        return;
      }

      // Se já estiver logado, usar o usuário atual
      let currentUser;
      if (isAuthenticated && user) {
        currentUser = user;
      } else {
        // Tentar fazer login primeiro, se falhar, registrar novo usuário
        try {
          if (!authData.email || !authData.password) {
            setError("Email e senha são obrigatórios");
            setLoading(false);
            return;
          }
          currentUser = await User.login(authData.email, authData.password);
          setUser(currentUser);
          setIsAuthenticated(true);
        } catch (loginError) {
          // Se login falhar, tentar registrar
          if (!authData.full_name) {
            setError("Nome completo é necessário para registro");
            setLoading(false);
            return;
          }
          if (!authData.email || !authData.password) {
            setError("Email e senha são obrigatórios");
            setLoading(false);
            return;
          }
          currentUser = await User.register(authData.email, authData.password, authData.full_name);
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      }
      
      // Não precisamos atualizar o role aqui
      // O backend de stores.js já atualiza o role automaticamente quando a loja é criada
      // (linha 98-100 do backend/routes/stores.js)
      
      // Criar a loja
      const storeDataToCreate = {
        name: storeData.store_name,
        description: storeData.store_description,
        store_type: storeData.store_type,
        whatsapp: storeData.whatsapp,
        city_id: storeData.city_id,
        category_id: storeData.category_id,
        has_physical_store: storeData.has_physical_store,
        plan_id: selectedPlan?.id || null,
        status: "pending"
      };
      
      await Store.create(storeDataToCreate);

      window.location.href = createPageUrl("StoreProfile");
    } catch (error) {
      console.error("Erro ao cadastrar loja:", error);
      setError(error.message || "Erro ao cadastrar loja. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {settings.store_signup_title?.value || "Comece a vender online"}
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {settings.store_signup_subtitle?.value || "Escolha o melhor plano para o seu negócio"}
          </motion.p>
          
          {settings.store_signup_info?.value && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 max-w-2xl mx-auto"
            >
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  {settings.store_signup_info.value}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>

        <Tabs value={step} className="space-y-8">
          <TabsContent value="planos">
            {loadingPlans ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : plans.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum plano disponível no momento. Entre em contato com o administrador.
                </AlertDescription>
              </Alert>
            ) : (
              <div className={`grid gap-4 ${
                plans.length === 1 ? 'md:grid-cols-1 max-w-sm mx-auto' :
                plans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
                'md:grid-cols-3 max-w-5xl mx-auto'
              }`}>
                {plans.map((plan, index) => {
                  const features = Array.isArray(plan.features) ? plan.features : [];
                  const hasProductLimit = plan.product_limit !== null && plan.product_limit !== undefined;
                  
                  // Adicionar limite de produtos às features se existir
                  const displayFeatures = [...features];
                  if (hasProductLimit) {
                    if (plan.product_limit === 0 || plan.product_limit === null) {
                      displayFeatures.unshift("Produtos ilimitados");
                    } else {
                      displayFeatures.unshift(`Até ${plan.product_limit} produtos`);
                    }
                  }
                  
                  // Determinar se é plano popular (meio da lista) ou premium (mais caro)
                  const isPopular = plans.length >= 3 && index === Math.floor(plans.length / 2);
                  const isPremium = index === plans.length - 1 && plans.length > 1;
                  const isFree = plan.price === 0 || !plan.price;
                  
                  // Ícones por tipo de plano
                  const getPlanIcon = () => {
                    if (isFree) return <Package className="w-5 h-5" />;
                    if (isPremium) return <Crown className="w-5 h-5" />;
                    if (isPopular) return <Star className="w-5 h-5" />;
                    return <Zap className="w-5 h-5" />;
                  };
                  
                  // Cores do gradiente
                  const getGradientClass = () => {
                    if (isPremium) return 'from-purple-500 to-pink-500';
                    if (isPopular) return 'from-blue-500 to-cyan-500';
                    if (isFree) return 'from-gray-400 to-gray-500';
                    return 'from-blue-400 to-blue-600';
                  };
                  
                  return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="h-full"
                    >
                      <Card className={`relative h-full transition-all duration-300 ${
                        isPopular 
                          ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/20 scale-105' 
                          : isPremium
                          ? 'border-2 border-purple-500 shadow-xl shadow-purple-500/20'
                          : 'border border-gray-200 hover:border-gray-300 hover:shadow-lg'
                      }`}>
                        {/* Badge Popular */}
                        {isPopular && (
                          <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 z-10">
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-0.5 rounded-full text-[10px] font-semibold shadow-lg flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Mais Popular
                            </span>
                          </div>
                        )}
                        
                        {/* Badge Premium */}
                        {isPremium && !isPopular && (
                          <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 z-10">
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-0.5 rounded-full text-[10px] font-semibold shadow-lg flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5" />
                              Recomendado
                      </span>
                          </div>
                        )}
                        
                        <CardHeader className={`pb-3 ${
                          isPopular || isPremium 
                            ? `bg-gradient-to-br ${getGradientClass()} text-white rounded-t-lg` 
                            : 'bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${
                                isPopular || isPremium 
                                  ? 'bg-white/20 backdrop-blur-sm' 
                                  : 'bg-blue-100'
                              }`}>
                                <div className={isPopular || isPremium ? 'text-white' : 'text-blue-600'}>
                                  {getPlanIcon()}
                                </div>
                              </div>
                              <div>
                                <CardTitle className={`text-xl font-bold ${
                                  isPopular || isPremium ? 'text-white' : ''
                                }`}>
                        {plan.name}
                      </CardTitle>
                                <CardDescription className={`text-xs mt-0.5 ${
                                  isPopular || isPremium ? 'text-white/90' : ''
                                }`}>
                                  {isFree ? 'Perfeito para começar' : 'Ideal para crescer'}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`mt-3 pt-3 border-t ${
                            isPopular || isPremium ? 'border-white/20' : 'border-gray-200'
                          }`}>
                            <div className="flex items-baseline gap-1">
                              {plan.price === 0 || !plan.price ? (
                                <span className={`text-3xl font-bold ${
                                  isPopular || isPremium ? 'text-white' : 'text-gray-900'
                                }`}>
                                  Grátis
                                </span>
                        ) : (
                          <>
                                  <span className={`text-xs font-medium ${
                                    isPopular || isPremium ? 'text-white/80' : 'text-gray-500'
                                  }`}>
                                    R$
                                  </span>
                                  <span className={`text-3xl font-bold ${
                                    isPopular || isPremium ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {parseFloat(plan.price).toFixed(2).replace('.', ',')}
                            </span>
                                  <span className={`text-sm font-medium ${
                                    isPopular || isPremium ? 'text-white/80' : 'text-gray-500'
                                  }`}>
                            /mês
                                  </span>
                          </>
                        )}
                            </div>
                          </div>
                    </CardHeader>
                    
                        <CardContent className="pt-4 space-y-4">
                          {displayFeatures.length > 0 ? (
                            <ul className="space-y-2">
                              {displayFeatures.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs">
                                  <div className="mt-0.5 flex-shrink-0">
                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-green-600" />
                                    </div>
                                  </div>
                                  <span className="text-gray-700 leading-relaxed">
                                    {typeof feature === 'string' ? feature : JSON.stringify(feature)}
                                  </span>
                          </li>
                        ))}
                      </ul>
                          ) : (
                            <p className="text-xs text-gray-500">Sem recursos especificados</p>
                          )}
                      
                      <Button 
                            className={`w-full h-10 text-sm font-semibold transition-all duration-200 text-white shadow-md hover:shadow-lg ${
                              isPremium
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                : isPopular
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                                : isFree
                                ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                                : 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700'
                            }`}
                        onClick={() => handlePlanSelect(plan)}
                      >
                            {isPopular || isPremium ? 'Escolher Este Plano' : 'Escolher Plano'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                  );
                })}
            </div>
            )}
          </TabsContent>

          <TabsContent value="cadastro">
            <Card>
              <CardHeader>
                <CardTitle>{settings.store_signup_form_title?.value || "Dados da Loja"}</CardTitle>
                <CardDescription>
                  {settings.store_signup_form_description?.value || "Preencha as informações básicas da sua loja"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  
                  {!isAuthenticated && (
                    <div className="space-y-4 border-b pb-6">
                      <h3 className="font-semibold">Dados de Acesso</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            required
                            value={authData.email}
                            onChange={(e) => setAuthData({
                              ...authData,
                              email: e.target.value
                            })}
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Senha *</Label>
                          <Input
                            type="password"
                            required
                            value={authData.password}
                            onChange={(e) => setAuthData({
                              ...authData,
                              password: e.target.value
                            })}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Nome Completo (para novo cadastro)</Label>
                          <Input
                            value={authData.full_name}
                            onChange={(e) => setAuthData({
                              ...authData,
                              full_name: e.target.value
                            })}
                            placeholder="Seu nome completo"
                          />
                          <p className="text-xs text-gray-500">
                            Preencha apenas se for criar uma nova conta. Se já tiver conta, deixe em branco.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isAuthenticated && (
                    <div className="space-y-4 border-b pb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-900">Você está logado</h3>
                        </div>
                        <p className="text-sm text-blue-700">
                          Usando a conta: <strong>{authData.email}</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Preencha apenas os dados da loja abaixo.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nome da Loja</Label>
                      <Input
                        required
                        value={storeData.store_name}
                        onChange={(e) => setStoreData({
                          ...storeData,
                          store_name: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input
                        required
                        type="tel"
                        value={storeData.whatsapp}
                        onChange={(e) => setStoreData({
                          ...storeData,
                          whatsapp: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cidade *</Label>
                      <Select
                        required
                        value={storeData.city_id}
                        onValueChange={(value) => setStoreData({
                          ...storeData,
                          city_id: value
                        })}
                        disabled={loadingCitiesCategories}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCitiesCategories ? "Carregando..." : "Selecione uma cidade"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.length === 0 ? (
                            <SelectItem value="" disabled>
                              Nenhuma cidade cadastrada pelo administrador
                            </SelectItem>
                          ) : (
                            cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name} {city.state ? `- ${city.state}` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {cities.length === 0 && !loadingCitiesCategories && (
                        <p className="text-sm text-yellow-600">
                          O administrador precisa cadastrar cidades primeiro.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria *</Label>
                      <Select
                        required
                        value={storeData.category_id}
                        onValueChange={(value) => setStoreData({
                          ...storeData,
                          category_id: value
                        })}
                        disabled={loadingCitiesCategories}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCitiesCategories ? "Carregando..." : "Selecione uma categoria"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat.active).length === 0 ? (
                            <SelectItem value="" disabled>
                              Nenhuma categoria cadastrada pelo administrador
                            </SelectItem>
                          ) : (
                            categories.filter(cat => cat.active).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {categories.filter(cat => cat.active).length === 0 && !loadingCitiesCategories && (
                        <p className="text-sm text-yellow-600">
                          O administrador precisa cadastrar categorias primeiro.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Loja</Label>
                      <Select
                        value={storeData.store_type}
                        onValueChange={(value) => setStoreData({
                          ...storeData,
                          store_type: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Loja Física</SelectItem>
                          <SelectItem value="online">Loja Online</SelectItem>
                          <SelectItem value="both">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Descrição da Loja</Label>
                      <Input
                        required
                        value={storeData.store_description}
                        onChange={(e) => setStoreData({
                          ...storeData,
                          store_description: e.target.value
                        })}
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between">
                      <div>
                        <Label>Possui Loja Física?</Label>
                        <p className="text-sm text-gray-500">
                          Marque se você tem um ponto físico
                        </p>
                      </div>
                      <Switch
                        checked={storeData.has_physical_store}
                        onCheckedChange={(checked) => setStoreData({
                          ...storeData,
                          has_physical_store: checked
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("planos")}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Cadastrando..." : "Finalizar Cadastro"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
