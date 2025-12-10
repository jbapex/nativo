import React, { useEffect, useMemo, useState } from "react";
import { CampaignParticipations } from "@/api/apiClient";
import { Product } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Star, Users, Percent, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function StoreCampaignsPage({ store, products = [] }) {
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignError, setCampaignError] = useState(null);

  const [storeProducts, setStoreProducts] = useState(products);
  const [loadingProducts, setLoadingProducts] = useState(!products || products.length === 0);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [participationFeedback, setParticipationFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (!products || products.length === 0) {
      fetchProducts();
    } else {
      setStoreProducts(products);
      setLoadingProducts(false);
    }
  }, [products]);

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      setCampaignError(null);
      const data = await CampaignParticipations.getAvailable();
      setAvailableCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      setCampaignError(error.message || "Não foi possível carregar campanhas disponíveis.");
      setAvailableCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchProducts = async () => {
    if (!store?.id) return;
    try {
      setLoadingProducts(true);
      const allProducts = await Product.list();
      const filtered = (allProducts || []).filter(
        (product) => product.store_id === store.id
      );
      setStoreProducts(filtered);
    } catch (error) {
      console.error("Erro ao carregar produtos da loja:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const openParticipationModal = (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedProducts([]);
    setDiscountType("percent");
    setDiscountValue("");
    setParticipationFeedback(null);
    setModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return storeProducts;
    return storeProducts.filter((product) =>
      product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [storeProducts, productSearch]);

  const toggleProductSelection = (productId) => {
    setParticipationFeedback(null);
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const submitParticipation = async () => {
    if (!selectedCampaign) return;
    if (selectedProducts.length === 0) {
      setParticipationFeedback({ type: "error", message: "Selecione ao menos um produto." });
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      setParticipationFeedback({ type: "error", message: "Informe um valor de desconto válido." });
      return;
    }

    const payload = {
      campaign_id: selectedCampaign.id,
      product_ids: selectedProducts,
      discount_percent: discountType === "percent" ? Number(discountValue) : null,
      discount_fixed: discountType === "fixed" ? Number(discountValue) : null,
    };

    try {
      setSubmitting(true);
      const response = await CampaignParticipations.participate(payload);
      setParticipationFeedback({
        type: "success",
        message: response?.message || "Produtos enviados para a campanha.",
        details: response?.errors,
      });
      setSelectedProducts([]);
      setDiscountValue("");
      await loadCampaigns();
    } catch (error) {
      console.error("Erro ao participar da campanha:", error);
      setParticipationFeedback({
        type: "error",
        message: error.message || "Não foi possível enviar os produtos.",
        details: error.details || error.response?.data?.details,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (campaign) => {
    if (!campaign) return null;
    const now = new Date();
    const starts = new Date(campaign.start_date);
    const ends = new Date(campaign.end_date);

    if (now < starts) {
      return <Badge variant="outline">Agendada</Badge>;
    }
    if (now > ends) {
      return <Badge variant="secondary">Encerrada</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campanhas do Marketplace</h1>
            <p className="text-sm text-gray-600">
              Participe de campanhas promocionais para destacar seus produtos e aumentar suas vendas.
            </p>
          </div>
        </div>
      </div>

      {campaignError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{campaignError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campanhas Disponíveis</CardTitle>
              <p className="text-sm text-gray-500">
                {loadingCampaigns
                  ? "Carregando campanhas..."
                  : availableCampaigns.length === 0
                    ? "Nenhuma campanha disponível no momento."
                    : `${availableCampaigns.length} campanha(s) ativa(s) agora.`}
              </p>
            </div>
            <Button variant="outline" onClick={loadCampaigns} disabled={loadingCampaigns}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCampaigns ? (
            <p className="text-sm text-gray-500">Carregando campanhas...</p>
          ) : availableCampaigns.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              <Megaphone className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p>Nenhuma campanha disponível para participação agora.</p>
            </div>
          ) : (
            availableCampaigns.map((campaign) => (
              <Card key={campaign.id} className="border border-gray-100 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        {campaign.featured ? (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Star className="w-3 h-3 mr-1" />
                            Destaque
                          </Badge>
                        ) : null}
                        {statusBadge(campaign)}
                      </div>
                      <p className="text-sm text-gray-600">{campaign.description || "Campanha promocional da plataforma."}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => openParticipationModal(campaign)}>
                        Participar
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-600" />
                      <span>
                        <strong>Desconto mínimo:</strong> {campaign.min_discount_percent || 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>
                        <strong>Participações da sua loja:</strong> {campaign.my_participations || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString("pt-BR")} até{" "}
                        {new Date(campaign.end_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Participar da campanha {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              Selecione os produtos e o desconto que deseja aplicar durante a campanha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedCampaign?.requires_approval && (
              <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Esta campanha exige aprovação do administrador antes dos produtos ficarem visíveis para os clientes.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de desconto</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={discountType === "percent" ? "default" : "outline"}
                    onClick={() => setDiscountType("percent")}
                  >
                    Percentual (%)
                  </Button>
                  <Button
                    type="button"
                    variant={discountType === "fixed" ? "default" : "outline"}
                    onClick={() => setDiscountType("fixed")}
                  >
                    Valor fixo (R$)
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Valor do desconto {discountType === "percent" ? "(%)" : "(R$)"}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "Ex: 15" : "Ex: 10,00"}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Produtos da sua loja</h4>
                  <p className="text-xs text-gray-500">
                    Selecione os produtos que deseja incluir nesta campanha.
                  </p>
                </div>
                <Input
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="border rounded-md max-h-64 overflow-y-auto divide-y">
                {loadingProducts ? (
                  <p className="text-sm text-gray-500 p-4">Carregando produtos...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4">
                    Nenhum produto encontrado {productSearch ? "para este filtro." : "na sua loja."}
                  </p>
                ) : (
                  filteredProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          R$ {Number(product.price || 0).toFixed(2)} {product.category_name ? `• ${product.category_name}` : ""}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {participationFeedback && (
              <Alert variant={participationFeedback.type === "success" ? "default" : "destructive"}>
                {participationFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <AlertDescription className="space-y-1">
                  <div>{participationFeedback.message}</div>
                  {participationFeedback.details && Array.isArray(participationFeedback.details) && (
                    <ul className="list-disc pl-4 text-xs">
                      {participationFeedback.details.map((msg, index) => (
                        <li key={index}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={submitParticipation} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar produtos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

