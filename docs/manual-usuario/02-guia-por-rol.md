# Guía por rol

Esta sección resume **qué menú ve cada rol**, **qué puede hacer** y **qué no puede hacer** en Zerocademy. Los permisos reales los aplica el servidor; la interfaz solo oculta opciones que no le corresponden.

---

## Roles del sistema

| Rol | Nombre en la interfaz | Descripción breve |
|-----|----------------------|-------------------|
| `SUPER_ADMIN` | Super administrador | Gestión de la plataforma completa: instituciones, catálogo global, calendario nacional, usuarios. |
| `ADMIN` | Administrador | Operación diaria de **su institución**: estudiantes, matrículas, cursos, docentes, evaluación. |
| `TEACHER` | Docente | Consulta de cursos, estudiantes y matrículas **asignados**; lectura de evaluación académica. |
| `STUDENT` | Estudiante | Consulta de **sus propias** matrículas y (próximamente) notas. |

---

## Tabla detallada por rol

### Super administrador (`SUPER_ADMIN`)

| Área | ¿Ve en el menú? | Puede hacer | No puede hacer |
|------|-----------------|-------------|----------------|
| Resumen | Sí | Ver panel de bienvenida | — |
| Períodos académicos | Sí | Crear, editar, activar y archivar períodos globales; gestionar quimestres | — |
| Niveles académicos | Sí | Crear, editar y activar/desactivar niveles del catálogo | — |
| Grados | Sí | Crear, editar y activar/desactivar grados del catálogo | — |
| Materias | Sí | Crear, editar y activar/desactivar materias del catálogo | — |
| Cursos / Paralelos | **No** | — | Gestionar cursos de una institución (rutas estrictas sin acceso) |
| Estructura (árbol) | **No** | — | Ver árbol operativo institucional |
| Asignaciones docentes | **No** | — | Asignar profesores a cursos |
| Evaluación académica | **No** | — | Configurar evaluación de una institución |
| Estudiantes | **No** | — | Alta o edición de estudiantes institucionales |
| Matrículas | **No** | — | Crear o editar matrículas |
| Instituciones | Sí | Crear instituciones; activar/desactivar; ver listado | Editar configuración operativa como admin de colegio (lo hace el ADMIN de la institución) |
| Usuarios | Sí | Crear cualquier tipo de usuario; asignar cualquier rol; buscar, filtrar y ordenar el directorio (nombre, correo, rol, estado) | — |
| Miembros de institución | Desde Instituciones | Asignar administradores y docentes a instituciones | — |
| Plantilla Ecuador (evaluación) | Desde Evaluación (si accede por URL) | Inicializar plantillas globales de calificación | — |
| Selector de período (cabecera) | **No** | — | Seleccionar período de trabajo (no aplica a su flujo) |

**Enfoque:** configurar la **plataforma** y las **instituciones**, no el día a día de un colegio concreto.

---

### Administrador (`ADMIN`)

| Área | ¿Ve en el menú? | Puede hacer | No puede hacer |
|------|-----------------|-------------|----------------|
| Resumen | Sí | Ver panel de bienvenida | — |
| Períodos académicos | **No** | — | Crear o activar el calendario global |
| Niveles / Grados / Materias (catálogo) | **No** en menú de escritura | Consultar catálogo vía cursos y asignaciones | Crear niveles, grados o materias de plataforma |
| Cursos / Paralelos | Sí | Crear, editar y desactivar cursos por período y grado | — |
| Estructura (árbol) | Sí | Ver jerarquía Nivel → Grado → Curso | — |
| Asignaciones docentes | Sí | Asignar docente + materia + curso + período | — |
| Evaluación académica | Sí | Configurar esquemas, términos, categorías e inicializar plantilla Ecuador en su institución | Gestionar plantillas globales de plataforma |
| Estudiantes | Sí | Alta individual, edición, activar/desactivar, importación masiva CSV | — |
| Matrículas | Sí | Matrícula individual, masiva, cambio de estado | — |
| Instituciones | Sí | Ver institución; editar **configuración**, logo y colores; ver miembros | Crear o eliminar instituciones; asignar miembros (super admin) |
| Transiciones de período | Desde Instituciones → Transiciones | Previsualizar y **ejecutar** cambio de año lectivo | — |
| Usuarios | Sí | Crear y editar usuarios; buscar, filtrar y ordenar el directorio (sin ver super administradores) | Crear super administradores; asignar roles distintos de Estudiante al crear usuarios |
| Selector de período (cabecera) | Sí | Elegir período de trabajo | — |

