import { describe, expect, it } from 'vitest';
import {
  cancelar,
  confirmar,
  rechazar,
  registrarEstadoFinal,
  validarCalificacion,
  type Sesion,
} from './sesion.js';

const ESTRICTA = { permitirHorariosPasados: false };
const AHORA = new Date('2026-11-10T12:00:00Z');

function sesion(sobrescribir: Partial<Sesion> = {}): Sesion {
  return {
    id: 's1',
    disponibilidadId: 'd1',
    tutorId: 'tutor-1',
    estudianteId: 'est-1',
    asignaturaId: 1,
    inicio: new Date('2026-11-11T14:00:00Z'),
    fin: new Date('2026-11-11T15:00:00Z'),
    estado: 'SOLICITADA',
    motivoCancelacion: null,
    ...sobrescribir,
  };
}

describe('SWR-AGEN-003 / SWR-AGEN-005 · confirmar y rechazar', () => {
  it('confirma una solicitud pendiente del propio tutor', () => {
    expect(confirmar(sesion(), 'tutor-1', []).estado).toBe('CONFIRMADA');
  });

  it('impide confirmar si ya hay otra sesión confirmada que se cruza', () => {
    const otra = sesion({
      id: 's2',
      estado: 'CONFIRMADA',
      inicio: new Date('2026-11-11T14:30:00Z'),
      fin: new Date('2026-11-11T15:30:00Z'),
    });
    expect(() => confirmar(sesion(), 'tutor-1', [otra])).toThrowError(/sesión confirmada en ese horario/);
  });

  it('permite confirmar sesiones consecutivas (sin cruce)', () => {
    const anterior = sesion({
      id: 's2',
      estado: 'CONFIRMADA',
      inicio: new Date('2026-11-11T13:00:00Z'),
      fin: new Date('2026-11-11T14:00:00Z'),
    });
    expect(confirmar(sesion(), 'tutor-1', [anterior]).estado).toBe('CONFIRMADA');
  });

  it('impide que otro tutor confirme una sesión ajena', () => {
    expect(() => confirmar(sesion(), 'tutor-2', [])).toThrowError(/pertenece a otro tutor/);
  });

  it('no se puede confirmar dos veces', () => {
    expect(() => confirmar(sesion({ estado: 'CONFIRMADA' }), 'tutor-1', [])).toThrowError(/estado CONFIRMADA/);
  });

  it('rechaza una solicitud pendiente', () => {
    expect(rechazar(sesion(), 'tutor-1').estado).toBe('RECHAZADA');
  });
});

describe('SWR-AGEN-004 · cancelar con motivo', () => {
  it('cancela antes de la fecha, guardando el motivo sin espacios sobrantes', () => {
    const resultado = cancelar(sesion(), 'est-1', '  Tengo un parcial  ', AHORA, ESTRICTA);
    expect(resultado).toMatchObject({ estado: 'CANCELADA', motivoCancelacion: 'Tengo un parcial' });
  });

  it('permite que el tutor también cancele', () => {
    expect(cancelar(sesion({ estado: 'CONFIRMADA' }), 'tutor-1', 'Me enfermé', AHORA, ESTRICTA).estado).toBe('CANCELADA');
  });

  it('rechaza un motivo de 4 caracteres y acepta uno de 5 (frontera)', () => {
    expect(() => cancelar(sesion(), 'est-1', 'abcd', AHORA, ESTRICTA)).toThrowError(/entre 5 y 300/);
    expect(cancelar(sesion(), 'est-1', 'abcde', AHORA, ESTRICTA).estado).toBe('CANCELADA');
  });

  it('rechaza un motivo de 301 caracteres', () => {
    expect(() => cancelar(sesion(), 'est-1', 'a'.repeat(301), AHORA, ESTRICTA)).toThrowError(/entre 5 y 300/);
  });

  it('no deja cancelar una sesión que ya comenzó', () => {
    const iniciada = sesion({ inicio: new Date('2026-11-10T11:00:00Z'), fin: new Date('2026-11-10T12:30:00Z') });
    expect(() => cancelar(iniciada, 'est-1', 'Motivo válido', AHORA, ESTRICTA)).toThrowError(/ya comenzó/);
  });

  it('no deja cancelar a una persona ajena a la sesión', () => {
    expect(() => cancelar(sesion(), 'otro-usuario', 'Motivo válido', AHORA, ESTRICTA)).toThrowError(/Solo el tutor o el estudiante/);
  });

  it('no deja cancelar una sesión ya realizada', () => {
    expect(() => cancelar(sesion({ estado: 'REALIZADA' }), 'est-1', 'Motivo válido', AHORA, ESTRICTA)).toThrowError(/estado REALIZADA/);
  });
});

