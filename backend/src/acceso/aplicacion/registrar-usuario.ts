import { errorDeConflicto } from '../../compartido/dominio/errores.js';
import type { Registro } from '../../compartido/aplicacion/registro.puerto.js';
import { validarRegistro, type DatosRegistro } from '../dominio/reglas-acceso.js';
import { aPublico, type UsuarioPublico } from '../dominio/usuario.js';
import type { HashContrasena, UsuarioRepositorio } from './puertos.js';

const CONTEXTO = 'AccesoService';

/** SWR-AUTH-006, SWR-AUTH-007 y SWR-SEC-001. */
export class RegistrarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly hash: HashContrasena,
    private readonly registro: Registro,
  ) {}

  async ejecutar(datos: DatosRegistro): Promise<UsuarioPublico> {
    let validado;
    try {
      validado = validarRegistro(datos);
    } catch (error) {
      this.registro.warn(CONTEXTO, 'REGISTRATION_REJECTED', 'Registro con datos inválidos', {
        motivo: 'VALIDACION',
      });
      throw error;
    }

    if (await this.usuarios.buscarPorCorreo(validado.correo)) {
      this.registro.warn(CONTEXTO, 'REGISTRATION_REJECTED', 'Correo ya registrado', {
        motivo: 'CORREO_DUPLICADO',
      });
      throw errorDeConflicto('CORREO_DUPLICADO', 'Ya existe una cuenta con ese correo electrónico.');
    }

    const passwordHash = await this.hash.generar(datos.password);
    const usuario = await this.usuarios.crear({ ...validado, passwordHash });
    this.registro.info(CONTEXTO, 'USER_REGISTERED', 'Usuario registrado', {
      userId: usuario.id,
      rol: usuario.rol,
    });
    return aPublico(usuario);
  }
}
