"use client";

import { useRef } from "react";

import { cn } from "cn";

const CAPAS_DE_GROSOR = 14;
const CAPAS_DE_LETRA = 8;

/**
 * Logo 3D de TutorApp hecho con CSS 3D: un cubo redondeado con grosor real,
 * una «T» extruida y una esfera naranja que flota. Se inclina siguiendo el
 * puntero y, en reposo, flota suavemente. Respeta «reducir movimiento».
 */
export function Logo3D({ tamano = 220, className }: { tamano?: number; className?: string }) {
  const cuboRef = useRef<HTMLDivElement>(null);

  const mover = (evento: React.PointerEvent<HTMLDivElement>) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width - 0.5;
    const y = (evento.clientY - caja.top) / caja.height - 0.5;
    const cubo = cuboRef.current;
    if (!cubo) return;
    cubo.style.setProperty("--rx", `${(-y * 26).toFixed(1)}deg`);
    cubo.style.setProperty("--ry", `${(x * 34).toFixed(1)}deg`);
    cubo.dataset.activo = "true";
  };

  const soltar = () => {
    const cubo = cuboRef.current;
    if (!cubo) return;
    cubo.style.setProperty("--rx", "0deg");
    cubo.style.setProperty("--ry", "0deg");
    cubo.dataset.activo = "false";
  };

  return (
    <div
      className={cn("logo3d-escena", className)}
      style={{ ["--t" as string]: `${tamano}px` }}
      onPointerMove={mover}
      onPointerLeave={soltar}
      role="img"
      aria-label="Logo en 3D de TutorApp"
    >
      <div ref={cuboRef} className="logo3d-cubo" data-activo="false">
        {Array.from({ length: CAPAS_DE_GROSOR }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: capas decorativas estáticas
            key={i}
            className="logo3d-capa"
            style={{
              transform: `translateZ(${-(i + 1) * 2}px)`,
              filter: `brightness(${1 - i * 0.035})`,
            }}
            aria-hidden="true"
          />
        ))}
        <div className="logo3d-frente" aria-hidden="true">
          <div className="logo3d-brillo" />
          {Array.from({ length: CAPAS_DE_LETRA }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: capas decorativas estáticas
              key={i}
              className="logo3d-letra"
              style={{
                transform: `translateZ(${i * 2 + 2}px)`,
                color: i === CAPAS_DE_LETRA - 1 ? "#ffffff" : `hsl(228 55% ${88 - i * 7}%)`,
              }}
            >
              T
            </span>
          ))}
        </div>
        <div className="logo3d-esfera" aria-hidden="true">
          <span className="logo3d-esfera-brillo" />
        </div>
      </div>
      <div className="logo3d-sombra" aria-hidden="true" />
    </div>
  );
}