describe('SWR-CAL-001 · estado final de la sesión', () => {
  const pasada = sesion({
    estado: 'CONFIRMADA',
    inicio: new Date('2026-11-10T09:00:00Z'),
    fin: new Date('2026-11-10T10:00:00Z'),
  });

  it('marca como realizada una sesión confirmada cuya hora ya llegó', () => {
    expect(registrarEstadoFinal(pasada, 'tutor-1', 'REALIZADA', AHORA).estado).toBe('REALIZADA');
  });

  it('permite marcar «no asistió»', () => {
    expect(registrarEstadoFinal(pasada, 'tutor-1', 'NO_ASISTIO', AHORA).estado).toBe('NO_ASISTIO');
  });

  it('acepta cerrar exactamente en la hora de inicio (frontera)', () => {
    const justoAhora = sesion({ estado: 'CONFIRMADA', inicio: AHORA, fin: new Date('2026-11-10T13:00:00Z') });
    expect(registrarEstadoFinal(justoAhora, 'tutor-1', 'REALIZADA', AHORA).estado).toBe('REALIZADA');
  });

  it('rechaza cerrar una sesión que aún no ocurre', () => {
    const futura = sesion({ estado: 'CONFIRMADA' });
    expect(() => registrarEstadoFinal(futura, 'tutor-1', 'REALIZADA', AHORA)).toThrowError(/todavía no ha ocurrido/);
  });

  it('rechaza cerrar una sesión que nunca fue confirmada', () => {
    expect(() => registrarEstadoFinal(sesion({ estado: 'SOLICITADA', inicio: new Date('2026-11-10T09:00:00Z') }), 'tutor-1', 'REALIZADA', AHORA)).toThrowError(/estado SOLICITADA/);
  });

  it('rechaza estados finales inventados', () => {
    expect(() => registrarEstadoFinal(pasada, 'tutor-1', 'CANCELADA', AHORA)).toThrowError(/REALIZADA o NO_ASISTIO/);
  });
});

describe('SWR-CAL-002 / SWR-CAL-003 · calificación', () => {
  const realizada = sesion({ estado: 'REALIZADA' });

  it.each([1, 5])('acepta el puntaje límite %i', (puntaje) => {
    expect(() => validarCalificacion(realizada, 'est-1', { puntaje })).not.toThrow();
  });

  it.each([0, 6, 3.5, -1])('rechaza el puntaje %s', (puntaje) => {
    expect(() => validarCalificacion(realizada, 'est-1', { puntaje })).toThrowError(/entero entre 1 y 5/);
  });

  it('impide calificar una sesión que no fue realizada', () => {
    expect(() => validarCalificacion(sesion({ estado: 'CONFIRMADA' }), 'est-1', { puntaje: 5 })).toThrowError(
      /marcadas como realizadas/,
    );
  });

  it('impide que otro estudiante califique la sesión', () => {
    expect(() => validarCalificacion(realizada, 'otro', { puntaje: 5 })).toThrowError(/Solo el estudiante de la sesión/);
  });

  it('rechaza comentarios de más de 300 caracteres', () => {
    expect(() => validarCalificacion(realizada, 'est-1', { puntaje: 4, comentario: 'x'.repeat(301) })).toThrowError(/300/);
  });
});
