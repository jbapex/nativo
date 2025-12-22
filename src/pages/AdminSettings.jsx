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
import { AlertCircle, Check, Globe, Key, MailIcon, Save, Settings, Users, Wallet, Wrench, Store, Palette, Image, ArrowUpDown, Eye, Plus, Trash2, GripVertical } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Settings as SettingsAPI } from "@/api/entities-local";
import { useVisualEditor } from "@/components/admin/VisualColorEditor";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import AppearanceTemplatesManager from "@/components/admin/AppearanceTemplatesManager";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditorActive, toggleEditor] = useVisualEditor();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingBanners, setUploadingBanners] = useState({}); // { bannerId: true/false }
  const [uploadError, setUploadError] = useState("");
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
      enableGoogleLogin: true,
      facebookPixelId: ""
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
    },
    appearance: {
      logo: "",
      favicon: "",
      banners: [], // Array de banners: [{id, image, title, subtitle, link, order, active}]
      heroTitle: "",
      heroSubtitle: "",
      heroImage: "",
      heroStatsProducts: "",
      heroStatsVendors: "",
      heroStatsClients: "",
      heroCardFree: "",
      heroCardWhatsapp: "",
      heroCardLocal: "",
      primaryColor: "#2563eb",
      secondaryColor: "#06b6d4",
      accentColor: "#10b981",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      headerColor: "#ffffff",
      footerColor: "#f9fafb",
      // Cores adicionais para personalização completa
      buttonPrimaryColor: "#2563eb",
      buttonSecondaryColor: "#06b6d4",
      buttonTextColor: "#ffffff",
      linkColor: "#2563eb",
      linkHoverColor: "#1d4ed8",
      cardBackgroundColor: "#ffffff",
      cardBorderColor: "#e5e7eb",
      cardShadowColor: "rgba(0, 0, 0, 0.1)",
      inputBackgroundColor: "#ffffff",
      inputBorderColor: "#d1d5db",
      inputFocusColor: "#2563eb",
      textSecondaryColor: "#6b7280",
      textMutedColor: "#9ca3af",
      borderColor: "#e5e7eb",
      sectionBackgroundColor: "#f9fafb",
      badgePrimaryColor: "#2563eb",
      badgeSecondaryColor: "#06b6d4",
      badgeSuccessColor: "#10b981",
      badgeErrorColor: "#ef4444",
      badgeWarningColor: "#f59e0b",
      hoverColor: "rgba(37, 99, 235, 0.1)",
      focusRingColor: "#2563eb",
      homeSectionsOrder: ["hero", "categories", "featured_stores", "featured_products", "testimonials", "become_seller"],
      availableSections: [
        { id: "hero", name: "Hero (Banner Principal)", default: true },
        { id: "banners", name: "Banners Promocionais", default: false },
        { id: "categories", name: "Categorias", default: true },
        { id: "featured_stores", name: "Lojas em Destaque", default: true },
        { id: "featured_products", name: "Produtos em Destaque", default: true },
        { id: "testimonials", name: "Depoimentos", default: true },
        { id: "become_seller", name: "Seja um Lojista", default: true },
        { id: "newsletter", name: "Newsletter", default: false },
        { id: "stats", name: "Estatísticas/Números", default: false },
        { id: "partners", name: "Parceiros/Patrocinadores", default: false },
        { id: "video", name: "Vídeo Promocional", default: false },
        { id: "faq", name: "Perguntas Frequentes", default: false }
      ],
      showHero: true,
      showCategories: true,
      showFeaturedStores: true,
      showFeaturedProducts: true,
      showTestimonials: true,
      showBecomeSeller: true,
      showNewsletter: false,
      showStats: false,
      showPartners: false,
      showVideo: false,
      showFaq: false,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: ""
    }
  });

  useEffect(() => {
    loadSettings();
    
    // Escutar mudanças de aparência para recarregar apenas se não estivermos salvando
    const handleAppearanceChange = () => {
      // Não recarregar se acabamos de salvar (para evitar loop)
      if (!isSaving) {
        // Preservar estado do editor visual antes de recarregar
        const editorState = isEditorActive;
        loadSettings().then(() => {
          // Restaurar estado do editor visual após recarregar
          if (editorState && !isEditorActive) {
            setTimeout(() => toggleEditor(true), 100);
          }
        });
      }
    };
    
    window.addEventListener('appearanceChanged', handleAppearanceChange);
    
    return () => {
      window.removeEventListener('appearanceChanged', handleAppearanceChange);
    };
  }, [isSaving]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Preservar estado do editor visual antes de recarregar
      const editorStateBeforeLoad = localStorage.getItem('visualEditorActive') === 'true';
      
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
        },
        appearance: {
          logo: "",
          favicon: "",
          primaryColor: "#2563eb",
          secondaryColor: "#06b6d4",
          accentColor: "#10b981",
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
          headerColor: "#ffffff",
          footerColor: "#f9fafb",
          homeSectionsOrder: ["hero", "categories", "featured_stores", "featured_products", "testimonials", "become_seller"],
          showHero: true,
          showCategories: true,
          showFeaturedStores: true,
          showFeaturedProducts: true,
          showTestimonials: true,
          showBecomeSeller: true,
          metaTitle: "",
          metaDescription: "",
          metaKeywords: ""
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
          enableGoogleLogin: allSettings.enable_google_login?.value !== 'false' || defaults.integrations.enableGoogleLogin,
          facebookPixelId: allSettings.facebook_pixel_id?.value || defaults.integrations.facebookPixelId
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
        },
        appearance: {
          logo: allSettings.logo?.value || defaults.appearance.logo,
          favicon: allSettings.favicon?.value || defaults.appearance.favicon,
          banners: allSettings.banners?.value ? (() => {
            try {
              return JSON.parse(allSettings.banners.value);
            } catch {
              return defaults.appearance.banners || [];
            }
          })() : (defaults.appearance.banners || []),
          // Função helper para garantir que valores de cor sempre sejam válidos
          primaryColor: (() => {
            const value = allSettings.primary_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.primaryColor;
          })(),
          secondaryColor: (() => {
            const value = allSettings.secondary_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.secondaryColor;
          })(),
          accentColor: (() => {
            const value = allSettings.accent_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.accentColor;
          })(),
          backgroundColor: (() => {
            const value = allSettings.background_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.backgroundColor;
          })(),
          textColor: (() => {
            const value = allSettings.text_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.textColor;
          })(),
          headerColor: (() => {
            const value = allSettings.header_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.headerColor;
          })(),
          footerColor: (() => {
            const value = allSettings.footer_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.footerColor;
          })(),
          buttonPrimaryColor: (() => {
            const value = allSettings.button_primary_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.buttonPrimaryColor;
          })(),
          buttonSecondaryColor: (() => {
            const value = allSettings.button_secondary_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.buttonSecondaryColor;
          })(),
          buttonTextColor: (() => {
            const value = allSettings.button_text_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.buttonTextColor;
          })(),
          linkColor: (() => {
            const value = allSettings.link_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.linkColor;
          })(),
          linkHoverColor: (() => {
            const value = allSettings.link_hover_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.linkHoverColor;
          })(),
          cardBackgroundColor: (() => {
            const value = allSettings.card_background_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.cardBackgroundColor;
          })(),
          cardBorderColor: (() => {
            const value = allSettings.card_border_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.cardBorderColor;
          })(),
          cardShadowColor: (() => {
            const value = allSettings.card_shadow_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.cardShadowColor;
          })(),
          inputBackgroundColor: (() => {
            const value = allSettings.input_background_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.inputBackgroundColor;
          })(),
          inputBorderColor: (() => {
            const value = allSettings.input_border_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.inputBorderColor;
          })(),
          inputFocusColor: (() => {
            const value = allSettings.input_focus_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.inputFocusColor;
          })(),
          textSecondaryColor: (() => {
            const value = allSettings.text_secondary_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.textSecondaryColor;
          })(),
          textMutedColor: (() => {
            const value = allSettings.text_muted_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.textMutedColor;
          })(),
          borderColor: (() => {
            const value = allSettings.border_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.borderColor;
          })(),
          sectionBackgroundColor: (() => {
            const value = allSettings.section_background_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.sectionBackgroundColor;
          })(),
          badgePrimaryColor: (() => {
            const value = allSettings.badge_primary_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.badgePrimaryColor;
          })(),
          badgeSecondaryColor: (() => {
            const value = allSettings.badge_secondary_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.badgeSecondaryColor;
          })(),
          badgeSuccessColor: (() => {
            const value = allSettings.badge_success_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.badgeSuccessColor;
          })(),
          badgeErrorColor: (() => {
            const value = allSettings.badge_error_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.badgeErrorColor;
          })(),
          badgeWarningColor: (() => {
            const value = allSettings.badge_warning_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.badgeWarningColor;
          })(),
          hoverColor: (() => {
            const value = allSettings.hover_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.hoverColor;
          })(),
          focusRingColor: (() => {
            const value = allSettings.focus_ring_color?.value;
            return (value && typeof value === 'string' && value.trim() !== '') ? value : defaults.appearance.focusRingColor;
          })(),
          homeSectionsOrder: allSettings.home_sections_order?.value ? JSON.parse(allSettings.home_sections_order.value) : defaults.appearance.homeSectionsOrder,
          availableSections: defaults.appearance.availableSections,
          showHero: allSettings.show_hero?.value !== 'false' || defaults.appearance.showHero,
          showCategories: allSettings.show_categories?.value !== 'false' || defaults.appearance.showCategories,
          showFeaturedStores: allSettings.show_featured_stores?.value !== 'false' || defaults.appearance.showFeaturedStores,
          showFeaturedProducts: allSettings.show_featured_products?.value !== 'false' || defaults.appearance.showFeaturedProducts,
          showTestimonials: allSettings.show_testimonials?.value !== 'false' || defaults.appearance.showTestimonials,
          showBecomeSeller: allSettings.show_become_seller?.value !== 'false' || defaults.appearance.showBecomeSeller,
          showBanners: allSettings.show_banners?.value === 'true' || defaults.appearance.showBanners || false,
          showNewsletter: allSettings.show_newsletter?.value === 'true' || defaults.appearance.showNewsletter || false,
          showStats: allSettings.show_stats?.value === 'true' || defaults.appearance.showStats || false,
          showPartners: allSettings.show_partners?.value === 'true' || defaults.appearance.showPartners || false,
          showVideo: allSettings.show_video?.value === 'true' || defaults.appearance.showVideo || false,
          showFaq: allSettings.show_faq?.value === 'true' || defaults.appearance.showFaq || false,
          metaTitle: allSettings.meta_title?.value || defaults.appearance.metaTitle,
          metaDescription: allSettings.meta_description?.value || defaults.appearance.metaDescription,
          metaKeywords: allSettings.meta_keywords?.value || defaults.appearance.metaKeywords
        }
      };
      
      setSettings(mappedSettings);
      
      // Restaurar estado do editor visual após recarregar (se estava ativo antes)
      // Usar setTimeout para garantir que o estado seja atualizado após o setState
      if (editorStateBeforeLoad) {
        setTimeout(() => {
          const currentState = localStorage.getItem('visualEditorActive') === 'true';
          if (editorStateBeforeLoad && !currentState) {
            toggleEditor(true);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função helper para garantir valores de cor válidos
  const getValidColorValue = (value, defaultValue) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return defaultValue;
    }
    return value;
  };

  const handleChange = (section, field, value) => {
    // Se for um campo de cor e o valor estiver vazio, usar o valor padrão
    const colorFields = [
      'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor',
      'headerColor', 'footerColor', 'buttonPrimaryColor', 'buttonSecondaryColor', 'buttonTextColor',
      'linkColor', 'linkHoverColor', 'cardBackgroundColor', 'cardBorderColor', 'cardShadowColor',
      'inputBackgroundColor', 'inputBorderColor', 'inputFocusColor', 'textSecondaryColor', 'textMutedColor',
      'borderColor', 'sectionBackgroundColor', 'badgePrimaryColor', 'badgeSecondaryColor',
      'badgeSuccessColor', 'badgeErrorColor', 'badgeWarningColor', 'hoverColor', 'focusRingColor'
    ];
    
    let finalValue = value;
    if (section === 'appearance' && colorFields.includes(field)) {
      const defaultValue = settings.appearance[field] || '#2563eb';
      finalValue = getValidColorValue(value, defaultValue);
    }
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: finalValue
      }
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("O arquivo é muito grande. Tamanho máximo: 5MB");
      setTimeout(() => setUploadError(""), 5000);
      e.target.value = '';
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Formato não suportado. Use JPEG, PNG, GIF, WEBP ou SVG.");
      setTimeout(() => setUploadError(""), 5000);
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    setUploadError("");

    try {
      const { file_url } = await UploadFile({ file });
      handleChange("appearance", "logo", file_url);
      setUploadError("");
      e.target.value = '';
    } catch (error) {
      console.error("Erro ao fazer upload do logo:", error);
      const errorMessage = error.message || "Erro ao fazer upload do logo. Tente novamente.";
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(""), 5000);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (1MB para favicon)
    if (file.size > 1 * 1024 * 1024) {
      setUploadError("O arquivo é muito grande. Tamanho máximo: 1MB");
      setTimeout(() => setUploadError(""), 5000);
      e.target.value = '';
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Formato não suportado. Use JPEG, PNG, GIF, WEBP, ICO ou SVG.");
      setTimeout(() => setUploadError(""), 5000);
      e.target.value = '';
      return;
    }

    setUploadingFavicon(true);
    setUploadError("");

    try {
      const { file_url } = await UploadFile({ file });
      handleChange("appearance", "favicon", file_url);
      setUploadError("");
      e.target.value = '';
    } catch (error) {
      console.error("Erro ao fazer upload do favicon:", error);
      const errorMessage = error.message || "Erro ao fazer upload do favicon. Tente novamente.";
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(""), 5000);
    } finally {
      setUploadingFavicon(false);
      e.target.value = '';
    }
  };

  const handleBannerImageUpload = async (bannerId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (5MB para banners)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("O arquivo é muito grande. Tamanho máximo: 5MB");
      setTimeout(() => setUploadError(""), 5000);
      e.target.value = '';
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Formato não suportado. Use JPEG, PNG, GIF, WEBP ou SVG.");
      setTimeout(() => setUploadError(""), 5000);
      e.target.value = '';
      return;
    }

    setUploadingBanners(prev => ({ ...prev, [bannerId]: true }));
    setUploadError("");

    try {
      const { file_url } = await UploadFile({ file });
      updateBanner(bannerId, 'image', file_url);
      setUploadError("");
      e.target.value = '';
    } catch (error) {
      console.error("Erro ao fazer upload da imagem do banner:", error);
      const errorMessage = error.message || "Erro ao fazer upload da imagem. Tente novamente.";
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(""), 5000);
    } finally {
      setUploadingBanners(prev => ({ ...prev, [bannerId]: false }));
      e.target.value = '';
    }
  };

  const addBanner = () => {
    const newBanner = {
      id: `banner-${Date.now()}`,
      image: "",
      title: "",
      subtitle: "",
      link: "",
      order: settings.appearance.banners.length,
      active: true
    };
    handleChange("appearance", "banners", [...settings.appearance.banners, newBanner]);
  };

  const updateBanner = (bannerId, field, value) => {
    const currentBanners = settings.appearance.banners || [];
    const updatedBanners = currentBanners.map(banner =>
      banner.id === bannerId ? { ...banner, [field]: value } : banner
    );
    handleChange("appearance", "banners", updatedBanners);
  };

  const removeBanner = (bannerId) => {
    const currentBanners = settings.appearance.banners || [];
    const updatedBanners = currentBanners.filter(banner => banner.id !== bannerId);
    handleChange("appearance", "banners", updatedBanners);
  };

  const resetColors = () => {
    // Valores padrão das cores
    const defaultColors = {
      primaryColor: "#2563eb",
      secondaryColor: "#06b6d4",
      accentColor: "#10b981",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      headerColor: "#ffffff",
      footerColor: "#f9fafb",
      buttonPrimaryColor: "#2563eb",
      buttonSecondaryColor: "#06b6d4",
      buttonTextColor: "#ffffff",
      linkColor: "#2563eb",
      linkHoverColor: "#1d4ed8",
      cardBackgroundColor: "#ffffff",
      cardBorderColor: "#e5e7eb",
      cardShadowColor: "rgba(0, 0, 0, 0.1)",
      inputBackgroundColor: "#ffffff",
      inputBorderColor: "#d1d5db",
      inputFocusColor: "#2563eb",
      textSecondaryColor: "#6b7280",
      textMutedColor: "#9ca3af",
      borderColor: "#e5e7eb",
      sectionBackgroundColor: "#f9fafb",
      badgePrimaryColor: "#2563eb",
      badgeSecondaryColor: "#06b6d4",
      badgeSuccessColor: "#10b981",
      badgeErrorColor: "#ef4444",
      badgeWarningColor: "#f59e0b",
      hoverColor: "rgba(37, 99, 235, 0.1)",
      focusRingColor: "#2563eb"
    };

    // Atualizar cada cor individualmente
    Object.entries(defaultColors).forEach(([key, value]) => {
      handleChange("appearance", key, value);
    });
  };

  const moveBanner = (bannerId, direction) => {
    const currentBanners = settings.appearance.banners || [];
    const banners = [...currentBanners];
    const index = banners.findIndex(b => b.id === bannerId);
    if (direction === 'up' && index > 0) {
      [banners[index], banners[index - 1]] = [banners[index - 1], banners[index]];
    } else if (direction === 'down' && index < banners.length - 1) {
      [banners[index], banners[index + 1]] = [banners[index + 1], banners[index]];
    }
    handleChange("appearance", "banners", banners);
  };

  const addSectionToHome = (sectionId) => {
    const currentOrder = settings.appearance.homeSectionsOrder || [];
    if (!currentOrder.includes(sectionId)) {
      handleChange("appearance", "homeSectionsOrder", [...currentOrder, sectionId]);
      // Ativar a seção automaticamente quando adicionada
      if (sectionId === 'banners') handleChange("appearance", "showBanners", true);
      else if (sectionId === 'newsletter') handleChange("appearance", "showNewsletter", true);
      else if (sectionId === 'stats') handleChange("appearance", "showStats", true);
      else if (sectionId === 'partners') handleChange("appearance", "showPartners", true);
      else if (sectionId === 'video') handleChange("appearance", "showVideo", true);
      else if (sectionId === 'faq') handleChange("appearance", "showFaq", true);
    }
  };

  const removeSectionFromHome = (sectionId) => {
    const currentOrder = settings.appearance.homeSectionsOrder || [];
    handleChange("appearance", "homeSectionsOrder", 
      currentOrder.filter(id => id !== sectionId)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Verificar se o usuário está autenticado antes de salvar
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Você precisa estar logado para salvar as configurações. Por favor, faça login novamente.');
        window.location.reload();
      setIsSaving(false);
        return;
      }

      // Verificar se o token ainda é válido
      try {
        await User.me();
      } catch (authError) {
        if (authError.status === 401 || authError.status === 403) {
          alert('Sua sessão expirou. Por favor, faça login novamente para salvar as configurações.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
          setIsSaving(false);
          return;
        }
        throw authError;
      }

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
        facebook_pixel_id: { value: settings.integrations.facebookPixelId, category: 'integrations' },
        
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
        store_signup_form_description: { value: settings.storeSignup.store_signup_form_description, category: 'store_signup' },
        
        // Appearance
        logo: { value: settings.appearance.logo, category: 'appearance' },
        favicon: { value: settings.appearance.favicon, category: 'appearance' },
        banners: { value: JSON.stringify(settings.appearance.banners || []), category: 'appearance' },
        primary_color: { value: settings.appearance.primaryColor, category: 'appearance' },
        secondary_color: { value: settings.appearance.secondaryColor, category: 'appearance' },
        accent_color: { value: settings.appearance.accentColor, category: 'appearance' },
        background_color: { value: settings.appearance.backgroundColor, category: 'appearance' },
        text_color: { value: settings.appearance.textColor, category: 'appearance' },
        header_color: { value: settings.appearance.headerColor, category: 'appearance' },
        footer_color: { value: settings.appearance.footerColor, category: 'appearance' },
        button_primary_color: { value: settings.appearance.buttonPrimaryColor, category: 'appearance' },
        button_secondary_color: { value: settings.appearance.buttonSecondaryColor, category: 'appearance' },
        button_text_color: { value: settings.appearance.buttonTextColor, category: 'appearance' },
        link_color: { value: settings.appearance.linkColor, category: 'appearance' },
        link_hover_color: { value: settings.appearance.linkHoverColor, category: 'appearance' },
        card_background_color: { value: settings.appearance.cardBackgroundColor, category: 'appearance' },
        card_border_color: { value: settings.appearance.cardBorderColor, category: 'appearance' },
        card_shadow_color: { value: settings.appearance.cardShadowColor, category: 'appearance' },
        input_background_color: { value: settings.appearance.inputBackgroundColor, category: 'appearance' },
        input_border_color: { value: settings.appearance.inputBorderColor, category: 'appearance' },
        input_focus_color: { value: settings.appearance.inputFocusColor, category: 'appearance' },
        text_secondary_color: { value: settings.appearance.textSecondaryColor, category: 'appearance' },
        text_muted_color: { value: settings.appearance.textMutedColor, category: 'appearance' },
        border_color: { value: settings.appearance.borderColor, category: 'appearance' },
        section_background_color: { value: settings.appearance.sectionBackgroundColor, category: 'appearance' },
        badge_primary_color: { value: settings.appearance.badgePrimaryColor, category: 'appearance' },
        badge_secondary_color: { value: settings.appearance.badgeSecondaryColor, category: 'appearance' },
        badge_success_color: { value: settings.appearance.badgeSuccessColor, category: 'appearance' },
        badge_error_color: { value: settings.appearance.badgeErrorColor, category: 'appearance' },
        badge_warning_color: { value: settings.appearance.badgeWarningColor, category: 'appearance' },
        hover_color: { value: settings.appearance.hoverColor, category: 'appearance' },
        focus_ring_color: { value: settings.appearance.focusRingColor, category: 'appearance' },
        home_sections_order: { value: JSON.stringify(settings.appearance.homeSectionsOrder), category: 'appearance' },
        show_hero: { value: settings.appearance.showHero.toString(), category: 'appearance' },
        show_categories: { value: settings.appearance.showCategories.toString(), category: 'appearance' },
        show_featured_stores: { value: settings.appearance.showFeaturedStores.toString(), category: 'appearance' },
        show_featured_products: { value: settings.appearance.showFeaturedProducts.toString(), category: 'appearance' },
        show_testimonials: { value: settings.appearance.showTestimonials.toString(), category: 'appearance' },
        show_become_seller: { value: settings.appearance.showBecomeSeller.toString(), category: 'appearance' },
        show_banners: { value: (settings.appearance.showBanners || false).toString(), category: 'appearance' },
        show_newsletter: { value: (settings.appearance.showNewsletter || false).toString(), category: 'appearance' },
        show_stats: { value: (settings.appearance.showStats || false).toString(), category: 'appearance' },
        show_partners: { value: (settings.appearance.showPartners || false).toString(), category: 'appearance' },
        show_video: { value: (settings.appearance.showVideo || false).toString(), category: 'appearance' },
        show_faq: { value: (settings.appearance.showFaq || false).toString(), category: 'appearance' },
        meta_title: { value: settings.appearance.metaTitle, category: 'appearance' },
        meta_description: { value: settings.appearance.metaDescription, category: 'appearance' },
        meta_keywords: { value: settings.appearance.metaKeywords, category: 'appearance' }
      };

      await SettingsAPI.updateBulk(settingsToSave);
      
      // Preservar estado do editor visual antes de recarregar
      const editorStateBeforeSave = isEditorActive;
      
      setSaveSuccess(true);
      
      // Disparar evento para que outras páginas recarreguem as configurações
      window.dispatchEvent(new Event('appearanceChanged'));
      
      // Recarregar configurações do backend após um pequeno delay para garantir que o backend processou
      // Mas não recarregar imediatamente para evitar resetar o estado do editor visual
      setTimeout(async () => {
        // Garantir que o estado do editor visual seja preservado no localStorage antes de recarregar
        if (editorStateBeforeSave) {
          localStorage.setItem('visualEditorActive', 'true');
        }
        
        await loadSettings();
        
        // Restaurar estado do editor visual após recarregar
        // Verificar tanto o localStorage quanto o estado atual
        const savedInStorage = localStorage.getItem('visualEditorActive') === 'true';
        if (editorStateBeforeSave) {
          // Forçar atualização do estado do editor visual
          if (!savedInStorage) {
            localStorage.setItem('visualEditorActive', 'true');
          }
          if (!isEditorActive) {
            toggleEditor(true);
          }
        }
      }, 500);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      
      // Mensagem de erro mais específica
      if (error.status === 401 || error.status === 403) {
        alert('Sua sessão expirou ou você não tem permissão. Por favor, faça login novamente.');
        // Limpar token e recarregar página
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
      } else if (error.message?.includes('Token')) {
        alert('Erro de autenticação. Por favor, faça login novamente.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
      } else {
        alert(`Erro ao salvar configurações: ${error.message || 'Tente novamente.'}`);
      }
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
            <TabsTrigger value="appearance" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none">
              <Palette className="w-4 h-4 mr-2" />
              Aparência
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

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Rastreamento e Analytics</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook-pixel-id">Facebook Pixel ID</Label>
                    <Input
                      id="facebook-pixel-id"
                      value={settings.integrations.facebookPixelId}
                      onChange={(e) => handleChange("integrations", "facebookPixelId", e.target.value)}
                      placeholder="Ex: 123456789012345"
                    />
                    <p className="text-sm text-gray-500">
                      ID do seu Pixel do Facebook para rastreamento de conversões e eventos. Encontre este ID no Gerenciador de Eventos do Facebook.
                    </p>
                  </div>
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

          <TabsContent value="appearance" className="space-y-6">
            {/* Gerenciador de Templates */}
            <AppearanceTemplatesManager
              currentSettings={settings}
              onApplyTemplate={(templateSettings) => {
                // Aplicar template nas configurações
                setSettings(prev => ({
                  ...prev,
                  appearance: {
                    ...prev.appearance,
                    ...templateSettings.appearance
                  }
                }));
                toast.success('Template aplicado! Não esqueça de salvar as alterações.');
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Logo e Favicon</CardTitle>
                <CardDescription>
                  Configure o logo e favicon do site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo do Site</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        id="logo"
                        value={settings.appearance.logo}
                        onChange={(e) => handleChange("appearance", "logo", e.target.value)}
                        placeholder="URL da imagem ou caminho do arquivo"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={uploadingLogo}
                        className="whitespace-nowrap"
                      >
                        {uploadingLogo ? (
                          <>
                            <ArrowUpDown className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Image className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    {settings.appearance.logo && (
                      <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img 
                          src={settings.appearance.logo} 
                          alt="Logo preview" 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    URL completa da imagem ou faça upload de um arquivo (JPEG, PNG, GIF, WEBP, SVG - máx. 5MB)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        id="favicon"
                        value={settings.appearance.favicon}
                        onChange={(e) => handleChange("appearance", "favicon", e.target.value)}
                        placeholder="URL do favicon ou caminho do arquivo"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        id="favicon-upload"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('favicon-upload')?.click()}
                        disabled={uploadingFavicon}
                        className="whitespace-nowrap"
                      >
                        {uploadingFavicon ? (
                          <>
                            <ArrowUpDown className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Image className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    {settings.appearance.favicon && (
                      <div className="w-16 h-16 border rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img 
                          src={settings.appearance.favicon} 
                          alt="Favicon preview" 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Ícone exibido na aba do navegador (recomendado: 32x32px ou 16x16px). Formatos: JPEG, PNG, GIF, WEBP, ICO, SVG - máx. 1MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cores do Aplicativo</CardTitle>
                    <CardDescription>
                      Personalize as cores principais do tema. Veja a preview ao lado.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="editor-mode" className="text-sm font-medium">
                      Editor Visual
                    </Label>
                    <Switch
                      id="editor-mode"
                      checked={isEditorActive}
                      onCheckedChange={(checked) => {
                        console.log('Switch clicado:', checked);
                        toggleEditor(checked);
                        // Forçar atualização do estado
                        setTimeout(() => {
                          const savedState = localStorage.getItem('visualEditorActive') === 'true';
                          console.log('Estado salvo no localStorage:', savedState);
                        }, 100);
                      }}
                    />
                    <span className={`text-xs font-medium ${isEditorActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {isEditorActive ? '✓ Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                {isEditorActive && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Modo Editor Visual Ativado!</strong> Vá para a página Home e clique em qualquer elemento para editar sua cor diretamente.
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview das Cores */}
                <div className="border rounded-lg p-6 bg-gray-50 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Preview das Cores</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Botões */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Botões</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          style={{
                            backgroundColor: settings.appearance.buttonPrimaryColor || "#2563eb",
                            color: settings.appearance.buttonTextColor || "#ffffff"
                          }}
                          className="px-4 py-2 rounded-md font-medium transition-colors"
                        >
                          Botão Primário
                        </button>
                        <button
                          style={{
                            backgroundColor: settings.appearance.buttonSecondaryColor || "#06b6d4",
                            color: settings.appearance.buttonTextColor || "#ffffff"
                          }}
                          className="px-4 py-2 rounded-md font-medium transition-colors"
                        >
                          Botão Secundário
                        </button>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Links</h4>
                      <div className="space-y-2">
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          style={{
                            color: settings.appearance.linkColor || "#2563eb"
                          }}
                          className="underline hover:opacity-80 transition-opacity"
                          onMouseEnter={(e) => {
                            e.target.style.color = settings.appearance.linkHoverColor || "#1d4ed8";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = settings.appearance.linkColor || "#2563eb";
                          }}
                        >
                          Link de exemplo
                        </a>
                        <p className="text-sm" style={{ color: settings.appearance.textSecondaryColor || "#6b7280" }}>
                          Texto secundário
                        </p>
                        <p className="text-sm" style={{ color: settings.appearance.textMutedColor || "#9ca3af" }}>
                          Texto muted
                        </p>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Card</h4>
                      <div
                        className="rounded-lg p-4 border"
                        style={{
                          backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                          borderColor: settings.appearance.cardBorderColor || "#e5e7eb",
                          boxShadow: `0 1px 3px 0 ${settings.appearance.cardShadowColor || "rgba(0, 0, 0, 0.1)"}`
                        }}
                      >
                        <h5 className="font-semibold mb-2" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                          Título do Card
                        </h5>
                        <p className="text-sm" style={{ color: settings.appearance.textSecondaryColor || "#6b7280" }}>
                          Conteúdo do card com as cores personalizadas.
                        </p>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Input</h4>
                      <input
                        type="text"
                        placeholder="Digite algo..."
                        className="w-full px-3 py-2 rounded-md border transition-colors"
                        style={{
                          backgroundColor: settings.appearance.inputBackgroundColor || "#ffffff",
                          borderColor: settings.appearance.inputBorderColor || "#d1d5db",
                          color: settings.appearance.textColor || "#1f2937"
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = settings.appearance.inputFocusColor || "#2563eb";
                          e.target.style.outlineColor = settings.appearance.focusRingColor || "#2563eb";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = settings.appearance.inputBorderColor || "#d1d5db";
                        }}
                      />
                    </div>

                    {/* Badges */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Badges</h4>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: settings.appearance.badgePrimaryColor || "#2563eb" }}
                        >
                          Primário
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: settings.appearance.badgeSecondaryColor || "#06b6d4" }}
                        >
                          Secundário
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: settings.appearance.badgeSuccessColor || "#10b981" }}
                        >
                          Sucesso
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: settings.appearance.badgeErrorColor || "#ef4444" }}
                        >
                          Erro
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: settings.appearance.badgeWarningColor || "#f59e0b" }}
                        >
                          Aviso
                        </span>
                      </div>
                    </div>

                    {/* Seção com Fundo */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Seção</h4>
                      <div
                        className="rounded-lg p-4 border"
                        style={{
                          backgroundColor: settings.appearance.sectionBackgroundColor || "#f9fafb",
                          borderColor: settings.appearance.borderColor || "#e5e7eb"
                        }}
                      >
                        <p className="text-sm" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                          Seção com fundo personalizado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção Geral */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Cores Gerais
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores principais do tema</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="background-color">Cor de Fundo</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="background-color"
                          type="color"
                          value={settings.appearance.backgroundColor}
                          onChange={(e) => handleChange("appearance", "backgroundColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.backgroundColor}
                          onChange={(e) => handleChange("appearance", "backgroundColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2 p-4 rounded border"
                           style={{ 
                             backgroundColor: settings.appearance.backgroundColor || "#ffffff",
                             borderColor: settings.appearance.borderColor || "#e5e7eb"
                           }}>
                        <p className="text-sm">Fundo da página</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Cor de Destaque</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="accent-color"
                          type="color"
                          value={settings.appearance.accentColor}
                          onChange={(e) => handleChange("appearance", "accentColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.accentColor}
                          onChange={(e) => handleChange("appearance", "accentColor", e.target.value)}
                          placeholder="#10b981"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2 p-3 rounded text-white text-sm font-medium"
                           style={{ backgroundColor: settings.appearance.accentColor || "#10b981" }}>
                        ✨ Destaque/Sucesso
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção Hero (Banner Principal) */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Hero (Banner Principal)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Personalize o banner principal no topo da página</p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="hero-title">Título Principal</Label>
                      <Input
                        id="hero-title"
                        value={settings.appearance.heroTitle}
                        onChange={(e) => handleChange("appearance", "heroTitle", e.target.value)}
                        placeholder="Ex: Conecte-se ao comércio local com o NATIVO"
                      />
                      <p className="text-xs text-gray-500">Deixe vazio para usar o texto padrão</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hero-subtitle">Subtítulo</Label>
                      <Textarea
                        id="hero-subtitle"
                        value={settings.appearance.heroSubtitle}
                        onChange={(e) => handleChange("appearance", "heroSubtitle", e.target.value)}
                        placeholder="Ex: A plataforma que conecta você diretamente aos melhores vendedores da sua região."
                        rows={3}
                      />
                      <p className="text-xs text-gray-500">Deixe vazio para usar o texto padrão</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hero-image">Imagem do Hero</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="hero-image"
                          value={settings.appearance.heroImage}
                          onChange={(e) => handleChange("appearance", "heroImage", e.target.value)}
                          placeholder="URL da imagem ou faça upload"
                          className="flex-1"
                        />
                        <input
                          type="file"
                          id="hero-image-upload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setUploadError("Arquivo muito grande. Máximo: 5MB");
                              setTimeout(() => setUploadError(""), 5000);
                              e.target.value = '';
                              return;
                            }
                            setUploadingBanners({ ...uploadingBanners, 'hero-image': true });
                            try {
                              const { file_url } = await UploadFile({ file });
                              handleChange("appearance", "heroImage", file_url);
                              e.target.value = '';
                            } catch (error) {
                              setUploadError(error.message || "Erro ao fazer upload");
                              setTimeout(() => setUploadError(""), 5000);
                            } finally {
                              setUploadingBanners({ ...uploadingBanners, 'hero-image': false });
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('hero-image-upload')?.click()}
                          disabled={uploadingBanners['hero-image']}
                        >
                          {uploadingBanners['hero-image'] ? (
                            <>
                              <ArrowUpDown className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Image className="w-4 h-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      </div>
                      {settings.appearance.heroImage && (
                        <div className="w-full h-32 border rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={settings.appearance.heroImage} 
                            alt="Hero preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mb-4">
                    <h4 className="text-sm font-semibold mb-3">Estatísticas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hero-stats-products">Número de Produtos</Label>
                        <Input
                          id="hero-stats-products"
                          value={settings.appearance.heroStatsProducts}
                          onChange={(e) => handleChange("appearance", "heroStatsProducts", e.target.value)}
                          placeholder="Ex: +2000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hero-stats-vendors">Número de Vendedores</Label>
                        <Input
                          id="hero-stats-vendors"
                          value={settings.appearance.heroStatsVendors}
                          onChange={(e) => handleChange("appearance", "heroStatsVendors", e.target.value)}
                          placeholder="Ex: +500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hero-stats-clients">Número de Clientes</Label>
                        <Input
                          id="hero-stats-clients"
                          value={settings.appearance.heroStatsClients}
                          onChange={(e) => handleChange("appearance", "heroStatsClients", e.target.value)}
                          placeholder="Ex: +5000"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mb-4">
                    <h4 className="text-sm font-semibold mb-3">Textos dos Cards</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hero-card-free">Card "100% Grátis"</Label>
                        <Input
                          id="hero-card-free"
                          value={settings.appearance.heroCardFree}
                          onChange={(e) => handleChange("appearance", "heroCardFree", e.target.value)}
                          placeholder="Ex: 100% Grátis|para comprar e vender"
                        />
                        <p className="text-xs text-gray-500">Use | para separar título e subtítulo</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hero-card-whatsapp">Card "WhatsApp"</Label>
                        <Input
                          id="hero-card-whatsapp"
                          value={settings.appearance.heroCardWhatsapp}
                          onChange={(e) => handleChange("appearance", "heroCardWhatsapp", e.target.value)}
                          placeholder="Ex: Contato direto|via WhatsApp"
                        />
                        <p className="text-xs text-gray-500">Use | para separar título e subtítulo</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hero-card-local">Card "Local"</Label>
                        <Input
                          id="hero-card-local"
                          value={settings.appearance.heroCardLocal}
                          onChange={(e) => handleChange("appearance", "heroCardLocal", e.target.value)}
                          placeholder="Ex: Produtos locais|perto de você"
                        />
                        <p className="text-xs text-gray-500">Use | para separar título e subtítulo</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mb-4">
                    <h4 className="text-sm font-semibold mb-3">Cores do Gradiente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Cor Primária do Gradiente</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={settings.appearance.primaryColor || "#2563eb"}
                          onChange={(e) => handleChange("appearance", "primaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.primaryColor}
                          onChange={(e) => handleChange("appearance", "primaryColor", e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Cor Secundária do Gradiente</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={settings.appearance.secondaryColor}
                          onChange={(e) => handleChange("appearance", "secondaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.secondaryColor}
                          onChange={(e) => handleChange("appearance", "secondaryColor", e.target.value)}
                          placeholder="#06b6d4"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    </div>
                    {/* Preview Completo do Hero */}
                    <div className="mt-4 p-6 rounded-xl text-white"
                         style={{ 
                           background: `linear-gradient(to right, ${settings.appearance.primaryColor || "#2563eb"}, ${settings.appearance.secondaryColor || "#06b6d4"})`
                         }}>
                      <h3 className="text-2xl font-bold mb-2">Conecte-se ao comércio local</h3>
                      <p className="text-sm opacity-90 mb-4">A plataforma que conecta você diretamente aos melhores vendedores</p>
                      <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold">
                        Explorar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seção Busca */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Barra de Busca
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores da barra de busca e filtros</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="input-background-color">Fundo da Busca</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="input-background-color"
                          type="color"
                          value={settings.appearance.inputBackgroundColor}
                          onChange={(e) => handleChange("appearance", "inputBackgroundColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.inputBackgroundColor}
                          onChange={(e) => handleChange("appearance", "inputBackgroundColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="input-border-color">Borda da Busca</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="input-border-color"
                          type="color"
                          value={settings.appearance.inputBorderColor}
                          onChange={(e) => handleChange("appearance", "inputBorderColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.inputBorderColor}
                          onChange={(e) => handleChange("appearance", "inputBorderColor", e.target.value)}
                          placeholder="#d1d5db"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="input-focus-color">Cor ao Focar (Focus)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="input-focus-color"
                          type="color"
                          value={settings.appearance.inputFocusColor}
                          onChange={(e) => handleChange("appearance", "inputFocusColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.inputFocusColor}
                          onChange={(e) => handleChange("appearance", "inputFocusColor", e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo da Barra de Busca */}
                  <div className="mt-4 p-4 rounded-xl border-2"
                       style={{
                         backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                         borderColor: settings.appearance.inputBorderColor || "#d1d5db",
                         boxShadow: `0 4px 6px ${settings.appearance.cardShadowColor || "rgba(0, 0, 0, 0.1)"}`
                       }}>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
                        <input
                          type="text"
                          placeholder="Buscar produtos, lojas, categorias..."
                          className="w-full h-12 pl-10 pr-4 rounded-lg border-2 text-sm"
                          style={{
                            backgroundColor: settings.appearance.inputBackgroundColor || "#ffffff",
                            borderColor: settings.appearance.inputBorderColor || "#d1d5db",
                            color: settings.appearance.textColor || "#1f2937"
                          }}
                          readOnly
                        />
                      </div>
                      <button className="px-6 h-12 rounded-lg text-white text-sm font-semibold"
                              style={{
                                background: `linear-gradient(to right, ${settings.appearance.buttonPrimaryColor || "#2563eb"}, ${settings.appearance.secondaryColor || "#1d4ed8"})`,
                                color: settings.appearance.buttonTextColor || "#ffffff"
                              }}>
                        Buscar
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select className="px-3 py-2 rounded-lg border text-sm"
                              style={{
                                backgroundColor: settings.appearance.inputBackgroundColor || "#ffffff",
                                borderColor: settings.appearance.inputBorderColor || "#d1d5db",
                                color: settings.appearance.textColor || "#1f2937"
                              }}>
                        <option>Categoria</option>
                      </select>
                      <button className="px-4 py-2 rounded-lg border text-sm"
                              style={{
                                borderColor: settings.appearance.inputBorderColor || "#d1d5db",
                                color: settings.appearance.textColor || "#1f2937"
                              }}>
                        📍 Localização
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seção Categorias */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Categorias
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores dos cards de categorias</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-background-color">Fundo do Card de Categoria</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="card-background-color"
                          type="color"
                          value={settings.appearance.cardBackgroundColor}
                          onChange={(e) => handleChange("appearance", "cardBackgroundColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.cardBackgroundColor}
                          onChange={(e) => handleChange("appearance", "cardBackgroundColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-border-color">Borda do Card</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="card-border-color"
                          type="color"
                          value={settings.appearance.cardBorderColor}
                          onChange={(e) => handleChange("appearance", "cardBorderColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.cardBorderColor}
                          onChange={(e) => handleChange("appearance", "cardBorderColor", e.target.value)}
                          placeholder="#e5e7eb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo das Categorias */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-3" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                      Preview dos Cards de Categorias
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-lg border text-center"
                             style={{
                               backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                               borderColor: settings.appearance.cardBorderColor || "#e5e7eb",
                               boxShadow: `0 1px 3px 0 ${settings.appearance.cardShadowColor || "rgba(0, 0, 0, 0.1)"}`
                             }}>
                          <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                               style={{ backgroundColor: settings.appearance.primaryColor || "#2563eb" }}>
                            <span className="text-white text-lg">📦</span>
                          </div>
                          <p className="text-xs font-medium" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                            Categoria {i}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Seção Cards de Produtos */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Cards de Produtos
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores dos cards de produtos na grade</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-shadow-color">Sombra do Card</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="card-shadow-color"
                          type="color"
                          value={settings.appearance.cardShadowColor?.replace(/rgba?\([^)]+\)/, '') || "#000000"}
                          onChange={(e) => {
                            const rgba = `rgba(${parseInt(e.target.value.slice(1, 3), 16)}, ${parseInt(e.target.value.slice(3, 5), 16)}, ${parseInt(e.target.value.slice(5, 7), 16)}, 0.1)`;
                            handleChange("appearance", "cardShadowColor", rgba);
                          }}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.cardShadowColor}
                          onChange={(e) => handleChange("appearance", "cardShadowColor", e.target.value)}
                          placeholder="rgba(0, 0, 0, 0.1)"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Use formato rgba (ex: rgba(0, 0, 0, 0.1))</p>
                    </div>
                  </div>
                  {/* Preview Completo dos Cards de Produtos */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-3" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                      Preview dos Cards de Produtos
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="rounded-lg border overflow-hidden"
                             style={{
                               backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                               borderColor: settings.appearance.cardBorderColor || "#e5e7eb",
                               boxShadow: `0 4px 6px ${settings.appearance.cardShadowColor || "rgba(0, 0, 0, 0.1)"}`
                             }}>
                          <div className="w-full h-24 bg-gray-200"></div>
                          <div className="p-3">
                            <p className="text-sm font-medium mb-1" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                              Produto {i}
                            </p>
                            <p className="text-xs font-semibold mb-2" style={{ color: settings.appearance.primaryColor || "#2563eb" }}>
                              R$ 99,90
                            </p>
                            <button className="w-full py-2 rounded-lg text-xs font-medium text-white"
                                    style={{
                                      backgroundColor: settings.appearance.buttonPrimaryColor || "#2563eb",
                                      color: settings.appearance.buttonTextColor || "#ffffff"
                                    }}>
                              Ver Produto
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Os botões "Ver Produto" usam as cores do Botão Primário e Texto do Botão configuradas na seção Botões
                    </p>
                  </div>
                </div>

                {/* Seção Banner "Seja um Lojista" */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Banner "Seja um Lojista"
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores do banner promocional "Seja um Lojista NATIVO"</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gradiente do Banner</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        O banner usa as cores Primária e Secundária do Hero para criar o gradiente
                      </p>
                      <div className="mt-2 p-6 rounded-xl text-white text-center"
                           style={{
                             background: `linear-gradient(to right, ${settings.appearance.primaryColor || '#2563eb'}, ${settings.appearance.secondaryColor || '#06b6d4'})`
                           }}>
                        <h3 className="text-xl font-bold mb-2">Seja um Lojista NATIVO</h3>
                        <p className="text-sm opacity-90 mb-4">
                          Alcance mais clientes, aumente suas vendas
                        </p>
                        <div className="flex gap-2 justify-center">
                          <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold">
                            Fazer Login
                          </button>
                          <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold">
                            Cadastrar Loja
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Dica: Altere as cores "Cor Primária do Gradiente" e "Cor Secundária do Gradiente" na seção Hero para mudar este banner
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seção Botões */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Botões
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores dos botões de ação em toda a página, incluindo botões "Ver Produto" nos cards</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="button-primary-color">Cor do Botão Primário</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="button-primary-color"
                          type="color"
                          value={settings.appearance.buttonPrimaryColor}
                          onChange={(e) => handleChange("appearance", "buttonPrimaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.buttonPrimaryColor}
                          onChange={(e) => handleChange("appearance", "buttonPrimaryColor", e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="button-secondary-color">Cor do Botão Secundário</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="button-secondary-color"
                          type="color"
                          value={settings.appearance.buttonSecondaryColor}
                          onChange={(e) => handleChange("appearance", "buttonSecondaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.buttonSecondaryColor}
                          onChange={(e) => handleChange("appearance", "buttonSecondaryColor", e.target.value)}
                          placeholder="#06b6d4"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="button-text-color">Cor do Texto do Botão</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="button-text-color"
                          type="color"
                          value={settings.appearance.buttonTextColor}
                          onChange={(e) => handleChange("appearance", "buttonTextColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.buttonTextColor}
                          onChange={(e) => handleChange("appearance", "buttonTextColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo dos Botões */}
                  <div className="mt-4 p-6 rounded-xl border"
                       style={{
                         backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                         borderColor: settings.appearance.cardBorderColor || "#e5e7eb"
                       }}>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-6 py-3 rounded-lg text-sm font-semibold"
                              style={{
                                backgroundColor: settings.appearance.buttonPrimaryColor || "#2563eb",
                                color: settings.appearance.buttonTextColor || "#ffffff"
                              }}>
                        Botão Primário
                      </button>
                      <button className="px-6 py-3 rounded-lg text-sm font-semibold"
                              style={{
                                backgroundColor: settings.appearance.buttonSecondaryColor || "#06b6d4",
                                color: settings.appearance.buttonTextColor || "#ffffff"
                              }}>
                        Botão Secundário
                      </button>
                      <button className="px-6 py-3 rounded-lg text-sm font-semibold border-2"
                              style={{
                                borderColor: settings.appearance.buttonPrimaryColor || "#2563eb",
                                color: settings.appearance.buttonPrimaryColor || "#2563eb",
                                backgroundColor: 'transparent'
                              }}>
                        Botão Outline
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seção Links */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Links
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores dos links de navegação</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="link-color">Cor do Link</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="link-color"
                          type="color"
                          value={settings.appearance.linkColor}
                          onChange={(e) => handleChange("appearance", "linkColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.linkColor}
                          onChange={(e) => handleChange("appearance", "linkColor", e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link-hover-color">Cor do Link (Hover)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="link-hover-color"
                          type="color"
                          value={settings.appearance.linkHoverColor}
                          onChange={(e) => handleChange("appearance", "linkHoverColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.linkHoverColor}
                          onChange={(e) => handleChange("appearance", "linkHoverColor", e.target.value)}
                          placeholder="#1d4ed8"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo dos Links */}
                  <div className="mt-4 p-6 rounded-xl border"
                       style={{
                         backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                         borderColor: settings.appearance.cardBorderColor || "#e5e7eb"
                       }}>
                    <p className="mb-3" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                      Este é um parágrafo com um{' '}
                      <a href="#" onClick={(e) => e.preventDefault()} className="underline"
                         style={{ color: settings.appearance.linkColor || "#2563eb" }}
                         onMouseEnter={(e) => e.target.style.color = settings.appearance.linkHoverColor || "#1d4ed8"}
                         onMouseLeave={(e) => e.target.style.color = settings.appearance.linkColor || "#2563eb"}>
                        link clicável
                      </a>
                      {' '}no meio do texto.
                    </p>
                    <div className="space-y-2">
                      <a href="#" onClick={(e) => e.preventDefault()} className="block underline text-sm"
                         style={{ color: settings.appearance.linkColor || "#2563eb" }}
                         onMouseEnter={(e) => e.target.style.color = settings.appearance.linkHoverColor || "#1d4ed8"}
                         onMouseLeave={(e) => e.target.style.color = settings.appearance.linkColor || "#2563eb"}>
                        🔗 Link de navegação
                      </a>
                      <a href="#" onClick={(e) => e.preventDefault()} className="block underline text-sm"
                         style={{ color: settings.appearance.linkColor || "#2563eb" }}
                         onMouseEnter={(e) => e.target.style.color = settings.appearance.linkHoverColor || "#1d4ed8"}
                         onMouseLeave={(e) => e.target.style.color = settings.appearance.linkColor || "#2563eb"}>
                        🔗 Outro link de exemplo
                      </a>
                    </div>
                  </div>
                </div>

                {/* Seção Textos */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Textos
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores dos textos na página</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="text-color">Cor do Texto Principal</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="text-color"
                          type="color"
                          value={settings.appearance.textColor}
                          onChange={(e) => handleChange("appearance", "textColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.textColor}
                          onChange={(e) => handleChange("appearance", "textColor", e.target.value)}
                          placeholder="#1f2937"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="text-secondary-color">Texto Secundário</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="text-secondary-color"
                          type="color"
                          value={settings.appearance.textSecondaryColor}
                          onChange={(e) => handleChange("appearance", "textSecondaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.textSecondaryColor}
                          onChange={(e) => handleChange("appearance", "textSecondaryColor", e.target.value)}
                          placeholder="#6b7280"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="text-muted-color">Texto Muted</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="text-muted-color"
                          type="color"
                          value={settings.appearance.textMutedColor}
                          onChange={(e) => handleChange("appearance", "textMutedColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.textMutedColor}
                          onChange={(e) => handleChange("appearance", "textMutedColor", e.target.value)}
                          placeholder="#9ca3af"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo dos Textos */}
                  <div className="mt-4 p-6 rounded-xl border"
                       style={{
                         backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                         borderColor: settings.appearance.cardBorderColor || "#e5e7eb"
                       }}>
                    <h3 className="text-xl font-bold mb-2" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                      Título Principal
                    </h3>
                    <p className="text-base mb-3" style={{ color: settings.appearance.textSecondaryColor || "#6b7280" }}>
                      Este é um texto secundário usado para descrições e subtítulos. Ele tem uma cor mais suave que o texto principal.
                    </p>
                    <p className="text-sm" style={{ color: settings.appearance.textMutedColor || "#9ca3af" }}>
                      Este é um texto muted usado para informações menos importantes, como datas, metadados ou notas auxiliares.
                    </p>
                  </div>
                </div>

                {/* Seção Cabeçalho e Rodapé */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Cabeçalho e Rodapé
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores do header e footer da página</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-color">Cor do Cabeçalho</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="header-color"
                          type="color"
                          value={settings.appearance.headerColor}
                          onChange={(e) => handleChange("appearance", "headerColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.headerColor}
                          onChange={(e) => handleChange("appearance", "headerColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-color">Cor do Rodapé</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="footer-color"
                          type="color"
                          value={settings.appearance.footerColor}
                          onChange={(e) => handleChange("appearance", "footerColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.footerColor}
                          onChange={(e) => handleChange("appearance", "footerColor", e.target.value)}
                          placeholder="#f9fafb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo do Header e Footer */}
                  <div className="mt-4 space-y-2">
                    <div className="p-4 rounded-t-lg border-b"
                         style={{ 
                           backgroundColor: settings.appearance.headerColor || "#ffffff",
                           borderColor: settings.appearance.borderColor || "#e5e7eb"
                         }}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: settings.appearance.textColor || "#1f2937" }}>NATIVO</span>
                        <div className="flex gap-4">
                          <a href="#" onClick={(e) => e.preventDefault()} className="text-sm"
                             style={{ color: settings.appearance.linkColor || "#2563eb" }}>Home</a>
                          <a href="#" onClick={(e) => e.preventDefault()} className="text-sm"
                             style={{ color: settings.appearance.linkColor || "#2563eb" }}>Produtos</a>
                          <a href="#" onClick={(e) => e.preventDefault()} className="text-sm"
                             style={{ color: settings.appearance.linkColor || "#2563eb" }}>Lojas</a>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-b-lg border"
                         style={{ 
                           backgroundColor: settings.appearance.footerColor || "#f9fafb",
                           borderColor: settings.appearance.borderColor || "#e5e7eb"
                         }}>
                      <p className="text-xs text-center" style={{ color: settings.appearance.textMutedColor || "#9ca3af" }}>
                        © 2024 NATIVO - Todos os direitos reservados
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seção Cards (mantida para compatibilidade) */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Cores de Cards (Geral)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-background-color">Fundo do Card</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="card-background-color"
                          type="color"
                          value={settings.appearance.cardBackgroundColor}
                          onChange={(e) => handleChange("appearance", "cardBackgroundColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.cardBackgroundColor}
                          onChange={(e) => handleChange("appearance", "cardBackgroundColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2 p-3 rounded border text-xs"
                           style={{
                             backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                             borderColor: settings.appearance.cardBorderColor || "#e5e7eb"
                           }}>
                        📦 Card preview
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-border-color">Borda do Card</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="card-border-color"
                          type="color"
                          value={settings.appearance.cardBorderColor}
                          onChange={(e) => handleChange("appearance", "cardBorderColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.cardBorderColor}
                          onChange={(e) => handleChange("appearance", "cardBorderColor", e.target.value)}
                          placeholder="#e5e7eb"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2 h-8 rounded border flex items-center justify-center text-xs"
                           style={{ borderColor: settings.appearance.cardBorderColor || "#e5e7eb" }}>
                        Borda
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-shadow-color">Sombra do Card</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="card-shadow-color"
                          type="color"
                          value={settings.appearance.cardShadowColor?.replace(/rgba?\([^)]+\)/, '') || "#000000"}
                          onChange={(e) => {
                            const rgba = `rgba(${parseInt(e.target.value.slice(1, 3), 16)}, ${parseInt(e.target.value.slice(3, 5), 16)}, ${parseInt(e.target.value.slice(5, 7), 16)}, 0.1)`;
                            handleChange("appearance", "cardShadowColor", rgba);
                          }}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.cardShadowColor}
                          onChange={(e) => handleChange("appearance", "cardShadowColor", e.target.value)}
                          placeholder="rgba(0, 0, 0, 0.1)"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2 p-3 rounded border text-xs"
                           style={{
                             backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                             boxShadow: `0 2px 4px ${settings.appearance.cardShadowColor || "rgba(0, 0, 0, 0.1)"}`
                           }}>
                        Sombra aplicada
                      </div>
                      <p className="text-sm text-gray-500">Use formato rgba (ex: rgba(0, 0, 0, 0.1))</p>
                    </div>
                  </div>
                </div>

                {/* Seção Inputs (mantida para compatibilidade) */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Cores de Inputs (Geral)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="input-background-color">Fundo do Input</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="input-background-color"
                          type="color"
                          value={settings.appearance.inputBackgroundColor}
                          onChange={(e) => handleChange("appearance", "inputBackgroundColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.inputBackgroundColor}
                          onChange={(e) => handleChange("appearance", "inputBackgroundColor", e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Input preview"
                          className="w-full px-3 py-2 rounded border text-sm"
                          style={{
                            backgroundColor: settings.appearance.inputBackgroundColor || "#ffffff",
                            borderColor: settings.appearance.inputBorderColor || "#d1d5db"
                          }}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="input-border-color">Borda do Input</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="input-border-color"
                          type="color"
                          value={settings.appearance.inputBorderColor}
                          onChange={(e) => handleChange("appearance", "inputBorderColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.inputBorderColor}
                          onChange={(e) => handleChange("appearance", "inputBorderColor", e.target.value)}
                          placeholder="#d1d5db"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2 h-8 rounded border flex items-center justify-center text-xs"
                           style={{ borderColor: settings.appearance.inputBorderColor || "#d1d5db" }}>
                        Borda do input
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="input-focus-color">Cor do Input (Focus)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="input-focus-color"
                          type="color"
                          value={settings.appearance.inputFocusColor}
                          onChange={(e) => handleChange("appearance", "inputFocusColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.inputFocusColor}
                          onChange={(e) => handleChange("appearance", "inputFocusColor", e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Clique para ver focus"
                          className="w-full px-3 py-2 rounded border text-sm transition-colors"
                          style={{
                            borderColor: settings.appearance.inputFocusColor || "#2563eb",
                            outlineColor: settings.appearance.focusRingColor || "#2563eb"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = settings.appearance.inputFocusColor || "#2563eb";
                            e.target.style.outline = `2px solid ${settings.appearance.focusRingColor || "#2563eb"}`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = settings.appearance.inputBorderColor || "#d1d5db";
                            e.target.style.outline = "none";
                          }}
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">Clique no input para ver o focus</p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Seção Bordas e Seções */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Bordas e Seções
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores de bordas e fundos de seções</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="border-color">Cor de Bordas</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="border-color"
                          type="color"
                          value={settings.appearance.borderColor}
                          onChange={(e) => handleChange("appearance", "borderColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.borderColor}
                          onChange={(e) => handleChange("appearance", "borderColor", e.target.value)}
                          placeholder="#e5e7eb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section-background-color">Fundo de Seções</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="section-background-color"
                          type="color"
                          value={settings.appearance.sectionBackgroundColor}
                          onChange={(e) => handleChange("appearance", "sectionBackgroundColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.sectionBackgroundColor}
                          onChange={(e) => handleChange("appearance", "sectionBackgroundColor", e.target.value)}
                          placeholder="#f9fafb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo de Bordas e Seções */}
                  <div className="mt-4 space-y-3">
                    <div className="p-4 rounded-lg border"
                         style={{
                           borderColor: settings.appearance.borderColor || "#e5e7eb",
                           backgroundColor: settings.appearance.sectionBackgroundColor || "#f9fafb"
                         }}>
                      <h4 className="font-semibold mb-2" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                        Seção com Fundo Personalizado
                      </h4>
                      <p className="text-sm" style={{ color: settings.appearance.textSecondaryColor || "#6b7280" }}>
                        Esta seção usa a cor de fundo personalizada e bordas customizadas.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border"
                         style={{
                           borderColor: settings.appearance.borderColor || "#e5e7eb",
                           backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff"
                         }}>
                      <p className="text-sm" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                        Outra seção com borda personalizada
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seção Badges */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Badges
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Cores dos badges e etiquetas</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="badge-primary-color">Badge Primário</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="badge-primary-color"
                          type="color"
                          value={settings.appearance.badgePrimaryColor}
                          onChange={(e) => handleChange("appearance", "badgePrimaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.badgePrimaryColor}
                          onChange={(e) => handleChange("appearance", "badgePrimaryColor", e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badge-secondary-color">Badge Secundário</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="badge-secondary-color"
                          type="color"
                          value={settings.appearance.badgeSecondaryColor}
                          onChange={(e) => handleChange("appearance", "badgeSecondaryColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.badgeSecondaryColor}
                          onChange={(e) => handleChange("appearance", "badgeSecondaryColor", e.target.value)}
                          placeholder="#06b6d4"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badge-success-color">Badge Sucesso</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="badge-success-color"
                          type="color"
                          value={settings.appearance.badgeSuccessColor}
                          onChange={(e) => handleChange("appearance", "badgeSuccessColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.badgeSuccessColor}
                          onChange={(e) => handleChange("appearance", "badgeSuccessColor", e.target.value)}
                          placeholder="#10b981"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badge-error-color">Badge Erro</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="badge-error-color"
                          type="color"
                          value={settings.appearance.badgeErrorColor}
                          onChange={(e) => handleChange("appearance", "badgeErrorColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.badgeErrorColor}
                          onChange={(e) => handleChange("appearance", "badgeErrorColor", e.target.value)}
                          placeholder="#ef4444"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badge-warning-color">Badge Aviso</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="badge-warning-color"
                          type="color"
                          value={settings.appearance.badgeWarningColor}
                          onChange={(e) => handleChange("appearance", "badgeWarningColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.badgeWarningColor}
                          onChange={(e) => handleChange("appearance", "badgeWarningColor", e.target.value)}
                          placeholder="#f59e0b"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview Completo dos Badges */}
                  <div className="mt-4 p-6 rounded-xl border"
                       style={{
                         backgroundColor: settings.appearance.cardBackgroundColor || "#ffffff",
                         borderColor: settings.appearance.cardBorderColor || "#e5e7eb"
                       }}>
                    <h4 className="text-sm font-medium mb-4" style={{ color: settings.appearance.textColor || "#1f2937" }}>
                      Preview de Todos os Badges
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-4 py-2 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: settings.appearance.badgePrimaryColor || "#2563eb" }}>
                        🏷️ Primário
                      </span>
                      <span className="px-4 py-2 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: settings.appearance.badgeSecondaryColor || "#06b6d4" }}>
                        🏷️ Secundário
                      </span>
                      <span className="px-4 py-2 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: settings.appearance.badgeSuccessColor || "#10b981" }}>
                        ✅ Sucesso
                      </span>
                      <span className="px-4 py-2 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: settings.appearance.badgeErrorColor || "#ef4444" }}>
                        ❌ Erro
                      </span>
                      <span className="px-4 py-2 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: settings.appearance.badgeWarningColor || "#f59e0b" }}>
                        ⚠️ Aviso
                      </span>
                    </div>
                    <p className="text-xs mt-4" style={{ color: settings.appearance.textMutedColor || "#9ca3af" }}>
                      Badges são usados para destacar informações, status e categorias em produtos e lojas
                    </p>
                  </div>
                </div>

                {/* Cores de Estados (Hover, Focus) */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Cores de Estados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hover-color">Cor de Hover</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="hover-color"
                          type="color"
                          value={settings.appearance.hoverColor?.replace(/rgba?\([^)]+\)/, '') || "#2563eb"}
                          onChange={(e) => {
                            // Converter hex para rgba com opacidade
                            const rgba = `rgba(${parseInt(e.target.value.slice(1, 3), 16)}, ${parseInt(e.target.value.slice(3, 5), 16)}, ${parseInt(e.target.value.slice(5, 7), 16)}, 0.1)`;
                            handleChange("appearance", "hoverColor", rgba);
                          }}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.hoverColor}
                          onChange={(e) => handleChange("appearance", "hoverColor", e.target.value)}
                          placeholder="rgba(37, 99, 235, 0.1)"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="p-3 rounded border text-xs transition-colors cursor-pointer"
                             style={{
                               backgroundColor: settings.appearance.hoverColor || "rgba(37, 99, 235, 0.1)",
                               borderColor: settings.appearance.borderColor || "#e5e7eb"
                             }}
                             onMouseEnter={(e) => {
                               e.target.style.backgroundColor = settings.appearance.hoverColor || "rgba(37, 99, 235, 0.1)";
                             }}>
                          🖱️ Passe o mouse aqui (hover)
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Fundo quando passa o mouse sobre elementos</p>
                      </div>
                      <p className="text-sm text-gray-500">Use formato rgba (ex: rgba(37, 99, 235, 0.1))</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="focus-ring-color">Cor do Anel de Foco</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="focus-ring-color"
                          type="color"
                          value={settings.appearance.focusRingColor}
                          onChange={(e) => handleChange("appearance", "focusRingColor", e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.appearance.focusRingColor}
                          onChange={(e) => handleChange("appearance", "focusRingColor", e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="p-2 rounded border text-xs"
                             style={{
                               outline: `2px solid ${settings.appearance.focusRingColor || "#2563eb"}`,
                               outlineOffset: "2px",
                               borderColor: settings.appearance.borderColor || "#e5e7eb"
                             }}>
                          🎯 Anel de foco (focus ring)
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Borda quando elemento está focado (Tab/Click)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetColors}
                    className="gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Redefinir Cores Padrão
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banners Promocionais</CardTitle>
                <CardDescription>
                  Adicione e gerencie múltiplos banners promocionais para exibir na home
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  type="button"
                  onClick={addBanner}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Banner
                </Button>

                <div className="space-y-4">
                  {(settings.appearance.banners || []).map((banner, index) => (
                    <div key={banner.id} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Banner {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveBanner(banner.id, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveBanner(banner.id, 'down')}
                            disabled={index === (settings.appearance.banners || []).length - 1}
                            className="h-8 w-8 p-0"
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBanner(banner.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>URL da Imagem</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={banner.image}
                              onChange={(e) => updateBanner(banner.id, 'image', e.target.value)}
                              placeholder="URL da imagem do banner"
                              className="flex-1"
                            />
                            <input
                              type="file"
                              id={`banner-upload-${banner.id}`}
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                              onChange={(e) => handleBannerImageUpload(banner.id, e)}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`banner-upload-${banner.id}`)?.click()}
                              disabled={uploadingBanners[banner.id]}
                              className="whitespace-nowrap"
                            >
                              {uploadingBanners[banner.id] ? (
                                <>
                                  <ArrowUpDown className="w-4 h-4 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Image className="w-4 h-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            URL completa ou faça upload (JPEG, PNG, GIF, WEBP, SVG - máx. 5MB)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Link (opcional)</Label>
                          <Input
                            value={banner.link}
                            onChange={(e) => updateBanner(banner.id, 'link', e.target.value)}
                            placeholder="URL de destino ao clicar"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Título (opcional)</Label>
                          <Input
                            value={banner.title}
                            onChange={(e) => updateBanner(banner.id, 'title', e.target.value)}
                            placeholder="Título do banner"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subtítulo (opcional)</Label>
                          <Input
                            value={banner.subtitle}
                            onChange={(e) => updateBanner(banner.id, 'subtitle', e.target.value)}
                            placeholder="Subtítulo do banner"
                          />
                        </div>
                      </div>

                      {banner.image && (
                        <div className="border rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={banner.image} 
                            alt={banner.title || `Banner ${index + 1}`}
                            className="w-full h-48 object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Label>Ativo</Label>
                        <Switch
                          checked={banner.active}
                          onCheckedChange={(checked) => updateBanner(banner.id, 'active', checked)}
                        />
                      </div>
                    </div>
                  ))}

                  {(!settings.appearance.banners || settings.appearance.banners.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum banner adicionado. Clique em "Adicionar Banner" para começar.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ordem dos Elementos na Home</CardTitle>
                <CardDescription>
                  Configure a ordem e visibilidade das seções da página inicial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {(settings.appearance.homeSectionsOrder || []).map((section, index) => {
                    const sectionInfo = (settings.appearance.availableSections || []).find(s => s.id === section);
                    const sectionName = sectionInfo?.name || section;
                    
                    return (
                      <div key={section} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentOrder = settings.appearance.homeSectionsOrder || [];
                                if (index > 0) {
                                  const newOrder = [...currentOrder];
                                  [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                                  handleChange("appearance", "homeSectionsOrder", newOrder);
                                }
                              }}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentOrder = settings.appearance.homeSectionsOrder || [];
                                if (index < currentOrder.length - 1) {
                                  const newOrder = [...currentOrder];
                                  [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                  handleChange("appearance", "homeSectionsOrder", newOrder);
                                }
                              }}
                              disabled={index === (settings.appearance.homeSectionsOrder || []).length - 1}
                              className="h-6 w-6 p-0"
                            >
                              ↓
                            </Button>
                          </div>
                          <span className="font-medium">{sectionName}</span>
                          <span className="text-sm text-gray-500">Posição {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={
                              section === 'hero' ? settings.appearance.showHero :
                              section === 'categories' ? settings.appearance.showCategories :
                              section === 'featured_stores' ? settings.appearance.showFeaturedStores :
                              section === 'featured_products' ? settings.appearance.showFeaturedProducts :
                              section === 'testimonials' ? settings.appearance.showTestimonials :
                              section === 'become_seller' ? settings.appearance.showBecomeSeller :
                              section === 'banners' ? settings.appearance.showBanners :
                              section === 'newsletter' ? settings.appearance.showNewsletter :
                              section === 'stats' ? settings.appearance.showStats :
                              section === 'partners' ? settings.appearance.showPartners :
                              section === 'video' ? settings.appearance.showVideo :
                              settings.appearance.showFaq
                            }
                            onCheckedChange={(checked) => {
                              if (section === 'hero') handleChange("appearance", "showHero", checked);
                              else if (section === 'categories') handleChange("appearance", "showCategories", checked);
                              else if (section === 'featured_stores') handleChange("appearance", "showFeaturedStores", checked);
                              else if (section === 'featured_products') handleChange("appearance", "showFeaturedProducts", checked);
                              else if (section === 'testimonials') handleChange("appearance", "showTestimonials", checked);
                              else if (section === 'become_seller') handleChange("appearance", "showBecomeSeller", checked);
                              else if (section === 'banners') handleChange("appearance", "showBanners", checked);
                              else if (section === 'newsletter') handleChange("appearance", "showNewsletter", checked);
                              else if (section === 'stats') handleChange("appearance", "showStats", checked);
                              else if (section === 'partners') handleChange("appearance", "showPartners", checked);
                              else if (section === 'video') handleChange("appearance", "showVideo", checked);
                              else handleChange("appearance", "showFaq", checked);
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSectionFromHome(section)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4">
                  <Label className="mb-3 block">Adicionar Elementos Disponíveis</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(settings.appearance.availableSections || [])
                      .filter(section => !(settings.appearance.homeSectionsOrder || []).includes(section.id))
                      .map(section => (
                        <Button
                          key={section.id}
                          type="button"
                          variant="outline"
                          onClick={() => addSectionToHome(section.id)}
                          className="justify-start"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {section.name}
                        </Button>
                      ))}
                  </div>
                  {(settings.appearance.availableSections || []).filter(section => !(settings.appearance.homeSectionsOrder || []).includes(section.id)).length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">Todos os elementos disponíveis já foram adicionados.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO e Meta Tags</CardTitle>
                <CardDescription>
                  Configure informações para motores de busca
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input
                    id="meta-title"
                    value={settings.appearance.metaTitle}
                    onChange={(e) => handleChange("appearance", "metaTitle", e.target.value)}
                    placeholder="Título exibido nos resultados de busca"
                  />
                  <p className="text-sm text-gray-500">
                    Título da página exibido nos resultados de busca (recomendado: 50-60 caracteres)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <Textarea
                    id="meta-description"
                    value={settings.appearance.metaDescription}
                    onChange={(e) => handleChange("appearance", "metaDescription", e.target.value)}
                    rows={3}
                    placeholder="Descrição exibida nos resultados de busca"
                  />
                  <p className="text-sm text-gray-500">
                    Descrição da página exibida nos resultados de busca (recomendado: 150-160 caracteres)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meta-keywords">Meta Keywords</Label>
                  <Input
                    id="meta-keywords"
                    value={settings.appearance.metaKeywords}
                    onChange={(e) => handleChange("appearance", "metaKeywords", e.target.value)}
                    placeholder="palavra1, palavra2, palavra3"
                  />
                  <p className="text-sm text-gray-500">
                    Palavras-chave separadas por vírgula (opcional, menos importante para SEO moderno)
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