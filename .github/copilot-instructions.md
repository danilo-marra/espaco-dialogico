# Copilot instructions for Espaço Dialógico

## Big picture architecture

- Next.js app (pages router) with API routes under `pages/api/v1/**` using `next-connect` routers.
- Backend data access is centralized in `models/**`, which call `infra/database.js` (PostgreSQL) and throw `infra/errors.js` types.
- API routes wrap handlers with `controller.errorHandlers` from `infra/controller.js` for consistent error responses.
- Auth is JWT + server-side session table: `/api/v1/auth/login/` invalidates previous sessions and increments `token_version` (see `models/userSession.js` and `models/user.js`), while clients store `authToken` + `user` in `localStorage`.
- Role/permission enforcement is layered: `utils/authMiddleware.js` → `utils/roleMiddleware.js` → (optional) `utils/terapeutaMiddleware.js` for therapist-specific access rules.

## Roles & permissions

Three roles: `admin`, `secretaria`, `terapeuta` (stored lowercase; aliases like `administrador` and `secretária` are normalized at runtime in `roleMiddleware.js`).

| Resource     | admin | secretaria | terapeuta     |
| ------------ | ----- | ---------- | ------------- |
| agendamentos | ✓     | ✓          | ✓ (own only)  |
| pacientes    | ✓     | ✓          | ✓ (own only)  |
| terapeutas   | ✓     | ✓          | ✓ (self only) |
| sessoes      | ✓     | ✓          | ✗             |
| transacoes   | ✓     | ✓          | ✗             |
| convites     | ✓     | ✗          | ✗             |
| usuarios     | ✓     | ✗          | ✗             |

`requireTerapeutaAccess()` resolves `req.terapeutaId` (may be `null` if no `terapeutas` record yet). Use `terapeutaTemAcessoPaciente(terapeutaId, pacienteId)` for explicit patient-ownership checks.

## Frontend data flow & patterns

- Use `utils/api.ts` (`axiosInstance`) for client/server API calls; it injects the auth token, adds perf metadata, and retries for `/agendamentos/` updates.
- SWR hooks in `hooks/useFetch*.ts` use `axiosInstance` and specific cache strategies (custom `compare`, `refreshInterval`). Keep these patterns when adding new hooks.
- For ad‑hoc API calls in components, prefer `hooks/useApi.ts` (wraps `authenticatedFetch`) to get loading/error handling.
- Auth state lives in `hooks/useAuth.ts` and is enforced client-side with periodic checks (`/api/v1/me/`). Do not bypass this logic in new pages.
- **State**: Redux Toolkit slices in `store/` handle mutations (dispatch thunks, `.unwrap()`). SWR hooks handle read-heavy fetching. Do not mix the two for the same operation.

## Component & modal patterns

- Modals use Radix UI `<Dialog.Root>` / `<Dialog.Portal>` / `<Dialog.Content>`. Caller controls open state. `<Dialog.Title>` is always present (use `sr-only` when visually hidden).
- Forms use `react-hook-form` + `zodResolver`. Validation schemas are colocated as `*Schema.ts` in the same folder (e.g. `components/Paciente/pacienteSchema.ts`).
- Toasts: `sonner` (`toast.success`, `toast.error`). Input masking: `utils/formatter.ts` (`maskDate`, `maskPhone`, `maskCPF`).
- UI primitives: Radix UI + shadcn/ui convention (`src/components/ui/`). Icons: `@phosphor-icons/react` (primary) and `lucide-react`.
- Path aliases: `@/*` → `src/*`, `infra/*` → `infra/*` (see `tsconfig.json`).

## API route conventions (important)

- Routes typically export `router.handler(controller.errorHandlers)` and register methods via `router.get/post/...` (see `pages/api/v1/agendamentos/index.js`).
- Most routes require `authMiddleware` + `requirePermission(<resource>)`. Therapist-specific routes also add `requireTerapeutaAccess()` and access checks like `terapeutaTemAcessoPaciente()`.
- Status endpoint `/api/v1/status/` checks database connectivity (see `pages/api/v1/status/index.js`).

## Database & migrations

