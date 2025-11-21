import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, Star, Tag } from "lucide-react";

export default function ProductBadges({ product, categoryRank }) {
  if (!product) return null;

  const badges = [];

  // Badge: MAIS VENDIDO (baseado em rank na categoria ou visualizações altas)
  if (categoryRank && categoryRank <= 10) {
    badges.push({
      type: "best_seller",
      label: `MAIS VENDIDO ${categoryRank}° em ${product.category_name || "Produtos"}`,
      icon: TrendingUp,
      className: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 hover:from-orange-600 hover:to-red-600",
    });
  } else if (product.total_views > 100) {
    badges.push({
      type: "popular",
      label: "POPULAR",
      icon: TrendingUp,
      className: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 hover:from-orange-600 hover:to-red-600",
    });
  }

  // Badge: DESTAQUE (featured)
  if (product.featured) {
    badges.push({
      type: "featured",
      label: "DESTAQUE",
      icon: Star,
      className: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400 hover:from-yellow-600 hover:to-amber-600",
    });
  }

  // Badge: NOVO (criado nos últimos 30 dias)
  const createdAt = new Date(product.created_at);
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation <= 30) {
    badges.push({
      type: "new",
      label: "NOVO",
      icon: Sparkles,
      className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400 hover:from-blue-600 hover:to-indigo-700",
    });
  }

  // Badge: PROMOÇÃO (se tiver desconto significativo)
  if (product.compare_price && product.compare_price > product.price) {
    const discountPercent = Math.round(
      ((product.compare_price - product.price) / product.compare_price) * 100
    );
    if (discountPercent >= 20) {
      badges.push({
        type: "promotion",
        label: `${discountPercent}% OFF`,
        icon: Tag,
        className: "bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-400 hover:from-red-600 hover:to-pink-700",
      });
    }
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <Badge
            key={index}
            className={`${badge.className} text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all duration-200 border-2`}
          >
            <Icon className="w-3.5 h-3.5" />
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
}

