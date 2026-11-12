import type {
  Asignatura,
  DatosRegistro,
  DisponibilidadDetalle,
  EstadoSesion,
  HorarioLibre,
  ResumenUsuario,
  SesionDetalle,
  Usuario,
} from "./tipos";

/**
 * Capa única de acceso HTTP desde el navegador. Todas las llamadas van al propio
 * Next.js (/api/...), que reenvía a NestJS con la sesión; el navegador nunca ve
 * el token ni habla con la base de datos.
 */

export const MENSAJE_SIN_CONEXION = "No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.";
export const MENSAJE_SESION_EXPIRADA = "Su sesión expiró. Inicie sesión de nuevo.";
export const MENSAJE_ERROR_SERVIDOR = "Ocurrió un error en el servidor. Intente de nuevo en unos minutos.";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codigo?: string,
    readonly detalles: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface CuerpoError {
  codigo?: string;
  message?: string;
  detalles?: string[];
}

async function solicitar<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      ...init,
      cache: "no-store",
      headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
    });
  } catch {
    throw new ApiError(MENSAJE_SIN_CONEXION, 0);
  }

  if (respuesta.status === 204) return undefined as T;

  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (!respuesta.ok) {
    const error = (cuerpo ?? {}) as CuerpoError;
    if (error.codigo === "API_NO_DISPONIBLE") {
      throw new ApiError(MENSAJE_SIN_CONEXION, 0, error.codigo);
    }
    if (respuesta.status === 401 && error.codigo !== "CREDENCIALES_INVALIDAS") {
      throw new ApiError(MENSAJE_SESION_EXPIRADA, 401, error.codigo);
    }
    if (respuesta.status >= 500) {
      throw new ApiError(MENSAJE_ERROR_SERVIDOR, respuesta.status, error.codigo);
    }
    throw new ApiError(
      error.message ?? "No se pudo completar la operación.",
      respuesta.status,
      error.codigo,
      error.detalles ?? [],
    );
  }
  return cuerpo as T;
}

const json = (datos: unknown): RequestInit => ({ body: JSON.stringify(datos) });

export const api = {
  iniciarSesion: (correo: string, password: string) =>
    solicitar<{ usuario: Usuario }>("/auth/login", { method: "POST", ...json({ correo, password }) }),
  registrar: (datos: DatosRegistro) => solicitar<Usuario>("/auth/registro", { method: "POST", ...json(datos) }),
  cerrarSesion: () => solicitar<void>("/auth/logout", { method: "POST" }),

  listarAsignaturas: () => solicitar<Asignatura[]>("/asignaturas"),

  crearDisponibilidad: (datos: { asignaturaId: number; inicio: string; fin: string }) =>
    solicitar<{ id: string }>("/disponibilidades", { method: "POST", ...json(datos) }),
  misDisponibilidades: () => solicitar<DisponibilidadDetalle[]>("/disponibilidades/mias"),

  buscarTutores: (filtro: { asignaturaId?: number; desde?: string; hasta?: string }) => {
    const parametros = new URLSearchParams();
    if (filtro.asignaturaId) parametros.set("asignaturaId", String(filtro.asignaturaId));
    if (filtro.desde) parametros.set("desde", filtro.desde);
    if (filtro.hasta) parametros.set("hasta", filtro.hasta);
    const consulta = parametros.toString();
    return solicitar<HorarioLibre[]>(`/tutores/disponibles${consulta ? `?${consulta}` : ""}`);
  },

  solicitarSesion: (disponibilidadId: string) =>
    solicitar<{ id: string }>("/sesiones", { method: "POST", ...json({ disponibilidadId }) }),
  misSesiones: (estado?: EstadoSesion) =>
    solicitar<SesionDetalle[]>(`/sesiones/mias${estado ? `?estado=${estado}` : ""}`),
  resumen: () => solicitar<ResumenUsuario>("/sesiones/resumen"),
  confirmarSesion: (id: string) => solicitar<unknown>(`/sesiones/${id}/confirmar`, { method: "PATCH" }),
  rechazarSesion: (id: string) => solicitar<unknown>(`/sesiones/${id}/rechazar`, { method: "PATCH" }),
  cancelarSesion: (id: string, motivo: string) =>
    solicitar<unknown>(`/sesiones/${id}/cancelar`, { method: "PATCH", ...json({ motivo }) }),
  registrarEstadoFinal: (id: string, estado: "REALIZADA" | "NO_ASISTIO") =>
    solicitar<unknown>(`/sesiones/${id}/estado-final`, { method: "PATCH", ...json({ estado }) }),
  calificarSesion: (id: string, puntaje: number, comentario?: string) =>
    solicitar<unknown>(`/sesiones/${id}/calificacion`, { method: "POST", ...json({ puntaje, comentario }) }),
};

export type Api = typeof api;
