# Auditoria de criterios de aceptacion DEMY

Fecha: 2026-09-18. Fuente: Jira consultado en esta fecha; 65 funciones (DEMY-13 a DEMY-75, DEMY-77 y DEMY-78). Se excluyen epicas y la tarea tecnica DEMY-1 sin criterios funcionales.

## Alcance y limites

Revision estatica dirigida y ejecucion de las pruebas disponibles. No es una certificacion E2E de todas las tareas. La marca [x] en Jira no constituye una prueba ejecutada durante esta auditoria. No se modificaron estados, descripciones ni checklists de Jira. No se cambiaron funcionalidades para revertir decisiones posteriores del usuario.

- Backend: 7 suites y 27 pruebas unitarias pasaron.
- Compilacion NestJS: paso.
- TypeScript frontend: paso (no equivale al build completo Next.js).
- No se ejecutaron E2E ni pruebas visuales por rol: los E2E existentes invocan seeds sobre la base configurada. Se requiere una base aislada, no produccion.
- Ninguna tarea se declara plenamente certificada por esta revision. Los hallazgos estaticos demuestran incumplimientos concretos; las restantes requieren revision detallada y ejecucion por criterio.

## Hallazgos prioritarios

1. DEMY-75: aislamiento institucional ausente en endpoints de evaluacion.
2. DEMY-66/67/69/70: escritura previa a validacion de pesos sin rollback.
3. DEMY-63: inicializacion puede terminar sin crear terminos.
4. DEMY-74: no hay busqueda de texto en selectores compartidos.
5. DEMY-31/32/48: criterios contradicen cambios posteriores solicitados; actualizar requisitos antes de juzgar cumplimiento.

## Matriz completa

| Tarea | Estado Jira | Resultado auditoria |
|---|---|---|
| [DEMY-13](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-13) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-14](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-14) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-15](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-15) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-16](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-16) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-17](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-17) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-18](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-18) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-19](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-19) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-20](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-20) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-21](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-21) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-22](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-22) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-23](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-23) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-24](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-24) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-25](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-25) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-26](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-26) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-27](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-27) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-28](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-28) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-29](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-29) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-30](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-30) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-31](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-31) | Listo | Requisito desactualizado |
| [DEMY-32](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-32) | Listo | Requisito desactualizado |
| [DEMY-33](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-33) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-34](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-34) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-35](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-35) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-36](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-36) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-37](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-37) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-38](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-38) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-39](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-39) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-40](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-40) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-41](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-41) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-42](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-42) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-43](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-43) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-44](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-44) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-45](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-45) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-46](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-46) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-47](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-47) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-48](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-48) | Listo | Requisito desactualizado |
| [DEMY-49](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-49) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-50](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-50) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-51](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-51) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-52](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-52) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-53](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-53) | Listo | Parcial |
| [DEMY-54](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-54) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-55](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-55) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-56](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-56) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-57](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-57) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-58](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-58) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-59](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-59) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-60](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-60) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-61](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-61) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-62](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-62) | Listo | Parcial |
| [DEMY-63](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-63) | En curso | Parcial |
| [DEMY-64](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-64) | En pruebas | Pendiente de verificacion exhaustiva |
| [DEMY-65](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-65) | En pruebas | Parcial |
| [DEMY-66](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-66) | En pruebas | Incumplimiento estático |
| [DEMY-67](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-67) | En pruebas | Incumplimiento estático |
| [DEMY-68](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-68) | En pruebas | Pendiente de verificacion exhaustiva |
| [DEMY-69](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-69) | En pruebas | Incumplimiento estático |
| [DEMY-70](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-70) | En pruebas | Incumplimiento estático |
| [DEMY-71](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-71) | En pruebas | Pendiente de verificacion exhaustiva |
| [DEMY-72](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-72) | En pruebas | Pendiente de verificacion exhaustiva |
| [DEMY-73](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-73) | En pruebas | Parcial |
| [DEMY-74](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-74) | En pruebas | Incumplimiento estático |
| [DEMY-75](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-75) | En pruebas | Incumplimiento estático crítico |
| [DEMY-77](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-77) | Listo | Pendiente de verificacion exhaustiva |
| [DEMY-78](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-78) | Listo | Pendiente de verificacion exhaustiva |

