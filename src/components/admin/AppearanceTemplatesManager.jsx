import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppearanceTemplates } from '@/api/appearanceTemplates';
import { Palette, Save, Trash2, Eye, Plus, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AppearanceTemplatesManager({ currentSettings, onApplyTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'default',
    is_public: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await AppearanceTemplates.list();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    try {
      setSaving(true);
      
      // Criar template a partir das configurações atuais
      const templateData = {
        ...newTemplate,
        primary_color: currentSettings?.appearance?.primaryColor || '#2563eb',
        secondary_color: currentSettings?.appearance?.secondaryColor || '#06b6d4',
        accent_color: currentSettings?.appearance?.accentColor || '#10b981',
        background_color: currentSettings?.appearance?.backgroundColor || '#ffffff',
        text_color: currentSettings?.appearance?.textColor || '#1f2937',
        header_color: currentSettings?.appearance?.headerColor || '#ffffff',
        footer_color: currentSettings?.appearance?.footerColor || '#f9fafb',
        button_primary_color: currentSettings?.appearance?.buttonPrimaryColor || '#2563eb',
        button_secondary_color: currentSettings?.appearance?.buttonSecondaryColor || '#06b6d4',
        button_text_color: currentSettings?.appearance?.buttonTextColor || '#ffffff',
        link_color: currentSettings?.appearance?.linkColor || '#2563eb',
        link_hover_color: currentSettings?.appearance?.linkHoverColor || '#1d4ed8',
        card_background_color: currentSettings?.appearance?.cardBackgroundColor || '#ffffff',
        card_border_color: currentSettings?.appearance?.cardBorderColor || '#e5e7eb',
        card_shadow_color: currentSettings?.appearance?.cardShadowColor || 'rgba(0, 0, 0, 0.1)',
        input_background_color: currentSettings?.appearance?.inputBackgroundColor || '#ffffff',
        input_border_color: currentSettings?.appearance?.inputBorderColor || '#d1d5db',
        input_focus_color: currentSettings?.appearance?.inputFocusColor || '#2563eb',
        layout_style: currentSettings?.appearance?.layoutStyle || 'modern',
        logo: currentSettings?.appearance?.logo || '',
        favicon: currentSettings?.appearance?.favicon || '',
        hero_title: currentSettings?.appearance?.heroTitle || '',
        hero_subtitle: currentSettings?.appearance?.heroSubtitle || '',
        hero_image: currentSettings?.appearance?.heroImage || '',
      };

      await AppearanceTemplates.create(templateData);
      toast.success('Template salvo com sucesso!');
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: '', description: '', category: 'default', is_public: true });
      loadTemplates();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (templateId) => {
    try {
      setApplying(templateId);
      const template = await AppearanceTemplates.apply(templateId);
      
      // Converter template para formato de settings
      const settingsUpdate = {
        appearance: {
          primaryColor: template.primary_color,
          secondaryColor: template.secondary_color,
          accentColor: template.accent_color,
          backgroundColor: template.background_color,
          textColor: template.text_color,
          headerColor: template.header_color,
          footerColor: template.footer_color,
          buttonPrimaryColor: template.button_primary_color,
          buttonSecondaryColor: template.button_secondary_color,
          buttonTextColor: template.button_text_color,
          linkColor: template.link_color,
          linkHoverColor: template.link_hover_color,
          cardBackgroundColor: template.card_background_color,
          cardBorderColor: template.card_border_color,
          cardShadowColor: template.card_shadow_color,
          inputBackgroundColor: template.input_background_color,
          inputBorderColor: template.input_border_color,
          inputFocusColor: template.input_focus_color,
          layoutStyle: template.layout_style,
          logo: template.logo || '',
          favicon: template.favicon || '',
          heroTitle: template.hero_title || '',
          heroSubtitle: template.hero_subtitle || '',
          heroImage: template.hero_image || '',
        }
      };

      if (onApplyTemplate) {
        onApplyTemplate(settingsUpdate);
      }
      
      toast.success(`Template "${template.name}" aplicado com sucesso!`);
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast.error('Erro ao aplicar template');
    } finally {
      setApplying(null);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await AppearanceTemplates.delete(templateId);
      toast.success('Template deletado com sucesso!');
      setDeleteConfirm(null);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      toast.error(error.message || 'Erro ao deletar template');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      default: 'Padrão',
      dark: 'Escuro',
      colorful: 'Colorido',
      minimal: 'Minimalista',
      custom: 'Personalizado'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      default: 'bg-blue-100 text-blue-800',
      dark: 'bg-gray-800 text-gray-100',
      colorful: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
      minimal: 'bg-gray-100 text-gray-800',
      custom: 'bg-green-100 text-green-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Aparência</h3>
          <p className="text-sm text-muted-foreground">
            Salve e reutilize modelos de aparência para o site
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Salvar Template Atual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Template de Aparência</DialogTitle>
              <DialogDescription>
                Salve as configurações atuais de aparência como um template reutilizável
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="template-name">Nome do Template *</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Ex: Tema Azul Moderno"
                />
              </div>
              <div>
                <Label htmlFor="template-description">Descrição</Label>
                <Textarea
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Descreva o template..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="template-category">Categoria</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="colorful">Colorido</SelectItem>
                    <SelectItem value="minimal">Minimalista</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum template salvo ainda</p>
              <p className="text-sm text-muted-foreground mt-2">
                Salve suas configurações de aparência como templates para reutilizar depois
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    )}
                  </div>
                  {template.is_default && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Padrão
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(template.category)}`}>
                      {getCategoryLabel(template.category)}
                    </span>
                    {template.usage_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {template.usage_count} uso{template.usage_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Preview de cores */}
                  <div className="flex gap-1 h-8 rounded overflow-hidden">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.primary_color }}
                      title="Cor primária"
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.secondary_color }}
                      title="Cor secundária"
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.accent_color }}
                      title="Cor de destaque"
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: template.background_color }}
                      title="Cor de fundo"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApplyTemplate(template.id)}
                      disabled={applying === template.id}
                    >
                      {applying === template.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-2" />
                          Aplicar
                        </>
                      )}
                    </Button>
                    {!template.is_default && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteConfirm(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar este template? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteTemplate(deleteConfirm)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

