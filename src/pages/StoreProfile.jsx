
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
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  
  // Determinar qual página mostrar baseado na URL
  const getCurrentPage = () => {
    const page = searchParams.get('page') || 'dashboard';
    return page;
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
    setLoading(true);
    setError("");
    
    try {
      // Tentar obter usuário, mas não bloquear se não estiver logado
      let userData = null;
      try {
        userData = await User.me();
        setUser(userData);
      } catch (authError) {
        // Usuário não está logado - continuar sem bloquear
        setUser(null);
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
          console.error("Erro ao carregar dados relacionados:", dataError);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
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
    return <LoadingFallback />;
  }

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
                      navigate(createPageUrl("StoreProfile") + "?page=settings");
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
    const page = getCurrentPage();
    
    switch (page) {
      case 'products':
        return <StoreProductsPage store={store} products={products} onProductsChange={loadData} />;
      case 'orders':
        return <StoreOrdersPage />;
      case 'subscription':
        return <StoreSubscriptionPage store={store} subscription={subscription} plan={plan} />;
      case 'analytics':
        return <StoreAnalyticsPage store={store} products={products} />;
      case 'marketing':
        return <StoreMarketingPage store={store} products={products} />;
      case 'settings':
        return <StoreSettingsPage store={store} user={user} subscription={subscription} plan={plan} onUpdate={loadData} />;
      case 'online':
        return isStoreOnlineActive() ? <StoreOnlinePage store={store} /> : null;
      case 'dashboard':
      default:
        return <StoreDashboardPage store={store} products={products} plan={plan} isStoreOnlineActive={isStoreOnlineActive()} />;
    }
  };

  return (
    <StoreLayout 
      store={store} 
      plan={plan} 
      isStoreOnlineActive={isStoreOnlineActive()}
    >
      {renderPage()}
    </StoreLayout>
  );
}
