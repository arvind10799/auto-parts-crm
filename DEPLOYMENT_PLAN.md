# Auto Parts CRM Deployment Plan

This plan deploys the frontend on Vercel, backend on Render, and PostgreSQL on Neon. It does not require application code rewrites.

## Repository Analysis

- Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS.
- Backend: NestJS 11, modular architecture, TypeScript.
- Database: PostgreSQL.
- ORM: Prisma Client with migrations in `backend/prisma/migrations`.
- Auth: Email/password login, bcrypt password hashing, Nest Passport JWT Bearer auth, role guard RBAC, Next.js HTTP-only secure cookies.
- Runtime dependency: Redis-compatible datastore for BullMQ order lifecycle jobs and optional order-list caching.
- Package manager: npm with `package-lock.json` in both `frontend` and `backend`.
- Recommended Node runtime: Node.js 20.

## Environment Variables

Backend production variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@PROJECT-pooler.REGION.aws.neon.tech/DB_NAME?sslmode=require&schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@PROJECT.REGION.aws.neon.tech/DB_NAME?sslmode=require&schema=public"
JWT_SECRET="long-random-secret"
JWT_EXPIRES_IN_SECONDS=86400
NODE_ENV=production
PORT=10000
REDIS_HOST="render-key-value-host"
REDIS_PORT=6379
REDIS_USERNAME=""
REDIS_PASSWORD=""
REDIS_DB=0
REDIS_CACHE_ENABLED=true
REDIS_CACHE_KEY_PREFIX="auto-parts-crm:cache:"
REDIS_TLS_ENABLED=false
REDIS_CONNECT_TIMEOUT_MS=5000
ORDERS_CACHE_TTL_SECONDS=60
BULLMQ_PREFIX="auto-parts-crm"
```

Frontend production variables:

```env
NEXT_PUBLIC_APP_NAME="Auto Parts CRM"
NEXT_PUBLIC_APP_URL="https://your-vercel-app.vercel.app"
NEXT_PUBLIC_API_TIMEOUT_MS=10000
NEXT_PUBLIC_TOAST_DURATION_MS=5000
BACKEND_API_URL="https://your-render-api.onrender.com"
BACKEND_API_TIMEOUT_MS=10000
AUTH_COOKIE_MAX_AGE_SECONDS=86400
```

Missing or deployment-only variables:

- `DIRECT_URL`: not read by application code, but needed in Render migration commands so Prisma migrations use Neon's direct connection.
- `PORT`: optional locally, supplied by Render for web services.
- `NODE_ENV`: supplied by hosting platforms; set to `production` for Render.
- `SEED_USER_PASSWORD`: optional, only used by `backend/prisma/seed.ts`.

## PostgreSQL And Prisma

- Current Prisma datasource uses `env("DATABASE_URL")`.
- Use Neon pooled connection for the running backend in `DATABASE_URL`.
- Use Neon direct connection for migrations by overriding `DATABASE_URL` in migration commands with `DIRECT_URL`.
- Validated with `.\node_modules\.bin\prisma.cmd validate --schema prisma\schema.prisma`.
- Migration strategy: commit all migration folders, run `prisma migrate deploy` before each backend release, then start the Nest app.

Prisma deployment commands:

```bash
cd backend
npm ci
npx prisma generate
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
npm run build
npm run start:prod
```

## Render Backend Configuration

Render Web Service:

- Root directory: `backend`
- Runtime: Node
- Instance type: Free for testing, paid for production reliability
- Build command, paid/recommended: `npm ci && npx prisma generate && npm run build`
- Pre-deploy command, paid/recommended: `DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy`
- Build command, free-compatible: `npm ci && npx prisma generate && DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy && npm run build`
- Start command: `npm run start:prod`
- Health check path: `/`
- Environment: backend variables listed above

Optional Render Background Worker:

- Root directory: `backend`
- Runtime: Node
- Build command: `npm ci && npx prisma generate && npm run build`
- Start command: `npm run start:worker`
- Environment: same backend Redis variables
- Note: needed to process BullMQ jobs, but Render free instances do not support background workers.

Render Key Value:

- Required because `OrdersModule` imports BullMQ jobs.
- Use same Render region as backend.
- Recommended maxmemory policy: `noeviction` for queues.
- Free Render Key Value is in-memory only and can lose queue/cache data on restart.

## Vercel Frontend Configuration

- Project root directory: `frontend`
- Framework preset: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: leave default; Vercel auto-detects Next.js output
- Node.js version: 20.x
- Environment: frontend variables listed above
- Production URL: update `NEXT_PUBLIC_APP_URL` after Vercel assigns the final domain.

## Localhost And Production URLs

Localhost values found:

- `frontend/.env.example`: replaced with Vercel/Render placeholders.
- `backend/.env.example`: replaced local PostgreSQL/Redis placeholders.
- `frontend/src/lib/constants/app.ts` and `frontend/src/lib/constants/api.ts`: development defaults only; production env variables override them.
- `frontend/src/features/auth/lib/permissions.ts`: `http://localhost` is only a URL parser base for relative redirects, not a deployment endpoint.
- Old generated logs and `tools/create_deployment_*` scripts contain legacy local/RDS examples; they are not runtime app URLs.

