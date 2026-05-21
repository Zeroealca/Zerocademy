import { z } from "zod";

export const assignInstitutionMembershipSchema = z.object({
  userId: z.string().uuid("Selecciona un usuario válido"),
  role: z.enum(["ADMIN", "TEACHER"], {
    message: "Selecciona un rol",
  }),
});

export type AssignInstitutionMembershipFormValues = z.infer<
  typeof assignInstitutionMembershipSchema
>;
