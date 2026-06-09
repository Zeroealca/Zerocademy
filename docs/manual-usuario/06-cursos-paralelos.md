# Cursos y paralelos

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Crear, editar y desactivar cursos | **Administrador** |
| Consultar listado y detalle | **Administrador**, **Docente** |

> El **super administrador** no ve esta pestaña; la operación es responsabilidad del administrador de cada institución.

---

## Cómo llegar

- Menú lateral → **Cursos / Paralelos**
- Ruta: `http://localhost:3000/courses`

---

## Para qué sirve

Un **curso** (también llamado **paralelo** o **sección**) es el grupo de estudiantes de un **grado** en un **período académico** concreto. Por ejemplo: «Octavo EGB — Paralelo A» para el año 2025-2026.

Los cursos son la unidad donde después se **matriculan estudiantes** y se **asignan docentes** por materia.

---

## Conceptos clave

| Campo | Descripción |
|-------|-------------|
| Período académico | Año lectivo al que pertenece el curso |
| Grado | Nivel/grado del catálogo (ej.: Octavo de EGB) |
| Sección / paralelo | Letra o código del grupo (A, B, C…) |
| Nombre | Etiqueta visible (puede combinar grado + paralelo) |
| Capacidad | Límite opcional de cupos |

**Regla:** no puede existir dos cursos con la misma combinación de período + grado + sección.

---

## Pasos de uso típico (administrador)

1. En la **cabecera**, seleccione el **período académico** correcto.
2. Entre en **Cursos / Paralelos**.
3. Pulse **Nuevo curso**.
4. Complete:
   - **Período académico** (debe coincidir con el de la cabecera)
   - **Grado**
   - **Sección** (ej.: `A`)
   - **Nombre** y **capacidad** (opcional)
5. Guarde.
6. Repita para cada paralelo del colegio (A, B, C…).
7. Para dar de baja un curso sin borrar historial, use **Desactivar**.

---

## Flujo recomendado al inicio de año

1. Confirmar que el **período académico** institucional está activo (o usar [transición de período](./14-transicion-periodo.md)).
2. Crear o copiar **cursos** para el nuevo período.
3. [Asignar docentes](./09-asignaciones-docentes.md) a cada curso y materia.
4. [Matricular estudiantes](./12-matriculas.md).

---

## Consejos

- Siempre trabaje con el **mismo período** en la cabecera y al crear el curso.
- Los docentes solo ven cursos relacionados con sus asignaciones; si un docente «no ve» un curso, revise las asignaciones docentes.
- La **capacidad** es informativa; el sistema no bloquea matrículas por cupo de forma automática en esta versión.

---

## Errores frecuentes

| Situación | Causa | Solución |
|-----------|-------|----------|
| «Ya existe» al crear | Misma sección en mismo grado y período | Use otra letra de paralelo o edite el existente. |
| Grado no disponible | Grado desactivado en catálogo | Pida al super administrador que reactive el grado. |
| Curso en período equivocado | Período mal seleccionado | Cambie el período en la cabecera y vuelva a crear o edite. |
