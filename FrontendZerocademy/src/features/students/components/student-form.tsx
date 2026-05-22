"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { GENDER_LABELS, GENDERS } from "@/features/students/constants";
import {
  createStudentSchema,
  updateStudentSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "@/features/students/schemas/student.schema";
import type { Student } from "@/features/students/types";
import { ApiError } from "@/lib/api-error";

type StudentFormProps =
  | {
      mode: "create";
      title: string;
      description: string;
      submitLabel: string;
      defaultValues?: undefined;
      onSubmit: (values: CreateStudentInput) => Promise<void>;
    }
  | {
      mode: "edit";
      title: string;
      description: string;
      submitLabel: string;
      defaultValues: Student;
      onSubmit: (values: UpdateStudentInput) => Promise<void>;
    };

export function StudentForm({
  mode,
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
}: StudentFormProps) {
  const isCreate = mode === "create";

  const form = useForm<CreateStudentInput | UpdateStudentInput>({
    resolver: zodResolver(isCreate ? createStudentSchema : updateStudentSchema),
    defaultValues: isCreate
      ? {
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          nationalId: "",
          birthDate: "",
          phone: "",
          address: "",
          emergencyContact: "",
        }
      : {
          firstName: defaultValues?.firstName ?? "",
          lastName: defaultValues?.lastName ?? "",
          nationalId: defaultValues?.nationalId ?? "",
          birthDate: defaultValues?.birthDate ?? "",
          gender: defaultValues?.gender ?? undefined,
          phone: defaultValues?.phone ?? "",
          address: defaultValues?.address ?? "",
          emergencyContact: defaultValues?.emergencyContact ?? "",
          isActive: defaultValues?.isActive ?? true,
          userIsActive: defaultValues?.userIsActive ?? true,
        },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreate) {
        await (onSubmit as (v: CreateStudentInput) => Promise<void>)(
          values as CreateStudentInput,
        );
      } else {
        await (onSubmit as (v: UpdateStudentInput) => Promise<void>)(
          values as UpdateStudentInput,
        );
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el estudiante.";
      form.setError("root", { message });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {isCreate ? (
            <>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Contraseña temporal</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input id="firstName" {...form.register("firstName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input id="lastName" {...form.register("lastName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">Cédula / ID nacional</Label>
            <Input id="nationalId" {...form.register("nationalId")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de nacimiento</Label>
            <Input id="birthDate" type="date" {...form.register("birthDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Controller
              name="gender"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="gender"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                >
                  <option value="">Sin especificar</option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {GENDER_LABELS[gender]}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...form.register("address")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="emergencyContact">Contacto de emergencia</Label>
            <Input
              id="emergencyContact"
              {...form.register("emergencyContact")}
            />
          </div>

          {!isCreate ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="isActive">Perfil activo</Label>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      id="isActive"
                      value={field.value ? "true" : "false"}
                      onChange={(e) => field.onChange(e.target.value === "true")}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userIsActive">Cuenta activa</Label>
                <Controller
                  name="userIsActive"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      id="userIsActive"
                      value={field.value ? "true" : "false"}
                      onChange={(e) => field.onChange(e.target.value === "true")}
                    >
                      <option value="true">Activa</option>
                      <option value="false">Inactiva</option>
                    </Select>
                  )}
                />
              </div>
            </>
          ) : null}

          {form.formState.errors.root ? (
            <p className="text-sm text-destructive sm:col-span-2">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
