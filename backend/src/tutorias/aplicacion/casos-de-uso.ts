import { exigirRol } from '../../acceso/dominio/reglas-acceso.js';
import type { Actor } from '../../acceso/dominio/usuario.js';
import type { Registro } from '../../compartido/aplicacion/registro.puerto.js';
import {
  errorDeConflicto,
  errorNoEncontrado,
} from '../../compartido/dominio/errores.js';
import type { PoliticaDeTiempo, Reloj } from '../../compartido/dominio/reloj.js';
import type { DisponibilidadRepositorio } from '../../disponibilidad/aplicacion/puertos.js';
import {
  cancelar,
  confirmar,
  rechazar,
  registrarEstadoFinal,
  validarCalificacion,
  validarSolicitud,
  type DatosCalificacion,
  type EstadoSesion,
  type Sesion,
} from '../dominio/sesion.js';
import type {
  Calificacion,
  ResumenUsuario,
  SesionDetalle,
  SesionRepositorio,
} from './puertos.js';

const CONTEXTO = 'SesionesService';

async function cargarSesion(sesiones: SesionRepositorio, id: string): Promise<Sesion> {
  const sesion = await sesiones.buscarPorId(id);
  if (!sesion) {
    throw errorNoEncontrado('SESION_NO_ENCONTRADA', 'La sesión solicitada no existe.');
  }
  return sesion;
}

function duracionDesde(inicio: number): number {
  return Math.round(performance.now() - inicio);
}

/** SWR-AGEN-002: el estudiante solicita una sesión sobre un horario libre. */
export class SolicitarSesion {
  constructor(
    private readonly sesiones: SesionRepositorio,
    private readonly disponibilidades: DisponibilidadRepositorio,
    private readonly reloj: Reloj,
    private readonly politica: PoliticaDeTiempo,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, disponibilidadId: string): Promise<Sesion> {
    exigirRol(actor, 'ESTUDIANTE');
    const medicion = performance.now();
    const disponibilidad = await this.disponibilidades.buscarPorId(disponibilidadId);
    if (!disponibilidad) {
      throw errorNoEncontrado('DISPONIBILIDAD_NO_ENCONTRADA', 'El horario solicitado no existe.');
    }
    validarSolicitud(disponibilidad.inicio, this.reloj.ahora(), this.politica);
    if (await this.sesiones.hayActivaEnDisponibilidad(disponibilidadId)) {
      this.registro.warn(CONTEXTO, 'SESSION_REJECTED', 'Horario ya reservado', {
        userId: actor.id,
        availabilityId: disponibilidadId,
      });
      throw errorDeConflicto('HORARIO_NO_DISPONIBLE', 'Ese horario ya fue reservado por otro estudiante.');
    }
    const sesion = await this.sesiones.crear({
      disponibilidadId,
      tutorId: disponibilidad.tutorId,
      estudianteId: actor.id,
      asignaturaId: disponibilidad.asignaturaId,
      inicio: disponibilidad.inicio,
      fin: disponibilidad.fin,
    });
    this.registro.info(CONTEXTO, 'SESSION_REQUESTED', 'Sesión solicitada', {
      sessionId: sesion.id,
      userId: actor.id,
      duracionMs: duracionDesde(medicion),
    });
    return sesion;
  }
}

/** SWR-AGEN-003: el tutor confirma una solicitud (SWR-AGEN-005 evita superposiciones). */
export class ConfirmarSesion {
  constructor(
    private readonly sesiones: SesionRepositorio,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, sesionId: string): Promise<Sesion> {
    exigirRol(actor, 'TUTOR');
    const medicion = performance.now();
    const sesion = await cargarSesion(this.sesiones, sesionId);
    const confirmadas = await this.sesiones.confirmadasDelTutor(actor.id);
    let confirmada: Sesion;
    try {
      confirmada = confirmar(sesion, actor.id, confirmadas);
    } catch (error) {
      this.registro.warn(CONTEXTO, 'SESSION_REJECTED', 'Confirmación rechazada por regla de negocio', {
        sessionId: sesionId,
        userId: actor.id,
      });
      throw error;
    }
    const guardada = await this.sesiones.actualizar(confirmada);
    this.registro.info(CONTEXTO, 'SESSION_CONFIRMED', 'Sesión confirmada', {
      sessionId: sesionId,
      userId: actor.id,
      duracionMs: duracionDesde(medicion),
    });
    return guardada;
  }
}

