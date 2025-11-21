import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Store } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function FeaturedStores({ stores }) {
  if (stores.length === 0) return null;

  return (
    <div className="mb-12" id="featured-stores">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Lojas em Destaque</h2>
        <Button variant="ghost" className="text-blue-600">
          Ver Todas <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
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
                <div className="relative h-32">
                  <img
                    src={store.store_banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800"}
                    alt={store.store_name}
                    className="w-full h-full object-cover"
                  />
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
                        src={store.store_logo || "https://via.placeholder.com/64"}
                        alt={store.store_name}
                        className="w-full h-full object-cover"
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