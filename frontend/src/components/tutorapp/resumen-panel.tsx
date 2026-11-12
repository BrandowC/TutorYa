"use client";

import Link from "next/link";

import { CalendarCheck, CalendarClock, CheckCheck, Clock3, Hourglass, Search, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConsulta } from "@/hooks/use-consulta";
import { api } from "@/lib/api/cliente";
import type { EstadoSesion, ResumenUsuario } from "@/lib/api/tipos";
import { formatearRango } from "@/lib/formato";

import { EstadoSesionBadge, etiquetaEstado } from "./estado-sesion";
import { EstadoCargando, EstadoError, EstadoVacio } from "./estados-consulta";
import { useUsuario } from "./usuario-contexto";

const COLOR_ESTADO: Record<EstadoSesion, string> = {
  SOLICITADA: "#ff7a1a",
  CONFIRMADA: "#3d4bff",
  REALIZADA: "#00c2a8",
  CANCELADA: "#9aa1c9",
  RECHAZADA: "#e5314b",
  NO_ASISTIO: "#a855f7",
};

function Indicador({
  titulo,
  valor,
  icono,
  color,
  detalle,
}: {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
  color: string;
  detalle: string;
}) {
  return (
    <Card className="relative overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} aria-hidden="true" />
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="font-medium">{titulo}</CardDescription>
        <span
          className="grid size-9 place-items-center rounded-xl text-white"
          style={{ background: color }}
          aria-hidden="true"
        >
          {icono}
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-extrabold tabular-nums" data-testid={`indicador-${titulo}`}>
          {valor}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{detalle}</p>
      </CardContent>
    </Card>
  );
}

export function ResumenPanel() {
  const usuario = useUsuario();
  const { estado, recargar } = useConsulta(() => api.resumen(), usuario.id);

  if (estado.tipo === "cargando") return <EstadoCargando etiqueta="Cargando tu resumen…" filas={2} />;
  if (estado.tipo === "error") return <EstadoError mensaje={estado.mensaje} onReintentar={recargar} />;

  return <ContenidoResumen resumen={estado.datos} />;
}

function ContenidoResumen({ resumen }: { resumen: ResumenUsuario }) {
  const esTutor = resumen.rol === "TUTOR";
  const { porEstado } = resumen;
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0);
  const estadosGrafico: EstadoSesion[] = [
    "SOLICITADA",
    "CONFIRMADA",
    "REALIZADA",
    "CANCELADA",
    "RECHAZADA",
    "NO_ASISTIO",
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo={esTutor ? "Por responder" : "Pendientes"}
          valor={porEstado.SOLICITADA}
          icono={<Hourglass className="size-5" />}
          color="#ff7a1a"
          detalle={esTutor ? "Solicitudes esperando tu respuesta" : "Esperando confirmación del tutor"}
        />
        <Indicador
          titulo="Confirmadas"
          valor={porEstado.CONFIRMADA}
          icono={<CalendarCheck className="size-5" />}
          color="#3d4bff"
          detalle="Sesiones agendadas"
        />
        <Indicador
          titulo="Realizadas"
          valor={porEstado.REALIZADA}
          icono={<CheckCheck className="size-5" />}
          color="#00c2a8"
          detalle="Tutorías completadas"
        />
        <Indicador
          titulo={esTutor ? "Horarios libres" : "Por calificar"}
          valor={resumen.indicadorEspecifico}
          icono={esTutor ? <CalendarClock className="size-5" /> : <Star className="size-5" />}
          color="#a855f7"
          detalle={esTutor ? "Disponibles para reservar" : "Sesiones realizadas sin tu nota"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="text-primary size-5" /> Próximas sesiones
            </CardTitle>
            <CardDescription>Lo que tienes pendiente o confirmado, ordenado por fecha.</CardDescription>
          </CardHeader>
          <CardContent>
            {resumen.proximas.length === 0 ? (
              <EstadoVacio
                icono={<CalendarClock />}
                titulo="Aún no tienes sesiones próximas"
                descripcion={
                  esTutor
                    ? "Publica tus horarios para que los estudiantes puedan reservar contigo."
                    : "Busca un tutor y agenda tu primera tutoría."
                }
                accion={
                  <Button asChild>
                    <Link href={esTutor ? "/dashboard/disponibilidad" : "/dashboard/buscar"}>
                      {esTutor ? <CalendarClock /> : <Search />}
                      {esTutor ? "Publicar horario" : "Buscar tutor"}
                    </Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y">
                {resumen.proximas.map((sesion) => (
                  <li key={sesion.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">{sesion.asignatura.nombre}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatearRango(sesion.inicio, sesion.fin)} ·{" "}
                        {esTutor ? `con ${sesion.estudiante.nombres}` : `con ${sesion.tutor.nombres}`}
                      </p>
                    </div>
                    <EstadoSesionBadge estado={sesion.estado} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tus sesiones por estado</CardTitle>
            <CardDescription>{total === 0 ? "Todavía no hay datos." : `${total} sesiones en total.`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="bg-muted flex h-4 overflow-hidden rounded-full"
              role="img"
              aria-label="Distribución de sesiones"
            >
              {estadosGrafico
                .filter((e) => porEstado[e] > 0)
                .map((e) => (
                  <span
                    key={e}
                    title={`${etiquetaEstado(e)}: ${porEstado[e]}`}
                    style={{ width: `${(porEstado[e] / total) * 100}%`, background: COLOR_ESTADO[e] }}
                    className="transition-all"
                  />
                ))}
            </div>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {estadosGrafico.map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ background: COLOR_ESTADO[e] }} aria-hidden="true" />
                  <span className="text-muted-foreground">{etiquetaEstado(e)}</span>
                  <span className="ml-auto font-semibold tabular-nums">{porEstado[e]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
