# Release plan

Working plan for the meal plan calendar. Each release has a goal, a scope checklist and the checks that must pass before it ships. Tick items as they land and move finished releases to the log at the bottom.

## How a release ships

1. Create a branch: `release/vX.Y`.
2. Make the changes in `src/`, `tools/` or the docs. Never edit `index.html` by hand.
3. Run the checks:
   - `node tools/check-year.js`: weekly protein averages at or above both targets, no repeat violations.
   - `node tools/check-prices.js`: every ingredient priced, no unit mismatches.
   - `node tools/check-waste.js`: weekly waste estimate not clearly higher than the last release.
   - `python3 tools/test-ui.py`: all browser checks pass (zoom, touch, taps, sheet, theme, keyboard, links, frame timing).
   - `python3 build.py`: rebuilds `index.html`.
   - Privacy check: no height, weight or other body data anywhere in the repo (automated from v0.3, manual search until then).
4. Open the page in a browser at phone and desktop width and click through one day, one recipe and one week.
5. Commit, merge into `main` (pull request on GitHub, or `git merge --no-ff` locally), push.
6. GitHub Pages updates from `main` automatically. Republish the Claude page from the new `index.html` too.
7. Update this file: tick the items, add the release to the log with the date and anything that changed from the plan.

## Standing rules

- No height, weight or other body data in the app, the README or commit history. Protein targets and portion splits are fine.
- Food rules from the README apply to every new recipe: no fish, seafood, eggplant, zucchini, beetroot, bananas, pork mince or thick pork cuts. `tools/check-year.js` fails if a banned ingredient appears.
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

Nothing scheduled. Pick the next release from Later.

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
- [ ] Replace estimates with checked prices from the reference store. Moved to the backlog (Check prices in the store).
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
- [ ] A sample week's shopping total matches a real K-Ruoka basket within about 10 %. Moved to the backlog (Check prices in the store).

Shipped notes
- All 86 priced ingredients are estimates. K-Ruoka blocks automated reading, so checking needs a browser session or manual entry.
- Long-life items (dry goods, frozen, protein powder) are listed separately in the shopping list with how long a pack lasts, and are left out of the weekly checkout total.
- The pack picker prefers fewer packs when the price is within 3 %.
- Estimated food cost: about 24 € a day, 670–750 € a month for the household.

Decided
- Reference store a K-chain market, with a second K-chain store as the second store.
- Costs shown per day and per month for the household, no per-person split.

---

## v0.3: Calendar zoom and touch (shipped)

Goal: move between year, month and day by pinching or zooming, while taps and clicks keep working as they do now.

Zoom levels
- Year: the current 12-month grid.
- Month: one month fills the screen. Each day cell shows the three meal names, a cheat night marker and the day's protein for both people.
- Day: the full day fills the screen, with the meals, snacks and juice inline, the same content as today's day panel.

Scope
- [x] Pinch out on a month in the year view to open that month; pinch out on a day in the month view to open that day. Pinch in to go back up a level.
- [x] The pinch targets whatever is under your fingers, so you land on the month or day you pinched.
- [x] Desktop: trackpad pinch and Ctrl + scroll do the same. Keyboard: + and − change level, arrow keys move between days or months.
- [x] Zoom buttons (− / +) and a breadcrumb (Year › October › Sun 18) for people who don't pinch.
- [x] Taps and clicks unchanged: tap a day to select it, tap a meal to open the recipe. A tap never zooms by accident.
- [x] Swipe left and right to move to the previous or next month or day at month and day level.
- [x] Smooth transition between levels that respects reduced-motion settings.
- [x] The level you were at is remembered on the device and in the URL anchor, so a bookmark can open straight to a month or today.
- [x] Browser page zoom keeps working for accessibility. The app only takes over pinch gestures inside the calendar.

Checks
- [x] On a phone and a tablet: pinch to month, pinch to day, pinch back, and tap still selects in every level.
- [x] On desktop: trackpad pinch, Ctrl + scroll, buttons and keyboard all reach the same three levels.
- [x] No horizontal page scroll at any level.

Shipped notes
- Checked in headless Chromium at phone, tablet and desktop widths with simulated touch. Worth a real-device check on iPhone Safari, where pinch handling differs.
- Phones show the month as a list of days grouped by week instead of a 7-column grid, because meal names don't fit in phone-width columns.
- At day level the meals are shown in full, with ingredients and directions expandable. On desktop the side panel shows that week's summary and shopping list.
- Taps are ignored for 350 ms after a pinch or swipe so a gesture never opens a day by accident.
- The target chips in the header are hidden on phones to keep the header to one row.

---

## v0.4: Recipe library to 80 and waste-aware rotation (shipped)

Goal: more variety, with dishes from new Come Conmigo plans folded in, and weekly plans that use up what you buy.

