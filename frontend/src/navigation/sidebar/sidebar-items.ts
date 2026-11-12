import { CalendarCheck, CalendarClock, LayoutDashboard, type LucideIcon, Search } from "lucide-react";

import type { Rol } from "@/lib/api/tipos";

export interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface AccionPrincipal {
  titulo: string;
  url: string;
  icono: LucideIcon;
}

/** El menú cambia según el rol: cada persona solo ve lo que le corresponde (SWR-AUTH-004). */
export function menuPorRol(rol: Rol): NavGroup[] {
  const general: NavItem[] = [
    { id: "panel", title: "Panel", url: "/dashboard", icon: LayoutDashboard },
    { id: "sesiones", title: "Mis sesiones", url: "/dashboard/sesiones", icon: CalendarCheck },
  ];
  const propios: NavItem[] =
    rol === "TUTOR"
      ? [{ id: "disponibilidad", title: "Mi disponibilidad", url: "/dashboard/disponibilidad", icon: CalendarClock }]
      : [{ id: "buscar", title: "Buscar tutor", url: "/dashboard/buscar", icon: Search }];
  return [
    { id: "general", label: "General", items: general },
    { id: "rol", label: rol === "TUTOR" ? "Como tutor" : "Como estudiante", items: propios },
  ];
}

export function accionPrincipal(rol: Rol): AccionPrincipal {
  return rol === "TUTOR"
    ? { titulo: "Publicar horario", url: "/dashboard/disponibilidad", icono: CalendarClock }
    : { titulo: "Agendar tutoría", url: "/dashboard/buscar", icono: Search };
}