- Migration files live in `infra/migrations/` with naming `<unix-timestamp-ms>_<verb>-<description>.js`.
- To create a new migration, always use the project script: `npm run migrations:create <nome-da-migration>`.
- All migrations use `node-pg-migrate` CommonJS format. **`exports.down` is always `false`** — rollback is not implemented.
- Never write rollback code in migrations (do not implement `exports.down` as a function with `pgm.drop*`, `pgm.add*`, etc.). Always set `exports.down = false`.
- Field conventions (snake*case): PKs `id uuid DEFAULT gen_random_uuid()`, timestamps `created_at`/`updated_at` as `timestamptz DEFAULT timezone('utc', now())`, date fields prefixed `dt*`(e.g.`dt*nascimento`), nota fiscal fields prefixed `nf*`(e.g.`nf_cpf`).
- `database.query` opens a fresh `pg.Client` per call. It throws `ServiceError` on DB failure. Models import specific error classes from `infra/errors.js` and throw them directly (not wrapped).

## TypeScript / JavaScript conventions

- API routes (`pages/api/**`) and models (`models/*.js`) stay as `.js` with ESM `import`. Do not convert to `.ts`.
- Components (`components/**`) and hooks (`hooks/**`) use `.tsx`/`.ts`.
- `infra/errors.ts` exists but `infra/errors.js` is the canonical import used by models and routes.
- `tsconfig.json` has `"strict": false` and `"allowJs": true`.

## Dev & test workflows

- `npm run dev` starts Docker Postgres, waits for DB, runs migrations, then starts Next (`infra/compose.yaml` maps 5434→5432).
- `npm run dev:safe` is the same but launches Next with a manual start script (see `infra/scripts/start-next-dev.js`).
- Before any push, run `npm run test` as the standard validation command.
- Use `npm run test` as the default command for running the project's tests when a broader test run is needed; keep `npm run test:frontend` for component tests only and `npm run test:single` for a focused case.
- Integration tests boot a real Next dev server. Run with `npm run test` (`--runInBand` is required — tests are sequential).
- Env loaded from `.env.test`. Email API routes are excluded from tests (see `jest.config.js`).

## TDD & testing conventions

This project follows TDD. Tests live in `tests/integration/` (API) and `tests/frontend/` (React components).

### beforeAll pattern (integration tests — required order)

```js
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";
import {
  prepareAuthentication,
  ensureDevAdminExists,
  createUserDirectlyAndLogin,
} from "tests/helpers/auth.js";
import orchestrator from "tests/orchestrator.js";

const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
const TEST_NAME = "Descriptive test name";

beforeAll(async () => {
  await ensureServerRunning(TEST_NAME, port);
  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase(); // ← wipes ALL data including admin user
  await ensureDevAdminExists(); // ← MUST come after clearDatabase()
});

afterAll(() => {
  cleanupServer(TEST_NAME);
});
```

### Auth helpers (`tests/helpers/auth.js`)

- **`prepareAuthentication(port)`** — logs in as admin, returns a **plain string JWT token** (NOT an object). Use it as: `const token = await prepareAuthentication(port); // Bearer ${token}`
- **`ensureDevAdminExists()`** — creates the admin user if it doesn't exist. Call this after `clearDatabase()` every time, or all subsequent auth calls will fail with 401.
- **`createUserDirectlyAndLogin(port, { role })`** — inserts a user directly into the DB (bypasses invite flow) and logs in. Returns a plain string JWT. Use this for non-admin roles (`secretaria`, `terapeuta`) in tests — do not use invite-based flows for role creation in tests.

