# DEMY-145 — Matriz de cobertura y auditoría de seguridad

Fecha de auditoría: 2026-11-01 (America/Guayaquil)  
Alcance: Timetables de DEMY-140 a DEMY-144. Auditoría estática y pruebas unitarias
no mutables; no se ejecutaron fixtures, HTTP E2E ni Playwright durante esta
auditoría.

## Línea base examinada

- Aceptación previa: DEMY-140–144, 3 pasadas × 46 pruebas = **138/138**,
  documentada en `qa/demy-144-acceptance/campaign-20261101T202546-f29528cef82b/`.
- HEAD de esa aceptación: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`.
- Huella congelada: `9ec92e1ae65360bff1d40151ff8ab90a9f2b2c5078094776774f8da92e0b2144`.
- Comprobación no mutable actual:

  ```text
  npm test -- --runInBand --watchman=false \
    modules/timetables/timetable-generation.service.spec.ts \
    modules/timetables/timetable-conflict-engine.service.spec.ts \
    modules/timetables/timetable-admin.service.spec.ts
  ```

  Resultado: 3 suites, 14/14 pruebas, exit code 0.

## Matriz de trazabilidad

| Criterio DEMY-145 | Implementación | Pruebas existentes y evidencia | Estado | Brecha / riesgo | Adición mínima propuesta |
| --- | --- | --- | --- | --- | --- |
| CSP exitoso: propuesta válida, cargas completas y sin persistencia | `timetable-generation.service.ts`, `timetable-admin.service.ts#generate` | Unit: `timetable-generation.service.spec.ts` (propuesta exacta y cargas). HTTP: `test/timetables.e2e-spec.ts` «generates a stable…»; evidencia DEMY-138 en `docs/timetables-scheduling.md` | **COVERED** | Ninguno conocido | Ninguna |
| Fallos CSP: configuración inválida, límite de búsqueda y no factibilidad | Guard de readiness en `TimetableAdminService`; estados `INVALID_CONFIGURATION`, `SEARCH_LIMIT_REACHED`, `UNSATISFIABLE` | HTTP E2E: estructura no utilizable → 400; `maxSearchNodes: 1` → `SEARCH_LIMIT_REACHED`; unit: capacidad imposible → `UNSATISFIABLE` | **PARTIALLY COVERED** | `UNSATISFIABLE` no tiene recorrido HTTP. La documentación demuestra que bajo las restricciones duras actuales no existe un caso no-capacidad construible sin añadir una restricción artificial | No fabricar un caso HTTP. Mantener la unit de integración como evidencia del estado; añadir HTTP solo si el dominio introduce una restricción que lo haga construible |
| Regresión determinista del generador | Normalización y orden estable en `timetable-generation.service.ts` | Unit: «is deterministic for permuted normalized inputs». HTTP: dos propuestas iguales, orden y snapshots persistidos idénticos; evidencia DEMY-138 | **COVERED** | Ninguno conocido | Ninguna |
| Colisiones de profesor, curso y duplicado de slot/timetable | `timetable-conflict-engine.service.ts`; tres constraints únicos de `TimetableSlot` en Prisma | Unit: detección de teacher/course/simultaneous/duplicate. HTTP: `timetables.e2e-spec.ts` «returns deterministic teacher, course, and duplicate conflict diagnostics». UI: «real backend overlap error» | **COVERED** | Ninguno conocido | Ninguna |
| Publicar/despublicar y visibilidad de audiencia | `TimetableAdminService.publish/unpublish`; lectores teacher/student/representative | HTTP y UI: `timetables.e2e-spec.ts` «publishes… safely returns to draft»; Playwright `timetables-lifecycle-authorization.spec.ts`; `teacher-timetables.spec.ts`; `student-representative-timetables.spec.ts` | **COVERED** | Ninguno conocido | Ninguna |
| Aislamiento entre instituciones | `assertActorCanAccessInstitution`, filtros de institution/period en admin y lectores | HTTP: `timetables.e2e-spec.ts` colección y detalle Institution B→A; Playwright «Institution B ADMIN…»; teacher y student/representative fixtures cruzados | **COVERED** | Ninguno conocido | Ninguna |
| IDOR y enforcement de rol/capacidad | `@ApiRequireRolesStrict(Role.ADMIN)`; scope institucional; `MembershipPermissionEnforcer` | HTTP: caller no institucional, detalle oculto y ADMIN restringido; Playwright no expone controles/retorna 404; matriz 138/138 | **COVERED** | La comprobación de perfiles restringidos depende del perfil ADMIN de fixture, no de perfiles arbitrarios (correcto: se rechazan perfiles no confiables) | Ninguna |
| Edición con versión obsoleta y concurrencia | `Timetable.version`, `updateMany` condicionado y transacciones en `TimetableAdminService` | HTTP: stale-version y «allows at most one simultaneous replacement». Playwright: move con recuperación de 409. Documentación DEMY-139/140 | **COVERED** | Ninguno conocido | Ninguna |
| Restricción operativa de SUPER_ADMIN | Roles estrictos en `timetables.controller.ts`; catálogo sin permisos operativos de timetable para SUPER_ADMIN | Unit: `timetables.service.spec.ts` incluye SUPER_ADMIN; HTTP E2E «rejects non-institutional timetable callers»; controladores usan `ApiRequireRolesStrict(Role.ADMIN)` | **COVERED** | Ninguno conocido | Ninguna |
| Inmutabilidad PUBLISHED y periodo CLOSED/ARCHIVED | `assertMutablePeriod`; guards de lifecycle en `TimetableAdminService` | HTTP E2E: CLOSED, ARCHIVED y PUBLISHED, incluida prioridad de inmutabilidad sobre versión obsoleta; UI read-only | **COVERED** | Ninguno conocido | Ninguna |
| Lecturas publicadas de TEACHER/STUDENT/REPRESENTATIVE y controles read-only | `teacher-timetables.service.ts`, `student-timetables.service.ts`; páginas de timetable | Units de ambos lectores; Playwright desktop/mobile DEMY-142/143 y campaña aceptada | **COVERED** | Ninguno conocido | Ninguna |
| Integración de ClassSession desde Today | `timetable-slot-origin.service.ts`, `class-sessions-foundation.service.ts`, `teacher-timetable-page.tsx` | `demy-144-class-sessions.spec.ts`, 4 desktop + 4 Pixel 5 en la campaña; excepción HTTP de permiso faltante documentada | **COVERED** | El perfil TEACHER sin `class_sessions.create` no es una configuración persistible legítima | Ninguna: la prueba aislada del enforcer real es la cobertura correcta |

