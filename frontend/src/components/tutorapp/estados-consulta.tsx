import type { ReactNode } from "react";

import { CircleAlert, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

/** Estado «cargando»: esqueletos con el mismo aspecto que las tarjetas finales. */
export function EstadoCargando({ etiqueta = "Cargando…", filas = 3 }: { etiqueta?: string; filas?: number }) {
  return (
    <output aria-live="polite" className="grid gap-3">
      <span className="sr-only">{etiqueta}</span>
      {Array.from({ length: filas }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: esqueletos estáticos
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </output>
  );
}

export function EstadoError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlert />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{mensaje}</span>
        <Button size="sm" variant="outline" onClick={onReintentar}>
          <RefreshCw /> Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <Empty className="bg-card rounded-xl border border-dashed py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icono}</EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descripcion}</EmptyDescription>
      </EmptyHeader>
      {accion}
    </Empty>
  );
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="text-muted-foreground mt-1">{descripcion}</p>
      </div>
      {acciones}
    </div>
  );
}
