import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client.js';
import { errorDeConflicto } from '../../compartido/dominio/errores.js';
import { CONFIG, type Configuracion } from '../../config/configuracion.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  EmisorToken,
  HashContrasena,
  UsuarioRepositorio,
  type NuevoUsuario,
  type TokenEmitido,
} from '../aplicacion/puertos.js';
import { ROLES, type Actor, type Usuario } from '../dominio/usuario.js';

@Injectable()
export class UsuarioPrismaRepositorio extends UsuarioRepositorio {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { correo } });
  }

  buscarPorId(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  async crear(datos: NuevoUsuario): Promise<Usuario> {
    try {
      return await this.prisma.usuario.create({ data: datos });
    } catch (error) {
      // Dos registros simultáneos con el mismo correo: gana el primero.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw errorDeConflicto('CORREO_DUPLICADO', 'Ya existe una cuenta con ese correo electrónico.');
      }
      throw error;
    }
  }
}

@Injectable()
export class HashBcrypt extends HashContrasena {
  constructor(@Inject(CONFIG) private readonly configuracion: Configuracion) {
    super();
  }

  generar(password: string): Promise<string> {
    return bcrypt.hash(password, this.configuracion.costoHash);
  }

  comparar(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

@Injectable()
export class EmisorJwt extends EmisorToken {
  private readonly jwt: JwtService;
  private readonly expiraEnSegundos: number;

  constructor(@Inject(CONFIG) configuracion: Configuracion) {
    super();
    this.expiraEnSegundos = configuracion.jwtExpiraMinutos * 60;
    this.jwt = new JwtService({
      secret: configuracion.jwtSecreto,
      signOptions: { expiresIn: this.expiraEnSegundos },
    });
  }

  async emitir(actor: Actor): Promise<TokenEmitido> {
    const token = await this.jwt.signAsync({ sub: actor.id, rol: actor.rol });
    return { token, expiraEnSegundos: this.expiraEnSegundos };
  }

  async verificar(token: string): Promise<Actor | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string; rol?: string }>(token);
      if (!payload.sub || !payload.rol || !ROLES.includes(payload.rol as Actor['rol'])) {
        return null;
      }
      return { id: payload.sub, rol: payload.rol as Actor['rol'] };
    } catch {
      return null;
    }
  }
}
