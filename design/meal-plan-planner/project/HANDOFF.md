# Mia — Engineering Handoff & Build Document

**Version:** 1.0 · Prototype complete, ready for native build
**Target:** iOS 17+ (SwiftUI preferred) · Android Q2 fast-follow
**Prototype:** `Meal Plan Planner.html` (React/HTML, runs in any browser)

---

## 1. What Mia is

A pocket dietitian app. The user has a 15-question chat with Mia, the app ranks 12 nutrition-coach "prompts" (Nav Toor-style expert playbooks) by fit, the user picks one, and an LLM generates a personalized 7-day meal plan, grocery list, and daily check-ins.

**Core loop:**
`Chat onboarding → Prompt match → Refine targets → Generate plan → Grocery → Cook → Check-in → Adjust`

**Canadian context baked in:** Camrose, AB user. PC Optimum + Co-op loyalty. RCSS + Camrose Co-op as default stores. Grocery list surfaces loaded PC offers and Co-op member pricing.

---

## 2. Tech stack recommendation

| Layer | Choice | Why |
|---|---|---|
| iOS client | SwiftUI + Swift 5.10 | Native feel, matches the prototype's tactile animations |
| State | `@Observable` + SwiftData | SwiftData for local plan/check-in cache |
| LLM | Anthropic Claude (Haiku 4.5) via backend proxy | Never ship API key in client |
| Backend | Node/TypeScript on Cloudflare Workers OR Supabase Edge Functions | Proxies Claude, manages PC Optimum OAuth (if feasible), stores user profile + plans |
| Auth | Sign in with Apple + email magic link | Low friction |
| Payments | RevenueCat | $9.99/mo Mia Premium — unlimited plan regenerations |
| Analytics | PostHog (self-host or cloud) | Product analytics without vendor lock |
| Push | APNs via OneSignal or direct | Daily check-in reminder at 8 pm local |

---

## 3. Screen inventory

| # | Screen | Prototype file | Notes |
|---|---|---|---|
| 01 | Conversational onboarding | `src/chat-ui.jsx` + `src/chat-flow.jsx` | 15-turn chat with Mia. Mix of chips, sliders, freeform. |
| 02 | Ranked recommendations | `src/prompt-select.jsx` | Hero card + 3 runners-up. |
| 02b | Browse all | same | Full 12-prompt catalog, still fit-ranked. |
| 03 | Refine | `src/plan-screen.jsx` (RefineScreen) | Adjust cals/protein before generate. |
| 04 | 7-day plan | `src/plan-screen.jsx` (PlanPreviewScreen) | Live LLM call. Loading state → plan. |
| 05 | Home dashboard | `src/home-screens.jsx` (Dashboard) | Day N. Today's meals + macro ring + quick tiles. |
| 06 | Grocery list | `src/home-screens.jsx` (GroceryScreen) | Store picker (RCSS / Co-op), loyalty strip, per-item offer pills, Send sheet. |
| 07 | Recipe detail | `src/home-screens.jsx` (RecipeScreen) | Photo + ingredients + steps. |
| 08 | Daily check-in | `src/home-screens.jsx` (CheckinScreen) | Weight, energy, adherence, cravings, note → adjusts plan. |
| 09 | Profile / settings | `src/home-screens.jsx` (SettingsScreen) | Identity, household, plan targets, **Store & loyalty** (PC Optimum + Co-op), prefs, app. |

---

## 4. Data model (SwiftData)

