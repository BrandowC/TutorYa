import { exigirRol } from '../../acceso/dominio/reglas-acceso.js';
import type { Actor } from '../../acceso/dominio/usuario.js';
import type { Registro } from '../../compartido/aplicacion/registro.puerto.js';
import {
  errorDeConflicto,
  errorDeValidacion,
} from '../../compartido/dominio/errores.js';
import type { PoliticaDeTiempo, Reloj } from '../../compartido/dominio/reloj.js';
import type { AsignaturaRepositorio } from '../../catalogo/aplicacion/puertos.js';
import { haySolapamiento, validarBloque } from '../dominio/bloque-horario.js';
import type {
  Disponibilidad,
  DisponibilidadDetalle,
  DisponibilidadRepositorio,
  HorarioLibre,
} from './puertos.js';

const CONTEXTO = 'DisponibilidadService';
const LIMITE_BUSQUEDA = 50;

export interface DatosDisponibilidad {
  asignaturaId: number;
  inicio: Date;
  fin: Date;
}

/** SWR-DISP-001: el tutor registra bloques horarios indicando la asignatura. */
export class RegistrarDisponibilidad {
  constructor(
    private readonly disponibilidades: DisponibilidadRepositorio,
    private readonly asignaturas: AsignaturaRepositorio,
    private readonly reloj: Reloj,
    private readonly politica: PoliticaDeTiempo,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, datos: DatosDisponibilidad): Promise<Disponibilidad> {
    exigirRol(actor, 'TUTOR');
    try {
      validarBloque(datos, this.reloj.ahora(), this.politica);
    } catch (error) {
      this.registro.warn(CONTEXTO, 'AVAILABILITY_REJECTED', 'Bloque horario inválido', {
        userId: actor.id,
      });
      throw error;
    }

    const asignatura = await this.asignaturas.buscarPorId(datos.asignaturaId);
    if (!asignatura || !asignatura.activa) {
      throw errorDeValidacion('ASIGNATURA_INVALIDA', 'La asignatura seleccionada no existe o no está activa.');
    }

    const solapadas = await this.disponibilidades.buscarSolapadas(actor.id, datos.inicio, datos.fin);
    if (solapadas.some((existente) => haySolapamiento(existente, datos))) {
      this.registro.warn(CONTEXTO, 'AVAILABILITY_REJECTED', 'Bloque superpuesto con otro del tutor', {
        userId: actor.id,
        motivo: 'SOLAPAMIENTO',
      });
      throw errorDeConflicto('BLOQUE_SOLAPADO', 'Ya tiene un bloque de disponibilidad que se cruza con ese horario.');
    }

    const creada = await this.disponibilidades.crear({ tutorId: actor.id, ...datos });
    this.registro.info(CONTEXTO, 'AVAILABILITY_CREATED', 'Disponibilidad registrada', {
      availabilityId: creada.id,
      userId: actor.id,
      asignaturaId: datos.asignaturaId,
    });
    return creada;
  }
}

export class ListarMisDisponibilidades {
  constructor(private readonly disponibilidades: DisponibilidadRepositorio) {}

  ejecutar(actor: Actor): Promise<DisponibilidadDetalle[]> {
    exigirRol(actor, 'TUTOR');
    return this.disponibilidades.listarPorTutor(actor.id);
  }
}

export interface ConsultaBusqueda {
  asignaturaId?: number;
  desde?: Date;
  hasta?: Date;
}

/** SWR-AGEN-001: el estudiante busca tutores con horarios libres por asignatura y franja. */
export class BuscarTutoresDisponibles {
  constructor(
    private readonly disponibilidades: DisponibilidadRepositorio,
    private readonly reloj: Reloj,
    private readonly politica: PoliticaDeTiempo,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, consulta: ConsultaBusqueda): Promise<HorarioLibre[]> {
    exigirRol(actor, 'ESTUDIANTE');
    if (consulta.desde && consulta.hasta && consulta.hasta <= consulta.desde) {
      throw errorDeValidacion('RANGO_BUSQUEDA_INVALIDO', 'La fecha final debe ser posterior a la inicial.');
    }
    const inicioMedicion = performance.now();
    const resultados = await this.disponibilidades.buscarLibres({
      ...consulta,
      soloFuturosDesde: this.politica.permitirHorariosPasados ? undefined : this.reloj.ahora(),
      limite: LIMITE_BUSQUEDA,
    });
    this.registro.info(CONTEXTO, 'TUTOR_SEARCH', 'Búsqueda de tutores disponibles', {
      userId: actor.id,
      asignaturaId: consulta.asignaturaId,
      resultados: resultados.length,
      duracionMs: Math.round(performance.now() - inicioMedicion),
    });
    return resultados;
  }
}