## Criterios por tarea

### DEMY-13: Login exitoso con credenciales válidas

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El login redirige al dashboard sin errores.
- [x] El nombre/rol del usuario aparece en la interfaz.
- [x] Las peticiones subsiguientes incluyen token Bearer (sin 401).
- [x] No se muestran mensajes de error en pantalla.

### DEMY-14: Rechazo de login con credenciales inválidas

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] La API responde 401 con mensaje genérico (no revela si el email existe).
- [x] El usuario permanece en la pantalla de login.
- [x] Se muestra mensaje de error en español en la UI.
- [x] No se guarda sesión ni token en el navegador.

### DEMY-15: Persistencia de sesión con refresh token

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] La app renueva el token vía `POST /v1/auth/refresh` sin intervención del usuario.
- [x] No aparece pantalla de login mientras el refresh token sea válido.
- [x] Las listas y formularios cargan datos correctamente tras la renovación.

### DEMY-16: Cerrar sesión (logout)

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Tras logout se redirige a `/login`.
- [x] `POST /v1/auth/logout` revoca el refresh token.
- [x] Rutas protegidas redirigen a login.
- [x] Un refresh con el token anterior falla con 401.

### DEMY-17: Mostrar/ocultar contraseña en formularios

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El campo alterna entre tipo `password` y `text`.
- [x] El icono cambia de estado (ojo abierto/cerrado).
- [x] El valor escrito no se pierde al alternar.
- [x] Funciona en login y al menos un formulario de creación.

### DEMY-18: Listar usuarios del sistema

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] La ruta `/users` es accesible para SUPER_ADMIN y ADMIN.
- [x] Se muestran usuarios del seed con nombre, correo, rol y estado correctos.
- [x] Buscar filtra por nombre o correo (sin distinguir mayúsculas; debounce \~500 ms).
- [x] El filtro Rol deja solo usuarios de ese rol.
- [x] El filtro Estado deja solo activos o inactivos.
- [x] La cabecera Rol ordena el directorio (y un segundo clic invierte).
- [x] La cabecera Estado ordena activos/inactivos (y un segundo clic invierte).
- [x] El orden se aplica a todo el listado, no solo a la página visible.
- [x] ADMIN no ve ni puede filtrar cuentas SUPER_ADMIN.
- [x] TEACHER/STUDENT no ven el ítem en el menú ni acceden a la ruta.
- [x] La lista carga sin error 403/401 para roles permitidos.

### DEMY-19: Crear usuario nuevo

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El usuario se crea y aparece en la lista.
- [x] Se puede localizar con Buscar y/o el filtro Rol.
- [x] Validaciones de email duplicado muestran «Este correo ya está registrado.»
- [x] El nuevo usuario puede iniciar sesión.
- [x] El menú lateral refleja el rol asignado.

### DEMY-20: Navegación lateral según rol

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El único ítem común a todos los roles es Resumen.
- [x] SUPER_ADMIN, ADMIN, TEACHER y STUDENT coinciden con las listas de Datos de éxito.
- [x] TEACHER no ve Instituciones ni Usuarios.
- [x] STUDENT no ve Cursos, Estudiantes, Matrículas (admin), Instituciones ni Usuarios.
- [x] Rutas no autorizadas: denegado o redirect, sin datos ajenos.

### DEMY-21: Listar instituciones educativas

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Se listan instituciones con nombre, código y estado.
- [x] El detalle muestra datos de contacto y régimen.
- [x] La paginación funciona si hay muchos registros.
- [x] Textos de la UI en español.

### DEMY-22: Crear institución educativa

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] La institución se crea correctamente.
- [x] Código duplicado muestra error claro en español.
- [x] Solo SUPER_ADMIN puede crear.
- [x] Aparece en el listado de instituciones.

### DEMY-23: Editar configuración de institución

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Los cambios persisten tras recargar.
- [x] Validación de consistencia región/régimen muestra error si aplica.
- [x] La API responde 200 al guardar.
- [x] Mensajes de éxito en español.

### DEMY-24: Subir logo de institución

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Imagen válida se sube correctamente.
- [x] Archivos mayores a 5 MB o formatos inválidos muestran error.
- [x] El logo se visualiza tras guardar.
- [x] La vista previa se actualiza correctamente.

