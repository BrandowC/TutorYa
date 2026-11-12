// Base PostgreSQL local sin instalar nada: `npm run db:local`.
// Los datos se guardan en backend/.pgdata y se conservan entre ejecuciones.
// Deje esta terminal abierta mientras usa la aplicación; Ctrl+C la apaga.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(raiz, '..', '.pgdata');
const puerto = Number(process.env.DB_PORT ?? 5432);
const usuario = process.env.DB_USER ?? 'postgres';
const password = process.env.DB_PASSWORD ?? 'postgres';
const baseDeDatos = process.env.DB_NAME ?? 'tutorapp';

const pg = new EmbeddedPostgres({
  databaseDir,
  user: usuario,
  password,
  port: puerto,
  persistent: true,
  // Zona horaria UTC para que las fechas se lean igual en cualquier computador.
  postgresFlags: ['-c', 'timezone=UTC'],
});

if (!existsSync(path.join(databaseDir, 'PG_VERSION'))) {
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase(baseDeDatos);
} catch {
  // La base ya existía de una ejecución anterior.
}

console.log(`PostgreSQL local listo en el puerto ${puerto}`);
console.log(`DATABASE_URL=postgresql://${usuario}:${password}@127.0.0.1:${puerto}/${baseDeDatos}`);

const apagar = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
setInterval(() => {}, 1 << 30);
