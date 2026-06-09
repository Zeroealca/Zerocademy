# Estudiantes

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Crear, editar, activar, desactivar e importar masivamente | **Administrador** |
| Consultar listado y ficha | **Administrador**, **Docente** (estudiantes de sus cursos) |
| Ver su propio perfil | **Estudiante** (rutas propias, no esta pestaña) |

> El **super administrador** no gestiona estudiantes institucionales desde esta pantalla.

---

## Cómo llegar

- Menú lateral → **Estudiantes**
- Ruta: `http://localhost:3000/students`
- Alta individual: `/students/new`
- Edición: `/students/[id]/edit`
- Importación masiva: `/students/bulk-import`
- Historial de matrículas de un estudiante: `/students/[id]/enrollments`

---

## Para qué sirve

Registra a las **personas estudiantes** de la institución: datos personales, contacto y cuenta de acceso. Cada estudiante tiene un perfil permanente; las matrículas por año se gestionan aparte en [Matrículas](./12-matriculas.md).

---

## Alta individual

### Pasos

1. Entre en **Estudiantes** → **Nuevo estudiante**.
2. Complete los datos de la cuenta:
   - Correo electrónico
   - Contraseña (mínimo 8 caracteres)
   - Nombres y apellidos
3. Complete datos del perfil:
   - **Cédula / identificación nacional** (única)
   - Fecha de nacimiento (opcional)
   - Género, teléfono, dirección, contacto de emergencia (opcionales)
4. Guarde.
5. Si necesita matricularlo de inmediato, vaya a [Matrículas](./12-matriculas.md) o use importación masiva con curso.

---

## Edición

1. Busque al estudiante en el listado.
2. Abra **Editar**.
3. Modifique los campos permitidos (no cambie la cédula si ya está en uso por otro).
4. Guarde.

---

## Activar y desactivar

- **Desactivar:** el estudiante no podrá iniciar sesión; se conserva su historial.
- **Activar:** restablece el acceso.

Use estas acciones en lugar de eliminar cuando un alumno se retira temporalmente.

---

## Importación masiva (CSV)

Ruta: **Estudiantes** → **Importación masiva** (`/students/bulk-import`).

### Para qué sirve

Crear muchos estudiantes a la vez y, opcionalmente, **matricularlos** en un curso del período seleccionado.

### Formato del archivo

- Campos separados por **comas**.
- Cada fila termina con **punto y coma** (`;`).
- Puede incluir una **fila de encabezado** (se ignora si coincide con los nombres de columna).
- **No use comas** dentro de dirección o contacto de emergencia.

### Orden de columnas (10 campos)

| # | Campo | Obligatorio | Notas |
|---|--------|-------------|-------|
| 1 | email | Sí | Correo válido |
| 2 | password | Sí | Mínimo 8 caracteres |
| 3 | firstName | Sí | Nombres |
| 4 | lastName | Sí | Apellidos |
| 5 | nationalId | Sí | Cédula única |
| 6 | birthDate | No | Formato `AAAA-MM-DD` |
| 7 | gender | No | `MALE`, `FEMALE`, `OTHER`, `UNSPECIFIED` |
| 8 | phone | No | Teléfono |
| 9 | address | No | Dirección |
| 10 | emergencyContact | No | Contacto de emergencia |

### Ejemplo de fila

```
student1@colegio.edu,ClaveSegura1,Juan,Pérez,0912345678,2010-05-15,MALE,0991234567,Av. Principal 123,María Pérez (madre);
```

### Pasos en pantalla

1. Seleccione **período académico** y **curso** destino.
2. Pegue las filas de datos en el área de texto (sin repetir el encabezado si la pantalla ya lo muestra).
3. Ejecute la importación.
4. Revise el **resumen**: importados, omitidos y errores por fila.

### Resultados posibles

| Resultado | Significado |
|-----------|-------------|
| Importado | Usuario y perfil creados; matrícula activa si aplica |
| Omitido | Ya existía matrícula en ese curso/período |
| Error | Fila inválida, correo duplicado, cédula repetida en el archivo, etc. |

---

## Consejos

- Verifique el **período** y **curso** antes de importar; corregir matrículas masivas es más lento.
- Entregue a cada estudiante su **contraseña inicial** por un canal seguro.
- Los docentes solo ven estudiantes de **cursos donde están asignados**.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| Fila rechazada por formato | Revise que haya exactamente 10 campos y cierre con `;`. |
| Cédula duplicada | Una cédula solo puede pertenecer a un estudiante. |
| Correo ya usado por no estudiante | Use otro correo o contacte al administrador de usuarios. |
| Importación sin matrícula | Confirme que seleccionó curso y período en el formulario. |
