# Copilot instructions for Espaço Dialógico

## Big picture architecture

- Next.js app (pages router) with API routes under `pages/api/v1/**` using `next-connect` routers.
- Backend data access is centralized in `models/**`, which call `infra/database.js` (PostgreSQL) and throw `infra/errors.js` types.
- API routes wrap handlers with `controller.errorHandlers` from `infra/controller.js` for consistent error responses.
- Auth is JWT + server-side session table: `/api/v1/auth/login/` invalidates previous sessions and increments `token_version` (see `models/userSession.js` and `models/user.js`), while clients store `authToken` + `user` in `localStorage`.
- Role/permission enforcement is layered: `utils/authMiddleware.js` → `utils/roleMiddleware.js` → (optional) `utils/terapeutaMiddleware.js` for therapist-specific access rules.

## Frontend data flow & patterns

- Use `utils/api.ts` (`axiosInstance`) for client/server API calls; it injects the auth token, adds perf metadata, and retries for `/agendamentos/` updates.
- SWR hooks in `hooks/useFetch*.ts` use `axiosInstance` and specific cache strategies (custom `compare`, `refreshInterval`). Keep these patterns when adding new hooks.
- For ad‑hoc API calls in components, prefer `hooks/useApi.ts` (wraps `authenticatedFetch`) to get loading/error handling.
- Auth state lives in `hooks/useAuth.ts` and is enforced client-side with periodic checks (`/api/v1/me/`). Do not bypass this logic in new pages.

## API route conventions (important)

- Routes typically export `router.handler(controller.errorHandlers)` and register methods via `router.get/post/...` (see `pages/api/v1/agendamentos/index.js`).
- Most routes require `authMiddleware` + `requirePermission(<resource>)`. Therapist-specific routes also add `requireTerapeutaAccess()` and access checks like `terapeutaTemAcessoPaciente()`.
- Status endpoint `/api/v1/status/` checks database connectivity (see `pages/api/v1/status/index.js`).

## Dev & test workflows

- `npm run dev` starts Docker Postgres, waits for DB, runs migrations, then starts Next (`infra/compose.yaml` maps 5434→5432).
- `npm run dev:safe` is the same but launches Next with a manual start script (see `infra/scripts/start-next-dev.js`).
- Tests rely on `.env.test` + Next dev server; use `npm run test` or `npm run test:frontend`. Jest config is in `jest.config.js` and avoids email API routes.

## External dependencies & integrations

- Postgres is the primary datastore (`infra/database.js` supports `DATABASE_URL` or `POSTGRES_*` vars, with SSL in prod/staging).
- File/image handling uses Cloudinary (`next.config.js` remotePatterns include `res.cloudinary.com`).

## When adding new code

- Prefer new API endpoints under `pages/api/v1/<resource>/` and new DB logic in `models/<resource>.js`.
- Keep trailing slashes on API endpoints when following existing client calls (e.g., `/api/v1/auth/login/`).
- Keep error handling consistent with `infra/errors.js` + `controller.errorHandlers`.
