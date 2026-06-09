# Estructura (árbol)

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Ver la vista jerárquica | **Administrador**, **Docente** |
| Modificar niveles, grados o cursos desde aquí | **No** — la edición se hace en sus módulos respectivos |

---

## Cómo llegar

- Menú lateral → **Estructura (árbol)**
- Ruta: `http://localhost:3000/academic-structure`

---

## Para qué sirve

Muestra la **jerarquía académica** de forma visual y compacta:

```
Nivel académico
  └── Grado
        └── Curso / Paralelo (del período seleccionado)
```

Es útil para **orientarse** antes de matricular, asignar docentes o revisar la oferta del colegio en un año lectivo.

---

## Filtros disponibles

Según la interfaz, podrá filtrar por:

| Filtro | Uso |
|--------|-----|
| **Institución** | Cuando gestiona o consulta datos de una institución concreta |
| **Período académico** | Para ver qué cursos existen en ese año lectivo bajo cada grado |

El **período de la cabecera** también influye en los datos mostrados.

---

## Pasos de uso típico

1. Seleccione el **período académico** en la barra superior.
2. Abra **Estructura (árbol)**.
3. Ajuste los filtros de **institución** y **período** si la pantalla los ofrece.
4. Expanda los nodos del árbol: nivel → grado → cursos.
5. Use esta vista para verificar que existen los paralelos necesarios antes de matricular.

---

## Qué puede y no puede hacer aquí

| Puede | No puede |
|-------|----------|
| Explorar la estructura completa del período | Crear niveles o grados (catálogo de plataforma) |
| Identificar cursos faltantes por grado | Crear cursos directamente (vaya a [Cursos / Paralelos](./06-cursos-paralelos.md)) |
| Compartir una imagen mental del colegio con el equipo | Editar asignaciones docentes |

---

## Consejos

- Si un grado aparece **sin cursos**, créelos en **Cursos / Paralelos**.
- Los **docentes** usan esta vista en **solo lectura** para conocer la organización del colegio.
- Combine esta vista con la [transición de período](./14-transicion-periodo.md) para comprobar que el nuevo año lectivo tiene cursos copiados.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| Árbol vacío | Verifique período e institución en los filtros. |
| Falta un nivel del catálogo | El super administrador debe cargar o activar niveles/grados en plataforma. |
| Cursos de otro año | Cambie el filtro de período académico. |
