import { Module } from '@nestjs/common';
import { AccesoModule } from '../acceso/acceso.module.js';
import { AsignaturaRepositorio, ListarAsignaturas } from './aplicacion/puertos.js';
import { AsignaturaPrismaRepositorio, CatalogoController } from './infraestructura/catalogo.infra.js';

@Module({
  imports: [AccesoModule],
  controllers: [CatalogoController],
  providers: [
    { provide: AsignaturaRepositorio, useClass: AsignaturaPrismaRepositorio },
    {
      provide: ListarAsignaturas,
      useFactory: (a: AsignaturaRepositorio) => new ListarAsignaturas(a),
      inject: [AsignaturaRepositorio],
    },
  ],
  exports: [AsignaturaRepositorio],
})
export class CatalogoModule {}
