"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { AccionPrincipal, NavGroup } from "@/navigation/sidebar/sidebar-items";

export function NavMain({
  grupos,
  accion,
}: {
  readonly grupos: readonly NavGroup[];
  readonly accion: AccionPrincipal;
}) {
  const ruta = usePathname();
  const Icono = accion.icono;

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={accion.titulo}
                className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground active:bg-sidebar-primary/90 active:text-sidebar-primary-foreground h-10 justify-center font-semibold shadow-lg shadow-[#ff7a1a]/25"
              >
                <Link href={accion.url}>
                  <Icono />
                  <span>{accion.titulo}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {grupos.map((grupo) => (
        <SidebarGroup key={grupo.id}>
          <SidebarGroupLabel className="text-sidebar-foreground/60">{grupo.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {grupo.items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={ruta === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
