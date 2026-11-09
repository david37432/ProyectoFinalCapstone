# CO-MATCH — Documentación de API

Todas las rutas requieren una sesión de Supabase activa (cookie). Las rutas `/api/dependencia/*` además
exigen un usuario con rol de dependencia (`requireAdmin`). Las respuestas son JSON y los errores
siguen el formato `{ "error": "mensaje" }`.

| Código | Significado |
|---|---|
| 200 | OK |
| 400 | Datos inválidos |
| 401 | Sin sesión |
| 403 | El recurso no pertenece al usuario |
| 404 | Recurso no encontrado |
| 500 | Error interno |

## Endpoints REST (`src/app/api/dependencia`)

### `GET /api/dependencia/conversations`
Lista las conversaciones de la dependencia autenticada.
**200** → `{ "conversations": ConversationWithDetails[] }`

### `GET /api/dependencia/conversations/{id}/messages`
Mensajes de una conversación (la dependencia o el candidato deben ser participantes).
**200** → `{ "messages": MessageWithSender[] }`

### `POST /api/dependencia/conversations/{id}/messages`
Envía un mensaje.

```json
{ "content": "Hola, ¿puedes el lunes?", "messageType": "text", "fileUrl": null, "fileName": null, "fileSize": null }
```
- `content` es obligatorio cuando `messageType` = `"text"` (si no → **400**).
- **403** si el usuario no participa en la conversación. **404** si no existe.

### `POST /api/dependencia/conversations/{id}/read`
Marca como leídos los mensajes de la conversación. **200** → `{ "success": true }`

### `POST /api/dependencia/conversations/{id}/contact`
Registra el contacto con el candidato de la conversación.

### `POST /api/dependencia/applications/{id}/contact`
La dependencia contacta al candidato: la postulación queda como match (`dependency_status = 'contacted'`,
`is_match = true`), la necesidad pasa a `in_progress`, se crean los hitos iniciales del proyecto y la conversación.
**200** → `{ "success": true, "conversationId": "..." }`.
**403** si la necesidad no es de la dependencia. **404** si la postulación no existe.

### `GET /api/dependencia/projects`
Proyectos en seguimiento (postulaciones aceptadas) con hitos, horas y evaluación.
**200** → `{ "projects": SeguimientoProject[] }`

### `PATCH /api/dependencia/milestones/{id}`
Cambia el estado de un hito.

```json
{ "status": "in_progress" }
```
`status` ∈ `pending | in_progress | completed` (si no → **400**).

## Server Actions (Next.js)

Se invocan desde componentes de React; no son URLs públicas.

| Acción | Archivo | Entrada | Salida |
|---|---|---|---|
| `publishVacancyAction` | `app/dashboard/dependencia/publicar/actions.ts` | `{ title, department, description, skills[], weeklyHours (≤ 25), durationMonths } → fila en `opportunities`` | `{ success, vacancyId, candidates[{ userId, fullName, score, matchedSkills }] }` |
| `applyToVacancyAction` | `app/dashboard/estudiante/explorar/actions.ts` | `vacancyId` | `{ success, matchScore }` |
| `withdrawApplicationAction` | `app/dashboard/estudiante/explorar/actions.ts` | `vacancyId` (id de `opportunities`) | `{ success }` (solo si la dependencia no ha respondido) |
| `sendStudentMessageAction` | `app/dashboard/estudiante/mensajes/actions.ts` | `conversationId, content` | `{ success, message }` |
| `submitFeedbackAction` | `app/reportar/actions.ts` | `{ category: error\|sugerencia\|otro, message, pageUrl? }` | `{ success }` |
| `registerAction` | `app/auth/register/actions.ts` | `{ email, password, full_name, role: postulante\|reclutador }` | `{ success, redirectTo }` |

## Algoritmo de matching (`src/lib/matching.ts`)

Puntaje de 0 a 100:

| Componente | Puntos | Cálculo |
|---|---|---|
| Habilidades | 70 | Σ(peso × factor de dominio) / Σ pesos. Dominio: básico 0.6, intermedio 0.85, avanzado 1. Las habilidades opcionales pesan la mitad. |
| Disponibilidad | 20 | min(1, horas del candidato / horas PAT de la vacante) |
| Modalidad | 6 | Coincide o el candidato acepta "cualquiera" |
| Tipo de contrato | 4 | Coincide o el candidato acepta "cualquiera" |

Al publicar una necesidad se muestran los 5 candidatos con puntaje ≥ 40.
