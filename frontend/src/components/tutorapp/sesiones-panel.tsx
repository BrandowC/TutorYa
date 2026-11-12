"use client";

import { useState } from "react";

import { cn } from "cn";
import { Ban, CalendarX2, CheckCheck, CircleAlert, ShieldAlert, Star, ThumbsDown, ThumbsUp, UserX } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useConsulta } from "@/hooks/use-consulta";
import { api } from "@/lib/api/cliente";
import type { EstadoSesion, SesionDetalle } from "@/lib/api/tipos";
import { formatearRango } from "@/lib/formato";

import { EstadoSesionBadge, etiquetaEstado } from "./estado-sesion";
import { EstadoCargando, EstadoError, EstadoVacio } from "./estados-consulta";
import { useUsuario } from "./usuario-contexto";

const ESTADOS: EstadoSesion[] = ["SOLICITADA", "CONFIRMADA", "REALIZADA", "CANCELADA", "RECHAZADA", "NO_ASISTIO"];

type Dialogo =
  | { tipo: "cancelar"; sesion: SesionDetalle }
  | { tipo: "calificar"; sesion: SesionDetalle }
  | {
      tipo: "confirmar";
      sesion: SesionDetalle;
      titulo: string;
      descripcion: string;
      etiquetaBoton: string;
      peligroso: boolean;
      accion: () => Promise<unknown>;
      exito: string;
    };

