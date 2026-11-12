import { errorDeValidacion } from '../../compartido/dominio/errores.js';
import type { PoliticaDeTiempo } from '../../compartido/dominio/reloj.js';

export const DURACION_MINIMA_MINUTOS = 30;
export const DURACION_MAXIMA_MINUTOS = 240;

export interface BloqueHorario {
  inicio: Date;
  fin: Date;
}

const MS_POR_MINUTO = 60_000;

/** Dos bloques se superponen si cada uno empieza antes de que el otro termine. */
export function haySolapamiento(a: BloqueHorario, b: BloqueHorario): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

/**
 * SWR-DISP-001: un bloque válido tiene fechas reales, fin posterior al inicio,
 * duración entre 30 y 240 minutos y, salvo en modo demostración, está en el futuro.
 */
export function validarBloque(
  bloque: BloqueHorario,
  ahora: Date,
  politica: PoliticaDeTiempo,
): void {
  const { inicio, fin } = bloque;
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    throw errorDeValidacion('BLOQUE_FECHA_INVALIDA', 'Las fechas del bloque no son válidas.');
  }
  if (fin <= inicio) {
    throw errorDeValidacion('BLOQUE_RANGO_INVALIDO', 'La hora de fin debe ser posterior a la hora de inicio.');
  }
  const minutos = (fin.getTime() - inicio.getTime()) / MS_POR_MINUTO;
  if (minutos < DURACION_MINIMA_MINUTOS || minutos > DURACION_MAXIMA_MINUTOS) {
    throw errorDeValidacion(
      'BLOQUE_DURACION_INVALIDA',
      `El bloque debe durar entre ${DURACION_MINIMA_MINUTOS} y ${DURACION_MAXIMA_MINUTOS} minutos.`,
    );
  }
  if (!politica.permitirHorariosPasados && inicio <= ahora) {
    throw errorDeValidacion('BLOQUE_EN_EL_PASADO', 'El bloque debe iniciar en una fecha y hora futuras.');
  }
}
