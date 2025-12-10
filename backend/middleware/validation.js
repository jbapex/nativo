import { z } from 'zod';

// Schemas de validação com Zod
export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  description: z.string().max(5000, 'Descrição muito longa').optional(),
  price: z.number().positive('Preço deve ser positivo').max(999999999.99, 'Preço muito alto'),
  compare_price: z.number().positive().max(999999999.99).optional().nullable(),
  category_id: z.string().uuid('ID de categoria inválido').optional().nullable(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0).max(999999).optional().nullable(),
  active: z.boolean().optional(),
  images: z.array(z.string()).optional(), // Removido .url() para permitir URLs relativas ou diferentes formatos
  technical_specs: z.string().optional().nullable(),
  included_items: z.string().optional().nullable(),
  warranty_info: z.string().optional().nullable(),
  attributes: z.union([z.string(), z.object({}).passthrough(), z.record(z.any())]).optional().nullable(), // Permite objeto, string JSON, etc
}).passthrough(); // Permite campos adicionais que não estão no schema

export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
  full_name: z.string().min(1, 'Nome é obrigatório').max(200),
  phone: z.string().max(20).optional().nullable(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF inválido').optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const orderSchema = z.object({
  store_id: z.string().uuid('ID de loja inválido'),
  items: z.array(z.object({
    product_id: z.string().uuid('ID de produto inválido'),
    quantity: z.number().int().positive('Quantidade deve ser positiva'),
  })).min(1, 'Pelo menos um item é obrigatório'),
  shipping_address: z.string().min(1, 'Endereço é obrigatório'),
  shipping_city: z.string().min(1, 'Cidade é obrigatória'),
  shipping_state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  shipping_zip: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  shipping_phone: z.string().min(10, 'Telefone inválido'),
  payment_method: z.enum(['whatsapp', 'pix', 'credit_card', 'boleto']),
  notes: z.string().max(1000).optional().nullable(),
});

// Middleware de validação genérico
export function validate(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: (error.errors || []).map(err => ({
            field: (err.path || []).join('.'),
            message: err.message || 'Campo inválido'
          }))
        });
      }
      // Log do erro para debug
      console.error('Erro na validação:', error);
      console.error('Tipo do erro:', error?.constructor?.name);
      console.error('Stack:', error?.stack);
      next(error);
    }
  };
}

// Sanitização básica de strings (proteção XSS)
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Middleware para sanitizar body
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Não sanitizar campos que podem conter HTML válido (como descrições de produtos)
          // Apenas campos básicos
          if (!['description', 'content', 'html'].includes(key.toLowerCase())) {
            obj[key] = sanitizeString(obj[key]);
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
}

