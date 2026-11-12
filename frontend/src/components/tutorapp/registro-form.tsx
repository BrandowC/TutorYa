"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { BookOpenCheck, Check, CircleAlert, GraduationCap, Minus, UserPlus } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, api } from "@/lib/api/cliente";
import { type DatosRegistroFormulario, esquemaRegistro, evaluarPassword } from "@/lib/validaciones";

const ROLES = [
  { valor: "ESTUDIANTE", titulo: "Estudiante", detalle: "Busco tutores y agendo sesiones", icono: GraduationCap },
  { valor: "TUTOR", titulo: "Tutor", detalle: "Ofrezco horarios y doy tutorías", icono: BookOpenCheck },
] as const;

export function RegistroForm() {
  const router = useRouter();
  const [errorApi, setErrorApi] = useState<{ mensaje: string; detalles: string[] } | null>(null);

  const form = useForm<DatosRegistroFormulario>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { nombres: "", correo: "", programa: "", rol: "ESTUDIANTE", password: "" },
  });
  const { isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });
  const reglas = evaluarPassword(password ?? "");

  async function enviar(datos: DatosRegistroFormulario) {
    setErrorApi(null);
    try {
      await api.registrar(datos);
      router.replace("/login?registrado=1");
    } catch (error) {
      if (error instanceof ApiError && error.codigo === "CORREO_DUPLICADO") {
        form.setError("correo", { message: "Ya existe una cuenta con ese correo electrónico." });
        return;
      }
      setErrorApi({
        mensaje: error instanceof Error ? error.message : "No se pudo crear la cuenta.",
        detalles: error instanceof ApiError ? error.detalles : [],
      });
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(enviar)} className="flex flex-col gap-5">
      {errorApi && (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>
            {errorApi.mensaje}
            {errorApi.detalles.length > 0 && (
              <ul className="mt-1 list-disc pl-4">
                {errorApi.detalles.map((detalle) => (
                  <li key={detalle}>{detalle}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Controller
        control={form.control}
        name="rol"
        render={({ field }) => (
          <FieldSet>
            <FieldLegend variant="label">Quiero registrarme como</FieldLegend>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ valor, titulo, detalle, icono: Icono }) => (
                <label
                  key={valor}
                  className={cn(
                    "has-focus-visible:ring-ring/50 flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3 transition-all has-focus-visible:ring-3",
                    field.value === valor
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={valor}
                    checked={field.value === valor}
                    onChange={() => field.onChange(valor)}
                    className="sr-only"
                  />
                  <Icono className={cn("size-5", field.value === valor ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-semibold">{titulo}</span>
                  <span className="text-muted-foreground text-xs leading-snug">{detalle}</span>
                </label>
              ))}
            </div>
          </FieldSet>
        )}
      />

      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="nombres"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="registro-nombres">Nombres completos</FieldLabel>
              <Input
                {...field}
                id="registro-nombres"
                autoComplete="name"
                placeholder="Ej. Camila Torres"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="correo"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="registro-correo">Correo electrónico</FieldLabel>
              <Input
                {...field}
                id="registro-correo"
                type="email"
                autoComplete="email"
                placeholder="tu.correo@ejemplo.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="programa"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="registro-programa">Programa académico</FieldLabel>
              <Input
                {...field}
                id="registro-programa"
                placeholder="Ej. Ingeniería de Sistemas"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="registro-password">Contraseña</FieldLabel>
              <Input
                {...field}
                id="registro-password"
                type="password"
                autoComplete="new-password"
                placeholder="Crea una contraseña segura"
                aria-invalid={fieldState.invalid}
                aria-describedby="reglas-password"
              />
              <ul id="reglas-password" className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {reglas.map((regla) => (
                  <li
                    key={regla.id}
                    className={cn(
                      "flex items-center gap-1",
                      regla.cumple ? "text-[#00826e] dark:text-[#2de0c4]" : "text-muted-foreground",
                    )}
                  >
                    {regla.cumple ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
                    {regla.texto}
                  </li>
                ))}
              </ul>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" size="lg" className="h-10 w-full text-base" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : <UserPlus />}
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
