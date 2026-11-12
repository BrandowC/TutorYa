import { Controller, Get, Module } from '@nestjs/common';
import { AccesoModule } from './acceso/acceso.module.js';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { CompartidoModule } from './compartido/compartido.module.js';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TutoriasModule } from './tutorias/tutorias.module.js';

@Controller('health')
export class SaludController {
  @Get()
  estado() {
    return { estado: 'ok', servicio: 'tutorapp-api', timestamp: new Date().toISOString() };
  }
}

@Module({
  imports: [
    PrismaModule,
    CompartidoModule,
    AccesoModule,
    CatalogoModule,
    DisponibilidadModule,
    TutoriasModule,
  ],
  controllers: [SaludController],
})
export class AppModule {}
