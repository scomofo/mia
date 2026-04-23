<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-Drizzle-003b57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude-Powered-d97706?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-Installable-5a0fc8?style=for-the-badge&logo=pwa&logoColor=white" />
</p>

<h1 align="center">Mia</h1>

<p align="center">
  <strong>A dietitian in your pocket — answer 15 questions, cook your week.</strong>
</p>

<p align="center">
  <em>Chat-based intake · 11 coach personas · Claude-generated 7-day plans · grocery list with PC Optimum &amp; Co-op offers · daily check-ins · all local.</em>
</p>

---

## What it does

Mia walks you through a short conversation about how you eat, move, and cook. It ranks eleven nutrition-coach "personas" against your answers, you pick the one that resonates, and Claude writes you a tailored 7-day meal plan — complete with a categorized grocery list priced to your local stores, per-meal recipes on demand, and daily check-ins that feed back into future plans.

No accounts. No cloud database. Everything lives in a single SQLite file on your machine.

## Highlights

| Feature | Description |
|:--------|:------------|
| **Chat Intake** | 15 questions covering age, body, activity, goals, household, cooking style, restrictions, loves, hard-nos, budget, and more |
| **11 Coach Personas** | Ranked against your answers — pick the one that fits, or browse all |
| **7-Day Plan** | Claude generates a full week tailored to your profile, calorie target, and protein target |
| **Grocery List** | Categorized shopping list with PC Optimum and Camrose Co-op offers baked in |
| **On-Demand Recipes** | Ingredients + step-by-step instructions for any meal, cached after first open |
| **Meal Swaps** | One-click swap that respects your loves/hates and keeps the same time + calorie band |
| **Dashboard** | Macro ring driven by meals marked eaten |
| **Daily Check-ins** | Weight, energy, adherence, cravings, free-form notes to Mia |
| **Installable PWA** | Add to home screen; works after first load |
| **Local-First** | SQLite at `app/data/mia.db` — your data never leaves the device |

## Getting started

```bash
cd app
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open <http://localhost:3000>. The first visit walks you through chat → persona → plan generation. Subsequent visits boot straight into the dashboard.

### Production

```bash
cd app
npm run build
npm run start    # serves on http://localhost:3333
```

### Database

```bash
npm run db:generate    # drizzle-kit generate
npm run db:push        # drizzle-kit push
npm run db:studio      # drizzle-kit studio
```

Tables auto-init on first connect, so fresh clones work with no setup.

### Skip the chat (dev)

```bash
node scripts/seed-plan.mjs
```

Seeds a plan so you can jump straight into dashboard/grocery/recipe work.

### Access from your phone

Mia binds to `0.0.0.0` so any device on your LAN can reach it. On the laptop, run `ipconfig` and point your phone at `http://<laptop-ip>:3000`.

For a nicer cross-network setup (works on cell data, stable hostname, optional HTTPS for real PWA install), a one-shot Tailscale script is provided:

```powershell
pwsh -File scripts/setup-tailscale.ps1 -Funnel
```

After sign-in, your phone can reach the laptop at `https://<hostname>.<tailnet>.ts.net` from anywhere. Install Tailscale on the phone too and sign in with the same account.

## Routes

| Route | Purpose |
|---|---|
| `GET /api/state` | Current user answers + active plan |
| `DELETE /api/state` | Wipe user, plan, grocery list, recipes, check-ins |
| `POST /api/generate-plan` | Claude → 7-day meal plan; persists `users` + `plans` |
| `POST /api/regenerate-plan` | Claude → fresh week reusing saved answers + prompt |
| `POST /api/regenerate-day` | Claude → one day's 4 meals, respects any day note |
| `GET / POST /api/generate-grocery` | Claude → categorized grocery list; cached per plan |
| `GET / POST /api/generate-recipe` | Claude → ingredients + steps; cached per (plan, day, idx) |
| `POST /api/swap-meal` | Claude → replacement meal (optional reason), same band |
| `POST /api/mark-eaten` | Toggle a meal's `eaten` flag |
| `POST /api/toggle-skip-day` | Flip `skipped` on a day (excluded from grocery gen) |
| `POST /api/update-day-note` | Save a free-text note used by regenerate-day |
| `POST /api/update-targets` | Patch active plan's calorie / protein targets |
| `POST /api/update-prefs` | Patch user loves / hates / restrictions |
| `GET / POST /api/checkin` | Daily weight / energy / adherence / cravings / note |

Every Claude-generating route caches by a stable key — refreshing never re-bills.

## Schema

```
users          (id, age, sex, height_cm, weight_kg, activity, goal, household,
                week_pattern, cooking_style, time_per_meal_min,
                restrictions, loves, hates, budget_week_cad,
                home_store, pc_optimum_*, coop_*, raw_answers, created_at)
plans          (id, user_id, prompt_id, calories_target, protein_target,
                summary, days_json, active, started_on)
grocery_lists  (id, plan_id, categories_json, estimated_cad)
recipes        (id, plan_id, day_key, meal_idx, ingredients_json, steps_json)
checkins       (id, user_id, date, weight_lb, energy, adherence, cravings, note_to_mia)
```

Complex shapes (days, categories, ingredients, steps) are stored as JSON text columns — SQLite plus the Drizzle type layer keeps it simple without sacrificing structure.

## Structure

```
Mia/
├── app/                    ← the Next.js 16 app (all npm commands run here)
│   ├── app/                ← App Router: page.tsx + api/*
│   ├── components/         ← ChatApp, PromptSelect, PlanScreens, HomeScreens, MiaApp
│   ├── lib/                ← db, schema, generate-plan, prompt-builder
│   ├── public/             ← manifest.webmanifest, sw.js, icons
│   ├── scripts/seed-plan.mjs
│   └── data/mia.db         ← local SQLite (gitignored)
└── design/
    └── meal-plan-planner/  ← original hi-fi prototype (vanilla React + in-browser Babel)
```

The `design/` folder is the reference prototype that `app/` was ported from. Ship changes to `app/`.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, **TypeScript 5**, **Tailwind CSS 4**
- **better-sqlite3 + Drizzle ORM** — typed queries over a single local file
- **@anthropic-ai/sdk ^0.90** — Claude calls for plans, groceries, recipes, swaps
- **PWA** — installable via `manifest.webmanifest` + service worker

## Platform

Built on Windows 11. Nothing in the stack is Windows-specific — macOS and Linux work out of the box.

## Location quirk

The prompt builder currently hard-codes `Location: Camrose, AB, Canada (shops at Real Canadian Superstore + Camrose Co-op)`. Groceries and PC Optimum / Co-op offers assume that context. Change `app/lib/prompt-builder.js` if you're shopping somewhere else.
