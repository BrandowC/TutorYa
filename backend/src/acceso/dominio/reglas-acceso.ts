import {
  errorDeValidacion,
  errorProhibido,
} from '../../compartido/dominio/errores.js';
import { ROLES, type Actor, type Rol } from './usuario.js';

export interface DatosRegistro {
  nombres: string;
  correo: string;
  programa: string;
  rol: string;
  password: string;
}

export interface RegistroValidado {
  nombres: string;
  correo: string;
  programa: string;
  rol: Rol;
}

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_MINIMO_PASSWORD = 8;
/** bcrypt solo procesa los primeros 72 bytes; se rechaza lo que excede. */
const LARGO_MAXIMO_PASSWORD = 72;

/** SWR-AUTH-007: el correo se compara sin distinguir mayúsculas ni espacios. */
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export function esCorreoValido(correo: string): boolean {
  return PATRON_CORREO.test(correo) && correo.length <= 150;
}

/** Regla derivada de SWR-AUTH-006 (RN-06): 8 a 72 caracteres con letras y números. */
export function validarContrasena(password: string): string[] {
  const problemas: string[] = [];
  if (password.length < LARGO_MINIMO_PASSWORD) {
    problemas.push(`La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`);
  }
  if (Buffer.byteLength(password, 'utf8') > LARGO_MAXIMO_PASSWORD) {
    problemas.push(`La contraseña no puede superar ${LARGO_MAXIMO_PASSWORD} caracteres.`);
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    problemas.push('La contraseña debe incluir letras y números.');
  }
  return problemas;
}

/** SWR-AUTH-006: valida los datos del registro y devuelve la versión normalizada. */
export function validarRegistro(datos: DatosRegistro): RegistroValidado {
  const detalles: string[] = [];
  const nombres = datos.nombres.trim();
  const programa = datos.programa.trim();
  const correo = normalizarCorreo(datos.correo);

  if (nombres.length < 3 || nombres.length > 100) {
    detalles.push('Los nombres deben tener entre 3 y 100 caracteres.');
  }
  if (programa.length < 2 || programa.length > 100) {
    detalles.push('El programa académico debe tener entre 2 y 100 caracteres.');
  }
  if (!esCorreoValido(correo)) {
    detalles.push('El correo electrónico no es válido.');
  }
  if (!ROLES.includes(datos.rol as Rol)) {
    detalles.push('El rol debe ser ESTUDIANTE o TUTOR.');
  }
  detalles.push(...validarContrasena(datos.password));

  if (detalles.length > 0) {
    throw errorDeValidacion('REGISTRO_INVALIDO', 'Los datos del registro no son válidos.', detalles);
  }
  return { nombres, correo, programa, rol: datos.rol as Rol };
}

/** SWR-AUTH-004: solo el rol indicado puede ejecutar la operación. */
export function exigirRol(actor: Actor, rolRequerido: Rol): void {
  if (actor.rol !== rolRequerido) {
    throw errorProhibido(
      'ROL_NO_PERMITIDO',
      `Esta operación es solo para usuarios con rol ${rolRequerido}.`,
    );
  }
}
