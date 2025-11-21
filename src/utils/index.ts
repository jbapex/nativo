


export function createPageUrl(pageName: string) {
    // Se já começar com /, retornar como está
    if (pageName.startsWith('/')) {
        return pageName;
    }
    
    // Se contém ?id=, converter para formato RESTful
    if (pageName.includes('?id=')) {
        const [page, params] = pageName.split('?');
        const urlParams = new URLSearchParams(params);
        const id = urlParams.get('id');
        
        // Mapear páginas para rotas RESTful
        const routeMap: { [key: string]: string } = {
            'ProductDetail': '/produto',
            'OrderDetail': '/pedido',
            'StoreFront': '/loja',
            'StoreOnline': '/loja-online',
            'Home': '/home'
        };
        
        const baseRoute = routeMap[page] || `/${page.toLowerCase()}`;
        return id ? `${baseRoute}/${id}` : baseRoute;
    }
    
    // Se contém outros query params, manter formato antigo para compatibilidade
    if (pageName.includes('?')) {
        return '/' + pageName.toLowerCase().replace(/ /g, '-');
    }
    
    // Rotas RESTful mapeadas
    const routeMap: { [key: string]: string } = {
        'Home': '/',
        'StoreProfile': '/loja/perfil',
        'AddProduct': '/produtos/adicionar',
        'Cart': '/carrinho',
        'Favorites': '/favoritos',
        'Profile': '/perfil',
        'Orders': '/pedidos',
        'MyPurchases': '/minhas-compras',
        'StoreSignup': '/loja/cadastro',
        'UpgradePlan': '/loja/upgrade',
        'StoreProductManagement': '/loja/produtos',
        'AdminDashboard': '/admin',
        'AdminLogin': '/admin/login',
        'AdminCities': '/admin/cidades',
        'AdminCategories': '/admin/categorias',
        'AdminStores': '/admin/lojas',
        'AdminProducts': '/admin/produtos',
        'AdminPlans': '/admin/planos',
        'AdminSubscriptions': '/admin/assinaturas',
        'AdminSettings': '/admin/configuracoes'
    };
    
    return routeMap[pageName] || '/' + pageName.toLowerCase().replace(/ /g, '-');
}