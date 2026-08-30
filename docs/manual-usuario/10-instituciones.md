# Instituciones

## ¿Quién puede usar esta sección?

| Acción | Roles |
|--------|-------|
| Crear, activar, desactivar y eliminar instituciones | **Super administrador** |
| Ver listado y detalle | **Super administrador**; **Administrador** solo de las instituciones a las que pertenece |
| Editar configuración, logo y colores | **Super administrador**; **Administrador** solo de sus instituciones |
| Gestionar miembros (asignar admins y docentes) | **Super administrador** |
| Ver transiciones de período | **Super administrador**, **Administrador**, **Docente** (consulta) |
| Ejecutar transición de período | **Administrador** (y super admin en rutas permitidas) |

---

## Cómo llegar

- Menú lateral → **Instituciones**
- Ruta: `http://localhost:3000/institutions`
- Crear: `/institutions/new`
- Editar datos generales: `/institutions/[id]/edit`

### Subsecciones dentro de una institución

Al abrir una institución verá pestañas internas:

| Pestaña | Ruta | Contenido |
|---------|------|-----------|
| Configuración | `/institutions/[id]/settings` | Contacto, región, régimen, logo, colores |
| Miembros | `/institutions/[id]/members` | Usuarios vinculados como admin o docente |
| Transiciones | `/institutions/[id]/transitions` | Cambio de año lectivo — ver [14 — Transición de período](./14-transicion-periodo.md) |

---

## Para qué sirve

Una **institución** representa un colegio o unidad educativa. Es el **dueño** de los datos operativos: períodos propios, cursos, estudiantes, matrículas y configuración de evaluación.

---

## Datos de una institución

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre visible del colegio |
| Código | Identificador único (minúsculas, guiones) |
| Correo, teléfono, dirección | Contacto |
| Región | Costa, Sierra, Amazonía o Galápagos |
| Régimen académico | Costa/Galápagos o Sierra/Amazonía (calendario) |
| Logo | Imagen institucional (máx. 5 MB; PNG, JPEG, WebP, GIF) |
| Colores primario y secundario | Identidad visual en la interfaz |
| Estado activo | Solo instituciones activas deben usarse para operaciones nuevas |

---

## Pasos de uso típico

### Super administrador: crear una institución

1. Entre en **Instituciones** → **Nueva institución**.
2. Complete nombre y **código** único.
3. Guarde.
4. Pulse **Activar** cuando esté lista para operar.
5. En **Miembros**, asigne al menos un **administrador** institucional.

### Administrador: configurar su colegio

1. Abra su institución desde el listado.
2. Vaya a **Configuración**.
3. Complete **región** y **régimen** (necesarios para el selector de período en cabecera).
4. Suba el **logo** y defina **colores** de marca.
5. Guarde los cambios.

### Logo

1. En Configuración o Edición, use el control de **subir archivo**.
2. El sistema optimiza la imagen (tamaño máximo 512 px, formato WebP).
3. El logo se muestra en vistas de la institución.

### Branding (colores)

- Elija color primario y secundario con el selector o escriba el código hexadecimal (`#RRGGBB`).
- La interfaz usa estos colores con compatibilidad en tema claro y oscuro.

---

## Transición de período

Cuando el colegio pasa a un nuevo año lectivo (ej.: 2025-2026 → 2026-2027), use la pestaña **Transiciones** dentro de la institución. El procedimiento completo está en [14 — Transición de período](./14-transicion-periodo.md).

---

## Consejos

- Configure **régimen** antes de que administradores y docentes usen el selector de período.
- Solo el super administrador **crea** instituciones; el administrador las **opera**.
- No elimine una institución con estudiantes, cursos o períodos asociados; el sistema lo impedirá.

---

## Errores frecuentes

| Situación | Solución |
|-----------|----------|
| «Institución sin régimen» en cabecera | Complete régimen en Configuración. |
| No puede eliminar institución | Tiene datos dependientes; desactive en su lugar. |
| Logo no se ve | Verifique formato y tamaño; vuelva a subir. |
| Admin no ve miembros | Solo super admin asigna membresías iniciales. |
