# DEMY-144: verificación E2E enfocada

Fecha: 2026-10-26 (America/Guayaquil)

## Preflight

- Backend: `DATABASE_URL` apunta a `postgres` / `zerocademy_e2e`.
- SQL: `SELECT current_database()` devolvió `zerocademy_e2e`.
- `E2E_TEST_CLOCK_ENABLED=true` tras recrear exclusivamente `backend` con `qa/docker-compose.e2e.yml`.
- La migración `20261026123000_class_session_timetable_origin` figura aplicada.
- No se ejecutaron migraciones, seeds, resets ni operaciones sobre `zerocademy_db`.

## HTTP real

- Login de ADMIN y TEACHER: correcto (`201`).
- Publicación del horario fixture: correcta.
- Crear desde un slot publicado: `SCHEDULED`, asignación, slot, occurrence key y snapshot presentes.
- Repetición: mismo ID; resultados `created=true,false`.
- Dos slots del mismo lunes: dos IDs y occurrence keys distintos.
- Dos peticiones concurrentes: mismo ID; resultados `created=true,false`.

## Regresión

- `class-sessions-foundation.service.spec.ts`: 12/12 pruebas aprobadas.

## Incidencias corregidas

- El override E2E heredaba `E2E_TEST_CLOCK_ENABLED=false`; se fija explícitamente en `true`.
- El cleanup del fixture no eliminaba ClassSession antes de usuarios/asignaciones. Se eliminan ahora solo las sesiones vinculadas a los profesores propiedad del fixture.

## Limpieza

- El primer cleanup reveló el FK anterior y dejó tres sesiones aisladas. Se eliminaron explícitamente por ID, se volvió a ejecutar cleanup y se verificó: instituciones fixture `0`, sesiones fixture `0`, JSON temporal ausente.

## Límites

- **PENDING — HTTP:** la matriz restante de autorización (profesor ajeno, institución/período ajenos, ADMIN, STUDENT, REPRESENTATIVE, perfil sin permiso) y de ciclo de vida histórico (COMPLETED/CANCELLED, despublicación y eliminación/reemplazo de slot) no fue ejecutada todavía.
- **PENDING — Playwright:** no se ejecutó el spec dedicado en desktop ni mobile. El contenedor frontend tiene el binario de Playwright, pero no dispone de un navegador instalado (`/ms-playwright` y `/root/.cache/ms-playwright` no existen); no se instaló software ni se alteró el entorno fuera de alcance.
- Esta evidencia no constituye aceptación completa ni habilita la campaña de tres pasadas.

## Verificación adicional

- Preflight repetido: host `postgres`, base efectiva y SQL `zerocademy_e2e`, reloj E2E `true`, migración DEMY-144 aplicada.
- Backend `npm run build -w backend-zerocademy`: correcto (exit code 0).

## HTTP restante — 2026-10-26

Fixture aislado `demy-144-remaining.local.json`; todas las solicitudes se autenticaron contra `POST /v1/auth/login` con email y contraseña únicamente.

| Escenario | Resultado |
| --- | --- |
| TEACHER lee su sesión | VERIFIED — 200 |
| Otro TEACHER crea o lee la sesión | VERIFIED — 404 / 404 |
| Institución ajena | VERIFIED — 404 |
| ADMIN crea | VERIFIED — 403 |
| STUDENT crea | VERIFIED — 403 |
| REPRESENTATIVE crea | VERIFIED — 403 |
| Slot inválido | VERIFIED — 404 |
| Día incompatible | VERIFIED — 400 |
| Fecha fuera de período | VERIFIED — 400 |
| Reabrir COMPLETED | VERIFIED — mismo ID y estado COMPLETED |
| Reabrir CANCELLED | VERIFIED — mismo ID y estado CANCELLED |
| Sesión manual | VERIFIED — `timetableSlotId` y `timetableOccurrenceKey` nulos |
| Despublicar | VERIFIED — el horario pasó a DRAFT; nueva creación devolvió 404 |
| Borrar slot de origen | VERIFIED — FK dejó `timetableSlotId` nulo; occurrence key y snapshot de curso/materia/hora idénticos |

Pendientes que impiden declarar HTTP VERIFIED: cobertura de **cross-period** y perfil de institución sin `class_sessions.create`; el fixture actual no expone ambos estados sin una extensión adicional. Comandos HTTP y SQL se ejecutaron con exit code 0; las respuestas exactas constan en el historial de ejecución de esta tarea.

