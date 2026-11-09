# CO-MATCH

Plataforma de la Universidad de La Sabana que conecta a estudiantes con dependencias de la universidad
para proyectos de automatización del Programa de Asistencia Técnica (PAT), usando un algoritmo de
compatibilidad (matching).

## Stack

- **Frontend / Backend:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4
- **Base de datos y autenticación:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Tests:** Vitest
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)

## Puesta en marcha

```bash
cd co-match
npm install
cp .env.example .env.local   # y completa las variables de Supabase
npm run dev                  # http://localhost:3000
```

### Base de datos

En el panel de Supabase → **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/`.
La última migración (`20261108000000_core_publish_apply_matching.sql`) carga el catálogo de
departamentos y habilidades y agrega los permisos necesarios para publicar vacantes, postularse,
calcular el matching y enviar reportes de errores.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios (Vitest) |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |

## Estructura

```
src/
├── app/
│   ├── auth/                    # Login, registro, recuperación de contraseña
│   ├── dashboard/estudiante/    # Explorar, mis postulaciones, mensajes, perfil, avisos
│   ├── dashboard/dependencia/   # Panel, publicar necesidad, candidatos, mensajes, seguimiento
│   ├── api/dependencia/         # Endpoints REST (ver docs/API.md)
│   ├── privacidad/ terminos/    # Política de datos (Ley 1581) y términos de uso
│   └── reportar/                # Reporte de errores y sugerencias
├── lib/
│   ├── matching.ts              # Algoritmo de compatibilidad (función pura + tests)
│   └── supabase/                # Clientes y consultas
supabase/migrations/             # Esquema SQL y políticas RLS
docs/API.md                      # Documentación de endpoints y acciones
```

## Documentación

- [API y algoritmo de matching](docs/API.md)
