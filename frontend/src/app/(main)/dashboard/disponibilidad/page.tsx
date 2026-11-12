import type { Metadata } from "next";

import { AccesoDenegado } from "@/components/tutorapp/acceso-denegado";
import { DisponibilidadPanel } from "@/components/tutorapp/disponibilidad-panel";
import { EncabezadoPagina } from "@/components/tutorapp/estados-consulta";
import { requerirRol } from "@/lib/servidor/sesion";

export const metadata: Metadata = { title: "Mi disponibilidad" };

export default async function PaginaDisponibilidad() {
  const { permitido } = await requerirRol("TUTOR");
  if (!permitido) return <AccesoDenegado detalle="Solo los tutores pueden publicar horarios." />;
  return (
    <>
      <EncabezadoPagina
        titulo="Mi disponibilidad"
        descripcion="Publica los horarios en los que ofreces tutoría por asignatura."
      />
      <DisponibilidadPanel />
    </>
  );
}
