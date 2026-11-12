import type { Metadata } from "next";

import { AccesoDenegado } from "@/components/tutorapp/acceso-denegado";
import { BuscarTutoresPanel } from "@/components/tutorapp/buscar-tutores-panel";
import { EncabezadoPagina } from "@/components/tutorapp/estados-consulta";
import { requerirRol } from "@/lib/servidor/sesion";

export const metadata: Metadata = { title: "Buscar tutor" };

export default async function PaginaBuscar() {
  const { permitido } = await requerirRol("ESTUDIANTE");
  if (!permitido) return <AccesoDenegado detalle="Solo los estudiantes pueden buscar y reservar tutorías." />;
  return (
    <>
      <EncabezadoPagina
        titulo="Buscar tutor"
        descripcion="Filtra por asignatura y fecha, y reserva el horario que mejor te quede."
      />
      <BuscarTutoresPanel />
    </>
  );
}
