# Vistas del estudiante: Mis matrículas y Notas

Esta guía cubre las dos pestañas del menú lateral disponibles para el rol **Estudiante**.

---

## ¿Quién puede usar esta sección?

Solo usuarios con rol **Estudiante**.

Los administradores y docentes gestionan matrículas desde [Matrículas](./12-matriculas.md); no usan estas pantallas.

---

## Mis matrículas

### Cómo llegar

- Menú lateral → **Mis matrículas**
- Ruta: `http://localhost:3000/my-enrollments`

### Para qué sirve

Muestra su **historial de matrículas**: en qué **período académico**, **curso / paralelo** y con qué **estado** estuvo inscrito.

### Pasos de uso

1. Inicie sesión con su cuenta de estudiante.
2. En la cabecera, seleccione el **período académico** que desea consultar (opcional; el listado puede incluir varios períodos).
3. Abra **Mis matrículas**.
4. Revise la tabla: curso, período, estado (Activa, Completada, etc.) y fechas.
5. Use la paginación si tiene muchos registros históricos.

### Qué verá

- Su nombre en el encabezado de la página
- Tabla de matrículas en **solo lectura** (sin botones de editar o crear)

### Consejos

- Si la tabla está vacía, confirme el período en la cabecera o contacte a secretaría: quizá aún no lo han matriculado.
- Los estados **Retirada**, **Completada** o **Transferida** son registros históricos; no significan error.

---

## Notas

### Cómo llegar

- Menú lateral → **Notas**
- Ruta: `http://localhost:3000/grades`

### Para qué sirve

Está prevista para consultar sus **calificaciones** del período académico seleccionado: promedios por materia, equivalencias DAR/AAR/PAAR/NAAR, etc.

### Estado actual

> **Próximamente.** En la versión actual la pantalla muestra un aviso de que el módulo de notas estará disponible en una próxima versión.

Mientras tanto:

1. Revise sus matrículas en **Mis matrículas** para confirmar curso y período.
2. Consulte calificaciones por los canales que use su institución (libreta impresa, correo del docente, etc.) hasta que el módulo esté activo.

### Qué esperar en versiones futuras

- Notas filtradas por **período** de la cabecera
- Detalle por **materia** y término de evaluación
- Solo **sus** datos; sin acceso a compañeros

---

## Selector de período (estudiante)

En la barra superior puede elegir el **período académico** para contextualizar lo que ve en Mis matrículas y, cuando exista, en Notas.

Si ve «Sin institución asignada» o «Sin períodos», contacte a administración: su cuenta o la institución pueden estar incompletas.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| Acceso denegado | Entró con un rol que no es estudiante. |
| No hay matrículas | Verifique período; solicite matrícula al colegio. |
| Notas vacías | Comportamiento esperado hasta que el módulo se publique. |

---

## Relación con otras secciones

| Necesidad | Dónde la gestiona el colegio |
|-----------|------------------------------|
| Matricularlo | [Matrículas](./12-matriculas.md) (administrador) |
| Cambiar de paralelo | Administrador (nueva matrícula / estado) |
| Configurar cómo se calculan notas | [Evaluación académica](./13-evaluacion-academica.md) (administrador) |
