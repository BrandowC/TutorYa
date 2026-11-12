import { Suspense } from "react";

import type { Metadata } from "next";

import { LoginForm } from "@/components/tutorapp/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaLogin() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground">Ingresa con tu correo y contraseña para continuar.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
