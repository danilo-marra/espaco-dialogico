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
- Integration tests boot a real Next dev server. Run with `npm run test` (`--runInBand` is required — tests are sequential). Use `npm run test:frontend` for component tests only.
- Each integration test calls `orchestrator.clearDatabase()` in `beforeAll`. Auth helpers: `ensureDevAdminExists()` and `prepareAuthentication(port)` from `tests/helpers/auth.js`.
- Env loaded from `.env.test`. Email API routes are excluded from tests (see `jest.config.js`).

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
