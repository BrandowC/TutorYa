import { z } from "zod";

export const LARGO_MINIMO_PASSWORD = 8;

export interface ReglaPassword {
  id: "largo" | "letras" | "numeros";
  texto: string;
  cumple: boolean;
}

/** Las reglas que el usuario ve mientras escribe su contraseña (RN-06). */
export function evaluarPassword(password: string): ReglaPassword[] {
  return [
    {
      id: "largo",
      texto: `Mínimo ${LARGO_MINIMO_PASSWORD} caracteres`,
      cumple: password.length >= LARGO_MINIMO_PASSWORD,
    },
    { id: "letras", texto: "Al menos una letra", cumple: /[A-Za-z]/.test(password) },
    { id: "numeros", texto: "Al menos un número", cumple: /\d/.test(password) },
  ];
}

export const esquemaLogin = z.object({
  correo: z.string().trim().min(1, "Ingrese su correo electrónico.").pipe(z.email("Ingrese un correo válido.")),
  password: z.string().min(1, "Ingrese su contraseña."),
});

export const esquemaRegistro = z.object({
  nombres: z
    .string()
    .trim()
    .min(3, "Escriba sus nombres completos (mínimo 3 caracteres).")
    .max(100, "Los nombres no pueden superar 100 caracteres."),
  correo: z.string().trim().min(1, "Ingrese su correo electrónico.").pipe(z.email("Ingrese un correo válido.")),
  programa: z
    .string()
    .trim()
    .min(2, "Indique su programa académico.")
    .max(100, "El programa no puede superar 100 caracteres."),
  rol: z.enum(["ESTUDIANTE", "TUTOR"], { message: "Elija cómo quiere registrarse." }),
  password: z
    .string()
    .min(LARGO_MINIMO_PASSWORD, `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`)
    .refine((valor) => /[A-Za-z]/.test(valor) && /\d/.test(valor), "La contraseña debe incluir letras y números."),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;
export type DatosRegistroFormulario = z.infer<typeof esquemaRegistro>;

export const DURACIONES_MINUTOS = [30, 45, 60, 90, 120] as const;

export const esquemaDisponibilidad = z.object({
  asignaturaId: z.string().min(1, "Seleccione una asignatura."),
  fecha: z.string().min(1, "Seleccione la fecha."),
  hora: z.string().min(1, "Seleccione la hora de inicio."),
  duracion: z.string().min(1, "Seleccione la duración."),
});

export type DatosDisponibilidadFormulario = z.infer<typeof esquemaDisponibilidad>;
