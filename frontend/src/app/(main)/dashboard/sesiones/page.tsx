import type { Metadata } from "next";

import { EncabezadoPagina } from "@/components/tutorapp/estados-consulta";
import { SesionesPanel } from "@/components/tutorapp/sesiones-panel";

export const metadata: Metadata = { title: "Mis sesiones" };

export default function PaginaSesiones() {
  return (
    <>
      <EncabezadoPagina titulo="Mis sesiones" descripcion="Solicitudes, tutorías confirmadas y su historial." />
      <SesionesPanel />
    </>
  );
}
