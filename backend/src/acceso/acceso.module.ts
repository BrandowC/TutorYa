import { Module } from '@nestjs/common';
import { Registro } from '../compartido/aplicacion/registro.puerto.js';
import { CompartidoModule } from '../compartido/compartido.module.js';
import { EmisorToken, HashContrasena, UsuarioRepositorio } from './aplicacion/puertos.js';
import { IniciarSesion } from './aplicacion/iniciar-sesion.js';
import { ObtenerPerfil } from './aplicacion/obtener-perfil.js';
import { RegistrarUsuario } from './aplicacion/registrar-usuario.js';
import { AccesoController } from './infraestructura/acceso.controller.js';
import {
  EmisorJwt,
  HashBcrypt,
  UsuarioPrismaRepositorio,
} from './infraestructura/adaptadores.js';
import { JwtAuthGuard, RolesGuard } from './infraestructura/guards.js';

@Module({
  imports: [CompartidoModule],
  controllers: [AccesoController],
  providers: [
    { provide: UsuarioRepositorio, useClass: UsuarioPrismaRepositorio },
    { provide: HashContrasena, useClass: HashBcrypt },
    { provide: EmisorToken, useClass: EmisorJwt },
    {
      provide: RegistrarUsuario,
      useFactory: (u: UsuarioRepositorio, h: HashContrasena, r: Registro) => new RegistrarUsuario(u, h, r),
      inject: [UsuarioRepositorio, HashContrasena, Registro],
    },
    {
      provide: IniciarSesion,
      useFactory: (u: UsuarioRepositorio, h: HashContrasena, e: EmisorToken, r: Registro) =>
        new IniciarSesion(u, h, e, r),
      inject: [UsuarioRepositorio, HashContrasena, EmisorToken, Registro],
    },
    {
      provide: ObtenerPerfil,
      useFactory: (u: UsuarioRepositorio) => new ObtenerPerfil(u),
      inject: [UsuarioRepositorio],
    },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [EmisorToken, UsuarioRepositorio, JwtAuthGuard, RolesGuard],
})
export class AccesoModule {}
