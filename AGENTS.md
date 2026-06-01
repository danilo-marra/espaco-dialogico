# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js application using the `pages/` router. Page views live in `pages/`, API handlers in `pages/api/`, shared UI in `components/`, reusable hooks in `hooks/`, Redux slices in `store/`, and helpers in `utils/` and `src/lib/`. Database access, migrations, seeds, and service scripts are under `infra/`; domain models are in `models/`. Static assets are in `public/`, global styles in `styles/`, documentation in `docs/`, specs in `specs/`, and tests in `tests/`.

## Build, Test, and Development Commands

Use Node `22.x`.

- `npm run dev`: starts Docker services, waits for Postgres, runs migrations, and launches Next.js locally.
- `npm run dev:safe`: same setup, with Next launched through `infra/scripts/start-next-dev.js`.
- `npm run build`: runs `next build`; non-dev/non-test builds may run migrations in `postbuild`.
- `npm test`: starts services, prepares the test database, starts Next, then runs Jest serially.
- `npm run test:frontend`: runs frontend tests in JSDOM.
- `npm run test:single -- path/to/test.test.js`: runs one test file.
- `npm run lint:eslint:check` and `npm run lint:prettier:check`: validate linting and formatting.
- `npm run services:up|stop|down`: manages Docker Compose services from `infra/compose.yaml`.
- `npm run migrations:up` / `npm run migrations:up:test`: apply development or test migrations.

## Coding Style & Naming Conventions

Use 2-space indentation from `.editorconfig`. Follow ESLint (`eslint:recommended`, Jest, Next core web vitals) and Prettier. Unused variables are errors unless prefixed with `_`. React components and modals use PascalCase, such as `NovoPacienteModal.tsx`; hooks use `useName.ts`; API route files follow Next conventions, including `[id]` dynamic segments. Keep generated shadcn/ui files in `src/components/ui/` aligned with their generator output.

## Testing Guidelines

Jest uses Next/JSDOM, Testing Library matchers, global setup/teardown, and `.env.test`. Name tests with `.test.js`, `.test.ts`, or `.test.tsx`. Prefer frontend tests for UI behavior and `tests/integration/api` for API/database behavior. Run `npm test` before broad changes and `npm run test:single -- <file>` while iterating.

## Commit & Pull Request Guidelines

Commits follow Conventional Commits via Commitizen and commitlint, for example `feat: implementar dashboard` or `fix(dashboard): validate period range`. Keep headers under 100 characters. Pull requests should describe the change, list validation commands, link related issues/specs, and include screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit secrets. `lint-staged` runs `secretlint` on staged files. Use `.env.*` files as references, keep local overrides in `.env.development.local`, and be careful with `migrations:reset:*`, especially for staging or production.
