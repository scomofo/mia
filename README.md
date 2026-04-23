# Mia

A dietitian in your pocket — answers 15 questions, cooks your week.

A PWA that walks you through a short chat, ranks 11 nutrition-coach "personas" against your answers, generates a 7-day meal plan, a grocery list, per-meal recipes, and tracks daily check-ins. All generation goes through Claude; everything persists to a local SQLite file.

## Structure

- `app/` — the Next.js 16 application (App Router, Turbopack, React 19, Tailwind 4, better-sqlite3, Drizzle ORM, Anthropic SDK)
- `design/meal-plan-planner/` — the original standalone hi-fi prototype (vanilla React + Babel in-browser) that the production app is ported from

## Running the app

```bash
cd app
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open http://localhost:3000. First load walks you through the chat → prompt pick → plan generation. Dashboard, grocery, recipe, and check-in screens require a generated plan.

## Routes

| Route | Purpose |
|---|---|
| `GET /api/state` | Returns the current user answers + active plan |
| `DELETE /api/state` | Wipes user, plan, grocery list, recipes, check-ins |
| `POST /api/generate-plan` | Claude → 7-day meal plan; persists `users` + `plans` |
| `GET/POST /api/generate-grocery` | Claude → categorized grocery list with PC Optimum / Co-op offers; cached per plan |
| `GET/POST /api/generate-recipe` | Claude → ingredients + steps for a single meal; cached per (plan, day, idx) |
| `POST /api/swap-meal` | Claude → replacement meal that respects loves/hates + same time/calorie band |
| `POST /api/mark-eaten` | Toggle a meal's `eaten` flag (drives Dashboard macro ring) |
| `GET/POST /api/checkin` | Daily weight / energy / adherence / cravings / free-form note |

## Schema

```
users          (id, age, sex, weight_kg, activity, goal, household,
                week_pattern, cooking_style, time_per_meal_min,
                restrictions, loves, hates, raw_answers, ...)
plans          (id, user_id, prompt_id, calories_target, protein_target,
                summary, days_json, active, started_on)
grocery_lists  (id, plan_id, categories_json, estimated_cad)
recipes        (id, plan_id, day_key, meal_idx, ingredients_json, steps_json)
checkins       (id, user_id, date, weight_lb, energy, adherence, cravings, note_to_mia)
```

DB lives at `app/data/mia.db`. Tables auto-init on first connect.

## PWA

Installable via manifest + service worker. `/manifest.webmanifest` + `/sw.js` served from `app/public`. Icons at 180/192/512/1024.
