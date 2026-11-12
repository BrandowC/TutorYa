import { NextResponse } from "next/server";

import { API_URL, COOKIE_SESION, opcionesCookie } from "@/lib/servidor/config";

/**
 * Inicia sesión contra NestJS y guarda el token en una cookie httpOnly:
 * JavaScript del navegador nunca puede leerlo (protege frente a XSS).
 */
export async function POST(peticion: Request) {
  const cuerpo = await peticion.text();
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: cuerpo,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { statusCode: 503, codigo: "API_NO_DISPONIBLE", message: "El servidor no está disponible." },
      { status: 503 },
    );
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !datos?.accessToken) {
    return NextResponse.json(datos ?? { message: "No se pudo iniciar sesión." }, { status: respuesta.status });
  }

  const salida = NextResponse.json({ usuario: datos.usuario });
  salida.cookies.set(COOKIE_SESION, datos.accessToken, opcionesCookie(datos.expiraEnSegundos));
  return salida;
}
