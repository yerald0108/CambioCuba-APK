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