```js
// Admin token
const adminToken = await prepareAuthentication(port);

// Non-admin token (secretaria, terapeuta, etc.)
const secretariaToken = await createUserDirectlyAndLogin(port, {
  role: "secretaria",
});

// HTTP call pattern
fetch(`http://localhost:${port}/api/v1/...`, {
  headers: { Authorization: `Bearer ${adminToken}` },
});
```

### DB constraints — valid enum values

Always use these exact values or INSERT will throw a `check constraint` violation:

| Column               | Valid values                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `tipo_agendamento`   | `'Sessão'`, `'Orientação Parental'`, `'Visita Escolar'`, `'Supervisão'`, `'Outros'`      |
| `status_agendamento` | `'Confirmado'`, `'Cancelado'` — **'Remarcado' was removed** by migration `1752061264872` |
| `local_agendamento`  | `'Sala Azul'`, `'Sala Verde'`, `'Sala 321'`, `'Online'`, `'Externo'`                     |

### Model field conventions (snake_case)

All model methods accept and return **snake_case** field names (e.g. `pagamento_realizado`, `repasse_realizado`, `valor_repasse`). Never pass camelCase to model methods — they are silently ignored.

DB date columns (e.g. `nf_dt_entrada`, `dt_nascimento`) are returned as **JavaScript `Date` objects**, not strings. When asserting dates, compare using:

```js
expect(new Date(record.nf_dt_entrada).toISOString().split("T")[0]).toBe(
  "2024-06-15",
);
```

### Multipart/FormData in integration tests (CRITICAL)

Routes that use `formidable` (e.g. `PUT /api/v1/pacientes/[id]/`) set `bodyParser: false` and require a `Content-Length` header. **node-fetch v2** (used in tests) does NOT add `Content-Length` when you pass a `FormData` stream as body — this causes formidable to hang indefinitely or return 415.

**Always use buffer mode** from the `form-data` npm package:

```js
import FormData from "form-data";

function buildFormData(fields, token) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      // IMPORTANT: Date objects from the DB must be serialized with toISOString()
      // String(dateObj) produces a locale string that PostgreSQL rejects (error 22007)
      const strValue =
        value instanceof Date ? value.toISOString() : String(value);
      formData.append(key, strValue);
    }
  }
  const buffer = formData.getBuffer();
  const boundary = formData.getBoundary();
  const headers = {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": String(buffer.length),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return { body: buffer, headers };
}

// Usage — spread into fetch options:
const response = await fetch(url, {
  method: "PUT",
  ...buildFormData({ terapeuta_id: terapeutaB.id, nome: "João" }, adminToken),
});
```

**DO NOT** pass a `FormData` instance directly as `body`:

```js
// ❌ WRONG — no Content-Length, formidable hangs
await fetch(url, { method: "PUT", body: formData, headers: { Authorization: ... } });
```

**DO NOT** use `String()` to serialize Date values when appending to FormData:

```js
// ❌ WRONG — produces "Fri Jan 01 2010 00:00:00 GMT-0200 ..." → Postgres error 22007
formData.append("dt_nascimento", String(paciente.dt_nascimento));

// ✅ CORRECT
formData.append("dt_nascimento", paciente.dt_nascimento.toISOString());
```

### Test file naming & structure

- Integration tests: `tests/integration/api/v1/<resource>/<method>.test.js` (e.g. `put.test.js`)
- `describe()` per endpoint or scenario group; `test()` per case, in Portuguese: `"Deve retornar 400 quando..."`
- Each test is self-contained: create all necessary fixtures (terapeutas, pacientes, agendamentos) inside the test or `beforeAll` of the describe block
- Do not share mutable state between `test()` blocks — use `Date.now()` suffixes on names/emails for uniqueness

## External dependencies & integrations

- Postgres is the primary datastore (`infra/database.js` supports `DATABASE_URL` or `POSTGRES_*` vars, with SSL in prod/staging).
- File/image handling uses Cloudinary (`next.config.js` remotePatterns include `res.cloudinary.com`).

## When adding new code

- Prefer new API endpoints under `pages/api/v1/<resource>/` and new DB logic in `models/<resource>.js`.
- Keep trailing slashes on API endpoints when following existing client calls (e.g., `/api/v1/auth/login/`).
- Keep error handling consistent with `infra/errors.js` + `controller.errorHandlers`.
- For new migrations: generate a Unix timestamp for the filename prefix. Use `gen_random_uuid()` for PKs and `timezone('utc', now())` for timestamps. Set `exports.down = false`.

## Reference docs

See [`docs/README.md`](../docs/README.md) for an index of all design and implementation docs.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, this block is auto-populated
by Spec Kit from its generated spec and plan artifacts.

<!-- SPECKIT END -->
