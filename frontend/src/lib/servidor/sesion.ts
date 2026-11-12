import "server-only";

import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Rol, Usuario } from "@/lib/api/tipos";

import { API_URL, COOKIE_SESION } from "./config";

/** Consulta el perfil con el token de la cookie. Devuelve null si no hay sesión válida. */
export const obtenerUsuarioActual = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  try {
    const respuesta = await fetch(`${API_URL}/auth/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!respuesta.ok) return null;
    return (await respuesta.json()) as Usuario;
  } catch {
    return null;
  }
});

/** Para páginas protegidas: si la sesión no es válida, limpia la cookie y vuelve al login. */
export async function requerirUsuario(): Promise<Usuario> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/api/auth/salir?expirada=1");
  return usuario;
}

export async function requerirRol(rol: Rol): Promise<{ usuario: Usuario; permitido: boolean }> {
  const usuario = await requerirUsuario();
  return { usuario, permitido: usuario.rol === rol };
}
