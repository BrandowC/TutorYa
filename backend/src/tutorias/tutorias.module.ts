import { Module } from '@nestjs/common';
import { AccesoModule } from '../acceso/acceso.module.js';
import { Registro } from '../compartido/aplicacion/registro.puerto.js';
import { POLITICA_TIEMPO } from '../compartido/compartido.module.js';
import { Reloj, type PoliticaDeTiempo } from '../compartido/dominio/reloj.js';
import { DisponibilidadRepositorio } from '../disponibilidad/aplicacion/puertos.js';
import { DisponibilidadModule } from '../disponibilidad/disponibilidad.module.js';
import {
  CalificarSesion,
  CancelarSesion,
  ConfirmarSesion,
  ListarMisSesiones,
  ObtenerResumen,
  RechazarSesion,
  RegistrarEstadoFinal,
  SolicitarSesion,
} from './aplicacion/casos-de-uso.js';
import { SesionRepositorio } from './aplicacion/puertos.js';
import { SesionesController, SesionPrismaRepositorio } from './infraestructura/tutorias.infra.js';

@Module({
  imports: [AccesoModule, DisponibilidadModule],
  controllers: [SesionesController],
  providers: [
    { provide: SesionRepositorio, useClass: SesionPrismaRepositorio },
    {
      provide: SolicitarSesion,
      useFactory: (s: SesionRepositorio, d: DisponibilidadRepositorio, r: Reloj, p: PoliticaDeTiempo, l: Registro) =>
        new SolicitarSesion(s, d, r, p, l),
      inject: [SesionRepositorio, DisponibilidadRepositorio, Reloj, POLITICA_TIEMPO, Registro],
    },
    {
      provide: ConfirmarSesion,
      useFactory: (s: SesionRepositorio, l: Registro) => new ConfirmarSesion(s, l),
      inject: [SesionRepositorio, Registro],
    },
    {
      provide: RechazarSesion,
      useFactory: (s: SesionRepositorio, l: Registro) => new RechazarSesion(s, l),
      inject: [SesionRepositorio, Registro],
    },
    {
      provide: CancelarSesion,
      useFactory: (s: SesionRepositorio, r: Reloj, p: PoliticaDeTiempo, l: Registro) =>
        new CancelarSesion(s, r, p, l),
      inject: [SesionRepositorio, Reloj, POLITICA_TIEMPO, Registro],
    },
    {
      provide: RegistrarEstadoFinal,
      useFactory: (s: SesionRepositorio, r: Reloj, l: Registro) => new RegistrarEstadoFinal(s, r, l),
      inject: [SesionRepositorio, Reloj, Registro],
    },
    {
      provide: CalificarSesion,
      useFactory: (s: SesionRepositorio, l: Registro) => new CalificarSesion(s, l),
      inject: [SesionRepositorio, Registro],
    },
    {
      provide: ListarMisSesiones,
      useFactory: (s: SesionRepositorio) => new ListarMisSesiones(s),
      inject: [SesionRepositorio],
    },
    {
      provide: ObtenerResumen,
      useFactory: (s: SesionRepositorio, r: Reloj) => new ObtenerResumen(s, r),
      inject: [SesionRepositorio, Reloj],
    },
  ],
})
export class TutoriasModule {}
