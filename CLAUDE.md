# CLAUDE.md — Contexto del Proyecto IFX VM Manager

> Este archivo es leído automáticamente por Claude Code en cada sesión.
> NO modificar sin autorización del arquitecto del proyecto.

---

## 🎯 Descripción del Proyecto

SPA de gestión de Máquinas Virtuales (VMs) desarrollada como prueba técnica para
IFX Networks. El objetivo es demostrar arquitectura escalable, código limpio,
seguridad en autenticación, Optimistic UI y sincronización real-time.

**Duración estimada:** 2 días  
**Evaluación principal:** Arquitectura, seguridad JWT, Optimistic UI, uso estratégico de IA

---

## 🏛️ Arquitectura General

### Frontend — Feature-Sliced Design (FSD)

```
frontend/src/
├── app/              ← Inicialización: App.vue, router, providers
├── pages/            ← Solo composición de widgets/features, cero lógica
├── widgets/          ← Bloques grandes de UI (VmDashboardPanel, VmTable)
├── features/         ← Acciones del usuario con lógica de negocio
│   ├── auth/
│   ├── vm-create/
│   ├── vm-edit/
│   └── vm-delete/
├── entities/         ← Modelos de dominio puros
│   └── vm/
└── shared/           ← Sin dependencias de negocio, 100% reutilizable
    ├── api/
    ├── ui/
    ├── lib/
    └── config/
```

**Regla de importación FSD (CRÍTICA):**
```
pages → widgets → features → entities → shared
```
Cada capa SOLO importa de capas inferiores. NUNCA hacia arriba.
Si viola esta regla, detente y pregunta antes de continuar.

### Backend — Layered Architecture (3 capas)

```
backend/src/
├── routes/           ← Solo HTTP routing, sin lógica
├── controllers/      ← Orquesta: extrae req → llama service → envía res
├── services/         ← Reglas de negocio y validaciones
├── repositories/     ← SQL puro, sin conocer HTTP ni reglas de negocio
├── middleware/       ← authenticate, requireAdmin, errorHandler
├── socket/           ← Handlers de Socket.io
├── db/               ← connection, schema, seed, migrate
└── config/           ← Validación de variables de entorno
```

**Flujo de una request:**
```
HTTP Request
  → Route (solo path + llamada a controller)
  → Middleware (authenticate / requireAdmin)
  → Controller (extrae req, llama service, envía res)
  → Service (validaciones, reglas de negocio)
  → Repository (SQL puro)
  → Response
```

---

## ⚙️ Stack Tecnológico

### Backend
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "better-sqlite3": "^9.x",
    "jsonwebtoken": "^9.x",
    "cookie-parser": "^1.4.x",
    "bcryptjs": "^2.4.x",
    "cors": "^2.8.x",
    "socket.io": "^4.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "jest": "^29.x",
    "supertest": "^6.x",
    "nodemon": "^3.x"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "vue": "^3.x",
    "pinia": "^2.x",
    "vue-router": "^4.x",
    "axios": "^1.x",
    "socket.io-client": "^4.x",
    "chart.js": "^4.x",
    "vue-chartjs": "^5.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "vitest": "^1.x",
    "@vue/test-utils": "^2.x",
    "@testing-library/vue": "^8.x",
    "jsdom": "^24.x"
  }
}
```

---

## 🔒 Decisiones Técnicas NO NEGOCIABLES

### 1. JWT en HttpOnly Cookie — NUNCA en body ni localStorage

```javascript
// ✅ CORRECTO — backend/src/controllers/auth.controller.js
const login = (req, res) => {
  const { email, password } = req.body
  const user = authService.validateCredentials(email, password)
  const token = authService.generateToken(user)

  res.cookie('token', token, {
    httpOnly: true,                                    // ← OBLIGATORIO
    secure: process.env.NODE_ENV === 'production',     // ← OBLIGATORIO
    sameSite: 'strict',                                // ← OBLIGATORIO
    maxAge: 8 * 60 * 60 * 1000
  })

  // Body SOLO retorna el usuario, NUNCA el token
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}

