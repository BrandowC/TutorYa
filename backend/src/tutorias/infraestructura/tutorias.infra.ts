import {
  Body,
  Controller,
  Get,
  Injectable,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard, Roles, RolesGuard, UsuarioActual } from '../../acceso/infraestructura/guards.js';
import type { Actor, Rol } from '../../acceso/dominio/usuario.js';
import { errorDeConflicto } from '../../compartido/dominio/errores.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CalificarSesion,
  CancelarSesion,
  ConfirmarSesion,
  ListarMisSesiones,
  ObtenerResumen,
  RechazarSesion,
  RegistrarEstadoFinal,
  SolicitarSesion,
} from '../aplicacion/casos-de-uso.js';
import {
  SesionRepositorio,
  type Calificacion,
  type NuevaSesion,
  type ResumenUsuario,
  type SesionDetalle,
} from '../aplicacion/puertos.js';
import { ESTADOS_ACTIVOS, type EstadoSesion, type Sesion } from '../dominio/sesion.js';

const ESTADOS: EstadoSesion[] = ['SOLICITADA', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'REALIZADA', 'NO_ASISTIO'];

const INCLUIR_DETALLE = {
  asignatura: true,
  tutor: { select: { id: true, nombres: true } },
  estudiante: { select: { id: true, nombres: true } },
  calificacion: true,
} as const;

type FilaDetalle = Prisma.SesionGetPayload<{ include: typeof INCLUIR_DETALLE }>;

function aSesion(fila: {
  id: string;
  disponibilidadId: string;
  tutorId: string;
  estudianteId: string;
  asignaturaId: number;
  inicio: Date;
  fin: Date;
  estado: EstadoSesion;
  motivoCancelacion: string | null;
}): Sesion {
  return {
    id: fila.id,
    disponibilidadId: fila.disponibilidadId,
    tutorId: fila.tutorId,
    estudianteId: fila.estudianteId,
    asignaturaId: fila.asignaturaId,
    inicio: fila.inicio,
    fin: fila.fin,
    estado: fila.estado,
    motivoCancelacion: fila.motivoCancelacion,
  };
}

function aDetalle(fila: FilaDetalle): SesionDetalle {
  return {
    id: fila.id,
    estado: fila.estado,
    inicio: fila.inicio,
    fin: fila.fin,
    motivoCancelacion: fila.motivoCancelacion,
    asignatura: { id: fila.asignatura.id, nombre: fila.asignatura.nombre },
    tutor: fila.tutor,
    estudiante: fila.estudiante,
    calificacion: fila.calificacion
      ? { puntaje: fila.calificacion.puntaje, comentario: fila.calificacion.comentario }
      : null,
  };
}

