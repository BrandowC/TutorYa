import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL, COOKIE_SESION } from "@/lib/servidor/config";

/**
 * Proxy hacia NestJS: añade el token de la cookie como Authorization.
 * Así el navegador solo habla con Next.js y el frontend nunca toca la base de datos.
 */
async function reenviar(peticion: Request, contexto: { params: Promise<{ ruta: string[] }> }) {
  const { ruta } = await contexto.params;
  const destino = `${API_URL}/${ruta.map(encodeURIComponent).join("/")}${new URL(peticion.url).search}`;

  const encabezados: Record<string, string> = {};
  const tipo = peticion.headers.get("content-type");
  if (tipo) encabezados["Content-Type"] = tipo;
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (token) encabezados.Authorization = `Bearer ${token}`;

  const tieneCuerpo = !["GET", "HEAD"].includes(peticion.method);
  let respuesta: Response;
  try {
    respuesta = await fetch(destino, {
      method: peticion.method,
      headers: encabezados,
      body: tieneCuerpo ? await peticion.text() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { statusCode: 503, codigo: "API_NO_DISPONIBLE", message: "El servidor no está disponible." },
      { status: 503 },
    );
  }

  if (respuesta.status === 204) return new NextResponse(null, { status: 204 });
  const texto = await respuesta.text();
  return new NextResponse(texto, {
    status: respuesta.status,
    headers: { "Content-Type": respuesta.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = reenviar;
export const POST = reenviar;
export const PATCH = reenviar;
export const PUT = reenviar;
export const DELETE = reenviar;