export function SesionesPanel() {
  const usuario = useUsuario();
  const esTutor = usuario.rol === "TUTOR";
  const [filtro, setFiltro] = useState<"" | EstadoSesion>("");
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const sesiones = useConsulta(() => api.misSesiones(filtro || undefined), filtro);

  /** Ejecuta una acción sobre una sesión: bloquea el doble clic, avisa y recarga la lista. */
  async function ejecutar(sesionId: string, accion: () => Promise<unknown>, exito: string): Promise<boolean> {
    if (ocupada) return false;
    setOcupada(sesionId);
    setErrorAccion(null);
    try {
      await accion();
      toast.success(exito);
      sesiones.recargar();
      return true;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "No se pudo completar la operación.";
      setErrorAccion(mensaje);
      sesiones.recargar();
      return false;
    } finally {
      setOcupada(null);
    }
  }

  const pedirConfirmacion = (d: Extract<Dialogo, { tipo: "confirmar" }>) => setDialogo(d);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field className="w-full max-w-60 gap-1.5">
          <FieldLabel htmlFor="filtro-estado">Filtrar por estado</FieldLabel>
          <NativeSelect
            id="filtro-estado"
            className="w-full"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as "" | EstadoSesion)}
          >
            <NativeSelectOption value="">Todos los estados</NativeSelectOption>
            {ESTADOS.map((estado) => (
              <NativeSelectOption key={estado} value={estado}>
                {etiquetaEstado(estado)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {errorAccion && (
        <Alert variant="destructive" role="alert">
          <CircleAlert />
          <AlertDescription>{errorAccion}</AlertDescription>
        </Alert>
      )}

      {sesiones.estado.tipo === "cargando" && <EstadoCargando etiqueta="Cargando tus sesiones…" />}
      {sesiones.estado.tipo === "error" && (
        <EstadoError mensaje={sesiones.estado.mensaje} onReintentar={sesiones.recargar} />
      )}
      {sesiones.estado.tipo === "listo" && sesiones.estado.datos.length === 0 && (
        <EstadoVacio
          icono={<CalendarX2 />}
          titulo={filtro ? "No hay sesiones con ese estado" : "Aún no tienes sesiones"}
          descripcion={
            esTutor
              ? "Cuando un estudiante reserve uno de tus horarios aparecerá aquí."
              : "Busca un tutor y agenda tu primera tutoría."
          }
        />
      )}
      {sesiones.estado.tipo === "listo" && sesiones.estado.datos.length > 0 && (
        <ul className="grid gap-4">
          {sesiones.estado.datos.map((sesion) => (
            <li key={sesion.id}>
              <TarjetaSesion
                sesion={sesion}
                esTutor={esTutor}
                bloqueada={ocupada !== null}
                enCurso={ocupada === sesion.id}
                onConfirmar={() =>
                  ejecutar(
                    sesion.id,
                    () => api.confirmarSesion(sesion.id),
                    "Sesión confirmada. El estudiante ya lo sabe.",
                  )
                }
                onRechazar={() =>
                  pedirConfirmacion({
                    tipo: "confirmar",
                    sesion,
                    titulo: "¿Rechazar esta solicitud?",
                    descripcion: "El horario volverá a quedar libre para otros estudiantes.",
                    etiquetaBoton: "Sí, rechazar",
                    peligroso: true,
                    accion: () => api.rechazarSesion(sesion.id),
                    exito: "Solicitud rechazada.",
                  })
                }
                onRealizada={() =>
                  pedirConfirmacion({
                    tipo: "confirmar",
                    sesion,
                    titulo: "¿Marcar la sesión como realizada?",
                    descripcion:
                      "Esta decisión habilita al estudiante para calificar la tutoría y no se puede deshacer.",
                    etiquetaBoton: "Sí, fue realizada",
                    peligroso: false,
                    accion: () => api.registrarEstadoFinal(sesion.id, "REALIZADA"),
                    exito: "Sesión marcada como realizada.",
                  })
                }
                onNoAsistio={() =>
                  pedirConfirmacion({
                    tipo: "confirmar",
                    sesion,
                    titulo: "¿El estudiante no asistió?",
                    descripcion: "La sesión se cerrará como «No asistió» y no se podrá calificar.",
                    etiquetaBoton: "Sí, no asistió",
                    peligroso: true,
                    accion: () => api.registrarEstadoFinal(sesion.id, "NO_ASISTIO"),
                    exito: "Sesión cerrada como «No asistió».",
                  })
                }
                onCancelar={() => setDialogo({ tipo: "cancelar", sesion })}
                onCalificar={() => setDialogo({ tipo: "calificar", sesion })}
              />
            </li>
          ))}
        </ul>
      )}

      {dialogo?.tipo === "cancelar" && (
        <DialogoCancelar
          sesion={dialogo.sesion}
          enCurso={ocupada === dialogo.sesion.id}
          onCerrar={() => setDialogo(null)}
          onEnviar={async (motivo) => {
            const ok = await ejecutar(
              dialogo.sesion.id,
              () => api.cancelarSesion(dialogo.sesion.id, motivo),
              "Sesión cancelada.",
            );
            if (ok) setDialogo(null);
          }}
        />
      )}
      {dialogo?.tipo === "calificar" && (
        <DialogoCalificar
          sesion={dialogo.sesion}
          enCurso={ocupada === dialogo.sesion.id}
          onCerrar={() => setDialogo(null)}
          onEnviar={async (puntaje, comentario) => {
            const ok = await ejecutar(
              dialogo.sesion.id,
              () => api.calificarSesion(dialogo.sesion.id, puntaje, comentario),
              "¡Gracias! Tu calificación quedó registrada.",
            );
            if (ok) setDialogo(null);
          }}
        />
      )}
      {dialogo?.tipo === "confirmar" && (
        <Dialog open onOpenChange={(abierto) => !abierto && setDialogo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="text-[#ff7a1a] size-5" /> {dialogo.titulo}
              </DialogTitle>
              <DialogDescription>{dialogo.descripcion}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogo(null)}>
                Volver
              </Button>
              <Button
                variant={dialogo.peligroso ? "destructive" : "default"}
                disabled={ocupada !== null}
                onClick={async () => {
                  const ok = await ejecutar(dialogo.sesion.id, dialogo.accion, dialogo.exito);
                  if (ok) setDialogo(null);
                }}
              >
                {ocupada !== null && <Spinner />}
                {dialogo.etiquetaBoton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface TarjetaProps {
  sesion: SesionDetalle;
  esTutor: boolean;
  bloqueada: boolean;
  enCurso: boolean;
  onConfirmar: () => void;
  onRechazar: () => void;
  onRealizada: () => void;
  onNoAsistio: () => void;
  onCancelar: () => void;
  onCalificar: () => void;
}

function Estrellas({ puntaje }: { puntaje: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Calificación: ${puntaje} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-4", n <= puntaje ? "fill-[#ff7a1a] text-[#ff7a1a]" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

function TarjetaSesion({ sesion, esTutor, bloqueada, enCurso, ...acciones }: TarjetaProps) {
  const yaInicio = new Date(sesion.inicio).getTime() <= Date.now();
  const contraparte = esTutor ? `Estudiante: ${sesion.estudiante.nombres}` : `Tutor: ${sesion.tutor.nombres}`;
  const activa = sesion.estado === "SOLICITADA" || sesion.estado === "CONFIRMADA";

  return (
    <Card className={cn("transition-shadow hover:shadow-md", enCurso && "opacity-70")}>
      <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{sesion.asignatura.nombre}</h3>
            <EstadoSesionBadge estado={sesion.estado} />
          </div>
          <p className="text-muted-foreground text-sm">{formatearRango(sesion.inicio, sesion.fin)}</p>
          <p className="text-sm">{contraparte}</p>
          {sesion.motivoCancelacion && (
            <p className="text-muted-foreground text-sm italic">Motivo: {sesion.motivoCancelacion}</p>
          )}
          {sesion.calificacion && (
            <div className="flex items-center gap-2 pt-1 text-sm">
              <Estrellas puntaje={sesion.calificacion.puntaje} />
              {sesion.calificacion.comentario && (
                <span className="text-muted-foreground">«{sesion.calificacion.comentario}»</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {esTutor && sesion.estado === "SOLICITADA" && (
            <>
              <Button disabled={bloqueada} onClick={acciones.onConfirmar}>
                {enCurso ? <Spinner /> : <ThumbsUp />} Confirmar
              </Button>
              <Button variant="outline" disabled={bloqueada} onClick={acciones.onRechazar}>
                <ThumbsDown /> Rechazar
              </Button>
            </>
          )}
          {esTutor && sesion.estado === "CONFIRMADA" && (
            <>
              <Button
                disabled={bloqueada || !yaInicio}
                title={yaInicio ? undefined : "Disponible cuando llegue la hora de la sesión"}
                onClick={acciones.onRealizada}
              >
                <CheckCheck /> Marcar realizada
              </Button>
              <Button variant="outline" disabled={bloqueada || !yaInicio} onClick={acciones.onNoAsistio}>
                <UserX /> No asistió
              </Button>
            </>
          )}
          {activa && (
            <Button variant="destructive" disabled={bloqueada} onClick={acciones.onCancelar}>
              <Ban /> Cancelar
            </Button>
          )}
          {!esTutor && sesion.estado === "REALIZADA" && !sesion.calificacion && (
            <Button disabled={bloqueada} onClick={acciones.onCalificar}>
              <Star /> Calificar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const MOTIVO_MINIMO = 5;

function DialogoCancelar({
  sesion,
  enCurso,
  onCerrar,
  onEnviar,
}: {
  sesion: SesionDetalle;
  enCurso: boolean;
  onCerrar: () => void;
  onEnviar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (motivo.trim().length < MOTIVO_MINIMO) {
      setError(`Escriba el motivo de la cancelación (mínimo ${MOTIVO_MINIMO} caracteres).`);
      return;
    }
    setError(null);
    await onEnviar(motivo.trim());
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar sesión</DialogTitle>
          <DialogDescription>
            {sesion.asignatura.nombre} · {formatearRango(sesion.inicio, sesion.fin)}. La otra persona será informada del
            motivo.
          </DialogDescription>
        </DialogHeader>
        <Field className="gap-1.5" data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="motivo-cancelacion">Motivo de la cancelación</FieldLabel>
          <Textarea
            id="motivo-cancelacion"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={300}
            rows={3}
            aria-invalid={Boolean(error)}
            placeholder="Cuéntanos brevemente qué pasó"
          />
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>
            Volver
          </Button>
          <Button variant="destructive" disabled={enCurso} onClick={enviar}>
            {enCurso && <Spinner />} Cancelar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoCalificar({
  sesion,
  enCurso,
  onCerrar,
  onEnviar,
}: {
  sesion: SesionDetalle;
  enCurso: boolean;
  onCerrar: () => void;
  onEnviar: (puntaje: number, comentario?: string) => Promise<void>;
}) {
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (puntaje < 1) {
      setError("Elija una calificación de 1 a 5 estrellas.");
      return;
    }
    setError(null);
    await onEnviar(puntaje, comentario.trim() || undefined);
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Califica tu tutoría</DialogTitle>
          <DialogDescription>
            {sesion.asignatura.nombre} con {sesion.tutor.nombres}
          </DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Tu calificación</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="has-focus-visible:ring-ring/50 cursor-pointer rounded-md p-1 transition-transform hover:scale-110 has-focus-visible:ring-3"
              >
                <input
                  type="radio"
                  name="puntaje"
                  value={n}
                  checked={puntaje === n}
                  onChange={() => setPuntaje(n)}
                  className="sr-only"
                />
                <span className="sr-only">{n === 1 ? "1 estrella" : `${n} estrellas`}</span>
                <Star
                  aria-hidden="true"
                  className={cn("size-8", n <= puntaje ? "fill-[#ff7a1a] text-[#ff7a1a]" : "text-muted-foreground/40")}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="comentario-calificacion">Comentario (opcional)</FieldLabel>
          <Textarea
            id="comentario-calificacion"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="¿Qué tal estuvo la sesión?"
          />
        </Field>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>
            Ahora no
          </Button>
          <Button disabled={enCurso} onClick={enviar}>
            {enCurso && <Spinner />} Enviar calificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
