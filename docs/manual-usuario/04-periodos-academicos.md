# Períodos académicos

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Ver y gestionar períodos (crear, editar, activar, archivar) | **Super administrador** |
| Seleccionar período de trabajo en la cabecera | **Administrador**, **Docente**, **Estudiante** |
| Gestionar quimestres (términos de calendario) dentro de un período | **Super administrador**; en algunos flujos, **Administrador** |

> Solo el **super administrador** ve la pestaña **Períodos académicos** en el menú lateral.

---

## Cómo llegar

- Menú lateral → **Períodos académicos**
- Ruta: `http://localhost:3000/academic-periods`

Para **seleccionar** el período con el que trabaja (sin administrar el calendario global):

- Use el selector **Período académico** en la **barra superior** del panel.

---

## Para qué sirve

Los **períodos académicos** representan el **año lectivo** de una institución o del calendario nacional. En Ecuador coexisten dos **regímenes** según la zona geográfica:

| Régimen | Zonas típicas | Inicio aproximado | Fin aproximado | Ejemplo de nombre |
|---------|---------------|-------------------|----------------|-------------------|
| **Costa / Galápagos** | Litoral y archipiélago | Abril–mayo | Febrero–marzo | 2025-2026 |
| **Sierra / Amazonía** | Altiplano y oriente | Agosto–septiembre | Junio–julio | 2025-2026 |

Cada año lectivo abarca **dos años calendario** (por ejemplo, 2025-2026).

Dentro de cada período pueden definirse **quimestres** (términos de calendario) con fechas de inicio y fin.

---

## Estados de un período

| Estado | Significado |
|--------|-------------|
| Planificado | Creado pero aún no operativo. |
| Activo | Período en uso para su régimen (solo **uno activo por régimen** a nivel global). |
| Cerrado | Finalizado; ya no es el período operativo. |
| Archivado | Conservado solo para consulta histórica. |

---

## Pasos de uso típico (super administrador)

### Crear un período

1. Entre en **Períodos académicos**.
2. Pulse **Nuevo período** (o equivalente en la interfaz).
3. Complete:
   - **Nombre** (ej.: `2025-2026`)
   - **Régimen** (Costa/Galápagos o Sierra/Amazonía)
   - **Fecha de inicio** y **fecha de fin**
4. Guarde. El período quedará en estado **Planificado**.

### Activar un período

1. Localice el período en el listado.
2. Pulse **Activar**.
3. El sistema cerrará automáticamente otros períodos **activos del mismo régimen**.
4. Solo puede haber **un período activo por régimen** y las fechas no deben solaparse con otro activo.

### Gestionar quimestres

1. Abra el detalle de un período.
2. En la sección de **quimestres** (términos de calendario), agregue cada quimestre con:
   - Nombre (ej.: «Primer quimestre»)
   - Orden
   - Fechas de inicio y fin (dentro del período padre)
3. Guarde cada quimestre.

### Desactivar o archivar

- **Desactivar:** pasa el período a estado **Cerrado** cuando termina el año lectivo.
- **Archivar:** para períodos históricos que ya no se editan.

---

## Relación con la institución

Cada colegio puede tener su **período activo institucional** (`activeAcademicPeriodId`), que puede alinearse con el calendario global mediante una **transición de período** (ver [14 — Transición de período](./14-transicion-periodo.md)).

Los administradores, docentes y estudiantes **no crean** períodos globales; solo **eligen** cuál visualizar en la cabecera.

---

## Consejos

- Cree y active el período **antes** de que el administrador del colegio abra cursos y matricule estudiantes.
- No edite fechas centrales de un período mientras esté **Activo**; desactívelo primero.
- Solo se pueden **eliminar** períodos que no estén activos.
- Los quimestres de calendario son distintos de los **períodos de evaluación** con pesos (eso se configura en [Evaluación académica](./13-evaluacion-academica.md)).

---

## Errores frecuentes

| Mensaje o situación | Causa | Solución |
|---------------------|-------|----------|
| No puede activar el período | Hay otro activo del mismo régimen con fechas solapadas | Cierre o ajuste el otro período. |
| No puede editar un período activo | Regla de protección del calendario en curso | Desactive el período, edite y vuelva a activar si corresponde. |
| Selector de cabecera vacío | Institución sin régimen o sin períodos | Configure régimen en Instituciones y cree períodos para ese régimen. |
| Confusión entre quimestre y evaluación | Son conceptos distintos | Quimestres aquí; pesos de notas en Evaluación académica. |
