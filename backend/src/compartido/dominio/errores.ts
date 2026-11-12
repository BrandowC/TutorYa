export type TipoError =
  | 'VALIDACION'
  | 'CONFLICTO'
  | 'NO_ENCONTRADO'
  | 'PROHIBIDO'
  | 'NO_AUTENTICADO';

/**
 * Error de negocio. El dominio lo lanza sin saber nada de HTTP;
 * la capa de infraestructura lo traduce al código de estado correspondiente.
 */
export class ErrorDeDominio extends Error {
  constructor(
    readonly tipo: TipoError,
    readonly codigo: string,
    mensaje: string,
    readonly detalles: string[] = [],
  ) {
    super(mensaje);
    this.name = 'ErrorDeDominio';
  }
}

export const errorDeValidacion = (
  codigo: string,
  mensaje: string,
  detalles: string[] = [],
) => new ErrorDeDominio('VALIDACION', codigo, mensaje, detalles);

export const errorDeConflicto = (codigo: string, mensaje: string) =>
  new ErrorDeDominio('CONFLICTO', codigo, mensaje);

export const errorNoEncontrado = (codigo: string, mensaje: string) =>
  new ErrorDeDominio('NO_ENCONTRADO', codigo, mensaje);

export const errorProhibido = (codigo: string, mensaje: string) =>
  new ErrorDeDominio('PROHIBIDO', codigo, mensaje);

export const errorNoAutenticado = (codigo: string, mensaje: string) =>
  new ErrorDeDominio('NO_AUTENTICADO', codigo, mensaje);
