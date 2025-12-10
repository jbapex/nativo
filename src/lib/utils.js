import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico como moeda brasileira (R$)
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado como "R$ 1.234,56"
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(1000) // "R$ 1.000,00"
 * formatCurrency(null) // "R$ 0,00"
 */
export function formatCurrency(value) {
  if (value === undefined || value === null || value === '') {
    return "R$ 0,00";
  }
  
  // Converter para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Verificar se é um número válido
  if (isNaN(numValue)) {
    return "R$ 0,00";
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
} 