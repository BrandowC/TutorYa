import { NextResponse } from "next/server";

import { COOKIE_SESION } from "@/lib/servidor/config";

/** Limpia una cookie inválida o vencida y vuelve al login (evita bucles de redirección). */
export async function GET(peticion: Request) {
  const url = new URL("/login", peticion.url);
  if (new URL(peticion.url).searchParams.get("expirada")) url.searchParams.set("expirada", "1");
  const salida = NextResponse.redirect(url);
  salida.cookies.delete(COOKIE_SESION);
  return salida;
}
