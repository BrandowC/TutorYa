import type { Rol } from '../../acceso/dominio/usuario.js';
import type { EstadoSesion, Sesion } from '../dominio/sesion.js';

export interface NuevaSesion {
  disponibilidadId: string;
  tutorId: string;
  estudianteId: string;
  asignaturaId: number;
  inicio: Date;
  fin: Date;
}

export interface Calificacion {
  id: string;
  sesionId: string;
  estudianteId: string;
  puntaje: number;
  comentario: string | null;
}

/** Sesión con los datos que necesita la pantalla (nombres, asignatura, calificación). */
export interface SesionDetalle {
  id: string;
  estado: EstadoSesion;
  inicio: Date;
  fin: Date;
  motivoCancelacion: string | null;
  asignatura: { id: number; nombre: string };
  tutor: { id: string; nombres: string };
  estudiante: { id: string; nombres: string };
  calificacion: { puntaje: number; comentario: string | null } | null;
}

export interface ResumenUsuario {
  rol: Rol;
  porEstado: Record<EstadoSesion, number>;
  /** Tutor: horarios libres publicados. Estudiante: sesiones realizadas sin calificar. */
  indicadorEspecifico: number;
  proximas: SesionDetalle[];
}

/** Puerto de salida: persistencia de sesiones y calificaciones. */
export abstract class SesionRepositorio {
  abstract crear(datos: NuevaSesion): Promise<Sesion>;
  abstract buscarPorId(id: string): Promise<Sesion | null>;
  abstract actualizar(sesion: Sesion): Promise<Sesion>;
  abstract hayActivaEnDisponibilidad(disponibilidadId: string): Promise<boolean>;
  abstract confirmadasDelTutor(tutorId: string): Promise<Sesion[]>;
  abstract listarPorUsuario(usuarioId: string, rol: Rol, estado?: EstadoSesion): Promise<SesionDetalle[]>;
  abstract obtenerResumen(usuarioId: string, rol: Rol, desde: Date): Promise<ResumenUsuario>;
  abstract buscarCalificacion(sesionId: string): Promise<Calificacion | null>;
  abstract crearCalificacion(datos: {
    sesionId: string;
    estudianteId: string;
    puntaje: number;
    comentario: string | null;
  }): Promise<Calificacion>;
}