### DEMY-25: Editar colores de branding institucional

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Colores válidos se guardan correctamente.
- [x] Formato inválido muestra validación en español.
- [x] Los cambios persisten al recargar.
- [x] La API responde correctamente al guardar.

### DEMY-26: Activar y desactivar institución

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] SUPER_ADMIN puede desactivar una institución activa.
- [x] SUPER_ADMIN puede reactivar una institución inactiva.
- [x] Las operaciones académicas están bloqueadas cuando la institución está inactiva.
- [x] Se muestra mensaje claro al usuario cuando la institución está inactiva.
- [x] El estado de la institución se refleja correctamente en la UI.

### DEMY-27: Listar períodos académicos

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] La ruta `/academic-periods` muestra el listado de períodos.
- [x] Filtro por régimen funciona correctamente.
- [x] Filtro por estado funciona correctamente.
- [x] Los filtros pueden combinarse.
- [x] Se muestra información relevante de cada período (nombre, fechas, estado).

### DEMY-28: Crear período académico con quimestres

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] SUPER_ADMIN puede acceder al formulario de creación.
- [x] Se pueden definir fechas del período académico.
- [x] Se pueden crear términos/quimestres con fechas.
- [x] El período se guarda correctamente.
- [x] Los términos quedan asociados al período creado.

### DEMY-29: Activar período académico

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El período seleccionado pasa a estado ACTIVE.
- [x] Otros períodos ACTIVE del mismo régimen pasan a CLOSED.
- [x] Solo un período ACTIVE por régimen a la vez.
- [x] La UI refleja los cambios de estado inmediatamente.

### DEMY-30: Desactivar período académico

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El período pasa a estado CLOSED al desactivarse.
- [x] No queda disponible como período activo.
- [x] Se confirma la acción antes de cerrar (si aplica).
- [x] El listado refleja el nuevo estado.

### DEMY-31: Selector de período en cabecera

Resultado: Requisito desactualizado.

Jira exige selector en cabecera. Por petición posterior del usuario, ahora se muestra un indicador fijo del periodo activo.

Evidencia: [archivo](../FrontendZerocademy/src/components/layout/academic-period-selector.tsx).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El selector de período aparece en la cabecera.
- [x] Muestra el nombre del período efectivo.
- [x] Es visible para ADMIN, TEACHER y STUDENT.
- [x] El período mostrado coincide con el contexto del usuario.

### DEMY-32: Cambiar período seleccionado por usuario

Resultado: Requisito desactualizado.

Jira exige cambiar y persistir la selección. El contexto general ahora usa siempre el activo, por petición del usuario.

Evidencia: [archivo](../BackendZerocademy/src/modules/academic-periods/academic-periods.service.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El usuario puede cambiar el período desde el selector.
- [x] Se envía PUT context/selection al cambiar.
- [x] La UI refleja el período seleccionado.
- [x] La selección persiste tras recargar.
- [x] Solo se muestran períodos disponibles para el usuario.

### DEMY-33: Ver período activo institucional

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Se muestra tarjeta con el período activo institucional.
- [x] La información del período es correcta.
- [x] La tarjeta es visible en la pantalla de transiciones.
- [x] Se distingue claramente del período destino.

### DEMY-34: Previsualizar transición de período

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] El preview muestra cantidad de cursos a copiar.
- [x] El preview muestra cantidad de asignaciones docentes a copiar.
- [x] Los conteos coinciden con los datos reales del período origen.
- [x] No se realizan cambios hasta confirmar la transición.

### DEMY-35: Ejecutar transición de año lectivo

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Los cursos del período origen se copian al destino.
- [x] Las asignaciones docentes se copian correctamente.
- [x] El período destino pasa a ACTIVE.
- [x] El período origen pasa a CLOSED.
- [x] Se muestra confirmación de éxito con resumen de la operación.

