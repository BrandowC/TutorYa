import type { SVGProps } from "react";

import { cn } from "cn";

/** Ícono de TutorApp (versión vectorial plana, para menús, encabezados y favicon). */
export function LogoIcono({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="30 40 430 400"
      role="img"
      aria-label="Logo de TutorApp"
      className={cn("size-8", className)}
      {...props}
    >
      <defs>
        <linearGradient id="ta-cuerpo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f7dff" />
          <stop offset="0.55" stopColor="#3d4bff" />
          <stop offset="1" stopColor="#1a22a8" />
        </linearGradient>
        <linearGradient id="ta-brillo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ta-esfera" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffd0a1" />
          <stop offset="0.45" stopColor="#ff7a1a" />
          <stop offset="1" stopColor="#c24a00" />
        </radialGradient>
      </defs>
      <rect x="48" y="64" width="360" height="360" rx="104" fill="url(#ta-cuerpo)" />
      <rect x="62" y="74" width="332" height="170" rx="92" fill="url(#ta-brillo)" />
      <path d="M148 168h160v52h-54v132h-52V220h-54z" fill="#0f1538" opacity="0.28" transform="translate(5 9)" />
      <path d="M148 168h160v52h-54v132h-52V220h-54z" fill="#ffffff" />
      <circle cx="394" cy="118" r="62" fill="url(#ta-esfera)" />
      <circle cx="374" cy="96" r="14" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

/** Ícono + nombre. «App» va en naranja de marca. */
export function LogoMarca({ className, conTexto = true }: { className?: string; conTexto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoIcono className="size-9 shrink-0" />
      {conTexto && (
        <span className="text-xl font-extrabold tracking-tight">
          Tutor<span className="text-[#ff7a1a]">App</span>
        </span>
      )}
    </span>
  );
}
