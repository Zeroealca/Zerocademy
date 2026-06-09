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

### Editar o desactivar

1. Busque al usuario en el listado (filtros por rol, estado, texto).
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
