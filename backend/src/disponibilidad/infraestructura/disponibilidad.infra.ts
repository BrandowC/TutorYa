import { Body, Controller, Get, Injectable, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard, UsuarioActual } from '../../acceso/infraestructura/guards.js';
import type { Actor } from '../../acceso/dominio/usuario.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  BuscarTutoresDisponibles,
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
    return this.prisma.disponibilidad.create({ data: datos });
  }

  buscarPorId(id: string): Promise<Disponibilidad | null> {
    return this.prisma.disponibilidad.findUnique({ where: { id } });
  }

  buscarSolapadas(tutorId: string, inicio: Date, fin: Date): Promise<Disponibilidad[]> {
    return this.prisma.disponibilidad.findMany({
      where: { tutorId, inicio: { lt: fin }, fin: { gt: inicio } },
    });
  }

  async listarPorTutor(tutorId: string): Promise<DisponibilidadDetalle[]> {
    const filas = await this.prisma.disponibilidad.findMany({
      where: { tutorId },
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
    private readonly listarMias: ListarMisDisponibilidades,
    private readonly buscar: BuscarTutoresDisponibles,
  ) {}

  @Post('disponibilidades')
  @Roles('TUTOR')
  crear(@UsuarioActual() actor: Actor, @Body() dto: CrearDisponibilidadDto) {
    return this.registrar.ejecutar(actor, dto);
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