```swift
@Model final class User {
  var id: UUID
  var name: String
  var email: String
  var age: Int
  var sex: Sex
  var heightCm: Int
  var weightKg: Double
  var activity: ActivityLevel
  var goal: Goal           // .loseFat, .gainMuscle, .maintain, .energy, .kidsNutrition
  var household: String    // freeform: "Me + 2 kids, alternating"
  var weekPattern: String  // "4 kid nights / 3 solo"
  var kidsAges: [Int]
  var cookingStyle: CookingStyle
  var timePerMealMin: Int
  var restrictions: [String]
  var loves: [String]
  var hates: [String]
  var budgetWeekCAD: Int
  var homeStore: Store     // .rcssCamrose, .coopCamrose
  var pcOptimumCard: String?
  var pcOptimumPoints: Int
  var coopMemberNumber: String?
  var coopEquityCAD: Double
  var createdAt: Date
}

@Model final class Plan {
  var id: UUID
  var userId: UUID
  var promptId: String     // "sunday-batch", "family-kitchen", etc.
  var caloriesTarget: Int
  var proteinTarget: Int
  var summary: String
  var days: [PlanDay]
  var startedOn: Date
  var active: Bool
}

@Model final class PlanDay {
  var index: Int           // 0..6
  var dayLabel: String     // "MON"
  var isKidNight: Bool
  var meals: [Meal]
}

@Model final class Meal {
  var slot: MealSlot       // .breakfast, .lunch, .dinner, .snack, .prep
  var name: String
  var calories: Int?
  var minutesToMake: Int?
  var kidFriendly: Bool
  var ingredients: [Ingredient]
  var steps: [String]
  var completed: Bool
}

@Model final class Ingredient {
  var name: String
  var qty: String
  var category: IngredientCategory  // .produce, .protein, .pantry, .dairy, .frozen, .other
  var offer: Offer?                 // attached at grocery-list-build time
  var purchased: Bool
}

@Model final class Offer {
  var kind: OfferKind               // .pcOptimum, .coopMember, .flyerSale
  var label: String                 // "500 pts loaded"
  var estSavingsCAD: Double
  var expiresOn: Date?
  var store: Store
}

@Model final class Checkin {
  var date: Date
  var weightLb: Double?
  var energy: Int          // 1..5
  var adherence: Int       // 0..100
  var cravings: [String]
  var noteToMia: String
}
```

---

## 5. The 12 Nav Toor prompts

Shipped in `src/prompts.jsx`. Each has: `id`, `title`, `tagline`, `duration`, `complexity` (1-3), `outputs[]`, `prompt` (system prompt for Claude), `fields[]` (which profile fields it consumes).

**The list (ids):**
1. `weekly-meal-plan` — Weekly meal plan
2. `sunday-batch` — Sunday batch cooking
3. `family-kitchen` — Family kitchen (kids-friendly)
4. `recovery-athlete` — Athlete recovery
5. `blood-sugar` — Blood sugar balance
6. `gut-reset` — Gut reset
7. `busy-exec` — Busy exec (minimal time)
8. `budget-eater` — Budget-first
9. `muscle-gain` — Muscle-gain surplus
10. `fat-loss` — Sustainable fat loss
11. `school-lunch` — School lunch builder
12. `one-pot` — One-pot weeknight

Ranking function: `rankPrompts(answers)` in `src/prompts.jsx` — pure scoring over goal, pain, cooking style, household.

---

## 6. The LLM contract

Shipped in `src/prompt-builder.jsx`. The Generate step calls Claude with a profile blob + selected prompt, asks for **strictly JSON**:

```json
{
  "summary": "Family-friendly, batch-cooked week. Salmon Friday.",
  "days": [
    {
      "day": "MON",
      "kid": true,
      "meals": [
        {"t": "Breakfast", "name": "Egg + avocado toast", "cal": 450, "time": 8},
        {"t": "Lunch", "name": "Mediterranean grain bowl", "cal": 560, "time": 5},
        {"t": "Dinner", "name": "Sheet-pan chicken fajitas", "cal": 640, "time": 25, "kid": true},
        {"t": "Snack", "name": "Greek yogurt + granola", "cal": 240}
      ]
    }
  ]
}
```

**Rules enforced in the system prompt:**
- Exactly 7 days: MON..SUN
- 4 meals/day (Breakfast, Lunch, Dinner, Snack)
- `"kid": true` on kid-home days; match `weekPattern`
- Hit calorie target ±100 kcal/day
- Sunday `"prep": true` meal if the prompt is batch-cooking style
- Respect loves/hates/restrictions — non-negotiable
- Meal names ≤ 8 words

**Extract robustly:** model sometimes wraps JSON in prose. Prototype strips with `/\{[\s\S]*\}/`.

**Follow-up calls (implement next):**
- **Recipe expansion:** given a meal name + servings, return `{ingredients[], steps[]}`.
- **Grocery rollup:** given the whole plan, return consolidated `Ingredient[]` grouped by category, with sane quantities.
- **Check-in adjustment:** given last 7 days of check-ins, return `{caloriesDelta, proteinDelta, tacticNote}` to adjust targets.

---

## 7. PC Optimum integration — the hard truth

**There is no public PC Optimum API.** Loblaw uses Eagle Eye's AIR platform internally; it's not exposed to third parties. Realistic options:

