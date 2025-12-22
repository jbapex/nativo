import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Shirt,
  ShoppingBag,
  Footprints,
  Crown,
  Home,
  Dumbbell,
  Smartphone,
  Sparkles,
  Book,
  Gamepad2,
  HeadphonesIcon,
  Baby,
  Utensils,
  Palette
} from "lucide-react";

const ICON_MAP = {
  "Shirt": Shirt,
  "ShoppingBag": ShoppingBag,
  "Footprints": Footprints,
  "Crown": Crown,
  "Home": Home,
  "Dumbbell": Dumbbell,
  "Smartphone": Smartphone,
  "Sparkles": Sparkles,
  "Book": Book,
  "Gamepad2": Gamepad2,
  "HeadphonesIcon": HeadphonesIcon,
  "Baby": Baby,
  "Utensils": Utensils,
  "Palette": Palette
};

export default function Categories({ onSelect, categories = [], appearanceSettings = {} }) {
  const primaryColor = appearanceSettings?.primaryColor || appearanceSettings?.buttonPrimaryColor || '#2563eb';
  // Fallback to default categories if none provided
  const displayCategories = categories.length > 0 ? 
    categories.slice(0, 12) : 
    [
      { slug: "roupas_femininas", name: "Roupas Femininas", icon: "Shirt", order: 1 },
      { slug: "roupas_masculinas", name: "Roupas Masculinas", icon: "Shirt", order: 2 },
      { slug: "calcados", name: "Calçados", icon: "Footprints", order: 3 },
      { slug: "acessorios", name: "Acessórios", icon: "ShoppingBag", order: 4 },
      { slug: "joias_bijuterias", name: "Jóias", icon: "Crown", order: 5 },
      { slug: "casa_decoracao", name: "Casa", icon: "Home", order: 6 },
      { slug: "esporte_lazer", name: "Esporte", icon: "Dumbbell", order: 7 },
      { slug: "eletronicos", name: "Eletrônicos", icon: "Smartphone", order: 8 },
      { slug: "beleza_cuidados", name: "Beleza", icon: "Sparkles", order: 9 },
      { slug: "livros", name: "Livros", icon: "Book", order: 10 },
      { slug: "games", name: "Games", icon: "Gamepad2", order: 11 }
    ];

  // Certifique-se de que todas as categorias têm slugs válidos
  const validatedCategories = displayCategories.map(cat => ({
    ...cat,
    slug: cat.slug || `category-${cat.id || Math.random().toString(36).substr(2, 9)}`
  }));

  // Sort categories by order if available
  const sortedCategories = [...validatedCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

  const colorMap = {
    0: "from-pink-500 to-pink-600",
    1: "from-blue-500 to-blue-600",
    2: "from-orange-500 to-orange-600",
    3: "from-purple-500 to-purple-600",
    4: "from-yellow-500 to-yellow-600",
    5: "from-green-500 to-green-600",
    6: "from-red-500 to-red-600",
    7: "from-blue-400 to-cyan-500",
    8: "from-pink-400 to-purple-500",
    9: "from-amber-500 to-amber-600",
    10: "from-green-400 to-teal-500",
    11: "from-blue-700 to-indigo-600"
  };

  return (
    <div className="mb-12">
      <h2 
        className="text-xl sm:text-2xl font-bold mb-4 flex items-center"
        style={{ color: primaryColor }}
      >
        Explorar Categorias
        <span className="inline-block bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full ml-2">
          {sortedCategories.length}
        </span>
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {sortedCategories.map((category, index) => {
          // Choose an icon component based on the icon name, or default to ShoppingBag
          const IconComponent = category.icon && ICON_MAP[category.icon] ? ICON_MAP[category.icon] : ShoppingBag;
          
          // Generate a color based on the category index
          const gradient = colorMap[index % Object.keys(colorMap).length];
          
          return (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-md transition-all border-transparent hover:border-blue-100 overflow-hidden"
                onClick={() => onSelect(category.slug)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} mx-auto mb-2 flex items-center justify-center shadow-md transform hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs font-medium line-clamp-1">{category.name}</h3>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}