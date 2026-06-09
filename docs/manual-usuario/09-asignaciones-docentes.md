# Asignaciones docentes

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Crear, editar y eliminar asignaciones | **Administrador** |
| Consultar asignaciones | **Administrador**, **Docente** |

---

## Cómo llegar

- Menú lateral → **Asignaciones docentes**
- Ruta: `http://localhost:3000/teacher-assignments`
- Crear: `/teacher-assignments/new`

---

## Para qué sirve

Una **asignación docente** vincula:

- Un **profesor** (usuario con rol Docente)
- Una **materia**
- Un **curso / paralelo**
- Un **período académico**

Con esto el docente queda autorizado a ver estudiantes y matrículas de ese curso, y en el futuro registrar notas de esa materia.

```
Profesor  ↔  Asignación  ↔  Materia
                    ↔  Curso
                    ↔  Período académico
```

---

## Reglas importantes

- Solo puede haber **una asignación** por combinación profesor + materia + curso + período.
- El **curso** debe pertenecer al **mismo período** seleccionado en la asignación.
- El profesor debe ser un usuario **activo** con rol **Docente**.
- La materia y el curso deben estar **activos**.
- Las materias personalizadas deben aplicar al **grado** del curso.

---

## Pasos de uso típico (administrador)

1. Asegúrese de tener:
   - Período académico seleccionado en la **cabecera**
   - **Cursos** creados para ese período
   - **Usuarios docentes** dados de alta y vinculados a la institución
2. Entre en **Asignaciones docentes**.
3. Filtre por período si el listado es largo.
4. Pulse **Nueva asignación**.
5. Seleccione en cascada:
   - **Período académico**
   - **Curso / paralelo**
   - **Materia**
   - **Docente**
6. Guarde.
7. Repita para cada combinación materia–curso–profesor del año.

### Eliminar o corregir

- Abra la asignación desde la tabla y edite o elimine según corresponda.
- Al cambiar de año lectivo, puede **copiar asignaciones** con la [transición de período](./14-transicion-periodo.md).

---

## Consejos

- Complete primero la [estructura de cursos](./06-cursos-paralelos.md) y el [catálogo de materias](./08-materias.md).
- Un mismo docente puede tener **varias asignaciones** (distintas materias o paralelos).
- Si un docente no ve estudiantes, casi siempre falta la asignación o el período de la cabecera no coincide.

---

## Errores frecuentes

| Mensaje / situación | Solución |
|---------------------|----------|
| Conflicto / duplicado | Ya existe esa combinación; edite la fila existente. |
| Curso no válido para el período | Elija un curso del mismo año lectivo. |
| Materia no aplica al grado | Vincule la materia al grado (super admin) o elija otra materia. |
| Docente no aparece en la lista | Verifique que el usuario tenga rol Docente y membresía activa en la institución. |