## Cierre de bloqueadores HTTP — 2026-10-26

- **Cross-academic-period: VERIFIED.** Fixture con dos períodos, dos asignaciones válidas del mismo TEACHER y horarios publicados. `POST /v1/teacher-assignments/19d67607-0730-4131-95d8-4c5dd1279084/class-sessions/from-timetable-slot` usó el slot de la asignación del período activo y una fecha lunes válida del período planificado (`2200-04-07`): devolvió **404**. SQL posterior: `count(class_sessions where teacherAssignmentId=...) = 0`; por tanto no hubo snapshot ni filtración de recurso cruzado.
- **Missing `class_sessions.create`: BLOCKED por modelo de autorización.** Se inspeccionó la resolución efectiva: perfiles no-sistema y claves no incluidas en `SYSTEM_PERMISSION_PROFILES` se rechazan explícitamente; el único perfil TEACHER persistido y confiable es `TEACHER_BASELINE`, que contiene `class_sessions.create`. Asignar un perfil artificial o modificar dicho perfil compartido violaría el contrato de seguridad y el alcance. No existe una vía de fixture aislado para representar un TEACHER autenticable, con membership válida y perfil confiable sin esa capacidad.
- Cleanup cross-period: instituciones `0`, sesiones `0`, JSON temporal ausente. Todos los comandos ejecutados retornaron exit code 0.

## Identidad de fuente

- Git HEAD: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`
- Huella relevante: `C9146D76DECEA4E30516C3C0993BCAB513D5E4E87951DBE5FDB082B32DD7EF79` (servicio ClassSession).

## Cierre de testabilidad de permiso faltante — 2026-10-31

### Motivo por el que no existe el fixture HTTP

La configuración original no es construible de forma legítima. El único perfil
TEACHER confiable registrado en `SYSTEM_PERMISSION_PROFILES` es
`TEACHER_BASELINE`, y se compone exactamente de `ROLE_BASELINE_PERMISSIONS[TEACHER]`,
que incluye `class_sessions.create`. `EffectivePermissionResolver` rechaza tanto
perfiles no-sistema como claves de perfil sistema que no estén en ese catálogo
confiable. No hay un mecanismo E2E existente para registrar un perfil TEACHER
restringido exclusivamente en ese modo. Por ello, crear un perfil persistido
artificial, modificar el perfil compartido o alterar seeds habría debilitado el
contrato de autorización.

### Verificación aplicada

Se agregó una prueba **UNIT/INTEGRATION VERIFIED** en
`BackendZerocademy/src/modules/academic-execution/class-sessions.service.spec.ts`.
La prueba conserva `ClassSessionsFoundationService` y el
`MembershipPermissionEnforcer` reales: un profesor es dueño de una asignación
válida y tiene membresía activa; el proveedor de permisos efectivo aislado
responde `true` para la capacidad legacy y `false` para
`class_sessions.create` a nivel de membresía. Así se ejercita la decisión real
del enforcer (`MISMATCH` sin capacidad efectiva -> `ForbiddenException`) antes
de que el servicio pueda persistir. No se simuló el método bajo prueba ni se
bypasseó el guard. Se verificó además que `classSession.create` no fue llamado.

No se creó fixture HTTP ni se ejecutaron operaciones mutables de E2E/SQL; en
consecuencia no hay registros que limpiar para este caso. La limpieza previa de
los fixtures HTTP permanece en cero según el bloque anterior.

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `npm test -- --runInBand --watchman=false modules/academic-execution/class-sessions.service.spec.ts` (en `BackendZerocademy`) | Exit code `0`; 1 suite, 69/69 pruebas aprobadas. |
| `npm exec eslint -- src/modules/academic-execution/class-sessions.service.spec.ts` (en `BackendZerocademy`) | Exit code `0`. |
| `npm exec prettier -- --check src/modules/academic-execution/class-sessions.service.spec.ts` (en `BackendZerocademy`) | Exit code `0`. |

`npm exec tsc --noEmit` se ejecutó y devolvió exit code `2` por tres errores
preexistentes fuera de este alcance: dos en
`academic-evaluation/evaluation-terms.service.spec.ts` y uno en
`representatives/representatives.service.spec.ts`. No señaló el archivo ni los
módulos modificados para DEMY-144.

### Clasificación final

**HTTP VERIFIED WITH DOCUMENTED EXCEPTION.** Todos los escenarios HTTP
constructibles, incluido el cruce de período, están verificados. El estado
imposible de un TEACHER autenticable y propietario sin
`class_sessions.create` está cubierto mediante la decisión de autorización real
aislada, no presentado como E2E HTTP. No se modificaron perfiles, seeds,
migraciones, guards ni semántica de producción; el único cambio de aplicación es
la prueba enfocada.

### Identidad de fuente actualizada

- Git HEAD: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`
- Huella del servicio: `C9146D76DECEA4E30516C3C0993BCAB513D5E4E87951DBE5FDB082B32DD7EF79`
- Huella de la prueba enfocada: `75ED9F36C70E64AB0B3A097CC6F1E9253DB1E243CD654DCF6FF41E7DBE2720B4`

