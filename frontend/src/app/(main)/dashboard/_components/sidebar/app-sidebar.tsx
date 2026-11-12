"use client";

import Link from "next/link";

import { LogoIcono } from "@/components/marca/logo-marca";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import type { Usuario } from "@/lib/api/tipos";
import { accionPrincipal, menuPorRol } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ usuario }: { readonly usuario: Usuario }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={APP_CONFIG.name}>
              <Link prefetch={false} href="/dashboard">
                <LogoIcono className="size-9 shrink-0" />
                <span className="text-lg font-extrabold tracking-tight">
                  Tutor<span className="text-[#ff7a1a]">App</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain grupos={menuPorRol(usuario.rol)} accion={accionPrincipal(usuario.rol)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser usuario={usuario} />
      </SidebarFooter>
    </Sidebar>
  );
}
