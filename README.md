# Zerocademy — Sistema de gestión académica

Monorepo con **NestJS** (API), **Next.js** (frontend), **PostgreSQL**, **Prisma** y **Docker** para desarrollo local.

| App | Carpeta | Puerto (host) |
|-----|---------|---------------|
| Frontend | `FrontendZerocademy/` | 3000 |
| Backend | `BackendZerocademy/` | 3001 |
| PostgreSQL | contenedor `postgres` | 5432 |
| pgAdmin | contenedor `pgadmin` | 5050 |

---

## Requisitos

- [Node.js](https://nodejs.org/) **≥ 20**
- [npm](https://www.npmjs.com/) (workspaces en la raíz)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recomendado para desarrollo completo)

---

## Estructura del repositorio

```
Zerocademy/
├── README.md                 # Esta guía (operación del proyecto)
├── agent.md                  # Guía del monorepo para agentes IA
├── package.json              # npm workspaces + scripts docker:*
├── docker-compose.yml
├── .env.example              # Plantilla de variables (copiar a .env)
├── BackendZerocademy/             # API NestJS + Prisma
│   └── agent.md              # Convenciones del backend
├── FrontendZerocademy/            # UI Next.js
│   └── agent.md              # Convenciones del frontend
└── docker/                   # Scripts y config de contenedores
```

---

## Configuración inicial (primera vez)

Desde la **raíz del repositorio** (carpeta del proyecto, p. ej. `Zerocademy/`):

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Dependencias (opcional si solo usarás Docker; útil para IDE y scripts locales)
npm install
```

Edita `.env` si necesitas cambiar contraseñas o puertos. **No subas `.env` a Git.**

---

## Desarrollo con Docker (recomendado)

Docker levanta **postgres**, **pgadmin**, **backend** y **frontend** con hot reload en el código fuente.

### Levantar todo el stack

```bash
# Primer arranque o tras cambiar Dockerfile / package-lock.json
npm run docker:up

# En segundo plano (terminales libres)
npm run docker:up:detach
```

Equivalente: `docker compose up --build`

### URLs

| Servicio | URL | Detalle |
|----------|-----|--------|
| Frontend | http://localhost:3000 | Next.js dev |
| Backend API | http://localhost:3001 | NestJS |
| Health | http://localhost:3001/health | Estado del API |
| Swagger UI | http://localhost:3001/api/docs | Solo si `NODE_ENV≠production` o `SWAGGER_ENABLED=true` |
| OpenAPI JSON | http://localhost:3001/api/docs-json | Contrato de la API |
| pgAdmin | http://localhost:5050 | `admin@example.com` / `admin` (ver `.env`) |

**pgAdmin:** el servidor PostgreSQL aparece preconfigurado como *Zerocademy PostgreSQL*. Al conectar, usa la contraseña de `POSTGRES_PASSWORD` en tu `.env`.

### Detener servicios

```bash
# Parar contenedores (conserva datos de la base)
npm run docker:down
```

### Reiniciar servicios

```bash
# Reinicio rápido (sin rebuild)
npm run docker:restart

# Reiniciar solo un servicio
docker compose restart backend
docker compose restart frontend
```

### Reconstruir imágenes

Necesario tras cambiar `Dockerfile`, `package.json` o `package-lock.json`:

```bash
npm run docker:build
npm run docker:up
# o en un paso:
docker compose up --build
```

### Ver logs

```bash
npm run docker:logs              # todos los servicios
npm run docker:logs:backend      # solo API
npm run docker:logs:frontend     # solo Next.js
npm run docker:logs:postgres     # solo base de datos
```

Ver últimas líneas sin seguir: `docker compose logs --tail=100 backend`

### Estado de contenedores

```bash
npm run docker:ps
```

### Shell dentro de un contenedor

```bash
npm run docker:shell:backend
npm run docker:shell:frontend
```

---

## Hot reload (cambios en código)

| App | ¿Se recarga solo? | Qué se monta |
|-----|-------------------|--------------|
| **Backend** | Sí (`nest start --watch`) | `BackendZerocademy/src`, `prisma`, configs |
| **Frontend** | Sí (`next dev`) | `FrontendZerocademy/src`, `public`, configs |

Al guardar archivos `.ts` / `.tsx` en esas carpetas, los contenedores recompilan sin rebuild de la imagen.

**No se recarga solo** si solo cambias:

- `package.json` / dependencias nuevas
- `Dockerfile` o scripts en `docker/`

→ En ese caso: rebuild + pasos de [Dependencias en Docker](#dependencias-nuevas-en-docker).

---

## Desarrollo local (sin Docker)

Necesitas PostgreSQL accesible (local o solo el contenedor de DB).

### Solo base de datos en Docker

```bash
docker compose up -d postgres pgadmin
```

Configura en `BackendZerocademy/.env` (copia desde `BackendZerocademy/.env.example`):

`DATABASE_URL=postgresql://zerocademy:zerocademy_secret@localhost:5432/zerocademy_db?schema=public`

### API y frontend en la máquina host

```bash
npm install

# Terminal 1 — API (puerto 3001 si PORT=3001 en .env)
npm run dev:backend

# Terminal 2 — frontend
npm run dev:frontend
```

### Acceso desde otra computadora en la red (LAN)

El frontend escucha en `0.0.0.0:3000` y el API en `0.0.0.0:3001`. Las peticiones del navegador van por el proxy de Next.js (`/v1`, `/uploads`), así que no hace falta configurar la IP manualmente.

1. Obtén la IP local de la máquina que ejecuta el proyecto (ej. `192.168.1.42`).
2. Desde otro equipo en la misma red, abre `http://192.168.1.42:3000`.
3. Asegúrate de que el firewall del host permita conexiones entrantes en los puertos **3000** y **3001**.

En macOS, si el firewall está activo: *Ajustes del Sistema → Red → Firewall → Opciones* y permite Node.js, o desactiva el bloqueo temporalmente para probar.

### Prisma (local)

```bash
cd BackendZerocademy
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

---

## Scripts npm (raíz)

| Script | Descripción |
|--------|-------------|
| `npm run dev:backend` | NestJS en modo watch (sin Docker) |
| `npm run dev:frontend` | Next.js dev (sin Docker) |
| `npm run build:backend` | Compilar API |
| `npm run build:frontend` | Build de producción Next.js |
| `npm run docker:up` | `docker compose up --build` |
| `npm run docker:up:detach` | Igual, en background |
| `npm run docker:down` | Parar stack |
| `npm run docker:down:volumes` | Parar y **borrar volúmenes** (incl. datos Postgres) |
| `npm run docker:restart` | Reiniciar contenedores |
| `npm run docker:logs` | Logs en tiempo real |
| `npm run docker:logs:backend` | Logs del backend |
| `npm run docker:prisma:migrate` | `prisma migrate deploy` dentro del backend |
| `npm run docker:prisma:generate` | `prisma generate` dentro del backend |
| `npm run docker:prisma:studio` | Prisma Studio en el contenedor backend |

---

## Prisma y base de datos

- Esquema: `BackendZerocademy/prisma/schema.prisma`
- Migraciones: `BackendZerocademy/prisma/migrations/`

**Con Docker**, al arrancar el backend se ejecutan automáticamente:

1. Espera a Postgres
2. `prisma generate`
3. `prisma migrate deploy`
4. `prisma seed` (admin + catálogo Ecuador; idempotente). Desactivar con `RUN_PRISMA_SEED=false` en `.env`
5. `nest start --watch`

**Nueva migración (desarrollo):**

```bash
# Local
cd BackendZerocademy && npx prisma migrate dev --name descripcion_cambio

# O dentro del contenedor
npm run docker:prisma:migrate
```

---

## Volúmenes Docker

| Volumen | Contenido |
|---------|-----------|
| `zerocademy_postgres_data` | Datos persistentes de PostgreSQL |
| `zerocademy_pgadmin_data` | Configuración de pgAdmin |
| `zerocademy_frontend_node_modules` | Dependencias npm hoisted del frontend |
| `zerocademy_frontend_next_cache` | Caché `.next` de Next.js |

El **backend** no usa volumen de `node_modules`: las dependencias van en la imagen Docker (evita errores `MODULE_NOT_FOUND` con Nest CLI / `node-emoji`).

### Borrar solo datos de desarrollo (reset DB)

```bash
docker compose down
docker volume rm zerocademy_postgres_data
docker compose up -d
```

### Borrar todo (stack + volúmenes)

```bash
npm run docker:down:volumes
```

---

## Dependencias nuevas en Docker

### Backend (cualquier `npm install` en el workspace)

Las dependencias del API van **dentro de la imagen**, no en un volumen. Tras cambiar `package.json` o `package-lock.json`:

```bash
npm install                              # en la raíz del monorepo (actualiza el lockfile)
docker compose build --no-cache backend
docker compose up -d backend
```

Si migraste desde el nombre anterior del proyecto (`notas` o `zerocademy`), elimina volúmenes viejos una vez:

```bash
docker volume rm zerocademy_backend_node_modules zerocademy_postgres_data 2>/dev/null || true
```

Errores típicos si el árbol de módulos está roto: `Cannot find module '@nestjs/swagger'`, `MODULE_NOT_FOUND` en `node-emoji`, o `No driver (HTTP) has been selected` → rebuild de la imagen backend.

### Frontend (ej. Tailwind / lightningcss)

Los `node_modules` del frontend sí usan volumen nombrado. Si añades paquetes y falla:

```bash
docker compose stop frontend
docker volume rm zerocademy_frontend_node_modules zerocademy_frontend_next_cache
docker compose build frontend
docker compose up -d frontend
```

Tras `npm install` en la raíz, conviene **siempre** `docker compose build` antes de `up` si usas Docker.

---

## Solución de problemas

| Problema | Qué hacer |
|----------|-----------|
| `Cannot find module` / `node-emoji` / `No driver (HTTP)` | Rebuild backend. Compose define `NODE_PATH` para workspaces npm. |
| Frontend 500 / error `lightningcss` u `oxide` | Borrar `zerocademy_frontend_node_modules` + rebuild frontend |
| Puerto 3000 o 3001 en uso | Cambia `BACKEND_PORT` en `.env` o detén el proceso que usa el puerto |
| pgAdmin no arranca | Email debe ser válido (ej. `admin@example.com`, no `.local`) |
| Swagger no aparece | `NODE_ENV=production` lo oculta; usa `SWAGGER_ENABLED=true` en `.env` |
| Cambios en código no se reflejan | Confirma que editas archivos en `src/`; revisa logs con `docker:logs:backend` |
| Backend en bucle de restart | `npm run docker:logs:backend` y revisa errores de compilación o Prisma |

---

## Convenciones y documentación técnica

| Documento | Uso |
|-----------|-----|
| [agent.md](./agent.md) | Monorepo, dominios, límites frontend/backend |
| [BackendZerocademy/agent.md](./BackendZerocademy/agent.md) | NestJS, Prisma, Swagger, RBAC |
| [FrontendZerocademy/agent.md](./FrontendZerocademy/agent.md) | Next.js, features, TanStack Query |

---

## Subir el proyecto a GitHub

Usa **un solo repositorio** (monorepo). No subas:

- `.env`
- `node_modules/`
- `BackendZerocademy/node_modules/`, `FrontendZerocademy/node_modules/`
- `FrontendZerocademy/.next/`, `BackendZerocademy/dist/`

Sí incluye: `package-lock.json`, `.env.example`, migraciones Prisma.
