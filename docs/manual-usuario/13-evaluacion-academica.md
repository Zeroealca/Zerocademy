# Evaluación académica

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Configurar esquemas, términos, categorías y configuración institucional | **Administrador** |
| Consultar toda la configuración | **Administrador**, **Docente** |
| Inicializar plantilla global Ecuador | **Super administrador** |
| Inicializar plantilla Ecuador en una institución | **Administrador** |

---

## Cómo llegar

- Menú lateral → **Evaluación académica**
- Ruta principal: `http://localhost:3000/academic-evaluation`

### Subsecciones

| Sección | Ruta |
|---------|------|
| Panel / resumen | `/academic-evaluation` |
| Esquemas de calificación | `/academic-evaluation/grading-schemes` |
| Períodos de evaluación (términos con peso) | `/academic-evaluation/evaluation-terms` |
| Categorías de evaluación | `/academic-evaluation/assessment-categories` |
| Configuración institucional | `/academic-evaluation/configuration` |

---

## Para qué sirve

Define **cómo se calculan y interpretan las notas** en su institución: escala numérica, equivalencias cualitativas, pesos por quimestre o parcial, y pesos por tipo de actividad (exámenes, tareas, proyectos, etc.).

Los módulos futuros de **registro de notas** y **libretas** leerán esta configuración; no deben hardcodear reglas ecuatorianas.

> **Importante:** los **quimestres de calendario** (fechas del año lectivo) se gestionan en [Períodos académicos](./04-periodos-academicos.md). Aquí se configuran los **períodos de evaluación** con **pesos** para el cálculo de promedios.

---

## Panel principal

Al entrar verá:

- Selector de **institución** (si aplica a su rol)
- Accesos a las cuatro subsecciones
- Vista previa de **pesos** (términos y categorías deben sumar 100 %)
- Opción para **inicializar plantilla Ecuador** en la institución

---

## Esquemas de calificación

### Qué es

Un esquema define:

- Nota **mínima** y **máxima** (ej.: 0 a 10)
- Nota de **aprobación** (ej.: 7)
- **Decimales** a mostrar (0 a 4)

### Escalas cualitativas (Ecuador)

La plantilla estándar incluye estas bandas:

| Código | Rango | Significado |
|--------|-------|-------------|
| **DAR** | 9,00 – 10,00 | Domina los aprendizajes requeridos |
| **AAR** | 7,00 – 8,99 | Alcanza los aprendizajes requeridos |
| **PAAR** | 4,01 – 6,99 | Está próximo a alcanzar los aprendizajes requeridos |
| **NAAR** | 0,00 – 4,00 | No alcanza los aprendizajes requeridos |

### Pasos (administrador)

1. Abra **Esquemas de calificación**.
2. Cree un esquema o use el generado por la plantilla Ecuador.
3. Revise o ajuste las **escalas** (rangos no deben solaparse).
4. Marque un esquema como **predeterminado** si su institución tiene varios.

---

## Períodos de evaluación (términos con peso)

### Qué es

Son los **tramos ponderados** del año para calcular la nota final (ej.: primer y segundo quimestre al 50 % cada uno).

### Regla

La suma de los pesos de los términos **activos** para un período académico debe ser **100 %** (tolerancia ±0,01).

### Plantilla Ecuador (ejemplo)

| Término | Peso |
|---------|------|
| Primer quimestre | 50 % |
| Segundo quimestre | 50 % |

### Pasos

1. Seleccione **institución** y **período académico**.
2. Abra **Períodos de evaluación**.
3. Cree o edite cada término con nombre, orden y peso.
4. Use **reordenar** si cambia la secuencia.
5. Confirme que la barra de progreso de pesos muestre **100 %**.

---

## Categorías de evaluación

### Qué es

Define **de dónde sale la nota** dentro de cada término: exámenes, trabajo en clase, proyectos, etc.

### Regla

La suma de pesos de categorías **activas** por institución debe ser **100 %**.

### Plantilla Ecuador (ejemplo incluido en semillas)

| Categoría | Peso típico | Descripción |
|-----------|-------------|-------------|
| Evaluación formativa | 70 % | Tareas, participación, trabajo en clase |
| Evaluación sumativa | 30 % | Pruebas, exámenes, proyectos evaluados |

Referencia: [Instructivo de Evaluación Estudiantil 2025, página 16](https://educacion.gob.ec/wp-content/uploads/downloads/2025/04/Instructivo-de-Evaluacion-Estudiantil-2025.pdf), para EGB Media, Superior y Bachillerato. No aplicar estos pesos a niveles con evaluación exclusivamente cualitativa.

### Categorías TAI, AGA, AEA (personalización)

Estos nombres son ejemplos personalizados del plan de pruebas del proyecto, no categorías oficiales obligatorias del Ministerio:

| Sigla | Nombre habitual | Uso |
|-------|-----------------|-----|
| **TAI** | Trabajo Autónomo e Interactivo | Actividades individuales e interactivas |
| **AGA** | Actividades grupales de aprendizaje | Trabajo colaborativo |
| **AEA** | Actividades de Evaluación Académica | Pruebas y otras actividades calificadas |

Zerocademy **no obliga** esos nombres. Las categorías personalizadas deben sumar 100 % y su configuración debe respetar la normativa aplicable. La plantilla Ecuador usa evaluación formativa y sumativa. Actualizar la plantilla no modifica automáticamente configuraciones institucionales existentes.

### Pasos

1. Abra **Categorías de evaluación**.
2. Cree cada categoría con nombre, descripción y peso.
3. Desactive las que no use.
4. Verifique el total del 100 % en el panel.

---

## Configuración institucional

Vincula en un solo lugar:

- **Esquema de calificación activo**
- **Período académico operativo** para evaluación
- Reglas de **redondeo** y decimales

### Pasos

1. Abra **Configuración institucional**.
2. Elija esquema activo y período.
3. Ajuste redondeo si su reglamento lo exige.
4. Guarde.

---

## Plantilla Ecuador

| Quién | Acción |
|-------|--------|
| Super administrador | Inicializa plantillas **globales** de referencia |
| Administrador | Copia la plantilla a **su institución** desde el panel de evaluación |

La plantilla crea esquema 0–10, escalas DAR/AAR/PAAR/NAAR, términos de evaluación y categorías de ejemplo.

---

## Consejos

- Configure evaluación **antes** de registrar notas cuando ese módulo esté disponible.
- No elimine esquemas usados en configuración activa; desactívelos solo si no están referenciados.
- Los **docentes** deben conocer los pesos para planificar evaluaciones.
- Distinta de [transición de período](./14-transicion-periodo.md): al cambiar de año, revise términos de evaluación del nuevo período.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| Pesos no suman 100 % | Ajuste términos o categorías hasta el total correcto. |
| Rangos de escala solapados | Corrija mínimos y máximos en esquemas. |
| Confundir quimestre de calendario con término de evaluación | Calendario en Períodos académicos; pesos aquí. |
| Docente intenta editar | Solo lectura; solicite cambios al administrador. |
