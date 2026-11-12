// Datos iniciales: catálogo de asignaturas y usuarios de PRUEBA para demostraciones.
// Uso: npm run db:seed   (idempotente: puede ejecutarse varias veces)
// Las contraseñas de abajo son solo de prueba para el entorno local; no usar en producción.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const ASIGNATURAS = [
  'Cálculo Diferencial',
  'Álgebra Lineal',
  'Programación I',
  'Estructuras de Datos',
  'Bases de Datos',
  'Física Mecánica',
  'Estadística',
  'Inglés Técnico',
  'Ingeniería de Software',
  'Calidad de Software',
];

const PASSWORD_PRUEBA = 'Prueba123!';
const USUARIOS = [
  { nombres: 'Laura Gómez', correo: 'tutor1@tutorapp.test', programa: 'Ingeniería de Sistemas', rol: 'TUTOR' },
  { nombres: 'Andrés Rojas', correo: 'tutor2@tutorapp.test', programa: 'Ingeniería Industrial', rol: 'TUTOR' },
  { nombres: 'Camila Torres', correo: 'estudiante1@tutorapp.test', programa: 'Ingeniería de Sistemas', rol: 'ESTUDIANTE' },
  { nombres: 'Santiago Pérez', correo: 'estudiante2@tutorapp.test', programa: 'Contaduría Pública', rol: 'ESTUDIANTE' },
];

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida. Cree el archivo .env primero.');
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();
try {
  for (const nombre of ASIGNATURAS) {
    await cliente.query('INSERT INTO asignaturas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [nombre]);
  }

  const hash = await bcrypt.hash(PASSWORD_PRUEBA, 10);
  for (const u of USUARIOS) {
    await cliente.query(
      `INSERT INTO usuarios (id, nombres, correo, programa, rol, password_hash)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::"Rol", $5)
       ON CONFLICT (correo) DO NOTHING`,
      [u.nombres, u.correo, u.programa, u.rol, hash],
    );
  }

  // Horarios de ejemplo para que la búsqueda no aparezca vacía: mañana, bloques de 1 hora.
  const { rows: tutores } = await cliente.query(`SELECT id, correo FROM usuarios WHERE rol = 'TUTOR'`);
  const { rows: materias } = await cliente.query('SELECT id, nombre FROM asignaturas ORDER BY id');
  const porNombre = Object.fromEntries(materias.map((m) => [m.nombre, m.id]));
  const manana = new Date();
  manana.setUTCDate(manana.getUTCDate() + 1);
  manana.setUTCMinutes(0, 0, 0);
  const plan = {
    'tutor1@tutorapp.test': [
      ['Calidad de Software', 14],
      ['Ingeniería de Software', 16],
      ['Bases de Datos', 18],
    ],
    'tutor2@tutorapp.test': [
      ['Cálculo Diferencial', 15],
      ['Estadística', 17],
    ],
  };
  for (const tutor of tutores) {
    const { rows: existentes } = await cliente.query('SELECT 1 FROM disponibilidades WHERE tutor_id = $1 LIMIT 1', [tutor.id]);
    if (existentes.length > 0) continue;
    for (const [materia, horaUtc] of plan[tutor.correo] ?? []) {
      const inicio = new Date(manana);
      inicio.setUTCHours(horaUtc);
      const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
      await cliente.query(
        `INSERT INTO disponibilidades (id, tutor_id, asignatura_id, inicio, fin)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
        [tutor.id, porNombre[materia], inicio, fin],
      );
    }
  }
  console.log('Semilla aplicada: asignaturas, usuarios de prueba y horarios de ejemplo.');
  console.log('Usuarios de prueba (contraseña común en el README): tutor1@tutorapp.test, estudiante1@tutorapp.test ...');
} finally {
  await cliente.end();
}
