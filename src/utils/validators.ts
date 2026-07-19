/**
 * Schemas de validación Zod — CambioCuba
 *
 * Fuente única de verdad para todas las reglas de validación de formularios.
 * Usados con React Hook Form + @hookform/resolvers/zod.
 */

import { z } from 'zod';

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(80, 'El nombre no puede superar 80 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras'),

    email: z
      .string()
      .email('Correo electrónico inválido')
      .toLowerCase(),

    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña no puede superar 72 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),

    confirm_password: z
      .string()
      .min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email('Correo electrónico inválido')
    .toLowerCase(),

  password: z
    .string()
    .min(1, 'Ingresa tu contraseña'),
});

// ─── TIPOS INFERIDOS ──────────────────────────────────────────────────────────

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData    = z.infer<typeof loginSchema>;

// ─── OFERTAS ──────────────────────────────────────────────────────────────────

export const createOfferSchema = z.object({
  type: z.enum(['buy', 'sell'] as const),

  amount_usdt: z
    .number({ message: 'Ingresa una cantidad válida' })
    .positive('La cantidad debe ser mayor a 0')
    .max(100000, 'La cantidad máxima es 100,000 USDT'),

  exchange_rate: z
    .number({ message: 'Ingresa una tasa válida' })
    .positive('La tasa debe ser mayor a 0')
    .max(1000000, 'La tasa máxima es 1,000,000 CUP'),

  min_order_usdt: z
    .number({ message: 'Ingresa un mínimo válido' })
    .positive('El mínimo debe ser mayor a 0'),

  max_order_usdt: z
    .number({ message: 'Ingresa un máximo válido' })
    .positive('El máximo debe ser mayor a 0'),

  payment_methods: z
    .array(z.enum(['transfermovil', 'enzona', 'mitransfer']))
    .min(1, 'Selecciona al menos un método de pago'),

  notes: z
    .string()
    .max(500, 'La nota no puede superar 500 caracteres')
    .optional(),
})
.refine((d) => d.min_order_usdt <= d.max_order_usdt, {
  message: 'El mínimo no puede ser mayor al máximo',
  path: ['min_order_usdt'],
})
.refine((d) => d.max_order_usdt <= d.amount_usdt, {
  message: 'El máximo no puede superar la cantidad total',
  path: ['max_order_usdt'],
});

export type CreateOfferFormData = z.infer<typeof createOfferSchema>;
