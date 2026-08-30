# Usuarios

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Listar, crear, editar y desactivar usuarios | **Super administrador**, **Administrador** |
| Crear super administradores | Solo **Super administrador** |
| Asignar cualquier rol al crear | **Super administrador** |
| Asignar solo rol Estudiante al crear | **Administrador** |

---

## Cómo llegar

- Menú lateral → **Usuarios**
- Ruta: `http://localhost:3000/users`

---

## Para qué sirve

Administra las **cuentas de acceso** a Zerocademy: correo, contraseña, nombres, rol y estado activo/inactivo.

La gestión de usuarios es distinta de los **perfiles académicos** (estudiante, docente), aunque al crear un estudiante desde [Estudiantes](./11-estudiantes.md) también se crea su usuario.

---

## Roles disponibles

| Rol | Uso |
|-----|-----|
| Super administrador | Plataforma completa |
| Administrador | Operación de institución |
| Docente | Enseñanza y consulta acotada |
| Estudiante | Consulta de datos propios |

---

## Pasos de uso típico

### Super administrador: crear un administrador de colegio

1. Entre en **Usuarios** → **Nuevo usuario**.
2. Complete correo, contraseña, nombres y apellidos.
3. Seleccione rol **Administrador**.
4. Guarde.
5. Vaya a **Instituciones** → **Miembros** y **asigne** ese usuario al colegio correspondiente.

### Administrador: crear un docente

1. Cree el usuario con rol **Docente**.
2. Solicite al super administrador la **membresía** en la institución, o complétela si tiene permiso.
3. Cree las [asignaciones docentes](./09-asignaciones-docentes.md).

### Administrador: crear un estudiante

- Puede hacerlo desde **Usuarios** (solo rol Estudiante) o preferiblemente desde **Estudiantes**, que completa también el perfil académico.

### Filtrar el directorio

Encima de la tabla **Directorio** hay tres controles. Puede combinarlos; al cambiar un filtro se vuelve a la página 1.

| Control | Qué hace | Ejemplo |
|---------|----------|---------|
| **Buscar** | Filtra por nombre o correo (no distingue mayúsculas). La lista se actualiza al dejar de escribir (~0,5 s) | `admin.demo` o `Ana` |
| **Rol** | Muestra solo ese rol | Docente |
| **Estado** | Activos, inactivos o todos | Activos |

- Si no hay coincidencias, la tabla muestra **No se encontraron usuarios.**
- El **administrador** no ve cuentas de super administrador ni la opción **Super administrador** en el filtro de rol.
- Si hay más de 10 usuarios, use **Anterior** / **Siguiente**.

### Ordenar el directorio

Pulse **Rol** o **Estado** en la cabecera de la tabla (icono de flechas).

| Columna | Primer clic | Segundo clic |
|---------|-------------|--------------|
| **Rol** | Super administrador → Representante | Orden inverso |
| **Estado** | Activos primero | Inactivos primero |

El orden se aplica a todo el listado (no solo a la página visible) y se puede combinar con los filtros.

### Editar o desactivar

1. Localice al usuario con **Buscar**, **Rol** y **Estado**.
2. Abra la ficha y edite datos permitidos.
3. Para impedir el acceso sin borrar historial, marque como **inactivo**.

---

## Reglas de seguridad

- Un usuario **inactivo** no puede iniciar sesión.
- La eliminación lógica conserva el registro para auditoría.
- Los administradores **no ven ni gestionan** cuentas de super administrador en listados restringidos.
- Un administrador **no puede** elevar usuarios a super administrador ni asignar roles de administrador/docente arbitrariamente al crear (solo estudiantes según reglas del sistema).

---

## Consejos

- Use correos institucionales reales para recuperación futura de contraseña.
- Cree docentes antes de las asignaciones; cree estudiantes antes de matricular.
- Desactive cuentas de personal que ya no pertenece al colegio en lugar de borrarlas.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| Docente sin acceso a cursos | Falta membresía en Instituciones → Miembros. |
| Admin no crea otro admin | Limitación por rol; contacte al super administrador. |
| Usuario no puede entrar | Verifique que esté **activo** y la contraseña sea correcta. |
| No aparecen super administradores | Solo el super administrador los ve y puede filtrarlos por rol. |
| Correo ya registrado | El formulario muestra *Este correo ya está registrado.* Use otro correo. |
