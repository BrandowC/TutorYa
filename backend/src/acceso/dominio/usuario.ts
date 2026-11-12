export type Rol = 'ESTUDIANTE' | 'TUTOR';

export const ROLES: readonly Rol[] = ['ESTUDIANTE', 'TUTOR'];

export interface Usuario {
  id: string;
  nombres: string;
  correo: string;
  programa: string;
  rol: Rol;
  passwordHash: string;
  createdAt: Date;
}

/** Lo que se puede mostrar o enviar al cliente: nunca incluye el hash. */
export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;

export function aPublico(usuario: Usuario): UsuarioPublico {
  const { passwordHash: _oculto, ...publico } = usuario;
  return publico;
}

/** Datos del usuario autenticado que viajan dentro del token. */
export interface Actor {
  id: string;
  rol: Rol;
}
