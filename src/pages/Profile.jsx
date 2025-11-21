import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { UserAddresses } from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import AddressForm from '@/components/AddressForm';
import {
  User as UserIcon,
  MapPin,
  Package,
  Heart,
  Edit,
  Trash2,
  Plus,
  Check,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoginDialog from '@/components/LoginDialog';

export const pagePermissions = {
  public: false,
  loginRequired: true
};

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    birth_date: '',
  });

  useEffect(() => {
    loadUserData();
    
    // Ouvir mudanças de autenticação
    const handleAuthChange = () => {
      loadUserData();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setAddresses(userData.addresses || []);
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        cpf: userData.cpf || '',
        birth_date: userData.birth_date || '',
      });
    } catch (error) {
      if (error.status === 401) {
        setLoginDialogOpen(true);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus dados',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData(formData);
      await loadUserData();
      setEditMode(false);
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o perfil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (addressData) => {
    try {
      if (editingAddress) {
        await UserAddresses.update(editingAddress.id, addressData);
        toast({
          title: 'Sucesso',
          description: 'Endereço atualizado com sucesso!',
        });
      } else {
        await UserAddresses.create(addressData);
        toast({
          title: 'Sucesso',
          description: 'Endereço adicionado com sucesso!',
        });
      }
      await loadUserData();
      setAddressDialogOpen(false);
      setEditingAddress(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o endereço',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) {
      return;
    }

    try {
      await UserAddresses.delete(addressId);
      toast({
        title: 'Sucesso',
        description: 'Endereço excluído com sucesso!',
      });
      await loadUserData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o endereço',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await UserAddresses.setDefault(addressId);
      toast({
        title: 'Sucesso',
        description: 'Endereço padrão atualizado!',
      });
      await loadUserData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível definir o endereço padrão',
        variant: 'destructive',
      });
    }
  };

  const formatCpf = (cpf) => {
    if (!cpf) return '';
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertDescription>Você precisa estar logado para acessar seu perfil.</AlertDescription>
          </Alert>
        </div>
        <LoginDialog
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
          onSuccess={() => {
            setLoginDialogOpen(false);
            loadUserData();
          }}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dados Pessoais</CardTitle>
                  <CardDescription>Gerencie suas informações pessoais</CardDescription>
                </div>
                {!editMode ? (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditMode(false);
                      loadUserData();
                    }}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                      <Check className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editMode}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF (opcional)</Label>
                  <Input
                    id="cpf"
                    value={formatCpf(formData.cpf || '')}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, cpf: numbers });
                    }}
                    disabled={!editMode}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div>
                  <Label htmlFor="birth_date">Data de Nascimento (opcional)</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date || ''}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereços */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Endereços</CardTitle>
                  <CardDescription>Gerencie seus endereços de entrega</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum endereço cadastrado</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressDialogOpen(true);
                    }}
                  >
                    Adicionar primeiro endereço
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border rounded-lg p-4 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {address.label && (
                            <Badge variant="outline">{address.label}</Badge>
                          )}
                          {address.is_default && (
                            <Badge>Padrão</Badge>
                          )}
                        </div>
                        <p className="font-medium">{address.recipient_name}</p>
                        <p className="text-sm text-gray-600">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.neighborhood} - {address.city}/{address.state}
                        </p>
                        <p className="text-sm text-gray-600">CEP: {address.zip_code}</p>
                        {address.phone && (
                          <p className="text-sm text-gray-600">Tel: {address.phone}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!address.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(address.id)}
                          >
                            Definir padrão
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAddress(address);
                            setAddressDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(createPageUrl('Orders'))}
              >
                <Package className="w-4 h-4 mr-2" />
                Meus Pedidos
              </Button>
              {user?.role === 'store' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('MyPurchases'))}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Minhas Compras
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(createPageUrl('Favorites'))}
              >
                <Heart className="w-4 h-4 mr-2" />
                Favoritos
              </Button>
              {user.role === 'store' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('StoreProfile'))}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Minha Loja
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Tipo de conta:</span>
                <p className="font-medium">
                  {user.role === 'customer' ? 'Cliente' : user.role === 'store' ? 'Lojista' : 'Admin'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium capitalize">{user.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Membro desde:</span>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Endereço */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar Endereço' : 'Adicionar Endereço'}
            </DialogTitle>
            <DialogDescription>
              {editingAddress 
                ? 'Atualize as informações do endereço abaixo' 
                : 'Preencha os dados do novo endereço de entrega'}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            address={editingAddress}
            onSubmit={handleAddressSubmit}
            onCancel={() => {
              setAddressDialogOpen(false);
              setEditingAddress(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onSuccess={() => {
          setLoginDialogOpen(false);
          loadUserData();
        }}
      />
    </div>
  );
}