Scope
- [x] Add 30 recipes: 6 breakfasts, 12 lunches, 9 dinners, 3 cheat dinners.
- [x] Every new recipe has prices in `src/prices.js` (depends on v0.2).
- [x] Routine for new plan PDFs: give the links, adapt dishes to the food rules and Finnish ingredients, add them as recipes, run the year check.
- [x] Cook once, eat twice: mark dinners that make enough for the next day's lunch and let the rotation pair them.
- [x] Waste-aware weekly rotation: when a week's plan opens a pack that won't keep (fresh coriander, a 400 g tub of cottage cheese, a 1 kg pack of chicken), the rotation prefers other recipes that week that use up the rest before it spoils. Uses the shelf-life data from v0.2.
- [x] Weekly waste score in the weekly summary: estimated euros of food left unused at the end of the week, with the items listed.
- [x] Seasonal tags (grill season, soup season) and a light seasonal preference in the rotation.
- [x] Longer repeat gaps to match the bigger library: lunch 14 days, dinner 18 days.
- [x] Optional: a budget preference so the rotation leans toward cheaper dinners on weekdays.

Checks
- [x] No recipe appears more than 20 times a year (highest: 20).
- [x] Weekly protein averages still at or above both targets (Person 1 110–118 g, Person 2 148–159 g).
- [x] Weekly cost stays within the range set in v0.2: highest week +15 % above the average of about 166 €.
- [x] Estimated weekly waste lower than in v0.2: 4.06 € a week, down from 7.56 €.

Shipped notes
- Added 32 recipes instead of 30: 8 breakfasts instead of 6, because the 20-uses-a-year limit needs at least 19 breakfasts. The library is now 82 recipes.
- Repeat gaps: weekday breakfast 7 days, weekend breakfast 10, lunch 14, dinner 18, cheat dinner 35.
- 7 dinners are marked cook once, eat twice; about 51 lunches a year are leftovers from a double batch. Swapping either meal undoes the pairing.
- Juices are now picked two per week and alternated, which removed most of the mint and beetroot waste.
- New tool: `tools/check-waste.js`.
- Remaining waste is mostly part-used yoghurt, cream cheese, lettuce and fresh herbs.

---

## v0.4.1: Review fixes (shipped)

Found in a code review and fixed:
- [x] Invalid links (`#d2026-02-31`, `#m2026-13`) showed impossible dates; they now open today's month or day, and the address bar is corrected.
- [x] Far-future links froze the page (18 s for 2199) because the plan is generated day by day. The plan now runs to the end of 2032, and navigation stops there.
- [x] Reopening the app restored the exact old day; it now restores the level on today's date. Links still open exactly.
- [x] The backup lunch for leftover days was counted as eaten, which slightly skewed lunch rotation.
- [x] No recipe goes over 20 uses in any 365 days (one had reached 21); the rotation now enforces it.
- [x] Back from a recipe opened at day level returns to the week summary on desktop.
- [x] "Today" moves forward if the app stays open past midnight.
- [x] Pinch and swipe rebuilt on touch events. Pointer events lost the first finger when the browser started scrolling, so pinches often didn't register. The view now follows the fingers with resistance, highlights the month or day that will open, eases back if the pinch is too small, and grows the new level out of the pinched point.
- [x] `tools/test-ui.py`: 30 browser checks with real touch input at phone and tablet size, plus desktop keyboard, trackpad and link checks.

Notes
- Estimated waste 4.17 € a week (v0.4: 4.06 €). The 20-uses cap moves the rotation off a few waste-friendly picks.
- Still to check on a real iPhone or iPad: Safari's pinch handling is the one thing the test can't cover.

---

## v0.5: iPhone-smooth zoom and fast start (shipped)

Goal: pinch, zoom and swipe feel like a native iPhone app, and the app opens instantly.

Scope
- [x] GitHub Pages build is a full HTML document (doctype, viewport, charset). Without it iPhone Safari renders the page in quirks mode at desktop width, which breaks pinch handling and touch response. The Claude page keeps its own fragment build.
- [x] Plan generated at build time and embedded in the page, so opening the app does no rotation work.
- [x] Day plans cached between renders.
- [x] Pinch follows the fingers 1:1 (scale and position), with resistance only past 2×.
- [x] Level change is one continuous zoom: the pinched month or day grows into the new level, and zooming out shrinks it back into its place. Uses only transform and opacity, with an iOS-style easing.
- [x] Velocity-aware: a quick pinch commits even if short; a slow, small one settles back.
- [x] Swipe is a page turn: the neighbouring month or day is rendered beside the current one and both follow the finger 1:1, then finish with the flick's speed or snap back. Rubber-band at the ends of the plan range.
- [x] Tap feedback on iPhone: no grey tap flash, a pressed state instead, no double-tap zoom delay.
- [x] Off-screen months skip layout work (`content-visibility`).

Checks
- [x] `tools/test-ui.py` passes on both builds, and checks that the Pages build has a doctype and viewport.
- [x] Frame timing during pinch, zoom, swipe and zoom out: worst frame 17 ms at normal CPU speed (no frame over 20 ms), 33 ms at 2× slowdown (no frame over 50 ms). Changed from the planned 4× check: at 4× (closer to a low-end Android than any iPhone) commit frames still reach about 100 ms in headless Chrome, which also draws without the graphics chip.
- [x] App start-up script: 31 ms (was about 700 ms).

