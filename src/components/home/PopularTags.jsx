import React from 'react';
import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Popular tags could come from backend in a real app
const POPULAR_TAGS = [
  { name: "roupas_femininas", count: 154 },
  { name: "acessorios", count: 128 },
  { name: "decoracao", count: 98 },
  { name: "artesanato", count: 87 },
  { name: "naturais", count: 76 },
  { name: "fitness", count: 67 },
  { name: "inverno", count: 65 },
  { name: "vintage", count: 54 },
  { name: "reciclado", count: 42 },
  { name: "organico", count: 38 },
  { name: "infantil", count: 36 },
  { name: "outlet", count: 32 },
  { name: "premium", count: 29 },
  { name: "presente", count: 26 },
  { name: "festa", count: 22 },
  { name: "personalizado", count: 21 },
];

export default function PopularTags() {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Tags Populares
        </h2>
        <Button variant="ghost">
          Ver Todas
        </Button>
      </div>
      
      <motion.div 
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {POPULAR_TAGS.map((tag, index) => (
          <motion.div
            key={tag.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Badge 
              variant="outline" 
              className="py-2 px-3 hover:bg-blue-50 cursor-pointer transition-colors text-sm"
            >
              {tag.name.replace(/_/g, ' ')}
              <span className="ml-2 text-xs opacity-70">{tag.count}</span>
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}