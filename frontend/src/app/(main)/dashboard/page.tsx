import type { Metadata } from "next";

import { EncabezadoPagina } from "@/components/tutorapp/estados-consulta";
import { ResumenPanel } from "@/components/tutorapp/resumen-panel";

export const metadata: Metadata = { title: "Panel" };

export default function PaginaPanel() {
  return (
    <>
      <EncabezadoPagina titulo="Tu panel" descripcion="Un vistazo rápido a tus tutorías." />
      <ResumenPanel />
    </>
  );
}
