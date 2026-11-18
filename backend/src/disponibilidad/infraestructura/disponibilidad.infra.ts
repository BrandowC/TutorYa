import { Body, Controller, Delete, Get, HttpCode, Injectable, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard, UsuarioActual } from '../../acceso/infraestructura/guards.js';
import type { Actor } from '../../acceso/dominio/usuario.js';
import { errorDeConflicto, errorNoEncontrado } from '../../compartido/dominio/errores.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { bloquearHorariosDelTutor } from '../../prisma/bloquear-horarios.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  BuscarTutoresDisponibles,
  GestionarDisponibilidad,
  ListarMisDisponibilidades,
  RegistrarDisponibilidad,
} from '../aplicacion/casos-de-uso.js';
import {
  DisponibilidadRepositorio,
  type Disponibilidad,
  type DisponibilidadDetalle,
  type FiltroBusqueda,
  type HorarioLibre,
  type NuevaDisponibilidad,
} from '../aplicacion/puertos.js';

const ESTADOS_ACTIVOS = ['SOLICITADA', 'CONFIRMADA'] as const;

@Injectable()
export class DisponibilidadPrismaRepositorio extends DisponibilidadRepositorio {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  crear(datos: NuevaDisponibilidad): Promise<Disponibilidad> {
    return this.prisma.$transaction(async (tx) => {
      await bloquearHorariosDelTutor(tx, datos.tutorId);
      await this.verificarSolapamiento(tx, datos);
      return tx.disponibilidad.create({ data: datos });
    });
  }

  actualizar(id: string, datos: NuevaDisponibilidad): Promise<Disponibilidad> {
    return this.prisma.$transaction(async (tx) => {
      await bloquearHorariosDelTutor(tx, datos.tutorId);
      await this.verificarEditable(tx, id, datos.tutorId);
      await this.verificarSolapamiento(tx, datos, id);
      const { asignaturaId, inicio, fin } = datos;
      return tx.disponibilidad.update({ where: { id }, data: { asignaturaId, inicio, fin } });
    });
  }

  async retirar(id: string, tutorId: string, fecha: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await bloquearHorariosDelTutor(tx, tutorId);
      await this.verificarEditable(tx, id, tutorId);
      await tx.disponibilidad.update({ where: { id }, data: { retiradaEn: fecha } });
    });
  }

  private async verificarEditable(tx: Prisma.TransactionClient, id: string, tutorId: string): Promise<void> {
    const bloque = await tx.disponibilidad.findFirst({
      where: { id, tutorId, retiradaEn: null },
      include: { sesiones: { where: { estado: { in: [...ESTADOS_ACTIVOS] } }, select: { id: true } } },
    });
    if (!bloque) {
      throw errorNoEncontrado('DISPONIBILIDAD_NO_ENCONTRADA', 'El horario no está entre tus horarios publicados.');
    }
    if (bloque.sesiones.length > 0) {
      throw errorDeConflicto('HORARIO_RESERVADO', 'No puedes modificar ni retirar un horario con una solicitud pendiente o confirmada.');
    }
  }

  private async verificarSolapamiento(
    tx: Prisma.TransactionClient,
    datos: NuevaDisponibilidad,
    idActual?: string,
  ): Promise<void> {
    const existente = await tx.disponibilidad.findFirst({
      where: {
        tutorId: datos.tutorId,
        retiradaEn: null,
        id: idActual ? { not: idActual } : undefined,
        inicio: { lt: datos.fin },
        fin: { gt: datos.inicio },
      },
    });
    if (existente) {
      throw errorDeConflicto('BLOQUE_SOLAPADO', 'Ya tiene un bloque de disponibilidad que se cruza con ese horario.');
    }
  }

  buscarPorId(id: string): Promise<Disponibilidad | null> {
    return this.prisma.disponibilidad.findUnique({ where: { id, retiradaEn: null } });
  }

  buscarSolapadas(tutorId: string, inicio: Date, fin: Date): Promise<Disponibilidad[]> {
    return this.prisma.disponibilidad.findMany({
      where: { tutorId, retiradaEn: null, inicio: { lt: fin }, fin: { gt: inicio } },
    });
  }

  async listarPorTutor(tutorId: string): Promise<DisponibilidadDetalle[]> {
    const filas = await this.prisma.disponibilidad.findMany({
      where: { tutorId, retiradaEn: null },
      orderBy: { inicio: 'asc' },
      include: {
        asignatura: true,
        sesiones: { where: { estado: { in: [...ESTADOS_ACTIVOS] } }, select: { id: true } },
      },
    });
    return filas.map((fila) => ({
      id: fila.id,
      asignatura: { id: fila.asignatura.id, nombre: fila.asignatura.nombre },
      inicio: fila.inicio,
      fin: fila.fin,
      reservada: fila.sesiones.length > 0,
    }));
  }

  async buscarLibres(filtro: FiltroBusqueda): Promise<HorarioLibre[]> {
    const filas = await this.prisma.disponibilidad.findMany({
      where: {
        retiradaEn: null,
        asignaturaId: filtro.asignaturaId,
        inicio: {
          gte: filtro.desde,
          gt: filtro.soloFuturosDesde,
        },
        fin: { lte: filtro.hasta },
        sesiones: { none: { estado: { in: [...ESTADOS_ACTIVOS] } } },
      },
      orderBy: { inicio: 'asc' },
      take: filtro.limite,
      include: { tutor: true, asignatura: true },
    });
    return filas.map((fila) => ({
      disponibilidadId: fila.id,
      tutor: { id: fila.tutor.id, nombres: fila.tutor.nombres, programa: fila.tutor.programa },
      asignatura: { id: fila.asignatura.id, nombre: fila.asignatura.nombre },
      inicio: fila.inicio,
      fin: fila.fin,
    }));
  }
}

