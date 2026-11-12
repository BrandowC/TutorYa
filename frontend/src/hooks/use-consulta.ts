"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, MENSAJE_SESION_EXPIRADA } from "@/lib/api/cliente";

export type EstadoConsulta<T> = { tipo: "cargando" } | { tipo: "error"; mensaje: string } | { tipo: "listo"; datos: T };

/** Devuelve el mensaje legible y, si la sesión expiró, vuelve al login. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 && typeof window !== "undefined") {
      window.location.assign("/api/auth/salir?expirada=1");
    }
    return error.message;
  }
  return "Ocurrió un error inesperado. Intente de nuevo.";
}

/**
 * Ejecuta una consulta y expone cargando / error / listo. Cambiar `clave`
 * (por ejemplo, un filtro) o llamar a `recargar()` vuelve a consultar y
 * muestra de nuevo el estado de carga.
 */
export function useConsulta<T>(consulta: () => Promise<T>, clave = "") {
  const [recarga, setRecarga] = useState(0);
  const [resultado, setResultado] = useState<{ clave: string; estado: EstadoConsulta<T> } | null>(null);
  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;
  const claveActual = `${clave}#${recarga}`;

  useEffect(() => {
    let vigente = true;
    consultaRef
      .current()
      .then((datos) => vigente && setResultado({ clave: claveActual, estado: { tipo: "listo", datos } }))
      .catch(
        (error: unknown) =>
          vigente && setResultado({ clave: claveActual, estado: { tipo: "error", mensaje: mensajeDeError(error) } }),
      );
    return () => {
      vigente = false;
    };
  }, [claveActual]);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);
  const estado: EstadoConsulta<T> =
    resultado && resultado.clave === claveActual ? resultado.estado : { tipo: "cargando" };
  return { estado, recargar };
}

export { MENSAJE_SESION_EXPIRADA };
