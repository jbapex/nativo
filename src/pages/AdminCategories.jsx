import React, { useState, useEffect } from "react";
import { Category } from "@/api/entities";
import { CategoryAttributes } from "@/api/apiClient";
import AdminLayout from "../components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tags, Plus, Search, GripVertical, AlertCircle, CheckCircle, Pencil, Trash2, Settings } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Alert, AlertDescription } from "@/components/ui/alert";

const ICONS = [
  "Shirt", "ShoppingBag", "Footprints", "Crown", "Home", "Smartphone", 
  "Book", "Gamepad2", "Dumbbell", "Sparkles", "Car", "Pizza"
];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para gerenciar atributos
  const [attributesDialogOpen, setAttributesDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [attributeFormData, setAttributeFormData] = useState({
    name: "",
    label: "",
    type: "text",
    options: "",
    is_filterable: true,
    is_required: false,
    order_index: 0
  });
  const [isEditingAttribute, setIsEditingAttribute] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    parent_id: null,
    active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await Category.list();
      setCategories(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setError("Erro ao carregar categorias. Por favor, tente novamente.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');

      if (isEditing) {
        await Category.update(formData.id, {
          ...formData,
          slug
        });
        setSuccess("Categoria atualizada com sucesso!");
      } else {
        await Category.create({
          ...formData,
          slug,
          order: categories.length
        });
        setSuccess("Categoria criada com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      loadCategories();

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      setError("Erro ao salvar categoria. Verifique os dados e tente novamente.");
    }
  };

  const handleEdit = (category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      parent_id: category.parent_id,
      active: category.active
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await Category.delete(categoryToDelete.id);
      setSuccess("Categoria excluída com sucesso!");
      loadCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      setError("Erro ao excluir categoria. Tente novamente.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "",
      parent_id: null,
      active: true
    });
    setIsEditing(false);
  };

  // Funções para gerenciar atributos
  const handleManageAttributes = async (category) => {
    setSelectedCategory(category);
    setAttributesDialogOpen(true);
    await loadCategoryAttributes(category.id);
  };

  const loadCategoryAttributes = async (categoryId) => {
    try {
      const attrs = await CategoryAttributes.listByCategory(categoryId);
      setCategoryAttributes(attrs || []);
    } catch (error) {
      console.error("Erro ao carregar atributos:", error);
      setError("Erro ao carregar atributos da categoria");
    }
  };

  const handleAttributeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      console.error("❌ Nenhuma categoria selecionada");
      setError("Nenhuma categoria selecionada");
      return;
    }

    try {
      console.log("📝 Dados do formulário:", attributeFormData);
      
      const optionsValue = attributeFormData.options 
        ? (attributeFormData.type === 'select' || attributeFormData.type === 'multi-select'
            ? JSON.stringify(attributeFormData.options.split(',').map(opt => opt.trim()).filter(opt => opt))
            : null)
        : null;

      const attributeData = {
        category_id: selectedCategory.id,
        name: attributeFormData.name.toLowerCase().replace(/\s+/g, '_'),
        label: attributeFormData.label || attributeFormData.name,
        type: attributeFormData.type,
        options: optionsValue,
        is_filterable: attributeFormData.is_filterable,
        is_required: attributeFormData.is_required,
        order_index: attributeFormData.order_index || categoryAttributes.length
      };

      console.log("📤 Dados sendo enviados:", attributeData);

      if (isEditingAttribute) {
        console.log("🔄 Atualizando atributo:", attributeFormData.id);
        await CategoryAttributes.update(attributeFormData.id, attributeData);
        setSuccess("Atributo atualizado com sucesso!");
      } else {
        console.log("➕ Criando novo atributo");
        const created = await CategoryAttributes.create(attributeData);
        console.log("✅ Atributo criado:", created);
        setSuccess("Atributo criado com sucesso!");
      }

      await loadCategoryAttributes(selectedCategory.id);
      resetAttributeForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("❌ Erro ao salvar atributo:", error);
      console.error("Detalhes do erro:", error.details || error.message);
      setError(`Erro ao salvar atributo: ${error.message || "Verifique os dados."}`);
    }
  };

  const handleEditAttribute = (attr) => {
    const optionsStr = attr.options 
      ? (typeof attr.options === 'string' ? JSON.parse(attr.options) : attr.options).join(', ')
      : '';
    
    setAttributeFormData({
      id: attr.id,
      name: attr.name,
      label: attr.label || attr.name,
      type: attr.type,
      options: optionsStr,
      is_filterable: attr.is_filterable,
      is_required: attr.is_required,
      order_index: attr.order_index || 0
    });
    setIsEditingAttribute(true);
  };

  const handleDeleteAttribute = async () => {
    if (!attributeToDelete) return;
    try {
      await CategoryAttributes.remove(attributeToDelete.id);
      setSuccess("Atributo excluído com sucesso!");
      await loadCategoryAttributes(selectedCategory.id);
      setAttributeToDelete(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao excluir atributo:", error);
      setError("Erro ao excluir atributo");
    }
  };

  const resetAttributeForm = () => {
    setAttributeFormData({
      name: "",
      label: "",
      type: "text",
      options: "",
      is_filterable: true,
      is_required: false,
      order_index: 0
    });
    setIsEditingAttribute(false);
  };

  const toggleStatus = async (category) => {
    try {
      await Category.update(category.id, { active: !category.active });
      loadCategories();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setError("Erro ao atualizar status. Tente novamente.");
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCategories(items);

    try {
      await Promise.all(
        items.map((item, index) =>
          Category.update(item.id, { order: index })
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      loadCategories();
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Tags className="w-6 h-6" />
              Categorias
            </h1>
            <Button onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar categorias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead style={{ width: 50 }}></TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredCategories.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              Nenhuma categoria encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCategories.map((category, index) => (
                            <Draggable
                              key={category.id}
                              draggableId={category.id}
                              index={index}
                            >
                              {(provided) => (
                                <TableRow
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                >
                                  <TableCell>
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {category.name}
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate">
                                    {category.description}
                                  </TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={category.active}
                                      onCheckedChange={() => toggleStatus(category)}
                                    />
                                  </TableCell>
                                  <TableCell>{category.products_count || 0}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleManageAttributes(category)}
                                        title="Gerenciar atributos"
                                      >
                                        <Settings className="w-4 h-4 mr-1" />
                                        Atributos
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEdit(category)}
                                      >
                                        <Pencil className="w-4 h-4 mr-1" />
                                        Editar
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDelete(category)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Excluir
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Categoria</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ícone</label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ícone" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria Pai (opcional)</label>
                <Select
                  value={formData.parent_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria pai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {categories
                      .filter(c => !c.parent_id && (!isEditing || c.id !== formData.id))
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                resetForm();
                setDialogOpen(false);
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Atualizar" : "Criar"}
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
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de gerenciamento de atributos */}
      <Dialog open={attributesDialogOpen} onOpenChange={(open) => {
        if (!open) {
          resetAttributeForm();
          setSelectedCategory(null);
          setCategoryAttributes([]);
        }
        setAttributesDialogOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Atributos - {selectedCategory?.name}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Configure os atributos que aparecerão no formulário de cadastro de produtos desta categoria.
            </p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Formulário de atributo */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-4">
                {isEditingAttribute ? "Editar Atributo" : "Novo Atributo"}
              </h3>
              <form onSubmit={handleAttributeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome Técnico*</label>
                    <Input
                      required
                      value={attributeFormData.name}
                      onChange={(e) => setAttributeFormData({ ...attributeFormData, name: e.target.value })}
                      placeholder="ex: tamanho, ano, marca"
                    />
                    <p className="text-xs text-gray-500 mt-1">Sem espaços, use underscore (_)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rótulo (Label)*</label>
                    <Input
                      required
                      value={attributeFormData.label}
                      onChange={(e) => setAttributeFormData({ ...attributeFormData, label: e.target.value })}
                      placeholder="ex: Tamanho, Ano, Marca"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo*</label>
                    <Select
                      value={attributeFormData.type}
                      onValueChange={(value) => setAttributeFormData({ ...attributeFormData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="select">Seleção (Select)</SelectItem>
                        <SelectItem value="multi-select">Múltipla Seleção</SelectItem>
                        <SelectItem value="range">Faixa (Range)</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ordem</label>
                    <Input
                      type="number"
                      value={attributeFormData.order_index}
                      onChange={(e) => setAttributeFormData({ ...attributeFormData, order_index: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {(attributeFormData.type === 'select' || attributeFormData.type === 'multi-select') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Opções (separadas por vírgula)*</label>
                    <Input
                      required
                      value={attributeFormData.options}
                      onChange={(e) => setAttributeFormData({ ...attributeFormData, options: e.target.value })}
                      placeholder="ex: P, M, G, GG ou 2018, 2019, 2020"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separe as opções com vírgula</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={attributeFormData.is_filterable}
                      onCheckedChange={(checked) => setAttributeFormData({ ...attributeFormData, is_filterable: checked })}
                    />
                    <label className="text-sm">Aparecer nos filtros laterais</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={attributeFormData.is_required}
                      onCheckedChange={(checked) => setAttributeFormData({ ...attributeFormData, is_required: checked })}
                    />
                    <label className="text-sm">Obrigatório no cadastro</label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {isEditingAttribute ? "Atualizar" : "Criar"} Atributo
                  </Button>
                  {isEditingAttribute && (
                    <Button type="button" variant="outline" onClick={resetAttributeForm}>
                      Cancelar Edição
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista de atributos existentes */}
            <div>
              <h3 className="font-semibold mb-4">Atributos Cadastrados ({categoryAttributes.length})</h3>
              {categoryAttributes.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum atributo cadastrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {categoryAttributes.map((attr) => (
                    <div key={attr.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{attr.label || attr.name}</div>
                        <div className="text-sm text-gray-500">
                          Tipo: {attr.type} | 
                          {attr.is_filterable ? " Filtro: Sim" : " Filtro: Não"} | 
                          {attr.is_required ? " Obrigatório: Sim" : " Obrigatório: Não"}
                        </div>
                        {attr.options && (
                          <div className="text-xs text-gray-400 mt-1">
                            Opções: {typeof attr.options === 'string' ? JSON.parse(attr.options).join(', ') : attr.options.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAttribute(attr)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAttributeToDelete(attr)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAttributesDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão de atributo */}
      <AlertDialog open={!!attributeToDelete} onOpenChange={(open) => {
        if (!open) setAttributeToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o atributo "{attributeToDelete?.label || attributeToDelete?.name}"?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAttributeToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAttribute}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}