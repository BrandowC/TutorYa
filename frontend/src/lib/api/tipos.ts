export type Rol = "ESTUDIANTE" | "TUTOR";

export type EstadoSesion = "SOLICITADA" | "CONFIRMADA" | "RECHAZADA" | "CANCELADA" | "REALIZADA" | "NO_ASISTIO";

export interface Usuario {
  id: string;
  nombres: string;
  correo: string;
  programa: string;
  rol: Rol;
  createdAt: string;
}

export interface Asignatura {
  id: number;
  nombre: string;
  activa: boolean;
}

export interface DisponibilidadDetalle {
  id: string;
  asignatura: { id: number; nombre: string };
  inicio: string;
  fin: string;
  reservada: boolean;
}

export interface HorarioLibre {
  disponibilidadId: string;
  tutor: { id: string; nombres: string; programa: string };
  asignatura: { id: number; nombre: string };
  inicio: string;
  fin: string;
}

export interface SesionDetalle {
  id: string;
  estado: EstadoSesion;
  inicio: string;
  fin: string;
  motivoCancelacion: string | null;
  asignatura: { id: number; nombre: string };
  tutor: { id: string; nombres: string };
  estudiante: { id: string; nombres: string };
  calificacion: { puntaje: number; comentario: string | null } | null;
}

export interface ResumenUsuario {
  rol: Rol;
  porEstado: Record<EstadoSesion, number>;
  indicadorEspecifico: number;
  proximas: SesionDetalle[];
}

export interface DatosRegistro {
  nombres: string;
  correo: string;
  programa: string;
  rol: Rol;
  password: string;
}
