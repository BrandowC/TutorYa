import type { ReactNode } from "react";

import { CalendarCheck, ShieldCheck, Star } from "lucide-react";

import { Logo3D } from "@/components/marca/logo-3d";
import { LogoMarca } from "@/components/marca/logo-marca";
import { APP_CONFIG } from "@/config/app-config";

const BENEFICIOS = [
  { icono: CalendarCheck, texto: "Agenda tu tutoría en menos de 3 pasos" },
  { icono: Star, texto: "Califica cada sesión y mejora el servicio" },
  { icono: ShieldCheck, texto: "Tus datos protegidos, tu sesión segura" },
];

export default function LayoutPublico({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="fondo-marca relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <span className="burbuja -top-10 -left-10 size-56 bg-white/10" aria-hidden="true" />
        <span
          className="burbuja right-16 bottom-24 size-40 bg-[#ff7a1a]/30"
          style={{ animationDelay: "-4s" }}
          aria-hidden="true"
        />
        <span
          className="burbuja top-1/3 right-8 size-16 bg-[#00c2a8]/40"
          style={{ animationDelay: "-8s" }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
          <span>
            Tutor<span className="text-[#ffa45e]">App</span>
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-10 text-center">
          <Logo3D tamano={230} />
          <div className="space-y-3">
            <h2 className="text-4xl leading-tight font-extrabold text-balance">{APP_CONFIG.tagline}</h2>
            <p className="mx-auto max-w-md text-lg text-white/80">
              Encuentra al tutor ideal, agenda en minutos y haz seguimiento a cada sesión.
            </p>
          </div>
          <ul className="space-y-3 text-left">
            {BENEFICIOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-white/90">
                <span className="grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <Icono className="size-5" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/60">{APP_CONFIG.copyright}</p>
      </aside>

      <main className="bg-background flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[26rem] space-y-8">
          <div className="lg:hidden">
            <LogoMarca />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
