import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Store } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { STORE_LOGO_PLACEHOLDER, handleImageError } from "@/utils/imagePlaceholder";

export default function FeaturedStores({ stores }) {
  if (stores.length === 0) return null;

  return (
    <div className="mb-12" id="featured-stores">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Lojas em Destaque</h2>
        <Link to={createPageUrl("Home?featured_stores=all")}>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
            Ver Todas <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store, index) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={createPageUrl(`Store?id=${store.id}`)}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-32 bg-gradient-to-br from-blue-50 to-blue-100">
                  {store.store_banner ? (
                    <img
                      src={store.store_banner}
                      alt={store.store_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-12 h-12 text-blue-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    {store.verified && (
                      <Badge className="bg-blue-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verificada
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg -mt-8 overflow-hidden bg-white">
                      <img
                        src={store.store_logo || STORE_LOGO_PLACEHOLDER}
                        alt={store.store_name}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e, STORE_LOGO_PLACEHOLDER)}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{store.store_name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {store.store_description || "Loja verificada no marketplace"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>{store.total_products} produtos</span>
                    <span>{store.total_views} visualizações</span>
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