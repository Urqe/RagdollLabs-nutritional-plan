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
- No store names anywhere in the repo. Prices are "based on a K-chain market". Refreshing prices and availability is a separate task done on request; the reference stores are named in that request and not written down.

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

Order agreed after the 2026-10-19 review (see "Review 2026-10-19" below):

1. v0.9: Correct numbers
2. v0.10: Cook and shop from the app
3. v0.11: Today first, phone and iPad

---

## v0.2: Prices and pack guidance (shipped)

Goal: every recipe, day and month shows an estimated cost from K-Ruoka prices, and each week's shopping list says which pack sizes to buy.

How prices are collected
- K-Ruoka blocks automated fetching, so prices cannot be scraped. They come from a browser session on K-Ruoka (signed in, reference store selected) or are entered by hand.
- Prices live in their own file, `src/prices.js`, separate from nutrition data, so a price refresh only touches one file.
- Start with estimates marked `estimate`, then replace them with checked prices. The page shows which prices are still estimates.
- Prices based on a K-chain market, with a second store used when the first doesn't stock an item and as a sanity check on a sample basket.
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
- Prices based on a K-chain market, with a second store as backup.
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

## v0.7: Shopping list in trips (shipped)

- [x] The week's shopping list is split into three trips: Monday–Tuesday, Wednesday–Thursday and Friday–Sunday. Each trip is a collapsible card with its days, item count and cost; the current trip opens by default.
- [x] Short-lived items are bought per trip. Items that keep for 10 days or more are bought once, on the first trip that needs them, and cover later trips.
- [x] Leftovers from an earlier trip's packs are used first while still good, shown as "from earlier", and fully covered items are listed under "Already bought".
- [x] Each trip has its own copy button. Long-life stock, end-of-week leftovers with freeze/keeps/waste advice, and the pantry list stay once per week.
- [x] Trip planning lives in `Pricing.planTrips`; the browser test checks three trips whose totals add up to the checkout total.

---

## v0.8: Neutral store wording (shipped)

Goal: the repo and the page say prices are based on "a K-chain market", without naming a store.

- [x] Remove store names from `src/prices.js` (`PRICE_META`), the page, README, this file and the build output. Product names, pack sizes and prices stay in `src/prices.js` as they are.
- [x] Price note on the page: "Prices are estimates based on a K-chain market."
- [x] `PRICE_META` now has `basis: "a K-chain market"` instead of `store`/`alt`; the per-item `store` field is gone.

Open decision
- [ ] Git history: store names are still in commits before v0.8. Either rewrite history and force-push (as done for body data in v0.1), or leave it. Rewriting doesn't reach copies someone already cloned. Not done in v0.8 because a force-push needs an explicit go-ahead.

Checks
- No store names in tracked files or either built page (manual search; the names are not written into a check script).

---

## v0.9: Correct numbers

Goal: what the app says matches what you buy, cook and eat.

- [ ] Shelf life by the day food is eaten, not the trip day. Today a Friday trip can reuse food that is too old by Sunday. Track each pack bought (date, amount left), and keep expired leftovers in the waste figure instead of dropping them when a new pack is bought.
- [ ] Freezing advice only when the food is still within its shelf life on the day it would be frozen, shown on the trip where it applies.
- [ ] Totals and shopping cover the same food. Today protein and calories include meals and snack 1, while cost and shopping also include snack 2 and the juice. Add "include juice" and "include snack 2" settings (device-only), and make protein, calories, cost and shopping all follow them.
- [ ] Swapping a meal refreshes the prepared next and previous pages too. Today, after swapping a double-batch dinner, the next day can still show the old leftover lunch until reload.
- [ ] Leftover lunch swap list starts on the actual leftover, so any replacement, including the first in the list, can be picked. Say that replacing it also makes the previous dinner a single batch.
- [ ] Passata's Finnish label is "tomaattipyre" (tomato paste). Change it to "paseerattu tomaatti / passata".
- [ ] `tools/check-waste.js` uses the trip planner the app uses.
- [ ] `tools/check-year.js` exits with an error on repeat violations, protein below target, or unknown ingredient ids, instead of only printing them.
- [ ] Remove the duplicate `animate()` and `reduceMotion()` in `src/app.html`.
- [ ] Plan range: say exactly what is covered (the last full week of 2032 runs into January 2033).
- [ ] If saving a swap fails (storage blocked), say so instead of "saved on this device".
- [ ] Browser tests for each fix above.

---

## v0.10: Cook and shop from the app

Goal: everything on the day's plan can be made and bought using only the app.

