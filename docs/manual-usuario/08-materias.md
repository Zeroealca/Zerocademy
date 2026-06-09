# Materias

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Crear, editar, activar, desactivar y eliminar materias del catálogo | **Super administrador** |
| Consultar materias al asignar docentes o configurar currículo | **Administrador**, **Docente** (sin pestaña dedicada de escritura) |

> Solo el **super administrador** ve la pestaña **Materias** en el menú lateral.

---

## Cómo llegar

- Menú lateral → **Materias**
- Ruta: `http://localhost:3000/subjects`
- Crear: `/subjects/new`
- Editar: `/subjects/[id]/edit`

---

## Para qué sirve

El **catálogo de materias** es reutilizable y **no depende del año lectivo**. Ejemplos: Matemática, Lengua y Literatura, Ciencias Naturales.

Las materias se **vinculan a grados** (qué asignatura se imparte en qué curso/grado) y luego se **asignan a docentes** por curso y período en [Asignaciones docentes](./09-asignaciones-docentes.md).

---

## Relaciones

```
Materia
  ├── Vinculación a grados (qué grados la cursan)
  └── Asignación docente → Curso + Período + Profesor
```

---

## Pasos de uso típico (super administrador)

### Revisar el catálogo

1. Entre en **Materias**.
2. Use búsqueda y filtros (activas, del sistema, por grado).
3. Revise código, nombre y estado.

### Crear una materia

1. Pulse **Nueva materia**.
2. Indique **código** (único en toda la plataforma, ej.: `MATEMATICA`).
3. Escriba el **nombre** en español.
4. Opcionalmente vincule **grados** donde aplica la materia.
5. Guarde.

### Editar o desactivar

1. Abra la materia desde el listado.
2. Modifique nombre, grados vinculados o estado.
3. Para **desactivar**, confirme que no tenga **asignaciones docentes** activas.

### Eliminar

- Solo si **no** hay asignaciones docentes que la referencien.

---

## Catálogo Ecuador (semillas)

Al ejecutar las semillas del proyecto se cargan materias comunes del currículo ecuatoriano con sus vínculos a grados. Son entradas de **sistema** (`isSystem`).

---

## Consejos

- Use **códigos cortos y estables**; el nombre visible puede cambiar sin afectar reportes futuros.
- Las materias de **sistema** pueden usarse en cualquier grado al asignar docentes; las personalizadas deben estar vinculadas al grado del curso.
- Los administradores de colegio **no crean materias** en esta versión; solicitan al super administrador ampliaciones del catálogo.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| No puede desactivar | Existen asignaciones docentes; elimínelas o reasígnelas primero. |
| Código duplicado | Elija otro código único. |
| Docente no puede asignar una materia | Verifique que la materia esté activa y vinculada al grado del curso. |
