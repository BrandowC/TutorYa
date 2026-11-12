import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "TutorApp",
  tagline: "Tutorías académicas sin enredos",
  version: packageJson.version,
  copyright: `© ${currentYear} TutorApp · CORHUILA`,
  meta: {
    title: "TutorApp · Gestión de tutorías académicas",
    description: "Encuentra tutor, agenda tu sesión y califícala. Plataforma de tutorías académicas de CORHUILA.",
  },
};
