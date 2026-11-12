import { Global, Module } from '@nestjs/common';
import { Registro } from './aplicacion/registro.puerto.js';
import { CONFIG, type Configuracion } from '../config/configuracion.js';
import { Reloj, type PoliticaDeTiempo } from './dominio/reloj.js';
import { RegistroJson } from './infraestructura/registro-json.js';
import { RelojSistema } from './infraestructura/reloj-sistema.js';

export const POLITICA_TIEMPO = 'POLITICA_TIEMPO';

/** Servicios transversales: logs, reloj y política de tiempo. */
@Global()
@Module({
  providers: [
    {
      provide: Registro,
      useFactory: (config: Configuracion) => new RegistroJson(config.archivoLog),
      inject: [CONFIG],
    },
    { provide: Reloj, useClass: RelojSistema },
    {
      provide: POLITICA_TIEMPO,
      useFactory: (config: Configuracion): PoliticaDeTiempo => ({
        permitirHorariosPasados: config.permitirHorariosPasados,
      }),
      inject: [CONFIG],
    },
  ],
  exports: [Registro, Reloj, POLITICA_TIEMPO],
})
export class CompartidoModule {}
