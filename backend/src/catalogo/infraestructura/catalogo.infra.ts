import { Controller, Get, Injectable, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtAuthGuard } from '../../acceso/infraestructura/guards.js';
import {
  AsignaturaRepositorio,
  ListarAsignaturas,
  type Asignatura,
} from '../aplicacion/puertos.js';

@Injectable()
export class AsignaturaPrismaRepositorio extends AsignaturaRepositorio {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  listarActivas(): Promise<Asignatura[]> {
    return this.prisma.asignatura.findMany({ where: { activa: true }, orderBy: { nombre: 'asc' } });
  }

  buscarPorId(id: number): Promise<Asignatura | null> {
    return this.prisma.asignatura.findUnique({ where: { id } });
  }
}

@Controller('asignaturas')
@UseGuards(JwtAuthGuard)
export class CatalogoController {
  constructor(private readonly listar: ListarAsignaturas) {}

  @Get()
  listarTodas() {
    return this.listar.ejecutar();
  }
}
