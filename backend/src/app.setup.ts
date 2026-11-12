import { INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { Registro } from './compartido/aplicacion/registro.puerto.js';
import { errorDeValidacion } from './compartido/dominio/errores.js';
import { FiltroDeExcepciones } from './compartido/infraestructura/filtro-excepciones.js';
import { CONFIG, type Configuracion } from './config/configuracion.js';

function mensajesDeValidacion(errores: ValidationError[]): string[] {
  return errores.flatMap((e) => Object.values(e.constraints ?? {}));
}

/** Configuración común a la app real y a las pruebas e2e. */
export function configureApp(app: INestApplication): void {
  const registro = app.get(Registro);
  const configuracion = app.get<Configuracion>(CONFIG);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errores) =>
        errorDeValidacion('DATOS_INVALIDOS', 'Los datos enviados no son válidos.', mensajesDeValidacion(errores)),
    }),
  );
  app.useGlobalFilters(new FiltroDeExcepciones(registro));

  // Registra cada petición con su duración (Shift Right).
  app.use((peticion: Request, respuesta: Response, siguiente: NextFunction) => {
    const inicio = performance.now();
    respuesta.on('finish', () => {
      if (peticion.path === '/health') return;
      registro.info('Http', 'HTTP_REQUEST', 'Petición atendida', {
        metodo: peticion.method,
        ruta: peticion.path,
        status: respuesta.statusCode,
        duracionMs: Math.round(performance.now() - inicio),
      });
    });
    siguiente();
  });

  app.enableCors({ origin: configuracion.frontendOrigen });
}
