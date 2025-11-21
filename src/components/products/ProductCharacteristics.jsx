import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function ProductCharacteristics({ product }) {
  if (!product) return null;

  const characteristics = [];

  // Extrair características da descrição ou tags
  if (product.tags && Array.isArray(product.tags)) {
    product.tags.forEach(tag => {
      if (tag && typeof tag === 'string' && tag.trim()) {
        characteristics.push(tag.trim());
      }
    });
  }

  // Se não tiver tags, tentar extrair da descrição (primeiras linhas)
  if (characteristics.length === 0 && product.description) {
    const lines = product.description.split('\n').slice(0, 5);
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 10 && trimmed.length < 100) {
        // Remover pontos finais e capitalizar
        const clean = trimmed.replace(/^[-•*]\s*/, '').replace(/\.$/, '');
        if (clean) {
          characteristics.push(clean);
        }
      }
    });
  }

  // Características padrão baseadas em campos do produto
  if (product.stock !== null && product.stock !== undefined) {
    if (product.stock > 0) {
      characteristics.unshift("Estoque disponível");
    } else {
      characteristics.unshift("Fora de estoque");
    }
  }

  if (product.featured) {
    characteristics.unshift("Produto em destaque");
  }

  // Limitar a 6 características principais
  const displayCharacteristics = characteristics.slice(0, 6);

  if (displayCharacteristics.length === 0) return null;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
        O que você precisa saber sobre este produto
      </h3>
      <ul className="space-y-2">
        {displayCharacteristics.map((char, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700 bg-white/60 rounded-lg p-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5 fill-green-100" />
            <span className="font-medium">{char}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

