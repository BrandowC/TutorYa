import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Registro } from '../aplicacion/registro.puerto.js';
import { ErrorDeDominio, type TipoError } from '../dominio/errores.js';

const CONTEXTO = 'FiltroDeExcepciones';

const ESTADO_POR_TIPO: Record<TipoError, number> = {
  VALIDACION: HttpStatus.BAD_REQUEST,
  NO_AUTENTICADO: HttpStatus.UNAUTHORIZED,
  PROHIBIDO: HttpStatus.FORBIDDEN,
  NO_ENCONTRADO: HttpStatus.NOT_FOUND,
  CONFLICTO: HttpStatus.CONFLICT,
};

interface CuerpoError {
  statusCode: number;
  codigo: string;
  message: string;
  detalles?: string[];
}

/**
 * Traduce cualquier error a una respuesta JSON uniforme y deja un log útil.
 * Los errores inesperados nunca exponen su detalle interno al cliente.
 */
@Catch()
export class FiltroDeExcepciones implements ExceptionFilter {
  constructor(private readonly registro: Registro) {}

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const respuesta = http.getResponse<Response>();
    const peticion = http.getRequest<Request>();
    const { statusCode, cuerpo } = this.traducir(excepcion);
    const metadatos = {
      status: statusCode,
      codigo: cuerpo.codigo,
      metodo: peticion.method,
      ruta: peticion.path,
    };

    if (statusCode >= 500) {
      const detalle = excepcion instanceof Error ? excepcion : new Error(String(excepcion));
      this.registro.error(CONTEXTO, 'UNHANDLED_ERROR', detalle.message, {
        ...metadatos,
        pila: detalle.stack?.split('\n').slice(0, 4).join(' | '),
      });
    } else if (excepcion instanceof ErrorDeDominio && excepcion.tipo === 'VALIDACION') {
      this.registro.warn(CONTEXTO, 'VALIDATION_REJECTED', cuerpo.message, metadatos);
    } else if (statusCode === 401 || statusCode === 403) {
      this.registro.warn(CONTEXTO, 'ACCESS_DENIED', cuerpo.message, metadatos);
    } else {
      this.registro.warn(CONTEXTO, 'REQUEST_REJECTED', cuerpo.message, metadatos);
    }

    respuesta.status(statusCode).json(cuerpo);
  }

  private traducir(excepcion: unknown): { statusCode: number; cuerpo: CuerpoError } {
    if (excepcion instanceof ErrorDeDominio) {
      const statusCode = ESTADO_POR_TIPO[excepcion.tipo];
      return {
        statusCode,
        cuerpo: {
          statusCode,
          codigo: excepcion.codigo,
          message: excepcion.message,
          ...(excepcion.detalles.length > 0 && { detalles: excepcion.detalles }),
        },
      };
    }
    if (excepcion instanceof HttpException) {
      const statusCode = excepcion.getStatus();
      const respuesta = excepcion.getResponse();
      const mensaje =
        typeof respuesta === 'string'
          ? respuesta
          : ((respuesta as { message?: string | string[] }).message ?? excepcion.message);
      const lista = Array.isArray(mensaje) ? mensaje : [mensaje];
      return {
        statusCode,
        cuerpo: {
          statusCode,
          codigo: statusCode === 404 ? 'RUTA_NO_ENCONTRADA' : 'PETICION_INVALIDA',
          message: lista[0] ?? 'Petición inválida.',
          ...(lista.length > 1 && { detalles: lista }),
        },
      };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      cuerpo: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        codigo: 'ERROR_INTERNO',
        message: 'Ocurrió un error interno. Intente de nuevo en unos minutos.',
      },
    };
  }
}
