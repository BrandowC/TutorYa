"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { Usuario } from "@/lib/api/tipos";

const UsuarioContexto = createContext<Usuario | null>(null);

/** Hace llegar el usuario autenticado (resuelto en el servidor) a los componentes de cliente. */
export function UsuarioProvider({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  return <UsuarioContexto.Provider value={usuario}>{children}</UsuarioContexto.Provider>;
}

export function useUsuario(): Usuario {
  const usuario = useContext(UsuarioContexto);
  if (!usuario) throw new Error("useUsuario debe usarse dentro de <UsuarioProvider>.");
  return usuario;
}
