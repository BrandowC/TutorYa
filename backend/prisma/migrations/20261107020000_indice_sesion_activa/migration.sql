-- Un horario (disponibilidad) solo puede tener UNA sesión activa a la vez.
-- Protege contra dos solicitudes simultáneas al mismo horario (SWR-AGEN-002 / SWR-AGEN-005).
CREATE UNIQUE INDEX "sesiones_disponibilidad_activa_uq"
ON "sesiones" ("disponibilidad_id")
WHERE "estado" IN ('SOLICITADA', 'CONFIRMADA');

-- Reglas de integridad que la base también hace cumplir.
ALTER TABLE "calificaciones"
  ADD CONSTRAINT "calificaciones_puntaje_rango" CHECK ("puntaje" BETWEEN 1 AND 5);
ALTER TABLE "disponibilidades"
  ADD CONSTRAINT "disponibilidades_fin_posterior" CHECK ("fin" > "inicio");