export class CrearDisponibilidadDto {
  @IsInt({ message: 'La asignatura es obligatoria.' })
  @Min(1, { message: 'La asignatura es obligatoria.' })
  @Type(() => Number)
  asignaturaId!: number;

  @IsDate({ message: 'La fecha y hora de inicio no son válidas.' })
  @Type(() => Date)
  inicio!: Date;

  @IsDate({ message: 'La fecha y hora de fin no son válidas.' })
  @Type(() => Date)
  fin!: Date;
}

export class BuscarTutoresDto {
  @IsOptional()
  @IsInt({ message: 'La asignatura no es válida.' })
  @Type(() => Number)
  asignaturaId?: number;

  @IsOptional()
  @IsDate({ message: 'La fecha inicial no es válida.' })
  @Type(() => Date)
  desde?: Date;

  @IsOptional()
  @IsDate({ message: 'La fecha final no es válida.' })
  @Type(() => Date)
  hasta?: Date;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisponibilidadController {
  constructor(
    private readonly registrar: RegistrarDisponibilidad,
    private readonly gestionar: GestionarDisponibilidad,
    private readonly listarMias: ListarMisDisponibilidades,
    private readonly buscar: BuscarTutoresDisponibles,
  ) {}

  @Post('disponibilidades')
  @Roles('TUTOR')
  crear(@UsuarioActual() actor: Actor, @Body() dto: CrearDisponibilidadDto) {
    return this.registrar.ejecutar(actor, dto);
  }

  @Patch('disponibilidades/:id')
  @Roles('TUTOR')
  editar(@UsuarioActual() actor: Actor, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearDisponibilidadDto) {
    return this.gestionar.editar(actor, id, dto);
  }

  @Delete('disponibilidades/:id')
  @HttpCode(204)
  @Roles('TUTOR')
  retirar(@UsuarioActual() actor: Actor, @Param('id', ParseUUIDPipe) id: string) {
    return this.gestionar.retirar(actor, id);
  }

  @Get('disponibilidades/mias')
  @Roles('TUTOR')
  mias(@UsuarioActual() actor: Actor) {
    return this.listarMias.ejecutar(actor);
  }

  @Get('tutores/disponibles')
  @Roles('ESTUDIANTE')
  disponibles(@UsuarioActual() actor: Actor, @Query() consulta: BuscarTutoresDto) {
    return this.buscar.ejecutar(actor, consulta);
  }
}
