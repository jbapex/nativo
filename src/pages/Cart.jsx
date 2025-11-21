import React, { useState, useEffect, useRef } from "react";
import { Cart as CartAPI, UserAddresses, City } from "@/api/apiClient";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Store,
  Trash2,
  Plus,
  Minus,
  MessageSquare,
  Loader2,
  Package,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoginDialog from "@/components/LoginDialog";
import { QRCodeSVG } from "qrcode.react";
import AddressForm from "@/components/AddressForm";

export default function Cart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [updating, setUpdating] = useState({});
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(false);
  const paymentCheckIntervalRef = useRef(null);
  const [checkoutData, setCheckoutData] = useState({
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_zip: "",
    shipping_phone: "",
    notes: "",
    payment_method: "whatsapp"
  });
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // Endereço sendo editado
  const [newAddressDialogOpen, setNewAddressDialogOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['whatsapp']); // Métodos aceitos pela loja
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  useEffect(() => {
    loadUser();
    loadCart();
    loadCities();
    
    // Ouvir mudanças de autenticação
    const handleAuthChange = () => {
      loadUser();
      loadCart();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const citiesData = await City.list();
      setCities(citiesData || []);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      // Usuário não logado
      setUser(null);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await CartAPI.get();
      setCart(cartData);
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
      } else {
        console.error("Erro ao carregar carrinho:", error);
      }
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      await CartAPI.updateItem(itemId, newQuantity);
      await loadCart();
      toast({
        title: "Sucesso",
        description: "Quantidade atualizada",
      });
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a quantidade",
        variant: "destructive",
      });
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      await CartAPI.removeItem(itemId);
      await loadCart();
      toast({
        title: "Sucesso",
        description: "Item removido do carrinho",
      });
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o item",
        variant: "destructive",
      });
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCheckout = async (store) => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }
    
    // Debug: Log do store sendo selecionado
    console.log('=== DEBUG CHECKOUT ===');
    console.log('Store selecionado:', store);
    console.log('Store ID:', store.store_id);
    console.log('Store items:', store.items);
    
    setSelectedStore(store);
    
    // Carregar métodos de pagamento aceitos pela loja
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/stores/${store.store_id}/payment-methods`);
      if (response.ok) {
        const data = await response.json();
        const methods = data.payment_methods || ['whatsapp'];
        setAvailablePaymentMethods(methods);
        
        // Definir método padrão (primeiro disponível)
        setCheckoutData(prev => ({
          ...prev,
          payment_method: methods[0] || 'whatsapp'
        }));
      } else {
        // Fallback para WhatsApp se não conseguir carregar
        setAvailablePaymentMethods(['whatsapp']);
        setCheckoutData(prev => ({
          ...prev,
          payment_method: 'whatsapp'
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar métodos de pagamento:", error);
      // Fallback para WhatsApp
      setAvailablePaymentMethods(['whatsapp']);
      setCheckoutData(prev => ({
        ...prev,
        payment_method: 'whatsapp'
      }));
    } finally {
      setLoadingPaymentMethods(false);
    }
    
    // Carregar endereços salvos
    try {
      const addresses = await UserAddresses.list();
      setSavedAddresses(addresses || []);
      
      // Se tiver endereço padrão, selecionar automaticamente
      const defaultAddress = addresses?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        fillAddressData(defaultAddress);
      } else if (addresses?.length > 0) {
        // Se não tiver padrão, selecionar o primeiro
        setSelectedAddressId(addresses[0].id);
        fillAddressData(addresses[0]);
      } else {
        setSelectedAddressId("");
        setEditingAddress(null);
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
      setSavedAddresses([]);
      setShowAddressForm(true);
    }
    
    setCheckoutDialogOpen(true);
  };

  const fillAddressData = (address) => {
    console.log("Preenchendo dados do endereço:", address);
    console.log("Cidades disponíveis:", cities.length);
    
    // Buscar cidade pelo nome no dropdown (se as cidades já foram carregadas)
    let cityId = address.city;
    if (cities.length > 0 && address.city) {
      const city = cities.find(c => {
        const cityNameMatch = c.name?.toLowerCase().trim() === address.city?.toLowerCase().trim();
        const stateMatch = c.state?.toUpperCase() === address.state?.toUpperCase();
        return cityNameMatch && stateMatch;
      });
      if (city) {
        cityId = city.id;
        console.log("Cidade encontrada no dropdown:", city.name, "ID:", city.id);
      } else {
        console.log("Cidade não encontrada no dropdown. Procurando:", address.city, "Estado:", address.state);
        // Tentar encontrar por nome parcial
        const partialMatch = cities.find(c => 
          c.name?.toLowerCase().includes(address.city?.toLowerCase()) && 
          c.state?.toUpperCase() === address.state?.toUpperCase()
        );
        if (partialMatch) {
          cityId = partialMatch.id;
          console.log("Cidade encontrada por correspondência parcial:", partialMatch.name);
        }
      }
    }
    
    const addressData = {
      ...checkoutData,
      shipping_address: `${address.street || ''}, ${address.number || ''}${address.complement ? ` - ${address.complement}` : ''}`.trim(),
      shipping_city: cityId || address.city || "", // Usar ID se encontrado, senão usar nome
      shipping_state: address.state || "",
      shipping_zip: address.zip_code || "",
      shipping_phone: address.phone || user?.phone || "",
    };
    
    console.log("Dados preenchidos no checkout:", addressData);
    
    setCheckoutData(addressData);
    setValidationErrors({}); // Limpar erros ao preencher
  };

  // Filtrar cidades por estado
  const getFilteredCities = () => {
    if (!checkoutData.shipping_state) {
      return [];
    }
    
    const stateUpper = checkoutData.shipping_state.toUpperCase().trim();
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

  const handleAddressSelect = (addressId) => {
    if (addressId === "new") {
      setEditingAddress(null);
      setShowAddressForm(true);
      setSelectedAddressId("");
      // Limpar campos
      setCheckoutData({
        ...checkoutData,
        shipping_address: "",
        shipping_city: "",
        shipping_state: "",
        shipping_zip: "",
        shipping_phone: "",
      });
    } else {
      setShowAddressForm(false);
      setSelectedAddressId(addressId);
      const address = savedAddresses.find(addr => addr.id === addressId);
      if (address) {
        fillAddressData(address);
      }
    }
  };

  const handleNewAddressSubmit = async (addressData) => {
    try {
      let updatedAddress;
      
      // Se estiver editando, atualizar o endereço existente
      if (editingAddress && editingAddress.id) {
        updatedAddress = await UserAddresses.update(editingAddress.id, {
          ...addressData,
          recipient_name: addressData.recipient_name || user?.full_name || "",
        });
        
        toast({
          title: "Sucesso",
          description: "Endereço atualizado com sucesso!",
        });
      } else {
        // Caso contrário, criar novo endereço
        updatedAddress = await UserAddresses.create({
          ...addressData,
          recipient_name: addressData.recipient_name || user?.full_name || "",
        });
        
        toast({
          title: "Sucesso",
          description: "Endereço adicionado e selecionado!",
        });
      }
      
      // Atualizar lista de endereços
      const addresses = await UserAddresses.list();
      setSavedAddresses(addresses || []);
      
      // Selecionar o endereço atualizado/criado
      setSelectedAddressId(updatedAddress.id);
      fillAddressData(updatedAddress);
      setShowAddressForm(false);
      setEditingAddress(null);
      setNewAddressDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o endereço",
        variant: "destructive",
      });
    }
  };

  // Validar CEP
  const validateCEP = (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return 'CEP deve ter 8 dígitos';
    }
    return null;
  };

  // Validar formulário
  const validateCheckoutForm = () => {
    const errors = {};
    
    console.log("Validando formulário de checkout:", checkoutData);
    
    if (!checkoutData.shipping_address || checkoutData.shipping_address.trim() === '') {
      errors.shipping_address = 'Endereço é obrigatório';
      console.log("Erro: shipping_address vazio");
    }
    
    if (!checkoutData.shipping_city || checkoutData.shipping_city.trim() === '') {
      errors.shipping_city = 'Cidade é obrigatória';
      console.log("Erro: shipping_city vazio");
    } else {
      // Validar se a cidade existe e está no estado correto
      const selectedCity = cities.find(c => c.id === checkoutData.shipping_city);
      if (selectedCity) {
        if (selectedCity.state !== checkoutData.shipping_state?.toUpperCase()) {
          errors.shipping_city = 'A cidade selecionada não pertence ao estado informado';
          console.log("Erro: cidade não pertence ao estado");
        }
      }
    }
    
    if (!checkoutData.shipping_state || checkoutData.shipping_state.trim() === '') {
      errors.shipping_state = 'Estado é obrigatório';
      console.log("Erro: shipping_state vazio");
    }
    
    if (!checkoutData.shipping_zip || checkoutData.shipping_zip.trim() === '') {
      errors.shipping_zip = 'CEP é obrigatório';
      console.log("Erro: shipping_zip vazio");
    } else {
      const cepError = validateCEP(checkoutData.shipping_zip);
      if (cepError) {
        errors.shipping_zip = cepError;
        console.log("Erro: CEP inválido", cepError);
      }
    }
    
    if (!checkoutData.shipping_phone || checkoutData.shipping_phone.trim() === '') {
      errors.shipping_phone = 'Telefone é obrigatório';
      console.log("Erro: shipping_phone vazio");
    }
    
    console.log("Erros encontrados:", errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedStore) return;

    // Validar formulário antes de enviar
    if (!validateCheckoutForm()) {
      const missingFields = [];
      if (!checkoutData.shipping_address || checkoutData.shipping_address.trim() === '') {
        missingFields.push("Endereço");
      }
      if (!checkoutData.shipping_city || checkoutData.shipping_city.trim() === '') {
        missingFields.push("Cidade");
      }
      if (!checkoutData.shipping_state || checkoutData.shipping_state.trim() === '') {
        missingFields.push("Estado");
      }
      if (!checkoutData.shipping_zip || checkoutData.shipping_zip.trim() === '') {
        missingFields.push("CEP");
      }
      if (!checkoutData.shipping_phone || checkoutData.shipping_phone.trim() === '') {
        missingFields.push("Telefone");
      }
      
      const errorMessage = missingFields.length > 0 
        ? `Campos obrigatórios não preenchidos: ${missingFields.join(", ")}`
        : "Por favor, preencha todos os campos obrigatórios corretamente";
      
      toast({
        title: "Erro de validação",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingCheckout(true);
      
      // Se shipping_city for um ID de cidade, buscar o nome da cidade
      let cityName = checkoutData.shipping_city;
      const selectedCity = cities.find(c => c.id === checkoutData.shipping_city);
      if (selectedCity) {
        cityName = selectedCity.name;
      }
      
      const orderData = {
        ...checkoutData,
        shipping_city: cityName, // Enviar nome da cidade para o backend
      };
      
      // Debug: Log antes de fazer checkout
      console.log('=== DEBUG CHECKOUT SUBMIT ===');
      console.log('Selected Store:', selectedStore);
      console.log('Store ID:', selectedStore?.store_id);
      console.log('Order Data:', orderData);
      
      // Recarregar carrinho antes de fazer checkout para garantir dados atualizados
      await loadCart();
      
      // Verificar se a loja ainda existe no carrinho atualizado
      const updatedCart = await CartAPI.get();
      const storeInCart = updatedCart.stores?.find(s => s.store_id === selectedStore.store_id);
      if (!storeInCart || !storeInCart.items || storeInCart.items.length === 0) {
        toast({
          title: "Erro",
          description: "Os itens desta loja não estão mais no carrinho. Por favor, recarregue a página.",
          variant: "destructive",
        });
        setProcessingCheckout(false);
        return;
      }
      
      // Atualizar selectedStore com dados atualizados
      const finalStore = storeInCart;
      
      // Se o método de pagamento for Mercado Pago, criar pedido primeiro e depois a preferência
      if (orderData.payment_method === 'mercadopago') {
        // Criar pedido com método mercadopago
        console.log('Criando pedido com Mercado Pago, store_id:', finalStore.store_id);
        const order = await CartAPI.checkout(finalStore.store_id, orderData);
        
        // Criar preferência de pagamento no Mercado Pago
        try {
          console.log('Criando preferência de pagamento...');
          console.log('Order ID:', order.id);
          console.log('Store ID:', finalStore.store_id);
          
          const paymentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/payments/create-preference`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({
              order_id: order.id,
              store_id: finalStore.store_id
            }),
          });

          if (!paymentResponse.ok) {
            let errorData;
            try {
              errorData = await paymentResponse.json();
            } catch (parseError) {
              errorData = { error: `HTTP ${paymentResponse.status}: ${paymentResponse.statusText}` };
            }
            console.error('Erro ao criar preferência:', errorData);
            console.error('Status:', paymentResponse.status);
            console.error('Status Text:', paymentResponse.statusText);
            
            const errorMessage = errorData.details || errorData.error || `Erro ${paymentResponse.status}: ${paymentResponse.statusText}`;
            throw new Error(errorMessage);
          }

          const paymentData = await paymentResponse.json();
          console.log('Preferência criada com sucesso:', paymentData);
          
          // Redirecionar para o Mercado Pago
          const initPoint = paymentData.init_point || paymentData.sandbox_init_point;
          if (initPoint) {
            window.location.href = initPoint;
            return; // Não continuar o fluxo normal
          } else {
            throw new Error('Link de pagamento não disponível');
          }
        } catch (error) {
          console.error("Erro ao criar preferência de pagamento:", error);
          toast({
            title: "Erro",
            description: error.message || "Não foi possível criar o link de pagamento. Tente novamente.",
            variant: "destructive",
          });
          setProcessingCheckout(false);
          return;
        }
      } else {
        // Fluxo normal para WhatsApp
        console.log('Criando pedido com WhatsApp, store_id:', finalStore.store_id);
        const order = await CartAPI.checkout(finalStore.store_id, orderData);
        
        toast({
          title: "Pedido criado!",
          description: `Pedido #${order.id.slice(0, 8).toUpperCase()} criado com sucesso`,
        });

        setCreatedOrder(order);
        setCheckoutDialogOpen(false);
        
        // Se tiver informações de pagamento (PIX ou link), mostrar dialog de pagamento
        if (order.payment_info && (order.payment_info.pix_qr_code || order.payment_info.payment_link)) {
          setPaymentDialogOpen(true);
          // Iniciar verificação automática do status do pagamento
          if (order.payment_id) {
            startPaymentStatusCheck(order.id, order.payment_id);
          }
        } else {
          // Se o método de pagamento for WhatsApp, abrir WhatsApp automaticamente
          if (orderData.payment_method === 'whatsapp' && order.store_whatsapp) {
            const formatOrderMessage = (order) => {
              const itemsText = order.items?.map(item => 
                `• ${item.product_name} x${item.quantity} - ${formatCurrency(item.subtotal || item.product_price * item.quantity)}`
              ).join('\n') || 'Nenhum item';
              
              let message = `Olá! Acabei de fazer um pedido:\n\n`;
              message += `📦 *Pedido #${order.id.slice(0, 8).toUpperCase()}*\n\n`;
              message += `*Produtos:*\n${itemsText}\n\n`;
              
              if (order.subtotal && order.shipping_cost !== undefined) {
                message += `Subtotal: ${formatCurrency(order.subtotal)}\n`;
                if (order.shipping_cost > 0) {
                  message += `Frete: ${formatCurrency(order.shipping_cost)}\n`;
                } else {
                  message += `Frete: Grátis\n`;
                }
              }
              
              message += `*Total: ${formatCurrency(order.total || order.total_amount)}*\n\n`;
              
              if (order.shipping_address) {
                message += `*Endereço de entrega:*\n`;
                message += `${order.shipping_address}\n`;
                if (order.shipping_city) {
                  message += `${order.shipping_city}`;
                  if (order.shipping_state) message += `, ${order.shipping_state}`;
                  if (order.shipping_zip) message += ` - ${order.shipping_zip}`;
                  message += `\n`;
                }
                if (order.shipping_phone) {
                  message += `Telefone: ${order.shipping_phone}\n`;
                }
                message += `\n`;
              }
              
              if (order.notes) {
                message += `*Observações:*\n${order.notes}\n\n`;
              }
              
              message += `Por favor, confirme o pedido e envie as informações de pagamento.`;
              
              return message;
            };
            
            const message = formatOrderMessage(order);
            const url = `https://wa.me/${order.store_whatsapp}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
          }
        }
        
        // Limpar e recarregar
        setSelectedStore(null);
        setCheckoutData({
          shipping_address: "",
          shipping_city: "",
          shipping_state: "",
          shipping_zip: "",
          shipping_phone: "",
          notes: "",
          payment_method: "whatsapp"
        });
        await loadCart();
        navigate(createPageUrl(`OrderDetail?id=${order.id}`));
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      console.error("Erro completo:", error);
      console.error("Store ID usado:", selectedStore?.store_id);
      
      // Mostrar erro mais detalhado se disponível
      let errorMessage = error.message || "Não foi possível criar o pedido";
      if (error.details?.debug) {
        console.error("Debug info do backend:", error.details.debug);
        const debugInfo = error.details.debug;
        errorMessage += `\n\nDebug: Store ID enviado: ${debugInfo.store_id}\nItens no carrinho: ${JSON.stringify(debugInfo.all_items_in_cart, null, 2)}`;
      } else if (error.details) {
        console.error("Detalhes do erro:", error.details);
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingCheckout(false);
    }
  };

  // Função para verificar status do pagamento periodicamente
  const startPaymentStatusCheck = (orderId, paymentId) => {
    if (!orderId) return;
    
    // Limpar intervalo anterior se existir
    if (paymentCheckIntervalRef.current) {
      clearInterval(paymentCheckIntervalRef.current);
    }
    
    setCheckingPaymentStatus(true);
    let attempts = 0;
    const maxAttempts = 60; // Verificar por até 5 minutos (60 * 5s)
    
    paymentCheckIntervalRef.current = setInterval(async () => {
      attempts++;
      
      try {
        console.log(`Verificando status do pagamento (tentativa ${attempts}/${maxAttempts})...`);
        
        // Buscar pedido atualizado
        const { Orders } = await import("@/api/apiClient");
        const updatedOrder = await Orders.get(orderId);
        
        // Atualizar order local
        setCreatedOrder(updatedOrder);
        
        // Se o status mudou para "paid" ou "approved", parar verificação
        if (updatedOrder.payment_status === 'paid' || updatedOrder.payment_status === 'approved') {
          console.log('Pagamento confirmado!');
          if (paymentCheckIntervalRef.current) {
            clearInterval(paymentCheckIntervalRef.current);
            paymentCheckIntervalRef.current = null;
          }
          setCheckingPaymentStatus(false);
          
          toast({
            title: "Pagamento confirmado!",
            description: "Seu pagamento foi processado com sucesso.",
          });
          
          // Fechar dialog após 2 segundos e redirecionar
          setTimeout(() => {
            handleGoToOrder();
          }, 2000);
          
          return;
        }
        
        // Se excedeu o número máximo de tentativas, parar
        if (attempts >= maxAttempts) {
          console.log('Limite de tentativas atingido. Parando verificação automática.');
          if (paymentCheckIntervalRef.current) {
            clearInterval(paymentCheckIntervalRef.current);
            paymentCheckIntervalRef.current = null;
          }
          setCheckingPaymentStatus(false);
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        // Continuar tentando mesmo com erro
      }
    }, 5000); // Verificar a cada 5 segundos
  };
  
  // Limpar intervalo quando o componente for desmontado ou dialog fechado
  useEffect(() => {
    return () => {
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current);
        paymentCheckIntervalRef.current = null;
      }
    };
  }, []);

  const handleCopyPixKey = () => {
    if (createdOrder?.payment_info?.pix_key) {
      navigator.clipboard.writeText(createdOrder.payment_info.pix_key);
      toast({
        title: "Copiado!",
        description: "Chave PIX copiada para a área de transferência",
      });
    }
  };

  const handleGoToOrder = () => {
    if (createdOrder) {
      setPaymentDialogOpen(false);
      setSelectedStore(null);
      setCreatedOrder(null);
      setCheckingPaymentStatus(false);
      setCheckoutData({
        shipping_address: "",
        shipping_city: "",
        shipping_state: "",
        shipping_zip: "",
        shipping_phone: "",
        notes: "",
        payment_method: "whatsapp"
      });
      loadCart();
      navigate(createPageUrl(`OrderDetail?id=${createdOrder.id}`));
    }
  };
  
  // Limpar verificação quando o dialog for fechado
  useEffect(() => {
    if (!paymentDialogOpen) {
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current);
        paymentCheckIntervalRef.current = null;
      }
      setCheckingPaymentStatus(false);
    }
  }, [paymentDialogOpen]);

  const handleWhatsApp = (store) => {
    if (!store.store_whatsapp) {
      toast({
        title: "Erro",
        description: "WhatsApp da loja não disponível",
        variant: "destructive",
      });
      return;
    }

    // Criar mensagem com os produtos
    const itemsText = store.items.map(item => 
      `• ${item.product_name} x${item.quantity} - ${formatCurrency(item.subtotal)}`
    ).join('\n');

    const message = `Olá! Gostaria de fazer um pedido:\n\n${itemsText}\n\nTotal: ${formatCurrency(store.total)}`;
    const url = `https://wa.me/${store.store_whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Faça login para ver seu carrinho
              </h3>
              <p className="text-gray-600 mb-4">
                Você precisa estar logado para adicionar produtos ao carrinho
              </p>
              <Button onClick={() => setLoginDialogOpen(true)}>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
          <LoginDialog 
            open={loginDialogOpen} 
            onOpenChange={setLoginDialogOpen}
            onSuccess={() => {
              loadUser();
              loadCart();
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.stores || cart.stores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Home"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continuar Comprando
          </Button>

          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Seu carrinho está vazio
              </h3>
              <p className="text-gray-600 mb-4">
                Adicione produtos ao carrinho para continuar
              </p>
              <Button onClick={() => navigate(createPageUrl("Home"))}>
                Ver Produtos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continuar Comprando
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Carrinho de Compras
          </h1>
          <p className="text-gray-600 mt-2">
            {cart.total_items} {cart.total_items === 1 ? 'item' : 'itens'} de {cart.stores_count} {cart.stores_count === 1 ? 'loja' : 'lojas'}
          </p>
        </div>

        <div className="space-y-6">
          {cart.stores.map((store) => (
            <Card key={store.store_id} className="overflow-hidden">
              <CardHeader className="bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {store.store_logo ? (
                      <img 
                        src={store.store_logo} 
                        alt={store.store_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Store className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{store.store_name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {store.items_count} {store.items_count === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total desta loja</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(store.total)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  {store.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                      {item.product_images && item.product_images.length > 0 ? (
                        <img
                          src={item.product_images[0]}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatCurrency(item.product_price)} cada
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updating[item.id]}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updating[item.id] || (item.product_stock !== null && item.quantity >= item.product_stock)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updating[item.id]}
                            className="ml-auto text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  {store.store_checkout_enabled && (
                    <Button
                      onClick={() => handleCheckout(store)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizar Pedido
                    </Button>
                  )}
                  {store.store_whatsapp && (
                    <Button
                      variant={store.store_checkout_enabled ? "outline" : "default"}
                      onClick={() => handleWhatsApp(store)}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {store.store_checkout_enabled ? "Contatar via WhatsApp" : "Finalizar via WhatsApp"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo Geral */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Geral</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(cart.grand_total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Checkout */}
      <Dialog open={checkoutDialogOpen} onOpenChange={(open) => {
        setCheckoutDialogOpen(open);
        if (!open) {
          // Resetar estados ao fechar
          setSelectedAddressId("");
          setShowAddressForm(false);
          setEditingAddress(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido - {selectedStore?.store_name}</DialogTitle>
            <DialogDescription>
              Preencha os dados para finalizar o pedido desta loja
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Mensagem de erro de validação */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="text-red-600 font-semibold">⚠️ Campos obrigatórios não preenchidos:</div>
                </div>
                <ul className="mt-2 list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.shipping_address && (
                    <li>Endereço de entrega</li>
                  )}
                  {validationErrors.shipping_city && (
                    <li>Cidade</li>
                  )}
                  {validationErrors.shipping_state && (
                    <li>Estado</li>
                  )}
                  {validationErrors.shipping_zip && (
                    <li>CEP</li>
                  )}
                  {validationErrors.shipping_phone && (
                    <li>Telefone</li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Seleção de Endereço */}
            {savedAddresses.length > 0 && !showAddressForm && (
              <div>
                <Label>Selecione um endereço salvo</Label>
                <Select
                  value={selectedAddressId}
                  onValueChange={handleAddressSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um endereço" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedAddresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {address.label && (
                                <span className="font-medium">{address.label}</span>
                              )}
                              {address.is_default && (
                                <Badge variant="outline" className="text-xs">Padrão</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {address.street}, {address.number} - {address.neighborhood}, {address.city}/{address.state}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Adicionar novo endereço</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Mostrar endereço selecionado ou formulário */}
            {showAddressForm || savedAddresses.length === 0 ? (
              savedAddresses.length > 0 ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      {editingAddress ? "Editar Endereço" : "Adicionar Novo Endereço"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log("Cancelar clicado - voltando para seleção");
                        setShowAddressForm(false);
                        setEditingAddress(null);
                        if (savedAddresses.length > 0) {
                          const defaultAddress = savedAddresses.find(addr => addr.is_default) || savedAddresses[0];
                          if (defaultAddress) {
                            setSelectedAddressId(defaultAddress.id);
                            fillAddressData(defaultAddress);
                          }
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                  <AddressForm
                    address={editingAddress}
                    onSubmit={handleNewAddressSubmit}
                    onCancel={() => {
                      console.log("AddressForm onCancel - voltando para seleção");
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      if (savedAddresses.length > 0) {
                        const defaultAddress = savedAddresses.find(addr => addr.is_default) || savedAddresses[0];
                        if (defaultAddress) {
                          setSelectedAddressId(defaultAddress.id);
                          fillAddressData(defaultAddress);
                        }
                      }
                    }}
                    loading={processingCheckout}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4 border rounded-lg bg-gray-50">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-3">Nenhum endereço salvo</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewAddressDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Endereço
                    </Button>
                  </div>
                  
                  {/* Campos de endereço manual */}
                  <div>
                    <Label htmlFor="shipping_address">Endereço de Entrega *</Label>
                    <Input
                      id="shipping_address"
                      value={checkoutData.shipping_address}
                      onChange={(e) => {
                        setCheckoutData({ ...checkoutData, shipping_address: e.target.value });
                        if (validationErrors.shipping_address) {
                          setValidationErrors({ ...validationErrors, shipping_address: null });
                        }
                      }}
                      placeholder="Rua, número, complemento"
                      className={validationErrors.shipping_address ? "border-red-500" : ""}
                    />
                    {validationErrors.shipping_address && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.shipping_address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipping_city">Cidade *</Label>
                      <Select
                        value={checkoutData.shipping_city || ""}
                        onValueChange={(value) => {
                          const selectedCity = cities.find(c => c.id === value);
                          setCheckoutData({ 
                            ...checkoutData, 
                            shipping_city: value,
                            shipping_state: selectedCity?.state || checkoutData.shipping_state
                          });
                          if (validationErrors.shipping_city) {
                            setValidationErrors({ ...validationErrors, shipping_city: null });
                          }
                        }}
                        disabled={loadingCities || !checkoutData.shipping_state}
                      >
                        <SelectTrigger className={validationErrors.shipping_city ? "border-red-500" : ""}>
                          <SelectValue placeholder={
                            loadingCities 
                              ? "Carregando..." 
                              : !checkoutData.shipping_state 
                                ? "Selecione o estado primeiro" 
                                : "Selecione uma cidade"
                          } />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {loadingCities ? (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              Carregando cidades...
                            </div>
                          ) : !checkoutData.shipping_state ? (
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
                      {validationErrors.shipping_city && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.shipping_city}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="shipping_state">Estado *</Label>
                      <Input
                        id="shipping_state"
                        value={checkoutData.shipping_state}
                        onChange={(e) => {
                          const newState = e.target.value.toUpperCase();
                          setCheckoutData({ 
                            ...checkoutData, 
                            shipping_state: newState,
                            shipping_city: "" // Limpar cidade quando mudar estado
                          });
                          if (validationErrors.shipping_state) {
                            setValidationErrors({ ...validationErrors, shipping_state: null });
                          }
                        }}
                        placeholder="UF"
                        maxLength={2}
                        className={validationErrors.shipping_state ? "border-red-500" : ""}
                      />
                      {validationErrors.shipping_state && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.shipping_state}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipping_zip">CEP *</Label>
                      <Input
                        id="shipping_zip"
                        value={checkoutData.shipping_zip}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 8) {
                            // Formatar CEP: 00000-000
                            if (value.length > 5) {
                              value = value.slice(0, 5) + '-' + value.slice(5);
                            }
                            setCheckoutData({ ...checkoutData, shipping_zip: value });
                            if (validationErrors.shipping_zip) {
                              setValidationErrors({ ...validationErrors, shipping_zip: null });
                            }
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        className={validationErrors.shipping_zip ? "border-red-500" : ""}
                      />
                      {validationErrors.shipping_zip && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.shipping_zip}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="shipping_phone">Telefone *</Label>
                      <Input
                        id="shipping_phone"
                        value={checkoutData.shipping_phone}
                        onChange={(e) => {
                          setCheckoutData({ ...checkoutData, shipping_phone: e.target.value });
                          if (validationErrors.shipping_phone) {
                            setValidationErrors({ ...validationErrors, shipping_phone: null });
                          }
                        }}
                        placeholder="(00) 00000-0000"
                        className={validationErrors.shipping_phone ? "border-red-500" : ""}
                      />
                      {validationErrors.shipping_phone && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.shipping_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Mostrar endereço selecionado */
              selectedAddressId && !showAddressForm && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      {(() => {
                        const address = savedAddresses.find(addr => addr.id === selectedAddressId);
                        return address ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{address.recipient_name}</p>
                              {address.label && (
                                <Badge variant="outline" className="text-xs">{address.label}</Badge>
                              )}
                              {address.is_default && (
                                <Badge className="text-xs">Padrão</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {address.street}, {address.number}
                              {address.complement && ` - ${address.complement}`}
                            </p>
                            <p className="text-sm text-gray-700">
                              {address.neighborhood} - {address.city}/{address.state}
                            </p>
                            <p className="text-sm text-gray-700">CEP: {address.zip_code}</p>
                            {address.phone && (
                              <p className="text-sm text-gray-700">Tel: {address.phone}</p>
                            )}
                          </>
                        ) : null;
                      })()}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log("Alterar clicado - abrindo formulário de edição");
                        const address = savedAddresses.find(addr => addr.id === selectedAddressId);
                        if (address) {
                          setEditingAddress(address);
                          setShowAddressForm(true);
                        }
                      }}
                    >
                      Alterar
                    </Button>
                  </div>
                </div>
              )
            )}

            {selectedStore?.store_checkout_enabled && (
              <div>
                <Label htmlFor="payment_method">Método de Pagamento</Label>
                {loadingPaymentMethods ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando métodos de pagamento...
                  </div>
                ) : (
                  <>
                    <Select
                      value={checkoutData.payment_method}
                      onValueChange={(value) => setCheckoutData({ ...checkoutData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePaymentMethods.includes('whatsapp') && (
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        )}
                        {availablePaymentMethods.includes('mercadopago') && (
                          <SelectItem value="mercadopago">Mercado Pago (PIX, Cartão, Boleto)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {checkoutData.payment_method === 'whatsapp' && 'Você será redirecionado para o WhatsApp da loja'}
                      {checkoutData.payment_method === 'mercadopago' && 'Você será redirecionado para a página de pagamento do Mercado Pago'}
                    </p>
                  </>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={checkoutData.notes}
                onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                placeholder="Alguma observação sobre o pedido?"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCheckoutDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCheckoutSubmit}
                disabled={processingCheckout}
                className="flex-1"
              >
                {processingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalizar Pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar novo endereço (quando não tem nenhum) */}
      <Dialog open={newAddressDialogOpen} onOpenChange={setNewAddressDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Endereço</DialogTitle>
            <DialogDescription>
              Adicione um endereço para facilitar suas compras futuras
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            onSubmit={handleNewAddressSubmit}
            onCancel={() => setNewAddressDialogOpen(false)}
            loading={processingCheckout}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Pagamento */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) {
          setCheckingPaymentStatus(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagamento do Pedido #{createdOrder?.id?.slice(0, 8).toUpperCase()}</DialogTitle>
            <DialogDescription>
              Siga as instruções abaixo para finalizar o pagamento
            </DialogDescription>
          </DialogHeader>

          {createdOrder && (
            <div className="space-y-6 mt-4">
              {/* Resumo do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(createdOrder.subtotal || createdOrder.total_amount)}</span>
                  </div>
                  {createdOrder.shipping_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span>{formatCurrency(createdOrder.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(createdOrder.total || createdOrder.total_amount)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code PIX */}
              {createdOrder.payment_info?.pix_key && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                      <QrCode className="w-5 h-5" />
                      Pagamento via PIX
                      {checkingPaymentStatus && (
                        <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                          Verificando pagamento...
                        </Badge>
                      )}
                      {createdOrder.payment_status === 'paid' && (
                        <Badge className="ml-2 bg-green-50 text-green-700 border-green-200">
                          ✅ Pago
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Valor a pagar - destaque */}
                    <div className={`border-2 rounded-lg p-4 text-center ${
                      createdOrder.payment_info?.mercadopago_payment_id 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <p className="text-sm text-green-700 font-medium mb-1">Valor a pagar:</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(createdOrder.total || createdOrder.total_amount)}
                      </p>
                      {createdOrder.payment_info?.mercadopago_payment_id ? (
                        <p className="text-xs text-green-600 mt-2">
                          ✅ Valor já incluído no QR Code - apenas escaneie e confirme!
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 mt-2">
                          ⚠️ Você precisará digitar este valor no app do banco
                        </p>
                      )}
                    </div>

                    {createdOrder.payment_info.pix_qr_code ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                          <img 
                            src={createdOrder.payment_info.pix_qr_code} 
                            alt="QR Code PIX" 
                            className="w-64 h-64 max-w-full object-contain"
                            style={{ imageRendering: 'crisp-edges' }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                          {createdOrder.payment_info?.mercadopago_payment_id 
                            ? "✅ Escaneie o QR Code com o app do seu banco - o valor de " + formatCurrency(createdOrder.total || createdOrder.total_amount) + " já está incluído!" 
                            : "Escaneie o QR Code com o app do seu banco e digite o valor acima"}
                        </p>
                        {createdOrder.payment_info?.mercadopago_payment_id && (
                          <div className="space-y-2">
                            <p className="text-xs text-orange-600 text-center">
                              💡 Se não conseguir escanear, copie o código PIX abaixo e cole no app do banco
                            </p>
                            {createdOrder.payment_info?.pix_qr_code_text?.includes('TEST') && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                <p className="text-xs text-yellow-800 text-center">
                                  ⚠️ <strong>Modo Teste:</strong> Este QR Code não pode ser escaneado. Use o código PIX copia e cola abaixo para testar.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                          <QRCodeSVG 
                            value={createdOrder.payment_info.pix_key} 
                            size={256}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                          Escaneie o QR Code com o app do seu banco e digite o valor acima
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>
                        {createdOrder.payment_info?.pix_qr_code_text 
                          ? "Código PIX (copie e cole no app do banco):" 
                          : "Ou copie e cole a chave PIX:"}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={createdOrder.payment_info?.pix_qr_code_text || createdOrder.payment_info?.pix_key || ''}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            const textToCopy = createdOrder.payment_info?.pix_qr_code_text || createdOrder.payment_info?.pix_key;
                            if (textToCopy) {
                              navigator.clipboard.writeText(textToCopy);
                              toast({
                                title: "Copiado!",
                                description: "Código PIX copiado para a área de transferência",
                              });
                            }
                          }}
                          className="shrink-0"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </div>

                    {createdOrder.payment_info.payment_instructions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 whitespace-pre-line">
                          {createdOrder.payment_info.payment_instructions}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Link de Pagamento */}
              {createdOrder.payment_info?.payment_link && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Pagamento Online
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Clique no botão abaixo para ser redirecionado para a página de pagamento
                    </p>
                    <Button
                      onClick={() => window.open(createdOrder.payment_info.payment_link, '_blank')}
                      className="w-full"
                      size="lg"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Pagar Agora
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Instruções Gerais */}
              {createdOrder.payment_info?.payment_instructions && !createdOrder.payment_info?.pix_key && !createdOrder.payment_info?.payment_link && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instruções de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {createdOrder.payment_info.payment_instructions}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentDialogOpen(false);
                    setCheckingPaymentStatus(false);
                  }}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleGoToOrder}
                  className="flex-1"
                >
                  Ver Detalhes do Pedido
                </Button>
              </div>
              
              {/* Mensagem de verificação automática */}
              {checkingPaymentStatus && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800 text-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Verificando automaticamente o status do pagamento... 
                    Você pode fechar esta tela, o sistema continuará verificando.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

