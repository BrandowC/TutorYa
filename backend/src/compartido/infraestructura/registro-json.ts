import { Injectable } from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Registro, type Metadatos } from '../aplicacion/registro.puerto.js';

type Nivel = 'INFO' | 'WARN' | 'ERROR';

/**
 * Adaptador de logs: una línea JSON por evento con timestamp, level, context,
 * event, message y metadata. Escribe en consola y, si se configura LOG_FILE,
 * también en un archivo (evidencia para Shift Right).
 */
@Injectable()
export class RegistroJson extends Registro {
  constructor(private readonly archivo?: string) {
    super();
    if (archivo) {
      mkdirSync(path.dirname(archivo), { recursive: true });
    }
  }

  info(contexto: string, evento: string, mensaje: string, metadatos?: Metadatos): void {
    this.escribir('INFO', contexto, evento, mensaje, metadatos);
  }

  warn(contexto: string, evento: string, mensaje: string, metadatos?: Metadatos): void {
    this.escribir('WARN', contexto, evento, mensaje, metadatos);
  }

  error(contexto: string, evento: string, mensaje: string, metadatos?: Metadatos): void {
    this.escribir('ERROR', contexto, evento, mensaje, metadatos);
  }

  private escribir(
    level: Nivel,
    context: string,
    event: string,
    message: string,
    metadata: Metadatos = {},
  ): void {
    const linea = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context,
      event,
      message,
      metadata,
    });
    if (level === 'ERROR') {
      console.error(linea);
    } else {
      console.log(linea);
    }
    if (this.archivo) {
      try {
        appendFileSync(this.archivo, linea + '\n');
      } catch {
        // Un fallo al escribir el archivo nunca debe tumbar la operación del usuario.
      }
    }
  }
}
