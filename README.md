# TutorApp

Plataforma web de **tutorías académicas** (CORHUILA · Calidad de Software 2026B). El estudiante busca un tutor, agenda una sesión y la califica; el tutor publica horarios, confirma y cierra las sesiones.

- **Backend:** NestJS 12 · arquitectura hexagonal · Prisma 7 · PostgreSQL
- **Frontend:** Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn/ui
- **Base visual:** plantilla [Studio Admin](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) (MIT), adaptada a la identidad TutorApp
- **Flujo principal:** autenticarse → publicar horario (tutor) → buscar y solicitar (estudiante) → confirmar (tutor) → marcar realizada (tutor) → calificar (estudiante)

```
navegador ──► Next.js (/api proxy, cookie httpOnly) ──► NestJS ──► Prisma ──► PostgreSQL
```

El frontend **nunca** habla con la base de datos: el navegador solo llama a Next.js, que reenvía a NestJS con el token de la sesión.

## Cómo ejecutarlo (primera vez)

Necesita Node 22 o superior. Abra **tres terminales**.

**1. Base de datos** (sin instalar Postgres; también puede usar `docker compose up -d`)

```bash
cd backend
npm install
npm run db:local
```

Deje esa terminal abierta. En otra, en `backend/`, cree la configuración y los datos:

```bash
cp .env.example .env
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
```

**2. API (NestJS, puerto 3001)**

```bash
cd backend
npm run start:dev
```

**3. Web (Next.js, puerto 3000)**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000.

### Cuentas de prueba (solo entorno local)

Contraseña de todas: `Prueba123!`

| Rol | Correo |
| --- | --- |
| Estudiante | `estudiante1@tutorapp.test`, `estudiante2@tutorapp.test` |
| Tutor | `tutor1@tutorapp.test`, `tutor2@tutorapp.test` |

También puede crear cuentas nuevas desde **Crear cuenta**.

### Modo demostración

En `backend/.env`, `PERMITIR_HORARIOS_PASADOS=true` permite registrar y agendar horarios que ya pasaron. Así se puede mostrar el flujo completo (incluida la calificación) sin esperar a que llegue la hora de la sesión. **En producción debe ser `false`.**

## Pruebas y calidad

| Qué | Comando |
| --- | --- |
| Unitarias backend (Vitest) | `cd backend && npm test` |
| Lint backend / frontend | `npm run lint` |
| Compilación | `npm run build` |

El Dossier de Calidad (matrices, pruebas, evidencias) se arma en `docs/calidad/`.

## Logs (Shift Right)

La API escribe una línea JSON por evento (`timestamp`, `level`, `context`, `event`, `message`, `metadata`) en consola y en `backend/logs/tutorapp.log`. Nunca registra contraseñas, tokens ni correos completos. Eventos principales: `APP_STARTED`, `USER_REGISTERED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `AVAILABILITY_CREATED`, `SESSION_REQUESTED`, `SESSION_CONFIRMED`, `SESSION_CLOSED`, `RATING_CREATED`, `VALIDATION_REJECTED`, `UNHANDLED_ERROR`, `HTTP_REQUEST` (con `duracionMs`).

## Estructura

```
backend/src/
  acceso/ catalogo/ disponibilidad/ tutorias/     un módulo por tema
    dominio/          reglas puras (sin Nest ni base de datos)
    aplicacion/       casos de uso + puertos (interfaces)
    infraestructura/  controladores, Prisma, bcrypt, JWT (adaptadores)
  compartido/         errores, reloj, logs, filtro de excepciones
frontend/src/
  app/(publico)       login y registro
  app/(main)/dashboard  panel, disponibilidad, búsqueda y sesiones
  app/api             proxy hacia NestJS y manejo de la cookie de sesión
  components/tutorapp componentes de las pantallas
  components/ui       componentes de la plantilla (shadcn/ui)
docs/marca/           ficha de marca y captura de la plantilla original
docs/calidad/         dossier de calidad y pruebas
```
