import { describe, expect, it } from 'vitest';
import { ErrorDeDominio } from '../../compartido/dominio/errores.js';
import { haySolapamiento, validarBloque } from './bloque-horario.js';

const AHORA = new Date('2026-11-10T12:00:00Z');
const ESTRICTA = { permitirHorariosPasados: false };
const DEMO = { permitirHorariosPasados: true };

const bloque = (inicio: string, minutos: number) => ({
  inicio: new Date(inicio),
  fin: new Date(new Date(inicio).getTime() + minutos * 60_000),
});

describe('SWR-DISP-001 · validarBloque', () => {
  it('acepta un bloque futuro de 60 minutos', () => {
    expect(() => validarBloque(bloque('2026-11-11T14:00:00Z', 60), AHORA, ESTRICTA)).not.toThrow();
  });

  it.each([30, 240])('acepta la duración límite de %i minutos', (minutos) => {
    expect(() => validarBloque(bloque('2026-11-11T14:00:00Z', minutos), AHORA, ESTRICTA)).not.toThrow();
  });

  it.each([29, 241])('rechaza %i minutos (justo fuera del rango 30–240)', (minutos) => {
    expect(() => validarBloque(bloque('2026-11-11T14:00:00Z', minutos), AHORA, ESTRICTA)).toThrowError(
      /entre 30 y 240 minutos/,
    );
  });

  it('rechaza un bloque cuyo fin no es posterior al inicio', () => {
    const invertido = { inicio: new Date('2026-11-11T15:00:00Z'), fin: new Date('2026-11-11T14:00:00Z') };
    expect(() => validarBloque(invertido, AHORA, ESTRICTA)).toThrow(ErrorDeDominio);
  });

  it('rechaza fechas inválidas', () => {
    expect(() => validarBloque({ inicio: new Date('no-es-fecha'), fin: AHORA }, AHORA, ESTRICTA)).toThrowError(
      /fechas del bloque no son válidas/,
    );
  });

  it('rechaza un bloque que ya empezó en modo normal', () => {
    expect(() => validarBloque(bloque('2026-11-10T12:00:00Z', 60), AHORA, ESTRICTA)).toThrowError(/futuras/);
  });

  it('permite un bloque pasado solo en modo demostración', () => {
    expect(() => validarBloque(bloque('2026-11-01T14:00:00Z', 60), AHORA, DEMO)).not.toThrow();
  });
});

describe('SWR-AGEN-005 · solapamiento de horarios', () => {
  it('detecta bloques que se cruzan', () => {
    expect(haySolapamiento(bloque('2026-11-11T14:00:00Z', 60), bloque('2026-11-11T14:30:00Z', 60))).toBe(true);
  });

  it('considera libres dos bloques consecutivos (el fin de uno es el inicio del otro)', () => {
    expect(haySolapamiento(bloque('2026-11-11T14:00:00Z', 60), bloque('2026-11-11T15:00:00Z', 60))).toBe(false);
  });

  it('detecta un bloque contenido dentro de otro', () => {
    expect(haySolapamiento(bloque('2026-11-11T14:00:00Z', 120), bloque('2026-11-11T14:30:00Z', 30))).toBe(true);
  });
});
