import {
  errorDeConflicto,
  errorDeValidacion,
  errorProhibido,
} from '../../compartido/dominio/errores.js';
import type { PoliticaDeTiempo } from '../../compartido/dominio/reloj.js';
import { haySolapamiento } from '../../disponibilidad/dominio/bloque-horario.js';

export type EstadoSesion =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'RECHAZADA'
  | 'CANCELADA'
  | 'REALIZADA'
  | 'NO_ASISTIO';

/** Estados en los que la sesión ocupa el horario del tutor. */
export const ESTADOS_ACTIVOS: readonly EstadoSesion[] = ['SOLICITADA', 'CONFIRMADA'];

export interface Sesion {
  id: string;
  disponibilidadId: string;
  tutorId: string;
  estudianteId: string;
  asignaturaId: number;
  inicio: Date;
  fin: Date;
  estado: EstadoSesion;
  motivoCancelacion: string | null;
}

export const MOTIVO_MINIMO = 5;
export const MOTIVO_MAXIMO = 300;
export const PUNTAJE_MINIMO = 1;
export const PUNTAJE_MAXIMO = 5;
export const COMENTARIO_MAXIMO = 300;

function exigirEstado(sesion: Sesion, esperados: EstadoSesion[], accion: string): void {
  if (!esperados.includes(sesion.estado)) {
    throw errorDeConflicto(
      'ESTADO_INVALIDO',
      `No se puede ${accion} una sesión en estado ${sesion.estado}.`,
    );
  }
}

function exigirTutorDeLaSesion(sesion: Sesion, tutorId: string): void {
  if (sesion.tutorId !== tutorId) {
    throw errorProhibido('NO_ES_SU_SESION', 'Esta sesión pertenece a otro tutor.');
  }
}

/** Solicitar es posible mientras el bloque empiece en el futuro (salvo modo demostración). */
export function validarSolicitud(inicio: Date, ahora: Date, politica: PoliticaDeTiempo): void {
  if (!politica.permitirHorariosPasados && inicio <= ahora) {
    throw errorDeValidacion('HORARIO_YA_INICIO', 'No se puede solicitar un horario que ya comenzó.');
  }
}

/**
 * SWR-AGEN-003 y SWR-AGEN-005: el tutor confirma una solicitud pendiente y el
 * sistema impide dos sesiones confirmadas que se superpongan.
 */
export function confirmar(
  sesion: Sesion,
  tutorId: string,
  confirmadasDelTutor: Sesion[],
): Sesion {
  exigirTutorDeLaSesion(sesion, tutorId);
  exigirEstado(sesion, ['SOLICITADA'], 'confirmar');
  const choca = confirmadasDelTutor.some(
    (otra) => otra.id !== sesion.id && otra.estado === 'CONFIRMADA' && haySolapamiento(otra, sesion),
  );
  if (choca) {
    throw errorDeConflicto('SESIONES_SUPERPUESTAS', 'Ya tiene una sesión confirmada en ese horario.');
  }
  return { ...sesion, estado: 'CONFIRMADA' };
}

/** SWR-AGEN-003: el tutor rechaza una solicitud pendiente. */
export function rechazar(sesion: Sesion, tutorId: string): Sesion {
  exigirTutorDeLaSesion(sesion, tutorId);
  exigirEstado(sesion, ['SOLICITADA'], 'rechazar');
  return { ...sesion, estado: 'RECHAZADA' };
}

/**
 * SWR-AGEN-004: cualquiera de las partes cancela antes de la fecha programada,
 * indicando el motivo (5 a 300 caracteres).
 */
export function cancelar(
  sesion: Sesion,
  actorId: string,
  motivo: string,
  ahora: Date,
  politica: PoliticaDeTiempo,
): Sesion {
  if (actorId !== sesion.tutorId && actorId !== sesion.estudianteId) {
    throw errorProhibido('NO_ES_SU_SESION', 'Solo el tutor o el estudiante de la sesión pueden cancelarla.');
  }
  exigirEstado(sesion, ['SOLICITADA', 'CONFIRMADA'], 'cancelar');
  const limpio = motivo.trim();
  if (limpio.length < MOTIVO_MINIMO || limpio.length > MOTIVO_MAXIMO) {
    throw errorDeValidacion(
      'MOTIVO_INVALIDO',
      `El motivo de cancelación debe tener entre ${MOTIVO_MINIMO} y ${MOTIVO_MAXIMO} caracteres.`,
    );
  }
  if (!politica.permitirHorariosPasados && sesion.inicio <= ahora) {
    throw errorDeConflicto('SESION_YA_INICIO', 'No se puede cancelar una sesión que ya comenzó.');
  }
  return { ...sesion, estado: 'CANCELADA', motivoCancelacion: limpio };
}

/** SWR-CAL-001: el tutor registra el estado final una vez cumplida la fecha programada. */
export function registrarEstadoFinal(
  sesion: Sesion,
  tutorId: string,
  estadoFinal: string,
  ahora: Date,
): Sesion {
  exigirTutorDeLaSesion(sesion, tutorId);
  if (estadoFinal !== 'REALIZADA' && estadoFinal !== 'NO_ASISTIO') {
    throw errorDeValidacion('ESTADO_FINAL_INVALIDO', 'El estado final debe ser REALIZADA o NO_ASISTIO.');
  }
  exigirEstado(sesion, ['CONFIRMADA'], 'cerrar');
  if (sesion.inicio > ahora) {
    throw errorDeConflicto('SESION_AUN_NO_OCURRE', 'La sesión todavía no ha ocurrido.');
  }
  return { ...sesion, estado: estadoFinal };
}

export interface DatosCalificacion {
  puntaje: number;
  comentario?: string;
}

/**
 * SWR-CAL-002 y SWR-CAL-003: solo el estudiante de la sesión califica, con un
 * entero de 1 a 5, y solo si la sesión fue marcada como realizada.
 */
export function validarCalificacion(
  sesion: Sesion,
  estudianteId: string,
  datos: DatosCalificacion,
): void {
  if (sesion.estudianteId !== estudianteId) {
    throw errorProhibido('NO_ES_SU_SESION', 'Solo el estudiante de la sesión puede calificarla.');
  }
  if (sesion.estado !== 'REALIZADA') {
    throw errorDeConflicto('SESION_NO_REALIZADA', 'Solo se pueden calificar sesiones marcadas como realizadas.');
  }
  if (!Number.isInteger(datos.puntaje) || datos.puntaje < PUNTAJE_MINIMO || datos.puntaje > PUNTAJE_MAXIMO) {
    throw errorDeValidacion(
      'PUNTAJE_INVALIDO',
      `El puntaje debe ser un número entero entre ${PUNTAJE_MINIMO} y ${PUNTAJE_MAXIMO}.`,
    );
  }
  if ((datos.comentario?.trim().length ?? 0) > COMENTARIO_MAXIMO) {
    throw errorDeValidacion('COMENTARIO_LARGO', `El comentario no puede superar ${COMENTARIO_MAXIMO} caracteres.`);
  }
}
