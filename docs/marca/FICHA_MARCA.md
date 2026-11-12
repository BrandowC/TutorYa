# Ficha de marca · TutorApp

| Elemento de identidad | Entregable |
| --- | --- |
| **Nombre del producto** | TutorApp |
| **Eslogan** | Tutorías académicas sin enredos |
| **Logo** | Ícono redondeado azul con una «T» blanca y una esfera naranja. Archivos: `tutorapp-logo-original.png` (logo del SRS), `tutorapp-icono.svg` (vectorial). En la app: componentes `LogoIcono`, `LogoMarca` y `Logo3D` (versión CSS 3D con inclinación al mover el mouse) en `frontend/src/components/marca/` |
| **Color primario** | `#3D4BFF` (azul eléctrico) |
| **Color secundario** | `#FF7A1A` (naranja vivo) |
| **Color de acento** | `#00C2A8` (turquesa, estados de éxito) |
| **Color de tinta / menú** | `#0F1538` (azul noche) |
| **Fondo** | `#F5F6FF` (claro) · `#0A0E27` (oscuro) |
| **Tipografía** | Outfit (Google Fonts) para toda la interfaz; Geist Mono para datos técnicos |
| **Plantilla base** | Studio Admin, MIT. URL: https://github.com/arhamkhnz/next-shadcn-admin-dashboard · demo: https://studio-admin.arhamkhnz.com |
| **Captura original de la plantilla** | `docs/marca/plantilla/captura-plantilla-original/` |
| **Adaptación (capturas finales)** | Pendiente de tomar: login, registro, panel, búsqueda, sesiones |

## Qué se reutilizó de la plantilla

- Estructura: `SidebarProvider` + `Sidebar` + `SidebarInset` con encabezado fijo.
- Componentes `ui/`: Button, Card, Input, Field, NativeSelect, Textarea, Badge, Alert, Avatar, Dialog, Skeleton, Empty, Spinner, Sonner (avisos), Dropdown, Tooltip.
- Sistema de temas claro/oscuro con persistencia en cookie.

## Qué se cambió

- Paleta (variables CSS en `globals.css`), tipografía y radio de bordes.
- Menú lateral por rol (estudiante / tutor) y botón de acción principal en naranja.
- Se eliminaron las pantallas de otros dominios (CRM, finanzas, etc.), el código de analítica de terceros y los selectores de tema de la plantilla.
- Pantallas nuevas: login y registro con logo 3D, panel, disponibilidad, búsqueda y sesiones.
