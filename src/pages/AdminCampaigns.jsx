import React, { useState, useEffect } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, Users, Package, Upload as UploadIcon, Image as ImageIcon, Megaphone, Store as StoreIcon, Percent, ShoppingBag, LayoutGrid } from "lucide-react";
import { MarketplaceCampaigns, CampaignParticipations } from "@/api/apiClient";
import { UploadFile } from "@/api/integrations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/api/entities";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [categories, setCategories] = useState([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingPageBanner, setUploadingPageBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);
  const [participationError, setParticipationError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "00:00",
    end_time: "23:59",
    min_discount_percent: 10,
    max_products_per_store: "",
    allowed_categories: [],
    requires_approval: false,
    banner_image: "", // Banner do home (1200x110px)
    banner_page_image: "", // Banner da página da campanha (maior)
    banner_text: "",
    badge_text: "EM PROMOÇÃO",
    badge_color: "#EF4444",
    featured: false,
    active: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      if (userData.role !== "admin") {
        navigate(createPageUrl("Home"));
        return;
      }
      setIsAuthorized(true);
      loadCampaigns();
      loadCategories();
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      navigate(createPageUrl("AdminLogin"));
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(""); // Limpar erro anterior
      console.log("🔄 Carregando campanhas...");
      const data = await MarketplaceCampaigns.list();
      console.log("✅ Campanhas carregadas:", data);
      if (data && data.length > 0) {
        console.log("🔍 Primeira campanha completa:", data[0]);
        console.log("🖼️ banner_image da primeira:", data[0].banner_image);
        console.log("🖼️ banner_page_image da primeira:", data[0].banner_page_image);
        console.log("📋 Todas as chaves da primeira campanha:", Object.keys(data[0]));
        // Verificar se banner_page_image existe mesmo que seja null/undefined
        console.log("🔍 banner_page_image existe?", 'banner_page_image' in data[0]);
        console.log("🔍 banner_page_image valor:", data[0].banner_page_image);
      }
      
      if (Array.isArray(data)) {
        setCampaigns(data);
        if (data.length === 0) {
          console.log("ℹ️ Nenhuma campanha encontrada");
        }
      } else {
        console.warn("⚠️ Resposta não é um array:", data);
        setCampaigns([]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar campanhas:", error);
      console.error("Detalhes do erro:", {
        message: error.message,
        status: error.status,
        response: error.response?.data
      });
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || "Erro ao carregar campanhas";
      
      // Se for erro de autenticação, não mostrar erro genérico
      if (errorMessage.includes('Token') || errorMessage.includes('autenticado') || errorMessage.includes('401') || errorMessage.includes('403')) {
        setError("Você precisa estar autenticado como admin para acessar esta página");
      } else {
        setError(errorMessage);
      }
      
      // Em caso de erro, definir array vazio para não quebrar a interface
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await Category.list();
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // Validações
      if (!formData.name.trim()) {
        setError("Nome da campanha é obrigatório");
        setSubmitting(false);
        return;
      }

      if (!formData.start_date || !formData.end_date) {
        setError("Datas de início e término são obrigatórias");
        setSubmitting(false);
        return;
      }

      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:59`;

      if (new Date(startDateTime) >= new Date(endDateTime)) {
        setError("Data de término deve ser posterior à data de início");
        setSubmitting(false);
        return;
      }

      // Garantir que min_discount_percent seja um número válido
      const minDiscount = parseFloat(formData.min_discount_percent);
      if (isNaN(minDiscount) || minDiscount < 0 || minDiscount > 100) {
        setError("Desconto mínimo deve ser um número entre 0 e 100");
        setSubmitting(false);
        return;
      }

      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: startDateTime,
        end_date: endDateTime,
        min_discount_percent: minDiscount,
        max_products_per_store: formData.max_products_per_store && formData.max_products_per_store.trim() !== "" 
          ? parseInt(formData.max_products_per_store) 
          : null,
        allowed_categories: formData.allowed_categories && formData.allowed_categories.length > 0 
          ? formData.allowed_categories 
          : null,
        requires_approval: formData.requires_approval || false,
        banner_image: formData.banner_image && formData.banner_image.trim() !== "" 
          ? formData.banner_image.trim() 
          : null,
        banner_page_image: formData.banner_page_image && formData.banner_page_image.trim() !== "" 
          ? formData.banner_page_image.trim() 
          : null,
        banner_text: formData.banner_text && formData.banner_text.trim() !== "" 
          ? formData.banner_text.trim() 
          : null,
        badge_text: formData.badge_text && formData.badge_text.trim() !== "" 
          ? formData.badge_text.trim() 
          : "EM PROMOÇÃO",
        badge_color: formData.badge_color || "#EF4444",
        featured: formData.featured || false,
        active: formData.active !== undefined ? formData.active : true
      };

      console.log("💾 Salvando campanha...", campaignData);
      console.log("📤 Dados sendo enviados:", JSON.stringify(campaignData, null, 2));
      
      let result;
      if (editingCampaign) {
        console.log("✏️ Atualizando campanha:", editingCampaign.id);
        result = await MarketplaceCampaigns.update(editingCampaign.id, campaignData);
        setSuccess("Campanha atualizada com sucesso!");
      } else {
        console.log("➕ Criando nova campanha");
        result = await MarketplaceCampaigns.create(campaignData);
        setSuccess("Campanha criada com sucesso!");
      }

      console.log("✅ Campanha salva com sucesso!", result);
      
      setShowDialog(false);
      resetForm();
      
      // Aguardar um pouco antes de recarregar para garantir que o backend processou
      setTimeout(() => {
        loadCampaigns();
      }, 500);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("❌ Erro ao salvar campanha:", error);
      console.error("Detalhes completos:", {
        message: error.message,
        status: error.status,
        response: error.response?.data,
        details: error.details,
        originalError: error.originalError
      });
      
      // Verificar se é erro de conexão
      if (error.message.includes('conexão') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        setError("Erro de conexão com o servidor. Verifique se o servidor está rodando.");
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.details || error.details?.error || error.message || "Erro ao salvar campanha";
        setError(errorMessage);
      }
      
      // Não fechar o dialog em caso de erro para o usuário poder corrigir
      // setShowDialog(false);
    } finally {
      setSubmitting(false);
      console.log("🔄 Estado submitting resetado");
    }
  };

  const loadParticipations = async (campaignId) => {
    try {
      setLoadingParticipations(true);
      setParticipationError("");
      const data = await MarketplaceCampaigns.getParticipations(campaignId);
      setParticipations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar participações:", error);
      setParticipationError(error.response?.data?.error || error.message || "Erro ao carregar participações");
      setParticipations([]);
    } finally {
      setLoadingParticipations(false);
    }
  };

  const handleViewParticipations = async (campaign) => {
    setSelectedCampaign(campaign);
    await loadParticipations(campaign.id);
  };

  const handleApproveParticipation = async (participationId, status) => {
    try {
      await CampaignParticipations.updateStatus(participationId, status);
      await loadParticipations(selectedCampaign.id);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setParticipationError(error.response?.data?.error || error.message || "Erro ao atualizar status");
    }
  };

  const handleEdit = (campaign) => {
    console.log('📝 Editando campanha:', campaign);
    console.log('🖼️ banner_image:', campaign.banner_image);
    console.log('🖼️ banner_page_image:', campaign.banner_page_image);
    setEditingCampaign(campaign);
    
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    
    // Garantir que banner_page_image existe, mesmo que seja null/undefined
    const bannerPageImage = campaign.banner_page_image !== undefined 
      ? (campaign.banner_page_image || "") 
      : "";
    
    const formDataToSet = {
      name: campaign.name || "",
      description: campaign.description || "",
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().slice(0, 5),
      end_time: endDate.toTimeString().slice(0, 5),
      min_discount_percent: campaign.min_discount_percent || 10,
      max_products_per_store: campaign.max_products_per_store || "",
      allowed_categories: campaign.allowed_categories || [],
      requires_approval: campaign.requires_approval || false,
      banner_image: campaign.banner_image || "",
      banner_page_image: bannerPageImage,
      banner_text: campaign.banner_text || "",
      badge_text: campaign.badge_text || "EM PROMOÇÃO",
      badge_color: campaign.badge_color || "#EF4444",
      featured: campaign.featured || false,
      active: campaign.active !== false
    };
    
    console.log('📋 FormData após set:', {
      banner_image: formDataToSet.banner_image,
      banner_page_image: formDataToSet.banner_page_image,
      banner_page_image_original: campaign.banner_page_image,
      banner_page_image_undefined: campaign.banner_page_image === undefined,
      banner_page_image_null: campaign.banner_page_image === null,
      banner_page_image_in_object: 'banner_page_image' in campaign
    });
    
    setFormData(formDataToSet);
    setShowDialog(true);
  };

  const handleDelete = async (campaign) => {
    if (!confirm(`Tem certeza que deseja deletar a campanha "${campaign.name}"?`)) {
      return;
    }

    try {
      await MarketplaceCampaigns.delete(campaign.id);
      setSuccess("Campanha deletada com sucesso!");
      loadCampaigns();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao deletar campanha:", error);
      setError(error.message || "Erro ao deletar campanha");
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo: 5MB");
      setTimeout(() => setError(""), 5000);
      e.target.value = '';
      return;
    }

    setUploadingBanner(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, banner_image: file_url }));
      e.target.value = '';
    } catch (error) {
      setError(error.message || "Erro ao fazer upload");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handlePageBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo: 5MB");
      setTimeout(() => setError(""), 5000);
      e.target.value = '';
      return;
    }

    setUploadingPageBanner(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, banner_page_image: file_url }));
      e.target.value = '';
    } catch (error) {
      setError(error.message || "Erro ao fazer upload");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploadingPageBanner(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      start_time: "00:00",
      end_time: "23:59",
      min_discount_percent: 10,
      max_products_per_store: "",
      allowed_categories: [],
    requires_approval: false,
    banner_image: "", // Banner do home (1200x110px)
    banner_page_image: "", // Banner da página da campanha
    banner_text: "",
    badge_text: "EM PROMOÇÃO",
      badge_color: "#EF4444",
      featured: false,
      active: true
    });
  };

  const toggleCategory = (categoryId) => {
    setFormData(prev => {
      const categories = prev.allowed_categories || [];
      if (categories.includes(categoryId)) {
        return { ...prev, allowed_categories: categories.filter(id => id !== categoryId) };
      } else {
        return { ...prev, allowed_categories: [...categories, categoryId] };
      }
    });
  };

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (!campaign.active) return { text: "Desativada", color: "text-gray-500" };
    if (now < start) return { text: "Agendada", color: "text-blue-500" };
    if (now > end) return { text: "Encerrada", color: "text-gray-500" };
    return { text: "Ativa", color: "text-green-500" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campanhas do Marketplace</h1>
            <p className="text-gray-600 mt-1">Gerencie campanhas promocionais (Black Friday, Oferta Relâmpago, etc.)</p>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const status = getCampaignStatus(campaign);
            return (
              <Card key={campaign.id} className="relative">
                {campaign.featured && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                    DESTAQUE
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <span className={`font-medium ${status.color}`}>{status.text}</span>
                    {campaign.active && (
                      <>
                        <span>•</span>
                        <span>{campaign.participant_stores || 0} lojas</span>
                        <span>•</span>
                        <span>{campaign.total_products || 0} produtos</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campaign.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString('pt-BR')} - {new Date(campaign.end_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>Desconto mínimo: {campaign.min_discount_percent}%</span>
                    </div>
                  </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewParticipations(campaign)}
                        className="flex-1"
                      >
                        Ver Participações
                      </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(campaign)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(campaign)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma campanha criada ainda</p>
              <p className="text-sm text-gray-500 mt-2">Crie sua primeira campanha para começar</p>
            </CardContent>
          </Card>
        )}

        {selectedCampaign && (
          <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Participações - {selectedCampaign.name}</h2>
                <p className="text-sm text-gray-500">
                  Aprovar ou rejeitar produtos enviados pelos lojistas para esta campanha.
                </p>
              </div>
              <Button variant="ghost" onClick={() => { setSelectedCampaign(null); setParticipations([]); }}>
                Fechar painel
              </Button>
            </div>

            {participationError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{participationError}</AlertDescription>
              </Alert>
            )}

            {loadingParticipations ? (
              <p className="text-sm text-gray-500">Carregando participações...</p>
            ) : participations.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma participação enviada para esta campanha ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loja
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Desconto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participations.map((participation) => (
                      <tr key={participation.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StoreIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">{participation.store_name || "Loja"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            <span>{participation.product_name || "Produto"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {participation.discount_percent
                            ? `${participation.discount_percent}%`
                            : participation.discount_fixed
                              ? `R$ ${participation.discount_fixed}`
                              : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {participation.status === "approved" ? (
                            <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
                          ) : participation.status === "rejected" ? (
                            <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {participation.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveParticipation(participation.id, "approved")}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleApproveParticipation(participation.id, "rejected")}
                              >
                                Rejeitar
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Atualizado em {new Date(participation.updated_at).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Dialog de Criar/Editar Campanha */}
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
              <DialogDescription>
                {editingCampaign ? "Edite os dados da campanha" : "Crie uma nova campanha promocional do marketplace"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Campanha *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Black Friday 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_discount">Desconto Mínimo (%) *</Label>
                  <Input
                    id="min_discount"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.min_discount_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_discount_percent: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-gray-500">Desconto mínimo obrigatório para participar</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva a campanha..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Hora de Início</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">Hora de Término</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_products">Limite de Produtos por Loja</Label>
                  <Input
                    id="max_products"
                    type="number"
                    min="1"
                    value={formData.max_products_per_store}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_products_per_store: e.target.value }))}
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="badge_color">Cor do Badge</Label>
                  <div className="flex gap-2">
                    <Input
                      id="badge_color"
                      type="color"
                      value={formData.badge_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, badge_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.badge_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, badge_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge_text">Texto do Badge</Label>
                <Input
                  id="badge_text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
                  placeholder="EM PROMOÇÃO"
                />
              </div>

              <div className="space-y-2">
                <Label>Categorias Permitidas</Label>
                <p className="text-xs text-gray-500 mb-2">Deixe vazio para permitir todas as categorias</p>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500">Carregando categorias...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.allowed_categories?.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="rounded"
                          />
                          <span className="text-sm">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_image">Banner do Home (1200x110px)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="banner_image"
                    value={formData.banner_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, banner_image: e.target.value }))}
                    placeholder="URL da imagem ou faça upload"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    id="banner-upload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                    disabled={uploadingBanner}
                  >
                    {uploadingBanner ? (
                      <>
                        <UploadIcon className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                {formData.banner_image && (
                  <div className="w-full border rounded-lg overflow-hidden bg-gray-100" style={{ height: '110px' }}>
                    <img 
                      src={formData.banner_image} 
                      alt="Banner preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500">Tamanho recomendado: 1200x110 pixels</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_page_image">Banner da Página da Campanha</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="banner_page_image"
                    value={formData.banner_page_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, banner_page_image: e.target.value }))}
                    placeholder="URL da imagem ou faça upload"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    id="page-banner-upload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handlePageBannerUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('page-banner-upload')?.click()}
                    disabled={uploadingPageBanner}
                  >
                    {uploadingPageBanner ? (
                      <>
                        <UploadIcon className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                {formData.banner_page_image && (
                  <div className="w-full h-48 border rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={formData.banner_page_image} 
                      alt="Banner da página preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500">Banner maior para a página da campanha</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_text">Texto do Banner</Label>
                <Input
                  id="banner_text"
                  value={formData.banner_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, banner_text: e.target.value }))}
                  placeholder="Ex: Black Friday - Até 70% OFF"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requer Aprovação Manual</Label>
                    <p className="text-sm text-gray-500">Participações precisam ser aprovadas por você</p>
                  </div>
                  <Switch
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Destaque no Home</Label>
                    <p className="text-sm text-gray-500">Aparece em destaque na página inicial</p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativa</Label>
                    <p className="text-sm text-gray-500">Campanha está ativa e visível</p>
                  </div>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setShowDialog(false); resetForm(); }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : (editingCampaign ? "Salvar Alterações" : "Criar Campanha")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

