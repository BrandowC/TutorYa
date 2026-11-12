import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { Registro } from './compartido/aplicacion/registro.puerto.js';
import { CONFIG, type Configuracion } from './config/configuracion.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  configureApp(app);
  const configuracion = app.get<Configuracion>(CONFIG);
  await app.listen(configuracion.puerto);
  app.get(Registro).info('Bootstrap', 'APP_STARTED', 'TutorApp API iniciada', {
    puerto: configuracion.puerto,
    horariosPasados: configuracion.permitirHorariosPasados,
  });
}

await bootstrap();
