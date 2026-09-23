# Historias de usuario — Planificación académica: Unidades académicas

## Alcance

Estas historias describen el comportamiento funcional de `AcademicUnit` sobre un
`AcademicPlan`. Reflejan el contrato implementado de la Fase 2A, incluido el
flujo de interfaz integrado en el detalle del plan.

## AP-U01 — Gestionar unidades de un plan borrador

**Como** docente propietario de una asignación,
**quiero** crear, editar y eliminar unidades en mi plan académico borrador,
**para** organizar el contenido que impartiré.

Criterios de aceptación:

- Solo el docente dueño de la asignación puede mutar unidades de su plan.
- Al crear una unidad, el sistema la agrega al final del orden actual.
- El cliente no puede definir la posición de una unidad.
- Al eliminar una unidad, las posiciones restantes quedan consecutivas desde `1`.
- Las operaciones se rechazan si el plan está publicado o el período académico está cerrado.

## AP-U02 — Mantener el orden pedagógico de las unidades

**Como** docente propietario,
**quiero** reordenar todas las unidades de mi plan borrador,
**para** conservar la secuencia pedagógica prevista.

Criterios de aceptación:

- La solicitud contiene exactamente el conjunto completo de IDs de unidades del plan.
- No se aceptan IDs repetidos, desconocidos ni pertenecientes a otro plan.
- El orden final queda numerado consecutivamente desde `1`.
- El cambio de posiciones es atómico y evita colisiones con la restricción única del plan.
- No se permite reordenar un plan publicado ni uno perteneciente a un período cerrado.

## AP-U03 — Consultar planificación según el rol autorizado

**Como** administrador institucional,
**quiero** consultar las unidades de los planes de mi institución,
**para** monitorear la planificación sin modificarla.

Criterios de aceptación:

- ADMIN puede listar y consultar unidades de planes de su propia institución.
- ADMIN no puede crear, actualizar, eliminar ni reordenar unidades.
- ADMIN no puede consultar unidades de otra institución.
- SUPER_ADMIN conserva el acceso de lectura definido por el servicio.
- STUDENT y REPRESENTATIVE no pueden consultar unidades académicas.

## AP-U04 — Conservar la consulta histórica

**Como** usuario autorizado,
**quiero** consultar las unidades de un plan publicado o de un período cerrado,
**para** revisar el historial de planificación académica.

Criterios de aceptación:

- Las unidades de un plan `PUBLISHED` siguen visibles para lectores autorizados.
- Las unidades de un período `CLOSED` siguen visibles para lectores autorizados.
- Publicar un plan o cerrar el período lo vuelve de solo lectura; no oculta ni elimina sus unidades.

## AP-U05 — Mantener fechas válidas por unidad

**Como** docente propietario,
**quiero** registrar fechas de inicio y fin válidas para cada unidad,
**para** que la planificación respete el calendario del plan padre.

Criterios de aceptación:

- Las fechas se reciben como días calendario `YYYY-MM-DD`.
- Si se registra una fecha, inicio y fin se proporcionan juntos.
- La fecha de inicio no puede ser posterior a la fecha de fin.
- El rango de la unidad debe estar dentro del rango del `AcademicPlan`.
- Se permiten los límites exactos de inicio y fin del plan padre.

## AP-U06 — Auditar cambios exitosos

**Como** equipo de soporte y auditoría,
**quiero** registrar los cambios exitosos sobre unidades académicas,
**para** poder rastrear acciones relevantes sin reportar falsos éxitos.

Criterios de aceptación:

- Crear una unidad registra `ACADEMIC_UNIT_CREATED` con el actor, plan y unidad.
- Actualizar una unidad registra `ACADEMIC_UNIT_UPDATED` con el actor, plan y unidad.
- Eliminar una unidad registra `ACADEMIC_UNIT_DELETED` solo después de completar la transacción.
- Reordenar unidades registra `ACADEMIC_UNITS_REORDERED` con el actor, plan y cantidad.
- Una transacción fallida de eliminación o reordenamiento no registra un evento de éxito.