### DEMY-36: Listar niveles académicos

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/academic-levels` muestra el catálogo
* \[ \] Se listan todos los niveles disponibles
* \[ \] Cada nivel muestra nombre y descripción
* \[ \] Se distingue entre niveles de plataforma e institucionales

### DEMY-37: Crear nivel académico personalizado

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] SUPER_ADMIN puede crear niveles personalizados
- [ ] El nivel se guarda en el catálogo de plataforma
- [ ] El nuevo nivel aparece en el listado
- [ ] Otros roles no pueden crear niveles de plataforma

### DEMY-38: Crear grado académico

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se puede crear grado en `/grade-levels`
* \[ \] El grado queda vinculado al nivel académico seleccionado
* \[ \] El grado aparece en el listado
* \[ \] Se validan campos obligatorios

### DEMY-39: Crear curso/paralelo

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se puede crear curso en `/courses`
* \[ \] El curso queda vinculado al período y grado
* \[ \] Se puede definir sección/paralelo
* \[ \] Se puede definir capacidad máxima
* \[ \] El curso aparece en el listado

### DEMY-40: Editar curso existente

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede editar un curso existente
- [ ] La capacidad se actualiza correctamente
- [ ] La sección se actualiza correctamente
- [ ] Los cambios se reflejan en el listado y detalle

### DEMY-41: Vista árbol jerárquica

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/academic-structure` muestra vista árbol
* \[ \] La jerarquía es nivel > grado > curso
* \[ \] Los nodos se pueden expandir y colapsar
* \[ \] Cada nivel muestra la información relevante

### DEMY-42: Filtrar árbol por institución y período

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Existe selector de institución en la página
- [ ] Existe selector de período en la página
- [ ] El árbol se filtra al cambiar institución
- [ ] El árbol se filtra al cambiar período
- [ ] Los filtros pueden combinarse

### DEMY-43: Listar materias

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/subjects` muestra el listado
* \[ \] Se listan todas las materias de la institución
* \[ \] Cada materia muestra información relevante
* \[ \] TEACHER puede ver el listado (solo lectura)

### DEMY-44: Crear materia institucional

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] ADMIN puede crear materias
- [ ] Se validan campos obligatorios
- [ ] La materia queda asociada a la institución
- [ ] Aparece en el listado tras crear

### DEMY-45: Editar materia existente

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede editar materia existente
- [ ] PATCH actualiza los campos modificados
- [ ] Los cambios se reflejan en el listado
- [ ] TEACHER no puede editar materias

### DEMY-46: Listar asignaciones docentes

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/teacher-assignments` muestra el listado
* \[ \] Cada asignación muestra profesor, materia y curso
* \[ \] Se pueden filtrar por curso o profesor
* \[ \] El listado refleja el período seleccionado

### DEMY-47: Crear asignación docente

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede crear asignación docente
- [ ] Se vincula profesor + materia + curso
- [ ] Se valida que no exista duplicado (mismo prof+materia+curso)
- [ ] Aparece en el listado tras crear

### DEMY-48: Editar asignación docente

Resultado: Requisito desactualizado.

Jira exige cambiar docente; la edición bloquea docente, institución y periodo por petición posterior del usuario.

