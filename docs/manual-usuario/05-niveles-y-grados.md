# Niveles académicos y Grados

Esta guía cubre dos pestañas relacionadas del menú lateral: **Niveles académicos** y **Grados**.

---

## ¿Quién puede usar esta sección?

| Pestaña | Crear / editar / activar | Consultar |
|---------|--------------------------|-----------|
| Niveles académicos | **Super administrador** | Administrador y docente (vía cursos y estructura) |
| Grados | **Super administrador** | Administrador y docente (vía cursos y estructura) |

> Solo el **super administrador** ve estas pestañas en el menú lateral.

---

## Cómo llegar

| Pestaña | Ruta |
|---------|------|
| Niveles académicos | Menú lateral → **Niveles académicos** → `/academic-levels` |
| Grados | Menú lateral → **Grados** → `/grade-levels` |

---

## Para qué sirve

Define el **catálogo reutilizable** de la plataforma: las etapas educativas y los grados dentro de cada etapa. Este catálogo se comparte entre instituciones y **no depende del año lectivo**.

### Jerarquía

```
Nivel académico  (ej.: Educación General Básica, Bachillerato)
    └── Grado      (ej.: Octavo de EGB, Primero de BGU)
            └── Curso / Paralelo  (se crea por período — ver sección 06)
```

### Ejemplos del catálogo Ecuador (semillas)

| Nivel | Grados de ejemplo |
|-------|-------------------|
| Educación Inicial | Preparatoria, Inicial |
| Educación General Básica (EGB) | Primero a Décimo de EGB |
| Bachillerato General Unificado (BGU) | Primero a Tercero de BGU |

---

## Niveles académicos

### Pasos de uso típico

1. Entre en **Niveles académicos**.
2. Revise el listado (código, nombre, orden, estado).
3. Para crear uno nuevo:
   - Pulse **Nuevo nivel**.
   - Indique **código** (único), **nombre** y **orden** de visualización.
   - Guarde.
4. Para **desactivar** un nivel, asegúrese de que no tenga grados activos dependientes.

### Campos importantes

- **Código:** identificador corto (ej.: `EGB`, `BGU`).
- **Orden:** posición en listas y en el árbol de estructura.
- **Sistema:** los niveles precargados por la plataforma están marcados como catálogo del sistema.

---

## Grados

### Pasos de uso típico

1. Entre en **Grados**.
2. Filtre o busque por nivel académico si la pantalla lo permite.
3. Para crear un grado:
   - Pulse **Nuevo grado**.
   - Seleccione el **nivel académico** padre.
   - Indique **código** y **nombre** (ej.: `8VO_EGB`, «Octavo de EGB»).
   - Guarde.
4. Use **Activar** / **Desactivar** según necesite el grado en operaciones futuras.

### Reglas

- El código del grado es **único dentro de su nivel**.
- No puede eliminar un grado si tiene **cursos** u otras dependencias.

---

## Consejos

- Ejecute las **semillas** del proyecto (`npm run prisma:seed`) para cargar el catálogo ecuatoriano de referencia antes de operar un colegio.
- Los **administradores de institución** no modifican este catálogo; abren **cursos** sobre los grados existentes.
- Si su colegio necesita una estructura especial, el super administrador puede ampliar el catálogo sin afectar a otras instituciones (filas personalizadas con alcance institucional en evoluciones futuras).

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| No aparece un grado al crear curso | Verifique que el grado esté **activo**. |
| No puede desactivar un nivel | Desactive primero todos los grados hijos. |
| Nombres distintos a los del ministerio | El catálogo sembrado usa nombres oficiales en español; puede editar etiquetas si su institución lo requiere. |
