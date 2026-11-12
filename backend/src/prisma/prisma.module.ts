import { Global, Module } from '@nestjs/common';
import { cargarConfiguracion, CONFIG } from '../config/configuracion.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [{ provide: CONFIG, useFactory: () => cargarConfiguracion() }, PrismaService],
  exports: [CONFIG, PrismaService],
})
export class PrismaModule {}
