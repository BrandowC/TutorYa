export interface Disponibilidad {
  id: string;
  tutorId: string;
  asignaturaId: number;
  inicio: Date;
  fin: Date;
}

export interface NuevaDisponibilidad {
  tutorId: string;
  asignaturaId: number;
  inicio: Date;
  fin: Date;
}

/** Bloque del tutor con su asignatura y si ya tiene una sesión activa. */
export interface DisponibilidadDetalle {
  id: string;
  asignatura: { id: number; nombre: string };
  inicio: Date;
  fin: Date;
  reservada: boolean;
}

/** Resultado de búsqueda para el estudiante: un horario libre de un tutor. */
export interface HorarioLibre {
  disponibilidadId: string;
  tutor: { id: string; nombres: string; programa: string };
  asignatura: { id: number; nombre: string };
  inicio: Date;
  fin: Date;
}

export interface FiltroBusqueda {
  asignaturaId?: number;
  desde?: Date;
  hasta?: Date;
  /** Cuando existe, solo se devuelven horarios que empiezan después de esta fecha. */
  soloFuturosDesde?: Date;
  limite: number;
}

/** Puerto de salida: persistencia de la disponibilidad de los tutores. */
export abstract class DisponibilidadRepositorio {
  abstract crear(datos: NuevaDisponibilidad): Promise<Disponibilidad>;
  abstract buscarPorId(id: string): Promise<Disponibilidad | null>;
  abstract buscarSolapadas(tutorId: string, inicio: Date, fin: Date): Promise<Disponibilidad[]>;
  abstract listarPorTutor(tutorId: string): Promise<DisponibilidadDetalle[]>;
  abstract buscarLibres(filtro: FiltroBusqueda): Promise<HorarioLibre[]>;
}
