import React, { useState, useEffect } from 'react';
import { StoreCustomizations } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Palette, Image, Eye, Save, AlertCircle, CheckCircle, Plus, Trash2, GripVertical } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "@/components/ui/use-toast";

export default function StoreOnlineEditor({ store, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadingBanners, setUploadingBanners] = useState({}); // { index: true/false }
  const [customizations, setCustomizations] = useState({
    primary_color: '#2563eb',
    secondary_color: '#06b6d4',
    background_color: '#ffffff',
    text_color: '#1f2937',
    header_color: '#1e3a8a', // Cor do header (dark blue por padrão)
    categories_bar_color: '#f97316', // Cor da barra de categorias (orange por padrão)
    footer_color: '#f9fafb',
    banner_image: null,
    banner_text: '',
    banners: [], // Array de banners [{ image, text, order }]
    banner_enabled: true,
    about_section_enabled: true,
    about_text: '',
    featured_section_enabled: true,
    categories_section_enabled: true,
    contact_section_enabled: true,
    instagram_url: null,
    facebook_url: null,
    whatsapp_number: null,
    layout_style: 'modern',
    show_search: true,
    show_categories: true
  });

  useEffect(() => {
    const initialize = async () => {
      console.log('🔄 Inicializando StoreOnlineEditor...', { 
        storeId: store?.id,
        hasStore: !!store,
        token: localStorage.getItem('auth_token') ? 'Presente' : 'Ausente'
      });
      
      if (!store) {
        console.warn('⚠️ Store não disponível, aguardando...');
        setLoading(false);
        return;
      }
      
      try {
        const userData = await checkUser();
        console.log('👤 Usuário verificado:', userData ? { 
          id: userData.id, 
          role: userData.role,
          email: userData.email 
        } : 'Não autenticado');
        await loadCustomizations();
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setError('Erro ao carregar customizações. Tente recarregar a página.');
        setLoading(false);
      }
    };
    
    // Timeout de segurança: se loading ficar true por mais de 30 segundos, resetar
    const loadingTimeout = setTimeout(() => {
      setLoading(prevLoading => {
        if (prevLoading) {
          console.warn('⚠️ Timeout: loading ficou true por muito tempo, resetando...');
          setError('Tempo de carregamento excedido. Tente recarregar a página.');
          return false;
        }
        return prevLoading;
      });
    }, 30000);
    
    initialize();
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [store]);

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      return userData;
    } catch (error) {
      setUser(null);
      return null;
    }
  };

  const loadCustomizations = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Verificar usuário antes de carregar
      const currentUser = user || await checkUser();
      
      let data;
      
      // Tentar carregar via rota autenticada se o usuário estiver logado e tiver role 'store' ou 'admin'
      if (currentUser && (currentUser.role === 'store' || currentUser.role === 'admin')) {
        try {
          data = await StoreCustomizations.getMyStore();
        } catch (authError) {
          // Se der erro de autenticação (401/403), tentar via rota pública se tiver store.id
          if ((authError.status === 401 || authError.status === 403) && store?.id) {
            console.log('Tentando carregar via rota pública...');
            data = await StoreCustomizations.getByStore(store.id);
          } else {
            throw authError;
          }
        }
      } else if (store?.id) {
        // Se não estiver autenticado ou não tiver role correta, usar rota pública
        console.log('Usando rota pública para carregar customizações...');
        data = await StoreCustomizations.getByStore(store.id);
      } else {
        throw new Error('Loja não encontrada');
      }
      
      // Garantir que banners seja um array
      if (!data.banners || !Array.isArray(data.banners)) {
        // Compatibilidade: se tiver banner_image antigo, converter para array
        if (data.banner_image) {
          data.banners = [{
            image: data.banner_image,
            text: data.banner_text || '',
            order: 0
          }];
        } else {
          data.banners = [];
        }
      }
      
      // Garantir que todas as cores tenham valores válidos (nunca vazios)
      const defaultColors = {
        primary_color: '#2563eb',
        secondary_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#1f2937',
        header_color: '#1e3a8a',
        categories_bar_color: '#f97316',
        footer_color: '#f9fafb'
      };
      
      // Normalizar cores: se vazias ou inválidas, usar padrão
      Object.keys(defaultColors).forEach(key => {
        if (!data[key] || data[key].trim() === '' || !data[key].match(/^#[0-9A-Fa-f]{6}$/)) {
          data[key] = defaultColors[key];
        }
      });
      
      console.log('✅ Customizações carregadas com sucesso:', data);
      setCustomizations(data);
      setError(''); // Limpar erros anteriores
    } catch (error) {
      console.error('❌ Erro ao carregar customizações:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      
      if (error.status === 403) {
        setError('Você não tem permissão para acessar as customizações. Verifique se você está logado como lojista.');
      } else if (error.status === 401) {
        setError('Você precisa estar logado para acessar as customizações.');
      } else {
        setError('Erro ao carregar customizações. Tente novamente.');
      }
      
      // Mesmo com erro, permitir edição com valores padrão
      console.log('⚠️ Continuando com valores padrão devido ao erro');
    } finally {
      setLoading(false);
      console.log('🏁 Carregamento finalizado, loading = false');
    }
  };

  const handleColorChange = (field, value) => {
    // Normalizar valor: se vazio ou inválido, usar padrão baseado no campo
    const defaultColors = {
      primary_color: '#2563eb',
      secondary_color: '#06b6d4',
      background_color: '#ffffff',
      text_color: '#1f2937',
      header_color: '#1e3a8a',
      categories_bar_color: '#f97316',
      footer_color: '#f9fafb'
    };
    
    // Se o valor for vazio ou não for um hex válido, usar padrão
    let normalizedValue = value;
    if (!value || value.trim() === '') {
      normalizedValue = defaultColors[field] || '#000000';
    } else if (!value.match(/^#[0-9A-Fa-f]{6}$/)) {
      // Se não for um hex válido, tentar corrigir ou usar padrão
      if (value.startsWith('#')) {
        // Se já começa com #, manter mas garantir formato
        normalizedValue = value.length === 7 ? value : defaultColors[field] || '#000000';
      } else {
        // Se não começa com #, adicionar
        normalizedValue = value.length === 6 ? `#${value}` : defaultColors[field] || '#000000';
      }
    }
    
    setCustomizations(prev => ({ ...prev, [field]: normalizedValue }));
  };

  const handleBannerUpload = async (file, index = null) => {
    if (!file) {
      console.warn('⚠️ Nenhum arquivo fornecido para upload');
      return;
    }

    console.log('📤 Iniciando upload de banner...', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      index 
    });

    // Validar tamanho do arquivo
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive"
      });
      return;
    }

    // Marcar como fazendo upload
    setUploadingBanners(prev => ({ ...prev, [index ?? 'new']: true }));

    try {
      console.log('📤 Enviando arquivo para o servidor...');
      const result = await UploadFile({ file });
      console.log('✅ Upload concluído:', result);
      
      const { file_url } = result;
      
      if (!file_url) {
        throw new Error('URL do arquivo não retornada pelo servidor');
      }
      
      setCustomizations(prev => {
        const banners = [...(prev.banners || [])];
        
        if (index !== null && index >= 0 && index < banners.length) {
          // Atualizar banner existente
          banners[index] = {
            ...banners[index],
            image: file_url
          };
          console.log(`✅ Banner ${index} atualizado com sucesso`);
        } else {
          // Adicionar novo banner
          banners.push({
            image: file_url,
            text: '',
            order: banners.length
          });
          console.log(`✅ Novo banner adicionado (total: ${banners.length})`);
        }
        
        return { ...prev, banners };
      });
      
      toast({
        title: "Sucesso",
        description: "Banner enviado com sucesso!"
      });
    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        originalError: error.originalError
      });
      
      let errorMessage = "Erro ao fazer upload da imagem";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.originalError) {
        errorMessage = error.originalError.message || errorMessage;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      // Remover estado de upload
      setUploadingBanners(prev => {
        const newState = { ...prev };
        delete newState[index ?? 'new'];
        return newState;
      });
      
      // Resetar o input file para permitir fazer upload do mesmo arquivo novamente
      const fileInput = document.querySelector(`input[type="file"][data-banner-index="${index ?? 'new'}"]`);
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleAddBanner = () => {
    setCustomizations(prev => {
      const banners = [...(prev.banners || [])];
      banners.push({
        image: null,
        text: '',
        order: banners.length
      });
      return { ...prev, banners };
    });
  };

  const handleRemoveBanner = (index) => {
    setCustomizations(prev => {
      const banners = [...(prev.banners || [])];
      banners.splice(index, 1);
      // Reordenar
      banners.forEach((banner, i) => {
        banner.order = i;
      });
      return { ...prev, banners };
    });
  };

  const handleBannerTextChange = (index, text) => {
    setCustomizations(prev => {
      const banners = [...(prev.banners || [])];
      if (banners[index]) {
        banners[index] = { ...banners[index], text };
      }
      return { ...prev, banners };
    });
  };

  const handleSave = async () => {
    try {
      console.log('💾 Iniciando salvamento de customizações...');
      setSaving(true);
      setError("");
      setSuccess(false);

      // Preparar dados para salvar (incluindo banners)
      // Garantir que todas as cores tenham valores válidos antes de salvar
      const defaultColors = {
        primary_color: '#2563eb',
        secondary_color: '#06b6d4',
        background_color: '#ffffff',
        text_color: '#1f2937',
        header_color: '#ffffff',
        categories_bar_color: '#f97316',
        footer_color: '#f9fafb',
        product_price_color: '#f97316',
        product_button_color: '#f97316',
        categories_card_bg_color: '#ffffff'
      };
      
      const dataToSave = {
        ...customizations,
        banners: customizations.banners || [],
        // Garantir que cores nunca sejam vazias
        primary_color: customizations.primary_color && customizations.primary_color.trim() !== '' 
          ? customizations.primary_color 
          : defaultColors.primary_color,
        secondary_color: customizations.secondary_color && customizations.secondary_color.trim() !== '' 
          ? customizations.secondary_color 
          : defaultColors.secondary_color,
        background_color: customizations.background_color && customizations.background_color.trim() !== '' 
          ? customizations.background_color 
          : defaultColors.background_color,
        text_color: customizations.text_color && customizations.text_color.trim() !== '' 
          ? customizations.text_color 
          : defaultColors.text_color,
        header_color: customizations.header_color && customizations.header_color.trim() !== '' 
          ? customizations.header_color 
          : defaultColors.header_color,
        categories_bar_color: customizations.categories_bar_color && customizations.categories_bar_color.trim() !== '' 
          ? customizations.categories_bar_color 
          : defaultColors.categories_bar_color,
        footer_color: customizations.footer_color && customizations.footer_color.trim() !== '' 
          ? customizations.footer_color 
          : defaultColors.footer_color,
        product_price_color: customizations.product_price_color && customizations.product_price_color.trim() !== ''
          ? customizations.product_price_color
          : defaultColors.product_price_color,
        product_button_color: customizations.product_button_color && customizations.product_button_color.trim() !== ''
          ? customizations.product_button_color
          : defaultColors.product_button_color,
        categories_card_bg_color: customizations.categories_card_bg_color && customizations.categories_card_bg_color.trim() !== ''
          ? customizations.categories_card_bg_color
          : defaultColors.categories_card_bg_color
      };
      
      console.log('📤 Dados preparados para salvar:', JSON.stringify(dataToSave, null, 2));
      console.log('📤 Enviando requisição para /store-customizations...');
      console.log('📤 Token de autenticação:', localStorage.getItem('auth_token') ? 'Presente' : 'Ausente');
      console.log('📤 Usuário atual:', user);
      console.log('📤 Loja:', store);
      
      const result = await StoreCustomizations.save(dataToSave);
      
      console.log('✅ Resposta do servidor:', result);
      
      setSuccess(true);
      toast({
        title: "Sucesso",
        description: "Customizações salvas com sucesso!",
      });
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('❌ Erro ao salvar customizações:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.status,
        stack: error.stack,
        originalError: error.originalError
      });
      
      let errorMessage = error.message || 'Erro ao salvar customizações';
      
      // Mensagens mais amigáveis para erros específicos
      if (error.status === 403) {
        if (errorMessage.includes('Enterprise')) {
          errorMessage = 'Você precisa ter o plano Enterprise para personalizar sua loja online. Entre em contato com o suporte para fazer upgrade.';
        } else {
          errorMessage = 'Você não tem permissão para realizar esta ação.';
        }
      } else if (error.status === 401) {
        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
      } else if (error.status === 404) {
        errorMessage = 'Loja não encontrada. Verifique se você está logado como lojista.';
      } else if (error.status === 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes ou entre em contato com o suporte.';
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
        duration: 5000 // Mostrar por mais tempo para erros importantes
      });
    } finally {
      setSaving(false);
      console.log('🏁 Salvamento finalizado (sucesso ou erro)');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const previewUrl = store ? `${window.location.origin}/loja-online/${store.id}` : '';

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Customizações salvas com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Link */}
      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visualizar Loja Online
            </CardTitle>
            <CardDescription>
              Veja como sua loja online está ficando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input readOnly value={previewUrl} />
              <Button
                variant="outline"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Abrir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Cores
          </CardTitle>
          <CardDescription>
            Personalize as cores da sua loja online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primary_color"
                  type="color"
                  value={customizations.primary_color || '#2563eb'}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="secondary_color"
                  type="color"
                  value={customizations.secondary_color || '#06b6d4'}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  placeholder="#06b6d4"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="background_color">Cor de Fundo</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="background_color"
                  type="color"
                  value={customizations.background_color || '#ffffff'}
                  onChange={(e) => handleColorChange('background_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.background_color}
                  onChange={(e) => handleColorChange('background_color', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="text_color">Cor do Texto</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="text_color"
                  type="color"
                  value={customizations.text_color || '#1f2937'}
                  onChange={(e) => handleColorChange('text_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.text_color}
                  onChange={(e) => handleColorChange('text_color', e.target.value)}
                  placeholder="#1f2937"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categories_bar_color">Cor de Fundo da Barra de Categorias</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="categories_bar_color"
                  type="color"
                  value={customizations.categories_bar_color || '#f97316'}
                  onChange={(e) => handleColorChange('categories_bar_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.categories_bar_color}
                  onChange={(e) => handleColorChange('categories_bar_color', e.target.value)}
                  placeholder="#f97316"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product_price_color">Cor do Preço do Produto</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="product_price_color"
                  type="color"
                  value={customizations.product_price_color || '#f97316'}
                  onChange={(e) => handleColorChange('product_price_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.product_price_color}
                  onChange={(e) => handleColorChange('product_price_color', e.target.value)}
                  placeholder="#f97316"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product_button_color">Cor do Botão \"Ver produto\"</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="product_button_color"
                  type="color"
                  value={customizations.product_button_color || '#f97316'}
                  onChange={(e) => handleColorChange('product_button_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.product_button_color}
                  onChange={(e) => handleColorChange('product_button_color', e.target.value)}
                  placeholder="#f97316"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categories_card_bg_color">Cor de Fundo dos Cards de Categoria</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="categories_card_bg_color"
                  type="color"
                  value={customizations.categories_card_bg_color || '#ffffff'}
                  onChange={(e) => handleColorChange('categories_card_bg_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.categories_card_bg_color}
                  onChange={(e) => handleColorChange('categories_card_bg_color', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="header_color">Cor do Header</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="header_color"
                  type="color"
                  value={customizations.header_color || '#1e3a8a'}
                  onChange={(e) => handleColorChange('header_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.header_color}
                  onChange={(e) => handleColorChange('header_color', e.target.value)}
                  placeholder="#1e3a8a"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categories_bar_color">Cor da Barra de Categorias</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="categories_bar_color"
                  type="color"
                  value={customizations.categories_bar_color || '#f97316'}
                  onChange={(e) => handleColorChange('categories_bar_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.categories_bar_color}
                  onChange={(e) => handleColorChange('categories_bar_color', e.target.value)}
                  placeholder="#f97316"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="footer_color">Cor do Footer</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="footer_color"
                  type="color"
                  value={customizations.footer_color || '#f9fafb'}
                  onChange={(e) => handleColorChange('footer_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customizations.footer_color}
                  onChange={(e) => handleColorChange('footer_color', e.target.value)}
                  placeholder="#f9fafb"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Banner
          </CardTitle>
          <CardDescription>
            Configure o banner da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="banner_enabled">Exibir Banner</Label>
            <Switch
              id="banner_enabled"
              checked={customizations.banner_enabled}
              onCheckedChange={(checked) => 
                setCustomizations(prev => ({ ...prev, banner_enabled: checked }))
              }
            />
          </div>

          {customizations.banner_enabled && (
            <>
              <div className="space-y-4">
                {(customizations.banners || []).map((banner, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <Label>Banner {index + 1}</Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBanner(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Imagem do Banner</Label>
                        <div className="mt-1">
                          <Input
                            type="file"
                            accept="image/*"
                            data-banner-index={index}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleBannerUpload(file, index);
                              }
                            }}
                            disabled={uploadingBanners[index]}
                            className={uploadingBanners[index] ? "opacity-50 cursor-not-allowed" : ""}
                          />
                          {uploadingBanners[index] && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                              <span>Enviando imagem...</span>
                            </div>
                          )}
                        </div>
                        {banner.image && !uploadingBanners[index] && (
                          <div className="mt-2">
                            <img
                              src={banner.image}
                              alt={`Banner ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Texto do Banner</Label>
                        <Input
                          value={banner.text || ''}
                          onChange={(e) => handleBannerTextChange(index, e.target.value)}
                          placeholder="Bem-vindo à nossa loja!"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddBanner}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Banner
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Seções */}
      <Card>
        <CardHeader>
          <CardTitle>Seções</CardTitle>
          <CardDescription>
            Configure quais seções aparecerão na sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="about_section">Seção "Sobre a Loja"</Label>
            <Switch
              id="about_section"
              checked={customizations.about_section_enabled}
              onCheckedChange={(checked) => 
                setCustomizations(prev => ({ ...prev, about_section_enabled: checked }))
              }
            />
          </div>

          {customizations.about_section_enabled && (
            <div>
              <Label htmlFor="about_text">Texto "Sobre a Loja"</Label>
              <Textarea
                id="about_text"
                value={customizations.about_text}
                onChange={(e) => 
                  setCustomizations(prev => ({ ...prev, about_text: e.target.value }))
                }
                placeholder="Conte um pouco sobre sua loja..."
                className="mt-1"
                rows={4}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="show_search">Mostrar Busca</Label>
            <Switch
              id="show_search"
              checked={customizations.show_search}
              onCheckedChange={(checked) => 
                setCustomizations(prev => ({ ...prev, show_search: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show_categories">Mostrar Categorias</Label>
            <Switch
              id="show_categories"
              checked={customizations.show_categories}
              onCheckedChange={(checked) => 
                setCustomizations(prev => ({ ...prev, show_categories: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais e Contato</CardTitle>
          <CardDescription>
            Adicione links para suas redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp</Label>
            <Input
              id="whatsapp_number"
              value={customizations.whatsapp_number || ''}
              onChange={(e) => 
                setCustomizations(prev => ({ ...prev, whatsapp_number: e.target.value }))
              }
              placeholder="5511999999999"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="instagram_url">Instagram</Label>
            <Input
              id="instagram_url"
              value={customizations.instagram_url || ''}
              onChange={(e) => 
                setCustomizations(prev => ({ ...prev, instagram_url: e.target.value }))
              }
              placeholder="https://instagram.com/sualoja"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="facebook_url">Facebook</Label>
            <Input
              id="facebook_url"
              value={customizations.facebook_url || ''}
              onChange={(e) => 
                setCustomizations(prev => ({ ...prev, facebook_url: e.target.value }))
              }
              placeholder="https://facebook.com/sualoja"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Layout</CardTitle>
          <CardDescription>
            Escolha o estilo de layout da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={customizations.layout_style}
            onValueChange={(value) => 
              setCustomizations(prev => ({ ...prev, layout_style: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Moderno</SelectItem>
              <SelectItem value="classic">Clássico</SelectItem>
              <SelectItem value="minimal">Minimalista</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end items-center gap-4">
        {loading && (
          <div className="text-sm text-gray-500 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500 mr-2"></div>
            Carregando customizações...
          </div>
        )}
        {error && !loading && (
          <div className="text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
        <Button
          onClick={(e) => {
            console.log('🖱️ Botão Salvar clicado!');
            console.log('📊 Estado atual:', { 
              saving, 
              loading, 
              error, 
              success,
              hasUser: !!user,
              hasStore: !!store,
              hasToken: !!localStorage.getItem('auth_token')
            });
            e.preventDefault();
            e.stopPropagation();
            if (!saving && !loading) {
              handleSave();
            } else {
              console.warn('⚠️ Botão desabilitado:', { saving, loading });
              toast({
                title: "Aguarde",
                description: loading ? "Carregando customizações..." : "Salvando...",
                variant: "default"
              });
            }
          }}
          disabled={saving || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
          title={loading ? 'Carregando customizações...' : saving ? 'Salvando...' : 'Salvar customizações'}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Customizações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

