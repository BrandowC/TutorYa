import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import type { EstadoSesion } from "@/lib/api/tipos";

const ETIQUETAS: Record<EstadoSesion, { texto: string; clase: string }> = {
  SOLICITADA: {
    texto: "Pendiente",
    clase: "bg-[#fff0dc] text-[#9a3f00] dark:bg-[#3a2412] dark:text-[#ffb27a]",
  },
  CONFIRMADA: {
    texto: "Confirmada",
    clase: "bg-[#e5e8ff] text-[#1d2480] dark:bg-[#222c6b] dark:text-[#dfe3ff]",
  },
  RECHAZADA: {
    texto: "Rechazada",
    clase: "bg-[#ffe3e8] text-[#a3162d] dark:bg-[#4a1621] dark:text-[#ff9bab]",
  },
  CANCELADA: {
    texto: "Cancelada",
    clase: "bg-[#eceeff] text-[#5b628f] dark:bg-[#1b2357] dark:text-[#a3abdb]",
  },
  REALIZADA: {
    texto: "Realizada",
    clase: "bg-[#d9f8f2] text-[#00695a] dark:bg-[#0f3a3a] dark:text-[#2de0c4]",
  },
  NO_ASISTIO: {
    texto: "No asistió",
    clase: "bg-[#ffe3e8] text-[#a3162d] dark:bg-[#4a1621] dark:text-[#ff9bab]",
  },
};

export function etiquetaEstado(estado: EstadoSesion): string {
  return ETIQUETAS[estado].texto;
}

export function EstadoSesionBadge({ estado }: { estado: EstadoSesion }) {
  const { texto, clase } = ETIQUETAS[estado];
  return <Badge className={cn("border-transparent font-semibold", clase)}>{texto}</Badge>;
}
