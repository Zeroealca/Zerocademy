# Matrículas

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Crear, editar estado y matricular en masa | **Administrador** |
| Consultar matrículas | **Administrador**, **Docente** (cursos asignados) |
| Ver propio historial | **Estudiante** — pestaña [Mis matrículas](./16-estudiante-mis-vistas.md) |

---

## Cómo llegar

- Menú lateral → **Matrículas**
- Ruta: `http://localhost:3000/enrollments`
- Matrícula individual: `/enrollments/new`
- Matrícula masiva: `/enrollments/bulk`
- Editar estado: `/enrollments/[id]/edit`
- Historial por estudiante (admin/docente): `/students/[id]/enrollments`

---

## Para qué sirve

Una **matrícula** vincula a un **estudiante** con un **curso / paralelo** en un **período académico**. Es el registro oficial de que el alumno cursa ese grupo en ese año lectivo.

---

## Estados de matrícula

| Estado | Significado |
|--------|-------------|
| **Activa** | Matrícula vigente |
| **Retirada** | El estudiante se retiró antes de finalizar |
| **Completada** | Finalizó satisfactoriamente |
| **Reprobada** | No cumplió requisitos |
| **Transferida** | Se movió a otra oferta o institución |

> Tras crear una matrícula, **no se puede cambiar** el estudiante, curso o período; solo el **estado** y la fecha de matrícula.

---

## Matrícula individual

### Pasos

1. Seleccione el **período académico** en la cabecera.
2. Entre en **Matrículas** → **Nueva matrícula**.
3. Elija **estudiante**, **curso** y **período** (deben ser coherentes).
4. Indique fecha de matrícula y estado inicial (normalmente **Activa**).
5. Guarde.

**Nota:** el selector de estudiantes **excluye** a quienes ya tienen matrícula **activa** en el período elegido, para evitar duplicados.

---

## Matrícula masiva

Ruta: `/enrollments/bulk`

### Pasos

1. Seleccione **período** y **curso / paralelo**.
2. El sistema muestra estudiantes **disponibles** (sin matrícula activa en ese curso).
3. Marque los estudiantes a matricular.
4. Confirme la operación.
5. Revise el resultado en el listado de matrículas.

---

## Consulta y edición

1. Filtre el listado por período, curso o estado.
2. Abra una matrícula para **cambiar el estado** (por ejemplo, a Retirada o Completada).
3. Los docentes usan la misma tabla en **solo lectura** para sus cursos.

---

## Vista del estudiante

Los estudiantes no usan esta pestaña. Consultan **Mis matrículas** — ver [16 — Vistas del estudiante](./16-estudiante-mis-vistas.md).

---

## Consejos

- Cree primero los **cursos** del período y dé de alta a los **estudiantes**.
- Una misma persona solo puede tener **una matrícula activa por curso y período**.
- Para muchos alumnos nuevos, combine [importación CSV de estudiantes](./11-estudiantes.md) con matrícula incluida o use matrícula masiva después.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| Estudiante no aparece al matricular | Ya tiene matrícula activa en ese período o curso. |
| No puede cambiar de curso | Cree nueva matrícula y cierre la anterior con el estado adecuado. |
| Docente no ve una matrícula | Verifique asignación docente y período en cabecera. |
