/** Configuración solo de servidor: la URL de la API nunca llega al navegador. */
export const API_URL = (process.env.API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

export const COOKIE_SESION = "tutorapp_token";

export const opcionesCookie = (maxAgeSegundos: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: maxAgeSegundos,
});
