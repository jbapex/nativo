import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { City } from '@/api/apiClient';

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

export default function AddressForm({ 
  address = null, 
  onSubmit, 
  onCancel,
  loading = false 
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    label: address?.label || '',
    recipient_name: address?.recipient_name || '',
    phone: address?.phone || '',
    zip_code: address?.zip_code || '',
    street: address?.street || '',
    number: address?.number || '',
    complement: address?.complement || '',
    neighborhood: address?.neighborhood || '',
    city: address?.city || '',
    state: address?.state || '',
    reference: address?.reference || '',
    type: address?.type || 'delivery',
    is_default: address?.is_default || false,
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Carregar cidades
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const citiesData = await City.list();
      setCities(citiesData || []);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  // Atualizar formData quando address mudar ou cidades carregarem
  useEffect(() => {
    if (address) {
      // Atualizar todos os campos do formulário quando o endereço mudar
      const cityId = cities.length > 0 ? (() => {
        // Se tiver um endereço e as cidades já foram carregadas, buscar o ID da cidade
        const city = cities.find(c => 
          c.name.toLowerCase() === address.city?.toLowerCase() && 
          c.state === address.state?.toUpperCase()
        );
        return city ? city.id : address.city;
      })() : address.city;
      
      setFormData({
        label: address.label || '',
        recipient_name: address.recipient_name || '',
        phone: address.phone || '',
        zip_code: address.zip_code || '',
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: cityId || '',
        state: address.state || '',
        reference: address.reference || '',
        type: address.type || 'delivery',
        is_default: address.is_default || false,
      });
    } else {
      // Se não tiver endereço, limpar o formulário
      setFormData({
        label: '',
        recipient_name: '',
        phone: '',
        zip_code: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        reference: '',
        type: 'delivery',
        is_default: false,
      });
    }
  }, [address, cities]);

  // Filtrar cidades por estado
  const getFilteredCities = () => {
    if (!formData.state) {
      return [];
    }
    
    const stateUpper = formData.state.toUpperCase().trim();
    const filtered = cities.filter(city => {
      const cityState = (city.state || '').toUpperCase().trim();
      const isActive = city.active !== false;
      const matchesState = cityState === stateUpper;
      
      return isActive && matchesState;
    });
    
    // Ordenar cidades alfabeticamente
    return filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Buscar endereço por CEP usando ViaCEP
  const fetchAddressByCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        // Buscar cidade pelo nome no dropdown
        let cityId = data.localidade || '';
        if (data.uf && data.localidade && cities.length > 0) {
          const city = cities.find(c => 
            c.name.toLowerCase() === data.localidade.toLowerCase() && 
            c.state === data.uf.toUpperCase()
          );
          if (city) {
            cityId = city.id;
          }
        }
        
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: cityId || data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      } else {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP digitado',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar o endereço pelo CEP',
        variant: 'destructive',
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepBlur = (e) => {
    const cep = e.target.value;
    if (cep) {
      fetchAddressByCep(cep);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validações
    if (!formData.recipient_name) {
      toast({
        title: 'Erro',
        description: 'Nome do destinatário é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.zip_code) {
      toast({
        title: 'Erro',
        description: 'CEP é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.street) {
      toast({
        title: 'Erro',
        description: 'Rua é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.number) {
      toast({
        title: 'Erro',
        description: 'Número é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.neighborhood) {
      toast({
        title: 'Erro',
        description: 'Bairro é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.city) {
      toast({
        title: 'Erro',
        description: 'Cidade é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    // Validar se a cidade existe e está no estado correto
    if (formData.state) {
      const selectedCity = cities.find(c => c.id === formData.city);
      if (selectedCity) {
        if (selectedCity.state !== formData.state.toUpperCase()) {
          toast({
            title: 'Erro',
            description: 'A cidade selecionada não pertence ao estado informado',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    if (!formData.state) {
      toast({
        title: 'Erro',
        description: 'Estado é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    // Se city for um ID, buscar o nome da cidade para enviar
    const submitData = { ...formData };
    const selectedCity = cities.find(c => c.id === formData.city);
    if (selectedCity) {
      submitData.city = selectedCity.name;
    }
    
    onSubmit(submitData);
  };

  const formatCep = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Label (apelido) */}
        <div>
          <Label htmlFor="label">Apelido (opcional)</Label>
          <Input
            id="label"
            placeholder="Ex: Casa, Trabalho"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            disabled={loading}
          />
        </div>

        {/* Tipo */}
        <div>
          <Label htmlFor="type">Tipo de Endereço</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delivery">Entrega</SelectItem>
              <SelectItem value="billing">Cobrança</SelectItem>
              <SelectItem value="both">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nome do destinatário */}
      <div>
        <Label htmlFor="recipient_name">Nome do Destinatário *</Label>
        <Input
          id="recipient_name"
          placeholder="Nome completo"
          value={formData.recipient_name}
          onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      {/* Telefone */}
      <div>
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input
          id="phone"
          placeholder="(00) 00000-0000"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
          disabled={loading}
        />
      </div>

      {/* CEP */}
      <div>
        <Label htmlFor="zip_code">CEP *</Label>
        <Input
          id="zip_code"
          placeholder="00000-000"
          value={formatCep(formData.zip_code)}
          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value.replace(/\D/g, '') })}
          onBlur={handleCepBlur}
          required
          disabled={loading || loadingCep}
          maxLength={9}
        />
        {loadingCep && (
          <p className="text-sm text-gray-500 mt-1">Buscando endereço...</p>
        )}
      </div>

      {/* Rua */}
      <div>
        <Label htmlFor="street">Rua *</Label>
        <Input
          id="street"
          placeholder="Nome da rua"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          required
          disabled={loading || loadingCep}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Número */}
        <div>
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            placeholder="123"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        {/* Complemento */}
        <div className="md:col-span-2">
          <Label htmlFor="complement">Complemento (opcional)</Label>
          <Input
            id="complement"
            placeholder="Apto, Bloco, etc"
            value={formData.complement}
            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      {/* Bairro */}
      <div>
        <Label htmlFor="neighborhood">Bairro *</Label>
        <Input
          id="neighborhood"
          placeholder="Nome do bairro"
          value={formData.neighborhood}
          onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
          required
          disabled={loading || loadingCep}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado */}
        <div>
          <Label htmlFor="state">Estado *</Label>
          <Select
            value={formData.state}
            onValueChange={(value) => {
              setFormData({ 
                ...formData, 
                state: value,
                city: "" // Limpar cidade quando mudar estado
              });
            }}
            disabled={loading || loadingCep}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cidade */}
        <div>
          <Label htmlFor="city">Cidade *</Label>
          <Select
            value={formData.city || ""}
            onValueChange={(value) => setFormData({ ...formData, city: value })}
            disabled={loading || loadingCep || loadingCities || !formData.state}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                loadingCities 
                  ? "Carregando..." 
                  : !formData.state 
                    ? "Selecione o estado primeiro" 
                    : "Selecione uma cidade"
              } />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {loadingCities ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  Carregando cidades...
                </div>
              ) : !formData.state ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  Selecione o estado primeiro
                </div>
              ) : getFilteredCities().length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  Nenhuma cidade disponível para este estado
                </div>
              ) : (
                getFilteredCities().map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} {city.state ? `- ${city.state}` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ponto de referência */}
      <div>
        <Label htmlFor="reference">Ponto de Referência (opcional)</Label>
        <Input
          id="reference"
          placeholder="Ex: Próximo ao mercado"
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          disabled={loading}
        />
      </div>

      {/* Endereço padrão */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          disabled={loading}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="is_default" className="cursor-pointer">
          Definir como endereço padrão
        </Label>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading || loadingCep}>
          {loading ? 'Salvando...' : address ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

