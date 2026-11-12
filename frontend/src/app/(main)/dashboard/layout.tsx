import type { ReactNode } from "react";

import { cookies } from "next/headers";

import { UsuarioProvider } from "@/components/tutorapp/usuario-contexto";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requerirUsuario } from "@/lib/servidor/sesion";

import { ThemeSwitcher } from "./_components/header/theme-switcher";
import { AppSidebar } from "./_components/sidebar/app-sidebar";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const usuario = await requerirUsuario();
  const almacen = await cookies();
  const abierto = almacen.get("sidebar_state")?.value !== "false";

  return (
    <UsuarioProvider usuario={usuario}>
      <SidebarProvider
        defaultOpen={abierto}
        style={{ "--sidebar-width": "calc(var(--spacing) * 64)" } as React.CSSProperties}
      >
        <AppSidebar usuario={usuario} />
        <SidebarInset className="min-w-0 overflow-x-clip">
          <header className="bg-background/70 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-md">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" aria-label="Mostrar u ocultar el menú" />
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
                />
                <p className="text-muted-foreground text-sm">
                  Hola, <span className="text-foreground font-semibold">{usuario.nombres.split(" ")[0]}</span>
                </p>
              </div>
              <ThemeSwitcher />
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </UsuarioProvider>
  );
}
