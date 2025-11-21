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
import StoreOnlineOrders from "./StoreOnlineOrders";

import { BrowserRouter as Router, Route, Routes, useLocation, useSearchParams, useParams } from 'react-router-dom';

// Router para StoreOnline - verifica view param
function StoreOnlineRouter() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  
  // Se não tem view ou view=home, mostrar home
  if (!view || view === 'home') {
    return <StoreOnlineHome />;
  }
  
  // Se view=products, mostrar página de produtos
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
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
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
                
                {/* Loja */}
                <Route path="/loja/perfil" element={<StoreProfile />} />
                <Route path="/store/profile" element={<StoreProfile />} />
                <Route path="/loja/cadastro" element={<StoreSignup />} />
                <Route path="/store/signup" element={<StoreSignup />} />
                <Route path="/loja/:id" element={<StoreFront />} />
                <Route path="/store/:id" element={<StoreFront />} />
                <Route path="/loja-online/:id" element={<StoreOnlineRouter />} />
                <Route path="/store-online/:id" element={<StoreOnlineRouter />} />
                <Route path="/loja-online/:id/meus-pedidos" element={<StoreOnlineOrders />} />
                <Route path="/store-online/:id/meus-pedidos" element={<StoreOnlineOrders />} />
                <Route path="/loja/produtos" element={<StoreProductManagement />} />
                <Route path="/store/products" element={<StoreProductManagement />} />
                <Route path="/loja/upgrade" element={<UpgradePlan />} />
                <Route path="/store/upgrade" element={<UpgradePlan />} />
                
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
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                
                {/* Rotas legadas (compatibilidade) */}
                <Route path="/Home" element={<Home />} />
                <Route path="/StoreProfile" element={<StoreProfile />} />
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