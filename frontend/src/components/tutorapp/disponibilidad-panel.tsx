"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CalendarPlus, CircleAlert, Lock } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { useConsulta } from "@/hooks/use-consulta";
import { api } from "@/lib/api/cliente";
import { aIsoColombia, formatearRango, sumarMinutos } from "@/lib/formato";
import { type DatosDisponibilidadFormulario, DURACIONES_MINUTOS, esquemaDisponibilidad } from "@/lib/validaciones";

import { EstadoCargando, EstadoError, EstadoVacio } from "./estados-consulta";

export function DisponibilidadPanel() {
  const asignaturas = useConsulta(() => api.listarAsignaturas());
  const disponibilidades = useConsulta(() => api.misDisponibilidades());
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const form = useForm<DatosDisponibilidadFormulario>({
    resolver: zodResolver(esquemaDisponibilidad),
    defaultValues: { asignaturaId: "", fecha: "", hora: "", duracion: "60" },
  });
  const { isSubmitting } = form.formState;

  async function publicar(datos: DatosDisponibilidadFormulario) {
    setErrorApi(null);
    const inicio = aIsoColombia(datos.fecha, datos.hora);
    try {
      await api.crearDisponibilidad({
        asignaturaId: Number(datos.asignaturaId),
        inicio,
        fin: sumarMinutos(inicio, Number(datos.duracion)),
      });
      toast.success("Horario publicado. Los estudiantes ya pueden reservarlo.");
      form.reset({ ...form.getValues(), fecha: "", hora: "" });
      disponibilidades.recargar();
    } catch (error) {
      setErrorApi(error instanceof Error ? error.message : "No se pudo publicar el horario.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="text-primary size-5" /> Nuevo horario
          </CardTitle>
          <CardDescription>Elige la asignatura, el día y la hora. Las horas son de Colombia.</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={form.handleSubmit(publicar)} className="flex flex-col gap-4">
            {errorApi && (
              <Alert variant="destructive" role="alert">
                <CircleAlert />
                <AlertDescription>{errorApi}</AlertDescription>
              </Alert>
            )}
            {asignaturas.estado.tipo === "error" && (
              <EstadoError mensaje={asignaturas.estado.mensaje} onReintentar={asignaturas.recargar} />
            )}
            <FieldGroup className="gap-4">
              <Controller
                control={form.control}
                name="asignaturaId"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="disp-asignatura">Asignatura</FieldLabel>
                    <NativeSelect {...field} id="disp-asignatura" aria-invalid={fieldState.invalid} className="w-full">
                      <NativeSelectOption value="">
                        {asignaturas.estado.tipo === "cargando" ? "Cargando asignaturas…" : "Seleccione una asignatura"}
                      </NativeSelectOption>
                      {asignaturas.estado.tipo === "listo" &&
                        asignaturas.estado.datos.map((a) => (
                          <NativeSelectOption key={a.id} value={String(a.id)}>
                            {a.nombre}
                          </NativeSelectOption>
                        ))}
                    </NativeSelect>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={form.control}
                  name="fecha"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="disp-fecha">Fecha</FieldLabel>
                      <Input {...field} id="disp-fecha" type="date" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="hora"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="disp-hora">Hora de inicio</FieldLabel>
                      <Input {...field} id="disp-hora" type="time" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <Controller
                control={form.control}
                name="duracion"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="disp-duracion">Duración</FieldLabel>
                    <NativeSelect {...field} id="disp-duracion" className="w-full">
                      {DURACIONES_MINUTOS.map((minutos) => (
                        <NativeSelectOption key={minutos} value={String(minutos)}>
                          {minutos} minutos
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            </FieldGroup>
            <Button type="submit" size="lg" className="h-10" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <CalendarPlus />}
              {isSubmitting ? "Publicando…" : "Publicar horario"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section aria-label="Mis horarios publicados" className="space-y-3">
        <h2 className="text-xl font-bold">Mis horarios publicados</h2>
        {disponibilidades.estado.tipo === "cargando" && <EstadoCargando etiqueta="Cargando tus horarios…" />}
        {disponibilidades.estado.tipo === "error" && (
          <EstadoError mensaje={disponibilidades.estado.mensaje} onReintentar={disponibilidades.recargar} />
        )}
        {disponibilidades.estado.tipo === "listo" && disponibilidades.estado.datos.length === 0 && (
          <EstadoVacio
            icono={<CalendarClock />}
            titulo="Todavía no has publicado horarios"
            descripcion="Usa el formulario para ofrecer tu primera tutoría."
          />
        )}
        {disponibilidades.estado.tipo === "listo" && disponibilidades.estado.datos.length > 0 && (
          <ul className="grid gap-3">
            {disponibilidades.estado.datos.map((d) => (
              <li key={d.id}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold">{d.asignatura.nombre}</p>
                      <p className="text-muted-foreground text-sm">{formatearRango(d.inicio, d.fin)}</p>
                    </div>
                    {d.reservada ? (
                      <Badge className="border-transparent bg-[#e5e8ff] font-semibold text-[#1d2480] dark:bg-[#222c6b] dark:text-[#dfe3ff]">
                        <Lock className="size-3" /> Reservado
                      </Badge>
                    ) : (
                      <Badge className="border-transparent bg-[#d9f8f2] font-semibold text-[#00695a] dark:bg-[#0f3a3a] dark:text-[#2de0c4]">
                        Libre
                      </Badge>
                    )}
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
