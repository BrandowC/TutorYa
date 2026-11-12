import { type NextRequest, NextResponse } from "next/server";

const COOKIE_SESION = "tutorapp_token";
const RUTAS_PUBLICAS = ["/login", "/registro"];

/**
 * Protege las rutas: sin sesión solo se puede entrar a /login y /registro;
 * con sesión, esas dos páginas redirigen al panel. (La validez real del token
 * la comprueba el servidor al cargar cada página protegida.)
 */
export function proxy(peticion: NextRequest) {
  const { pathname } = peticion.nextUrl;
  const haySesion = Boolean(peticion.cookies.get(COOKIE_SESION)?.value);
  const esPublica = RUTAS_PUBLICAS.includes(pathname);

  if (!haySesion && !esPublica) {
    const destino = new URL("/login", peticion.url);
    if (pathname !== "/") destino.searchParams.set("siguiente", pathname);
    return NextResponse.redirect(destino);
  }
  if (haySesion && esPublica) {
    return NextResponse.redirect(new URL("/dashboard", peticion.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon|.*\\..*).*)"],
};
