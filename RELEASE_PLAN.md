# Release plan

Working plan for the meal plan calendar. Each release has a goal, a scope checklist and the checks that must pass before it ships. Tick items as they land and move finished releases to the log at the bottom.

## How a release ships

1. Create a branch: `release/vX.Y`.
2. Make the changes in `src/`, `tools/` or the docs. Never edit `index.html` by hand.
3. Run the checks:
   - `node tools/check-year.js`: weekly protein averages at or above both targets, no repeat violations.
   - `node tools/check-prices.js`: every ingredient priced, no unit mismatches.
   - `python3 build.py`: rebuilds `index.html`.
   - Privacy check: no height, weight or other body data anywhere in the repo (automated from v0.3, manual search until then).
4. Open the page in a browser at phone and desktop width and click through one day, one recipe and one week.
5. Commit, merge into `main` (pull request on GitHub, or `git merge --no-ff` locally), push.
6. GitHub Pages updates from `main` automatically. Republish the Claude page from the new `index.html` too.
7. Update this file: tick the items, add the release to the log with the date and anything that changed from the plan.

## Standing rules

- No height, weight or other body data in the app, the README or commit history. Protein targets and portion splits are fine.
- Food rules from the README apply to every new recipe: no fish, seafood, eggplant, zucchini, pork mince or thick pork cuts.
- Every ingredient must be buyable in a normal Finnish supermarket. Specialist items (dried chillies, chipotle) need a fallback in the recipe.
- New recipes follow the Come Conmigo style: simple Mexican home cooking, measured raw protein, yoghurt instead of mayo or cream.
- The rotation must stay deterministic: a date always shows the same meals unless someone swaps one.

---

## v0.1: First version (shipped)

- [x] Year calendar centred on the current month, ISO weeks, Monday first
- [x] 50 recipes in the Come Conmigo style, split between Person 1 and Person 2
- [x] Rotation with repeat gaps, weekend breakfasts, Saturday cheat dinner
- [x] Morning juice and two optional snacks per day
- [x] Weekly summary and shopping list
- [x] Per-device meal swaps
- [x] Year check script

---

## Current focus

1. v0.2.1 Check prices in the store
2. v0.3 Calendar zoom and touch
3. v0.4 Recipe library to 80 and waste-aware rotation

Everything after v0.4 is later work and can be reordered.

---

## v0.2: Prices and pack guidance (shipped)

Goal: every recipe, day and month shows an estimated cost from K-Ruoka prices, and each week's shopping list says which pack sizes to buy.

How prices are collected
- K-Ruoka blocks automated fetching, so prices cannot be scraped. They come from a browser session on K-Ruoka (signed in, reference store selected) or are entered by hand.
- Prices live in their own file, `src/prices.js`, separate from nutrition data, so a price refresh only touches one file.
- Start with estimates marked `estimate`, then replace them with checked prices. The page shows which prices are still estimates.
- Reference store: a K-chain market. a second K-chain store is the second store, used when the first store doesn't stock an item and as a sanity check on a sample basket.
- Costs are shown for the household, never split per person: per day and per month.

Scope
- [x] `src/prices.js`: one row per catalogue ingredient with product name, store, the pack sizes on sale (with price for each), unit price (€/kg, €/l or €/pc), status (`estimate` or `checked`) and date checked.
- [x] Shelf life per ingredient: how many days it keeps once opened or bought fresh, and whether it freezes well. Used by the pack guidance below and the waste-aware rotation in v0.4.
- [x] Fill estimates for all non-pantry ingredients (about 110), preferring everyday K-Menu and Pirkka-level products.
- [ ] Replace estimates with checked prices from the reference store. Moved to v0.2.1.
- [x] Recipe cost for the household, on the recipe view.
- [x] Cost per day on the day view. Cost per month (and the daily average) on a month summary; the weekly summary shows the week's cost.
- [x] Shopping list: rounds up to whole packs and shows the expected checkout total. Pantry items listed without price.
- [x] Pack guidance in the weekly shopping list: which pack size to buy for each item ("chicken breast: 1 × 1 kg, uses 860 g, 140 g left"), choosing the cheapest combination of packs that covers the week.
- [x] Leftover warnings: items where the chosen pack leaves more than about 20 % unused, with a note on whether the rest freezes, keeps until next week, or will be wasted.
- [x] Swap menu shows the cost difference of each alternative.
- [x] `tools/check-prices.js`: lists missing prices, remaining estimates and prices older than 90 days.
- [x] Page note: "Prices estimated from K-Ruoka, last checked <date>".

Checks
- [x] Every non-pantry ingredient has a price.
- [ ] A sample week's shopping total matches a real K-Ruoka basket within about 10 %. Moved to v0.2.1.

Shipped notes
- All 86 priced ingredients are estimates. K-Ruoka blocks automated reading, so checking needs a browser session or manual entry.
- Long-life items (dry goods, frozen, protein powder) are listed separately in the shopping list with how long a pack lasts, and are left out of the weekly checkout total.
- The pack picker prefers fewer packs when the price is within 3 %.
- Estimated food cost: about 24 € a day, 670–750 € a month for the household.

Decided
- Reference store a K-chain market, with a second K-chain store as the second store.
- Costs shown per day and per month for the household, no per-person split.

---

## v0.2.1: Check prices in the store

Goal: replace the estimates with real prices from a K-chain market.