### Option A (ship now): **Deep-link to the official PC Optimum app**
- When user taps "Load offers" in grocery list, open `https://www.pcoptimum.ca/load?page=RCSSDigitalCouponBoard20220929` in an in-app `SFSafariViewController`.
- User loads offers in the PC app, comes back, marks them as loaded manually.
- Zero maintenance, legally clean, poor UX.

### Option B (v1.1): **Browser-extension + companion app**
- User pastes their PC Optimum weekly offers (copy/paste from email) into Mia once a week.
- Claude parses the email text into structured `Offer[]`.
- Surprisingly robust: the weekly offer email is consistent.

### Option C (v2): **Retailer-side partnership**
- Pitch Loblaw Digital as a meal-plan partner feeding intent-to-buy signals in exchange for offer-feed API access. 6-12 month BD cycle.

**Recommendation:** ship A, build the Claude email-parser for B in v1.1, pursue C via BD.

**Co-op membership:** Federated Co-operatives Ltd. (Camrose is part of this) has no public API either. Store member number locally, show equity balance as a user-entered value they refresh manually, match known member-deal SKUs in the flyer (scraped weekly — see §8).

---

## 8. Flyer scraping (weekly cron)

**Source:** RCSS Camrose flyer + Camrose Co-op flyer (both public PDFs/web).

**Worker:**
1. Cloudflare Worker scheduled Monday 06:00 MT.
2. Fetches current flyer PDFs.
3. Sends to Claude with a "extract `{sku?, name, price, regPrice, storeId, validThru}`" prompt.
4. Writes to `offers` table in Supabase.
5. Grocery-list matcher joins plan ingredients against `offers` by fuzzy name match (embedding similarity + threshold).

**Matcher:** `src/prompt-builder.jsx` already builds the profile blob — add a second Claude call after plan gen:
```ts
matchOffers(ingredients[], offers[]) → attachedOffers[]
```
Returns `{ingredientName, offerId, confidence}[]`. Accept >0.75 confidence.

---

## 9. Design system (extracted from prototype)

**Tokens** — see `src/styles.css`.

```css
/* Palette */
--cream:    #f6eed4;   /* base bg */
--cream-2:  #efe4c0;   /* card bg alt */
--cream-3:  #e9dca9;   /* gradient accent */
--ink:      #1f2419;   /* primary text */
--ink-2:    #3d4334;
--ink-3:    #7a7e6f;
--ink-mute: #a8ab9e;
--divider:  rgba(31,36,25,0.08);
--olive:       oklch(58% 0.12 130);  /* primary accent */
--olive-deep:  oklch(42% 0.11 130);
--olive-soft:  oklch(92% 0.06 130);
--tangerine:      oklch(68% 0.15 55);
--tangerine-soft: oklch(94% 0.05 55);

/* Offer colors */
--pc-bg:    #fef3c7; --pc-fg: #78350f;
--coop-bg:  #dbeafe; --coop-fg: #1e3a8a;
```

**Accent swappable via Tweaks:** olive (default), tomato, tangerine, plum. All four defined in `src/app.jsx` → `ACCENTS`.

**Type:**
- Serif headings — Instrument Serif / New Spirit-class (italic accents for numbers)
- Sans body — Inter-substitute, 14–15px body
- Mono labels — 10–11px, 0.04–0.1em tracking, uppercase eyebrows

**Radii:** 10 (pills small), 12 (buttons), 16–18 (cards), 22 (identity card), 28 (bottom sheets).

**Shadows:** single signature — `0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)`. Primary CTA adds `0 4px 14px rgba(66,77,34,0.25)`.

---

## 10. Key interactions

### Bottom sheet (Grocery → Send)
- Backdrop `rgba(31,36,25,0.45)` fade-in 180ms
- Sheet slide-up 220ms `cubic-bezier(0.32, 0.72, 0, 1)`
- 36×5 grabber at top
- Primary option swaps based on selected store:
  - RCSS → **PC Express pickup** primary, Instacart dimmed
  - Co-op → **Instacart** primary, PC Express dimmed
- 4 secondary share tiles: Text / Email / Apple Notes / Print

### Day switcher (Plan)
- Horizontal scroll, 7 pills (MON–SUN)
- Active: dark fill `var(--ink)`, white text
- Kid-night days: italic number, tangerine accent
- Tap to switch, smooth content cross-fade

