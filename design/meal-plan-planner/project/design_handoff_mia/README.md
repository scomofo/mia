# Handoff: Mia — Pocket Dietitian iOS App

## Overview

Mia is a mobile-first app that replaces the "I'll figure out dinner later" scramble with a 3-minute chat and a dietitian-grade weekly plan. The user has a 15-question conversation with Mia (a fictional dietitian persona), the app matches them against 12 Nav Toor–style nutrition-coach playbooks, the best-fit "prompt" goes to an LLM with their profile, and out comes a personalized 7-day meal plan with grocery list, recipes, and daily check-ins.

**Primary user:** Camrose, AB, Canada — PC Optimum cardholder, Camrose Co-op member, family with split-custody kids. Loyalty-program awareness is baked into the grocery flow.

**Core loop:** `Chat onboarding → Prompt match → Refine targets → Generate plan → Grocery → Cook → Check-in → Adjust`

## About the Design Files

The files in this bundle are **design references created in HTML** — an interactive prototype showing the intended look and behavior. They are **not production code to copy directly**. The task is to **recreate these designs in the target codebase's environment** (SwiftUI recommended — see stack below) using its established patterns and libraries.

Open `mia.html` in any modern browser to interact with the live prototype. It's structured as a single document that loads React/Babel-transpiled JSX modules from `src/`. The Tweaks panel (toolbar toggle) exposes accent colors and a screen jump-nav so you can see all 10 screens without walking the flow.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, interactions, and copy. Pixel-perfect mockup. Recreate faithfully using the target codebase's component libraries and styling system.

- Phone canvas: 402 × 874 (iPhone 15 Pro)
- All type sizes, spacing, radii, and shadows are final
- Colors use OKLCH — convert to nearest hex/RGB if target platform doesn't support OKLCH
- Tactile interactions (sheet springs, spinner, day-switcher fades) are final and should be matched

## Tech Stack Recommendation

| Layer | Choice | Why |
|---|---|---|
| iOS client | SwiftUI + Swift 5.10 | Matches the prototype's tactile feel |
| State | `@Observable` + SwiftData | Local plan/check-in cache |
| LLM | Anthropic Claude (Haiku 4.5) via backend proxy | Never ship API key in client |
| Backend | Node/TS on Cloudflare Workers OR Supabase Edge Functions | Proxies Claude, stores profiles + plans |
| Auth | Sign in with Apple + email magic link | Low friction |
| Payments | RevenueCat | $9.99/mo Mia Premium = unlimited regenerations |
| Push | APNs (OneSignal or direct) | Daily check-in reminder 8pm local |

Full rationale and tradeoffs in `HANDOFF.md` (the long-form build doc — READ THIS SECOND, after this README).

## Screens / Views

All screens live on a 402 × 874 iPhone canvas. Background is warm cream (`#FAF5E9`) with a subtle paper-grain overlay.

### 01 — Conversational Onboarding (`chat`)
**Purpose:** Gather 15 data points through a chat with "Mia."
**File:** `src/chat-ui.jsx` (renderer) + `src/chat-flow.jsx` (script) + `src/questions.jsx` (input widgets)

**Layout:**
- Full-screen chat thread
- Bubbles: Mia on left (white card), user on right (olive `var(--olive-deep)`)
- Input dock at bottom: chips / slider / age input / body stats input depending on turn type
- Typing indicator: 3 pulsing dots in a white bubble

**Turn types** (all scripted in `CHAT_FLOW`):
1. `message` — Mia speaks, no user reply
2. `quick-reply` — single-select chips
3. `chips` — multi-select chips (with optional `min` / `max`)
4. `slider` — numeric with marks
5. `input-age` — numeric keypad
6. `body-input` — sex + height + weight composite
7. `thinking` — 1.6s spinner before final message

**The 15 questions** (field name → options):
- `household` (Just me / Partner / Family / Split custody)
- `pattern` (Same every day / Weekdays vs weekends / Alternating weeks / Shifts constantly)
- `kids` (None / <5 / 6-12 / 13+ / Mixed)
- `goal` (Lose fat / Build muscle / Maintain / Energy / Health / Family)
- `age` (number)
- `body` `{sex, h, w}`
- `activity` (Sedentary / Light / Moderate / Very / Athletic)
- `cooking` (Assembly / Weeknight 20m / Sunday prep / Daily)
- `time` (slider: 10–75 min per meal)
- `restrictions` (multi: vegetarian, pescatarian, GF, DF, nut, shellfish, halal, kosher, low-FODMAP)
- `loves` (multi, min 2: cuisines + food-types)
- `hates` (multi: mushrooms, liver, cilantro, tofu, olives, fish, spicy, bitter)
- `pain` (multi, max 2: planning, grocery, cooking, snacking, social, tracking, kids)
- `budget` (<$100 / $100–200 / $200–350 / Open)
- `depth` (Light touch / Balanced / Precise)

