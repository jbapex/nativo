
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Search,
  AlertCircle,
  RefreshCw,
  Eye,
  MessageSquare,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Pencil,
  LayoutGrid,
  List,
  Filter,
  DollarSign,
  MoreVertical,
  Trash2,
  Edit,
  EyeOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Subscription } from "@/api/entities"; // Import Subscription
import { Plan } from "@/api/entities"; // Import Plan

export default function StoreProducts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
    const savedViewMode = localStorage.getItem("storeProductsViewMode");
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("storeProductsViewMode", viewMode);
  }, [viewMode]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await User.me();
      const stores = await Store.list();
      const userStore = stores.find(
        s => s.email === userData.email || s.created_by === userData.email
      );

      if (!userStore) {
        setError("Você não possui uma loja cadastrada.");
        setLoading(false);
        return;
      }

      const allProducts = await Product.list();
      console.log("Todos os produtos:", allProducts.length);

      const storeProducts = allProducts.filter(product => 
        product.store_id === userStore.id || 
        product.created_by === userData.email
      );

      console.log("Produtos da loja:", storeProducts.length);
      
      storeProducts.forEach(product => {
        console.log(`Produto ${product.id} - ${product.name}:`);
        console.log(`  - Visualizações: ${product.total_views || 0}`);
        console.log(`  - Mensagens: ${product.total_messages || 0}`);
        console.log(`  - Favoritos: ${product.total_favorites || 0}`);
      });
      
      setProducts(storeProducts);

    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setError("Não foi possível carregar os produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleAddProduct = async () => {
    try {
      const userData = await User.me();
      const stores = await Store.list();
      const userStore = stores.find(s => s.email === userData.email || s.created_by === userData.email);
      
      if (!userStore) {
        setError("Loja não encontrada");
        return;
      }

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
        setError(
          <div className="flex flex-col items-center">
            <p className="mb-4">
              Você atingiu o limite de {productLimit} produtos do seu plano atual.
            </p>
            <Button
              onClick={() => navigate(createPageUrl("StoreSettings"))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ver Planos Disponíveis
            </Button>
          </div>
        );
        return;
      }

      navigate(createPageUrl("AddProduct"));
    } catch (error) {
      console.error("Erro ao verificar limite de produtos:", error);
      setError("Erro ao verificar limite de produtos. Tente novamente.");
    }
  };

  const handleEditProduct = (product) => {
    navigate(createPageUrl("AddProduct"), { 
      state: { product }
    });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };
  
  const cancelDelete = () => {
    setProductToDelete(null);
    setDeleteDialogOpen(false);
  };
  
  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleting(true);
      await Product.delete(productToDelete.id);
      
      setProducts(prevProducts => 
        prevProducts.filter(p => p.id !== productToDelete.id)
      );
      
      setSuccess(`Produto "${productToDelete.name}" excluído com sucesso!`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      setError("Não foi possível excluir o produto. Tente novamente.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const newStatus = product.status === "active" ? "draft" : "active";
      
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id ? {...p, status: newStatus} : p
        )
      );
      
      await Product.update(product.id, { status: newStatus });
      
      setSuccess(`Produto "${product.name}" ${newStatus === "active" ? "visível" : "oculto"}`);
      setTimeout(() => setSuccess(null), 2000);
      
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error);
      setError("Não foi possível alterar a visibilidade do produto");
      
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id ? {...p, status: product.status} : p
        )
      );
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 mr-2 animate-spin text-blue-500" />
        <span>Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="icon"
            onClick={toggleViewMode}
            title={viewMode === "grid" ? "Visualizar em lista" : "Visualizar em grade"}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={handleAddProduct}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-4">
              Comece adicionando seu primeiro produto à loja
            </p>
            <Button onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative bg-gray-100">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute top-2 left-2">
                  <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full pl-1 pr-2 py-1 shadow-sm">
                    <Switch
                      id={`visibility-${product.id}`}
                      checked={product.status === "active"}
                      onCheckedChange={() => handleToggleVisibility(product)}
                      className="mr-1.5"
                      size="sm"
                    />
                    <span className="text-xs">
                      {product.status === "active" ? "Visível" : "Oculto"}
                    </span>
                  </div>
                </div>

                <div className="absolute top-2 right-2">
                  {(() => {
                    // Converter estoque para número para comparação
                    const stockNum = product.stock !== null && product.stock !== undefined 
                      ? Number(product.stock) 
                      : null;
                    const hasStock = stockNum !== null && stockNum > 0;
                    
                    if (product.status === "active") {
                      if (!hasStock) {
                        return (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Sem Estoque
                          </Badge>
                        );
                      }
                      return (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      );
                    } else if (product.status === "draft") {
                      return (
                        <Badge className="bg-amber-100 text-amber-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Rascunho
                        </Badge>
                      );
                    } else {
                      return (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sem Estoque
                        </Badge>
                      );
                    }
                  })()}
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-medium text-lg truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-2">{product.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold text-green-600">
                    {formatCurrency(product.price)}
                  </span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.compare_price)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {product.total_views || 0}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {product.total_messages || 0}
                    </span>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(product)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow">
              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{product.name}</h3>
                  
                  <div className="flex items-center ml-2">
                    <Switch
                      id={`list-visibility-${product.id}`}
                      checked={product.status === "active"}
                      onCheckedChange={() => handleToggleVisibility(product)}
                      className="mr-1.5"
                      size="sm"
                    />
                    <Label htmlFor={`list-visibility-${product.id}`} className="text-xs cursor-pointer">
                      {product.status === "active" ? "Visível" : "Oculto"}
                    </Label>
                  </div>
                  
                  {(() => {
                    // Converter estoque para número para comparação
                    const stockNum = product.stock !== null && product.stock !== undefined 
                      ? Number(product.stock) 
                      : null;
                    const hasStock = stockNum !== null && stockNum > 0;
                    
                    if (product.status === "active") {
                      if (!hasStock) {
                        return (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Sem Estoque
                          </Badge>
                        );
                      }
                      return (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      );
                    } else if (product.status === "draft") {
                      return (
                        <Badge className="bg-amber-100 text-amber-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Rascunho
                        </Badge>
                      );
                    } else {
                      return (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sem Estoque
                        </Badge>
                      );
                    }
                  })()}
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                  {product.description}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-green-600">
                    {formatCurrency(product.price)}
                  </span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.compare_price)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {product.total_views || 0} views
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {product.total_messages || 0} msgs
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDeleteClick(product)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o produto "{productToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