// ❌ INCORRECTO — NUNCA hacer esto
res.json({ token, user })          // token en body
localStorage.setItem('token', ...) // token en localStorage
```

### 2. Middleware authenticate lee de req.cookies — NUNCA de headers

```javascript
// ✅ CORRECTO — backend/src/middleware/authenticate.js
const authenticate = (req, res, next) => {
  const token = req.cookies.token    // ← de cookie, no de Authorization header
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// ❌ INCORRECTO — NUNCA hacer esto
const token = req.headers.authorization?.split(' ')[1]
```

### 3. Optimistic UI en composables de features — NUNCA en el store

```javascript
// ✅ CORRECTO — features/vm-delete/model/useVmDelete.js
export function useVmDelete() {
  const store = useVmStore()    // entity store (solo estado síncrono)
  const toast = useToast()

  async function deleteVm(id) {
    const snapshot = [...store.vms]   // 1. snapshot
    store.removeVm(id)                // 2. optimistic (UI reacciona YA)
    try {
      await vmsApi.delete(id)         // 3. request al servidor
      toast.success('VM eliminada')   // 4. confirmar al usuario
    } catch {
      store.setVms(snapshot)          // 5. rollback si falla
      toast.error('Error. Cambio revertido')
    }
  }
  return { deleteVm }
}

// ❌ INCORRECTO — HTTP calls dentro del store
const useVmStore = defineStore('vms', {
  actions: {
    async deleteVm(id) {
      await axios.delete(`/vms/${id}`)  // ← NUNCA HTTP en el store
      this.vms = this.vms.filter(...)
    }
  }
})
```

### 4. Store de Pinia (entities/vm/) — SOLO métodos síncronos

```javascript
// ✅ CORRECTO — entities/vm/model/vm.store.js
export const useVmStore = defineStore('vms', {
  state: () => ({ vms: [], isLoading: false }),
  actions: {
    setVms(vms)           { this.vms = vms },
    addVm(vm)             { this.vms.push(vm) },
    replaceVm(id, vm)     { const i = this.vms.findIndex(v => v.id === id); if (i !== -1) this.vms[i] = vm },
    removeVm(id)          { this.vms = this.vms.filter(v => v.id !== id) },
    setLoading(val)       { this.isLoading = val }
  }
  // SIN llamadas HTTP, SIN axios, SIN fetch
})
```

### 5. RBAC con v-if — NUNCA v-show

```html
<!-- ✅ CORRECTO: el elemento NO existe en el DOM para Clientes -->
<VmDeleteButton v-if="authStore.isAdmin" :vm="vm" />

<!-- ❌ INCORRECTO: el elemento existe pero está oculto (inseguro) -->
<VmDeleteButton v-show="authStore.isAdmin" :vm="vm" />
```

### 6. Frontend con credentials: include — SIEMPRE

```javascript
// ✅ CORRECTO — shared/api/http.client.js
import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true    // ← la cookie HttpOnly viaja automáticamente
})
// NUNCA pasar el token manualmente en headers
```

---

## 📁 Estructura Completa de Archivos

### Backend
```
backend/
├── src/
│   ├── config/
│   │   └── env.js                    ← Valida variables al arrancar
│   ├── db/
│   │   ├── connection.js             ← Instancia única de SQLite
│   │   ├── schema.sql                ← DDL de tablas
│   │   ├── migrate.js                ← Ejecuta schema.sql
│   │   └── seed.js                   ← Datos iniciales
│   ├── repositories/
│   │   ├── users.repository.js       ← findByEmail, findById
│   │   └── vms.repository.js         ← findAll, findById, create, update, delete
│   ├── services/
│   │   ├── auth.service.js           ← validateCredentials, generateToken, hashPassword
│   │   └── vms.service.js            ← validateVmData, lógica de negocio
│   ├── controllers/
│   │   ├── auth.controller.js        ← login, logout, me
│   │   └── vms.controller.js         ← list, create, update, delete
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── vms.routes.js
│   ├── middleware/
│   │   ├── authenticate.js           ← Lee JWT de req.cookies.token
│   │   ├── requireAdmin.js           ← Verifica role === 'Administrador'
│   │   └── errorHandler.js           ← Manejo centralizado de errores
│   └── socket/
│       └── vm.socket.js              ← emitVmEvent(io, event, payload)
├── tests/
│   ├── setup/
│   │   └── db.setup.js               ← SQLite en memoria para tests
│   ├── auth.test.js
│   ├── vms.test.js
│   └── middleware.test.js
├── index.js                          ← Entry point: Express + Socket.io
├── .env.example
├── Dockerfile
├── jest.config.js
└── package.json