**Enfoque:** operación completa de **su institución educativa**.

---

### Docente (`TEACHER`)

| Área | ¿Ve en el menú? | Puede hacer | No puede hacer |
|------|-----------------|-------------|----------------|
| Resumen | Sí | Ver panel de bienvenida | — |
| Cursos / Paralelos | Sí | **Consultar** cursos (lectura) | Crear o editar cursos |
| Estructura (árbol) | Sí | **Consultar** la estructura | Modificar estructura |
| Asignaciones docentes | Sí | **Consultar** asignaciones | Crear o eliminar asignaciones |
| Evaluación académica | Sí | **Consultar** esquemas, términos y categorías | Modificar configuración |
| Estudiantes | Sí | Ver estudiantes de **sus cursos asignados** | Crear, editar o importar estudiantes |
| Matrículas | Sí | Ver matrículas de **sus cursos asignados** | Crear o modificar matrículas |
| Transiciones | Desde Instituciones (si tiene acceso) | **Consultar** historial de transiciones | Ejecutar transiciones |
| Instituciones | **No** | — | Configuración institucional |
| Usuarios | **No** | — | Gestión de cuentas |
| Selector de período (cabecera) | Sí | Elegir período para filtrar su vista | — |

**Enfoque:** consulta de la información académica **vinculada a sus asignaciones**.

---

### Estudiante (`STUDENT`)

| Área | ¿Ve en el menú? | Puede hacer | No puede hacer |
|------|-----------------|-------------|----------------|
| Resumen | Sí | Ver panel de bienvenida | — |
| Mis matrículas | Sí | Ver su historial de matrículas por período y curso | Ver matrículas de otros estudiantes |
| Notas | Sí | Acceder a la sección (contenido **próximamente**) | Ver notas de otros; registrar calificaciones |
| Cursos, Estudiantes, Matrículas (admin) | **No** | — | Cualquier gestión institucional |
| Configuración / Instituciones | **No** | — | Cualquier configuración |
| Selector de período (cabecera) | Sí | Elegir período para filtrar sus datos | — |

**Enfoque:** consulta de **sus propios** datos académicos.

---

## Resumen visual del menú lateral

```
Todos          → Resumen
SUPER_ADMIN    → Períodos | Niveles | Grados | Materias | Instituciones | Usuarios
ADMIN          → Cursos | Asignaciones | Estructura | Evaluación | Estudiantes | Matrículas | Instituciones | Usuarios
TEACHER        → Cursos | Asignaciones | Estructura | Evaluación | Estudiantes | Matrículas
STUDENT        → Mis matrículas | Notas
```

---

## Consejos

- Si necesita una acción que no aparece en su menú, solicítela al **administrador de su institución** o al **super administrador** de la plataforma.
- El rol en la cabecera (etiqueta gris) le indica con qué permisos está operando.
- Algunas pantallas de institución (Configuración, Miembros, Transiciones) se abren **dentro del detalle de una institución**, no como pestañas del menú principal.

---

## Errores frecuentes

| Situación | Causa probable |
|-----------|----------------|
| «Acceso denegado» al entrar a una URL | Su rol no tiene permiso para esa ruta. |
| No ve Estudiantes siendo super admin | Es el comportamiento esperado: la gestión de estudiantes es del administrador institucional. |
| Docente no ve un estudiante | El estudiante no está matriculado en un curso donde usted está asignado. |
