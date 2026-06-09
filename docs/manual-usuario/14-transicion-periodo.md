# Transición de período (cambio de año lectivo)

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Ver historial y período activo institucional | **Super administrador**, **Administrador**, **Docente** (consulta) |
| Previsualizar y ejecutar transición | **Administrador** |

---

## Cómo llegar

1. Menú lateral → **Instituciones**
2. Abra su institución
3. Pestaña interna → **Transiciones**
4. Ruta: `http://localhost:3000/institutions/[id]/transitions`

> Esta función **no** tiene pestaña propia en el menú principal; vive dentro del detalle de cada institución.

---

## Para qué sirve

Permite pasar el colegio de un **año lectivo** a otro (por ejemplo, de `2025-2026` a `2026-2027`) **sin perder el historial** y sin recrear manualmente toda la estructura.

La transición puede:

- Crear o usar un **período destino**
- **Copiar cursos** (paralelos) al nuevo año
- **Copiar asignaciones docentes** (opcional)
- **Copiar quimestres** de calendario al nuevo período
- **Cerrar** el período origen y **activar** el destino
- Actualizar el **período activo** de la institución
- Registrar una **auditoría** de quién ejecutó el cambio

---

## Qué no duplica

Estos datos son **reutilizables** y no se copian como filas nuevas:

- Niveles y grados del catálogo
- Materias
- Perfiles de estudiantes y docentes

Las **matrículas** de estudiantes en el nuevo año se gestionan aparte después de la transición.

---

## Opciones al ejecutar

| Opción | Por defecto | Descripción |
|--------|-------------|-------------|
| Copiar cursos | Sí | Crea paralelos equivalentes en el período destino |
| Copiar asignaciones docentes | No | Replica profesor + materia en los cursos nuevos (requiere copiar cursos) |
| Copiar quimestres | Sí | Al crear período nuevo, copia términos de calendario |
| Activar período destino | Sí | Deja el nuevo año como operativo |
| Cerrar período origen | Sí | Marca el año anterior como cerrado |

---

## Pasos de uso típico (administrador)

### 1. Preparación

1. Confirme que el **período origen** (año que termina) existe y tiene los cursos deseados.
2. Asegúrese de que el **período destino** exista en el calendario (creado por super admin) o dé que la transición lo cree.
3. Entre en **Instituciones** → su colegio → **Transiciones**.

### 2. Previsualización

1. Seleccione período **origen** y **destino**.
2. Marque las opciones de copia.
3. Pulse **Previsualizar**.
4. Revise el resumen: cuántos cursos, asignaciones y estructuras se copiarán.
5. **No se guarda nada** en la previsualización.

### 3. Ejecución

1. Si el resumen es correcto, pulse **Ejecutar transición**.
2. Espere a que finalice (operación en una sola transacción).
3. Verifique en **Cursos / Paralelos** y **Estructura (árbol)** que el nuevo año tiene sus paralelos.
4. Matricule estudiantes en el nuevo período.
5. Si no copió asignaciones, créelas en [Asignaciones docentes](./09-asignaciones-docentes.md).

### 4. Después del cambio

- Actualice el **selector de período** en la cabecera al nuevo año.
- Revise [Evaluación académica](./13-evaluacion-academica.md) para el período destino.

---

## Historial

La misma pantalla muestra **transiciones anteriores**: quién las ejecutó, períodos origen/destino y qué se copió.

---

## Consejos

- Ejecute siempre la **previsualización** antes del cambio real.
- Haga la transición en una ventana de **bajo tráfico**; no interrumpa el proceso.
- Si necesita copiar docentes al nuevo año, active **Copiar asignaciones** y **Copiar cursos**.
- El período activo institucional queda alineado con el destino si eligió activar.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| No puede ejecutar | Origen y destino deben ser de la **misma institución**. |
| Asignaciones no copiadas | Active copiar cursos y asignaciones; sin cursos nuevos no hay mapeo. |
| Período destino ya activo en conflicto | Revise estados en Períodos académicos (super admin). |
| Estudiantes no aparecen en nuevo año | La transición **no matricula** automáticamente; use Matrículas. |