**Copy tone for Mia:** Warm, brief, second-person, occasional pragmatism ("Sunday prep is honestly the cheat code when kids are 4 nights on, 3 nights off"). See `chat-flow.jsx` for exact strings.

### 02 — Ranked Recommendations (`select`)
**Purpose:** Show the best-fit prompt as a hero + 3 runner-ups.
**File:** `src/prompt-select.jsx`

**Layout:**
- Header: "A match for you" in italic serif, 30px
- Hero card: full-width, 200px tall, olive gradient, prompt title + tagline + outputs checklist + "Use this prompt" primary CTA
- 3 runner-up cards below: white, 80px tall each, icon + title + fit score + chevron
- "Browse all 11" button at bottom

### 02b — Browse All (`browse`)
**Purpose:** Full catalog of 12 prompts, still fit-ranked.
**File:** `src/prompt-select.jsx` (`BrowseAllScreen`)

**Layout:** Grid of cards, each showing icon, title, tagline, complexity dots (1–3), duration.

### 03 — Refine (`refine`)
**Purpose:** Let user review their derived profile and adjust calorie/protein targets before hitting Generate.
**File:** `src/plan-screen.jsx` (`RefineScreen`)

**Layout:**
- Step indicator ("Step 3 of 3 · Refine") at top
- Selected prompt pill (white card, icon + title)
- Title: "Fine-tune before *generating*"
- Profile chips grid (2 col): Goal, Household, Cooking, Time/meal, Activity, Budget
- Restrictions chip row (tomato-soft pills) if any
- **Daily calories slider** (1400–3500, step 50) with live big italic serif number
- **Protein slider** (80–250g, step 5)
- "You'll get" list (outputs of the selected prompt) on olive-soft background
- Sticky bottom: olive-deep pill CTA "Generate my plan →"

Calorie estimate is seeded with Mifflin-St Jeor using sex + weight + age + activity, adjusted by goal (-400 for fat loss, +300 for muscle).

### 04 — 7-Day Plan (`plan`)
**Purpose:** Display the generated plan, day by day. **LIVE CLAUDE CALL.**
**File:** `src/plan-screen.jsx` (`PlanPreviewScreen`)

**Layout:**
- Hero (olive-deep gradient, white text, bottom-rounded corners):
  - Back button (circular, translucent white)
  - Eyebrow: "Your plan · generated just now"
  - Title: "Your *7-day* meal plan" (36px serif)
  - Stats row: Target kcal / Protein g / Meals total
  - **Loading state:** translucent strip with spinner + "Mia is cooking up your week…"
  - **Success state:** italic summary line from Claude ("Family-friendly week with Sunday prep")
  - **Error state:** "Using sample plan — Mia is offline" (falls back to `SAMPLE_DAYS`)
- Day switcher: 7 horizontally-scrolling pills (MON–SUN). Active = dark ink fill + white text. Kid-night days = italic number + tangerine color.
- Day title: "Monday" italic serif + optional "KIDS NIGHT" badge (tangerine-soft)
- Meals list: 4 cards per day (Breakfast / Lunch / Dinner / Snack), each with slot badge, name, kid-friendly script label, kcal + time, chevron
- Sunday batch-prep meal: olive-soft background instead of white
- Sticky bottom: Restart button + "Get grocery list →" primary

**Claude contract (exact):** See §6 of `HANDOFF.md`. Summary:
- Request: profile blob + prompt title → JSON only
- Response shape: `{summary, days: [{day, kid, meals: [{t, name, cal, time, kid?, prep?}]}]}`
- 7 days MON–SUN, 4 meals each
- Hit calorie target ±100 kcal
- Extract JSON robustly with `/\{[\s\S]*\}/` (model sometimes wraps)

### 05 — Home Dashboard (`home`)
**Purpose:** Day-of view. What am I eating today?
**File:** `src/home-screens.jsx` (`Dashboard`)