@Injectable()
export class SesionPrismaRepositorio extends SesionRepositorio {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async crear(datos: NuevaSesion): Promise<Sesion> {
    try {
      return aSesion(await this.prisma.sesion.create({ data: datos }));
    } catch (error) {
      // El índice único parcial protege contra dos solicitudes simultáneas al mismo horario.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw errorDeConflicto('HORARIO_NO_DISPONIBLE', 'Ese horario ya fue reservado por otro estudiante.');
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<Sesion | null> {
    const fila = await this.prisma.sesion.findUnique({ where: { id } });
    return fila ? aSesion(fila) : null;
  }

  async actualizar(sesion: Sesion): Promise<Sesion> {
    const fila = await this.prisma.sesion.update({
      where: { id: sesion.id },
      data: { estado: sesion.estado, motivoCancelacion: sesion.motivoCancelacion },
    });
    return aSesion(fila);
  }

  async hayActivaEnDisponibilidad(disponibilidadId: string): Promise<boolean> {
    const total = await this.prisma.sesion.count({
      where: { disponibilidadId, estado: { in: [...ESTADOS_ACTIVOS] } },
    });
    return total > 0;
  }

  async confirmadasDelTutor(tutorId: string): Promise<Sesion[]> {
    const filas = await this.prisma.sesion.findMany({ where: { tutorId, estado: 'CONFIRMADA' } });
    return filas.map(aSesion);
  }

  async listarPorUsuario(usuarioId: string, rol: Rol, estado?: EstadoSesion): Promise<SesionDetalle[]> {
    const filas = await this.prisma.sesion.findMany({
      where: { ...(rol === 'TUTOR' ? { tutorId: usuarioId } : { estudianteId: usuarioId }), estado },
      orderBy: { inicio: 'desc' },
      take: 100,
      include: INCLUIR_DETALLE,
    });
    return filas.map(aDetalle);
  }

  async obtenerResumen(usuarioId: string, rol: Rol, _desde: Date): Promise<ResumenUsuario> {
    const propias = rol === 'TUTOR' ? { tutorId: usuarioId } : { estudianteId: usuarioId };
    const grupos = await this.prisma.sesion.groupBy({
      by: ['estado'],
      where: propias,
      _count: { _all: true },
    });
    const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<EstadoSesion, number>;
    for (const grupo of grupos) {
      porEstado[grupo.estado] = grupo._count._all;
    }

    const indicadorEspecifico =
      rol === 'TUTOR'
        ? await this.prisma.disponibilidad.count({
            where: { tutorId: usuarioId, sesiones: { none: { estado: { in: [...ESTADOS_ACTIVOS] } } } },
          })
        : await this.prisma.sesion.count({
            where: { estudianteId: usuarioId, estado: 'REALIZADA', calificacion: null },
          });

    const proximas = await this.prisma.sesion.findMany({
      where: { ...propias, estado: { in: [...ESTADOS_ACTIVOS] } },
      orderBy: { inicio: 'asc' },
      take: 4,
      include: INCLUIR_DETALLE,
    });
    return { rol, porEstado, indicadorEspecifico, proximas: proximas.map(aDetalle) };
  }

  async buscarCalificacion(sesionId: string): Promise<Calificacion | null> {
    return this.prisma.calificacion.findUnique({ where: { sesionId } });
  }

  async crearCalificacion(datos: {
    sesionId: string;
    estudianteId: string;
    puntaje: number;
    comentario: string | null;
  }): Promise<Calificacion> {
    try {
      return await this.prisma.calificacion.create({ data: datos });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw errorDeConflicto('SESION_YA_CALIFICADA', 'Esta sesión ya fue calificada.');
      }
      throw error;
    }
  }
}

export class SolicitarSesionDto {
  @IsUUID(undefined, { message: 'El horario seleccionado no es válido.' })
  disponibilidadId!: string;
}

export class CancelarSesionDto {
  @IsString({ message: 'Debe indicar el motivo de la cancelación.' })
  @MaxLength(400, { message: 'El motivo es demasiado largo.' })
  motivo!: string;
}

export class EstadoFinalDto {
  @IsIn(['REALIZADA', 'NO_ASISTIO'], { message: 'El estado final debe ser REALIZADA o NO_ASISTIO.' })
  estado!: string;
}

export class CalificarDto {
  @IsInt({ message: 'El puntaje debe ser un número entero.' })
  @Min(1, { message: 'El puntaje mínimo es 1.' })
  @Max(5, { message: 'El puntaje máximo es 5.' })
  puntaje!: number;

  @IsOptional()
  @IsString({ message: 'El comentario no es válido.' })
  @MaxLength(400, { message: 'El comentario es demasiado largo.' })
  comentario?: string;
}

export class FiltroSesionesDto {
  @IsOptional()
  @IsIn(ESTADOS, { message: 'El estado de filtro no es válido.' })
  estado?: EstadoSesion;
}

@Controller('sesiones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SesionesController {
  constructor(
    private readonly solicitar: SolicitarSesion,
    private readonly confirmar: ConfirmarSesion,
    private readonly rechazar: RechazarSesion,
    private readonly cancelar: CancelarSesion,
    private readonly estadoFinal: RegistrarEstadoFinal,
    private readonly calificar: CalificarSesion,
    private readonly listar: ListarMisSesiones,
    private readonly resumen: ObtenerResumen,
  ) {}

  @Post()
  @Roles('ESTUDIANTE')
  solicitarSesion(@UsuarioActual() actor: Actor, @Body() dto: SolicitarSesionDto) {
    return this.solicitar.ejecutar(actor, dto.disponibilidadId);
  }

  @Get('mias')
  mias(@UsuarioActual() actor: Actor, @Query() filtro: FiltroSesionesDto) {
    return this.listar.ejecutar(actor, filtro.estado);
  }

  @Get('resumen')
  obtenerResumen(@UsuarioActual() actor: Actor) {
    return this.resumen.ejecutar(actor);
  }

  @Patch(':id/confirmar')
  @Roles('TUTOR')
  confirmarSesion(@UsuarioActual() actor: Actor, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.confirmar.ejecutar(actor, id);
  }

  @Patch(':id/rechazar')
  @Roles('TUTOR')
  rechazarSesion(@UsuarioActual() actor: Actor, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.rechazar.ejecutar(actor, id);
  }

  @Patch(':id/cancelar')
  cancelarSesion(
    @UsuarioActual() actor: Actor,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelarSesionDto,
  ) {
    return this.cancelar.ejecutar(actor, id, dto.motivo);
  }

  @Patch(':id/estado-final')
  @Roles('TUTOR')
  registrarEstadoFinal(
    @UsuarioActual() actor: Actor,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EstadoFinalDto,
  ) {
    return this.estadoFinal.ejecutar(actor, id, dto.estado);
  }

  @Post(':id/calificacion')
  @Roles('ESTUDIANTE')
  calificarSesion(
    @UsuarioActual() actor: Actor,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CalificarDto,
  ) {
    return this.calificar.ejecutar(actor, id, dto);
  }
}