Scope
- [ ] Check all 86 ingredients on K-Ruoka with a K-chain market selected, in a browser session, and record product, pack sizes, prices and date. Use a second K-chain store for anything the first store doesn't stock.
- [ ] Set `status: "checked"` and the `checked` date for each.
- [ ] Price one sample week's shopping list as a real K-Ruoka basket and compare with the app's checkout total.

Checks
- `node tools/check-prices.js` reports 0 estimates.
- Sample basket within about 10 % of the app's total.

---

## v0.3: Calendar zoom and touch

Goal: move between year, month and day by pinching or zooming, while taps and clicks keep working as they do now.

Zoom levels
- Year: the current 12-month grid.
- Month: one month fills the screen. Each day cell shows the three meal names, a cheat night marker and the day's protein for both people.
- Day: the full day fills the screen, with the meals, snacks and juice inline, the same content as today's day panel.

Scope
- [ ] Pinch out on a month in the year view to open that month; pinch out on a day in the month view to open that day. Pinch in to go back up a level.
- [ ] The pinch targets whatever is under your fingers, so you land on the month or day you pinched.
- [ ] Desktop: trackpad pinch and Ctrl + scroll do the same. Keyboard: + and − change level, arrow keys move between days or months.
- [ ] Zoom buttons (− / +) and a breadcrumb (Year › October › Sun 18) for people who don't pinch.
- [ ] Taps and clicks unchanged: tap a day to select it, tap a meal to open the recipe. A tap never zooms by accident.
- [ ] Swipe left and right to move to the previous or next month or day at month and day level.
- [ ] Smooth transition between levels that respects reduced-motion settings.
- [ ] The level you were at is remembered on the device and in the URL anchor, so a bookmark can open straight to a month or today.
- [ ] Browser page zoom keeps working for accessibility. The app only takes over pinch gestures inside the calendar.

Checks
- On a phone and a tablet: pinch to month, pinch to day, pinch back, and tap still selects in every level.
- On desktop: trackpad pinch, Ctrl + scroll, buttons and keyboard all reach the same three levels.
- No horizontal page scroll at any level.

---

## v0.4: Recipe library to 80 and waste-aware rotation

Goal: more variety, with dishes from new Come Conmigo plans folded in, and weekly plans that use up what you buy.

Scope
- [ ] Add 30 recipes: 6 breakfasts, 12 lunches, 9 dinners, 3 cheat dinners.
- [ ] Every new recipe has prices in `src/prices.js` (depends on v0.2).
- [ ] Routine for new plan PDFs: give the links, adapt dishes to the food rules and Finnish ingredients, add them as recipes, run the year check.
- [ ] Cook once, eat twice: mark dinners that make enough for the next day's lunch and let the rotation pair them.
- [ ] Waste-aware weekly rotation: when a week's plan opens a pack that won't keep (fresh coriander, a 400 g tub of cottage cheese, a 1 kg pack of chicken), the rotation prefers other recipes that week that use up the rest before it spoils. Uses the shelf-life data from v0.2.
- [ ] Weekly waste score in the weekly summary: estimated euros of food left unused at the end of the week, with the items listed.
- [ ] Seasonal tags (grill season, soup season) and a light seasonal preference in the rotation.
- [ ] Longer repeat gaps to match the bigger library: lunch 14 days, dinner 18 days.
- [ ] Optional: a budget preference so the rotation leans toward cheaper dinners on weekdays.

Checks
- No recipe appears more than 20 times a year.
- Weekly protein averages still at or above both targets.
- Weekly cost stays within the range set in v0.2 (no week more than 25 % above the average).
- Estimated weekly waste lower than in v0.2, measured on the same year of weeks.

---

## Later

### Settings and privacy
- [ ] Settings panel: protein targets per person, display names, which day is the cheat night. Saved on the device only; the repo keeps neutral defaults.
- [ ] Spice level per person.
- [ ] `tools/check-privacy.js`: fails if the repo contains body measurements or other blocked patterns.
- [ ] Optional: training days, with snack 1 suggested as a post-workout shake.

### Better shopping
- [ ] Tick items off while shopping, saved per week.
- [ ] Store order within sections, custom date ranges, "already have" pantry list.
- [ ] Copy format that pastes cleanly into a phone note or the K-Ruoka shopping list.
- [ ] Option to leave juices or snack 2 out of the list.

### Shared state across devices
- [ ] Sync swaps, settings and shopping ticks between phone, tablet and computer.
- [ ] Decide where shared state lives first; GitHub Pages has no storage of its own.

### Nutrition accuracy
- [ ] Check catalogue values against Fineli (THL's Finnish food composition database) and record the Fineli food id.
- [ ] Fat and carbohydrate per ingredient, shown on recipe and day views.
- [ ] Optional device-only calorie targets.

### Offline and home screen
- [x] Published on GitHub Pages.
- [ ] Web app manifest and icon for the home screen.
- [ ] Offline support with a service worker.

### v1.0
- [ ] Finnish UI language option.
- [ ] Accessibility pass: keyboard, screen reader labels, contrast in both themes.
- [ ] Print-friendly weekly plan and shopping list.

---

## Ideas not yet scheduled

- Leftover tracker: mark what is actually left in the fridge and let the next week use it first.
- Batch-cooking day: a Sunday prep list for the week's lunches.
- Seasonal pricing alerts when a staple (chicken, avocado) is on offer.
- Recipe photos.

## Release log

| Version | Date | Notes |
|---|---|---|
| v0.1 | 2026-10-18 | First version. Recipes reworked in the Come Conmigo style the same day. |
| v0.2 | 2026-10-18 | Prices, pack guidance, leftover warnings, month cost summary. Prices are estimates; store check moved to v0.2.1. |
