# Dossier de Calidad y Pruebas · TutorApp

Estructura recomendada por el docente (entregable 4). Se llena a medida que avanza el proyecto.

```
docs/calidad/
  01_Plan_Calidad.pdf
  02_Verificacion_Requisitos.xlsx
  03_Validacion_Requisitos.xlsx
  04_Matriz_Pruebas.xlsx
  05_Caja_Negra_Navegador/
  06_Pruebas_Unitarias/
  07_Caja_Blanca/
  08_RTL/
  09_Postman/
  10_Playwright/
  11_Errores_Defectos_Fallas_Incidentes.xlsx
  12_ISO25010.xlsx
  13_Shift_Right_Logs/
  14_Consulta_Lint_Sonar.pdf
```

## Alcance del MVP (15 SWR del SRS)

| Módulo | SWR |
| --- | --- |
| Usuarios y acceso | SWR-AUTH-001, 002, 004, 006, 007 · SWR-SEC-001 |
| Disponibilidad del tutor | SWR-DISP-001 |
| Sesiones de tutoría | SWR-AGEN-001, 002, 003, 004, 005 · SWR-CAL-001, 002, 003 |

Pruebas unitarias existentes: `backend/src/**/*.spec.ts` (ejecutar con `cd backend && npm test`).
