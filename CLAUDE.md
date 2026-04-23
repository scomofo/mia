# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mia is a PWA "dietitian in your pocket": a 15-question onboarding chat ranks 11 nutrition-coach personas, then Claude generates a 7-day meal plan, grocery list with PC Optimum / Co-op offers, per-meal recipes, and daily check-ins. Everything persists to a local SQLite file — no auth, no cloud DB.

## Layout

- `app/` — the Next.js 16 application (all commands run from here)
- `design/meal-plan-planner/` — original standalone hi-fi prototype (vanilla React + in-browser Babel) that `app/` was ported from. Reference only; do not ship changes here.

## Commands (run from `app/`)

- `npm run dev` — Next.js dev server at http://localhost:3000
- `npm run build && npm run start` — production build on port 3333
- `npm run db:generate` / `npm run db:push` / `npm run db:studio` — Drizzle migrations + studio
- `node scripts/seed-plan.mjs` — seed a plan without going through the chat flow
- No lint or test runner configured

Required env: `ANTHROPIC_API_KEY` in `app/.env.local`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind 4 · better-sqlite3 + Drizzle ORM · Anthropic SDK (`@anthropic-ai/sdk` ^0.90).

**Next.js 16 warning:** breaking changes from training data. `app/AGENTS.md` (referenced by `app/CLAUDE.md`) instructs to check `node_modules/next/dist/docs/` before writing Next.js code.

## Architecture

### Route handlers (`app/app/api/`)
All Claude-generating endpoints cache per plan — re-POSTing is cheap after the first call.

| Route | Purpose |
|---|---|
| `state` | GET current user + active plan; DELETE wipes everything |
| `generate-plan` | Claude → 7-day plan; creates `users` + `plans` |
| `generate-grocery` | Claude → categorized grocery list w/ PC Optimum / Co-op offers; cached per plan |
| `generate-recipe` | Claude → ingredients + steps for one meal; cached per (plan, day, idx) |
| `swap-meal` | Claude → replacement meal respecting loves/hates + same time/calorie band |
| `mark-eaten` | Toggle a meal's `eaten` flag (drives Dashboard macro ring) |
| `checkin` | Daily weight / energy / adherence / cravings / free-form note |

### Core modules (`app/lib/`)

- `schema.ts` — Drizzle schema: `users`, `plans`, `grocery_lists`, `recipes`, `checkins`. Complex shapes (days, categories, ingredients, steps) stored as JSON text columns.
- `db.ts` — better-sqlite3 connection, auto-inits tables on first connect
- `generate-plan.js` — Claude call for 7-day plan generation
- `prompt-builder.js` — assembles user-answer context for Claude prompts

### UI (`app/components/`)
`MiaApp.jsx` is the top-level shell. Flow: `ChatApp.jsx` (15-question intake) → `PromptSelect.jsx` (persona pick) → `PlanScreens.jsx` + `HomeScreens.jsx` (dashboard/grocery/recipe/check-in). `ServiceWorkerRegister.jsx` registers the PWA SW.

### Data

SQLite file at `app/data/mia.db`. Tables auto-init on first connect. No migrations required for dev — `db:push` is used ad-hoc when the schema changes.

### PWA

`app/public/manifest.webmanifest` + `app/public/sw.js`. Icons at 180/192/512/1024. Installable from any screen once generated plan exists.

## Conventions

- Components use `.jsx` (not `.tsx`) even though the project is TS — only lib/ and scripts use TS.
- Claude-generating endpoints must cache by stable key (plan id, or plan+day+idx) — avoid re-billing on refresh.
- Screens after onboarding assume a generated plan exists; guard with `/api/state` before rendering.
