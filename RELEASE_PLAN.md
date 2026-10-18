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
6. Republish the published page from the new `index.html`.
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

## v0.2: Prices

Goal: every recipe, day and weekly shopping list shows an estimated cost, based on K-Ruoka prices.

Scope
- [ ] Add price fields to each catalogue ingredient in `src/data.js`: pack size, pack price, price per kg or per piece, date checked.
- [ ] Use one reference store on K-Ruoka for all prices so the numbers are comparable.
- [ ] Collect prices for all catalogue ingredients (about 110). Prefer K-Menu or Pirkka-equivalent everyday products over premium brands.
- [ ] Recipe cost: total for two and per person, shown on the recipe view.
- [ ] Day cost and weekly cost, shown on the day view and in the weekly summary.
- [ ] Shopping list rounds up to whole packs and shows the expected checkout total. Pantry items are listed but not priced.
- [ ] `tools/check-prices.js`: lists ingredients with no price or with prices older than 90 days.
- [ ] Note on the page that prices are estimates with the date of the last check.

Checks
- Every non-pantry ingredient has a price.
- A sample week's shopping total matches a manual K-Ruoka basket within about 10 %.

Open questions
- Which store to use as the reference.
- Whether to show cost per serving or per day as the headline number.

---

## v0.3: Settings and privacy

Goal: the household can adjust the plan without editing code, and nothing personal can leak into the repo.

Scope
- [ ] Settings panel: protein targets per person, display names for Person 1 and Person 2, which day is the cheat night.
- [ ] Settings are saved on the device only and never written to the repo. The repo keeps neutral defaults.
- [ ] Spice level per person (affects the "salsa on the side" note, not the recipe).
- [ ] `tools/check-privacy.js`: fails if the repo contains body measurements or other blocked patterns. Run it before every commit.
- [ ] Optional: training days. On a training day, optional snack 1 is suggested as a post-workout shake.

Checks
- Changing targets updates portions, day totals and the weekly summary.
- The privacy check passes on the full history (`git log -p`).

---

## v0.4: Shared state across devices

Goal: swaps and settings are the same on the phone, tablet and computer.

Scope
- [ ] Decide where shared state lives. Options: the published page's shared storage, or a small hosted store if the app moves to GitHub Pages. Pick one before building.
- [ ] Sync meal swaps, settings and shopping list ticks.
- [ ] Keep working offline with the last known state when sync is unavailable.

Checks
- A swap made on the phone shows on the computer after reload.

Open questions
- Whether the app should live on GitHub Pages, as the published page, or both.

---

## v0.5: Better shopping

Goal: the shopping list is something you can actually take to the store.

Scope
- [ ] Tick items off while shopping, saved per week.
- [ ] Group items in store order (produce, meat, dairy, bread, dry goods, frozen) instead of alphabetical within a section.
- [ ] Shopping for a custom date range, for example Thursday to Wednesday.
- [ ] "Already have" pantry checklist, so pantry items can be excluded.
- [ ] Copy format that pastes cleanly into a phone note or the K-Ruoka shopping list.
- [ ] Optional: skip juices or snack 2 from the list.

Checks
- A week's list fits on one phone screen per section without horizontal scrolling.

---

## v0.6: Recipe library to 80

Goal: more variety, and dishes from new Come Conmigo plans folded in.

Scope
- [ ] Add 30 recipes: 6 breakfasts, 12 lunches, 9 dinners, 3 cheat dinners.
- [ ] Routine for new plan PDFs: give the links, adapt dishes to the food rules and Finnish ingredients, add them as recipes, run the year check.
- [ ] Cook once, eat twice: mark dinners that make enough for the next day's lunch, and let the rotation pair them.
- [ ] Seasonal tags (grill season, soup season) and a light seasonal preference in the rotation.
- [ ] Increase repeat gaps to match the bigger library (lunch 14 days, dinner 18 days).

Checks
- No recipe appears more than 20 times a year.
- Weekly protein averages still at or above target.

---

## v0.7: Nutrition accuracy

Goal: nutrition values that can be trusted, not only estimates.

Scope
- [ ] Check every catalogue value against Fineli (THL's Finnish food composition database) and record the Fineli food id.
- [ ] Add fat and carbohydrate per ingredient; show them on the recipe and day view.
- [ ] Optional calorie targets per person in settings (device only).
- [ ] Weekly view shows protein, calories, fat and carbohydrate averages against targets.

Checks
- Every catalogue entry has a Fineli reference or a label-based source noted.

---

## v0.8: Hosting and offline use

Goal: the app opens like a normal phone app and works without a connection.

Scope
- [ ] Publish on GitHub Pages from `main`.
- [ ] Add a web app manifest and icon so it can be added to the home screen.
- [ ] Offline support with a service worker (works on GitHub Pages, not inside the published page).
- [ ] Short "how to install on your phone" note in the README.

Checks
- Opens offline on a phone after one online visit.

---

## v1.0: Finished product

Goal: a stable app the household uses every day.

Scope
- [ ] Finnish UI language option, with English kept as the default for now.
- [ ] Accessibility pass: keyboard use, screen reader labels, contrast in both themes.
- [ ] Print-friendly weekly plan and shopping list (on GitHub Pages).
- [ ] Clean up the README and this plan, and record known limitations.

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
