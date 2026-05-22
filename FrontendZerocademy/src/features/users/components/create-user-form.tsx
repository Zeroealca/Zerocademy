"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS, USER_ROLES } from "@/features/users/constants";
import { useCreateUser } from "@/features/users/hooks/use-create-user";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/features/users/schemas/create-user.schema";
import { ApiError } from "@/lib/api-error";
import type { UserRole } from "@/stores/use-auth-store";
import { useAuthStore } from "@/stores/use-auth-store";

function getAssignableRoles(actorRole: UserRole | undefined): UserRole[] {
  if (actorRole === "SUPER_ADMIN") {
    return USER_ROLES;
  }

  if (actorRole === "ADMIN") {
    return USER_ROLES.filter((role) => role !== "SUPER_ADMIN");
  }

  return [];
}

export function CreateUserForm() {
  const currentUser = useAuthStore((state) => state.user);
  const createUserMutation = useCreateUser();
  const assignableRoles = getAssignableRoles(currentUser?.role);
  const defaultRole: UserRole = assignableRoles.includes("TEACHER")
    ? "TEACHER"
    : (assignableRoles[0] ?? "STUDENT");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: defaultRole,
      isActive: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      createUserMutation.reset();
      await createUserMutation.mutateAsync(values);
      reset({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: defaultRole,
        isActive: true,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el usuario. Inténtalo de nuevo.";

      if (error instanceof ApiError && error.details?.length) {
        error.details.forEach((detail) => {
          const field = detail.field as keyof CreateUserInput;
          setError(field, { message: String(detail.message) });
        });
      }

      setError("root", { message });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Crear usuario</CardTitle>
        <CardDescription>
          Añade una cuenta nueva con rol y configuración de acceso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="password">Contraseña temporal</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName ? (
              <p className="text-sm text-destructive">
                {errors.firstName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName ? (
              <p className="text-sm text-destructive">
                {errors.lastName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  id="role"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.role ? (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Estado</Label>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Select
                  id="isActive"
                  value={field.value ? "true" : "false"}
                  onChange={(event) =>
                    field.onChange(event.target.value === "true")
                  }
                  onBlur={field.onBlur}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </Select>
              )}
            />
          </div>

          {errors.root ? (
            <p
              className="text-sm text-destructive sm:col-span-2"
              role="alert"
            >
              {errors.root.message}
            </p>
          ) : null}

          {createUserMutation.isSuccess ? (
            <div className="sm:col-span-2">
              <Badge variant="success">Usuario creado correctamente</Badge>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear usuario"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
