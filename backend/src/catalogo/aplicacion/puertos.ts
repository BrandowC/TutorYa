export interface Asignatura {
  id: number;
  nombre: string;
  activa: boolean;
}

/** Puerto de salida: catálogo de asignaturas disponibles para tutoría. */
export abstract class AsignaturaRepositorio {
  abstract listarActivas(): Promise<Asignatura[]>;
  abstract buscarPorId(id: number): Promise<Asignatura | null>;
}

export class ListarAsignaturas {
  constructor(private readonly asignaturas: AsignaturaRepositorio) {}

  ejecutar(): Promise<Asignatura[]> {
    return this.asignaturas.listarActivas();
  }
}
