
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Subscription } from "@/api/entities";
import { Plan } from "@/api/entities";
import { Product } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";  
import { 
  Store as StoreIcon, 
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// Importar layout e páginas
import StoreLayout from "../components/store/StoreLayout";
import StoreDashboardPage from "./store/StoreDashboardPage";
import StoreProductsPage from "./store/StoreProductsPage";
import StoreOrdersPage from "./store/StoreOrdersPage";
import StoreSubscriptionPage from "./store/StoreSubscriptionPage";
import StoreAnalyticsPage from "./store/StoreAnalyticsPage";
import StoreMarketingPage from "./store/StoreMarketingPage";
import StoreSettingsPage from "./store/StoreSettingsPage";
import StoreOnlinePage from "./store/StoreOnlinePage";
import BecomeSeller from "../components/store/BecomeSeller";
import StoreCampaignsPage from "./store/StoreCampaignsPage";
import StoreCustomLinkPage from "./store/StoreCustomLinkPage";

const LoadingFallback = () => (
  <div className="p-8 flex justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export const pagePermissions = {
  public: true,
  loginRequired: false
};

export default function StoreProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  
  console.log("🎨 StoreProfile: Renderizando componente", { 
    loading, 
    hasStore: !!store, 
    hasUser: !!user,
    pathname: location.pathname,
    error: error?.message || null
  });
  
  // Proteção contra renderização com erro não tratado
  if (error && !error.handled) {
    console.error("❌ StoreProfile: Erro não tratado detectado:", error);
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro ao carregar sua loja:</strong>
              <br />
              {error.message || "Erro desconhecido"}
              <br />
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Recarregar Página
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  // Determinar qual página mostrar baseado na rota
  const getCurrentPage = () => {
    const path = location.pathname;
    
    // Mapear rotas para páginas
    if (path.includes('/produtos') || path.includes('/products')) return 'products';
    if (path.includes('/pedidos') || path.includes('/orders')) return 'orders';
    if (path.includes('/estatisticas') || path.includes('/analytics')) return 'analytics';
    if (path.includes('/marketing')) return 'marketing';
    if (path.includes('/campanhas') || path.includes('/campaigns')) return 'campaigns';
    if (path.includes('/assinatura') || path.includes('/subscription')) return 'subscription';
    if (path.includes('/configuracoes') || path.includes('/settings')) return 'settings';
    if (path.includes('/online')) return 'online';
    if (path.includes('/link-personalizado') || path.includes('/custom-link')) return 'custom-link';
    if (path.includes('/dashboard') || path.includes('/perfil') || path.includes('/profile')) return 'dashboard';
    
    // Fallback para query params (compatibilidade)
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('page') || 'dashboard';
  };
  
  useEffect(() => {
    loadData();
    
    // Ouvir mudanças de autenticação
    const handleAuthChange = () => {
      loadData();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  const loadData = async () => {
    console.log("🔄 StoreProfile: Iniciando loadData...");
    setLoading(true);
    setError("");
    
    try {
      // Tentar obter usuário, mas não bloquear se não estiver logado
      let userData = null;
      try {
        userData = await User.me();
        console.log("✅ StoreProfile: Usuário autenticado:", userData?.email);
      setUser(userData);
      } catch (authError) {
        // Usuário não está logado - continuar sem bloquear
        console.log("ℹ️ StoreProfile: Usuário não autenticado");
        setUser(null);
        setStore(null);
        setLoading(false);
        return; // Retornar aqui para mostrar tela de cadastro sem loja
      }

      let stores = [];
      let plans = [];
      
      try {
        stores = await Store.list();
        plans = await Plan.list();
      } catch (apiError) {
        console.error("Erro na API:", apiError);
        setError("Erro ao carregar dados. Tente novamente.");
        setLoading(false);
        return;
      }
      
      // Buscar loja pelo user_id
      const userStore = stores.find(s => s.user_id === userData.id);
      
      console.log("Loja encontrada:", userStore);
      console.log("Plan ID da loja:", userStore?.plan_id);
      console.log("Todos os planos disponíveis:", plans.map(p => ({ id: p.id, name: p.name })));

      if (userStore) {
        setStore(userStore);
        
        try {
          const subscriptions = await Subscription.filter({ store_id: userStore.id });
          console.log("Assinaturas encontradas:", subscriptions);
          
          let productsData = [];
          
          try {
            // Usar filtro direto na API em vez de carregar todos os produtos
            productsData = await Product.filter({ 
              store_id: userStore.id 
            });
            console.log("Produtos carregados para a loja:", productsData.length);
          } catch (filterError) {
            console.error("Erro ao carregar produtos:", filterError);
            productsData = [];
          }
          
          console.log("Produtos da loja (processamento inicial):", productsData.length);
          
          productsData = productsData.map(product => {
            return {
              ...product,
              total_views: product.total_views || 0,
              total_messages: product.total_messages || 0,
              total_favorites: product.total_favorites || 0
            };
          });
          
          console.log("Produtos com métricas processados:", productsData.length);
          setProducts(productsData || []);
          
          // Buscar plano: primeiro da assinatura ativa, depois do plan_id da loja
          const activeSubscription = subscriptions?.find(s => s.status === "active") || subscriptions?.[0];
          console.log("Assinatura ativa encontrada:", activeSubscription);
          
          if (activeSubscription) {
            setSubscription(activeSubscription);
            const storePlan = plans.find(p => p.id === activeSubscription.plan_id);
            console.log("Plano encontrado pela assinatura:", storePlan);
            if (storePlan) {
              setPlan(storePlan);
            } else if (userStore.plan_id) {
              // Se não encontrar pela assinatura, buscar pelo plan_id da loja
              const storePlanFromId = plans.find(p => p.id === userStore.plan_id);
              console.log("Plano encontrado pelo plan_id da loja:", storePlanFromId);
              setPlan(storePlanFromId);
            }
          } else if (userStore.plan_id) {
            // Se não houver assinatura, buscar plano diretamente do plan_id da loja
            const storePlan = plans.find(p => p.id === userStore.plan_id);
            console.log("Plano encontrado diretamente do plan_id da loja (sem assinatura):", storePlan);
            setPlan(storePlan);
          } else {
            console.log("Nenhum plano encontrado - loja sem plan_id e sem assinatura");
          }
        } catch (dataError) {
          console.error("❌ StoreProfile: Erro ao carregar dados relacionados:", dataError);
        }
        console.log("✅ StoreProfile: Dados da loja carregados com sucesso");
      } else {
        console.log("ℹ️ StoreProfile: Nenhuma loja encontrada para o usuário");
      }
    } catch (error) {
      console.error("❌ StoreProfile: Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Verifique sua conexão e tente novamente.");
    } finally {
      console.log("✅ StoreProfile: loadData finalizado - setLoading(false)");
      setLoading(false);
      console.log("✅ StoreProfile: Estado após loadData", { 
        loading: false, 
        hasStore: !!store, 
        hasUser: !!user 
      });
    }
  };

  const handleCreateStore = () => {
    // Se não estiver logado, redirecionar para StoreSignup
    if (!user) {
      navigate(createPageUrl("StoreSignup"));
      return;
    }
    // Se estiver logado, abrir dialog de cadastro
    setSellerDialogOpen(true);
  };

  const navigateToHome = () => {
    navigate(createPageUrl("Home"));
  };

  const handleRetry = () => {
    loadData();
  };

  // Função helper para verificar se o modo loja online está ativo
  const isStoreOnlineActive = () => {
    // Verificar pelo ID do plano
    if (plan?.id === 'plan-enterprise') return true;
    // Verificar pelo slug do plano na assinatura
    if (subscription?.plan?.slug === 'enterprise') return true;
    // Verificar pelo slug do plano direto
    if (plan?.slug === 'enterprise') return true;
    return false;
  };

  const handleRefreshProducts = async () => {
    try {
      console.log("Atualizando produtos...");
      
      if (!store) {
        console.error("Não há loja para buscar produtos");
        return;
      }
      
      let refreshedProducts = [];
      
      try {
        // Usar filtro direto na API em vez de carregar todos os produtos
        refreshedProducts = await Product.filter({ 
          store_id: store.id 
        });
        console.log("Produtos atualizados:", refreshedProducts.length);
      } catch (filterError) {
        console.error("Erro ao atualizar produtos:", filterError);
        refreshedProducts = [];
      }
      
      setProducts(refreshedProducts || []);
      
      if (refreshedProducts.length > 0 && products.length === 0) {
        setUseDirectProductLoader(true);
      }
      
    } catch (err) {
      console.error("Erro ao atualizar produtos:", err);
    }
  };

  if (loading) {
    console.log("🔄 StoreProfile: Carregando...");
    return <LoadingFallback />;
  }
  
  console.log("📊 StoreProfile: Estado atual", { 
    loading, 
    error, 
    hasUser: !!user, 
    hasStore: !!store,
    storeStatus: store?.status,
    location: location.pathname
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex-1">{error}</AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-2 bg-white"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Tentar Novamente
            </Button>
          </Alert>
          
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={navigateToHome} 
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Button 
            variant="outline" 
            onClick={navigateToHome} 
            className="flex items-center mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
          </Button>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="max-w-xl mx-auto text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <StoreIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Comece a Vender</h1>
              <p className="text-gray-600 mb-8">
                {user 
                  ? "Você ainda não tem uma loja no NATIVO. Cadastre sua loja e comece a vender seus produtos hoje mesmo."
                  : "Para cadastrar sua loja, você precisa fazer login ou criar uma conta. Vamos começar?"
                }
              </p>
              
              <Button 
                onClick={handleCreateStore}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <StoreIcon className="w-4 h-4 mr-2" />
                {user ? "Cadastrar Loja" : "Fazer Login e Cadastrar Loja"}
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <BecomeSeller 
              onClose={() => setSellerDialogOpen(false)}
              onSuccess={() => {
                setSellerDialogOpen(false);
                loadData();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Verificar se a loja está aprovada
  // Permitir acesso às configurações mesmo quando pendente
  const currentPage = getCurrentPage();
  const isSettingsPage = currentPage === 'settings';
  
  if (store.status !== 'approved' && !isSettingsPage) {
    const isPending = store.status === 'pending';
    const isRejected = store.status === 'rejected';

  return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
              <Button 
            variant="outline" 
                onClick={navigateToHome}
            className="flex items-center mb-8"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
              </Button>
              
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="max-w-xl mx-auto text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                isPending ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {isPending ? (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
            </div>
            
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {isPending 
                  ? "Aguardando Aprovação" 
                  : "Loja Rejeitada"
                }
              </h1>
              
              <p className="text-gray-600 mb-6">
                {isPending 
                  ? "Sua loja está aguardando aprovação do administrador. Você receberá uma notificação assim que sua loja for aprovada e estiver disponível para vender."
                  : "Sua loja foi rejeitada. Entre em contato com o administrador para mais informações."
                }
              </p>
              
              {isPending && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-blue-800">
                    <strong>Enquanto isso:</strong> Você pode editar as informações da sua loja acessando as configurações, mas ela só ficará visível para os clientes após a aprovação.
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={navigateToHome}
                >
                  Voltar para Home
                </Button>
                {isPending && (
                <Button
                    onClick={() => {
                      // Permitir acesso às configurações mesmo pendente
                      navigate("/loja/configuracoes");
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Ver Configurações
                  </Button>
                )}
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar página baseada na URL
  const renderPage = () => {
    try {
      const page = getCurrentPage();
      console.log("📄 StoreProfile: Renderizando página:", page, "pathname:", location.pathname);
      
      // Proteção: se não houver store e não for página de configurações, mostrar mensagem
      if (!store && page !== 'settings') {
        console.warn("⚠️ StoreProfile: Tentando renderizar página sem loja:", page);
        // Isso será tratado no bloco de renderização principal
      }
      
      let pageComponent = null;
      
      try {
        switch (page) {
          case 'products':
            pageComponent = <StoreProductsPage store={store} products={products} onProductsChange={loadData} />;
            break;
          case 'orders':
            pageComponent = <StoreOrdersPage />;
            break;
          case 'subscription':
            pageComponent = <StoreSubscriptionPage store={store} subscription={subscription} plan={plan} />;
            break;
          case 'analytics':
            pageComponent = <StoreAnalyticsPage store={store} products={products} />;
            break;
          case 'marketing':
            pageComponent = <StoreMarketingPage store={store} products={products} />;
            break;
          case 'campaigns':
            pageComponent = <StoreCampaignsPage store={store} products={products} />;
            break;
          case 'custom-link':
            pageComponent = <StoreCustomLinkPage store={store} onUpdate={loadData} />;
            break;
          case 'settings':
            pageComponent = <StoreSettingsPage store={store} user={user} subscription={subscription} plan={plan} onUpdate={loadData} />;
            break;
          case 'online':
            pageComponent = <StoreOnlinePage store={store} plan={plan} subscription={subscription} isStoreOnlineActive={isStoreOnlineActive()} />;
            break;
          case 'dashboard':
          default:
            console.log("📊 StoreProfile: Criando StoreDashboardPage", { 
              hasStore: !!store, 
              productsCount: products?.length 
            });
            pageComponent = <StoreDashboardPage store={store} products={products} plan={plan} isStoreOnlineActive={isStoreOnlineActive()} />;
            break;
        }
      } catch (componentError) {
        console.error("❌ StoreProfile: Erro ao criar componente da página:", componentError);
        console.error("❌ StoreProfile: Stack trace do componente:", componentError.stack);
        return (
          <div className="p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao criar componente da página: {page}
                <br />
                <small>{componentError.message}</small>
                </AlertDescription>
              </Alert>
          </div>
        );
      }
      
      console.log("✅ StoreProfile: Componente da página criado:", pageComponent ? "Sim" : "Não");
      
      if (!pageComponent) {
        console.error("❌ StoreProfile: pageComponent é null/undefined para página:", page);
        return (
          <div className="p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro: Componente da página não pôde ser criado.
              </AlertDescription>
            </Alert>
      </div>
        );
      }
      
      return pageComponent;
    } catch (error) {
      console.error("❌ StoreProfile: Erro ao renderizar página:", error);
      console.error("❌ StoreProfile: Stack trace:", error.stack);
      return (
        <div className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar a página. Por favor, recarregue a página.
              <br />
              <small>{error.message}</small>
            </AlertDescription>
          </Alert>
                </div>
      );
    }
  };

  // Garantir que sempre há algo para renderizar
  if (!store) {
    // Se chegou aqui sem store, mostrar tela de cadastro
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
                <Button
                  variant="outline"
            onClick={navigateToHome} 
            className="flex items-center mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
                </Button>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="max-w-xl mx-auto text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <StoreIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Comece a Vender</h1>
              <p className="text-gray-600 mb-8">
                {user 
                  ? "Você ainda não tem uma loja no NATIVO. Cadastre sua loja e comece a vender seus produtos hoje mesmo."
                  : "Para cadastrar sua loja, você precisa fazer login ou criar uma conta. Vamos começar?"
                }
              </p>
              
              <Button 
                onClick={handleCreateStore}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <StoreIcon className="w-4 h-4 mr-2" />
                {user ? "Cadastrar Loja" : "Fazer Login e Cadastrar Loja"}
              </Button>
              </div>
              </div>
            </div>

      <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <BecomeSeller 
            onClose={() => setSellerDialogOpen(false)}
            onSuccess={() => {
              setSellerDialogOpen(false);
              loadData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
  }

  console.log("🎯 StoreProfile: Renderizando StoreLayout", { 
    hasStore: !!store, 
    hasPlan: !!plan,
    isStoreOnlineActive: isStoreOnlineActive(),
    storeName: store?.name,
    productsCount: products?.length
  });
  
  let pageContent = null;
  try {
    pageContent = renderPage();
    console.log("📦 StoreProfile: Conteúdo da página:", pageContent ? "Criado" : "NULL/UNDEFINED");
  } catch (renderPageError) {
    console.error("❌ StoreProfile: Erro ao chamar renderPage():", renderPageError);
    console.error("❌ StoreProfile: Stack trace:", renderPageError.stack);
    pageContent = (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao renderizar página: {renderPageError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!pageContent) {
    console.error("❌ StoreProfile: renderPage() retornou null/undefined!");
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro: A página não pôde ser renderizada. Por favor, recarregue a página.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  try {
    console.log("🎯 StoreProfile: Tentando renderizar StoreLayout com pageContent");
    const layout = (
      <StoreLayout 
        store={store} 
        plan={plan} 
        isStoreOnlineActive={isStoreOnlineActive()}
      >
        {pageContent}
      </StoreLayout>
    );
    console.log("✅ StoreProfile: StoreLayout criado com sucesso");
    return layout;
  } catch (renderError) {
    console.error("❌ StoreProfile: Erro ao renderizar StoreLayout:", renderError);
    console.error("❌ StoreProfile: Stack trace:", renderError.stack);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao renderizar a página. Por favor, recarregue a página.
              <br />
              <small>{renderError.message}</small>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
}
