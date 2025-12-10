import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, MapPin, Tag, ArrowDownUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';


export default function SearchBar({ value, onChange, onCategoryChange, selectedCategory, categories = [], onSearch, appearanceSettings = {} }) {
  const [priceRange, setPriceRange] = React.useState([0, 1000]);
  const [orderBy, setOrderBy] = React.useState("relevance");
  const [showVerifiedOnly, setShowVerifiedOnly] = React.useState(false);
  const [locationFilter, setLocationFilter] = React.useState("todos");
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);


  // TODO: Futura integração com LLM/IA
  // Esta função será expandida para usar IA para entender a intenção do usuário
  // e identificar o que o cliente realmente quer buscar
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    } else {
      // Busca padrão - será substituída por busca com IA
      onChange(value);
    }
  };

  // TODO: Função para processar busca com IA
  // Esta função será implementada para:
  // 1. Analisar a query do usuário usando LLM
  // 2. Identificar intenção (buscar produto, loja, categoria, etc)
  // 3. Extrair parâmetros relevantes (preço, características, etc)
  // 4. Retornar resultados inteligentes baseados na intenção
  const processSearchWithAI = async (query) => {
    // Placeholder para futura implementação
    // Exemplo de como será:
    // const aiResponse = await fetch('/api/ai/search', {
    //   method: 'POST',
    //   body: JSON.stringify({ query, context: { categories, location } })
    // });
    // const { intent, extractedParams, suggestions } = await aiResponse.json();
    // return { intent, extractedParams, suggestions };
    return null;
  };

  const categoryItems = [
    { value: "todos", label: "Todas Categorias" },
    ...(categories?.map(cat => ({ value: cat.slug || `category-${cat.id}`, label: cat.name })) || []),
  ];

  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSearchSubmit}>
        {/* Card de Busca Personalizado */}
        <div 
          className="rounded-2xl shadow-lg border-2 transition-all duration-300"
          style={{
            backgroundColor: appearanceSettings?.cardBackgroundColor || '#ffffff',
            borderColor: isFocused 
              ? (appearanceSettings?.inputFocusColor || '#2563eb')
              : (appearanceSettings?.cardBorderColor || '#e3f2fd'),
            boxShadow: isFocused 
              ? `0 20px 25px -5px ${appearanceSettings?.cardShadowColor || 'rgba(0, 0, 0, 0.1)'}, 0 10px 10px -5px ${appearanceSettings?.cardShadowColor || 'rgba(0, 0, 0, 0.05)'}, 0 0 0 4px ${appearanceSettings?.focusRingColor || '#2563eb'}20`
              : `0 4px 6px -1px ${appearanceSettings?.cardShadowColor || 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Campo de Busca Principal */}
              <div className="relative flex-1 w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Search 
                    className="w-6 h-6 transition-colors duration-300"
                    style={{
                      color: isFocused 
                        ? (appearanceSettings?.inputFocusColor || '#2563eb')
                        : (appearanceSettings?.textSecondaryColor || '#9ca3af')
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produtos, lojas, categorias..."
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(e);
                    }
                  }}
                  className="w-full h-14 pl-14 pr-14 rounded-xl border-2 transition-all duration-300 text-lg focus:outline-none focus:ring-0"
                  style={{
                    backgroundColor: isFocused 
                      ? `${appearanceSettings?.inputBackgroundColor || '#ffffff'}80`
                      : (appearanceSettings?.inputBackgroundColor || '#f9fafb'),
                    borderColor: isFocused 
                      ? (appearanceSettings?.inputFocusColor || '#2563eb')
                      : 'transparent',
                    color: appearanceSettings?.textColor || '#1f2937',
                    outlineColor: isFocused ? (appearanceSettings?.focusRingColor || '#2563eb') : 'transparent'
                  }}
                />
                {value && (
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Botão de Buscar */}
              <Button
                type="submit"
                className="h-14 px-8 text-lg font-semibold rounded-xl transition-all duration-300 text-white shadow-lg hover:shadow-xl w-full lg:w-auto"
                style={{
                  background: `linear-gradient(to right, ${appearanceSettings?.buttonPrimaryColor || '#2563eb'}, ${appearanceSettings?.secondaryColor || '#1d4ed8'})`,
                  color: appearanceSettings?.buttonTextColor || '#ffffff',
                  boxShadow: isFocused 
                    ? `0 10px 15px -3px ${appearanceSettings?.buttonPrimaryColor || '#2563eb'}50`
                    : `0 4px 6px -1px ${appearanceSettings?.cardShadowColor || 'rgba(0, 0, 0, 0.1)'}`
                }}
                onMouseEnter={(e) => {
                  const primary = appearanceSettings?.buttonPrimaryColor || '#2563eb';
                  const secondary = appearanceSettings?.secondaryColor || '#1d4ed8';
                  e.target.style.background = `linear-gradient(to right, ${secondary}, ${primary})`;
                }}
                onMouseLeave={(e) => {
                  const primary = appearanceSettings?.buttonPrimaryColor || '#2563eb';
                  const secondary = appearanceSettings?.secondaryColor || '#1d4ed8';
                  e.target.style.background = `linear-gradient(to right, ${primary}, ${secondary})`;
                }}
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Filtros (mantidos abaixo do card de busca) */}
      <motion.div 
        className="rounded-xl shadow-md p-4 border mt-4"
        style={{
          backgroundColor: appearanceSettings?.cardBackgroundColor || '#ffffff',
          borderColor: appearanceSettings?.cardBorderColor || '#e5e7eb',
          boxShadow: `0 1px 3px 0 ${appearanceSettings?.cardShadowColor || 'rgba(0, 0, 0, 0.1)'}`
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row gap-4">

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger 
            className="w-full sm:w-[200px] h-12"
            style={{
              borderColor: appearanceSettings?.inputBorderColor || '#d1d5db',
              backgroundColor: appearanceSettings?.inputBackgroundColor || '#ffffff'
            }}
          >
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categoryItems.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          className="h-12 gap-2 sm:w-auto w-full transition-colors"
          style={{
            borderColor: appearanceSettings?.inputBorderColor || '#d1d5db',
            color: appearanceSettings?.textColor || '#1f2937'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = appearanceSettings?.hoverColor || 'rgba(37, 99, 235, 0.1)';
            e.target.style.color = appearanceSettings?.linkHoverColor || '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = appearanceSettings?.textColor || '#1f2937';
          }}
        >
          <MapPin 
            className="w-4 h-4" 
            style={{ color: appearanceSettings?.linkColor || '#2563eb' }}
          />
          <span className="hidden sm:inline">Perto de mim</span>
          <span className="sm:hidden">Localização</span>
        </Button>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto h-12 transition-colors"
              style={{
                borderColor: appearanceSettings?.inputBorderColor || '#d1d5db',
                color: appearanceSettings?.textColor || '#1f2937'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = appearanceSettings?.hoverColor || 'rgba(37, 99, 235, 0.1)';
                e.target.style.color = appearanceSettings?.linkHoverColor || '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = appearanceSettings?.textColor || '#1f2937';
              }}
            >
              <SlidersHorizontal 
                className="w-4 h-4 mr-2" 
                style={{ color: appearanceSettings?.linkColor || '#2563eb' }}
              />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-xl flex items-center">
                <SlidersHorizontal 
                  className="w-5 h-5 mr-2" 
                  style={{ color: appearanceSettings?.linkColor || '#2563eb' }}
                />
                Filtros Avançados
              </SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-8">
              <div>
                <h3 className="text-sm font-medium mb-4 flex items-center">
                  <Tag 
                    className="w-4 h-4 mr-2" 
                    style={{ color: appearanceSettings?.linkColor || '#2563eb' }}
                  />
                  Faixa de Preço
                </h3>
                <Slider
                  value={priceRange}
                  min={0}
                  max={1000}
                  step={10}
                  onValueChange={setPriceRange}
                  className="mt-6"
                />
                <div className="flex justify-between mt-2 text-sm">
                  <Badge 
                    variant="outline"
                    style={{
                      backgroundColor: appearanceSettings?.hoverColor || 'rgba(37, 99, 235, 0.1)',
                      color: appearanceSettings?.linkColor || '#2563eb',
                      borderColor: appearanceSettings?.cardBorderColor || '#e5e7eb'
                    }}
                  >
                    R$ {priceRange[0]}
                  </Badge>
                  <Badge 
                    variant="outline"
                    style={{
                      backgroundColor: appearanceSettings?.hoverColor || 'rgba(37, 99, 235, 0.1)',
                      color: appearanceSettings?.linkColor || '#2563eb',
                      borderColor: appearanceSettings?.cardBorderColor || '#e5e7eb'
                    }}
                  >
                    R$ {priceRange[1]}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <ArrowDownUp 
                    className="w-4 h-4 mr-2" 
                    style={{ color: appearanceSettings?.linkColor || '#2563eb' }}
                  />
                  Ordenar por
                </h3>
                <Select value={orderBy} onValueChange={setOrderBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="price_asc">Menor Preço</SelectItem>
                    <SelectItem value="price_desc">Maior Preço</SelectItem>
                    <SelectItem value="newest">Mais Recentes</SelectItem>
                    <SelectItem value="popular">Mais Populares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <MapPin 
                    className="w-4 h-4 mr-2" 
                    style={{ color: appearanceSettings?.linkColor || '#2563eb' }}
                  />
                  Localização
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {["Próximo", "Minha cidade", "Meu estado", "Nacional"].map((location) => (
                    <Button 
                      key={location}
                      variant={locationFilter === location.toLowerCase() ? "default" : "outline"}
                      size="sm"
                      style={locationFilter === location.toLowerCase() ? {
                        backgroundColor: appearanceSettings?.buttonPrimaryColor || '#2563eb',
                        color: appearanceSettings?.buttonTextColor || '#ffffff',
                        borderColor: appearanceSettings?.buttonPrimaryColor || '#2563eb'
                      } : {
                        borderColor: appearanceSettings?.inputBorderColor || '#d1d5db',
                        color: appearanceSettings?.textColor || '#1f2937'
                      }}
                      onClick={() => setLocationFilter(location.toLowerCase())}
                      onMouseEnter={(e) => {
                        if (locationFilter !== location.toLowerCase()) {
                          e.target.style.backgroundColor = appearanceSettings?.hoverColor || 'rgba(37, 99, 235, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (locationFilter !== location.toLowerCase()) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {location}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="verified-only" className="text-sm font-medium flex items-center cursor-pointer">
                  <Badge 
                    className="mr-2 font-normal"
                    style={{
                      backgroundColor: appearanceSettings?.hoverColor || 'rgba(37, 99, 235, 0.1)',
                      color: appearanceSettings?.linkColor || '#2563eb'
                    }}
                  >
                    Verificado
                  </Badge>
                  Apenas Lojas Verificadas
                </Label>
                <Switch
                  id="verified-only"
                  checked={showVerifiedOnly}
                  onCheckedChange={setShowVerifiedOnly}
                />
              </div>
              
              <div className="pt-4 flex gap-2 justify-end border-t">
                <Button variant="outline" onClick={() => {
                  setPriceRange([0, 1000]);
                  setOrderBy("relevance");
                  setShowVerifiedOnly(false);
                  setLocationFilter("todos");
                }}>
                  Limpar Filtros
                </Button>
                <Button onClick={() => setIsSheetOpen(false)}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </motion.div>
    </motion.div>
  );
}