# Representantes

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Ver portal **Mis estudiantes** y consultar notas, libreta y asistencia | **Representante** (solo estudiantes con vínculo activo) |
| Crear cuentas con rol Representante | **Administrador**, **Super administrador** |
| Asociar, actualizar o desactivar vínculos en la ficha del estudiante | **Administrador** (solo su institución) |
| Enviar justificación de ausencia de un estudiante vinculado | **Representante** (mismo flujo que el estudiante; sin adjuntos) |
| Editar notas, asistencia diaria o revisar justificaciones | **Nadie** con rol Representante |

---

## Cómo llegar

### Portal del representante

- Menú lateral → **Mis estudiantes**
- Ruta: `http://localhost:3000/representative`

Desde cada tarjeta puede abrir:

| Enlace | Ruta |
|--------|------|
| Ver libreta | `/report-cards?studentId=…` |
| Ver notas | `/grades?studentId=…` |
| Ver asistencia | `/attendance/reports?studentId=…&academicPeriodId=…` |

### Administración de vínculos

- **Estudiantes** → **Editar** un estudiante → sección **Representantes**
- Ruta: `/students/[id]/edit`

---

## Para qué sirve

Un **representante** es una cuenta de acceso con rol `REPRESENTATIVE`. Solo consulta información académica de los estudiantes con los que tiene una relación **activa**. El administrador institucional crea la cuenta y define los vínculos (madre, padre, representante legal, etc.).

---

## Consulta como representante

1. Inicie sesión con su cuenta de representante.
2. Abra **Mis estudiantes**.
3. Elija el estudiante y use **Ver libreta**, **Ver notas** o **Ver asistencia**.
4. Al cambiar de estudiante, la interfaz vuelve a cargar los datos de ese estudiante (no reutiliza la caché del anterior).

### Límites de solo lectura

- No puede crear ni modificar notas, matrículas ni configuración académica.
- No puede registrar asistencia diaria ni revisar justificaciones (eso lo hace el administrador).
- Sí puede **enviar** una justificación de ausencia elegible desde la vista de asistencia del estudiante vinculado, con el mismo formulario en español que usa el estudiante.
- No ve comentarios de revisión ni datos de otros estudiantes aunque altere la URL: el servidor responde como si el recurso no existiera.

---

## Administración: vincular un representante

1. Cree la cuenta en **Usuarios** con rol **Representante** (o pida al super administrador que la cree).
2. Abra la ficha del estudiante → **Editar**.
3. En **Representantes**, busque la cuenta existente y asocie el tipo de relación.
4. Opcionalmente márquela como **principal** (solo puede haber un principal activo por estudiante; es informativo y no cambia permisos).
5. Para retirar el acceso, use **Desactivar**. El historial del vínculo se conserva, pero el portal deja de mostrar a ese estudiante.

---

## Errores frecuentes

| Situación | Causa probable |
|-----------|----------------|
| El portal muestra «No tienes estudiantes asociados» | No hay vínculos activos, o fueron desactivados. |
| «Acceso denegado» o datos vacíos al cambiar la URL | El estudiante no está vinculado activamente a su cuenta. |
| No aparece un representante al asociar | La cuenta no tiene rol Representante, está inactiva o ya está vinculada. |
