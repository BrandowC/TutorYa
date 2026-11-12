import type { Actor, Rol, Usuario } from '../dominio/usuario.js';

export interface NuevoUsuario {
  nombres: string;
  correo: string;
  programa: string;
  rol: Rol;
  passwordHash: string;
}

/** Puerto de salida: persistencia de usuarios. */
export abstract class UsuarioRepositorio {
  abstract buscarPorCorreo(correo: string): Promise<Usuario | null>;
  abstract buscarPorId(id: string): Promise<Usuario | null>;
  abstract crear(datos: NuevoUsuario): Promise<Usuario>;
}

/** Puerto de salida: cifrado de contraseñas (SWR-SEC-001). */
export abstract class HashContrasena {
  abstract generar(password: string): Promise<string>;
  abstract comparar(password: string, hash: string): Promise<boolean>;
}

export interface TokenEmitido {
  token: string;
  expiraEnSegundos: number;
}

/** Puerto de salida: emisión y verificación del token de sesión. */
export abstract class EmisorToken {
  abstract emitir(actor: Actor): Promise<TokenEmitido>;
  /** Devuelve el actor o null si el token es inválido o expiró. */
  abstract verificar(token: string): Promise<Actor | null>;
}
