# IFX VM Manager

> SPA de gestión de máquinas virtuales — prueba técnica para **IFX Networks**.
> Desarrollada por **Edwin Brandon Ortega Ramírez** ([ebor94](https://github.com/ebor94)).

[![CI](https://github.com/ebor94/ifx-vm-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/ebor94/ifx-vm-manager/actions/workflows/ci.yml)

Aplicación full-stack que permite a un Administrador crear, editar y eliminar VMs, y a un Cliente consultarlas. La sincronización entre clientes es en tiempo real vía Socket.io, con **Optimistic UI** y rollback al fallar.

---

## ⚡ Quick start

### Requisitos

- Node.js ≥ 18
- npm ≥ 9 (para workspaces)
- _opcional:_ Docker Desktop para correr el stack containerizado

### Desarrollo local (sin Docker)

```bash
# 1. Instalar dependencias del monorepo
npm install

# 2. Configurar el .env del backend
cp backend/.env.example backend/.env

# 3. Inicializar la DB (SQLite)
npm run seed

# 4. Levantar back + front en paralelo
npm run dev
```

- Backend en http://localhost:3000
- Frontend en http://localhost:5173

### Con Docker

```bash
docker compose up --build
```

- Backend en http://localhost:3000
- Frontend en http://localhost:8081
- Volumen `ifx-vm-backend-data` persiste la SQLite entre `docker compose down`/`up`

### Credenciales seed

| Email           | Password        | Rol           |
| --------------- | --------------- | ------------- |
| admin@ifx.com   | `Admin123!`   | Administrador |
| cliente@ifx.com | `Cliente123!` | Cliente       |

---

## 🏛️ Arquitectura

### Frontend — Feature-Sliced Design (FSD)

```
frontend/src/
├── app/         ← Bootstrap (Pinia, router, App.vue, providers globales)
├── pages/       ← Login, Dashboard, VmList, VmForm
├── widgets/     ← VmDashboardPanel (charts), VmTable (grid + filtros)
├── features/    ← auth, vm-create, vm-edit, vm-delete (Optimistic UI)
├── entities/    ← vm/ — store síncrono + UI pura + helpers
└── shared/      ← http client, constants, composables (toast, dark mode, socket), UI base
```

**Regla de importación FSD:** `pages → widgets → features → entities → shared`. Cada capa importa SOLO de capas inferiores.

### Backend — Layered Architecture

```
backend/src/
├── routes/         ← HTTP routing puro
├── controllers/    ← Orquestación: req → service → res
├── services/       ← Reglas de negocio + validación
├── repositories/   ← SQL puro (better-sqlite3)
├── middleware/     ← authenticate, requireAdmin, errorHandler
├── socket/         ← Handlers Socket.io
├── db/             ← schema.sql, migrate.js, seed.js, connection.js
└── config/         ← Validación de variables de entorno al arranque
```

---

## 🔒 Decisiones técnicas no-negociables

Estas reglas están grabadas en `CLAUDE.md` y se cumplen sistemáticamente. Cada PR del proyecto incluyó un checklist verificándolas.

### 1. JWT en HttpOnly cookie — nunca en body ni localStorage

- Mitiga XSS: el JS del navegador no puede leer la cookie.
- Mitiga CSRF con `sameSite: 'strict'`.
- Verificado por test: [`backend/tests/auth.test.js`](backend/tests/auth.test.js) ⭐

### 2. Middleware `authenticate` lee de `req.cookies.token` — nunca de `Authorization` header

- Cualquier intento de pasar el JWT por header devuelve 401.
- Verificado por test: [`backend/tests/middleware.test.js`](backend/tests/middleware.test.js) ⭐

### 3. Optimistic UI en composables de features — nunca en el store

- El entity store (`entities/vm/model/vm.store.js`) es 100% síncrono.
- El patrón snapshot → mutación local → request → rollback vive en `useVmCreate`, `useVmEdit`, `useVmDelete`.
- Verificado por test: [`useVmDelete.test.js`](frontend/src/features/vm-delete/model/useVmDelete.test.js) ⭐

### 4. RBAC con `v-if` — nunca con `v-show`

- Los botones de mutación NO existen en el DOM para Clientes (más estricto que estar ocultos).
- Verificado por test: [`widgets/VmTable/index.test.js`](frontend/src/widgets/VmTable/index.test.js) ⭐
- Defensa en profundidad: el backend valida con middleware `requireAdmin` (cualquier request manual recibe 403).

### 5. Axios con `withCredentials: true`

- La cookie HttpOnly viaja automáticamente cross-origin (frontend `:5173` ↔ backend `:3000`).
- Centralizado en [`shared/api/http.client.js`](frontend/src/shared/api/http.client.js).

### 6. Schema con `CHECK` constraints

- Validaciones de dominio (rangos de cores, RAM, disco; enums de OS y status) viven en SQLite además de en el service layer.
- Si alguien bypaseara el service, la DB sigue rechazando datos inválidos.

---

## 📡 API

| Método | Ruta         | Auth | Rol           | Descripción                                 |
| ------- | ------------ | ---- | ------------- | -------------------------------------------- |
| POST    | `/login`   | No   | —            | Login → setea HttpOnly cookie               |
| POST    | `/logout`  | No   | —            | Limpia la cookie                             |
| GET     | `/me`      | Sí  | Todos         | Retorna el usuario actual                    |
| GET     | `/vms`     | Sí  | Todos         | Lista las VMs                                |
| POST    | `/vms`     | Sí  | Administrador | Crea una VM                                  |
| PUT     | `/vms/:id` | Sí  | Administrador | Actualiza una VM (acepta payloads parciales) |
| DELETE  | `/vms/:id` | Sí  | Administrador | Elimina una VM                               |
| GET     | `/health`  | No   | —            | Healthcheck (Docker)                         |

### Eventos Socket.io (room `vm-updates`)

| Evento         | Payload            | Cuándo                        |
| -------------- | ------------------ | ------------------------------ |
| `vm:created` | objeto VM completo | Después de POST /vms exitoso  |
| `vm:updated` | objeto VM completo | Después de PUT /vms/:id ok    |
| `vm:deleted` | `{ id }`         | Después de DELETE /vms/:id ok |

El handler del cliente usa `upsertVm` para deduplicar con la Optimistic UI ya aplicada.

---

## 🧪 Tests

**86 tests totales**, todos verdes en CI.

```bash
npm run test           # back + front
npm run test:back      # Jest + Supertest (33 tests)
npm run test:front     # Vitest (53 tests)
```

### Cobertura destacada

| Capa                         | Tests | Coverage |
| ---------------------------- | ----- | -------- |
| Backend `auth`             | 10    | 100%     |
| Backend `vms` CRUD         | 17    | ~95%     |
| Backend middleware           | 6     | 100%     |
| Frontend helpers             | 9     | 100%     |
| Frontend store (sync)        | 10    | 97%      |
| Frontend Optimistic UI x3    | 12    | 100%     |
| Frontend filtros + métricas | 13    | 100%     |
| Frontend UI + RBAC DOM       | 8     | 100%     |

Tests críticos del proyecto (todos pasando) ⭐:

- `Set-Cookie` con `HttpOnly` + body sin `token` (backend)
- `authenticate` ignora `Authorization` header (backend)
- `useVmDelete` restaura la VM si la API falla (frontend, Optimistic UI rollback)
- Botón Eliminar **NO existe en el DOM** para rol Cliente (frontend, RBAC)

---

## 🐳 Docker

```bash
docker compose up --build
```

**Imágenes:**

- `backend/Dockerfile` — `node:20-bookworm-slim` multi-stage, usuario no-root, healthcheck.
- `frontend/Dockerfile` — multi-stage build con Node + serve con `nginx:alpine`. Imagen final ~25 MB.
- Volumen `ifx-vm-backend-data` para persistir SQLite.

**Imágenes publicadas en GHCR (push a `main`):**

- `ghcr.io/ebor94/ifx-vm-backend:latest`
- `ghcr.io/ebor94/ifx-vm-frontend:latest`

---

## 🔁 CI/CD

`.github/workflows/ci.yml`:

- **Job `test`** — corre en cada PR y push a `main|develop`. Ejecuta `npm ci` + tests backend (Jest) + tests frontend (Vitest) + `vite build`.
- **Job `publish-images`** — corre **sólo en push a `main`** y depende de que `test` pase. Build + push de ambas imágenes a GHCR con tags `:latest` y `:SHA`.

Restringimos el publish a `main` intencionalmente: las imágenes son artefactos de release, no de cada PR.

---

## 🌳 Git workflow

```
main          ← releases (tagueados v*.*.*)
└── develop   ← integración
    └── feat/*, fix/*, test/*, chore/*, docs/*
```

- NUNCA commits directos a `main` o `develop`. Todo entra por PR.
- Conventional Commits con scope (`feat(auth):`, `chore(ci):`, etc.).
- Plantilla de PR en [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

### Storyline del proyecto

| PR  | Branch                     | Tema                                               |
| --- | -------------------------- | -------------------------------------------------- |
| #1  | `feat/database-setup`    | Backend foundation: env, schema, seed              |
| #2  | `feat/backend-auth`      | JWT en HttpOnly cookie + login/logout/me           |
| #3  | `feat/backend-crud`      | CRUD VMs + Socket.io                               |
| #4  | `test/backend`           | Jest + Supertest, 33 tests                         |
| #5  | `feat/frontend-shared`   | Capas `shared/` y `entities/vm/`               |
| #6  | `feat/frontend-features` | Optimistic UI: auth, vm-create, vm-edit, vm-delete |
| #7  | `feat/frontend-ui`       | Widgets + páginas + bootstrap real                |
| #8  | `test/frontend`          | Vitest, 53 tests                                   |
| #9  | `feat/docker-cicd`       | Docker + GitHub Actions                            |
| #10 | `docs/readme`            | Este README                                        |

---

## 🤖 Bitácora de IA

Esta sección documenta cómo usé la IA durante el desarrollo: qué delegué, qué decisiones tomé y qué correcciones hice manualmente — uno de los criterios de evaluación.

### Herramientas

- **Claude Code** ([Anthropic](https://claude.com/claude-code)) modelo Opus 4.7 (1M de contexto) — lo usé como pair programmer end-to-end para acelerar la escritura de código repetitivo, tests, configuración Docker/CI y borradores de mensajes de commit.
- **`gh` CLI**  para abrir PRs y verificar el estado del CI directamente desde la terminal sin pasar por copy-paste.

### Lo que delegué a la IA (con mi review en cada paso)

- ✅ Scaffold del monorepo (workspaces, configs, estructura de carpetas FSD/Layered) según mi spec
- ✅ Boilerplate del backend: env validation, DB layer, repositories, services, controllers, routes, middlewares, socket
- ✅ Boilerplate del frontend: shared, entities, features con Optimistic UI, widgets, pages, bootstrap
- ✅ Tests automatizados (Jest + Vitest) basados en los casos críticos que definí
- ✅ Dockerfiles multi-stage, docker-compose con healthchecks
- ✅ GitHub Actions con job condicional para publish-on-main
- ✅ Borradores de mensajes de commit (Conventional Commits) y descripciones de PR

### Mi rol como arquitecto y reviewer

1. **Escribí el `CLAUDE.md`** con las decisiones no-negociables ANTES de la primera línea de código. Sin esa guía la IA habría tomado caminos genéricos (JWT en body, llamadas HTTP en stores, `v-show` para RBAC). El `CLAUDE.md` fue el mayor multiplicador del proyecto.
2. **Aprobé cada paso manualmente.** El flujo fue paso 1 → revisión → confirmación → paso 2. Nunca dejé que la IA avanzara sin que yo viera el plan agrupado y los mensajes en Conventional Commits.
3. **Mergeé cada PR personalmente.** Los 10 PRs en `develop` y luego el release en `main` son merges aprobados por mí tras revisar el diff completo.
4. **Definí los 4 tests críticos** (HttpOnly cookie, header rejection, Optimistic UI rollback, RBAC DOM) como ejemplos en `CLAUDE.md`. Después validé que los tests escritos los cumplieran y que los 86 tests del repo pasaran en CI antes de cada merge.

### Correcciones que detecté durante la revisión

| Issue                                                                                                                                             | Cómo lo detecté                                                                | Cómo lo resolví                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `better-sqlite3` v9 no tiene prebuilds para Node 22 → fallo de `node-gyp` en Windows sin VS C++ Build Tools                                  | Apareció en logs del primer `npm install`                                     | Bumpeé a v11.5+ que sí trae prebuilds. Documentado en[PR #1](https://github.com/ebor94/ifx-vm-manager/pull/1)                                                              |
| Race condition entre Optimistic UI de `vm-create` y evento socket: si el evento llegaba antes que la response, quedaba un duplicado en el store | Lo identifiqué analizando el orden de eventos cuando estaba diseñando la dedup | Cambié `replaceVm` por `removeVm + upsertVm` (idempotente en ambos órdenes). Test anti-regresión incluido en [PR #8](https://github.com/ebor94/ifx-vm-manager/pull/8) |
| Tests de backend con SQLite en archivo se contaminaban entre runs                                                                                 | Detectado al ejecutar `npm test` por primera vez                               | Agregué soporte de `:memory:` en `config/env.js` y `connection.js`, snapshot de users post-seed para no re-hashear bcrypt en cada test                             |
| `PORT=0` rechazado por el validator del env, bloqueando los tests                                                                               | Falla en la primera corrida de Jest                                              | Cambié el valor en `tests/setup/env.js` a `3001` (los tests no levantan listener real, sólo necesitan que la validación de env pase)                               |

### Mis prompts clave

> "Lee el CLAUDE.md y confirma que entendiste la arquitectura antes de arrancar con el Paso 1."

Lo usé como prompt inicial para forzar a la IA a internalizar las reglas no-negociables y enumerarlas explícitamente antes de tocar código.

> "Mostrame los comandos y espera mi confirmación antes de ejecutarlos."

Lo apliqué al final de cada paso. La IA nunca hizo commits sin que yo viera el plan agrupado y los mensajes en Conventional Commits.

> "Antes del paso N instala gh CLI para que revises el repo."

Me permitió delegar la apertura de PRs y la verificación del estado de CI directamente, sin pasar por copy-paste de URLs.

### Lecciones

- **El `CLAUDE.md` upfront fue el mayor multiplicador.** Tener las reglas como restricciones duras desde el inicio ahorró probablemente la mitad de las correcciones que habrían sido necesarias después.
- **Mantener storyline en commits/PRs paga.** Separé cada paso en su propia branch + PR mergeado a `develop`. El historial se puede leer como una narrativa: del PR #1 al #10 se ve el orden de decisiones que tomé.
- **CI desde el inicio del repo no era viable** porque los tests dependen del código. La estrategia que elegí fue: tests del backend en el paso 5, tests del frontend en el paso 12, CI activado en el paso 14. Una vez activado, bloquea cualquier PR con tests rojos.

---

## 📄 Licencia

Proyecto desarrollado como prueba técnica. Todos los derechos reservados al autor / IFX Networks según corresponda.
