import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  errorNoAutenticado,
  errorProhibido,
} from '../../compartido/dominio/errores.js';
import { EmisorToken } from '../aplicacion/puertos.js';
import type { Actor, Rol } from '../dominio/usuario.js';

const CLAVE_ROLES = 'roles';

/** Restringe una ruta a uno o más roles (SWR-AUTH-004). */
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);

/** Entrega el usuario autenticado al método del controlador. */
export const UsuarioActual = createParamDecorator((_dato: unknown, contexto: ExecutionContext): Actor => {
  return contexto.switchToHttp().getRequest().usuario;
});

/** Exige un token Bearer válido y no expirado; sin él, la ruta está protegida. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly emisor: EmisorToken) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const peticion = contexto.switchToHttp().getRequest();
    const encabezado: string | undefined = peticion.headers?.authorization;
    const [esquema, token] = encabezado?.split(' ') ?? [];
    if (esquema !== 'Bearer' || !token) {
      throw errorNoAutenticado('NO_AUTENTICADO', 'Debe iniciar sesión para continuar.');
    }
    const actor = await this.emisor.verificar(token);
    if (!actor) {
      throw errorNoAutenticado('TOKEN_INVALIDO', 'Su sesión expiró o no es válida. Inicie sesión de nuevo.');
    }
    peticion.usuario = actor;
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(CLAVE_ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!permitidos || permitidos.length === 0) return true;
    const actor: Actor | undefined = contexto.switchToHttp().getRequest().usuario;
    if (!actor || !permitidos.includes(actor.rol)) {
      throw errorProhibido('ROL_NO_PERMITIDO', 'Su rol no tiene permiso para esta operación.');
    }
    return true;
  }
}