Evidencia: [archivo](../BackendZerocademy/src/modules/teacher-assignments/dto/update-teacher-assignment.dto.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede cambiar el docente de una asignación
- [ ] Se puede cambiar la materia de una asignación
- [ ] Los cambios se reflejan en el listado
- [ ] Se validan conflictos al editar

### DEMY-49: Listar estudiantes

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/students` muestra el listado
* \[ \] ADMIN puede ver todos los estudiantes
* \[ \] TEACHER puede ver estudiantes de sus cursos
* \[ \] Se muestra nombre, matrícula y estado

### DEMY-50: Crear estudiante individual

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se puede crear estudiante en `/students/new`
* \[ \] La matrícula es opcional
* \[ \] Se validan campos obligatorios
* \[ \] El estudiante aparece en el listado
* \[ \] Se genera matrícula automática si no se proporciona

### DEMY-51: Editar datos de estudiante

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede editar perfil de estudiante
- [ ] PATCH actualiza los campos modificados
- [ ] Los cambios se reflejan en el listado y detalle
- [ ] Se validan formatos de email y campos obligatorios

### DEMY-52: Activar y desactivar estudiante

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Endpoint deactivate desactiva al estudiante
- [ ] Endpoint activate reactiva al estudiante
- [ ] El estado se refleja en la UI
- [ ] Estudiante inactivo no puede acceder al sistema

### DEMY-53: Importación masiva CSV exitosa

Resultado: Parcial.

La UI acepta texto CSV pegado, pero no ofrece cargar un archivo CSV. La vista previa y filas de resultado sí están implementadas.

Evidencia: [archivo](../FrontendZerocademy/src/features/students/components/student-bulk-import-page.tsx).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se puede subir CSV en `/students/bulk-import`
* \[ \] Filas válidas se importan correctamente
* \[ \] Se muestra resumen con cantidad importada
* \[ \] Los estudiantes aparecen en el listado

### DEMY-54: Validación errores importación CSV

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Filas inválidas no se importan
- [ ] El resumen lista errores por fila
- [ ] Se indica número de fila con error
- [ ] Filas válidas se importan aunque haya errores en otras
- [ ] Mensajes de error son claros y en español

### DEMY-55: Ver historial de matrículas del estudiante

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/students/[id]/enrollments` muestra historial
* \[ \] Se listan todas las matrículas del estudiante
* \[ \] Cada matrícula muestra período, curso y estado
* \[ \] ADMIN y TEACHER pueden consultar el historial

### DEMY-56: Listar matrículas

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/enrollments` muestra el listado
* \[ \] Cada matrícula muestra estudiante, curso y estado
* \[ \] El listado refleja el período seleccionado
* \[ \] Se pueden filtrar por curso o estado

### DEMY-57: Crear matrícula individual

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se puede crear matrícula en `/enrollments/new`
* \[ \] Se vincula estudiante + curso + período
* \[ \] La matrícula queda en estado ACTIVE
* \[ \] Aparece en el listado tras crear

### DEMY-58: Excluir estudiantes ya matriculados en período

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Estudiantes con matrícula ACTIVE en el período no aparecen en el selector
- [ ] Estudiantes sin matrícula sí aparecen
- [ ] Estudiantes con matrícula WITHDRAWN/COMPLETED sí aparecen
- [ ] El filtro se actualiza al cambiar período

### DEMY-59: Matrícula masiva de estudiantes

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede matricular múltiples estudiantes a la vez
- [ ] Todas las matrículas quedan en estado ACTIVE
- [ ] Se muestra resumen de operación
- [ ] Se valida capacidad del curso

### DEMY-60: Editar estado de matrícula

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede cambiar estado de matrícula
- [ ] Estados disponibles: WITHDRAWN, COMPLETED, etc.
- [ ] El cambio se refleja en el listado
- [ ] Se registra fecha de cambio de estado

### DEMY-61: Consultar mis matrículas (estudiante)

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/my-enrollments` muestra matrículas del estudiante
* \[ \] Solo se muestran matrículas propias
* \[ \] Cada matrícula muestra curso, período y estado
* \[ \] No se puede acceder a matrículas de otros estudiantes

### DEMY-62: Dashboard de evaluación académica

Resultado: Parcial.

Muestra esquema, términos, categorías y totales; no presenta un estado explícito de configuración completa/incompleta.

Evidencia: [archivo](../FrontendZerocademy/src/features/academic-evaluation/components/academic-evaluation-dashboard-page.tsx).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/academic-evaluation` muestra el dashboard
* \[ \] Se muestra preview de la configuración actual
* \[ \] Hay acceso a esquemas, términos y categorías
* \[ \] Se indica si la configuración está completa o incompleta

### DEMY-63: Inicializar plantilla Ecuador en institución

Resultado: Parcial.

Si la institución no tiene activeAcademicPeriodId, la copia de términos retorna sin crearlos, pero la inicialización puede devolver éxito. Plantillas personalizadas de plataforma pueden diferir de los valores Ecuador exigidos. Falta asegurar precondiciones y atomicidad.

Evidencia: [archivo](../BackendZerocademy/src/modules/academic-evaluation/ecuador-defaults.service.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Existe botón de init Ecuador defaults
- [ ] Se crea esquema de calificación 0-10
- [ ] Se crean términos de evaluación con pesos estándar
- [ ] Se crean categorías Evaluación formativa (70%) y Evaluación sumativa (30%)
- [ ] La configuración queda lista para usar

### DEMY-64: Crear esquema de calificación

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se puede crear esquema en `/grading-schemes`
* \[ \] Se define escala 0-10
* \[ \] El esquema queda asociado a la institución
* \[ \] Aparece en el listado tras crear

### DEMY-65: Gestionar escalas cualitativas (bandas)

Resultado: Parcial.

Valida límites y solapamientos, pero no exige que las bandas cubran todo el rango sin huecos.

Evidencia: [archivo](../BackendZerocademy/src/modules/academic-evaluation/academic-evaluation.validation.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se pueden definir bandas DAR/AAR/PAAR/NAAR
- [ ] Cada banda tiene rango numérico (min-max)
- [ ] No se permiten rangos solapados
- [ ] Se muestra error claro al intentar solapar
- [ ] Las bandas cubren el rango completo del esquema

### DEMY-66: Crear términos de evaluación con pesos

Resultado: Incumplimiento estático.

Crear el primer término de peso 50 guarda el registro y luego lanza error por total 50; bloquea el flujo de creación incremental correcto.

Evidencia: [archivo](../BackendZerocademy/src/modules/academic-evaluation/evaluation-terms.service.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se pueden crear términos en `/evaluation-terms`
* \[ \] Cada término tiene nombre y peso
* \[ \] Los términos aparecen en el listado
* \[ \] Se puede editar peso de término existente

### DEMY-67: Validar suma de pesos de términos = 100%

Resultado: Incumplimiento estático.

create/update escribe antes de validar el total y no lo envuelve en transacción. Puede devolver error dejando el cambio persistido.

Evidencia: [archivo](../BackendZerocademy/src/modules/academic-evaluation/evaluation-terms.service.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se muestra error si la suma no es 100%
- [ ] El mensaje de error es claro y en español
- [ ] No se permite guardar con suma incorrecta
- [ ] Se guarda correctamente cuando suma = 100%

### DEMY-68: Reordenar términos de evaluación

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Se puede reordenar términos por drag o botones
- [ ] El nuevo orden se guarda correctamente
- [ ] El orden persiste tras recargar
- [ ] El orden se refleja en reportes y cálculos

### DEMY-69: Crear categorías de evaluación

Resultado: Incumplimiento estático.

El DTO y formulario tienen nombre/peso/descripcion pero no tipo. Crear una categoría de peso 30 persiste y luego falla; no permite el flujo incremental con respuesta correcta.

Evidencia: [archivo](../BackendZerocademy/src/modules/academic-evaluation/assessment-categories.service.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] Se pueden crear categorías en `/assessment-categories`
* \[ \] Se soportan tipos TAI, AGA y AEA
* \[ \] Cada categoría tiene nombre, tipo y peso
* \[ \] Las categorías aparecen en el listado

### DEMY-70: Validar suma de pesos de categorías = 100%

Resultado: Incumplimiento estático.

Persiste antes de validar total. La barra suma datos guardados, no el valor del formulario en tiempo real. El estado válido usa bg-primary, no verde explícito, y tolerancia 0.02 distinta del backend 0.01.

Evidencia: [archivo](../FrontendZerocademy/src/features/academic-evaluation/components/weight-progress-bar.tsx).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Existe barra de progreso de peso de categorías
- [ ] Muestra suma actual en tiempo real
- [ ] Indica visualmente cuando no suma 100%
- [ ] Se muestra en verde cuando suma = 100%
- [ ] No se permite guardar con suma incorrecta

### DEMY-71: Configuración activa de institución

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] La ruta `/configuration` muestra opciones de configuración
* \[ \] Se puede seleccionar esquema de calificación activo
* \[ \] Se pueden configurar reglas de redondeo
* \[ \] La configuración se guarda y persiste
* \[ \] La configuración activa se usa en cálculos de notas

### DEMY-72: Configuración plataforma Ecuador (SUPER_ADMIN)

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[ \] SUPER_ADMIN puede acceder a `/academic-evaluation/platform`
* \[ \] Se muestran defaults del régimen Ecuador
* \[ \] ADMIN no puede acceder a esta ruta
* \[ \] Los cambios de plataforma afectan plantillas de init
* \[ \] Se distingue configuración plataforma vs institución

### DEMY-73: Mensajes de error de API en español

Resultado: Parcial.

El submit de categorías no captura ni muestra el error de mutateAsync; otros flujos sí usan localize-api-message. No puede garantizarse feedback español en todos los formularios.

Evidencia: [archivo](../FrontendZerocademy/src/features/academic-evaluation/components/assessment-categories-page.tsx).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Los errores de API se muestran en español
- [ ] Se usa utilidad localize-api-message
- [ ] Los mensajes son comprensibles para el usuario
- [ ] Funciona en formularios de creación y edición
- [ ] No se muestran mensajes técnicos en inglés

### DEMY-74: Selectores con búsqueda en formularios

Resultado: Incumplimiento estático.

Select es un select nativo, sin entrada de búsqueda ni filtrado en tiempo real. select-utils solo detecta si falta el valor seleccionado.

Evidencia: [archivo](../FrontendZerocademy/src/components/ui/select.tsx).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Los selectores permiten búsqueda por texto
- [ ] El filtrado es en tiempo real
- [ ] Se usa utilidad select-utils
- [ ] Funciona con listas largas de opciones
- [ ] La selección se mantiene tras buscar

### DEMY-75: Selector de alcance institucional en evaluación

Resultado: Incumplimiento estático crítico.

La lista de instituciones limita opciones por actor, pero los endpoints de categorías y configuración no reciben actor ni verifican acceso institucional. RolesGuard solo valida roles, no pertenencia.

Evidencia: [archivo](../BackendZerocademy/src/modules/academic-evaluation/assessment-categories.controller.ts).

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [ ] Existe componente institution-scope-selector
- [ ] SUPER_ADMIN puede ver alcance plataforma e institución
- [ ] ADMIN solo ve alcance de su institución
- [ ] Al cambiar alcance se actualiza la configuración mostrada
- [ ] El selector es visible en pantallas de evaluación

### DEMY-77: Módulo Grades fase 1 — evaluaciones, registro y gestión de notas

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

* \[x\] CRUD de evaluaciones con validación de asignación docente y esquema de calificación
* \[x\] Crear/actualizar notas individuales y en lote (bulk upsert)
* \[x\] Hoja de ingreso (`GET /v1/grades/entry-sheet/:assessmentId`) con matrículas activas
* \[x\] RBAC: TEACHER escribe en asignaciones propias; STUDENT solo sus notas; ADMIN/SUPER_ADMIN lectura
* \[x\] Validación de límites del esquema, decimales y unicidad `(assessmentId, enrollmentId)`
* \[x\] Rutas frontend `/grades`, `/grades/assessments`, `/grades/entry`
* \[x\] Builds backend y frontend exitosos; E2E grades pasando

### DEMY-78: Motor de cálculo de notas — Academic Performance (fase 2)

Resultado: Pendiente de verificacion exhaustiva.

Sin hallazgo concluyente en esta pasada; no asumir cumplimiento. Ejecutar cada criterio con el rol y datos de prueba de Jira y adjuntar evidencia antes de cerrar.

Criterios vigentes en Jira (marcas originales, no resultado de esta auditoria):

- [x] Jerarquía: Nota → Promedio categoría → Promedio trimestre → Promedio materia
- [x] Sin lógica hardcodeada de Ecuador; configuración institucional
- [x] Endpoints estudiante: subject-averages, term-averages, summary
- [x] Endpoints docente: course-averages, subject-performance, student-performance
- [x] Endpoints admin: institution-performance, course-performance, student-performance
- [x] RBAC, Swagger, logging estructurado, validación DTO
- [x] UI español, dark/light mode, sidebar «Rendimiento»
- [x] Builds backend y frontend exitosos

## Siguiente validacion requerida

Preparar base desechable y usuarios por rol. Probar permisos positivos y negativos por institucion, persistencia tras recargar, historicos, formularios, conflictos y efectos tras respuestas de error. Cubrir desktop/mobile. Repetir los flujos de las 65 tareas y registrar resultado por criterio. Corregir hallazgos en commits separados y volver a ejecutar regresion. No modificar automaticamente instituciones existentes para hacer pasar pruebas.
