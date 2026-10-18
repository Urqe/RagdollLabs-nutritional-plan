# Release plan

Working plan for the meal plan calendar. Each release has a goal, a scope checklist and the checks that must pass before it ships. Tick items as they land and move finished releases to the log at the bottom.

## How a release ships

1. Create a branch: `release/vX.Y`.
2. Make the changes in `src/`, `tools/` or the docs. Never edit `index.html` by hand.
3. Run the checks:
   - `node tools/check-year.js`: weekly protein averages at or above both targets, no repeat violations.
   - `python3 build.py`: rebuilds `index.html`.
   - Privacy check: no height, weight or other body data anywhere in the repo (automated from v0.3, manual search until then).
4. Open the page in a browser at phone and desktop width and click through one day, one recipe and one week.
5. Commit, open a pull request into `main`, merge.
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

1. v0.2 Prices
2. v0.3 Calendar zoom and touch
3. v0.4 Recipe library to 80

Everything after v0.4 is later work and can be reordered.

---

## v0.2: Prices

Goal: every recipe, day and weekly shopping list shows an estimated cost, based on K-Ruoka prices.

How prices are collected
- K-Ruoka blocks automated fetching, so prices cannot be scraped. They come from a browser session on K-Ruoka (signed in, reference store selected) or are entered by hand.
- Prices live in their own file, `src/prices.js`, separate from nutrition data, so a price refresh only touches one file.
- Start with estimates marked `estimate`, then replace them with checked prices store by store. The page shows which prices are still estimates.

Scope
- [ ] `src/prices.js`: one row per catalogue ingredient with product name, pack size, pack price, unit price (€/kg, €/l or €/pc), status (`estimate` or `checked`) and date checked.
- [ ] Choose one reference store on K-Ruoka so the numbers are comparable.
- [ ] Fill estimates for all non-pantry ingredients (about 110), preferring everyday K-Menu and Pirkka-level products.
- [ ] Replace estimates with checked prices from the reference store.
- [ ] Recipe cost: total for two and per person, on the recipe view.
- [ ] Day cost on the day view; weekly cost and daily average in the weekly summary.
- [ ] Shopping list: rounds up to whole packs and shows the expected checkout total. Pantry items listed without price.
- [ ] Swap menu shows the cost difference of each alternative.
- [ ] `tools/check-prices.js`: lists missing prices, remaining estimates and prices older than 90 days.
- [ ] Page note: "Prices estimated from K-Ruoka, last checked <date>".

Checks
- Every non-pantry ingredient has a price.
- A sample week's shopping total matches a real K-Ruoka basket within about 10 %.

Open questions
- Which K-Ruoka store to use as the reference.
- Headline number: cost per day for two, or per person.

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

## v0.4: Recipe library to 80

Goal: more variety, with dishes from new Come Conmigo plans folded in.

Scope
- [ ] Add 30 recipes: 6 breakfasts, 12 lunches, 9 dinners, 3 cheat dinners.
- [ ] Every new recipe has prices in `src/prices.js` (depends on v0.2).
- [ ] Routine for new plan PDFs: give the links, adapt dishes to the food rules and Finnish ingredients, add them as recipes, run the year check.
- [ ] Cook once, eat twice: mark dinners that make enough for the next day's lunch and let the rotation pair them.
- [ ] Seasonal tags (grill season, soup season) and a light seasonal preference in the rotation.
- [ ] Longer repeat gaps to match the bigger library: lunch 14 days, dinner 18 days.
- [ ] Optional: a budget preference so the rotation leans toward cheaper dinners on weekdays.

Checks
- No recipe appears more than 20 times a year.
- Weekly protein averages still at or above both targets.
- Weekly cost stays within the range set in v0.2 (no week more than 25 % above the average).

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

- Leftover tracker: mark a meal as eaten from leftovers and adjust the shopping list.
- Batch-cooking day: a Sunday prep list for the week's lunches.
- Seasonal pricing alerts when a staple (chicken, avocado) is on offer.
- Recipe photos.

## Release log

| Version | Date | Notes |
|---|---|---|
| v0.1 | 2026-10-18 | First version. Recipes reworked in the Come Conmigo style the same day. |