Shipped notes
- The main cause of the jank on iPhone: the Pages build had no doctype or viewport, so Safari ran it in quirks mode at 980 px desktop width. `build.py` now writes a full document for Pages (`index.html`) and a fragment for the Claude page (`artifact.html`).
- The meal plan to the end of 2032 is computed at build time (70 KB) and checked to match the live rotation for every day.
- Views are layers: neighbouring pages and likely zoom targets are built in idle time; a finished swipe or zoom promotes the prepared layer instead of rebuilding. The side panel renders after the motion (desktop) or when the sheet opens (phone).
- Fonts load without blocking the first render.
- Real-device check on iPhone Safari still to do.

---

## v0.5.1: Swipe down to close the day sheet (shipped)

- [x] On phones and tablets, pulling the day sheet down from its top (or from the handle) drags it with the finger; past a quarter of its height, or with a flick, it closes at the flick's speed, otherwise it springs back.
- [x] Grab handle at the top of the sheet; the dimmed background fades as the sheet is pulled down.
- [x] Swiping inside the sheet or on the dimmed area no longer scrolls the calendar behind it.
- [x] `tools/test-ui.py`: sheet opens on tap, page behind stays still while swiping in the sheet and when closing, a slow short pull springs back, a pull down closes it.

---

## v0.6: Theme switch and visual refresh (shipped)

- [x] Theme button in the header cycles automatic (follows the device), light and dark; the choice is remembered and applied before the first paint, so there is no flash. In automatic mode the app follows the device when it switches.
- [x] RagdollLabs cat: an original drawing of a seal-point ragdoll, as the logo in the header corner and sitting in the page footer with a slow tail sway and an occasional blink (both off when the device asks for reduced motion).
- [x] Refreshed look: frosted-glass header, soft colour glow behind the page, faint Talavera tile in the corner of each month, rounder cards with soft shadows, pill buttons, a gradient on the selected day and the Today button.
- [x] Dark mode: text on the accent colour (Today, selected day) switches to dark so it stays readable.
- [x] Phone header fits on one row with the theme button.
- [x] Fixed: hidden pre-built pages (from v0.5) stretched the page and left a long empty area at the bottom.
- [x] `tools/test-ui.py`: theme switch cycle and memory.

Notes
- The header blur pauses while something moves (pinch, zoom, swipe) and returns when it stops; re-blurring moving content every frame was the costliest effect.
- Frame check changed to the 95th-percentile frame plus a looser cap on the worst frame: the test machine got noisier, and the single worst frame mostly measured that. At normal speed v0.6 matches v0.5 (95 % of frames within 17 ms); at 2× slowdown it is sometimes one frame step slower.

---

## v0.6.1: No beetroot or bananas (shipped)

- [x] Bananas replaced in 7 recipes: pear, strawberries, apple or frozen berries as toppings and fillers, unsweetened apple purée as the binder in baked oats and mug cakes. Renamed: "Protein oats with pear, strawberries and peanut butter", "Skyr with strawberries, mango and granola", "Apple-cinnamon peanut butter mug cakes".
- [x] The strawberry and beetroot juice is now strawberry, apple and lime.
- [x] Both removed from the ingredient catalogue and the price list; apple purée added.
- [x] `tools/check-year.js` fails on any banned ingredient, in ingredient lists, names or directions.

---

## Later

### Check prices in the store (was v0.2.1)

Goal: replace the estimates with real prices from a K-chain market.

Scope
- [ ] Check all 86 ingredients on K-Ruoka with a K-chain market selected, in a browser session, and record product, pack sizes, prices and date. Use a second K-chain store for anything the first store doesn't stock.
- [ ] Set `status: "checked"` and the `checked` date for each.
- [ ] Price one sample week's shopping list as a real K-Ruoka basket and compare with the app's checkout total.

Checks
- `node tools/check-prices.js` reports 0 estimates.
- Sample basket within about 10 % of the app's total.

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
| v0.2 | 2026-10-18 | Prices, pack guidance, leftover warnings, month cost summary. Prices are estimates; store check moved to the backlog. |
| v0.3 | 2026-10-18 | Year, month and day zoom with pinch, trackpad, keyboard and buttons; swipe between months and days; phone agenda at month level. |
| v0.4 | 2026-10-18 | 82 recipes, waste-aware weekly rotation, cook once eat twice, seasons, weekday budget lean. Waste estimate 7.56 → 4.06 € a week. |
| v0.4.1 | 2026-10-18 | Review fixes: link validation, 2032 range cap, restore on today, yearly use cap, smoother touch pinch and swipe, browser test suite. |
| v0.5 | 2026-10-18 | Full HTML document for Pages (fixes iPhone quirks mode), plan built ahead, 1:1 pinch, continuous zoom, page-turn swipe, prepared layers; start-up 700 → 31 ms. |
| v0.5.1 | 2026-10-18 | Swipe down to close the day sheet; the page behind no longer scrolls. |
| v0.6 | 2026-10-18 | Light/dark/automatic theme switch, RagdollLabs cat logo and footer, visual refresh, fix for page stretch from hidden layers. |
| v0.6.1 | 2026-10-18 | No beetroot or bananas: 8 recipes adjusted, banned-ingredient check added. |
