import React, { useState, useEffect } from "react";
import { City } from "@/api/entities";
import AdminLayout from "../components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Plus, Search, Edit, Trash2, AlertCircle, CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCity, setNewCity] = useState({ name: "", state: "" });
  const [editingCity, setEditingCity] = useState(null);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [selectedCities, setSelectedCities] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      const data = await City.list();
      setCities(data);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
      setError("Erro ao carregar cidades. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCity) {
        await City.update(editingCity.id, {
          ...editingCity,
          name: newCity.name,
          state: newCity.state.toUpperCase()
        });
        setSuccess("Cidade atualizada com sucesso!");
      } else {
        await City.create({
          name: newCity.name,
          state: newCity.state.toUpperCase(),
          is_imported: false
        });
        setSuccess("Cidade criada com sucesso!");
      }
      
      setDialogOpen(false);
      setNewCity({ name: "", state: "" });
      setEditingCity(null);
      loadCities();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Erro ao salvar cidade:", error);
      setError("Erro ao salvar cidade. Verifique os dados e tente novamente.");
    }
  };

  const loadCitiesFromIBGE = async (state, currentCityName = null) => {
    if (!state) {
      setAvailableCities([]);
      return;
    }

    try {
      setLoadingCities(true);
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`);
      if (!response.ok) {
        throw new Error('Erro ao buscar cidades do IBGE');
      }
      
      const ibgeCities = await response.json();
      const citiesList = ibgeCities.map(city => ({
        id: city.id,
        name: city.nome
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setAvailableCities(citiesList);
      
      // Se estiver editando e a cidade atual não estiver na lista, adicionar
      if (currentCityName && editingCity) {
        const cityExists = citiesList.some(c => c.name.toLowerCase() === currentCityName.toLowerCase());
        if (!cityExists) {
          setAvailableCities([...citiesList, { id: 'custom', name: currentCityName }]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cidades do IBGE:', error);
      setError('Erro ao carregar cidades. Tente novamente.');
      setAvailableCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleStateChange = (state) => {
    setNewCity({ ...newCity, state: state, name: "" });
    setAvailableCities([]);
    if (state) {
      loadCitiesFromIBGE(state);
    }
  };

  const handleEditClick = async (city) => {
    setEditingCity(city);
    setNewCity({
      name: city.name,
      state: city.state
    });
    setAvailableCities([]);
    if (city.state) {
      await loadCitiesFromIBGE(city.state, city.name);
    }
    setDialogOpen(true);
  };

  const handleDeleteClick = (city) => {
    setCityToDelete(city);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!cityToDelete) return;
    
    try {
      await City.delete(cityToDelete.id);
      setSuccess("Cidade excluída com sucesso!");
      loadCities();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Erro ao excluir cidade:", error);
      setError("Erro ao excluir cidade. Tente novamente.");
    } finally {
      setDeleteDialogOpen(false);
      setCityToDelete(null);
    }
  };

  const toggleStatus = async (city) => {
    try {
      await City.update(city.id, { active: !city.active });
      loadCities();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setError("Erro ao atualizar status. Tente novamente.");
    }
  };

  const BRAZILIAN_STATES = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
  ];

  const filteredCities = cities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !filterState || filterState === "all" || city.state === filterState;
    return matchesSearch && matchesState;
  });

  const handleSelectCity = (cityId) => {
    setSelectedCities(prev => 
      prev.includes(cityId) 
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCities.length === filteredCities.length) {
      setSelectedCities([]);
    } else {
      setSelectedCities(filteredCities.map(c => c.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCities.length === 0) {
      setError('Selecione pelo menos uma cidade');
      return;
    }

    try {
      if (action === 'activate') {
        for (const cityId of selectedCities) {
          await City.update(cityId, { active: true });
        }
        setSuccess(`${selectedCities.length} cidade(s) ativada(s) com sucesso!`);
      } else if (action === 'deactivate') {
        for (const cityId of selectedCities) {
          await City.update(cityId, { active: false });
        }
        setSuccess(`${selectedCities.length} cidade(s) desativada(s) com sucesso!`);
      } else if (action === 'delete') {
        if (!confirm(`Tem certeza que deseja excluir ${selectedCities.length} cidade(s)?`)) {
          return;
        }
        // Usar método de deletar em massa
        await City.deleteBulk(selectedCities);
        setSuccess(`${selectedCities.length} cidade(s) excluída(s) com sucesso!`);
      }
      
      setSelectedCities([]);
      loadCities();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error('Erro ao executar ação em massa:', error);
      setError('Erro ao executar ação. Tente novamente.');
    }
  };



  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Cidades
            </h1>
            <div className="flex gap-2">
              <Button onClick={() => {
                setEditingCity(null);
                setNewCity({ name: "", state: "" });
                setAvailableCities([]);
                setDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Cidade
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar cidades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-[200px]">
                  <Select value={filterState || "all"} onValueChange={setFilterState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {filterState && filterState !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterState("all")}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar filtro
                  </Button>
                )}
              </div>

              {/* Ações em massa */}
              {selectedCities.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCities.length} cidade(s) selecionada(s)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('activate')}
                    >
                      Ativar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('deactivate')}
                    >
                      Desativar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleBulkAction('delete')}
                    >
                      Excluir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCities([])}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredCities.length > 0 && selectedCities.length === filteredCities.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lojas</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma cidade encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCities.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCities.includes(city.id)}
                            onCheckedChange={() => handleSelectCity(city.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell>{city.state}</TableCell>
                        <TableCell>
                          <Switch
                            checked={city.active}
                            onCheckedChange={() => toggleStatus(city)}
                          />
                        </TableCell>
                        <TableCell>{city.stores_count || 0}</TableCell>
                        <TableCell>{city.products_count || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(city)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(city)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCity ? "Editar Cidade" : "Nova Cidade"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estado (UF)</label>
                <Select
                  value={newCity.state}
                  onValueChange={handleStateChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label} ({state.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                {!newCity.state ? (
                  <div className="text-sm text-gray-500 p-2 border rounded-md bg-gray-50">
                    Selecione o estado primeiro
                  </div>
                ) : loadingCities ? (
                  <div className="text-sm text-gray-500 p-2 border rounded-md bg-gray-50 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                    Carregando cidades...
                  </div>
                ) : availableCities.length === 0 ? (
                  <div className="text-sm text-gray-500 p-2 border rounded-md bg-gray-50">
                    Nenhuma cidade disponível para este estado
                  </div>
                ) : (
                  <Select
                    value={newCity.name}
                    onValueChange={(value) => setNewCity({ ...newCity, name: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableCities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false);
                setEditingCity(null);
                setNewCity({ name: "", state: "" });
                setAvailableCities([]);
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!newCity.state || !newCity.name || loadingCities}>
                {editingCity ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir a cidade <span className="font-semibold">{cityToDelete?.name}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCityToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}