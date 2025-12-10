import React from "react";
import Layout from "./Layout.jsx";

import Home from "./Home";

import StoreProfile from "./StoreProfile";

import AddProduct from "./AddProduct";

import ProductDetail from "./ProductDetail";

import AdminDashboard from "./AdminDashboard";

import AdminCities from "./AdminCities";

import AdminCategories from "./AdminCategories";

import AdminStores from "./AdminStores";

import Store from "./Store";

import AdminLogin from "./AdminLogin";

import AdminPlans from "./AdminPlans";

import AdminSubscriptions from "./AdminSubscriptions";

import AdminSettings from "./AdminSettings";

import AdminCampaigns from "./AdminCampaigns";
import CampaignPage from "./CampaignPage";

import StoreSignup from "./StoreSignup";

import AdminProducts from "./AdminProducts";

import ProductViewer from "./ProductViewer";

import StoreProductManagement from "./StoreProductManagement";

import UpgradePlan from "./UpgradePlan";

import StoreFront from "./StoreFront";

import StoreOnline from "./StoreOnline";
import StoreOnlineHome from "./StoreOnlineHome";
import Orders from "./Orders";
import OrderDetail from "./OrderDetail";
import MyPurchases from "./MyPurchases";
import Cart from "./Cart";
import Favorites from "./Favorites";
import Profile from "./Profile";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsConditions from "./TermsConditions";
import HelpFAQ from "./HelpFAQ";
import StoreOnlineOrders from "./StoreOnlineOrders";

import { BrowserRouter as Router, Route, Routes, useLocation, useSearchParams, useParams, Navigate } from 'react-router-dom';