### Macro ring (Dashboard)
- SVG stroke-dasharray animation, 500ms ease
- Three concentric rings: protein / carbs / fat
- Inner numeric % with kcal below

### Check-in scale inputs
- 5-step dot scale with sliding indicator
- Low/high labels (e.g. "Drained" ↔ "Charged")
- Saves to `Checkin` on submit → triggers `adjustPlan()` backend call

---

## 11. Build checklist (phased)

### Phase 1 — MVP (6 weeks, 1 iOS dev + 1 backend)
- [ ] Auth (Apple + email magic link)
- [ ] Onboarding chat (15 questions)
- [ ] Prompt ranker (pure Swift port of `rankPrompts`)
- [ ] Claude proxy on Cloudflare Worker (rate-limit, log, billing meter)
- [ ] Plan generation + render (§6 contract)
- [ ] Home dashboard (today's meals)
- [ ] Grocery list (static — no offers yet)
- [ ] Recipe detail (Claude expansion call, cached to SwiftData)
- [ ] Check-in flow + 7-day adjustment

### Phase 2 — Loyalty (3 weeks)
- [ ] Settings → Store & loyalty section
- [ ] Deep-link to PC Optimum digital coupon board
- [ ] Flyer scraper worker (RCSS + Camrose Co-op)
- [ ] Offer matcher (Claude embedding similarity)
- [ ] Grocery list offer pills + savings strip
- [ ] Send sheet (PC Express / Instacart / Share)

### Phase 3 — Retention (3 weeks)
- [ ] Daily check-in push notification
- [ ] Plan adjustment engine (weekly)
- [ ] Weekly summary email
- [ ] RevenueCat paywall (after day 7)
- [ ] Referral program

### Phase 4 — Expansion
- [ ] Android (Kotlin Multiplatform or native)
- [ ] Apple Watch companion (next meal + water tracking)
- [ ] Recipe video imports (Instagram/TikTok link → Mia extracts + plans around it)

---

## 12. Prototype files

All in `/src`:

| File | Purpose | LOC |
|---|---|---|
| `app.jsx` | Root, routing, Tweaks panel, accent theming | ~210 |
| `styles.css` | Design tokens, layout shell | ~150 |
| `chat-ui.jsx` | Chat bubble/input primitives | — |
| `chat-flow.jsx` | 15-question conversation tree | — |
| `questions.jsx` | Question definitions + shared input widgets | — |
| `prompts.jsx` | 12 Nav Toor prompts + `rankPrompts()` | — |
| `prompt-select.jsx` | Hero + runner-ups + browse-all | — |
| `plan-screen.jsx` | Refine + PlanPreview (with live Claude call) | ~490 |
| `prompt-builder.jsx` | `buildProfile()` + `generatePlan()` — the Claude contract | — |
| `home-screens.jsx` | Dashboard, Grocery, Recipe, Check-in, Settings | ~1230 |

**To run:** open `Meal Plan Planner.html` in any browser. Tweaks toggle in the toolbar exposes accent + jump-nav. Inside the browser preview, the Claude call goes through a built-in helper; in production you'll implement the proxy yourself.

---

## 13. Open questions for the team

1. **Insurance/medical liability** — is Mia a "dietitian" or a "nutrition coach"? Affects App Store category + disclaimer wording.
2. **Data residency** — Canadian users → PIPEDA. Keep user data in Canadian region (Supabase supports this).
3. **Partner vs. independent** — pursue Loblaw partnership (§7 option C) or stay retailer-neutral? Independent = lower bar to ship, partnership = real offer API.
4. **Recipe imagery** — commission a food photographer for hero shots on the top 50 recipes, or use AI-generated food imagery (cheap, inconsistent, legal gray zone)?
5. **Measurement units** — Canadian default: metric for weight/height, imperial for recipe quantities (North American recipe convention). Confirm with early users.

---

## 14. Contacts

- Prototype designer: (this project)
- Primary user for Phase 1 testing: Camrose, AB — owns PC Optimum card + Co-op membership, lives the exact target persona.
- Nav Toor prompt framework: see `src/prompts.jsx` prompt bodies — these are the IP. Treat as proprietary.

---

*Document version 1.0 — generated alongside the interactive HTML prototype. Single source of truth lives in the prototype repo; update this doc alongside code changes.*
