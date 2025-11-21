import React, { useState, useEffect } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Check, Globe, Key, MailIcon, Save, Settings, Users, Wallet, Wrench, Store } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsAPI } from "@/api/entities-local";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    general: {
      siteName: "Nativo",
      siteDescription: "Marketplace local para conectar lojas e clientes",
      contactEmail: "contato@nativo.com",
      maintenanceMode: false,
      maintenanceMessage: "Estamos realizando manutenção no momento. Por favor, volte em breve.",
      siteActive: true
    },
    users: {
      allowRegistration: true,
      requireEmailVerification: true,
      defaultUserRole: "customer",
      allowSocialLogin: true
    },
    security: {
      sessionTimeout: 60,
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      twoFactorAuth: false
    },
    integrations: {
      googleMapsApiKey: "",
      enableWhatsapp: true,
      enableFacebookLogin: true,
      enableGoogleLogin: true
    },
    billing: {
      currency: "BRL",
      taxRate: 0,
      paymentGateway: "stripe",
      stripePublicKey: "",
      stripePrivateKey: ""
    },
    storeSignup: {
      store_signup_title: "",
      store_signup_subtitle: "",
      store_signup_info: "",
      store_signup_form_title: "",
      store_signup_form_description: ""
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await SettingsAPI.getAll();
      
      // Valores padrão
      const defaults = {
        general: {
          siteName: "Nativo",
          siteDescription: "Marketplace local para conectar lojas e clientes",
          contactEmail: "contato@nativo.com",
          maintenanceMode: false,
          maintenanceMessage: "Estamos realizando manutenção no momento. Por favor, volte em breve.",
          siteActive: true
        },
        users: {
          allowRegistration: true,
          requireEmailVerification: true,
          defaultUserRole: "customer",
          allowSocialLogin: true
        },
        security: {
          sessionTimeout: 60,
          passwordMinLength: 8,
          passwordRequireSpecialChars: true,
          twoFactorAuth: false
        },
        integrations: {
          googleMapsApiKey: "",
          enableWhatsapp: true,
          enableFacebookLogin: true,
          enableGoogleLogin: true
        },
        billing: {
          currency: "BRL",
          taxRate: 0,
          paymentGateway: "stripe",
          stripePublicKey: "",
          stripePrivateKey: ""
        },
        storeSignup: {
          store_signup_title: "",
          store_signup_subtitle: "",
          store_signup_info: "",
          store_signup_form_title: "",
          store_signup_form_description: ""
        }
      };
      
      // Mapear configurações do backend para o formato local
      const mappedSettings = {
        general: {
          siteName: allSettings.site_name?.value || defaults.general.siteName,
          siteDescription: allSettings.site_description?.value || defaults.general.siteDescription,
          contactEmail: allSettings.contact_email?.value || defaults.general.contactEmail,
          maintenanceMode: allSettings.maintenance_mode?.value === 'true' || defaults.general.maintenanceMode,
          maintenanceMessage: allSettings.maintenance_message?.value || defaults.general.maintenanceMessage,
          siteActive: allSettings.site_active?.value !== 'false' || defaults.general.siteActive
        },
        users: {
          allowRegistration: allSettings.allow_registration?.value !== 'false' || defaults.users.allowRegistration,
          requireEmailVerification: allSettings.require_email_verification?.value === 'true' || defaults.users.requireEmailVerification,
          defaultUserRole: allSettings.default_user_role?.value || defaults.users.defaultUserRole,
          allowSocialLogin: allSettings.allow_social_login?.value !== 'false' || defaults.users.allowSocialLogin
        },
        security: {
          sessionTimeout: parseInt(allSettings.session_timeout?.value) || defaults.security.sessionTimeout,
          passwordMinLength: parseInt(allSettings.password_min_length?.value) || defaults.security.passwordMinLength,
          passwordRequireSpecialChars: allSettings.password_require_special_chars?.value === 'true' || defaults.security.passwordRequireSpecialChars,
          twoFactorAuth: allSettings.two_factor_auth?.value === 'true' || defaults.security.twoFactorAuth
        },
        integrations: {
          googleMapsApiKey: allSettings.google_maps_api_key?.value || defaults.integrations.googleMapsApiKey,
          enableWhatsapp: allSettings.enable_whatsapp?.value !== 'false' || defaults.integrations.enableWhatsapp,
          enableFacebookLogin: allSettings.enable_facebook_login?.value !== 'false' || defaults.integrations.enableFacebookLogin,
          enableGoogleLogin: allSettings.enable_google_login?.value !== 'false' || defaults.integrations.enableGoogleLogin
        },
        billing: {
          currency: allSettings.currency?.value || defaults.billing.currency,
          taxRate: parseFloat(allSettings.tax_rate?.value) || defaults.billing.taxRate,
          paymentGateway: allSettings.payment_gateway?.value || defaults.billing.paymentGateway,
          stripePublicKey: allSettings.stripe_public_key?.value || defaults.billing.stripePublicKey,
          stripePrivateKey: allSettings.stripe_private_key?.value || defaults.billing.stripePrivateKey
        },
        storeSignup: {
          store_signup_title: allSettings.store_signup_title?.value || defaults.storeSignup.store_signup_title,
          store_signup_subtitle: allSettings.store_signup_subtitle?.value || defaults.storeSignup.store_signup_subtitle,
          store_signup_info: allSettings.store_signup_info?.value || defaults.storeSignup.store_signup_info,
          store_signup_form_title: allSettings.store_signup_form_title?.value || defaults.storeSignup.store_signup_form_title,
          store_signup_form_description: allSettings.store_signup_form_description?.value || defaults.storeSignup.store_signup_form_description
        }
      };
      
      setSettings(mappedSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Preparar configurações para salvar no backend
      const settingsToSave = {
        // General
        site_name: { value: settings.general.siteName, category: 'general' },
        site_description: { value: settings.general.siteDescription, category: 'general' },
        contact_email: { value: settings.general.contactEmail, category: 'general' },
        maintenance_mode: { value: settings.general.maintenanceMode.toString(), category: 'general' },
        maintenance_message: { value: settings.general.maintenanceMessage, category: 'general' },
        site_active: { value: settings.general.siteActive.toString(), category: 'general' },
        
        // Users
        allow_registration: { value: settings.users.allowRegistration.toString(), category: 'users' },
        require_email_verification: { value: settings.users.requireEmailVerification.toString(), category: 'users' },
        default_user_role: { value: settings.users.defaultUserRole, category: 'users' },
        allow_social_login: { value: settings.users.allowSocialLogin.toString(), category: 'users' },
        
        // Security
        session_timeout: { value: settings.security.sessionTimeout.toString(), category: 'security' },
        password_min_length: { value: settings.security.passwordMinLength.toString(), category: 'security' },
        password_require_special_chars: { value: settings.security.passwordRequireSpecialChars.toString(), category: 'security' },
        two_factor_auth: { value: settings.security.twoFactorAuth.toString(), category: 'security' },
        
        // Integrations
        google_maps_api_key: { value: settings.integrations.googleMapsApiKey, category: 'integrations' },
        enable_whatsapp: { value: settings.integrations.enableWhatsapp.toString(), category: 'integrations' },
        enable_facebook_login: { value: settings.integrations.enableFacebookLogin.toString(), category: 'integrations' },
        enable_google_login: { value: settings.integrations.enableGoogleLogin.toString(), category: 'integrations' },
        
        // Billing
        currency: { value: settings.billing.currency, category: 'billing' },
        tax_rate: { value: settings.billing.taxRate.toString(), category: 'billing' },
        payment_gateway: { value: settings.billing.paymentGateway, category: 'billing' },
        stripe_public_key: { value: settings.billing.stripePublicKey, category: 'billing' },
        stripe_private_key: { value: settings.billing.stripePrivateKey, category: 'billing' },
        
        // Store Signup
        store_signup_title: { value: settings.storeSignup.store_signup_title, category: 'store_signup' },
        store_signup_subtitle: { value: settings.storeSignup.store_signup_subtitle, category: 'store_signup' },
        store_signup_info: { value: settings.storeSignup.store_signup_info, category: 'store_signup' },
        store_signup_form_title: { value: settings.storeSignup.store_signup_form_title, category: 'store_signup' },
        store_signup_form_description: { value: settings.storeSignup.store_signup_form_description, category: 'store_signup' }
      };

      await SettingsAPI.updateBulk(settingsToSave);
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-600 to-green-500"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        {saveSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Configurações salvas com sucesso.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b mb-6 bg-transparent pb-0">
            <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none">
              <Globe className="w-4 h-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none">
              <Key className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none">
              <Settings className="w-4 h-4 mr-2" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none">
              <Wallet className="w-4 h-4 mr-2" />
              Faturamento
            </TabsTrigger>
            <TabsTrigger value="storeSignup" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none">
              <Store className="w-4 h-4 mr-2" />
              Cadastro de Loja
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações básicas da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Nome do Site</Label>
                    <Input
                      id="site-name"
                      value={settings.general.siteName}
                      onChange={(e) => handleChange("general", "siteName", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="site-description">Descrição do Site</Label>
                    <Textarea
                      id="site-description"
                      value={settings.general.siteDescription}
                      onChange={(e) => handleChange("general", "siteDescription", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email de Contato</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(e) => handleChange("general", "contactEmail", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Site</CardTitle>
                <CardDescription>
                  Controle o status de ativação do site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status do Site</Label>
                    <p className="text-sm text-gray-500">
                      Desative para suspender temporariamente o serviço
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.siteActive}
                    onCheckedChange={(checked) => handleChange("general", "siteActive", checked)}
                  />
                </div>
                
                {!settings.general.siteActive && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      Quando desativado, os usuários verão uma mensagem informando que o serviço está suspenso.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Manutenção</CardTitle>
                <CardDescription>
                  Controle o modo de manutenção do site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-gray-500">
                      Ative para exibir uma página de manutenção para todos os usuários
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => handleChange("general", "maintenanceMode", checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maintenance-message">Mensagem de Manutenção</Label>
                  <Textarea
                    id="maintenance-message"
                    value={settings.general.maintenanceMessage}
                    onChange={(e) => handleChange("general", "maintenanceMessage", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Usuários</CardTitle>
                <CardDescription>
                  Gerenciar como os usuários se registram e acessam a plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Novos Registros</Label>
                    <p className="text-sm text-gray-500">
                      Usuários podem se registrar no site
                    </p>
                  </div>
                  <Switch
                    checked={settings.users.allowRegistration}
                    onCheckedChange={(checked) => handleChange("users", "allowRegistration", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verificação de Email</Label>
                    <p className="text-sm text-gray-500">
                      Exigir que os usuários verifiquem seus emails antes de usar o site
                    </p>
                  </div>
                  <Switch
                    checked={settings.users.requireEmailVerification}
                    onCheckedChange={(checked) => handleChange("users", "requireEmailVerification", checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-role">Papel Padrão para Novos Usuários</Label>
                  <Select
                    value={settings.users.defaultUserRole}
                    onValueChange={(value) => handleChange("users", "defaultUserRole", value)}
                  >
                    <SelectTrigger id="default-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="store">Lojista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login com Redes Sociais</Label>
                    <p className="text-sm text-gray-500">
                      Permitir login via Google, Facebook, etc.
                    </p>
                  </div>
                  <Switch
                    checked={settings.users.allowSocialLogin}
                    onCheckedChange={(checked) => handleChange("users", "allowSocialLogin", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Ajuste as configurações de segurança da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Tempo de Sessão (minutos)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="10"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleChange("security", "sessionTimeout", parseInt(e.target.value) || 60)}
                  />
                  <p className="text-sm text-gray-500">
                    Tempo até que a sessão do usuário expire por inatividade
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Tamanho Mínimo da Senha</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    min="6"
                    max="20"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleChange("security", "passwordMinLength", parseInt(e.target.value) || 8)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exigir Caracteres Especiais</Label>
                    <p className="text-sm text-gray-500">
                      As senhas devem conter caracteres especiais
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.passwordRequireSpecialChars}
                    onCheckedChange={(checked) => handleChange("security", "passwordRequireSpecialChars", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-gray-500">
                      Habilitar 2FA para contas de administrador
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => handleChange("security", "twoFactorAuth", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  Configure integrações com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="google-maps-api">Google Maps API Key</Label>
                  <Input
                    id="google-maps-api"
                    type="password"
                    value={settings.integrations.googleMapsApiKey}
                    onChange={(e) => handleChange("integrations", "googleMapsApiKey", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Necessária para funcionalidades de localização e mapas
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Integração com WhatsApp</Label>
                    <p className="text-sm text-gray-500">
                      Permitir comunicação via WhatsApp entre lojistas e clientes
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.enableWhatsapp}
                    onCheckedChange={(checked) => handleChange("integrations", "enableWhatsapp", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login com Facebook</Label>
                    <p className="text-sm text-gray-500">
                      Permitir login usando conta do Facebook
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.enableFacebookLogin}
                    onCheckedChange={(checked) => handleChange("integrations", "enableFacebookLogin", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login com Google</Label>
                    <p className="text-sm text-gray-500">
                      Permitir login usando conta do Google
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.enableGoogleLogin}
                    onCheckedChange={(checked) => handleChange("integrations", "enableGoogleLogin", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Faturamento</CardTitle>
                <CardDescription>
                  Configure opções de pagamento e faturamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={settings.billing.currency}
                    onValueChange={(value) => handleChange("billing", "currency", value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Taxa de Imposto (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.billing.taxRate}
                    onChange={(e) => handleChange("billing", "taxRate", parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-gateway">Gateway de Pagamento Principal</Label>
                  <Select
                    value={settings.billing.paymentGateway}
                    onValueChange={(value) => handleChange("billing", "paymentGateway", value)}
                  >
                    <SelectTrigger id="payment-gateway">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                      <SelectItem value="pagseguro">PagSeguro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe-public-key">Stripe Public Key</Label>
                  <Input
                    id="stripe-public-key"
                    value={settings.billing.stripePublicKey}
                    onChange={(e) => handleChange("billing", "stripePublicKey", e.target.value)}
                    placeholder="pk_test_..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe-private-key">Stripe Private Key</Label>
                  <Input
                    id="stripe-private-key"
                    type="password"
                    value={settings.billing.stripePrivateKey}
                    onChange={(e) => handleChange("billing", "stripePrivateKey", e.target.value)}
                    placeholder="sk_test_..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storeSignup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Cadastro de Loja</CardTitle>
                <CardDescription>
                  Personalize as informações exibidas na tela de cadastro de lojistas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="store-signup-title">Título da Página</Label>
                  <Input
                    id="store-signup-title"
                    value={settings.storeSignup.store_signup_title}
                    onChange={(e) => handleChange("storeSignup", "store_signup_title", e.target.value)}
                    placeholder="Ex: Comece a vender online"
                  />
                  <p className="text-sm text-gray-500">
                    Título principal exibido no topo da página de cadastro
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-signup-subtitle">Subtítulo</Label>
                  <Input
                    id="store-signup-subtitle"
                    value={settings.storeSignup.store_signup_subtitle}
                    onChange={(e) => handleChange("storeSignup", "store_signup_subtitle", e.target.value)}
                    placeholder="Ex: Escolha o melhor plano para o seu negócio"
                  />
                  <p className="text-sm text-gray-500">
                    Subtítulo exibido abaixo do título principal
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-signup-info">Informação Importante</Label>
                  <Textarea
                    id="store-signup-info"
                    value={settings.storeSignup.store_signup_info}
                    onChange={(e) => handleChange("storeSignup", "store_signup_info", e.target.value)}
                    rows={3}
                    placeholder="Ex: Após o cadastro, sua loja precisará ser aprovada por um administrador antes de ficar visível para os clientes."
                  />
                  <p className="text-sm text-gray-500">
                    Mensagem informativa exibida em destaque na página (opcional)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-signup-form-title">Título do Formulário</Label>
                  <Input
                    id="store-signup-form-title"
                    value={settings.storeSignup.store_signup_form_title}
                    onChange={(e) => handleChange("storeSignup", "store_signup_form_title", e.target.value)}
                    placeholder="Ex: Dados da Loja"
                  />
                  <p className="text-sm text-gray-500">
                    Título do formulário de cadastro
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-signup-form-description">Descrição do Formulário</Label>
                  <Textarea
                    id="store-signup-form-description"
                    value={settings.storeSignup.store_signup_form_description}
                    onChange={(e) => handleChange("storeSignup", "store_signup_form_description", e.target.value)}
                    rows={2}
                    placeholder="Ex: Preencha as informações básicas da sua loja"
                  />
                  <p className="text-sm text-gray-500">
                    Descrição exibida abaixo do título do formulário
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}