/** SWR-AGEN-003: el tutor rechaza una solicitud. */
export class RechazarSesion {
  constructor(
    private readonly sesiones: SesionRepositorio,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, sesionId: string): Promise<Sesion> {
    exigirRol(actor, 'TUTOR');
    const sesion = await cargarSesion(this.sesiones, sesionId);
    const guardada = await this.sesiones.actualizar(rechazar(sesion, actor.id));
    this.registro.info(CONTEXTO, 'SESSION_REJECTED_BY_TUTOR', 'Solicitud rechazada por el tutor', {
      sessionId: sesionId,
      userId: actor.id,
    });
    return guardada;
  }
}

/** SWR-AGEN-004: cancelación por cualquiera de las partes, con motivo. */
export class CancelarSesion {
  constructor(
    private readonly sesiones: SesionRepositorio,
    private readonly reloj: Reloj,
    private readonly politica: PoliticaDeTiempo,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, sesionId: string, motivo: string): Promise<Sesion> {
    const sesion = await cargarSesion(this.sesiones, sesionId);
    const cancelada = cancelar(sesion, actor.id, motivo, this.reloj.ahora(), this.politica);
    const guardada = await this.sesiones.actualizar(cancelada);
    this.registro.info(CONTEXTO, 'SESSION_CANCELLED', 'Sesión cancelada', {
      sessionId: sesionId,
      userId: actor.id,
      rol: actor.rol,
    });
    return guardada;
  }
}

/** SWR-CAL-001: el tutor registra si la sesión se realizó o el estudiante no asistió. */
export class RegistrarEstadoFinal {
  constructor(
    private readonly sesiones: SesionRepositorio,
    private readonly reloj: Reloj,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, sesionId: string, estadoFinal: string): Promise<Sesion> {
    exigirRol(actor, 'TUTOR');
    const sesion = await cargarSesion(this.sesiones, sesionId);
    const cerrada = registrarEstadoFinal(sesion, actor.id, estadoFinal, this.reloj.ahora());
    const guardada = await this.sesiones.actualizar(cerrada);
    this.registro.info(CONTEXTO, 'SESSION_CLOSED', 'Estado final registrado', {
      sessionId: sesionId,
      userId: actor.id,
      estado: cerrada.estado,
    });
    return guardada;
  }
}

/** SWR-CAL-002 y SWR-CAL-003: el estudiante califica una sesión realizada. */
export class CalificarSesion {
  constructor(
    private readonly sesiones: SesionRepositorio,
    private readonly registro: Registro,
  ) {}

  async ejecutar(actor: Actor, sesionId: string, datos: DatosCalificacion): Promise<Calificacion> {
    exigirRol(actor, 'ESTUDIANTE');
    const sesion = await cargarSesion(this.sesiones, sesionId);
    try {
      validarCalificacion(sesion, actor.id, datos);
    } catch (error) {
      this.registro.warn(CONTEXTO, 'RATING_REJECTED', 'Calificación rechazada por regla de negocio', {
        sessionId: sesionId,
        userId: actor.id,
      });
      throw error;
    }
    if (await this.sesiones.buscarCalificacion(sesionId)) {
      throw errorDeConflicto('SESION_YA_CALIFICADA', 'Esta sesión ya fue calificada.');
    }
    const calificacion = await this.sesiones.crearCalificacion({
      sesionId,
      estudianteId: actor.id,
      puntaje: datos.puntaje,
      comentario: datos.comentario?.trim() || null,
    });
    this.registro.info(CONTEXTO, 'RATING_CREATED', 'Sesión calificada', {
      sessionId: sesionId,
      userId: actor.id,
      puntaje: datos.puntaje,
    });
    return calificacion;
  }
}

export class ListarMisSesiones {
  constructor(private readonly sesiones: SesionRepositorio) {}

  ejecutar(actor: Actor, estado?: EstadoSesion): Promise<SesionDetalle[]> {
    return this.sesiones.listarPorUsuario(actor.id, actor.rol, estado);
  }
}

export class ObtenerResumen {
  constructor(
    private readonly sesiones: SesionRepositorio,
    private readonly reloj: Reloj,
  ) {}

  ejecutar(actor: Actor): Promise<ResumenUsuario> {
    return this.sesiones.obtenerResumen(actor.id, actor.rol, this.reloj.ahora());
  }
}