## DEMY-126: evaluación arquitectónica

**DEMY-126 no es necesario para cerrar el MVP de Timetables ni DEMY-145.** No
se recomienda reabrirlo como dependencia de esta auditoría.

La evidencia es concreta:

1. Los endpoints operativos usan `@ApiRequireRolesStrict(Role.ADMIN)`, por lo
   que SUPER_ADMIN no obtiene el bypass implícito de plataforma.
2. `assertActorCanAccessInstitution` exige scope/membresía activa institucional
   después del rol; el acceso no se decide solo por `User.role`.
3. `MembershipPermissionEnforcer` aplica la intersección fail-closed de rol
   legado y permiso efectivo para ADMIN/TEACHER.
4. `InstitutionMembershipRole` ya limita el modelo institucional a ADMIN y
   TEACHER, y `EffectivePermissionResolver` valida compatibilidad entre rol de
   usuario, membresía y perfiles confiables.
5. La prueba HTTP cubre ADMIN restringido, aislamiento A/B e IDOR; la campaña
   aceptada conserva esos escenarios.

DEMY-126 sigue siendo una mejora válida para roles institucionales adicionales
o para abandonar el techo global de `User.role`, pero no corrige un hueco de
seguridad existente de Timetables. Convertirlo en prerrequisito ahora añadiría
migración y riesgo sin ampliar la autorización cubierta.

## Documentación: cierre aplicado