**Layout:**
- Hero: warm tangerine-cream gradient, giant italic "m" glyph as decoration
- Greeting: "Good *morning*" (36px serif) + date eyebrow + avatar circle (tap → settings)
- Macro ring: 3 concentric SVG stroke-dasharray rings (protein / carbs / fat), inner kcal total
- Today's meals: vertical list, same card pattern as Plan
- Quick tiles grid (2 col): Grocery list, Recipes, Check-in, Adjust plan
- Bottom nav: Home / Plan / Grocery / Check-in / Me (5 tabs, olive-deep active, SVG icons)

### 06 — Grocery List (`grocery`)
**Purpose:** Generated list with PC Optimum + Co-op offer pills + send-to-store.
**File:** `src/home-screens.jsx` (`GroceryScreen`)

**Layout:**
- `ScreenHeader` with title "Grocery list" + item count pill (e.g. `3/24`)
- **Store picker:** segmented control (RCSS Camrose · PC Optimum / Camrose Co-op · Member #) — white active, transparent inactive
- **Savings summary card:** loyalty strip showing `5,750 pts loaded` + `$16.17 Co-op savings`
- **Category sections:** Produce / Protein / Pantry / Dairy
  - Each item row: checkbox, name + qty, optional offer pill
  - Offer pills: PC yellow (`#fef3c7` / `#78350f`), Co-op blue (`#dbeafe` / `#1e3a8a`), Sale gray
- Sticky bottom CTA: "Send to PC Express" (if RCSS) or "Send to Instacart" (if Co-op) → opens bottom sheet

**Send sheet:**
- Backdrop `rgba(31,36,25,0.45)` + 220ms slide-up spring
- Primary option (full-width CTA) based on selected store
- 4 secondary tiles: Text / Email / Apple Notes / Print

### 07 — Recipe Detail (`recipe`)
**Purpose:** Single meal deep-dive.
**File:** `src/home-screens.jsx` (`RecipeScreen`)

**Layout:**
- Hero image placeholder (gradient swatch, 240px tall)
- Title (serif, 32px)
- Stats strip: kcal / protein / time / servings (mono labels + italic serif numbers)
- Ingredients list (with qty)
- Steps list (numbered)
- Bottom: "Start cooking" primary CTA

### 08 — Daily Check-in (`checkin`)
**Purpose:** End-of-day reflection → adjusts next week's plan.
**File:** `src/home-screens.jsx` (`CheckinScreen`)

**Layout:**
- "How was today?" title
- Weight input (optional, lb)
- Energy: 5-dot scale with sliding indicator, labels "Drained ↔ Charged"
- Adherence: 0–100 slider with emoji states
- Cravings chips (multi): Sweet / Salty / Carbs / Alcohol / None
- Free-form note to Mia (textarea)
- "Save check-in" primary → triggers backend adjustment call

### 09 — Settings (`settings`)
**Purpose:** Identity, targets, loyalty programs, preferences.
**File:** `src/home-screens.jsx` (`SettingsScreen`)

**Layout:**
- Identity card: avatar (olive gradient) + name + email + "Edit profile"
- Section: Plan — calorie target / protein target / restart onboarding
- Section: **Store & loyalty** — RCSS Camrose home store + PC Optimum card + points balance · Camrose Co-op member # + equity balance
- Section: Preferences — notifications / units (metric+imperial hybrid) / dark mode toggle
- Section: App — export data, sign out, about

## Interactions & Behavior

### Chat (01)
- Bubbles animate in: 180ms opacity + 8px translate-y
- Typing indicator: 3 dots pulse with staggered 150ms delay
- Thinking turn: 1.6s spinner, then reveals next bubble
- User-reply bubbles appear instantly (optimistic); Mia's reply after 400–900ms delay per turn

### Plan generation (04)
- On mount: call `window.generatePlan(answers, prompt, tuning)` which calls `window.claude.complete`
- Status states: `idle → loading → done | error`
- Loading: heartbeat spinner in hero, sample days hidden
- Done: swap to `liveDays`, surface `summary` in hero
- Error: keep `SAMPLE_DAYS`, show subtle "Mia is offline" strip

### Day switcher (04, 05)
- Horizontal scroll, 7 pills
- Active = ink fill, white text
- Kid-night days: italic number + tangerine color when inactive, olive-tangerine mix when active

### Bottom sheet (06 Send)
- 180ms backdrop fade
- 220ms sheet slide-up using `cubic-bezier(0.32, 0.72, 0, 1)`
- 36×5 drag handle at top
- Primary option auto-swaps based on store picker

### Sliders (03, 08)
- Native `<input type="range">` with `accent-color: var(--olive-deep)`
- Live-updated big italic serif number above
- Mono min/mid/max labels below

### Macro ring (05)
- SVG stroke-dasharray animation 500ms ease
- 3 concentric rings with 4px stroke
- Inner big italic serif number + kcal label

## State Management

### Client-side state (SwiftData models)

```swift
@Model final class User { /* identity, body stats, preferences, loyalty cards */ }
@Model final class Plan { /* promptId, targets, summary, days[], active */ }
@Model final class PlanDay { /* index, label, isKidNight, meals[] */ }
@Model final class Meal { /* slot, name, kcal, minutes, kidFriendly, ingredients[], steps[], completed */ }
@Model final class Ingredient { /* name, qty, category, offer?, purchased */ }
@Model final class Offer { /* kind, label, estSavings, expires, store */ }
@Model final class Checkin { /* date, weight, energy, adherence, cravings[], note */ }
```

Full schemas in `HANDOFF.md` §4.

### Prompt ranking

Pure Swift port of `rankPrompts(answers) → RankedPrompt[]` from `src/prompts.jsx`. Scoring over goal, pain points, cooking style, and household. Returns prompts sorted by fit score descending.

### LLM calls

Four calls shape the product. Implement them as methods on a `MiaClient` class that proxies to your Cloudflare Worker:

1. **`generatePlan(profile, prompt, tuning) → Plan`** — built; contract in §6 of `HANDOFF.md`
2. **`expandRecipe(mealName, servings) → {ingredients[], steps[]}`** — for recipe detail (next)
3. **`rollUpGroceries(plan) → Ingredient[]`** — consolidates ingredients by category with sane quantities (next)
4. **`adjustPlan(checkins[7]) → {kcalDelta, proteinDelta, tacticNote}`** — weekly adjustment (next)

All four must enforce strict JSON output and robustly extract `/\{[\s\S]*\}/` from the response.

## Design Tokens

### Palette

```
/* Surfaces */
--cream:   #FAF5E9   base background
--cream-2: #F4EBD4   card bg alt
--cream-3: #EEDFBF   gradient accent

/* Text */
--ink:      #1F2419  primary text
--ink-2:    #3B3D32  secondary
--ink-3:    #6B6A58  muted
--ink-mute: #9A9680  extra muted
--divider:  rgba(31,36,25,0.08)

/* Accents (all OKLCH) */
--olive:       oklch(58% 0.12 130)   primary — avocado
--olive-deep:  oklch(42% 0.11 130)   primary CTA
--olive-soft:  oklch(92% 0.06 130)   primary background tint

--tomato:      oklch(64% 0.17 28)    secondary — ripe tomato
--tomato-soft: oklch(93% 0.06 28)

--tangerine:      oklch(78% 0.15 65) tertiary — kid-night accent
--tangerine-soft: oklch(94% 0.06 65)

--plum: oklch(45% 0.11 350)          rare accent

/* Loyalty-program colors */
PC Optimum yellow: bg #fef3c7  fg #78350f
Co-op blue:         bg #dbeafe  fg #1e3a8a
Flyer sale gray:    bg rgba(31,36,25,0.06)  fg var(--ink-2)
```

Alt accent themes (swappable via Tweaks panel): tomato / tangerine / plum — see `ACCENTS` in `src/app.jsx`.

### Type

| Role | Family | Fallback | Notes |
|---|---|---|---|
| Headings | `Instrument Serif` | Times New Roman | Italic accents for numbers & emphasis |
| Body | `Geist` | -apple-system, system-ui | 14–15px body |
| Labels | `Geist Mono` | ui-monospace | 10–11px, tracking 0.04–0.1em, UPPERCASE eyebrows |
| Accent | `Caveat` | cursive | "kid-friendly" script label only |

Sizes that appear most often:
- Screen title: **30px serif, 400 weight, -0.02em tracking**
- Card title: **20px serif, 400, -0.01em**
- Hero title: **36px serif, 400, -0.02em, lineheight 1**
- Body: **14–15px sans, 500**
- Stat number: **20–26px serif italic**
- Eyebrow: **10–11px mono, 0.04–0.1em, UPPERCASE**

### Radii

- 10 — small pills
- 12 — buttons, segmented controls
- 16–18 — cards
- 22 — identity card
- 28 — bottom sheets
- 999 — CTA pills, chips

### Shadows

- **Signature card shadow:** `0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)`
- **Primary CTA shadow:** adds `0 4px 14px rgba(66,77,34,0.25)` on olive-deep
- **Bottom sheet:** `0 -8px 32px rgba(0,0,0,0.12)`

### Spacing

4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 28 / 32 / 40. Cards pad 14–18, screens pad 16 horizontal, sticky bottom pad 16 sides + 36–40 bottom (home-indicator safe area).

## Assets

- **Prompt icons:** See `icons/` folder. Each prompt has an SVG illustration (e.g. `sunday-batch.svg`, `family-kitchen.svg`, `fat-loss.svg`). Style: single-line warm-cream line-art with olive accent. Recreate or commission similar.
- **Recipe imagery:** NOT included. Prototype uses gradient placeholders. Options:
  - Commission food photographer for top ~50 recipes
  - Generate with AI (cheap, inconsistent, legal gray — mentioned as open question in `HANDOFF.md` §13)
- **Fonts:** Google Fonts (Instrument Serif, Geist, Geist Mono, Caveat). All free / OFL.

## PC Optimum — Important Caveat

**There is no public PC Optimum API.** Loblaw uses Eagle Eye's AIR platform internally; it's not exposed to third parties. Ship in this order (full reasoning in `HANDOFF.md` §7):

1. **v1.0 — Deep-link** to `https://www.pcoptimum.ca/load?page=RCSSDigitalCouponBoard20220929` in `SFSafariViewController`. User loads offers in PC app, returns, marks loaded manually. Legally clean, zero maintenance, mediocre UX.
2. **v1.1 — Claude email parser.** User pastes weekly PC Optimum offer email into Mia; Claude extracts structured `Offer[]` from the text. Email format is consistent — works reliably.
3. **v2 — Loblaw partnership.** 6–12 month BD cycle; pitch meal-plan intent signals for real offer-feed API access.

**Co-op:** Similar story. Federated Co-operatives Ltd. (Camrose Co-op parent) has no public API. Store member # locally, user-entered equity balance, fuzzy-match member-deal SKUs from weekly flyer scrape.

## Flyer scraper (weekly cron)

Cloudflare Worker, scheduled Monday 06:00 MT:
1. Fetch current flyer PDFs (RCSS + Camrose Co-op, both public).
2. Send to Claude with extract prompt → `{sku, name, price, regPrice, storeId, validThru}[]`.
3. Write to `offers` table (Supabase).
4. Join with plan ingredients by fuzzy match (embedding similarity, >0.75 confidence).

## Files

### In this handoff bundle

| Path | Purpose |
|---|---|
| `README.md` | This doc — quick reference |
| `HANDOFF.md` | Long-form build doc (14 sections). Read after this README. |
| `mia.html` | Interactive prototype root. Open in browser. |
| `src/app.jsx` | Root, routing, Tweaks panel |
| `src/styles.css` | Design tokens, page shell |
| `src/chat-ui.jsx` | Chat bubble / input / typing primitives |
| `src/chat-flow.jsx` | 15-turn conversation tree |
| `src/questions.jsx` | Shared input widgets (age, body, slider, chips) |
| `src/prompts.jsx` | 12 Nav Toor prompts + `rankPrompts()` |
| `src/prompt-select.jsx` | Ranked recommendations + browse-all screens |
| `src/plan-screen.jsx` | Refine + PlanPreview (live Claude call) |
| `src/prompt-builder.jsx` | `buildProfile()` + `generatePlan()` Claude contract |
| `src/home-screens.jsx` | Dashboard, Grocery, Recipe, Check-in, Settings |
| `icons/` | Prompt SVG illustrations + bottom-nav glyphs |
| `frames/` | iOS device bezel component |
| `manifest.webmanifest`, `sw.js` | PWA shell for testing on phone |

### To run the prototype

1. Open `mia.html` in Chrome/Safari/Firefox.
2. Click the "Tweaks" toolbar toggle to jump between screens and swap accent colors.
3. The live Claude call runs through the prototype's built-in helper — in production, replace with your Cloudflare Worker proxy.

## Open Questions for the Engineering Team

1. **Medical liability** — "dietitian" vs. "nutrition coach"? Affects App Store category + disclaimer.
2. **Data residency** — Canadian users → PIPEDA compliance. Use Canadian region Supabase.
3. **Partner vs. independent** — pursue Loblaw partnership or stay retailer-neutral?
4. **Recipe imagery** — food photographer commission or AI-generated?
5. **Units** — confirm metric for body, imperial for recipe quantities (North American standard).

---

*Handoff prepared alongside the interactive HTML prototype. Start with this README, then dive into `HANDOFF.md` for the full engineering spec.*
