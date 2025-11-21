import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Eye,
  MessageSquare,
  Filter,
  SlidersHorizontal,
  Copy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StoreProductManagement() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [store, setStore] = useState(null);
  const [user, setUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carregar usuário atual
      const userData = await User.me();
      setUser(userData);
      
      // Buscar lojas
      const stores = await Store.list();
      const userStore = stores.find(
        s => s.email === userData.email || s.created_by === userData.email
      );
      
      if (!userStore) {
        setError("Você não possui uma loja cadastrada. Crie uma loja primeiro.");
        setLoading(false);
        return;
      }
      
      setStore(userStore);
      
      // Carregar produtos da loja
      const storeProducts = await Product.filter({ store_id: userStore.id });
      
      if (storeProducts && Array.isArray(storeProducts)) {
        setProducts(storeProducts);
        setTotalProducts(storeProducts.length);
        setActiveProducts(storeProducts.filter(p => p.status === "active").length);
        
        console.log(`Carregados ${storeProducts.length} produtos para a loja ${userStore.name}`);
      } else {
        console.log("Nenhum produto encontrado ou resposta inválida:", storeProducts);
        setProducts([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Não foi possível carregar os dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  const handleAddProduct = () => {
    navigate(createPageUrl("AddProduct"));
  };

  const handleEditProduct = (product) => {
    navigate(createPageUrl(`AddProduct?id=${product.id}`));
  };

  const openDeleteDialog = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setProductToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await Product.delete(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setSuccess(`Produto "${productToDelete.name}" removido com sucesso!`);
      
      // Atualizar contagens
      setTotalProducts(prev => prev - 1);
      if (productToDelete.status === "active") {
        setActiveProducts(prev => prev - 1);
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      setError("Não foi possível excluir o produto. Tente novamente.");
    } finally {
      closeDeleteDialog();
    }
  };

  const handleGoBack = () => {
    navigate(createPageUrl("StoreProfile"));
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            Rascunho
          </Badge>
        );
      case "out_of_stock":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Sem Estoque
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleGoBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
            {store && (
              <Badge className="bg-blue-100 text-blue-800">
                {store.name}
              </Badge>
            )}
          </div>

          <Button 
            onClick={handleAddProduct}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Produtos</p>
                  <h3 className="text-2xl font-bold mt-1">{totalProducts}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Produtos Ativos</p>
                  <h3 className="text-2xl font-bold mt-1">{activeProducts}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Inativos/Rascunhos</p>
                  <h3 className="text-2xl font-bold mt-1">{totalProducts - activeProducts}</h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Status: {
                      statusFilter === "all" ? "Todos" :
                      statusFilter === "active" ? "Ativos" :
                      statusFilter === "draft" ? "Rascunhos" : "Sem Estoque"
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("all")}>
                    Todos os Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("active")}>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Ativos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("draft")}>
                    <Clock className="w-4 h-4 mr-2 text-amber-600" />
                    Rascunhos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("out_of_stock")}>
                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                    Sem Estoque
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando produtos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Nenhum produto cadastrado
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Você ainda não cadastrou nenhum produto em sua loja. 
                Comece adicionando seu primeiro produto agora.
              </p>
              <Button 
                onClick={handleAddProduct}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Não encontramos produtos correspondentes aos filtros aplicados.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Produto</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Preço</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 hidden lg:table-cell">Métricas</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-xs">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description ? product.description.substring(0, 50) + (product.description.length > 50 ? '...' : '') : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(product.price || 0)}
                        </div>
                        {product.compare_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.compare_price)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {product.total_views || 0}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {product.total_messages || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => navigate(createPageUrl(`ProductDetail?id=${product.id}`))}
                                className="flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  const url = window.location.origin + createPageUrl(`ProductDetail?id=${product.id}`);
                                  navigator.clipboard.writeText(url);
                                  setSuccess("Link copiado para a área de transferência!");
                                  setTimeout(() => setSuccess(null), 3000);
                                }}
                                className="flex items-center"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(product)}
                                className="text-red-600 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}