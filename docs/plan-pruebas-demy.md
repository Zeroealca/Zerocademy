# Plan de pruebas Zerocademy (DEMY)

Exportado desde el canvas de Cursor para ejecutar QA en otra computadora.

**Proyecto Jira:** [DEMY / Zerocademy](https://emilioandresalcivarcarrera.atlassian.net/jira/software/projects/DEMY/boards)

**Fecha de exportación:** 17 sep 2026

---

## Ambiente

1. Clonar el monorepo y levantar backend + frontend (o Docker Compose).
2. Ejecutar seed:

```bash
npm run prisma:seed -w backend-zerocademy
```

3. Abrir UI: `http://localhost:3000`
4. Institución demo: `demo-grades` · período activo: `2025-2026 Demo`

### Cuentas del seed

| Rol            | Email                          | Contraseña        |
| -------------- | ------------------------------ | ----------------- |
| SUPER_ADMIN    | `admin@zerocademy.edu`         | `ChangeMe123!`    |
| ADMIN          | `admin.demo@zerocademy.edu`    | `DemoAdmin123!`   |
| TEACHER        | `teacher.demo@zerocademy.edu`  | `DemoTeacher123!` |
| STUDENT        | `student1.demo@zerocademy.edu` | `DemoStudent123!` |
| REPRESENTATIVE | `rep.demo@zerocademy.edu`      | `DemoRep123!`     |

Estudiantes extra: `student2.demo` … `student8.demo@zerocademy.edu` / `DemoStudent123!`

---

## Cómo usar este documento

- Cada tarea tiene **objetivo**, **rol**, **datos de éxito**, **flujo** y **criterios** (checklist).
- El **caso de fallo** aparece solo donde hay validación, unicidad o rechazo de rol (32 de 65).
- Tickets hermanos no duplican el negativo (p. ej. DEMY-13 éxito ↔ DEMY-14 fallo).
- Marca `[x]` al completar cada paso del flujo, resultado de fallo y criterio.
- En el índice también puedes marcar cada tarea al cerrarla.

### Resumen

- **65** funciones con plan
- **63** En pruebas · **2** Listo (regresión)
- **32** con caso de fallo explícito

### Índice por épica

- **DEMY-2 · Autenticación y sesión** (5)
  - [ ] [DEMY-13](#demy-13) — Login exitoso con credenciales válidas
  - [ ] [DEMY-14](#demy-14) — Rechazo de login con credenciales inválidas · fallo
  - [ ] [DEMY-15](#demy-15) — Persistencia de sesión con refresh token
  - [ ] [DEMY-16](#demy-16) — Cerrar sesión (logout)
  - [ ] [DEMY-17](#demy-17) — Mostrar/ocultar contraseña en formularios
- **DEMY-3 · Usuarios y control de acceso (RBAC)** (3)
  - [ ] [DEMY-18](#demy-18) — Listar usuarios del sistema · fallo
  - [ ] [DEMY-19](#demy-19) — Crear usuario nuevo · fallo
  - [ ] [DEMY-20](#demy-20) — Navegación lateral según rol · fallo
- **DEMY-4 · Instituciones educativas** (6)
  - [ ] [DEMY-21](#demy-21) — Listar instituciones educativas
  - [ ] [DEMY-22](#demy-22) — Crear institución educativa · fallo
  - [ ] [DEMY-23](#demy-23) — Editar configuración de institución · fallo
  - [ ] [DEMY-24](#demy-24) — Subir logo de institución · fallo
  - [ ] [DEMY-25](#demy-25) — Editar colores de branding institucional · fallo
  - [ ] [DEMY-26](#demy-26) — Activar y desactivar institución · fallo
- **DEMY-5 · Períodos académicos y contexto** (6)
  - [ ] [DEMY-27](#demy-27) — Listar períodos académicos
  - [ ] [DEMY-28](#demy-28) — Crear período académico con quimestres · fallo
  - [ ] [DEMY-29](#demy-29) — Activar período académico
  - [ ] [DEMY-30](#demy-30) — Desactivar período académico
  - [ ] [DEMY-31](#demy-31) — Selector de período en cabecera · fallo
  - [ ] [DEMY-32](#demy-32) — Cambiar período seleccionado por usuario
- **DEMY-6 · Transición de período académico** (3)
  - [ ] [DEMY-33](#demy-33) — Ver período activo institucional
  - [ ] [DEMY-34](#demy-34) — Previsualizar transición de período · fallo
  - [ ] [DEMY-35](#demy-35) — Ejecutar transición de año lectivo
- **DEMY-7 · Estructura académica** (7)
  - [ ] [DEMY-36](#demy-36) — Listar niveles académicos
  - [ ] [DEMY-37](#demy-37) — Crear nivel académico personalizado · fallo
  - [ ] [DEMY-38](#demy-38) — Crear grado académico · fallo
  - [ ] [DEMY-39](#demy-39) — Crear curso/paralelo · fallo
  - [ ] [DEMY-40](#demy-40) — Editar curso existente
  - [ ] [DEMY-41](#demy-41) — Vista árbol jerárquica
  - [ ] [DEMY-42](#demy-42) — Filtrar árbol por institución y período
- **DEMY-8 · Materias y asignaciones docentes** (6)
  - [ ] [DEMY-43](#demy-43) — Listar materias
  - [ ] [DEMY-44](#demy-44) — Crear materia institucional · fallo
  - [ ] [DEMY-45](#demy-45) — Editar materia existente
  - [ ] [DEMY-46](#demy-46) — Listar asignaciones docentes
  - [ ] [DEMY-47](#demy-47) — Crear asignación docente · fallo
  - [ ] [DEMY-48](#demy-48) — Editar asignación docente
- **DEMY-9 · Estudiantes** (7)
  - [ ] [DEMY-49](#demy-49) — Listar estudiantes
  - [ ] [DEMY-50](#demy-50) — Crear estudiante individual · fallo
  - [ ] [DEMY-51](#demy-51) — Editar datos de estudiante
  - [ ] [DEMY-52](#demy-52) — Activar y desactivar estudiante · fallo
  - [ ] [DEMY-53](#demy-53) — Importación masiva CSV exitosa
  - [ ] [DEMY-54](#demy-54) — Validación errores importación CSV · fallo
  - [ ] [DEMY-55](#demy-55) — Ver historial de matrículas del estudiante
- **DEMY-10 · Matrículas** (6)
  - [ ] [DEMY-56](#demy-56) — Listar matrículas
  - [ ] [DEMY-57](#demy-57) — Crear matrícula individual · fallo
  - [ ] [DEMY-58](#demy-58) — Excluir estudiantes ya matriculados en período · fallo
  - [ ] [DEMY-59](#demy-59) — Matrícula masiva de estudiantes
  - [ ] [DEMY-60](#demy-60) — Editar estado de matrícula
  - [ ] [DEMY-61](#demy-61) — Consultar mis matrículas (estudiante) · fallo
- **DEMY-11 · Evaluación académica** (11)
  - [ ] [DEMY-62](#demy-62) — Dashboard de evaluación académica
  - [ ] [DEMY-63](#demy-63) — Inicializar plantilla Ecuador en institución
  - [ ] [DEMY-64](#demy-64) — Crear esquema de calificación · fallo
  - [ ] [DEMY-65](#demy-65) — Gestionar escalas cualitativas (bandas) · fallo
  - [ ] [DEMY-66](#demy-66) — Crear términos de evaluación con pesos
  - [ ] [DEMY-67](#demy-67) — Validar suma de pesos de términos = 100% · fallo
  - [ ] [DEMY-68](#demy-68) — Reordenar términos de evaluación
  - [ ] [DEMY-69](#demy-69) — Crear categorías de evaluación
  - [ ] [DEMY-70](#demy-70) — Validar suma de pesos de categorías = 100% · fallo
  - [ ] [DEMY-71](#demy-71) — Configuración activa de institución
  - [ ] [DEMY-72](#demy-72) — Configuración plataforma Ecuador (SUPER_ADMIN) · fallo
- **DEMY-12 · UX general y mensajes** (3)
  - [ ] [DEMY-73](#demy-73) — Mensajes de error de API en español · fallo
  - [ ] [DEMY-74](#demy-74) — Selectores con búsqueda en formularios
  - [ ] [DEMY-75](#demy-75) — Selector de alcance institucional en evaluación · fallo
- **DEMY-76 · Calificaciones y notas** (2)
  - [ ] [DEMY-77](#demy-77) — Módulo Grades fase 1 — evaluaciones, registro y gestión de notas · fallo
  - [ ] [DEMY-78](#demy-78) — Motor de cálculo de notas — Academic Performance (fase 2) · fallo

---

## DEMY-2 · Autenticación y sesión

### DEMY-13

**Login exitoso con credenciales válidas**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-13
- **Rol:** Cualquier usuario con cuenta activa (ej. ADMIN del seed).
- **Objetivo:** Verificar que un usuario activo puede iniciar sesión y acceder al dashboard.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- URL: http://localhost:3000/login
- El rechazo de login está en DEMY-14.

#### Flujo de prueba

- [ ] Abrir `http://localhost:3000/login`.
- [ ] Ingresar email y contraseña válidos del seed.
- [ ] Pulsar **Iniciar sesión**.
- [ ] Confirmar redirección a `/dashboard`.
- [ ] Verificar que el menú lateral muestra opciones acordes al rol.

#### Criterios de aceptación

- [x] El login redirige al dashboard sin errores.
- [x] El nombre/rol del usuario aparece en la interfaz.
- [x] Las peticiones subsiguientes incluyen token Bearer (sin 401).
- [x] No se muestran mensajes de error en pantalla.

---

### DEMY-14

**Rechazo de login con credenciales inválidas**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-14
- **Rol:** Público (sin sesión).
- **Objetivo:** Verificar que credenciales incorrectas no permiten acceso y muestran mensaje genérico.

#### Datos de éxito

- Camino feliz de login: DEMY-13 con admin.demo@zerocademy.edu / DemoAdmin123!.

#### Flujo de éxito

- [ ] Ir a `/login`.
- [ ] Ingresar email válido y contraseña incorrecta.
- [ ] Intentar iniciar sesión.
- [ ] Repetir con email inexistente.

#### Caso de fallo

**Datos**

- Email existente + clave mala: admin.demo@zerocademy.edu / ClaveMala999!
- Email inexistente: nadie@zerocademy.edu / Cualquier123!

**Pasos**

- [ ] Ir a /login sin sesión.
- [ ] Probar email existente con contraseña incorrecta.
- [ ] Probar email que no existe.

**Resultado esperado**

- [x] Permanece en /login; no hay token en el navegador.
- [x] Mensaje genérico en español (no indica si el email existe).
- [x] API 401.

#### Criterios de aceptación

- [x] La API responde 401 con mensaje genérico (no revela si el email existe).
- [x] El usuario permanece en la pantalla de login.
- [x] Se muestra mensaje de error en español en la UI.
- [x] No se guarda sesión ni token en el navegador.

---

### DEMY-15

**Persistencia de sesión con refresh token**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-15
- **Rol:** Usuario autenticado.
- **Objetivo:** Verificar que la sesión se renueva automáticamente sin pedir login de nuevo.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Navegar a /students para forzar API tras expirar el access token.

#### Flujo de prueba

- [ ] Iniciar sesión normalmente.
- [ ] Navegar por 2-3 secciones del dashboard.
- [ ] Esperar a que expire el access token (o forzar recarga tras unos minutos).
- [ ] Realizar una acción que llame a la API (ej. listar estudiantes).

#### Criterios de aceptación

- [x] La app renueva el token vía `POST /v1/auth/refresh` sin intervención del usuario.
- [x] No aparece pantalla de login mientras el refresh token sea válido.
- [x] Las listas y formularios cargan datos correctamente tras la renovación.

---

### DEMY-16

**Cerrar sesión (logout)**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-16
- **Rol:** Usuario autenticado.
- **Objetivo:** Verificar que el logout revoca la sesión y bloquea acceso al dashboard.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Tras logout, pegar http://localhost:3000/dashboard.

#### Flujo de prueba

- [ ] Iniciar sesión.
- [ ] Usar la opción de cerrar sesión en la UI.
- [ ] Intentar volver a `/dashboard` manualmente en la barra de direcciones.

#### Criterios de aceptación

- [x] Tras logout se redirige a `/login`.
- [x] `POST /v1/auth/logout` revoca el refresh token.
- [x] Rutas protegidas redirigen a login.
- [x] Un refresh con el token anterior falla con 401.

---

### DEMY-17

**Mostrar/ocultar contraseña en formularios**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-17
- **Rol:** Público o ADMIN (formularios con campo password).
- **Objetivo:** Verificar el toggle de visibilidad de contraseña en formularios de credenciales.

#### Datos de éxito

- Login: contraseña DemoAdmin123!
- Creación de usuario: admin@zerocademy.edu / ChangeMe123! en /users/new.

#### Flujo de prueba

- [ ] Ir a `/login`.
- [ ] Escribir una contraseña de prueba.
- [ ] Pulsar el icono de mostrar/ocultar.
- [ ] Repetir en el formulario de creación de usuario en `/users` o de estudiante en `/students/new`.

#### Criterios de aceptación

- [x] El campo alterna entre tipo `password` y `text`.
- [x] El icono cambia de estado (ojo abierto/cerrado).
- [x] El valor escrito no se pierde al alternar.
- [x] Funciona en login y al menos un formulario de creación.

---

## DEMY-3 · Usuarios y control de acceso (RBAC)

### DEMY-18

**Listar usuarios del sistema**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-18
- **Rol:** SUPER_ADMIN (prueba principal). ADMIN también accede. TEACHER y STUDENT no.
- **Objetivo:** Verificar que SUPER_ADMIN y ADMIN pueden ver el listado paginado de usuarios, filtrarlo por texto, rol y estado, y ordenarlo por rol o estado.

#### Datos de éxito

- Éxito: admin@zerocademy.edu / ChangeMe123! en /users.

#### Flujo de éxito

- [ ] Iniciar sesión como SUPER_ADMIN (`admin@zerocademy.edu` / `ChangeMe123!`).
- [ ] Ir a `/users`.
- [ ] Revisar la tabla Directorio (nombre, correo, rol y estado).
- [ ] Usar Buscar con un nombre o correo del seed (ej. `admin.demo` o `Ana`). Esperar ~0,5 s (debounce).
- [ ] Filtrar por Rol (ej. Docente) y comprobar que solo aparecen usuarios de ese rol.
- [ ] Filtrar por Estado (Activos / Inactivos).
- [ ] Combinar búsqueda + rol + estado.
- [ ] Pulsar la cabecera Rol: Super administrador → Representante; segundo clic invierte.
- [ ] Pulsar la cabecera Estado: activos primero; segundo clic pone inactivos primero.
- [ ] Si hay más de 10 usuarios, probar paginación y confirmar que el orden se mantiene.
- [ ] Como ADMIN (`admin.demo@zerocademy.edu`): ver Usuarios, sin cuentas SUPER_ADMIN.
- [ ] Como TEACHER o STUDENT: no ver Usuarios; al pegar `/users`, acceso denegado.

#### Caso de fallo

**Datos**

- Éxito SUPER_ADMIN: admin@zerocademy.edu / ChangeMe123! en /users (Buscar, Rol, Estado, ordenar cabeceras).
- Éxito ADMIN: admin.demo@zerocademy.edu / DemoAdmin123! en /users (sin SUPER_ADMIN).
- Fallo: student1.demo@zerocademy.edu / DemoStudent123! o teacher.demo@zerocademy.edu / DemoTeacher123! abriendo /users.

**Pasos**

- [ ] Listar, filtrar y ordenar usuarios como SUPER_ADMIN.
- [ ] Abrir /users como ADMIN (debe entrar, sin SUPER_ADMIN).
- [ ] Abrir /users como TEACHER y como STUDENT.

**Resultado esperado**

- [x] Buscar, Rol y Estado reducen el directorio; cabeceras Rol/Estado ordenan; vacío muestra «No se encontraron usuarios.»
- [x] ADMIN ve Usuarios pero no cuentas SUPER_ADMIN.
- [x] TEACHER y STUDENT no ven Usuarios; al pegar /users: acceso denegado.

#### Criterios de aceptación

- [x] La ruta `/users` es accesible para SUPER_ADMIN y ADMIN.
- [x] Se muestran usuarios del seed con nombre, correo, rol y estado correctos.
- [x] Buscar filtra por nombre o correo (sin distinguir mayúsculas; debounce ~500 ms).
- [x] El filtro Rol deja solo usuarios de ese rol.
- [x] El filtro Estado deja solo activos o inactivos.
- [x] La cabecera Rol ordena el directorio (y un segundo clic invierte).
- [x] La cabecera Estado ordena activos/inactivos (y un segundo clic invierte).
- [x] El orden se aplica a todo el listado, no solo a la página visible.
- [x] ADMIN no ve ni puede filtrar cuentas SUPER_ADMIN.
- [x] TEACHER/STUDENT no ven el ítem en el menú ni acceden a la ruta.
- [x] La lista carga sin error 403/401 para roles permitidos.

---

### DEMY-19

**Crear usuario nuevo**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-19
- **Rol:** SUPER_ADMIN.
- **Objetivo:** Verificar creación de usuario con rol y datos válidos.

#### Datos de éxito

- Éxito: qa.teacher@zerocademy.edu · TeacherNew123! · rol TEACHER · QA Docente.

#### Flujo de éxito

- [ ] Ir a `/users` (el formulario de alta está en la misma página; no hay `/users/new`).
- [ ] Completar email, contraseña, nombre, rol (ej. TEACHER).
- [ ] Guardar.
- [ ] En el directorio, usar Buscar con el correo o nombre creado y, si hace falta, el filtro Rol.
- [ ] Intentar login con las credenciales creadas.

#### Caso de fallo

**Datos**

- Éxito: qa.teacher@zerocademy.edu · TeacherNew123! · rol TEACHER · QA Docente.
- Fallo: el mismo email, o admin.demo@zerocademy.edu.

**Pasos**

- [ ] Crear el usuario nuevo.
- [ ] Repetir el mismo email en el formulario de `/users`.

**Resultado esperado**

- [x] El primero se crea y puede iniciar sesión.
- [x] Duplicado: «Este correo ya está registrado.», no hay segunda fila.

#### Criterios de aceptación

- [x] El usuario se crea y aparece en la lista.
- [x] Se puede localizar con Buscar y/o el filtro Rol.
- [x] Validaciones de email duplicado muestran «Este correo ya está registrado.»
- [x] El nuevo usuario puede iniciar sesión.
- [x] El menú lateral refleja el rol asignado.

---

### DEMY-20

**Navegación lateral según rol**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-20
- **Rol:** SUPER_ADMIN, ADMIN, TEACHER y STUDENT.
- **Objetivo:** Verificar que cada rol ve exactamente los ítems del sidebar definidos en dashboard-sidebar.tsx.

#### Datos de éxito

- Común a todos: Resumen (/dashboard). Ningún otro ítem es compartido por los cuatro roles.
- SUPER_ADMIN (admin@zerocademy.edu / ChangeMe123!): Resumen · Períodos académicos · Niveles académicos · Grados · Materias · Evaluación académica · Notas · Rendimiento · Instituciones · Usuarios.
- ADMIN (admin.demo@zerocademy.edu / DemoAdmin123!): Resumen · Cursos / Paralelos · Asignaciones docentes · Estructura (árbol) · Evaluación académica · Estudiantes · Matrículas · Notas · Rendimiento · Instituciones · Usuarios.
- TEACHER (teacher.demo@zerocademy.edu / DemoTeacher123!): Resumen · Cursos / Paralelos · Asignaciones docentes · Estructura (árbol) · Evaluación académica · Estudiantes · Matrículas · Notas · Rendimiento.
- STUDENT (student1.demo@zerocademy.edu / DemoStudent123!): Resumen · Mis matrículas · Notas · Rendimiento.
- No aparecen en el menú lateral (se abren dentro de Instituciones): Configuración, Miembros, Transiciones.
- REPRESENTATIVE (rep.demo) no es parte de DEMY-20; si se prueba, solo verá Resumen.

#### Flujo de éxito

- [ ] Iniciar sesión con cada cuenta y anotar el menú de izquierda a derecha/arriba abajo.
- [ ] Comparar con la lista de Datos de éxito (orden del código).
- [ ] Como STUDENT pegar /users y /institutions.
- [ ] Como TEACHER pegar /users y /academic-periods.

#### Caso de fallo

**Datos**

- STUDENT: student1.demo@zerocademy.edu / DemoStudent123! → pegar /users y /institutions.
- TEACHER: teacher.demo@zerocademy.edu / DemoTeacher123! → pegar /users y /academic-periods.

**Pasos**

- [ ] Como STUDENT abrir /users e /institutions en la barra de direcciones.
- [ ] Como TEACHER abrir /users y /academic-periods.

**Resultado esperado**

- [x] Esas rutas no están en su menú.
- [x] Al forzar la URL: acceso denegado o redirección, sin listados de otros roles.

#### Criterios de aceptación

- [x] El único ítem común a todos los roles es Resumen.
- [x] SUPER_ADMIN, ADMIN, TEACHER y STUDENT coinciden con las listas de Datos de éxito.
- [x] TEACHER no ve Instituciones ni Usuarios.
- [x] STUDENT no ve Cursos, Estudiantes, Matrículas (admin), Instituciones ni Usuarios.
- [x] Rutas no autorizadas: denegado o redirect, sin datos ajenos.

---

## DEMY-4 · Instituciones educativas

### DEMY-21

**Listar instituciones educativas**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-21
- **Rol:** SUPER_ADMIN o ADMIN.
- **Objetivo:** Verificar listado de instituciones con filtros básicos.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123! o admin.demo@zerocademy.edu / DemoAdmin123!
- Debe aparecer: Escuela Demo Calificaciones (código demo-grades)
- Email: demo@zerocademy.edu · régimen Sierra/Amazonía.

#### Flujo de prueba

- [ ] Ir a `/institutions`.
- [ ] Revisar instituciones del seed.
- [ ] Abrir detalle de una institución.

#### Criterios de aceptación

- [x] Se listan instituciones con nombre, código y estado.
- [x] El detalle muestra datos de contacto y régimen.
- [x] La paginación funciona si hay muchos registros.
- [x] Textos de la UI en español.

---

### DEMY-22

**Crear institución educativa**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-22
- **Rol:** SUPER_ADMIN.
- **Objetivo:** Verificar alta de nueva institución con código único.

#### Datos de éxito

- Éxito: Colegio QA Norte · código qa-norte · qa.norte@zerocademy.edu · SIERRA + SIERRA_AMAZONIA.

#### Flujo de éxito

- [ ] Ir a formulario de nueva institución.
- [ ] Ingresar nombre, código único, email y régimen.
- [ ] Guardar.
- [ ] Verificar en listado.
- [ ] Intentar crear otra con el mismo código (debe fallar).

#### Caso de fallo

**Datos**

- Éxito: Colegio QA Norte · código qa-norte · qa.norte@zerocademy.edu · SIERRA + SIERRA_AMAZONIA.
- Fallo: código qa-norte otra vez, o demo-grades.

**Pasos**

- [ ] Crear qa-norte.
- [ ] Intentar el mismo código o demo-grades.

**Resultado esperado**

- [x] La primera aparece en el listado.
- [x] Código duplicado: error en español.
- [x] ADMIN no puede crear instituciones.

#### Criterios de aceptación

- [x] La institución se crea correctamente.
- [x] Código duplicado muestra error claro en español.
- [x] Solo SUPER_ADMIN puede crear.
- [x] Aparece en el listado de instituciones.

---

### DEMY-23

**Editar configuración de institución**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-23
- **Rol:** SUPER_ADMIN o ADMIN.
- **Objetivo:** Verificar actualización de contacto, región y régimen académico.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Abrir institución existente.
- [ ] Ir a configuración/ajustes.
- [ ] Modificar teléfono, dirección o régimen.
- [ ] Guardar y recargar página.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: teléfono +593-2-234-0000 · región SIERRA · régimen SIERRA_AMAZONIA.
- Fallo: región COSTA + régimen SIERRA_AMAZONIA.

**Pasos**

- [ ] Guardar datos coherentes y recargar.
- [ ] Intentar COSTA con SIERRA_AMAZONIA.

**Resultado esperado**

- [x] Datos coherentes persisten.
- [x] Combinación inválida: error en español, no se guarda.

#### Criterios de aceptación

- [x] Los cambios persisten tras recargar.
- [x] Validación de consistencia región/régimen muestra error si aplica.
- [x] La API responde 200 al guardar.
- [x] Mensajes de éxito en español.

---

### DEMY-24

**Subir logo de institución**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-24
- **Rol:** SUPER_ADMIN o ADMIN.
- **Objetivo:** Verificar carga y visualización del logo institucional.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · Escuela Demo Calificaciones (código demo-grades)

#### Flujo de éxito

- [ ] Abrir configuración de institución.
- [ ] Subir imagen PNG o JPEG (menor a 5 MB).
- [ ] Guardar.
- [ ] Verificar que el logo se muestra en la UI.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · Escuela Demo Calificaciones (código demo-grades)
- Éxito: PNG o JPEG menor a 5 MB.
- Fallo: .txt/.pdf, o archivo mayor a 5 MB.

**Pasos**

- [ ] Subir imagen válida y recargar.
- [ ] Intentar .txt o un archivo > 5 MB.

**Resultado esperado**

- [x] Logo válido se ve en la UI.
- [x] Formato o tamaño inválido: error en español; el logo anterior no se pierde.

#### Criterios de aceptación

- [x] Imagen válida se sube correctamente.
- [x] Archivos mayores a 5 MB o formatos inválidos muestran error.
- [x] El logo se visualiza tras guardar.
- [x] La vista previa se actualiza correctamente.

---

### DEMY-25

**Editar colores de branding institucional**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-25
- **Rol:** SUPER_ADMIN o ADMIN.
- **Objetivo:** Verificar personalización de colores primario y secundario.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Ir a branding de la institución.
- [ ] Establecer colores hex válidos (#RRGGBB).
- [ ] Guardar.
- [ ] Intentar un valor inválido.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: #1B4F72 y #F4D03F.
- Fallo: azul, #GGG, 123456 sin #.

**Pasos**

- [ ] Guardar hex válido y recargar.
- [ ] Escribir un valor que no sea #RRGGBB.

**Resultado esperado**

- [x] Hex válido persiste.
- [x] Formato inválido: validación en español.

#### Criterios de aceptación

- [x] Colores válidos se guardan correctamente.
- [x] Formato inválido muestra validación en español.
- [x] Los cambios persisten al recargar.
- [x] La API responde correctamente al guardar.

---

### DEMY-26

**Activar y desactivar institución**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-26
- **Rol:** SUPER_ADMIN
- **Objetivo:** Verificar que un SUPER_ADMIN puede activar y desactivar una institución, y que las operaciones académicas quedan bloqueadas cuando la institución está inactiva.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!

#### Flujo de éxito

- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Navegar a la gestión de instituciones.
- [ ] Seleccionar una institución activa y desactivarla.
- [ ] Intentar realizar una operación académica (ej. crear período, matricular estudiante).
- [ ] Reactivar la institución.
- [ ] Verificar que las operaciones académicas vuelven a estar disponibles.

#### Caso de fallo

**Datos**

- Usuario: admin@zerocademy.edu / ChangeMe123!
- Usar qa-norte (DEMY-22), no desactivar demo-grades durante la batería.

**Pasos**

- [ ] Desactivar qa-norte.
- [ ] Intentar crear curso o matricular en esa institución.
- [ ] Reactivar y repetir la operación.

**Resultado esperado**

- [x] Inactiva: operación bloqueada y mensaje claro.
- [x] Tras reactivar, la operación se permite.

#### Criterios de aceptación

- [x] SUPER_ADMIN puede desactivar una institución activa
- [x] SUPER_ADMIN puede reactivar una institución inactiva
- [x] Las operaciones académicas están bloqueadas cuando la institución está inactiva
- [x] Se muestra mensaje claro al usuario cuando la institución está inactiva
- [x] El estado de la institución se refleja correctamente en la UI

---

## DEMY-5 · Períodos académicos y contexto

### DEMY-27

**Listar períodos académicos**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-27
- **Rol:** ADMIN, SUPER_ADMIN
- **Objetivo:** Verificar el listado de períodos académicos en `/academic-periods` con filtros por régimen y estado.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!
- Filas: 2025-2026 Demo (ACTIVE) y 2024-2025 Demo (CLOSED)
- Filtro régimen: SIERRA_AMAZONIA.

#### Flujo de prueba

- [ ] Iniciar sesión con rol ADMIN o SUPER_ADMIN.
- [ ] Navegar a `/academic-periods`.
- [ ] Verificar que se muestra la lista de períodos académicos.
- [ ] Aplicar filtro por régimen académico.
- [ ] Aplicar filtro por estado (ACTIVE, CLOSED, DRAFT, etc.).
- [ ] Verificar que los resultados se actualizan correctamente.

#### Criterios de aceptación

- [x] La ruta `/academic-periods` muestra el listado de períodos
- [x] Filtro por régimen funciona correctamente
- [x] Filtro por estado funciona correctamente
- [x] Los filtros pueden combinarse
- [x] Se muestra información relevante de cada período (nombre, fechas, estado)

---

### DEMY-28

**Crear período académico con quimestres**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-28
- **Rol:** SUPER_ADMIN
- **Objetivo:** Verificar que SUPER_ADMIN puede crear un período académico definiendo fechas y términos (quimestres).

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!

#### Flujo de éxito

- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Navegar al formulario de creación de período académico.
- [ ] Completar nombre, fechas de inicio y fin del período.
- [ ] Definir los términos/quimestres con sus fechas.
- [ ] Guardar el período.
- [ ] Verificar que aparece en el listado con estado DRAFT.

#### Caso de fallo

**Datos**

- Usuario: admin@zerocademy.edu / ChangeMe123!
- Éxito: 2026-2027 QA · SIERRA_AMAZONIA · 2026-09-01 a 2027-06-30.
- Q1 2026-09-01 a 2026-12-15 · Q2 2027-01-07 a 2027-06-30.
- Fallo: fin 2026-01-01 anterior al inicio 2026-09-01.

**Pasos**

- [ ] Crear el período con fechas coherentes (DRAFT).
- [ ] Intentar fin anterior a inicio.

**Resultado esperado**

- [x] Período válido en DRAFT con dos términos.
- [x] Fechas invertidas: error en español.

#### Criterios de aceptación

- [x] SUPER_ADMIN puede acceder al formulario de creación
- [x] Se pueden definir fechas del período académico
- [x] Se pueden crear términos/quimestres con fechas
- [x] El período se guarda correctamente
- [x] Los términos quedan asociados al período creado

---

### DEMY-29

**Activar período académico**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-29
- **Rol:** SUPER_ADMIN
- **Objetivo:** Verificar que al activar un período académico se cierran automáticamente otros períodos ACTIVE del mismo régimen.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!
- No usar 2024-2025 Demo (CLOSED) (ya CLOSED).
- Activar un DRAFT del mismo régimen creado en DEMY-28.

#### Flujo de prueba

- [ ] Tener al menos dos períodos en el mismo régimen, uno ACTIVE y otro DRAFT.
- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Activar el período en estado DRAFT.
- [ ] Verificar que el período activado pasa a ACTIVE.
- [ ] Verificar que el período previamente ACTIVE pasa a CLOSED.

#### Criterios de aceptación

- [x] El período seleccionado pasa a estado ACTIVE
- [x] Otros períodos ACTIVE del mismo régimen pasan a CLOSED
- [x] Solo un período ACTIVE por régimen a la vez
- [x] La UI refleja los cambios de estado inmediatamente

---

### DEMY-30

**Desactivar período académico**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-30
- **Rol:** SUPER_ADMIN
- **Objetivo:** Verificar que al desactivar un período académico este pasa a estado CLOSED.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!
- Cerrar un período ACTIVE de prueba, no el único período operativo si aún lo necesitas.

#### Flujo de prueba

- [ ] Tener un período académico en estado ACTIVE.
- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Ejecutar la acción de desactivar/cerrar el período.
- [ ] Verificar el cambio de estado a CLOSED.
- [ ] Verificar que ya no aparece como período activo.

#### Criterios de aceptación

- [x] El período pasa a estado CLOSED al desactivarse
- [x] No queda disponible como período activo
- [x] Se confirma la acción antes de cerrar (si aplica)
- [x] El listado refleja el nuevo estado

---

### DEMY-31

**Selector de período en cabecera**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-31
- **Rol:** ADMIN, TEACHER, STUDENT
- **Objetivo:** Verificar que el componente de cabecera muestra el período académico efectivo seleccionado.

#### Datos de éxito

- Debe verse: admin.demo@zerocademy.edu / DemoAdmin123!, teacher.demo@zerocademy.edu / DemoTeacher123!, student1.demo@zerocademy.edu / DemoStudent123! (Ana Demo, cédula 1710000001) — valor 2025-2026 Demo (ACTIVE).

#### Flujo de éxito

- [ ] Iniciar sesión con cualquier rol académico.
- [ ] Observar el selector de período en la cabecera del dashboard.
- [ ] Verificar que muestra el período efectivo actual.
- [ ] Verificar que el componente es visible en las páginas principales.

#### Caso de fallo

**Datos**

- Debe verse: admin.demo@zerocademy.edu / DemoAdmin123!, teacher.demo@zerocademy.edu / DemoTeacher123!, student1.demo@zerocademy.edu / DemoStudent123! (Ana Demo, cédula 1710000001) — valor 2025-2026 Demo (ACTIVE).
- No debe verse: admin@zerocademy.edu / ChangeMe123!.

**Pasos**

- [ ] Entrar como ADMIN, TEACHER y STUDENT y mirar la cabecera.
- [ ] Entrar como SUPER_ADMIN.

**Resultado esperado**

- [x] ADMIN/TEACHER/STUDENT muestran 2025-2026 Demo.
- [x] SUPER_ADMIN no usa selector de período de colegio.

#### Criterios de aceptación

- [x] El selector de período aparece en la cabecera
- [x] Muestra el nombre del período efectivo
- [x] Es visible para ADMIN, TEACHER y STUDENT
- [x] El período mostrado coincide con el contexto del usuario

---

### DEMY-32

**Cambiar período seleccionado por usuario**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-32
- **Rol:** ADMIN, TEACHER, STUDENT
- **Objetivo:** Verificar que ADMIN, TEACHER y STUDENT pueden cambiar el período seleccionado mediante PUT context/selection.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Cambiar de 2025-2026 Demo (ACTIVE) a 2024-2025 Demo (CLOSED) y recargar.

#### Flujo de prueba

- [ ] Iniciar sesión con rol ADMIN, TEACHER o STUDENT.
- [ ] Abrir el selector de período en la cabecera.
- [ ] Seleccionar un período diferente al actual.
- [ ] Verificar que se ejecuta PUT context/selection.
- [ ] Verificar que la UI se actualiza con el nuevo período.
- [ ] Recargar la página y confirmar que persiste la selección.

#### Criterios de aceptación

- [x] El usuario puede cambiar el período desde el selector
- [x] Se envía PUT context/selection al cambiar
- [x] La UI refleja el período seleccionado
- [x] La selección persiste tras recargar
- [x] Solo se muestran períodos disponibles para el usuario

---

## DEMY-6 · Transición de período académico

### DEMY-33

**Ver período activo institucional**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-33
- **Rol:** ADMIN, SUPER_ADMIN
- **Objetivo:** Verificar que la tarjeta de período activo se muestra correctamente en la pantalla de transiciones de año lectivo.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Tarjeta esperada: 2025-2026 Demo (ACTIVE).

#### Flujo de prueba

- [ ] Tener un período académico ACTIVE en la institución.
- [ ] Iniciar sesión como ADMIN o SUPER_ADMIN.
- [ ] Navegar a la sección de transiciones de período.
- [ ] Verificar la tarjeta que muestra el período activo institucional.
- [ ] Confirmar que los datos (nombre, fechas, estado) son correctos.

#### Criterios de aceptación

- [x] Se muestra tarjeta con el período activo institucional
- [x] La información del período es correcta
- [x] La tarjeta es visible en la pantalla de transiciones
- [x] Se distingue claramente del período destino

---

### DEMY-34

**Previsualizar transición de período**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-34
- **Rol:** ADMIN, SUPER_ADMIN
- **Objetivo:** Verificar que la previsualización de transición muestra conteos de cursos y asignaciones que serán copiados.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Tener un período origen ACTIVE con cursos y asignaciones docentes.
- [ ] Tener un período destino en DRAFT.
- [ ] Navegar a transiciones de año lectivo.
- [ ] Seleccionar período origen y destino.
- [ ] Ejecutar previsualización (preview).
- [ ] Verificar conteos de cursos y asignaciones a copiar.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: origen 2025-2026 Demo (ACTIVE) → destino DRAFT 2026-2027 QA.
- Conteos seed origen actual: 2 cursos y 2 asignaciones.
- Fallo: origen = destino, o destino ya ACTIVE.

**Pasos**

- [ ] Ejecutar preview ACTIVE → DRAFT.
- [ ] Intentar preview con el mismo período en ambos.

**Resultado esperado**

- [x] Preview muestra conteos sin escribir cambios.
- [x] Misma origen/destino: error, sin copiar.

#### Criterios de aceptación

- [x] El preview muestra cantidad de cursos a copiar
- [x] El preview muestra cantidad de asignaciones docentes a copiar
- [x] Los conteos coinciden con los datos reales del período origen
- [x] No se realizan cambios hasta confirmar la transición

---

### DEMY-35

**Ejecutar transición de año lectivo**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-35
- **Rol:** SUPER_ADMIN
- **Objetivo:** Verificar que la transición de año lectivo copia cursos y asignaciones docentes, y activa el período destino.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!
- Origen seed ya auditado: 2024-2025 Demo (CLOSED) → 2025-2026 Demo (ACTIVE).
- Destino: DRAFT nuevo (DEMY-28). Preview en DEMY-34.

#### Flujo de prueba

- [ ] Configurar período origen ACTIVE con cursos y asignaciones.
- [ ] Configurar período destino en DRAFT.
- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Ejecutar la transición de año lectivo.
- [ ] Verificar que los cursos se copian al período destino.
- [ ] Verificar que las asignaciones docentes se copian.
- [ ] Verificar que el período destino queda ACTIVE y el origen CLOSED.

#### Criterios de aceptación

- [x] Los cursos del período origen se copian al destino
- [x] Las asignaciones docentes se copian correctamente
- [x] El período destino pasa a ACTIVE
- [x] El período origen pasa a CLOSED
- [x] Se muestra confirmación de éxito con resumen de la operación

---

## DEMY-7 · Estructura académica

### DEMY-36

**Listar niveles académicos**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-36
- **Rol:** ADMIN, SUPER_ADMIN
- **Objetivo:** Verificar el listado del catálogo de niveles académicos en `/academic-levels`.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!
- Catálogo Ecuador: niveles EGB y BGU.

#### Flujo de prueba

- [ ] Iniciar sesión como ADMIN o SUPER_ADMIN.
- [ ] Navegar a `/academic-levels`.
- [ ] Verificar que se muestra el catálogo de niveles académicos.
- [ ] Confirmar que se listan niveles predefinidos y personalizados.

#### Criterios de aceptación

- [x] La ruta `/academic-levels` muestra el catálogo
- [x] Se listan todos los niveles disponibles
- [x] Cada nivel muestra nombre y descripción
- [x] Se distingue entre niveles de plataforma e institucionales

---

### DEMY-37

**Crear nivel académico personalizado**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-37
- **Rol:** SUPER_ADMIN
- **Objetivo:** Verificar que SUPER_ADMIN puede crear un nivel académico personalizado en el catálogo de plataforma.

#### Datos de éxito

- Usuario: admin@zerocademy.edu / ChangeMe123!

#### Flujo de éxito

- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Navegar a `/academic-levels`.
- [ ] Abrir formulario de creación de nivel.
- [ ] Completar nombre y datos del nivel personalizado.
- [ ] Guardar y verificar que aparece en el catálogo.

#### Caso de fallo

**Datos**

- Usuario: admin@zerocademy.edu / ChangeMe123!
- Éxito: código QA_NIVEL · Nivel QA.
- Fallo: código EGB.

**Pasos**

- [ ] Crear QA_NIVEL.
- [ ] Intentar código EGB.

**Resultado esperado**

- [x] QA_NIVEL aparece.
- [x] Código duplicado: error en español.

#### Criterios de aceptación

- [x] SUPER_ADMIN puede crear niveles personalizados
- [x] El nivel se guarda en el catálogo de plataforma
- [x] El nuevo nivel aparece en el listado
- [x] Otros roles no pueden crear niveles de plataforma

---

### DEMY-38

**Crear grado académico**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-38
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de grados académicos en `/grade-levels` vinculados a un nivel académico.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! (si 403, usar admin@zerocademy.edu / ChangeMe123!).

#### Flujo de éxito

- [ ] Tener al menos un nivel académico configurado.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/grade-levels`.
- [ ] Crear un nuevo grado seleccionando el nivel padre.
- [ ] Completar nombre y orden del grado.
- [ ] Guardar y verificar en el listado.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! (si 403, usar admin@zerocademy.edu / ChangeMe123!).
- Éxito: EGB · 9VO_QA · Noveno QA.
- Fallo: código de 8.º EGB ya seed en el mismo nivel.

**Pasos**

- [ ] Crear 9VO_QA bajo EGB.
- [ ] Intentar el código de 8.º existente.

**Resultado esperado**

- [x] 9VO_QA queda vinculado a EGB.
- [x] Código duplicado o campos vacíos: error.

#### Criterios de aceptación

- [x] Se puede crear grado en `/grade-levels`
- [x] El grado queda vinculado al nivel académico seleccionado
- [x] El grado aparece en el listado
- [x] Se validan campos obligatorios

---

### DEMY-39

**Crear curso/paralelo**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-39
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de cursos/paralelos en `/courses` asociados a un período y grado académico.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 2025-2026 Demo (ACTIVE) · 8.º EGB.

#### Flujo de éxito

- [ ] Tener período académico y grado configurados.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/courses`.
- [ ] Crear nuevo curso seleccionando período y grado.
- [ ] Definir sección/paralelo y capacidad.
- [ ] Guardar y verificar en el listado.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 2025-2026 Demo (ACTIVE) · 8.º EGB.
- Éxito: sección C.
- Fallo: sección A (ya existe 8vo A).

**Pasos**

- [ ] Crear 8vo C.
- [ ] Intentar otro 8vo A en el mismo período y grado.

**Resultado esperado**

- [x] 8vo C aparece.
- [x] Duplicado período+grado+sección: error.

#### Criterios de aceptación

- [x] Se puede crear curso en `/courses`
- [x] El curso queda vinculado al período y grado
- [x] Se puede definir sección/paralelo
- [x] Se puede definir capacidad máxima
- [x] El curso aparece en el listado

---

### DEMY-40

**Editar curso existente**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-40
- **Rol:** ADMIN
- **Objetivo:** Verificar la edición de un curso existente, modificando capacidad y sección.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Editar 8vo A (período actual): cupo o nombre visible.

#### Flujo de prueba

- [ ] Tener al menos un curso creado.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar al detalle o edición del curso.
- [ ] Modificar la capacidad máxima.
- [ ] Modificar la sección/paralelo.
- [ ] Guardar y verificar los cambios.

#### Criterios de aceptación

- [x] Se puede editar un curso existente
- [x] La capacidad se actualiza correctamente
- [x] La sección se actualiza correctamente
- [x] Los cambios se reflejan en el listado y detalle

---

### DEMY-41

**Vista árbol jerárquica**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-41
- **Rol:** ADMIN
- **Objetivo:** Verificar que `/academic-structure` muestra la jerarquía nivel > grado > curso en formato árbol.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Árbol: EGB → 8.º → 8vo A (período actual) y 8vo B.

#### Flujo de prueba

- [ ] Tener niveles, grados y cursos configurados.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/academic-structure`.
- [ ] Verificar la vista en árbol con la jerarquía completa.
- [ ] Expandir/colapsar nodos del árbol.

#### Criterios de aceptación

- [x] La ruta `/academic-structure` muestra vista árbol
- [x] La jerarquía es nivel > grado > curso
- [x] Los nodos se pueden expandir y colapsar
- [x] Cada nivel muestra la información relevante

---

### DEMY-42

**Filtrar árbol por institución y período**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-42
- **Rol:** ADMIN, SUPER_ADMIN
- **Objetivo:** Verificar que los selectores de institución y período filtran correctamente el árbol jerárquico en la página de estructura académica.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Escuela Demo Calificaciones (código demo-grades) + 2025-2026 Demo (ACTIVE) muestra 8vo A/B; 2024-2025 Demo (CLOSED) muestra 8vo A histórico.

#### Flujo de prueba

- [ ] Tener datos en múltiples instituciones y períodos.
- [ ] Navegar a la página de estructura académica (hierarchy page).
- [ ] Seleccionar una institución en el selector.
- [ ] Verificar que el árbol se actualiza.
- [ ] Seleccionar un período académico.
- [ ] Verificar que solo se muestran cursos del período seleccionado.

#### Criterios de aceptación

- [ ] Existe selector de institución en la página
- [ ] Existe selector de período en la página
- [ ] El árbol se filtra al cambiar institución
- [ ] El árbol se filtra al cambiar período
- [ ] Los filtros pueden combinarse

---

## DEMY-8 · Materias y asignaciones docentes

### DEMY-43

**Listar materias**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-43
- **Rol:** ADMIN, TEACHER
- **Objetivo:** Verificar el listado de materias institucionales en `/subjects`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Debe listar código MATEMATICA y el resto del catálogo Ecuador.

#### Flujo de prueba

- [ ] Tener materias creadas en la institución.
- [ ] Iniciar sesión como ADMIN o TEACHER.
- [ ] Navegar a `/subjects`.
- [ ] Verificar el listado de materias.
- [ ] Confirmar que se muestran nombre, código y estado.

#### Criterios de aceptación

- [ ] La ruta `/subjects` muestra el listado
- [ ] Se listan todas las materias de la institución
- [ ] Cada materia muestra información relevante
- [ ] TEACHER puede ver el listado (solo lectura)

---

### DEMY-44

**Crear materia institucional**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-44
- **Rol:** ADMIN
- **Objetivo:** Verificar que ADMIN puede crear una materia institucional.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/subjects`.
- [ ] Abrir formulario de creación.
- [ ] Completar nombre, código y descripción.
- [ ] Guardar y verificar en el listado.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: código QA-ART · Artes QA.
- Fallo: código MATEMATICA.

**Pasos**

- [ ] Crear QA-ART.
- [ ] Intentar código MATEMATICA.

**Resultado esperado**

- [ ] QA-ART aparece.
- [ ] Código duplicado: error en español.

#### Criterios de aceptación

- [ ] ADMIN puede crear materias
- [ ] Se validan campos obligatorios
- [ ] La materia queda asociada a la institución
- [ ] Aparece en el listado tras crear

---

### DEMY-45

**Editar materia existente**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-45
- **Rol:** ADMIN
- **Objetivo:** Verificar la edición de una materia existente mediante PATCH.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Editar la materia institucional de DEMY-44, no el código global MATEMATICA.

#### Flujo de prueba

- [ ] Tener al menos una materia creada.
- [ ] Iniciar sesión como ADMIN.
- [ ] Abrir edición de la materia.
- [ ] Modificar nombre o descripción.
- [ ] Guardar (PATCH) y verificar cambios.

#### Criterios de aceptación

- [ ] Se puede editar materia existente
- [ ] PATCH actualiza los campos modificados
- [ ] Los cambios se reflejan en el listado
- [ ] TEACHER no puede editar materias

---

### DEMY-46

**Listar asignaciones docentes**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-46
- **Rol:** ADMIN
- **Objetivo:** Verificar el listado de asignaciones docentes en `/teacher-assignments`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Filas seed: Matemática en 8vo A (asignación de teacher.demo); Lengua y Literatura en 8vo B.

#### Flujo de prueba

- [ ] Tener asignaciones docentes creadas.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/teacher-assignments`.
- [ ] Verificar el listado con profesor, materia y curso.
- [ ] Aplicar filtros si están disponibles.

#### Criterios de aceptación

- [ ] La ruta `/teacher-assignments` muestra el listado
- [ ] Cada asignación muestra profesor, materia y curso
- [ ] Se pueden filtrar por curso o profesor
- [ ] El listado refleja el período seleccionado

---

### DEMY-47

**Crear asignación docente**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-47
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de una asignación docente vinculando profesor, materia y curso.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Tener profesor, materia y curso configurados.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a creación de asignación docente.
- [ ] Seleccionar profesor, materia y curso.
- [ ] Guardar y verificar en el listado.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: teacher.demo + materia distinta de Matemática + 8vo A (período actual) + 2025-2026 Demo (ACTIVE).
- Fallo: repetir Matemática en 8vo A (asignación de teacher.demo).

**Pasos**

- [ ] Crear una asignación nueva.
- [ ] Repetir Matemática + 8vo A + 2025-2026 Demo.

**Resultado esperado**

- [ ] La nueva aparece.
- [ ] Combinación duplicada: error.

#### Criterios de aceptación

- [ ] Se puede crear asignación docente
- [ ] Se vincula profesor + materia + curso
- [ ] Se valida que no exista duplicado (mismo prof+materia+curso)
- [ ] Aparece en el listado tras crear

---

### DEMY-48

**Editar asignación docente**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-48
- **Rol:** ADMIN
- **Objetivo:** Verificar la edición de una asignación docente existente, cambiando docente o materia.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Partir de Matemática en 8vo A (asignación de teacher.demo) y cambiar a otra materia (sin duplicar Matemática + 8vo A).

#### Flujo de prueba

- [ ] Tener una asignación docente existente.
- [ ] Iniciar sesión como ADMIN.
- [ ] Abrir edición de la asignación.
- [ ] Cambiar el profesor asignado.
- [ ] Guardar y verificar.
- [ ] Repetir cambiando la materia.

#### Criterios de aceptación

- [ ] Se puede cambiar el docente de una asignación
- [ ] Se puede cambiar la materia de una asignación
- [ ] Los cambios se reflejan en el listado
- [ ] Se validan conflictos al editar

---

## DEMY-9 · Estudiantes

### DEMY-49

**Listar estudiantes**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-49
- **Rol:** ADMIN, TEACHER
- **Objetivo:** Verificar el listado de estudiantes en `/students` para roles ADMIN y TEACHER.

#### Datos de éxito

- ADMIN admin.demo@zerocademy.edu / DemoAdmin123! ve Ana, Luis y student3–8.
- TEACHER teacher.demo@zerocademy.edu / DemoTeacher123! solo sus cursos.

#### Flujo de prueba

- [ ] Tener estudiantes registrados.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/students`.
- [ ] Verificar el listado.
- [ ] Repetir con rol TEACHER.

#### Criterios de aceptación

- [ ] La ruta `/students` muestra el listado
- [ ] ADMIN puede ver todos los estudiantes
- [ ] TEACHER puede ver estudiantes de sus cursos
- [ ] Se muestra nombre, matrícula y estado

---

### DEMY-50

**Crear estudiante individual**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-50
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de un estudiante individual en `/students/new` con matrícula opcional.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/students/new`.
- [ ] Completar datos del estudiante (nombre, email, etc.).
- [ ] Opcionalmente ingresar número de matrícula.
- [ ] Guardar y verificar en el listado.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: qa.alumno@zerocademy.edu · StudentNew123! · Pedro QA · cédula 1790000201 · 2012-04-04 · MALE.
- Fallo: email student1.demo@zerocademy.edu o cédula 1710000001.

**Pasos**

- [ ] Crear a Pedro QA.
- [ ] Intentar email o cédula de Ana.

**Resultado esperado**

- [ ] Pedro aparece y puede iniciar sesión.
- [ ] Duplicado: error en español.

#### Criterios de aceptación

- [ ] Se puede crear estudiante en `/students/new`
- [ ] La matrícula es opcional
- [ ] Se validan campos obligatorios
- [ ] El estudiante aparece en el listado
- [ ] Se genera matrícula automática si no se proporciona

---

### DEMY-51

**Editar datos de estudiante**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-51
- **Rol:** ADMIN
- **Objetivo:** Verificar la edición del perfil de un estudiante existente mediante PATCH.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Editar teléfono/dirección de Ana Demo; no reutilizar cédula 1710000001 en otro alumno.

#### Flujo de prueba

- [ ] Tener un estudiante registrado.
- [ ] Iniciar sesión como ADMIN.
- [ ] Abrir perfil/edición del estudiante.
- [ ] Modificar nombre, email u otros datos.
- [ ] Guardar (PATCH) y verificar cambios.

#### Criterios de aceptación

- [ ] Se puede editar perfil de estudiante
- [ ] PATCH actualiza los campos modificados
- [ ] Los cambios se reflejan en el listado y detalle
- [ ] Se validan formatos de email y campos obligatorios

---

### DEMY-52

**Activar y desactivar estudiante**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-52
- **Rol:** ADMIN
- **Objetivo:** Verificar los endpoints activate/deactivate para cambiar el estado de un estudiante.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Tener un estudiante activo.
- [ ] Iniciar sesión como ADMIN.
- [ ] Desactivar el estudiante mediante endpoint deactivate.
- [ ] Verificar que el estado cambia a inactivo.
- [ ] Reactivar mediante endpoint activate.
- [ ] Verificar que vuelve a estado activo.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Estudiante: Pedro QA (DEMY-50) o Luis Demo.

**Pasos**

- [ ] Desactivar al estudiante.
- [ ] Intentar login con su clave.
- [ ] Reactivar e iniciar sesión.

**Resultado esperado**

- [ ] Inactivo: no entra (mensaje en español).
- [ ] Tras activate, el login funciona.

#### Criterios de aceptación

- [ ] Endpoint deactivate desactiva al estudiante
- [ ] Endpoint activate reactiva al estudiante
- [ ] El estado se refleja en la UI
- [ ] Estudiante inactivo no puede acceder al sistema

---

### DEMY-53

**Importación masiva CSV exitosa**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-53
- **Rol:** ADMIN
- **Objetivo:** Verificar la importación masiva de estudiantes vía CSV en `/students/bulk-import` con filas válidas.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Curso destino: 8vo B · período 2025-2026 Demo
- CSV éxito (10 campos, cierra con ;):
- qa.ok1@zerocademy.edu,Password123,Mario,Prueba,1790000101,2012-02-01,MALE,,,;
- qa.ok2@zerocademy.edu,Password123,Nora,Prueba,1790000102,2012-06-10,FEMALE,,,;
- Errores de CSV: DEMY-54.

#### Flujo de prueba

- [ ] Preparar archivo CSV con filas válidas de estudiantes.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/students/bulk-import`.
- [ ] Subir el archivo CSV.
- [ ] Ejecutar importación.
- [ ] Verificar resumen de éxito y estudiantes creados.

#### Criterios de aceptación

- [ ] Se puede subir CSV en `/students/bulk-import`
- [ ] Filas válidas se importan correctamente
- [ ] Se muestra resumen con cantidad importada
- [ ] Los estudiantes aparecen en el listado

---

### DEMY-54

**Validación errores importación CSV**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-54
- **Rol:** ADMIN
- **Objetivo:** Verificar que la importación CSV muestra errores de validación para filas inválidas en el resumen.

#### Datos de éxito

- Camino feliz de CSV: DEMY-53.

#### Flujo de éxito

- [ ] Preparar CSV con filas válidas e inválidas (email mal formado, campos vacíos, duplicados).
- [ ] Iniciar sesión como ADMIN.
- [ ] Subir CSV en `/students/bulk-import`.
- [ ] Ejecutar importación.
- [ ] Verificar resumen con filas válidas importadas y errores detallados.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 8vo B · 2025-2026 Demo (ACTIVE)
- student1.demo@zerocademy.edu,Password123,Ana,Demo,1710000001,2012-03-15,FEMALE,,,;
- malformado@zerocademy.edu,123,SoloTresCampos;
- qa.dup@zerocademy.edu,Password123,A,B,1790000301,2012-01-01,MALE,,,; (dos veces en el archivo)

**Pasos**

- [ ] Subir el CSV inválido en /students/bulk-import.
- [ ] Revisar failedCount y errors por fila.

**Resultado esperado**

- [ ] Filas malformadas y duplicados no se importan.
- [ ] Mensajes por fila en español.
- [ ] No se crean usuarios a medias.

#### Criterios de aceptación

- [ ] Filas inválidas no se importan
- [ ] El resumen lista errores por fila
- [ ] Se indica número de fila con error
- [ ] Filas válidas se importan aunque haya errores en otras
- [ ] Mensajes de error son claros y en español

---

### DEMY-55

**Ver historial de matrículas del estudiante**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-55
- **Rol:** ADMIN, TEACHER
- **Objetivo:** Verificar la vista de historial de matrículas de un estudiante en `/students/[id]/enrollments`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Ana Demo: ACTIVE en 8vo A / 2025-2026 Demo. Gabriela (student7): COMPLETED histórico.

#### Flujo de prueba

- [ ] Tener estudiante con matrículas en varios períodos.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/students/[id]/enrollments`.
- [ ] Verificar historial con período, curso y estado.
- [ ] Repetir con rol TEACHER.

#### Criterios de aceptación

- [ ] La ruta `/students/[id]/enrollments` muestra historial
- [ ] Se listan todas las matrículas del estudiante
- [ ] Cada matrícula muestra período, curso y estado
- [ ] ADMIN y TEACHER pueden consultar el historial

---

## DEMY-10 · Matrículas

### DEMY-56

**Listar matrículas**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-56
- **Rol:** ADMIN
- **Objetivo:** Verificar el listado de matrículas en `/enrollments`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- ACTIVE: Ana, Luis, Diego, Elena. WITHDRAWN: Carla. TRANSFERRED: Fabio. COMPLETED: Gabriela. FAILED: Héctor.

#### Flujo de prueba

- [ ] Tener matrículas creadas en el período activo.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/enrollments`.
- [ ] Verificar listado con estudiante, curso y estado.
- [ ] Aplicar filtros si están disponibles.

#### Criterios de aceptación

- [ ] La ruta `/enrollments` muestra el listado
- [ ] Cada matrícula muestra estudiante, curso y estado
- [ ] El listado refleja el período seleccionado
- [ ] Se pueden filtrar por curso o estado

---

### DEMY-57

**Crear matrícula individual**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-57
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de una matrícula individual en `/enrollments/new`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 2025-2026 Demo (ACTIVE)

#### Flujo de éxito

- [ ] Tener estudiante y curso disponibles.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/enrollments/new`.
- [ ] Seleccionar estudiante y curso.
- [ ] Guardar matrícula.
- [ ] Verificar en el listado.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 2025-2026 Demo (ACTIVE)
- Éxito: Pedro QA o qa.ok1 en 8vo A.
- Fallo: Ana Demo otra vez en 8vo A / 2025-2026 Demo.

**Pasos**

- [ ] Matricular un estudiante sin fila en ese curso+período.
- [ ] Intentar matricular a Ana en 8vo A actual.

**Resultado esperado**

- [ ] La nueva queda ACTIVE.
- [ ] Duplicado: error, o Ana no aparece en el selector (DEMY-58).

#### Criterios de aceptación

- [ ] Se puede crear matrícula en `/enrollments/new`
- [ ] Se vincula estudiante + curso + período
- [ ] La matrícula queda en estado ACTIVE
- [ ] Aparece en el listado tras crear

---

### DEMY-58

**Excluir estudiantes ya matriculados en período**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-58
- **Rol:** ADMIN
- **Objetivo:** Verificar que el selector de estudiantes excluye a quienes ya tienen matrícula ACTIVE en el período actual.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 2025-2026 Demo (ACTIVE) · 8vo A (período actual)

#### Flujo de éxito

- [ ] Tener estudiante con matrícula ACTIVE en el período.
- [ ] Iniciar sesión como ADMIN.
- [ ] Abrir formulario de nueva matrícula.
- [ ] Abrir selector de estudiantes.
- [ ] Verificar que el estudiante ya matriculado no aparece.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 2025-2026 Demo (ACTIVE) · 8vo A (período actual)
- No debe aparecer: Ana Demo, Luis Demo (ACTIVE).
- Sí puede aparecer: Carla Retirada (WITHDRAWN).

**Pasos**

- [ ] Abrir /enrollments/new para 8vo A / 2025-2026 Demo.
- [ ] Buscar Ana y Carla en el selector.

**Resultado esperado**

- [ ] Ana no está en el selector.
- [ ] Carla sí puede aparecer.
- [ ] Al cambiar a 2024-2025 Demo el conjunto cambia.

#### Criterios de aceptación

- [ ] Estudiantes con matrícula ACTIVE en el período no aparecen en el selector
- [ ] Estudiantes sin matrícula sí aparecen
- [ ] Estudiantes con matrícula WITHDRAWN/COMPLETED sí aparecen
- [ ] El filtro se actualiza al cambiar período

---

### DEMY-59

**Matrícula masiva de estudiantes**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-59
- **Rol:** ADMIN
- **Objetivo:** Verificar la matrícula masiva de estudiantes en `/enrollments/bulk`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Matricular qa.ok1/qa.ok2 (DEMY-53) en 8vo A. No incluir a Ana (ya ACTIVE).

#### Flujo de prueba

- [ ] Tener múltiples estudiantes sin matrícula y un curso disponible.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/enrollments/bulk`.
- [ ] Seleccionar curso y estudiantes.
- [ ] Ejecutar matrícula masiva.
- [ ] Verificar resumen y matrículas creadas.

#### Criterios de aceptación

- [ ] Se puede matricular múltiples estudiantes a la vez
- [ ] Todas las matrículas quedan en estado ACTIVE
- [ ] Se muestra resumen de operación
- [ ] Se valida capacidad del curso

---

### DEMY-60

**Editar estado de matrícula**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-60
- **Rol:** ADMIN
- **Objetivo:** Verificar la edición del estado de una matrícula (WITHDRAWN, COMPLETED, etc.).

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Carla Retirada (student3, WITHDRAWN en 8vo A) → ACTIVE, luego COMPLETED.

#### Flujo de prueba

- [ ] Tener matrícula en estado ACTIVE.
- [ ] Iniciar sesión como ADMIN.
- [ ] Abrir edición de la matrícula.
- [ ] Cambiar estado a WITHDRAWN.
- [ ] Guardar y verificar.
- [ ] Repetir cambiando a COMPLETED.

#### Criterios de aceptación

- [ ] Se puede cambiar estado de matrícula
- [ ] Estados disponibles: WITHDRAWN, COMPLETED, etc.
- [ ] El cambio se refleja en el listado
- [ ] Se registra fecha de cambio de estado

---

### DEMY-61

**Consultar mis matrículas (estudiante)**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-61
- **Rol:** STUDENT
- **Objetivo:** Verificar que un estudiante puede consultar sus propias matrículas en `/my-enrollments`.

#### Datos de éxito

- Éxito: student1.demo@zerocademy.edu / DemoStudent123! (Ana Demo, cédula 1710000001) ve su ACTIVE en 8vo A.

#### Flujo de éxito

- [ ] Tener estudiante con matrículas en el período activo.
- [ ] Iniciar sesión como STUDENT.
- [ ] Navegar a `/my-enrollments`.
- [ ] Verificar listado de matrículas propias.
- [ ] Confirmar que solo ve sus matrículas, no las de otros.

#### Caso de fallo

**Datos**

- Éxito: student1.demo@zerocademy.edu / DemoStudent123! (Ana Demo, cédula 1710000001) ve su ACTIVE en 8vo A.
- Fallo de alcance: no debe ver a student2.demo@zerocademy.edu / DemoStudent123! (Luis Demo).

**Pasos**

- [ ] Entrar como Ana a Mis matrículas.
- [ ] Confirmar que Luis no aparece; si hay id ajeno, abrirlo por URL.

**Resultado esperado**

- [ ] Ana solo ve sus filas.
- [ ] Id ajeno: 403 o vacío.

#### Criterios de aceptación

- [ ] La ruta `/my-enrollments` muestra matrículas del estudiante
- [ ] Solo se muestran matrículas propias
- [ ] Cada matrícula muestra curso, período y estado
- [ ] No se puede acceder a matrículas de otros estudiantes

---

## DEMY-11 · Evaluación académica

### DEMY-62

**Dashboard de evaluación académica**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-62
- **Rol:** ADMIN
- **Objetivo:** Verificar el dashboard de evaluación académica en `/academic-evaluation` con vista previa de la configuración.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Escuela Demo Calificaciones (código demo-grades) ya tiene esquema, términos y categorías Ecuador.

#### Flujo de prueba

- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/academic-evaluation`.
- [ ] Verificar que se muestra el dashboard con resumen de configuración.
- [ ] Confirmar enlaces a secciones de configuración.

#### Criterios de aceptación

- [ ] La ruta `/academic-evaluation` muestra el dashboard
- [ ] Se muestra preview de la configuración actual
- [ ] Hay acceso a esquemas, términos y categorías
- [ ] Se indica si la configuración está completa o incompleta

---

### DEMY-63

**Inicializar plantilla Ecuador en institución**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-63
- **Rol:** ADMIN
- **Objetivo:** Verificar el botón de inicialización con valores por defecto del régimen educativo de Ecuador.

#### Datos de éxito

- Éxito: institución nueva (código qa-eval-init), no Escuela Demo Calificaciones (código demo-grades) (ya inicializada).

#### Flujo de prueba

- [ ] Tener institución sin configuración de evaluación.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar al dashboard de evaluación académica.
- [ ] Pulsar botón "Inicializar plantilla Ecuador".
- [ ] Verificar que se crean esquema, términos y categorías por defecto.

#### Criterios de aceptación

- [ ] Existe botón de init Ecuador defaults
- [ ] Se crea esquema de calificación 0-10
- [ ] Se crean términos de evaluación con pesos estándar
- [ ] Se crean categorías Evaluación formativa (70%) y Evaluación sumativa (30%) para EGB Media, Superior y Bachillerato, según el Instructivo de Evaluación Estudiantil 2025.
- [ ] La configuración queda lista para usar

---

### DEMY-64

**Crear esquema de calificación**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-64
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de un esquema de calificación en `/grading-schemes` con escala 0-10.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/grading-schemes`.
- [ ] Crear nuevo esquema de calificación.
- [ ] Definir escala numérica 0-10.
- [ ] Guardar y verificar en el listado.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: Esquema QA · min 0 · max 10 · aprobación 7.
- Fallo: min 10 y max 1.

**Pasos**

- [ ] Crear esquema 0-10.
- [ ] Intentar min > max.

**Resultado esperado**

- [ ] El esquema 0-10 aparece.
- [ ] min ≥ max: error en español.

#### Criterios de aceptación

- [ ] Se puede crear esquema en `/grading-schemes`
- [ ] Se define escala 0-10
- [ ] El esquema queda asociado a la institución
- [ ] Aparece en el listado tras crear

---

### DEMY-65

**Gestionar escalas cualitativas (bandas)**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-65
- **Rol:** ADMIN
- **Objetivo:** Verificar la gestión de bandas cualitativas DAR/AAR/PAAR/NAAR sin solapamiento de rangos.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · esquema 0-10

#### Flujo de éxito

- [ ] Tener esquema de calificación creado.
- [ ] Configurar bandas DAR, AAR, PAAR y NAAR con rangos numéricos.
- [ ] Intentar crear bandas con rangos solapados.
- [ ] Verificar que se rechaza el solapamiento.
- [ ] Guardar configuración válida.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · esquema 0-10
- Éxito: DAR 9-10 · AAR 7-8.99 · PAAR 5-6.99 · NAAR 0-4.99.
- Fallo: DAR 8-10 y AAR 7-9 (solape).

**Pasos**

- [ ] Guardar bandas sin solape.
- [ ] Intentar AAR 7-9 junto a DAR 8-10.

**Resultado esperado**

- [ ] Bandas válidas se guardan.
- [ ] Solape: error claro.

#### Criterios de aceptación

- [ ] Se pueden definir bandas DAR/AAR/PAAR/NAAR
- [ ] Cada banda tiene rango numérico (min-max)
- [ ] No se permiten rangos solapados
- [ ] Se muestra error claro al intentar solapar
- [ ] Las bandas cubren el rango completo del esquema

---

### DEMY-66

**Crear términos de evaluación con pesos**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-66
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de términos de evaluación con pesos en `/evaluation-terms`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: Q1 50% + Q2 50%. Suma distinta de 100%: DEMY-67.

#### Flujo de prueba

- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/evaluation-terms`.
- [ ] Crear término de evaluación (ej. Primer Quimestre).
- [ ] Asignar peso porcentual al término.
- [ ] Crear segundo término con peso complementario.
- [ ] Guardar y verificar en el listado.

#### Criterios de aceptación

- [ ] Se pueden crear términos en `/evaluation-terms`
- [ ] Cada término tiene nombre y peso
- [ ] Los términos aparecen en el listado
- [ ] Se puede editar peso de término existente

---

### DEMY-67

**Validar suma de pesos de términos = 100%**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-67
- **Rol:** ADMIN
- **Objetivo:** Verificar que el sistema valida que la suma de pesos de términos de evaluación sea exactamente 100%.

#### Datos de éxito

- Alta de términos 50/50: DEMY-66.

#### Flujo de éxito

- [ ] Crear términos con pesos que sumen menos de 100%.
- [ ] Intentar guardar configuración.
- [ ] Verificar mensaje de error.
- [ ] Ajustar pesos para sumar exactamente 100%.
- [ ] Verificar que se guarda correctamente.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123! · 2025-2026 Demo (ACTIVE)
- Fallo: Q1 40% + Q2 40%.
- Corrección: 50/50.

**Pasos**

- [ ] Poner 40 y 40 e intentar guardar.
- [ ] Corregir a 50/50.

**Resultado esperado**

- [ ] Suma 80: no guarda.
- [ ] Suma 100: barra en verde y se guarda.

#### Criterios de aceptación

- [ ] Se muestra error si la suma no es 100%
- [ ] El mensaje de error es claro y en español
- [ ] No se permite guardar con suma incorrecta
- [ ] Se guarda correctamente cuando suma = 100%

---

### DEMY-68

**Reordenar términos de evaluación**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-68
- **Rol:** ADMIN
- **Objetivo:** Verificar el reordenamiento de términos de evaluación mediante drag & drop o botones de reordenar.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Reordenar términos de 2025-2026 Demo y recargar.

#### Flujo de prueba

- [ ] Tener al menos 3 términos de evaluación creados.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/evaluation-terms`.
- [ ] Reordenar términos arrastrando o con botones up/down.
- [ ] Guardar y verificar nuevo orden.
- [ ] Recargar página y confirmar persistencia.

#### Criterios de aceptación

- [ ] Se puede reordenar términos por drag o botones
- [ ] El nuevo orden se guarda correctamente
- [ ] El orden persiste tras recargar
- [ ] El orden se refleja en reportes y cálculos

---

### DEMY-69

**Crear categorías de evaluación**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-69
- **Rol:** ADMIN
- **Objetivo:** Verificar la creación de categorías de evaluación TAI/AGA/AEA en `/assessment-categories`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Éxito: TAI 30, AGA 40, AEA 30. Suma distinta de 100%: DEMY-70.

#### Flujo de prueba

- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/assessment-categories`.
- [ ] Crear categoría TAI (Trabajo Autónomo e Interactivo).
- [ ] Crear categoría AGA (Actividades Grupales de Aprendizaje).
- [ ] Crear categoría AEA (Actividades de Evaluación Académica).
- [ ] Asignar pesos a cada categoría.

#### Criterios de aceptación

- [ ] Se pueden crear categorías en `/assessment-categories`
- [ ] Se soportan tipos TAI, AGA y AEA
- [ ] Cada categoría tiene nombre, tipo y peso
- [ ] Las categorías aparecen en el listado

---

### DEMY-70

**Validar suma de pesos de categorías = 100%**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-70
- **Rol:** ADMIN
- **Objetivo:** Verificar que la barra de progreso de peso valida que la suma de categorías sea 100%.

#### Datos de éxito

- Alta de categorías 30/40/30: DEMY-69.

#### Flujo de éxito

- [ ] Crear categorías con pesos que no sumen 100%.
- [ ] Observar la barra de progreso de peso.
- [ ] Verificar indicador visual de suma incorrecta.
- [ ] Ajustar pesos hasta sumar 100%.
- [ ] Verificar que la barra muestra 100% en verde.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Fallo: TAI 20 + AGA 20 + AEA 20.
- Corrección: 30/40/30.

**Pasos**

- [ ] Dejar suma 60 e intentar guardar.
- [ ] Ajustar a 100%.

**Resultado esperado**

- [ ] Suma ≠ 100: no se guarda.
- [ ] Suma 100: se guarda.

#### Criterios de aceptación

- [ ] Existe barra de progreso de peso de categorías
- [ ] Muestra suma actual en tiempo real
- [ ] Indica visualmente cuando no suma 100%
- [ ] Se muestra en verde cuando suma = 100%
- [ ] No se permite guardar con suma incorrecta

---

### DEMY-71

**Configuración activa de institución**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-71
- **Rol:** ADMIN
- **Objetivo:** Verificar la configuración activa de evaluación de la institución en `/configuration` (esquema y redondeo).

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Escuela Demo Calificaciones (código demo-grades) ya tiene configuración activa con esquema 0-10.

#### Flujo de prueba

- [ ] Tener esquema de calificación y términos configurados.
- [ ] Iniciar sesión como ADMIN.
- [ ] Navegar a `/configuration`.
- [ ] Seleccionar esquema de calificación activo.
- [ ] Configurar reglas de redondeo.
- [ ] Guardar y verificar configuración activa.

#### Criterios de aceptación

- [ ] La ruta `/configuration` muestra opciones de configuración
- [ ] Se puede seleccionar esquema de calificación activo
- [ ] Se pueden configurar reglas de redondeo
- [ ] La configuración se guarda y persiste
- [ ] La configuración activa se usa en cálculos de notas

---

### DEMY-72

**Configuración plataforma Ecuador (SUPER_ADMIN)**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-72
- **Rol:** SUPER_ADMIN
- **Objetivo:** Verificar la configuración de evaluación a nivel plataforma para Ecuador en `/academic-evaluation/platform`.

#### Datos de éxito

- Éxito: admin@zerocademy.edu / ChangeMe123! en defaults de plataforma.

#### Flujo de éxito

- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Navegar a `/academic-evaluation/platform`.
- [ ] Verificar plantillas y defaults de plataforma para Ecuador.
- [ ] Modificar configuración de plataforma si aplica.
- [ ] Verificar que instituciones pueden heredar estos defaults.

#### Caso de fallo

**Datos**

- Éxito: admin@zerocademy.edu / ChangeMe123! en defaults de plataforma.
- Fallo: admin.demo@zerocademy.edu / DemoAdmin123! en la misma URL de plataforma.

**Pasos**

- [ ] Como SUPER_ADMIN ver defaults de plataforma.
- [ ] Como ADMIN abrir la misma ruta.

**Resultado esperado**

- [ ] SUPER_ADMIN ve alcance plataforma.
- [ ] ADMIN no edita defaults globales.

#### Criterios de aceptación

- [ ] SUPER_ADMIN puede acceder a `/academic-evaluation/platform`
- [ ] Se muestran defaults del régimen Ecuador
- [ ] ADMIN no puede acceder a esta ruta
- [ ] Los cambios de plataforma afectan plantillas de init
- [ ] Se distingue configuración plataforma vs institución

---

## DEMY-12 · UX general y mensajes

### DEMY-73

**Mensajes de error de API en español**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-73
- **Rol:** ADMIN
- **Objetivo:** Verificar que los mensajes de error de la API se muestran en español en los formularios mediante `localize-api-message`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!

#### Flujo de éxito

- [ ] Abrir un formulario de creación (ej. estudiante, materia).
- [ ] Provocar un error de validación del backend (email duplicado, campo inválido).
- [ ] Verificar que el mensaje de error aparece en español.
- [ ] Repetir en al menos 3 formularios diferentes.

#### Caso de fallo

**Datos**

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- /students/new con email student1.demo@zerocademy.edu
- Materia con código MATEMATICA
- Login con ClaveMala999!

**Pasos**

- [ ] Provoca duplicado de estudiante.
- [ ] Provoca código de materia duplicado.
- [ ] Provoca 401 en login.

**Resultado esperado**

- [ ] Los tres muestran texto en español, no inglés técnico.

#### Criterios de aceptación

- [ ] Los errores de API se muestran en español
- [ ] Se usa utilidad localize-api-message
- [ ] Los mensajes son comprensibles para el usuario
- [ ] Funciona en formularios de creación y edición
- [ ] No se muestran mensajes técnicos en inglés

---

### DEMY-74

**Selectores con búsqueda en formularios**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-74
- **Rol:** ADMIN
- **Objetivo:** Verificar que los selectores en formularios soportan búsqueda mediante `select-utils`.

#### Datos de éxito

- Usuario: admin.demo@zerocademy.edu / DemoAdmin123!
- Buscar Mate en materia, Ana en estudiante, 8vo en curso.

#### Flujo de prueba

- [ ] Abrir formulario con selector de muchas opciones (ej. estudiante, profesor, curso).
- [ ] Escribir texto en el campo de búsqueda del selector.
- [ ] Verificar que las opciones se filtran en tiempo real.
- [ ] Seleccionar una opción filtrada.
- [ ] Repetir en al menos 3 formularios.

#### Criterios de aceptación

- [ ] Los selectores permiten búsqueda por texto
- [ ] El filtrado es en tiempo real
- [ ] Se usa utilidad select-utils
- [ ] Funciona con listas largas de opciones
- [ ] La selección se mantiene tras buscar

---

### DEMY-75

**Selector de alcance institucional en evaluación**

- **Estado Jira:** En pruebas
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-75
- **Rol:** SUPER_ADMIN, ADMIN
- **Objetivo:** Verificar el componente `institution-scope-selector` en las pantallas de evaluación académica.

#### Datos de éxito

- SUPER_ADMIN admin@zerocademy.edu / ChangeMe123!: plataforma vs Escuela Demo Calificaciones (código demo-grades).

#### Flujo de éxito

- [ ] Iniciar sesión como SUPER_ADMIN.
- [ ] Navegar a pantalla de evaluación académica.
- [ ] Verificar selector de alcance institucional.
- [ ] Cambiar entre alcance de plataforma e institución.
- [ ] Verificar que la configuración mostrada cambia según el alcance.
- [ ] Repetir con rol ADMIN (solo alcance institución).

#### Caso de fallo

**Datos**

- SUPER_ADMIN admin@zerocademy.edu / ChangeMe123!: plataforma vs Escuela Demo Calificaciones (código demo-grades).
- ADMIN admin.demo@zerocademy.edu / DemoAdmin123!: solo Escuela Demo Calificaciones (código demo-grades).

**Pasos**

- [ ] Como SUPER_ADMIN cambiar alcance.
- [ ] Como ADMIN abrir evaluación.

**Resultado esperado**

- [ ] SUPER_ADMIN ve plataforma e institución.
- [ ] ADMIN no selecciona otra institución.

#### Criterios de aceptación

- [ ] Existe componente institution-scope-selector
- [ ] SUPER_ADMIN puede ver alcance plataforma e institución
- [ ] ADMIN solo ve alcance de su institución
- [ ] Al cambiar alcance se actualiza la configuración mostrada
- [ ] El selector es visible en pantallas de evaluación

---

## DEMY-76 · Calificaciones y notas

### DEMY-77

**Módulo Grades fase 1 — evaluaciones, registro y gestión de notas**

- **Estado Jira:** Listo
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-77
- **Rol:** TEACHER (escritura), STUDENT (solo sus notas), ADMIN/SUPER_ADMIN (lectura).
- **Objetivo:** Verificar evaluaciones, ingreso de notas y RBAC de Grades fase 1 sobre la institución demo-grades.

#### Datos de éxito

- Docente: teacher.demo@zerocademy.edu / DemoTeacher123! · Matemática en 8vo A (asignación de teacher.demo) · 2025-2026 Demo (ACTIVE)

#### Flujo de éxito

- [ ] Iniciar sesión como teacher.demo@zerocademy.edu.
- [ ] Ir a /grades/assessments/new y crear una evaluación en Matemática 8vo A.
- [ ] Abrir /grades/entry y guardar notas en lote para matrículas ACTIVE.
- [ ] Intentar una nota mayor al maxScore o con más decimales de los permitidos.
- [ ] Iniciar como student1.demo@zerocademy.edu y abrir /grades.
- [ ] Iniciar como admin.demo@zerocademy.edu y confirmar lectura sin mutación.

#### Caso de fallo

**Datos**

- Docente: teacher.demo@zerocademy.edu / DemoTeacher123! · Matemática en 8vo A (asignación de teacher.demo) · 2025-2026 Demo (ACTIVE)
- Éxito: Quiz QA · maxScore 10 · Ana 8.5 · Luis 7.0.
- Fallo: nota 11, o 8.555 si hay 2 decimales, o calificar a Carla (WITHDRAWN).
- Lectura: student1.demo@zerocademy.edu / DemoStudent123! (Ana Demo, cédula 1710000001) en /grades · admin.demo@zerocademy.edu / DemoAdmin123! solo lectura.

**Pasos**

- [ ] Crear Quiz QA y guardar 8.5 / 7.0.
- [ ] Intentar 11 o demasiados decimales.
- [ ] Entrar como Ana y como admin.demo.

**Resultado esperado**

- [ ] Notas válidas se guardan; hoja solo ACTIVE.
- [ ] Fuera de rango: error en español.
- [ ] Ana solo ve sus notas; ADMIN no muta.

#### Criterios de aceptación

- [ ] CRUD de evaluaciones valida asignación docente y esquema de calificación.
- [ ] Notas individuales y bulk upsert funcionan; unicidad (assessmentId, enrollmentId).
- [ ] La hoja de ingreso lista solo matrículas ACTIVE.
- [ ] TEACHER escribe solo en asignaciones propias; STUDENT ve solo sus notas; ADMIN es lectura.
- [ ] Límites del esquema, decimales y maxScore se rechazan con error en español.
- [ ] Rutas /grades, /grades/assessments y /grades/entry cargan para el rol correcto.

---

### DEMY-78

**Motor de cálculo de notas — Academic Performance (fase 2)**

- **Estado Jira:** Listo
- **Ticket:** https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-78
- **Rol:** STUDENT, TEACHER y ADMIN sobre demo-grades, con notas ya cargadas (DEMY-77).
- **Objetivo:** Verificar el motor de cálculo dinámico de promedios y las vistas de rendimiento por rol.

#### Datos de éxito

- Precondición: notas demo o las de DEMY-77.

#### Flujo de éxito

- [ ] Como student1.demo abrir Rendimiento (/academic-performance) y anotar un promedio.
- [ ] Como teacher.demo revisar promedios de 8vo A.
- [ ] Como admin.demo abrir rendimiento institucional.
- [ ] Como docente cambiar una nota y recargar rendimiento.
- [ ] Confirmar que STUDENT no accede a endpoints de curso/institución.

#### Caso de fallo

**Datos**

- Precondición: notas demo o las de DEMY-77.
- STUDENT: student1.demo@zerocademy.edu / DemoStudent123! (Ana Demo, cédula 1710000001)
- TEACHER: teacher.demo@zerocademy.edu / DemoTeacher123! en 8vo A Matemática.
- ADMIN: admin.demo@zerocademy.edu / DemoAdmin123!

**Pasos**

- [ ] Como Ana anotar promedio de Matemática.
- [ ] Como docente cambiar 8.5 → 9.0 y recargar rendimiento.
- [ ] Como Ana abrir URL de rendimiento de curso/institución.

**Resultado esperado**

- [ ] El promedio cambia (cálculo dinámico).
- [ ] STUDENT recibe 403 en curso/institución.
- [ ] TEACHER no ve cursos no asignados.

#### Criterios de aceptación

- [ ] Jerarquía visible: nota → promedio de categoría → trimestre → materia.
- [ ] Pesos salen de AssessmentCategory y EvaluationTerm.
- [ ] Estudiante: consultas acotadas a sus matrículas.
- [ ] Docente: solo asignaciones propias.
- [ ] Admin: rendimiento de su institución.
- [ ] Al cambiar una nota, los promedios se actualizan sin persistir tablas de promedio.
- [ ] UI en español, sidebar Rendimiento.

---

## Notas

- Fuente: descripciones Jira DEMY-13…DEMY-75 + planes de regresión DEMY-77/78.
- Datos de seed: `docs/seeds.md` y `BackendZerocademy/prisma/seeds/grades-demo.data.ts`.
- Menú por rol (DEMY-20): único ítem común = **Resumen**; ver listas en esa tarea.
- Omitido: DEMY-1 (`_probe_transitions`), no es función de producto.
