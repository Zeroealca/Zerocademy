# Primeros pasos

## ¿Qué es Zerocademy?

Zerocademy es una plataforma de **gestión académica** para instituciones educativas. Permite administrar la estructura escolar (niveles, grados, cursos), estudiantes, matrículas, docentes, períodos académicos y la configuración de evaluación, adaptada al contexto educativo ecuatoriano (regímenes Costa/Galápagos y Sierra/Amazonía).

---

## ¿Quién puede usar esta sección?

Todos los usuarios con cuenta activa en la plataforma.

---

## Cómo llegar

1. Abra su navegador web.
2. Ingrese a la dirección de la aplicación (en entorno de desarrollo local: **`http://localhost:3000`**).
3. Si no tiene sesión iniciada, será redirigido a **`http://localhost:3000/login`**.

---

## Para qué sirve

Esta guía le ayuda a **acceder por primera vez**, entender la pantalla principal y orientarse en el panel de control.

---

## Credenciales de prueba (entorno de desarrollo)

Tras ejecutar las semillas de la base de datos, existe un usuario super administrador:

| Campo | Valor |
|-------|-------|
| Correo electrónico | `admin@zerocademy.edu` |
| Contraseña | `ChangeMe123!` |

> Cambie esta contraseña en entornos reales. Las credenciales de prueba no deben usarse en producción.

---

## Iniciar sesión

1. Vaya a `http://localhost:3000/login`.
2. Escriba su **correo electrónico** y **contraseña**.
3. Pulse el botón para iniciar sesión.
4. Si las credenciales son correctas, entrará al **panel principal** (`/dashboard`).

### Errores frecuentes al iniciar sesión

- **Credenciales incorrectas:** la pantalla muestra *Correo o contraseña incorrectos* (el mismo texto si el correo no existe o la contraseña falla). Verifique mayúsculas y la contraseña completa.
- **Cuenta inactiva:** un administrador debe reactivar su usuario.
- **La página no carga:** confirme que el servidor frontend esté en ejecución (`npm run dev:frontend` desde la raíz del proyecto).

---

## Cerrar sesión

1. En la parte superior derecha del panel, localice el botón **Cerrar sesión** (icono de salida).
2. Pulse el botón. Su sesión finalizará y volverá a la pantalla de inicio de sesión.

---

## Selector de período académico (cabecera)

En la **barra superior** del panel, los usuarios con rol **Administrador**, **Docente** o **Estudiante** verán un selector de **Período académico**.

- El período seleccionado define el **contexto** de muchas pantallas (cursos, matrículas, asignaciones, etc.).
- Si no elige uno manualmente, la plataforma usa el período **efectivo** (por ejemplo, el período activo de su institución).
- Los **super administradores** no ven este selector en la cabecera; gestionan el calendario global desde **Períodos académicos**.

### Mensajes que puede ver en el selector

| Mensaje | Significado |
|---------|-------------|
| Sin institución asignada | Su usuario no está vinculado a una institución. |
| Institución sin régimen | La institución no tiene régimen académico configurado. |
| Sin períodos para este régimen | No hay períodos creados o activos para ese régimen. |

---

## Estructura del panel de control

El panel se divide en dos zonas principales:

### Menú lateral (sidebar)

A la izquierda aparece el menú con las **pestañas** disponibles según su rol. Solo verá las secciones para las que tiene permiso. Ejemplos:

- **Resumen** — pantalla de bienvenida.
- **Períodos académicos**, **Niveles**, **Grados**, **Materias** — catálogo de plataforma (super administrador).
- **Cursos / Paralelos**, **Estudiantes**, **Matrículas** — operación institucional (administrador).
- **Mis matrículas**, **Notas** — vistas del estudiante.

### Cabecera (header)

En la parte superior encontrará:

- Su **nombre** y mensaje de bienvenida.
- El **selector de período académico** (si aplica a su rol).
- Una etiqueta con su **rol** (por ejemplo, «Administrador»).
- El interruptor de **tema claro/oscuro**.
- El botón **Cerrar sesión**.

---

## Pasos recomendados tras el primer acceso

1. Inicie sesión con su cuenta.
2. Revise la [guía por rol](./02-guia-por-rol.md) para saber qué puede hacer.
3. Si es administrador o docente, **seleccione el período académico** correcto en la cabecera.
4. Navegue por las pestañas del menú lateral según su trabajo diario.

---

## Consejos

- Use siempre el **mismo período académico** al matricular estudiantes, crear cursos o asignar docentes.
- Si no ve una pestaña del menú, probablemente su rol no tiene acceso; consulte la [guía por rol](./02-guia-por-rol.md).
- El manual está organizado **igual que el menú lateral** para encontrar cada función con facilidad.
