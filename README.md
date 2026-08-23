# Datalume — Frontend (vista)

Interfaz de la plataforma Datalume para cargar, limpiar y visualizar datos.
**Este proyecto es solo de interfaz (front-end):** no incluye backend, base
de datos ni autenticación real. Todos los datos que se ven (estadísticas,
tablas, gráficos, archivos) son datos de ejemplo estáticos, listos para
conectarse a un servicio real más adelante.

## Requisitos

- Node.js 18 o superior

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Compilación

```bash
npm run build
```

## Estructura del proyecto

```
src/
  assets/            Imágenes e íconos propios
  components/
    auth/            Formularios de inicio de sesión y registro
    dashboard/        Tarjetas, gráficos y tabla del panel
    layout/          Navbar y Footer
    ui/              Componentes de interfaz reutilizables
  data/              Datos de ejemplo (mock) usados solo para la vista
  layouts/           Estructuras de página (layout principal y del panel)
  pages/             Páginas de la aplicación (landing, login, dashboard, etc.)
  routes/            Definición de rutas de la aplicación
  styles/            Sistema de diseño y estilos globales
```

## Páginas

- `/` — Landing page
- `/nosotros` — Nosotros
- `/servicios` — Servicios
- `/contacto` — Contacto
- `/login` — Iniciar sesión / Crear cuenta (con pestañas)
- `/dashboard` — Panel de datos (vista, con datos de ejemplo)

## Próximos pasos (backend)

- Conectar `LoginForm` y `RegisterForm` a un servicio de autenticación real.
- Sustituir los datos de `src/data/mockData.ts` por datos provenientes de la API.
- Conectar `UploadZone` a un endpoint real de carga de archivos.
