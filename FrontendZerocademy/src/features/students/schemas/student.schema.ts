import { z } from "zod";

const genderSchema = z.enum(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"], {
  error: "Selecciona un género válido",
});

export const createStudentSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede superar 128 caracteres"),
  firstName: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  lastName: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido no puede superar 100 caracteres"),
  nationalId: z
    .string()
    .min(1, "La cédula es obligatoria")
    .max(32, "La cédula no puede superar 32 caracteres"),
  birthDate: z.string().optional(),
  gender: genderSchema.optional(),
  phone: z
    .string()
    .max(32, "El teléfono no puede superar 32 caracteres")
    .optional(),
  address: z
    .string()
    .max(500, "La dirección no puede superar 500 caracteres")
    .optional(),
  emergencyContact: z
    .string()
    .max(500, "El contacto de emergencia no puede superar 500 caracteres")
    .optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  firstName: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres")
    .optional(),
  lastName: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido no puede superar 100 caracteres")
    .optional(),
  nationalId: z
    .string()
    .min(1, "La cédula es obligatoria")
    .max(32, "La cédula no puede superar 32 caracteres")
    .optional(),
  birthDate: z.string().optional(),
  gender: genderSchema.optional(),
  phone: z
    .string()
    .max(32, "El teléfono no puede superar 32 caracteres")
    .optional(),
  address: z
    .string()
    .max(500, "La dirección no puede superar 500 caracteres")
    .optional(),
  emergencyContact: z
    .string()
    .max(500, "El contacto de emergencia no puede superar 500 caracteres")
    .optional(),
  isActive: z.boolean().optional(),
  userIsActive: z.boolean().optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const bulkImportSchema = z.object({
  csvContent: z.string().min(1, "El contenido del archivo es obligatorio"),
  courseId: z.string().uuid("Selecciona un curso válido"),
  academicPeriodId: z.string().uuid("Selecciona un período académico válido"),
});

export type BulkImportFormInput = z.infer<typeof bulkImportSchema>;