| Documento | Estado de cierre DEMY-145 |
| --- | --- | --- |
| `docs/timetables-scheduling.md` | Sincronizado con la implementación DEMY-140–144: generación, conflictos, lifecycle, lectores, ClassSession, aislamiento y diferidos reales. Reemplaza el relato de spike/futuro obsoleto por el estado actual. |
| `docs/timetables-scheduling.md` | Documenta la campaña vigente 46 × 3 = **138/138**, su HEAD y huella congelada, y enlaza esta matriz. |
| `docs/timetables-scheduling.md` | Documenta que `UNSATISFIABLE` no tiene una prueba HTTP ejecutada ni construible con las restricciones válidas actuales; mantiene la evidencia unitaria y la razón para no añadir hooks de producción. |
| `qa/demy-145-audit/coverage-matrix.md` | Esta matriz referencia el documento sincronizado y conserva la decisión DEMY-126, la brecha HTTP deliberadamente no fabricable y la reconciliación Jira pendiente. |

## DEMY-140 y reconciliación Jira

**Conclusión: funcionalmente aceptado; pendiente solo de reconciliación Jira.**

Las advertencias antiguas de `docs/timetables-scheduling.md` sobre mantener
DEMY-140 abierto corresponden a incrementos previos, anteriores a generación,
grid, edición con versión, publicación, lectores y la campaña consolidada. La
campaña actual incluyó 16 escenarios DEMY-140 en cada pasada, con 48 ejecuciones
limpias. No queda una carencia funcional identificada en esta auditoría.

Recomendación: actualizar/añadir comentario en Jira con el enlace a la evidencia
138/138, conservar la excepción documentada de DEMY-144 y transicionar DEMY-140
solo mediante el proceso de reconciliación autorizado.

## Requisitos restantes para la aceptación DEMY-145

La sincronización documental está completa; **DEMY-145 no debe marcarse como
aceptado todavía**. Siguen pendientes acciones externas que esta auditoría no
está autorizada a ejecutar:

1. Reconciliar DEMY-140 en Jira mediante el proceso autorizado, enlazando la
   evidencia consolidada `qa/demy-144-acceptance/campaign-20261101T202546-f29528cef82b/final-summary.md`
   (138/138) y conservando la excepción HTTP documentada de DEMY-144.
2. Completar la verificación final requerida por el flujo de aceptación con la
   evidencia de esta actualización documental; no cambiar estados de Jira desde
   esta tarea.
3. Mantener la unit `UNSATISFIABLE`; no fabricar un HTTP ficticio. Si una
   futura historia exige HTTP para ese estado, primero debe entregar una nueva
   restricción real de dominio que haga construible el caso válido, sin hooks de
   producción.

## Verificación final de aceptación (2026-11-01)

Esta verificación reutiliza la campaña congelada DEMY-140–144 y añade solamente
comprobaciones no mutables. No se ejecutaron HTTP E2E, Playwright, fixtures,
migraciones, seeds, resets ni accesos a base de datos.

