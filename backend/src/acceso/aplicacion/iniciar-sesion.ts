import {
  errorDeValidacion,
  errorNoAutenticado,
} from '../../compartido/dominio/errores.js';
import type { Registro } from '../../compartido/aplicacion/registro.puerto.js';
import { normalizarCorreo } from '../dominio/reglas-acceso.js';
import { aPublico, type UsuarioPublico } from '../dominio/usuario.js';
import type { EmisorToken, HashContrasena, UsuarioRepositorio } from './puertos.js';

const CONTEXTO = 'AccesoService';

/** Hash de relleno: se compara aunque el correo no exista para igualar tiempos de respuesta. */
const HASH_RELLENO = '$2b$10$rCjXs4NgIL9KBWgAXkKK9el04ivpjo.8WihJO4M5onEha3nXx/mhq';

export interface ResultadoInicioSesion {
  accessToken: string;
  expiraEnSegundos: number;
  usuario: UsuarioPublico;
}

/** Oculta parte del correo para que los logs no guarden datos personales completos. */
export function enmascararCorreo(correo: string): string {
  const [local = '', dominio = ''] = correo.split('@');
  return `${local.slice(0, 1)}***@${dominio}`;
}

/** SWR-AUTH-001 y SWR-AUTH-002. */
export class IniciarSesion {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly hash: HashContrasena,
    private readonly emisor: EmisorToken,
    private readonly registro: Registro,
  ) {}

  async ejecutar(correoIngresado: string, password: string): Promise<ResultadoInicioSesion> {
    const correo = normalizarCorreo(correoIngresado);
    if (!correo || !password) {
      this.registro.warn(CONTEXTO, 'LOGIN_REJECTED', 'Inicio de sesión sin datos completos', {
        motivo: 'DATOS_INCOMPLETOS',
      });
      throw errorDeValidacion('LOGIN_INCOMPLETO', 'Ingrese su correo y su contraseña.');
    }

    const usuario = await this.usuarios.buscarPorCorreo(correo);
    const coincide = await this.hash.comparar(password, usuario?.passwordHash ?? HASH_RELLENO);

    // SWR-AUTH-002: la respuesta no revela cuál de los dos datos falló.
    if (!usuario || !coincide) {
      this.registro.warn(CONTEXTO, 'LOGIN_FAILED', 'Credenciales inválidas', {
        correo: enmascararCorreo(correo),
        motivo: usuario ? 'PASSWORD_INCORRECTA' : 'USUARIO_INEXISTENTE',
      });
      throw errorNoAutenticado('CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
    }

    const { token, expiraEnSegundos } = await this.emisor.emitir({ id: usuario.id, rol: usuario.rol });
    this.registro.info(CONTEXTO, 'LOGIN_SUCCESS', 'Inicio de sesión correcto', {
      userId: usuario.id,
      rol: usuario.rol,
    });
    return { accessToken: token, expiraEnSegundos, usuario: aPublico(usuario) };
  }
}
