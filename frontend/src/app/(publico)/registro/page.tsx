import type { Metadata } from "next";

import { RegistroForm } from "@/components/tutorapp/registro-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Crea tu cuenta</h1>
        <p className="text-muted-foreground">Es gratis y toma menos de dos minutos.</p>
      </div>
      <RegistroForm />
    </>
  );
}
