import { describe, expect, it, vi } from 'vitest';
import { Registro, type Metadatos } from '../../compartido/aplicacion/registro.puerto.js';
import type { Actor, Usuario } from '../dominio/usuario.js';
import { IniciarSesion, enmascararCorreo } from './iniciar-sesion.js';
import { EmisorToken, HashContrasena, UsuarioRepositorio } from './puertos.js';

const usuario: Usuario = {
  id: 'u1',
  nombres: 'Laura Gómez',
  correo: 'laura@tutorapp.test',
  programa: 'Sistemas',
  rol: 'TUTOR',
  passwordHash: 'hash:Prueba123!',
  createdAt: new Date('2026-11-01T00:00:00Z'),
};

class UsuariosFalsos extends UsuarioRepositorio {
  buscarPorCorreo = vi.fn(async (correo: string) => (correo === usuario.correo ? usuario : null));
  buscarPorId = vi.fn(async () => usuario);
  crear = vi.fn();
}

class HashFalso extends HashContrasena {
  async generar(password: string) {
    return `hash:${password}`;
  }
  async comparar(password: string, hash: string) {
    return hash === `hash:${password}`;
  }
}

class EmisorFalso extends EmisorToken {
  emitir = vi.fn(async (actor: Actor) => ({ token: `token-de-${actor.id}`, expiraEnSegundos: 1800 }));
  verificar = vi.fn(async () => null);
}

class RegistroEspia extends Registro {
  eventos: { nivel: string; evento: string; metadatos?: Metadatos }[] = [];
  info(_c: string, evento: string, _m: string, metadatos?: Metadatos) {
    this.eventos.push({ nivel: 'INFO', evento, metadatos });
  }
  warn(_c: string, evento: string, _m: string, metadatos?: Metadatos) {
    this.eventos.push({ nivel: 'WARN', evento, metadatos });
  }
  error(_c: string, evento: string, _m: string, metadatos?: Metadatos) {
    this.eventos.push({ nivel: 'ERROR', evento, metadatos });
  }
}

function armar() {
  const registro = new RegistroEspia();
  const emisor = new EmisorFalso();
  const caso = new IniciarSesion(new UsuariosFalsos(), new HashFalso(), emisor, registro);
  return { caso, registro, emisor };
}

describe('SWR-AUTH-001 · inicio de sesión correcto', () => {
  it('entrega token y usuario público (sin hash) y deja un log INFO', async () => {
    const { caso, registro } = armar();
    const resultado = await caso.ejecutar('  LAURA@tutorapp.test ', 'Prueba123!');

    expect(resultado.accessToken).toBe('token-de-u1');
    expect(resultado.usuario).not.toHaveProperty('passwordHash');
    expect(registro.eventos.at(-1)).toMatchObject({ nivel: 'INFO', evento: 'LOGIN_SUCCESS' });
  });
});

describe('SWR-AUTH-002 · credenciales inválidas', () => {
  it('rechaza una contraseña incorrecta con un mensaje genérico', async () => {
    const { caso } = armar();
    await expect(caso.ejecutar('laura@tutorapp.test', 'incorrecta')).rejects.toMatchObject({
      tipo: 'NO_AUTENTICADO',
      codigo: 'CREDENCIALES_INVALIDAS',
      message: 'Correo o contraseña incorrectos.',
    });
  });

  it('responde exactamente igual cuando el correo no existe (no revela cuál dato falló)', async () => {
    const { caso } = armar();
    const conPasswordMala = await caso.ejecutar('laura@tutorapp.test', 'mala').catch((e) => e);
    const conCorreoInexistente = await caso.ejecutar('nadie@tutorapp.test', 'mala').catch((e) => e);
    expect(conCorreoInexistente.message).toBe(conPasswordMala.message);
    expect(conCorreoInexistente.codigo).toBe(conPasswordMala.codigo);
  });

  it('registra un WARN sin contraseña y con el correo enmascarado', async () => {
    const { caso, registro } = armar();
    await caso.ejecutar('laura@tutorapp.test', 'ContraseñaSecreta9').catch(() => undefined);

    const evento = registro.eventos.at(-1);
    expect(evento).toMatchObject({ nivel: 'WARN', evento: 'LOGIN_FAILED' });
    const serializado = JSON.stringify(evento);
    expect(serializado).not.toContain('ContraseñaSecreta9');
    expect(serializado).not.toContain('laura@tutorapp.test');
    expect(serializado).toContain('l***@tutorapp.test');
  });

  it('exige correo y contraseña antes de consultar la base', async () => {
    const { caso, emisor } = armar();
    await expect(caso.ejecutar('', '')).rejects.toMatchObject({ tipo: 'VALIDACION' });
    expect(emisor.emitir).not.toHaveBeenCalled();
  });
});

describe('enmascararCorreo', () => {
  it('deja visible solo la primera letra y el dominio', () => {
    expect(enmascararCorreo('camila@correo.com')).toBe('c***@correo.com');
  });
});
