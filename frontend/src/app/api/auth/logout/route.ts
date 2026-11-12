import { NextResponse } from "next/server";

import { COOKIE_SESION } from "@/lib/servidor/config";

export async function POST() {
  const salida = new NextResponse(null, { status: 204 });
  salida.cookies.delete(COOKIE_SESION);
  return salida;
}
