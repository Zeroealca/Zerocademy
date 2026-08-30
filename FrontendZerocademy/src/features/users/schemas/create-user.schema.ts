import { z } from "zod";

const userRoleSchema = z.enum(
  ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT", "REPRESENTATIVE"],
  { error: "Selecciona un rol válido" },
);

export const createUserSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña debe tener como máximo 128 caracteres"),
  firstName: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  lastName: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido no puede superar 100 caracteres"),
  role: userRoleSchema,
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