// Router para StoreOnline - verifica view param e slug
function StoreOnlineRouter() {
  const { id, slug } = useParams(); // Pode vir como 'id' ou 'slug' dependendo da rota
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const identifier = id || slug; // Usar o que estiver disponível
  const [storeId, setStoreId] = React.useState(identifier);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  
  // Lista de rotas reservadas que não devem ser tratadas como slug de loja
  const reservedRoutes = [
    'Home', 'home', 'produto', 'product', 'produtos', 'products', 'loja', 'store', 
    'admin', 'Admin', 'pedidos', 'orders', 'carrinho', 'cart', 'favoritos', 'favorites',
    'perfil', 'profile', 'cadastro', 'signup', 'login', 'Login',
    'campanhas', 'campaigns', 'politica-privacidade', 'privacy-policy', 
    'termos-condicoes', 'terms', 'ajuda', 'help', 'faq', 'sobre', 'about',
    'minhas-compras', 'my-purchases', 'pedido', 'order', 'StoreProfile', 'AddProduct',
    'ProductDetail', 'AdminDashboard', 'AdminCities', 'AdminCategories', 'AdminStores',
    'AdminLogin', 'AdminPlans', 'AdminSubscriptions', 'AdminSettings', 'StoreSignup',
    'AdminProducts', 'ProductViewer', 'StoreProductManagement', 'UpgradePlan', 'StoreFront',
    'StoreOnline', 'Orders', 'OrderDetail', 'MyPurchases', 'Cart', 'Favorites', 'Profile'
  ];
  
  // Se o id não parece um UUID (tem menos de 36 caracteres ou não tem hífens), pode ser um slug
  React.useEffect(() => {
    const checkIfSlug = async () => {
      // Se for uma rota reservada, não tratar como slug
      if (identifier && reservedRoutes.includes(identifier)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      // UUIDs têm 36 caracteres com hífens (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      // Se não parece UUID, tentar buscar por slug
      const isUUID = identifier && identifier.length === 36 && identifier.includes('-');
      
      if (!isUUID && identifier) {
        try {
          console.log('🔍 Buscando loja por slug/identifier:', identifier);
          const { Store } = await import("@/api/entities");
          // O método get() agora aceita tanto UUID quanto slug
          const store = await Store.get(identifier);
          console.log('📦 Loja encontrada:', store ? { id: store.id, name: store.name, slug: store.slug } : 'null');
          
          if (store && store.id) {
            // Se encontrou a loja pelo slug, garantir que é uma loja premium
            // Loja premium tem slug personalizado ou plano enterprise
            // Se a loja tem slug, ela deve ter acesso à loja premium
            console.log('✅ Loja encontrada - usando ID:', store.id);
            setStoreId(store.id);
          } else {
            // Se não encontrou por slug, marcar como não encontrado
            console.log('❌ Loja não encontrada por slug');
            setNotFound(true);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar loja por slug:', error);
          console.error('❌ Detalhes do erro:', {
            message: error.message,
            status: error.status,
            response: error.response,
            stack: error.stack
          });
          
          // Verificar se é erro 404 de várias formas
          const is404 = error.status === 404 || 
                       error.message?.includes('404') || 
                       error.message?.includes('não encontrada') ||
                       error.message?.includes('not found') ||
                       (error.response && error.response.status === 404);
          
          if (is404) {
            console.log('❌ Erro 404 - loja não encontrada');
            setNotFound(true);
          } else {
            // Em caso de outro erro, tentar usar como ID normal
            console.log('⚠️ Erro diferente de 404 - tentando usar como ID');
            setStoreId(identifier);
          }
        } finally {
          setLoading(false);
        }
      } else {
        console.log('🔍 Usando como UUID:', identifier);
        setStoreId(identifier);
        setLoading(false);
      }
    };
    
    if (identifier) {
      checkIfSlug();
    } else {
      setLoading(false);
      setNotFound(true);
    }
  }, [identifier]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600">A loja que você está procurando não existe ou não está disponível.</p>
        </div>
      </div>
    );
  }
  
  // Se não tem view ou view=home, mostrar home
  // Passar o storeId encontrado via sessionStorage para StoreOnlineHome
  if (!view || view === 'home') {
    // Salvar o storeId no sessionStorage para o StoreOnlineHome usar
    if (storeId) {
      sessionStorage.setItem('resolvedStoreId', storeId);
    }
    return <StoreOnlineHome />;
  }
  
  // Se view=products, mostrar página de produtos
  if (storeId) {
    sessionStorage.setItem('resolvedStoreId', storeId);
  }
  return <StoreOnline />;
}

const PAGES = {
    
    Home: Home,
    
    StoreProfile: StoreProfile,
    
    AddProduct: AddProduct,
    
    ProductDetail: ProductDetail,
    
    AdminDashboard: AdminDashboard,
    
    AdminCities: AdminCities,
    
    AdminCategories: AdminCategories,
    
    AdminStores: AdminStores,
    
    Store: Store,
    
    AdminLogin: AdminLogin,
    
    AdminPlans: AdminPlans,
    
    AdminSubscriptions: AdminSubscriptions,
    
    AdminSettings: AdminSettings,
    
    StoreSignup: StoreSignup,
    
    AdminProducts: AdminProducts,
    
    ProductViewer: ProductViewer,
    
    StoreProductManagement: StoreProductManagement,
    
    UpgradePlan: UpgradePlan,
    
    StoreFront: StoreFront,
    
    StoreOnline: StoreOnline,
    Orders: Orders,
    OrderDetail: OrderDetail,
    MyPurchases: MyPurchases,
    Cart: Cart,
    Favorites: Favorites,
    Profile: Profile,
    PrivacyPolicy: PrivacyPolicy,
    TermsConditions: TermsConditions,
    HelpFAQ: HelpFAQ,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    // Detectar rotas /loja/* como StoreProfile
    if (url.startsWith('/loja/') || url.startsWith('/store/') || url === '/loja' || url === '/store') {
        return 'StoreProfile';
    }
    
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                {/* Home */}
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                
                {/* Produtos */}
                <Route path="/produto/:id" element={<ProductDetail />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/produtos/adicionar" element={<AddProduct />} />
                <Route path="/products/add" element={<AddProduct />} />
                
                {/* Campanhas */}
                <Route path="/campanhas/:slug" element={<CampaignPage />} />
                <Route path="/campaigns/:slug" element={<CampaignPage />} />
                
                {/* Loja - Rotas específicas para cada página - DEVEM vir ANTES de rotas dinâmicas */}
                <Route path="/loja/dashboard" element={<StoreProfile />} />
                <Route path="/loja/produtos" element={<StoreProfile />} />
                <Route path="/loja/pedidos" element={<StoreProfile />} />
                <Route path="/loja/estatisticas" element={<StoreProfile />} />
                <Route path="/loja/marketing" element={<StoreProfile />} />
                <Route path="/loja/campanhas" element={<StoreProfile />} />
                <Route path="/loja/assinatura" element={<StoreProfile />} />
                <Route path="/loja/configuracoes" element={<StoreProfile />} />
                <Route path="/loja/online" element={<StoreProfile />} />
                <Route path="/loja/link-personalizado" element={<StoreProfile />} />
                <Route path="/loja/cadastro" element={<StoreSignup />} />
                <Route path="/loja/upgrade" element={<UpgradePlan />} />
                <Route path="/loja/perfil" element={<StoreProfile />} />
                {/* Redirecionar /loja para /loja/dashboard - DEVE vir ANTES de /loja/:id */}
                <Route path="/loja" element={<Navigate to="/loja/dashboard" replace />} />
                {/* Rotas antigas para compatibilidade */}
                <Route path="/store/profile" element={<StoreProfile />} />
                <Route path="/store/dashboard" element={<StoreProfile />} />
                <Route path="/store/products" element={<StoreProfile />} />
                <Route path="/store/orders" element={<StoreProfile />} />
                <Route path="/store/analytics" element={<StoreProfile />} />
                <Route path="/store/marketing" element={<StoreProfile />} />
                <Route path="/store/campaigns" element={<StoreProfile />} />
                <Route path="/store/subscription" element={<StoreProfile />} />
                <Route path="/store/settings" element={<StoreProfile />} />
                <Route path="/store/online" element={<StoreProfile />} />
                <Route path="/store/custom-link" element={<StoreProfile />} />
                <Route path="/store/signup" element={<StoreSignup />} />
                <Route path="/store/upgrade" element={<UpgradePlan />} />
                <Route path="/store" element={<Navigate to="/loja/dashboard" replace />} />
                {/* Rotas dinâmicas - DEVEM vir DEPOIS das rotas específicas */}
                <Route path="/loja/:id" element={<StoreFront />} />
                <Route path="/store/:id" element={<StoreFront />} />
                <Route path="/loja-online/:id" element={<StoreOnlineRouter />} />
                <Route path="/store-online/:id" element={<StoreOnlineRouter />} />
                {/* Rota para produtos com slug personalizado (ex: /apex/produto/123) */}
                <Route path="/:slug/produto/:productId" element={<ProductDetail />} />
                <Route path="/loja-online/:storeId/produto/:productId" element={<ProductDetail />} />
                <Route path="/store-online/:storeId/produto/:productId" element={<ProductDetail />} />
                {/* Rota alternativa para slug personalizado com prefixo */}
                <Route path="/loja-online/:slug" element={<StoreOnlineRouter />} />
                <Route path="/store-online/:slug" element={<StoreOnlineRouter />} />
                <Route path="/loja-online/:id/meus-pedidos" element={<StoreOnlineOrders />} />
                <Route path="/store-online/:id/meus-pedidos" element={<StoreOnlineOrders />} />
                
                {/* Pedidos */}
                <Route path="/pedidos" element={<Orders />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/pedido/:id" element={<OrderDetail />} />
                <Route path="/order/:id" element={<OrderDetail />} />
                <Route path="/minhas-compras" element={<MyPurchases />} />
                <Route path="/my-purchases" element={<MyPurchases />} />
                
                {/* Carrinho e Favoritos */}
                <Route path="/carrinho" element={<Cart />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/favoritos" element={<Favorites />} />
                <Route path="/favorites" element={<Favorites />} />
                
                {/* Perfil */}
                <Route path="/perfil" element={<Profile />} />
                <Route path="/profile" element={<Profile />} />

                {/* Institucional */}
                <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/termos-condicoes" element={<TermsConditions />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/ajuda" element={<HelpFAQ />} />
                <Route path="/faq" element={<HelpFAQ />} />
                
                {/* Admin */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/cidades" element={<AdminCities />} />
                <Route path="/admin/cities" element={<AdminCities />} />
                <Route path="/admin/categorias" element={<AdminCategories />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/lojas" element={<AdminStores />} />
                <Route path="/admin/stores" element={<AdminStores />} />
                <Route path="/admin/produtos" element={<AdminProducts />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/planos" element={<AdminPlans />} />
                <Route path="/admin/plans" element={<AdminPlans />} />
                <Route path="/admin/assinaturas" element={<AdminSubscriptions />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/admin/campanhas" element={<AdminCampaigns />} />
                <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                
                {/* Rota para produtos com slug personalizado (ex: /apex/produto/123) - deve vir ANTES da rota genérica /:slug */}
                <Route path="/:slug/produto/:productId" element={<ProductDetail />} />
                
                {/* Rotas legadas (compatibilidade) */}
                <Route path="/Home" element={<Home />} />
                <Route path="/StoreProfile" element={<StoreProfile />} />
                
                {/* Rota para slug personalizado (link oficial da loja) - deve vir DEPOIS de todas as rotas específicas */}
                {/* Exemplo: /apex, /minhaloja, etc - será tratado como slug de loja se não for uma rota reservada */}
                <Route path="/:slug" element={<StoreOnlineRouter />} />
                <Route path="/AddProduct" element={<AddProduct />} />
                <Route path="/ProductDetail" element={<ProductDetail />} />
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                <Route path="/admindashboard" element={<AdminDashboard />} />
                <Route path="/AdminCities" element={<AdminCities />} />
                <Route path="/admincities" element={<AdminCities />} />
                <Route path="/AdminCategories" element={<AdminCategories />} />
                <Route path="/admincategories" element={<AdminCategories />} />
                <Route path="/AdminStores" element={<AdminStores />} />
                <Route path="/adminstores" element={<AdminStores />} />
                <Route path="/Store" element={<Store />} />
                <Route path="/AdminLogin" element={<AdminLogin />} />
                <Route path="/adminlogin" element={<AdminLogin />} />
                <Route path="/AdminPlans" element={<AdminPlans />} />
                <Route path="/adminplans" element={<AdminPlans />} />
                <Route path="/AdminSubscriptions" element={<AdminSubscriptions />} />
                <Route path="/adminsubscriptions" element={<AdminSubscriptions />} />
                <Route path="/AdminSettings" element={<AdminSettings />} />
                <Route path="/adminsettings" element={<AdminSettings />} />
                <Route path="/StoreSignup" element={<StoreSignup />} />
                <Route path="/storesignup" element={<StoreSignup />} />
                <Route path="/AdminProducts" element={<AdminProducts />} />
                <Route path="/ProductViewer" element={<ProductViewer />} />
                <Route path="/StoreProductManagement" element={<StoreProductManagement />} />
                <Route path="/UpgradePlan" element={<UpgradePlan />} />
                <Route path="/StoreFront" element={<StoreFront />} />
                <Route path="/StoreOnline" element={<StoreOnlineRouter />} />
                <Route path="/storeonline" element={<StoreOnlineRouter />} />
                <Route path="/Orders" element={<Orders />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/OrderDetail" element={<OrderDetail />} />
                <Route path="/orderdetail" element={<OrderDetail />} />
                <Route path="/MyPurchases" element={<MyPurchases />} />
                <Route path="/mypurchases" element={<MyPurchases />} />
                <Route path="/Cart" element={<Cart />} />
                <Route path="/Favorites" element={<Favorites />} />
                <Route path="/Profile" element={<Profile />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}