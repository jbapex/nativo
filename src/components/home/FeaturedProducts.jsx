import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeaturedProducts({ products }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
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
                <div className="relative">
                  <img
                    src={product.images?.[0] || product.image_url}
                    alt={product.name}
                    className="w-full h-32 xs:h-36 sm:h-44 md:h-48 object-cover"
                  />
                  {product.compare_price && product.compare_price > product.price && (
                    <Badge className="absolute top-1 left-1 sm:top-3 sm:left-3 bg-red-500 text-xs">
                      {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                    </Badge>
                  )}
                  <Badge className="absolute top-1 right-1 sm:top-3 sm:right-3 bg-yellow-500 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" /> Destaque
                  </Badge>
                </div>

                <CardContent className="p-2 xs:p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{product.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1 sm:mt-2">
                    <div>
                      {product.compare_price && product.compare_price > product.price ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            R$ {product.compare_price.toFixed(2)}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-green-600 block">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm sm:text-base font-bold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="hidden xs:block text-xs sm:text-sm text-gray-500 truncate max-w-[60px] sm:max-w-full">{product.store_name}</div>
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