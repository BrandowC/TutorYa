import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { IniciarSesion } from '../aplicacion/iniciar-sesion.js';
import { ObtenerPerfil } from '../aplicacion/obtener-perfil.js';
import { RegistrarUsuario } from '../aplicacion/registrar-usuario.js';
import type { Actor } from '../dominio/usuario.js';
import { JwtAuthGuard, UsuarioActual } from './guards.js';

export class RegistroDto {
  @IsString({ message: 'Los nombres son obligatorios.' })
  @MaxLength(100, { message: 'Los nombres no pueden superar 100 caracteres.' })
  nombres!: string;

  @IsString({ message: 'El correo es obligatorio.' })
  @MaxLength(150, { message: 'El correo no puede superar 150 caracteres.' })
  correo!: string;

  @IsString({ message: 'El programa académico es obligatorio.' })
  @MaxLength(100, { message: 'El programa no puede superar 100 caracteres.' })
  programa!: string;

  @IsIn(['ESTUDIANTE', 'TUTOR'], { message: 'El rol debe ser ESTUDIANTE o TUTOR.' })
  rol!: string;

  @IsString({ message: 'La contraseña es obligatoria.' })
  @MaxLength(200, { message: 'La contraseña es demasiado larga.' })
  password!: string;
}

export class LoginDto {
  @IsString({ message: 'El correo es obligatorio.' })
  @MaxLength(150, { message: 'El correo no puede superar 150 caracteres.' })
  correo!: string;

  @IsString({ message: 'La contraseña es obligatoria.' })
  @MaxLength(200, { message: 'La contraseña es demasiado larga.' })
  password!: string;
}

@Controller('auth')
export class AccesoController {
  constructor(
    private readonly registrar: RegistrarUsuario,
    private readonly iniciarSesion: IniciarSesion,
    private readonly obtenerPerfil: ObtenerPerfil,
  ) {}

  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.registrar.ejecutar(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.iniciarSesion.ejecutar(dto.correo, dto.password);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@UsuarioActual() actor: Actor) {
    return this.obtenerPerfil.ejecutar(actor);
  }
}