```

### Frontend
```
frontend/src/
├── app/
│   ├── App.vue
│   ├── router/
│   │   └── index.js                  ← Rutas + navigation guards
│   ├── styles/
│   │   └── globals.css
│   └── providers/
│       └── index.js                  ← Inicialización de Pinia, dark mode
├── pages/
│   ├── LoginPage.vue
│   ├── DashboardPage.vue
│   ├── VmListPage.vue
│   └── VmFormPage.vue
├── widgets/
│   ├── VmDashboardPanel/
│   │   ├── index.vue                 ← KPI cards + 3 gráficos
│   │   └── useResourceMetrics.js    ← computed desde vm.store
│   └── VmTable/
│       ├── index.vue                 ← Grid de VmCard
│       └── useVmFilters.js          ← Filtros por status y búsqueda
├── features/
│   ├── auth/
│   │   ├── ui/LoginForm.vue
│   │   ├── model/auth.store.js       ← login, logout, initialize, isAdmin
│   │   └── api/auth.api.js
│   ├── vm-create/
│   │   ├── ui/VmCreateButton.vue
│   │   ├── model/useVmCreate.js      ← Optimistic UI con temp_id
│   │   └── api/vms.api.js
│   ├── vm-edit/
│   │   ├── ui/VmEditButton.vue
│   │   └── model/useVmEdit.js        ← Snapshot + rollback
│   └── vm-delete/
│       ├── ui/VmDeleteButton.vue
│       └── model/useVmDelete.js      ← Snapshot + rollback
├── entities/
│   └── vm/
│       ├── ui/
│       │   ├── VmCard.vue            ← Solo props + emits, sin stores
│       │   └── VmStatusBadge.vue
│       ├── model/
│       │   └── vm.store.js           ← Solo métodos síncronos de estado
│       └── lib/
│           └── vm.helpers.js         ← getStatusColor, formatRam, formatDisk
└── shared/
    ├── api/
    │   └── http.client.js            ← axios con withCredentials: true
    ├── config/
    │   └── constants.js              ← VM_STATUS, VM_OS, API_URL
    ├── lib/
    │   ├── useDarkMode.js            ← Toggle con localStorage
    │   └── useVmSocket.js            ← Socket.io client + highlight-update
    └── ui/
        ├── BaseButton.vue            ← Variantes: primary, secondary, danger, ghost
        ├── BaseInput.vue             ← Con slot para error message
        ├── SkeletonCard.vue          ← animate-pulse de Tailwind
        ├── ToastContainer.vue        ← Sistema de toasts global
        └── EmptyState.vue            ← SVG + mensaje + slot para action
