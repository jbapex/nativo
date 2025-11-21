
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Store, MessageCircle, Heart, Clock, Check, Star, Eye, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import LoginDialog from "@/components/LoginDialog";
import CountdownTimer from "@/components/products/CountdownTimer";

export default function ProductGrid({ products, loading, emptyMessage }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [favoriteSuccess, setFavoriteSuccess] = useState(false);
  const [favoriteProduct, setFavoriteProduct] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSearchTerm, setExportSearchTerm] = useState("");
  const [exportCategory, setExportCategory] = useState("all");
  const [exportStore, setExportStore] = useState("all");

  useEffect(() => {
    checkUser();
    
    // Ouvir mudanças de autenticação
    const handleAuthChange = () => {
      checkUser();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Carregar favoritos usando a API correta
      try {
        const { Favorites: FavoritesAPI } = await import("@/api/apiClient");
        const favoritesList = await FavoritesAPI.list();
        // favoritesList é um array de objetos com product_id
        const favoriteIds = favoritesList.map(fav => fav.product_id || fav.id);
        setFavorites(favoriteIds);
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        // Fallback para o método antigo se a API falhar
        setFavorites(userData.favorites || []);
      }
    } catch (error) {
      setUser(null);
      setFavorites([]);
    }
  };

  const handleFavorite = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }
    
    const productId = product.id;
    const isCurrentlyFavorite = favorites.includes(productId);
    
    try {
      // Usar a API de favoritos correta
      const { Favorites: FavoritesAPI } = await import("@/api/apiClient");
      
      if (isCurrentlyFavorite) {
        // Remover dos favoritos
        await FavoritesAPI.remove(productId);
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        // Adicionar aos favoritos
        await FavoritesAPI.add(productId);
        setFavorites([...favorites, productId]);
        setFavoriteProduct(product);
        setFavoriteSuccess(true);
        
        setTimeout(() => {
          setFavoriteSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
      // Reverter estado em caso de erro
      if (isCurrentlyFavorite) {
        setFavorites([...favorites, productId]);
      } else {
        setFavorites(favorites.filter(id => id !== productId));
      }
    }
  };

  const handleWhatsApp = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Buscar WhatsApp da loja se o produto não tiver
    let storeWhatsapp = null;
    if (!product.whatsapp && product.store_id) {
      try {
        const { Store } = await import("@/api/entities");
        const storeData = await Store.get(product.store_id);
        storeWhatsapp = storeData?.whatsapp;
      } catch (error) {
        console.error('Erro ao buscar WhatsApp da loja:', error);
      }
    }
    
    // Formatar número do WhatsApp (remover caracteres não numéricos e adicionar código do país se necessário)
    let whatsappNumber = (product.whatsapp || storeWhatsapp)?.replace(/\D/g, '') || '';
    if (whatsappNumber && !whatsappNumber.startsWith('55')) {
      // Se não começar com 55 (código do Brasil), adicionar
      whatsappNumber = '55' + whatsappNumber;
    }
    
    if (!whatsappNumber) {
      alert("Número de WhatsApp não disponível para este produto");
      return;
    }
    
    // Sempre do marketplace (NATIVO)
    const message = `Olá! Vi seu produto "${product.name}" no NATIVO e gostaria de mais informações.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Formatar preço para moeda brasileira
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-36 sm:h-48 w-full" />
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-6 w-1/3 mb-3" />
              <Skeleton className="h-8 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{emptyMessage || "Nenhum produto encontrado"}</h3>
          <p className="text-gray-500 mb-6">
            Tente buscar com outras palavras-chave ou categorias diferentes.
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Explorar outros produtos
          </Button>
        </div>
      </div>
    );
  }

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleExportProducts = () => {
    // Filtrar produtos baseado nos filtros do dialog
    let filteredProducts = [...products];

    // Filtrar por busca
    if (exportSearchTerm) {
      filteredProducts = filteredProducts.filter(product =>
        product.name?.toLowerCase().includes(exportSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(exportSearchTerm.toLowerCase()) ||
        product.store_name?.toLowerCase().includes(exportSearchTerm.toLowerCase())
      );
    }

    // Filtrar por categoria
    if (exportCategory !== "all") {
      filteredProducts = filteredProducts.filter(product =>
        product.category_id === exportCategory ||
        product.category === exportCategory ||
        product.category_name === exportCategory
      );
    }

    // Filtrar por loja
    if (exportStore !== "all") {
      filteredProducts = filteredProducts.filter(product =>
        product.store_id === exportStore ||
        product.store_name === exportStore
      );
    }

    if (!filteredProducts || filteredProducts.length === 0) {
      alert("Nenhum produto encontrado com os filtros selecionados");
      return;
    }

    // Preparar dados para CSV
    const csvHeaders = [
      "Nome",
      "Descrição",
      "Preço",
      "Preço Comparação",
      "Estoque",
      "Categoria",
      "Loja",
      "Ativo",
      "Destaque",
      "Visualizações"
    ];

    const csvRows = filteredProducts.map(product => [
      product.name || "",
      (product.description || "").replace(/,/g, ";").replace(/\n/g, " "),
      product.price || 0,
      product.compare_price || "",
      product.stock || 0,
      product.category_name || product.category || "",
      product.store_name || "",
      product.active ? "Sim" : "Não",
      product.featured ? "Sim" : "Não",
      product.total_views || 0
    ]);

    // Criar conteúdo CSV
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Criar blob e fazer download
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `produtos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Fechar dialog e limpar filtros
    setExportDialogOpen(false);
    setExportSearchTerm("");
    setExportCategory("all");
    setExportStore("all");
  };

  // Obter categorias e lojas únicas dos produtos
  const uniqueCategories = [...new Set(products.map(p => ({
    id: p.category_id || p.category,
    name: p.category_name || p.category
  })).filter(c => c.id))];

  const uniqueStores = [...new Set(products.map(p => ({
    id: p.store_id,
    name: p.store_name
  })).filter(s => s.id && s.name))];

  // Contar produtos filtrados
  const getFilteredCount = () => {
    let filtered = [...products];
    if (exportSearchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(exportSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(exportSearchTerm.toLowerCase()) ||
        product.store_name?.toLowerCase().includes(exportSearchTerm.toLowerCase())
      );
    }
    if (exportCategory !== "all") {
      filtered = filtered.filter(product =>
        product.category_id === exportCategory ||
        product.category === exportCategory ||
        product.category_name === exportCategory
      );
    }
    if (exportStore !== "all") {
      filtered = filtered.filter(product =>
        product.store_id === exportStore ||
        product.store_name === exportStore
      );
    }
    return filtered.length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Produtos para você</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {products.length} produtos encontrados
          </div>
          {products.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportClick}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar produtos
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="h-full"
          >
            <Link to={`/produto/${product.id}`} className="h-full block">
              <Card className="overflow-hidden h-full border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
                <div className="relative">
                  <img
                    src={product.images?.[0] || product.image_url || "https://placehold.co/300x300/e2e8f0/a1a1aa?text=Sem+Imagem"}
                    alt={product.name}
                    className="w-full h-36 xs:h-40 sm:h-48 md:h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Garantir que nenhum "0" seja renderizado */}
                  {product.compare_price && product.compare_price > product.price ? (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white font-medium">
                      {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                    </Badge>
                  ) : null}
                  
                  {product.featured ? (
                    <Badge className="absolute top-2 right-12 bg-yellow-500 text-white font-medium">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      Destaque
                    </Badge>
                  ) : null}
                  
                  <button
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      favorites.includes(product.id) 
                        ? "bg-red-500" 
                        : "bg-white/90 backdrop-blur-sm hover:bg-gray-100"
                    }`}
                    onClick={(e) => handleFavorite(e, product)}
                  >
                    <Heart className={`w-4 h-4 transition-colors ${
                      favorites.includes(product.id) 
                        ? "text-white fill-white" 
                        : "text-gray-700"
                    }`} />
                  </button>
                  
                  {/* Temporizador de Oferta - Base da Imagem */}
                  {product.promotion && product.promotion.show_timer && product.promotion.end_date && (
                    <div className="absolute bottom-0 left-0 right-0 p-1.5">
                      <CountdownTimer endDate={product.promotion.end_date} className="text-xs compact" />
                    </div>
                  )}
                  
                  {/* Removido: informações de visualizações/novo que apareciam no hover */}
                </div>

                <CardContent className="p-3 sm:p-4">
                  {/* Garantir que não há elementos renderizando "0" */}
                  {product.name && (
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2 h-4 sm:h-8">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1 sm:mt-2">
                    <div>
                      {product.compare_price && product.compare_price > product.price ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            {formatCurrency(product.compare_price)}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-green-600 block">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm sm:text-base font-bold text-green-600">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Store className="w-3 h-3 mr-1 text-blue-600" />
                      <span className="hidden xs:inline truncate max-w-[60px] sm:max-w-full">{product.store_name}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/produto/${product.id}`);
                    }}
                    className="w-full mt-2 sm:mt-3 py-1.5 sm:py-2 rounded-lg flex items-center justify-center gap-1 sm:gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-xs sm:text-sm"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    Ver Produto
                  </button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {products.length >= 12 && (
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            size="lg" 
            className="border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Carregar Mais Produtos
          </Button>
        </div>
      )}
      
      <LoginDialog 
        open={loginPromptOpen} 
        onOpenChange={setLoginPromptOpen}
        onSuccess={() => {
          checkUser(); // Recarregar dados após login
        }}
      />

      {/* Dialog de Exportação */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Exportar Produtos</DialogTitle>
            <DialogDescription>
              Filtre os produtos que deseja exportar. O arquivo será baixado em formato CSV.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="export-search">Buscar produtos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="export-search"
                  placeholder="Digite o nome, descrição ou loja..."
                  value={exportSearchTerm}
                  onChange={(e) => setExportSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="export-category">Categoria</Label>
                <Select value={exportCategory} onValueChange={setExportCategory}>
                  <SelectTrigger id="export-category">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Loja */}
              <div className="space-y-2">
                <Label htmlFor="export-store">Loja</Label>
                <Select value={exportStore} onValueChange={setExportStore}>
                  <SelectTrigger id="export-store">
                    <SelectValue placeholder="Todas as lojas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {uniqueStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contador de produtos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>{getFilteredCount()}</strong> {getFilteredCount() === 1 ? 'produto será exportado' : 'produtos serão exportados'}
                {getFilteredCount() !== products.length && (
                  <span className="text-blue-600 ml-1">
                    (de {products.length} total)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setExportDialogOpen(false);
                setExportSearchTerm("");
                setExportCategory("all");
                setExportStore("all");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExportProducts}
              disabled={getFilteredCount() === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar {getFilteredCount() > 0 && `(${getFilteredCount()})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <AnimatePresence>
        {favoriteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-50 flex items-center gap-3 border border-green-100 max-w-xs"
          >
            <div className="bg-green-100 rounded-full p-2">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">Adicionado aos favoritos</h4>
              <p className="text-xs text-gray-500 line-clamp-1">{favoriteProduct?.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
