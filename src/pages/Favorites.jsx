import React, { useState, useEffect } from "react";
import { Favorites as FavoritesAPI, User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import LoginDialog from "@/components/LoginDialog";

export default function Favorites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [removing, setRemoving] = useState({});
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

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

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const favoritesData = await FavoritesAPI.list();
      setFavorites(favoritesData);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus favoritos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    setRemoving(prev => ({ ...prev, [productId]: true }));
    try {
      await FavoritesAPI.remove(productId);
      setFavorites(prev => prev.filter(fav => fav.product_id !== productId));
      toast({
        title: "Removido!",
        description: "Produto removido dos favoritos",
      });
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover dos favoritos",
        variant: "destructive",
      });
    } finally {
      setRemoving(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleContactClick = (product) => {
    const whatsappNumber = (product.whatsapp || product.store_whatsapp)?.replace(/\D/g, '') || '';
    if (!whatsappNumber) {
      toast({
        title: "Erro",
        description: "Número de WhatsApp não disponível",
        variant: "destructive",
      });
      return;
    }
    
    const finalNumber = whatsappNumber.startsWith('55') ? whatsappNumber : '55' + whatsappNumber;
    const message = `Olá! Vi seu produto "${product.product_name}" no NATIVO e gostaria de mais informações.`;
    const url = `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Faça login para ver seus favoritos</h2>
            <p className="text-gray-600 mb-6">Entre com sua conta para acessar seus produtos favoritados</p>
            <Button onClick={() => setLoginDialogOpen(true)}>Fazer Login</Button>
          </div>
          <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Meus Favoritos</h1>
          <p className="text-gray-600 mt-2">
            {favorites.length === 0 
              ? "Você ainda não tem produtos favoritados"
              : `${favorites.length} produto${favorites.length !== 1 ? 's' : ''} favoritado${favorites.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando favoritos...</p>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum favorito ainda</h3>
              <p className="text-gray-600 mb-6">
                Comece a favoritar produtos que você gostar!
              </p>
              <Button onClick={() => navigate(createPageUrl("Home"))}>
                Explorar Produtos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <Link to={createPageUrl(`ProductDetail?id=${favorite.product_id}`)}>
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    {favorite.images?.[0] && (
                      <img
                        src={favorite.images[0]}
                        alt={favorite.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm hover:bg-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFavorite(favorite.product_id);
                      }}
                      disabled={removing[favorite.product_id]}
                    >
                      {removing[favorite.product_id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </Button>
                    {favorite.compare_price && favorite.compare_price > favorite.price && (
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        {Math.round((1 - favorite.price / favorite.compare_price) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardContent className="p-4">
                  <Link to={createPageUrl(`ProductDetail?id=${favorite.product_id}`)}>
                    <h3 className="font-medium text-lg truncate mb-2">{favorite.product_name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-lg font-bold text-green-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(favorite.price)}
                        </span>
                        {favorite.compare_price && favorite.compare_price > favorite.price && (
                          <span className="block text-sm text-gray-400 line-through">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(favorite.compare_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={(e) => {
                        e.preventDefault();
                        handleContactClick(favorite);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Contato
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFavorite(favorite.product_id);
                      }}
                      disabled={removing[favorite.product_id]}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

