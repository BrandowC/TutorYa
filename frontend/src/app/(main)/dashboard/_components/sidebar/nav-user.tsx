"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { EllipsisVertical, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { api } from "@/lib/api/cliente";
import type { Usuario } from "@/lib/api/tipos";
import { iniciales } from "@/lib/formato";

export function NavUser({ usuario }: { readonly usuario: Usuario }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await api.cerrarSesion();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`Menú de ${usuario.nombres}`}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-[#ff7a1a] font-bold text-white">
                  {iniciales(usuario.nombres)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{usuario.nombres}</span>
                <span className="text-sidebar-foreground/60 truncate text-xs">
                  {usuario.rol === "TUTOR" ? "Tutor" : "Estudiante"}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="grid text-sm leading-tight">
                <span className="truncate font-semibold">{usuario.nombres}</span>
                <span className="text-muted-foreground truncate text-xs">{usuario.correo}</span>
                <span className="text-muted-foreground truncate text-xs">{usuario.programa}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={cerrarSesion} disabled={saliendo}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
