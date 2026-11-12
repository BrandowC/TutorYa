import { describe, expect, it } from 'vitest';
import { ErrorDeDominio } from '../../compartido/dominio/errores.js';
import {
  exigirRol,
  normalizarCorreo,
  validarContrasena,
  validarRegistro,
} from './reglas-acceso.js';

const registroValido = {
  nombres: 'Camila Torres',
  correo: '  Camila.Torres@Correo.COM ',
  programa: 'Ingeniería de Sistemas',
  rol: 'ESTUDIANTE',
  password: 'Segura123',
};

describe('SWR-AUTH-007 · normalización de correo', () => {
  it('ignora mayúsculas y espacios para que "A@x.com" y "a@x.com" sean la misma cuenta', () => {
    expect(normalizarCorreo('  Camila@Correo.COM ')).toBe('camila@correo.com');
  });
});

describe('SWR-AUTH-006 · contraseña (RN-06)', () => {
  it('acepta 8 caracteres con letras y números (límite inferior)', () => {
    expect(validarContrasena('abcdef12')).toEqual([]);
  });

  it('rechaza 7 caracteres aunque tenga letras y números (frontera)', () => {
    expect(validarContrasena('abcde12')).toHaveLength(1);
  });

  it('rechaza una contraseña solo con letras', () => {
    expect(validarContrasena('abcdefghij')).toContain('La contraseña debe incluir letras y números.');
  });

  it('rechaza una contraseña solo con números', () => {
    expect(validarContrasena('1234567890')).toContain('La contraseña debe incluir letras y números.');
  });

  it('rechaza más de 72 bytes, que bcrypt ignoraría en silencio', () => {
    expect(validarContrasena('a1'.repeat(37))).toContain('La contraseña no puede superar 72 caracteres.');
  });
});

describe('SWR-AUTH-006 · validación del registro', () => {
  it('devuelve los datos normalizados cuando todo es válido', () => {
    expect(validarRegistro(registroValido)).toEqual({
      nombres: 'Camila Torres',
      correo: 'camila.torres@correo.com',
      programa: 'Ingeniería de Sistemas',
      rol: 'ESTUDIANTE',
    });
  });

  it('reúne todos los problemas en una sola respuesta', () => {
    try {
      validarRegistro({ nombres: 'A', correo: 'x', programa: 'S', rol: 'ADMIN', password: 'corta' });
      expect.unreachable('debía lanzar un error de validación');
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorDeDominio);
      expect((error as ErrorDeDominio).tipo).toBe('VALIDACION');
      expect((error as ErrorDeDominio).detalles.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('no permite registrarse con un rol distinto de ESTUDIANTE o TUTOR', () => {
    expect(() => validarRegistro({ ...registroValido, rol: 'COORDINADOR' })).toThrow(ErrorDeDominio);
  });
});

describe('SWR-AUTH-004 · autorización por rol', () => {
  it('deja pasar al rol correcto', () => {
    expect(() => exigirRol({ id: '1', rol: 'TUTOR' }, 'TUTOR')).not.toThrow();
  });

  it('rechaza a un estudiante en una operación de tutor', () => {
    expect(() => exigirRol({ id: '1', rol: 'ESTUDIANTE' }, 'TUTOR')).toThrowError(/solo para usuarios con rol TUTOR/);
  });
});
