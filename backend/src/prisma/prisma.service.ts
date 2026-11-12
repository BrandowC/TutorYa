import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { CONFIG, type Configuracion } from '../config/configuracion.js';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(CONFIG) configuracion: Configuracion) {
    // La sesión de la base se fija en UTC: así las fechas viajan sin desfases de zona horaria,
    // sin importar la configuración regional del servidor de PostgreSQL.
    super({
      adapter: new PrismaPg({ connectionString: configuracion.databaseUrl, options: '-c TimeZone=UTC' }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
