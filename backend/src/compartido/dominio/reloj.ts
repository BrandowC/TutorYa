/** Puerto: permite controlar la hora en las pruebas sin depender del reloj real. */
export abstract class Reloj {
  abstract ahora(): Date;
}

/** Política de tiempo configurable (variable PERMITIR_HORARIOS_PASADOS). */
export interface PoliticaDeTiempo {
  permitirHorariosPasados: boolean;
}
