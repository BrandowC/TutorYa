import { errorNoAutenticado } from '../../compartido/dominio/errores.js';
import { aPublico, type Actor, type UsuarioPublico } from '../dominio/usuario.js';
import type { UsuarioRepositorio } from './puertos.js';

/** Devuelve el perfil del usuario autenticado (sirve para validar la sesión). */
export class ObtenerPerfil {
  constructor(private readonly usuarios: UsuarioRepositorio) {}

  async ejecutar(actor: Actor): Promise<UsuarioPublico> {
    const usuario = await this.usuarios.buscarPorId(actor.id);
    if (!usuario) {
      throw errorNoAutenticado('SESION_INVALIDA', 'La sesión ya no es válida. Inicie sesión de nuevo.');
    }
    return aPublico(usuario);
  }
}