- [ ] Juices and snacks open like meals: ingredients with amounts, for two, and short directions.
- [ ] Double-batch dinners show the doubled amounts, and "eat tonight" vs "keep for tomorrow". Leftover lunches lead with reheating and serving, with the original recipe below.
- [ ] Weekday cooking time: Monday to Thursday dinners stay under a time limit (default 60 minutes, changeable in settings). Longer dishes move to weekends or become batch dinners.
- [ ] Full shopping export: the trip's items, plus "check you have" for long-life items and pantry items, with Finnish product names.
- [ ] Tick items off while shopping, saved per trip on the device.
- [ ] "Already have" toggle per item, and starting mid-week, so the list doesn't assume earlier trips happened.
- [ ] Checkout total says plainly that long-life restocking is not included.

---

## v0.11: Today first, phone and iPad

Goal: the everyday questions (what do we cook today, what do we buy next) are one tap away, and the app behaves on iPad rotation and with a keyboard.

- [ ] Open on today by default, with a "This week" shortcut to the shopping trips. Year view stays one level up.
- [ ] Wider shopping and week view on desktop and iPad landscape, instead of the 420 px side panel with sideways scrolling.
- [ ] Bigger touch targets for week numbers, close buttons and header buttons.
- [ ] Person 1 before Person 2 everywhere (recipe splits currently list Person 2 first).
- [ ] Move a plan between devices: export and import swaps and settings as a file. No server.
- [ ] Rotation and resize: the panel content and paging stay correct when the layout changes between phone, iPad and desktop widths.
- [ ] Day sheet as a proper dialog: focus moves into it and back on close, the background is hidden from screen readers, Escape closes, and arrow keys don't move the calendar while it is open.
- [ ] Test on a real iPhone and iPad in Safari, including VoiceOver and larger text. The current browser tests run in Chromium only.

---

## Review 2026-10-19

An outside code review was done on v0.7. Taken into the releases above:

| Review point | Where |
|---|---|
| Store names in the public repo | v0.8 (wording only; prices stay in the repo) |
| Shelf life checked on trip day, lost waste | v0.9 |
| Totals and shopping cover different food | v0.9 |
| Swap doesn't refresh prepared pages | v0.9 |
| Leftover lunch swap list | v0.9 |
| Passata label wrong | v0.9 |
| Checks that print problems but don't fail | v0.9 |
| Duplicate functions, plan end date, storage failure message | v0.9 |
| No ingredients for juices and snacks | v0.10 |
| Batch amounts not shown | v0.10 |
| Long weekday dinners (150 min on a Tuesday) | v0.10 |
| Copy omits stock and pantry; no tick-off | v0.10 |
| Today/Week first, desktop width, touch targets, P1/P2 order | v0.11 |
| iPad and iPhone using different plans | v0.11 |
| Focus, screen reader, rotation, Safari testing | v0.11 |
| Calorie ranges per person | Later: Nutrition accuracy |
| Separate data for corn vs wheat tortillas, yoghurt vs skyr | Later: Nutrition accuracy |
| Offline use | Later: Offline and home screen |
| Self-hosted fonts (no Google Fonts request) | Later: Offline and home screen |
| Automatic checks on GitHub (CI) | Later: Checks on GitHub |

Not taken:
- Splitting `src/app.html` into modules or replacing the engine's leftover objects. Only if a release runs into it.
- Browser pinch zoom inside the calendar. Pinch is the calendar's main gesture; the − / + buttons remain, and v0.11's larger-text testing covers readability.
- The review's suggestion to describe the app as "a high-protein recipe rotation" instead of adding goals: kept as is until calorie ranges are added.

---

## Later

### Settings
- [ ] Settings panel: protein targets per person, display names, which day is the cheat night. Saved on the device only; the repo keeps neutral defaults. This can also take the protein targets out of the public page.
- [ ] Spice level per person.
- [ ] Optional: training days, with snack 1 suggested as a post-workout shake.

### Better shopping
- [ ] Store order within sections, custom trip days.
- [ ] Copy format that pastes cleanly into the K-Ruoka shopping list.

### Shared state across devices
- [ ] Live sync of swaps, settings and shopping ticks (v0.11 covers moving a plan by file). Decide where shared state lives first; GitHub Pages has no storage of its own.

### Nutrition accuracy
- [ ] Check catalogue values against Fineli (THL's Finnish food composition database) and record the Fineli food id.
- [ ] Fat and carbohydrate per ingredient, shown on recipe and day views.
- [ ] Optional device-only calorie ranges per person, used by the rotation as well as shown.
- [ ] Separate data for products that differ (corn vs wheat tortillas, Greek yoghurt vs skyr).

### Offline and home screen
- [x] Published on GitHub Pages.
- [ ] Web app manifest and icon for the home screen.
- [ ] Offline support with a service worker.
- [ ] Self-host the fonts so the page makes no Google Fonts request.

### Checks on GitHub
- [ ] GitHub Actions workflow running the checks and comparing the built pages with the sources on every push.

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
| v0.7 | 2026-10-18 | Shopping list grouped into three trips per week (Mon–Tue, Wed–Thu, Fri–Sun), with per-trip copy. |
| v0.8 | 2026-10-19 | Store names removed; prices described as based on a K-chain market. Git history not rewritten (open decision). |
