"use client";

import { useState } from "react";

import { CalendarCheck2, CircleAlert, SearchX } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { useConsulta } from "@/hooks/use-consulta";
import { api } from "@/lib/api/cliente";
import { aIsoColombia, formatearRango, iniciales } from "@/lib/formato";

import { EstadoCargando, EstadoError, EstadoVacio } from "./estados-consulta";

export function BuscarTutoresPanel() {
  const [asignaturaId, setAsignaturaId] = useState("");
  const [desde, setDesde] = useState("");
  const [solicitando, setSolicitando] = useState<string | null>(null);
  const [errorSolicitud, setErrorSolicitud] = useState<string | null>(null);

  const asignaturas = useConsulta(() => api.listarAsignaturas());
  const clave = `${asignaturaId}|${desde}`;
  const resultados = useConsulta(
    () =>
      api.buscarTutores({
        asignaturaId: asignaturaId ? Number(asignaturaId) : undefined,
        desde: desde ? aIsoColombia(desde, "00:00") : undefined,
      }),
    clave,
  );

  async function solicitar(disponibilidadId: string) {
    if (solicitando) return; // evita el doble clic
    setSolicitando(disponibilidadId);
    setErrorSolicitud(null);
    try {
      await api.solicitarSesion(disponibilidadId);
      toast.success("Sesión solicitada. El tutor la confirmará pronto.");
    } catch (error) {
      setErrorSolicitud(error instanceof Error ? error.message : "No se pudo solicitar la sesión.");
    } finally {
      setSolicitando(null);
      resultados.recargar();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 py-5 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="buscar-asignatura">Asignatura</FieldLabel>
            <NativeSelect
              id="buscar-asignatura"
              className="w-full"
              value={asignaturaId}
              onChange={(e) => setAsignaturaId(e.target.value)}
            >
              <NativeSelectOption value="">Todas las asignaturas</NativeSelectOption>
              {asignaturas.estado.tipo === "listo" &&
                asignaturas.estado.datos.map((a) => (
                  <NativeSelectOption key={a.id} value={String(a.id)}>
                    {a.nombre}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="buscar-desde">Disponible desde</FieldLabel>
            <Input id="buscar-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      {errorSolicitud && (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>{errorSolicitud}</AlertDescription>
        </Alert>
      )}

      <section aria-label="Resultados de la búsqueda">
        {resultados.estado.tipo === "cargando" && <EstadoCargando etiqueta="Buscando tutores disponibles…" />}
        {resultados.estado.tipo === "error" && (
          <EstadoError mensaje={resultados.estado.mensaje} onReintentar={resultados.recargar} />
        )}
        {resultados.estado.tipo === "listo" && resultados.estado.datos.length === 0 && (
          <EstadoVacio
            icono={<SearchX />}
            titulo="No encontramos horarios disponibles"
            descripcion="Prueba con otra asignatura o con una fecha distinta."
          />
        )}
        {resultados.estado.tipo === "listo" && resultados.estado.datos.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {resultados.estado.datos.map((horario) => (
              <li key={horario.disponibilidadId}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-4 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {iniciales(horario.tutor.nombres)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{horario.tutor.nombres}</p>
                        <p className="text-muted-foreground text-sm">{horario.tutor.programa}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-primary text-lg font-bold">{horario.asignatura.nombre}</p>
                      <p className="text-muted-foreground text-sm">{formatearRango(horario.inicio, horario.fin)}</p>
                    </div>
                    <Button
                      className="mt-auto h-9"
                      disabled={solicitando !== null}
                      onClick={() => solicitar(horario.disponibilidadId)}
                      aria-label={`Solicitar sesión de ${horario.asignatura.nombre} con ${horario.tutor.nombres}`}
                    >
                      {solicitando === horario.disponibilidadId ? <Spinner /> : <CalendarCheck2 />}
                      {solicitando === horario.disponibilidadId ? "Solicitando…" : "Solicitar sesión"}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
