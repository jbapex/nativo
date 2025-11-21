import React, { useState, useEffect } from "react";
import { Category } from "@/api/entities";
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
import { Tags, Plus, Search, GripVertical, AlertCircle, CheckCircle, Pencil, Trash2 } from "lucide-react";
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
    </AdminLayout>
  );
}