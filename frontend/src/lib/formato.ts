const ZONA = "America/Bogota";

const fechaLarga = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: ZONA,
});

const soloHora = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: ZONA,
});

export function formatearFecha(iso: string): string {
  return fechaLarga.format(new Date(iso));
}

export function formatearHora(iso: string): string {
  return soloHora.format(new Date(iso));
}

/** Ejemplo: «lun, 9 nov · 9:00 a. m. – 10:00 a. m.» (hora de Colombia). */
export function formatearRango(inicio: string, fin: string): string {
  return `${formatearFecha(inicio)} · ${formatearHora(inicio)} – ${formatearHora(fin)}`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

/**
 * Convierte fecha («2026-11-09») y hora («14:30») escritas en hora de Colombia
 * (UTC-5, sin horario de verano) al instante ISO que espera la API.
 */
export function aIsoColombia(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00-05:00`).toISOString();
}

export function sumarMinutos(iso: string, minutos: number): string {
  return new Date(new Date(iso).getTime() + minutos * 60_000).toISOString();
}
