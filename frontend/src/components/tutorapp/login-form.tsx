"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, Eye, EyeOff, LogIn } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/cliente";
import { type DatosLogin, esquemaLogin } from "@/lib/validaciones";

const CUENTAS_DEMO = [
  { etiqueta: "Estudiante de prueba", correo: "estudiante1@tutorapp.test" },
  { etiqueta: "Tutor de prueba", correo: "tutor1@tutorapp.test" },
];

/** Evita redirecciones abiertas: solo se aceptan rutas internas. */
function destinoSeguro(siguiente: string | null): string {
  return siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [verPassword, setVerPassword] = useState(false);
  const mostrarDemo = process.env.NEXT_PUBLIC_MODO_DEMO === "true";

  const form = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { correo: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  async function enviar(datos: DatosLogin) {
    setErrorApi(null);
    try {
      await api.iniciarSesion(datos.correo, datos.password);
      router.replace(destinoSeguro(parametros.get("siguiente")));
      router.refresh();
    } catch (error) {
      setErrorApi(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(enviar)} className="flex flex-col gap-5">
      {parametros.get("registrado") && (
        <Alert className="border-[#00c2a8]/40 bg-[#d9f8f2] text-[#00574a] dark:bg-[#0f3a3a] dark:text-[#2de0c4]">
          <CircleCheck />
          <AlertDescription className="text-inherit">
            Cuenta creada correctamente. Ya puede iniciar sesión.
          </AlertDescription>
        </Alert>
      )}
      {parametros.get("expirada") && (
        <Alert>
          <CircleAlert />
          <AlertDescription>Su sesión expiró. Inicie sesión de nuevo para continuar.</AlertDescription>
        </Alert>
      )}
      {errorApi && (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>{errorApi}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="correo"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-correo">Correo electrónico</FieldLabel>
              <Input
                {...field}
                id="login-correo"
                type="email"
                placeholder="tu.correo@ejemplo.com"
                autoComplete="email"
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
              <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="login-password"
                  type={verPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 grid w-7 place-items-center"
                >
                  {verPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" size="lg" className="h-10 w-full text-base" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : <LogIn />}
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </Button>

      {mostrarDemo && (
        <div className="bg-muted/60 rounded-lg border border-dashed p-3 text-sm">
          <p className="text-muted-foreground mb-2">Cuentas de demostración (contraseña en el README):</p>
          <div className="flex flex-wrap gap-2">
            {CUENTAS_DEMO.map((cuenta) => (
              <Button
                key={cuenta.correo}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => form.setValue("correo", cuenta.correo)}
              >
                {cuenta.etiqueta}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-muted-foreground text-center text-sm">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="text-primary font-semibold hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
