-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'TUTOR');

-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('SOLICITADA', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'REALIZADA', 'NO_ASISTIO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "programa" VARCHAR(100) NOT NULL,
    "rol" "Rol" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaturas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "asignaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidades" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "asignatura_id" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disponibilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "disponibilidad_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "asignatura_id" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "estado" "EstadoSesion" NOT NULL DEFAULT 'SOLICITADA',
    "motivo_cancelacion" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "comentario" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "asignaturas_nombre_key" ON "asignaturas"("nombre");

-- CreateIndex
CREATE INDEX "disponibilidades_tutor_id_inicio_idx" ON "disponibilidades"("tutor_id", "inicio");

-- CreateIndex
CREATE INDEX "disponibilidades_asignatura_id_inicio_idx" ON "disponibilidades"("asignatura_id", "inicio");

-- CreateIndex
CREATE INDEX "sesiones_tutor_id_estado_idx" ON "sesiones"("tutor_id", "estado");

-- CreateIndex
CREATE INDEX "sesiones_estudiante_id_estado_idx" ON "sesiones"("estudiante_id", "estado");

-- CreateIndex
CREATE INDEX "sesiones_disponibilidad_id_idx" ON "sesiones"("disponibilidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_sesion_id_key" ON "calificaciones"("sesion_id");

-- AddForeignKey
ALTER TABLE "disponibilidades" ADD CONSTRAINT "disponibilidades_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidades" ADD CONSTRAINT "disponibilidades_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "asignaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_disponibilidad_id_fkey" FOREIGN KEY ("disponibilidad_id") REFERENCES "disponibilidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "asignaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
