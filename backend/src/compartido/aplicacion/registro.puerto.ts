export type Metadatos = Record<string, string | number | boolean | null | undefined>;

/**
 * Puerto de logs (Shift Right). Los casos de uso registran eventos con un
 * nombre estable (event) y metadatos no sensibles; nunca contraseñas ni tokens.
 */
export abstract class Registro {
  abstract info(contexto: string, evento: string, mensaje: string, metadatos?: Metadatos): void;
  abstract warn(contexto: string, evento: string, mensaje: string, metadatos?: Metadatos): void;
  abstract error(contexto: string, evento: string, mensaje: string, metadatos?: Metadatos): void;
}

/** Útil en pruebas unitarias: ignora todos los eventos. */
export class RegistroSilencioso extends Registro {
  info(): void {}
  warn(): void {}
  error(): void {}
}
