import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeaturedProducts({ products, appearanceSettings = {} }) {
  if (!products || products.length === 0) return null;

  const primaryColor = appearanceSettings?.primaryColor || appearanceSettings?.buttonPrimaryColor || '#2563eb';

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 
            className="text-xl sm:text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            Produtos em Destaque
          </h2>
          <Sparkles className="w-5 h-5 text-yellow-500" />
        </div>
        <Button variant="ghost" className="text-blue-600">
          Ver Todos <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.slice(0, 8).map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.images?.[0] || product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {product.compare_price && product.compare_price > product.price && (
                    <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-green-600 text-[10px]">
                      -{Math.round((1 - product.price / product.compare_price) * 100)}%
                    </Badge>
                  )}
                  <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-yellow-500 text-[10px]">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Destaque
                  </Badge>
                </div>

                <CardContent className="p-2 sm:p-2.5 space-y-0.5">
                  <h3 className="font-medium text-[11px] sm:text-xs line-clamp-2">{product.name}</h3>
                  
                  <div>
                    {product.compare_price && product.compare_price > product.price ? (
                      <>
                        <span className="text-[10px] text-gray-400 line-through block">
                          R$ {product.compare_price.toFixed(2)}
                        </span>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 block">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                        R$ {product.price.toFixed(2)}
                      </span>
                    )}
                    
                    {product.price && (
                      <span className="text-[10px] text-gray-500 block">
                        10x de R$ {(product.price / 10).toFixed(2)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}