```

---

## 🗄️ Schema de Base de Datos

```sql
-- users
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,          -- bcrypt hash
  role       TEXT    NOT NULL CHECK(role IN ('Administrador', 'Cliente')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- vms
CREATE TABLE IF NOT EXISTS vms (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  cores      INTEGER NOT NULL CHECK(cores >= 1 AND cores <= 64),
  ram        INTEGER NOT NULL CHECK(ram >= 512),          -- en MB
  disk       INTEGER NOT NULL CHECK(disk >= 10),          -- en GB
  os         TEXT    NOT NULL CHECK(os IN (
               'Ubuntu 22.04', 'Windows Server 2022',
               'CentOS 8', 'Debian 11'
             )),
  status     TEXT    NOT NULL DEFAULT 'Apagada' CHECK(status IN (
               'Encendida', 'Apagada', 'Suspendida'
             )),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Seed de usuarios
```
admin@ifx.com   / Admin123!   → rol: Administrador
cliente@ifx.com / Cliente123! → rol: Cliente
```

---

## 🔌 API Endpoints

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | /login | No | - | Login → establece HttpOnly cookie |
| POST | /logout | No | - | Limpia la cookie |
| GET | /me | Sí | Todos | Retorna usuario actual |
| GET | /vms | Sí | Todos | Lista todas las VMs |
| POST | /vms | Sí | Admin | Crea VM |
| PUT | /vms/:id | Sí | Admin | Actualiza VM |
| DELETE | /vms/:id | Sí | Admin | Elimina VM |

---

## 🔁 Eventos Socket.io

```javascript
// Servidor emite (backend/src/socket/vm.socket.js)
io.to('vm-updates').emit('vm:created', vm)        // después de POST /vms exitoso
io.to('vm-updates').emit('vm:updated', vm)        // después de PUT /vms/:id exitoso
io.to('vm-updates').emit('vm:deleted', { id })    // después de DELETE /vms/:id exitoso

// Cliente escucha (shared/lib/useVmSocket.js)
socket.on('vm:created', (vm) => { /* agregar al store si no existe */ })
socket.on('vm:updated', (vm) => { /* actualizar en store + highlight 2s */ })
socket.on('vm:deleted', ({ id }) => { /* remover del store */ })
```

**Deduplicación:** si el evento es de la propia acción del usuario (Optimistic UI ya lo aplicó),
verificar por `id` antes de mutar el store para no duplicar.

---

## 🧪 Tests — Casos Críticos

### El test más importante del proyecto (backend):
```javascript
it('la cookie debe tener el flag HttpOnly', async () => {
  const res = await request(app)
    .post('/login')
    .send({ email: 'admin@ifx.com', password: 'Admin123!' })

  const setCookieHeader = res.headers['set-cookie']
  expect(setCookieHeader).toBeDefined()
  expect(setCookieHeader[0]).toMatch(/HttpOnly/i)   // ← CRÍTICO
  expect(res.body).not.toHaveProperty('token')       // ← CRÍTICO
})
```

### Test de Optimistic UI rollback (frontend):
```javascript
it('restaura la VM si la API falla al eliminar', async () => {
  const store = useVmStore()
  store.setVms([{ id: 1, name: 'vm-test', ... }])

  // Mock de API que falla
  vi.mocked(vmsApi.delete).mockRejectedValueOnce(new Error('Server error'))

  const { deleteVm } = useVmDelete()

  // Iniciamos la eliminación (no esperamos el resultado aún)
  const promise = deleteVm(1)

  // ANTES de que la API responda, la VM debe estar eliminada (optimistic)
  expect(store.vms).toHaveLength(0)

  // Esperamos que la promesa falle
  await promise

  // DESPUÉS del fallo, la VM debe estar restaurada (rollback)
  expect(store.vms).toHaveLength(1)
  expect(store.vms[0].id).toBe(1)
})
```

### Test de RBAC DOM (frontend):
```javascript
it('el botón Eliminar NO debe existir en el DOM para rol Cliente', () => {
  // Configurar authStore con usuario Cliente
  const wrapper = mount(VmCard, { props: { vm: mockVm } })

  // queryByRole retorna null si no existe (más estricto que estar oculto)
  expect(wrapper.queryByRole('button', { name: /eliminar/i })).toBeNull()
})
```

---

## 🚀 Comandos del Proyecto

```bash
# Desarrollo
npm run dev          # Levanta backend + frontend en paralelo (concurrently)
npm run dev:back     # Solo backend (nodemon)
npm run dev:front    # Solo frontend (vite)

# Tests
npm run test         # Todos los tests
npm run test:back    # Jest backend con coverage
npm run test:front   # Vitest frontend con coverage

# Build
npm run build        # Build del frontend para producción

# Docker
docker-compose up --build    # Levanta todo el stack
docker-compose down          # Detiene y limpia

# Utilidades
npm run lint         # ESLint en ambos proyectos
npm run seed         # Repopula la base de datos
```

---

## 📋 Variables de Entorno

```env
# .env.example — copiar a .env y completar

# Backend
NODE_ENV=development
PORT=3000
JWT_SECRET=cambia_esto_en_produccion_minimo_32_caracteres
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/database.sqlite

# Frontend (prefijo VITE_ obligatorio para Vite)
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## 📋 Orden de Desarrollo (Seguir Estrictamente)

```
PASO 1  → Scaffold monorepo: carpetas + package.json + configs
PASO 2  → Backend DB: connection, schema, migrate, seed, config/env
PASO 3  → Backend Auth: repository → service → controller → routes → middlewares
PASO 4  → Backend CRUD VMs + Socket.io
PASO 5  → Tests backend (Jest + Supertest)
PASO 6  → Frontend shared/: http.client, constants, useDarkMode, BaseComponents
PASO 7  → Frontend entities/vm/ store + components + helpers
PASO 8  → Frontend features/auth/ (store, api, LoginForm)
PASO 9  → Frontend features/vm-create, vm-edit, vm-delete (Optimistic UI)
PASO 10 → Frontend widgets/ (VmDashboardPanel, VmTable)
PASO 11 → Frontend pages/ + app/ (router + guards + AppLayout)
PASO 12 → Tests frontend (Vitest)
PASO 13 → Docker (Dockerfiles + docker-compose + nginx.conf)
PASO 14 → CI/CD (.github/workflows/ci.yml)
PASO 15 → README.md completo + Bitácora de IA
```

---

## ⚠️ Reglas para Claude Code

1. **Un paso a la vez.** Completa y confirma cada paso antes de avanzar.

2. **Nunca violes la arquitectura.** Si una función no encaja en su capa, pregunta antes de ponerla en la capa incorrecta.

3. **Después de crear archivos, ejecuta y confirma** que no hay errores de sintaxis ni imports rotos.

4. **Si un test falla, corrígelo antes de continuar** al siguiente paso.

5. **Nunca pongas lógica HTTP en el store de Pinia.** Si lo haces, es un error arquitectónico.

6. **Nunca uses v-show para RBAC.** Siempre v-if.

7. **Nunca retornes el JWT en el body.** Solo en HttpOnly cookie.

8. **Al terminar cada paso**, lista los archivos creados/modificados y confirma que las importaciones respetan la jerarquía FSD.

---

## 📝 Bitácora de IA (Completar durante el desarrollo)

Esta sección debe actualizarse al final del proyecto para el README.

### Herramientas utilizadas
- Claude (Anthropic) — arquitectura, generación de código base, revisión

### Partes delegadas a la IA
- [ ] Scaffold inicial del monorepo
- [ ] Configuración de Vite, Tailwind, Jest, Vitest
- [ ] Boilerplate del CRUD de Express + better-sqlite3
- [ ] Estructura base de componentes Vue repetitivos
- [ ] Configuración de Docker y GitHub Actions

### Intervenciones y correcciones manuales
*(Completar durante el desarrollo)*
- [ ] JWT: La IA inicialmente retornó el token en el body → corregido a HttpOnly cookie
- [ ] Optimistic UI: La IA puso las llamadas HTTP en el store → movido a composables de features
- [ ] RBAC: La IA usó v-show → corregido a v-if para eliminar del DOM
- [ ] Tests: La IA no contempló deduplicación de eventos Socket.io → implementado manualmente

### Prompts clave utilizados
*(Agregar 2-3 prompts más importantes al finalizar)*

---

## 🔀 Git Workflow — Commits y Pull Requests

### Estrategia de Branches

```
main
└── develop
    ├── feat/project-scaffold
    ├── feat/database-setup
    ├── feat/backend-auth
    ├── feat/backend-crud
    ├── test/backend
    ├── feat/frontend-shared
    ├── feat/frontend-features
    ├── feat/frontend-ui
    ├── test/frontend
    ├── feat/docker-cicd
    └── docs/readme
```

**Regla:** NUNCA hacer commits directos a `main` ni `develop`.
Todo cambio entra por branch → PR → merge.

---

### Convención de Commits (Conventional Commits)

Formato obligatorio:
```
tipo(scope): descripción corta en imperativo (max 72 chars)
```

**Tipos permitidos:**
- `feat`     → nueva funcionalidad
- `fix`      → corrección de bug
- `test`     → agregar o corregir tests
- `docs`     → documentación
- `chore`    → configuración, dependencias, scaffolding
- `refactor` → cambio de código sin cambiar comportamiento
- `style`    → formato, espacios, puntos y comas

**Scopes permitidos:**
- `auth` `vms` `db` `socket` `config` → backend
- `shared` `entities` `features` `pages` `widgets` `app` → frontend
- `docker` `ci` → infraestructura

**Ejemplos correctos:**
```bash
feat(auth): implement JWT in HttpOnly cookie (not in response body)
feat(vm-delete): implement optimistic delete with state restoration on api error
test(auth): verify JWT is set in HttpOnly cookie not in response body
chore(ci): restrict docker image publish to main branch only
fix(socket): deduplicate vm:updated events from own optimistic actions
```

---

### Cuándo hacer commit — Por paso

| Paso | Branch | Commits clave |
|------|--------|---------------|
| 1 | feat/project-scaffold | chore: initialize monorepo |
| 2 | feat/database-setup | feat(db): schema, seed, migration |
| 3 | feat/backend-auth | feat(auth): JWT HttpOnly cookie |
| 4 | feat/backend-crud | feat(vms): CRUD + socket events |
| 5 | test/backend | test(auth): HttpOnly cookie assertion |
| 6-7 | feat/frontend-shared | feat(shared): http client withCredentials |
| 8-9 | feat/frontend-features | feat(vm-delete): optimistic UI rollback |
| 10-11 | feat/frontend-ui | feat(widgets): dashboard + charts |
| 12 | test/frontend | test(VmCard): buttons absent from DOM |
| 13-14 | feat/docker-cicd | chore(ci): publish only on main |
| 15 | docs/readme | docs: Bitácora de IA |

**Regla de granularidad:** un commit = una responsabilidad.
Si el mensaje necesita "y" para describirse, son dos commits.

---

### Prompt para Claude Code — Generar commits

Al terminar cada paso, usar exactamente este prompt:

```
El paso [N] está completo. Antes de hacer commit:
1. Lista todos los archivos creados o modificados
2. Agrúpalos por responsabilidad (no todo en un solo commit)
3. Genera los comandos git add + git commit para cada grupo
   siguiendo Conventional Commits con el scope correcto
4. Muéstrame los comandos y espera mi confirmación antes de ejecutarlos
```

---

### Pull Request Template

Cuando hagas PR de cada branch a develop, usar esta estructura.
El archivo vive en `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## ¿Qué hace este PR?
<!-- Descripción breve del cambio -->

## Tipo de cambio
- [ ] feat — nueva funcionalidad
- [ ] fix — corrección de bug
- [ ] test — tests nuevos o corregidos
- [ ] chore — configuración o dependencias
- [ ] docs — documentación

## Checklist
- [ ] Sigue la arquitectura definida en CLAUDE.md
- [ ] No viola las reglas de importación FSD
- [ ] No hay JWT en el body ni en localStorage
- [ ] No hay llamadas HTTP dentro de stores de Pinia
- [ ] No hay v-show para RBAC (solo v-if)
- [ ] Los tests pasan: `npm run test`
- [ ] No hay errores de lint: `npm run lint`
- [ ] Los archivos están en la capa correcta según FSD / Layered Architecture

## Decisiones arquitectónicas tomadas
<!-- Si aplicaste algún patrón o tomaste una decisión de diseño, explícala aquí -->

## Notas para el revisor
<!-- Algo específico que deba revisar o tener en cuenta -->
```

---

### Configuración inicial del repo

Ejecutar una sola vez al crear el proyecto:

```bash
# Plantilla de mensaje de commit
cat > .gitmessage << 'EOF'
# tipo(scope): descripción corta (max 72 chars)
#
# tipos: feat | fix | test | docs | chore | refactor | style
# scopes backend: auth | vms | db | socket | config
# scopes frontend: shared | entities | features | pages | widgets | app
# scopes infra: docker | ci
#
# Cuerpo opcional — qué y por qué, no el cómo:

# Closes #issue
EOF

git config commit.template .gitmessage

# Protección de branches (si usas GitHub CLI)
gh repo edit --default-branch main
```

---

### Release final

```bash
# Cuando todo esté en develop y listo:
git checkout main
git merge develop --no-ff -m "release: v1.0.0 - IFX VM Manager complete"
git tag -a v1.0.0 -m "Complete VM manager SPA - IFX technical assessment"
git push origin main --tags
```

El tag `v1.0.0` es lo que el evaluador verá primero en el repo.
Un release taggeado comunica que el proyecto está terminado y
fue entregado con intención, no solo "pusheado".

---

*Archivo generado para prueba técnica IFX Networks — Edwin Brandon Ortega Ramírez*
