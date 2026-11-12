import 'dotenv/config';

export interface Configuracion {
  puerto: number;
  databaseUrl: string;
  jwtSecreto: string;
  jwtExpiraMinutos: number;
  frontendOrigen: string;
  permitirHorariosPasados: boolean;
  costoHash: number;
  archivoLog?: string;
}

/** Lee y valida las variables de entorno. Falla al iniciar si falta algo crítico. */
export function cargarConfiguracion(
  env: NodeJS.ProcessEnv = process.env,
): Configuracion {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL no está definida. Copie .env.example como .env y ajuste los valores.',
    );
  }
  const jwtSecreto = env.JWT_SECRET;
  if (!jwtSecreto || jwtSecreto.length < 32) {
    throw new Error('JWT_SECRET debe definirse con al menos 32 caracteres.');
  }
  const expira = Number(env.JWT_EXPIRA_MINUTOS ?? 30);
  if (!Number.isFinite(expira) || expira <= 0) {
    throw new Error('JWT_EXPIRA_MINUTOS debe ser un número positivo.');
  }
  return {
    puerto: Number(env.PORT ?? 3001),
    databaseUrl,
    jwtSecreto,
    jwtExpiraMinutos: expira,
    frontendOrigen: env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    permitirHorariosPasados: env.PERMITIR_HORARIOS_PASADOS === 'true',
    costoHash: Number(env.BCRYPT_COSTO ?? 10),
    archivoLog: env.LOG_FILE || undefined,
  };
}

/** Token de inyección de la configuración. */
export const CONFIG = 'CONFIG';