## Playwright enfocado — 2026-11-01

### Entorno y seguridad

- Playwright `1.64.0` detectó Chromium `156.0.8078.4` (Playwright Chromium
  `1248`) y su headless shell ya instalados en
  `C:\Users\ealci\AppData\Local\ms-playwright`; no se instalaron ni
  actualizaron dependencias ni binarios.
- Docker Desktop fue iniciado y los servicios se levantaron únicamente con
  `docker-compose.yml` + `qa/docker-compose.e2e.yml`. El backend efectivo usa
  `postgres:5432/zerocademy_e2e`, `E2E_TEST_CLOCK_ENABLED=true`,
  `RUN_PRISMA_SEED=false` y el comando `npm run start:dev -w backend-zerocademy`.
- `SELECT current_database()` devolvió `zerocademy_e2e`; Prisma informó esquema
  al día y `_prisma_migrations` confirmó la migración
  `20261026123000_class_session_timetable_origin` aplicada (`1`). No se
  aplicaron migraciones, seeds ni resets.

### Spec y resultados

Se agregó `FrontendZerocademy/e2e/demy-144-class-sessions.spec.ts`. Usa login
real exclusivamente con email/contraseña en `POST /v1/auth/login`, hidrata el
estado persistido `zerocademy-auth`, controla la fecha lunes con Playwright y
reutiliza el fixture aislado existente.

| Proyecto | Dispositivo | Resultado |
| --- | --- | --- |
| `desktop` | Chromium / Desktop Chrome | Exit code `0`; 4/4 pruebas aprobadas en 26.9 s. |
| `mobile` | Chromium / Pixel 5 | Exit code `0`; 4/4 pruebas aprobadas en 23.3 s; la pasada final registró estado Playwright `passed`. |

La cobertura verifica: apertura desde Today con botón accesible y teclado;
estado inicial `SCHEDULED`; navegación a la sesión standalone; curso, materia,
fecha/hora histórica y ausencia de AcademicPlan; reapertura con el mismo ID;
dos bloques con IDs distintos y sin duplicados; preservación `COMPLETED` y
`CANCELLED`; estados de carga y no encontrado; ausencia de controles de
creación para STUDENT y REPRESENTATIVE; y ausencia de overflow horizontal del
documento en desktop y Pixel 5. No se detectaron defectos de producto; solo se
corrigió la navegación de recarga dentro del nuevo test para volver
explícitamente a la ruta standalone.

`eslint` y `prettier --check` del spec finalizaron con exit code `0`.

### Limpieza

- Artefactos JSON temporales del fixture: `0`.
- ClassSession vinculadas a los profesores creados por esta ejecución: `0`.
- Se encontraron 9 instituciones `BROWSER-FIXTURE-*` de 2026-10-14 y una de
  2026-10-20, anteriores a esta ejecución; se preservaron para no borrar
  datos de trabajo ajeno. No existe archivo fixture activo que las asocie con
  esta pasada.

### Cierre Playwright

**PLAYWRIGHT VERIFIED (enfocado):** desktop y Pixel 5 ejecutaron y aprobaron
el spec dedicado. Se preserva la excepción HTTP de permiso faltante documentada
arriba. El único seguimiento operativo es decidir la limpieza de los nueve
fixtures históricos; no bloquean la evidencia ni la campaña de aceptación.

### Identidad de fuente Playwright

- Git HEAD: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`
- Huella del spec: `0A94BD345A0DF1F044A7DC3B453D4E40737362DC165A1F0A203280A5A4E17B4D`