No source URL replacement is required for production if Vercel and Render env variables are set.

## Deployment Order

1. Push current repository to GitHub.
2. Create a Neon project and database.
3. Copy both Neon connection strings: pooled URL to `DATABASE_URL`, direct URL to `DIRECT_URL`.
4. Create Render Key Value in the same region planned for the backend.
5. Create Render Web Service from the Git repo with root directory `backend`.
6. Add backend env vars in Render.
7. Use the paid pre-deploy command or the free-compatible build command listed above.
8. Deploy Render backend and confirm `https://your-render-api.onrender.com/` returns HTTP 200.
9. Create Vercel project from the same Git repo with root directory `frontend`.
10. Add frontend env vars in Vercel, using the Render backend URL for `BACKEND_API_URL`.
11. Deploy Vercel frontend.
12. Update `NEXT_PUBLIC_APP_URL` to the final Vercel production URL and redeploy frontend.
13. Seed or create the first admin/user account if needed.
14. Log in and test dashboard, leads, orders, shipments, and notes flows.

## Deployment Checklist

- All migrations are committed.
- `backend/prisma/schema.prisma` validates.
- Backend production build passes.
- Frontend production build passes.
- Render backend has Neon `DATABASE_URL` and `DIRECT_URL`.
- Render backend has Redis-compatible env vars.
- Render health check path is `/`.
- Vercel frontend has `BACKEND_API_URL` set to Render HTTPS URL.
- Vercel frontend has `NEXT_PUBLIC_APP_URL` set to final HTTPS frontend URL.
- `JWT_SECRET` is a strong unique production secret.
- No production env variable points to localhost.

## Free-Tier Fit And Risks

- Vercel Hobby can host the Next.js frontend for a small/personal CRM.
- Render Free can host the Nest web service for testing, but it spins down when idle and cold starts can take about a minute.
- Neon Free can host the database for low/intermittent use, but storage and compute quotas must be monitored.
- Render Key Value Free can support Redis-compatible cache/queue testing, but it is in-memory only and may lose data on restart.
- Render Background Workers are not a free service type, so BullMQ jobs will not be processed on an all-free Render setup unless the worker is omitted or moved to a paid/alternative host.
- Render pre-deploy commands are paid-only; on free, run migrations inside the build command or manually from a trusted machine before deploy.
- The backend Dockerfile CMD uses `dist/main` and `dist/worker`, while the npm scripts use `dist/src/main` and `dist/src/worker`; prefer Render native Node commands unless the Dockerfile is corrected.

## Commands

Local verification:

```powershell
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build
cd backend
.\node_modules\.bin\prisma.cmd validate --schema prisma\schema.prisma
```

Render backend commands:

```bash
# paid/recommended
npm ci && npx prisma generate && npm run build
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
npm run start:prod

# free-compatible single build command
npm ci && npx prisma generate && DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy && npm run build
```

Vercel frontend commands:

```bash
npm ci
npm run build
```

Manual deployment from local Git:

```bash
git status
git add backend/.env.example frontend/.env.example DEPLOYMENT_PLAN.md
git commit -m "Add deployment plan and production env examples"
git push origin main
```
