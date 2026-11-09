# CO-MATCH

Plataforma de la Universidad de La Sabana que conecta a estudiantes con dependencias de la universidad
para proyectos de automatización del Programa de Asistencia Técnica (PAT), usando un algoritmo de
compatibilidad (matching).

## Stack

- **Frontend / Backend:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4
- **Base de datos y autenticación:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Tests:** Vitest (unitarios), Playwright (e2e, escritorio y móvil)
- **CI:** GitHub Actions (`.github/workflows/ci.yml`)

## Puesta en marcha

```bash
cd co-match
npm install
cp .env.example .env.local   # y completa las variables de Supabase
npm run dev                  # http://localhost:3000
```

### Base de datos

La base de Supabase usa las tablas `profiles`, `opportunities`, `applications`,
`conversations`, `messages` y `project_milestones`.

En el panel de Supabase → **SQL Editor**, ejecuta el contenido de
`supabase/migrations/20261108200000_coherencia_esquema_real.sql`. Agrega las
políticas de seguridad (RLS), el máximo PAT de 25 horas, el bucket de fotos de
perfil y la tabla de reportes, sin crear tablas duplicadas ni borrar datos.

Los scripts de `supabase/legacy/` son de un esquema antiguo y **no se deben ejecutar**.

#### Ciclo de una necesidad

1. La dependencia publica → `opportunities.status = 'pending_pat'` (Pendiente revisión PAT).
2. PAT la aprueba → `status = 'published'` (por ahora desde el SQL Editor).
3. El estudiante marca "Me interesa" → fila en `applications` (`dependency_status = 'pending'`).
4. La dependencia lo contacta → `is_match = true`, conversación y hitos del proyecto; la necesidad pasa a `in_progress`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios (Vitest) |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Pruebas e2e con Playwright (levanta el build local o usa `E2E_BASE_URL`) |
| `npm run test:load -- <url> [usuarios] [segundos]` | Prueba de carga (p95 < 1500 ms, errores < 1 %) |

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

## Despliegue

Producción: https://co-match-eight.vercel.app (Vercel, proyecto `co-match`, variables `NEXT_PUBLIC_SUPABASE_*` configuradas).

Manual: `npx vercel@latest deploy --prod` desde `co-match/`.

Automático (CD): el job `deploy` de `.github/workflows/ci.yml` despliega en cada push a `main` si el repo tiene los secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` (los dos últimos están en `.vercel/project.json` tras `vercel link`).

### Configuración necesaria en Supabase

Authentication > URL Configuration: **Site URL** = la URL de producción y en **Redirect URLs** agregar `<url>/auth/confirm` y `http://localhost:3000/auth/confirm`. Para que los correos de confirmación lleguen a cualquier @unisabana.edu.co configura un SMTP propio (Authentication > SMTP Settings): el SMTP por defecto solo envía a miembros del equipo y con límite bajo.
