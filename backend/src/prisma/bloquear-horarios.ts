import type { Prisma } from '../generated/prisma/client.js';

/** Serializa los cambios de disponibilidad y las nuevas reservas del mismo tutor. */
export async function bloquearHorariosDelTutor(tx: Prisma.TransactionClient, tutorId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${tutorId} FOR NO KEY UPDATE`;
}