| Criterio de aceptación DEMY-145 | Confirmación concreta | Estado |
| --- | --- | --- |
| 1. Generación satisfactoria | Unit `TimetableGenerationService` genera propuesta completa; HTTP E2E `generates a stable, read-only multi-course proposal that creates a COMPLETE draft`; campaña DEMY-140 16 escenarios/pasada. | **COVERED** |
| 2. Configuración inválida y fallos de generación | Unit de contexto inválido; HTTP E2E `maps an unusable persisted structure to HTTP 400` y `returns SEARCH_LIMIT_REACHED through HTTP`. | **COVERED** |
| 3. Regresión CSP determinista | Unit `is deterministic for permuted normalized inputs`; HTTP E2E compara dos propuestas del mismo fixture. | **COVERED** |
| 4. Colisiones teacher/course/timetable | Unit del conflict engine; HTTP E2E `returns deterministic teacher, course, and duplicate conflict diagnostics`; constraints únicos de Prisma. | **COVERED** |
| 5. Visibilidad publish/unpublish | HTTP E2E `publishes only a current, complete draft and safely returns it to draft`; Playwright DEMY-140 lifecycle y lectores DEMY-142/143. | **COVERED** |
| 6. Aislamiento entre instituciones | HTTP E2E de colección/detalle A/B; Playwright DEMY-140, DEMY-142 y DEMY-143 incluidos en la campaña 138/138. | **COVERED** |
| 7. IDOR y permiso efectivo | HTTP E2E `rejects non-institutional timetable callers` y `enforces ... capabilities for a restricted ADMIN membership`; rutas strict ADMIN y `MembershipPermissionEnforcer`. | **COVERED** |
| 8. Versión obsoleta | HTTP E2E `allows at most one simultaneous replacement`; Playwright DEMY-140 recupera de `409` durante movimiento. | **COVERED** |
| 9. Restricción operativa SUPER_ADMIN | Rutas `ApiRequireRolesStrict(Role.ADMIN)` y cobertura HTTP de caller no institucional; no hay bypass operativo implícito. | **COVERED** |
| 10. Independencia DEMY-126 | La sección DEMY-126 de este documento y `docs/timetables-scheduling.md` registran el límite y las barreras existentes. | **COVERED** |
| 11. Consistencia documental | `docs/timetables-scheduling.md` sincronizado; enlaces de evidencia verificados y escaneo de reclamos obsoletos sin coincidencias. | **COVERED** |
| 12. Fixtures QA seguros/aislados | `final-summary.json` registra 0 instituciones, 0 ClassSession y 0 JSON temporal propiedad de campaña al cierre; los nueve `BROWSER-FIXTURE-*` históricos permanecieron intactos. | **COVERED** |

### UNSAT: excepción documentada, no una prueba HTTP aprobada

`timetable-generation.service.spec.ts` cubre input válido con capacidad de
curso imposible y espera `UNSATISFIABLE` / `COURSE_CAPACITY_EXCEEDED`. La misma
suite cubre configuración inválida; `timetables.e2e-spec.ts` cubre
`SEARCH_LIMIT_REACHED` por HTTP con `maxSearchNodes: 1` y sin propuesta
parcial. No se registró ni se afirma un HTTP `UNSATISFIABLE` exitoso. Tras el
preflight de capacidad, las restricciones válidas soportadas no permiten
construir otro UNSAT HTTP genuino; introducir un hook o constraint artificial
de producción sigue fuera de alcance.

### Línea base y decisión de revalidación

- HEAD actual: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`, igual al de la
  campaña congelada.
- La campaña registra las mismas rutas runtime modificadas/no rastreadas que
  siguen en el árbol actual; desde esa campaña, DEMY-145 sólo actualizó
  documentación y artefactos QA. No se introdujo cambio de comportamiento de
  Timetables.
- La huella congelada sigue siendo
  `9ec92e1ae65360bff1d40151ff8ab90a9f2b2c5078094776774f8da92e0b2144` como
  evidencia histórica. No se la declara recalculada para el árbol actual,
  porque esta tarea modificó documentación.
- Por lo anterior no se requiere repetir la campaña browser mutable de 138
  pruebas; la evidencia congelada se reutiliza y se complementa con las suites
  unitarias, componente y TypeScript de esta verificación.

### Comandos ejecutados (todos exit code 0)

```text
BackendZerocademy> npm test -- --runInBand --watchman=false \
  modules/timetables/timetable-generation.service.spec.ts \
  modules/timetables/timetable-conflict-engine.service.spec.ts \
  modules/timetables/timetable-admin.service.spec.ts \
  modules/timetables/timetables.service.spec.ts \
  modules/timetables/teacher-timetables.service.spec.ts \
  modules/timetables/student-timetables.service.spec.ts \
  modules/timetables/schedule-structures.service.spec.ts \
  modules/timetables/timetable-slot-origin.service.spec.ts
# 8 suites, 46/46 tests PASS

FrontendZerocademy> npm run test:run -- src/features/timetables/components/timetables-page.test.tsx
# 1 file, 22/22 tests PASS

FrontendZerocademy> npm exec tsc --noEmit
# PASS

git diff --check
# PASS
```
