import { Module } from '@nestjs/common';
import { AccesoModule } from '../acceso/acceso.module.js';
import { Registro } from '../compartido/aplicacion/registro.puerto.js';
import { POLITICA_TIEMPO } from '../compartido/compartido.module.js';
import type { PoliticaDeTiempo } from '../compartido/dominio/reloj.js';
import { Reloj } from '../compartido/dominio/reloj.js';
import { AsignaturaRepositorio } from '../catalogo/aplicacion/puertos.js';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import {
  BuscarTutoresDisponibles,
  ListarMisDisponibilidades,
  RegistrarDisponibilidad,
} from './aplicacion/casos-de-uso.js';
import { DisponibilidadRepositorio } from './aplicacion/puertos.js';
import {
  DisponibilidadController,
  DisponibilidadPrismaRepositorio,
} from './infraestructura/disponibilidad.infra.js';

@Module({
  imports: [AccesoModule, CatalogoModule],
  controllers: [DisponibilidadController],
  providers: [
    { provide: DisponibilidadRepositorio, useClass: DisponibilidadPrismaRepositorio },
    {
      provide: RegistrarDisponibilidad,
      useFactory: (d: DisponibilidadRepositorio, a: AsignaturaRepositorio, r: Reloj, p: PoliticaDeTiempo, l: Registro) =>
        new RegistrarDisponibilidad(d, a, r, p, l),
      inject: [DisponibilidadRepositorio, AsignaturaRepositorio, Reloj, POLITICA_TIEMPO, Registro],
    },
    {
      provide: ListarMisDisponibilidades,
      useFactory: (d: DisponibilidadRepositorio) => new ListarMisDisponibilidades(d),
      inject: [DisponibilidadRepositorio],
    },
    {
      provide: BuscarTutoresDisponibles,
      useFactory: (d: DisponibilidadRepositorio, r: Reloj, p: PoliticaDeTiempo, l: Registro) =>
        new BuscarTutoresDisponibles(d, r, p, l),
      inject: [DisponibilidadRepositorio, Reloj, POLITICA_TIEMPO, Registro],
    },
  ],
  exports: [DisponibilidadRepositorio],
})
export class DisponibilidadModule {}
