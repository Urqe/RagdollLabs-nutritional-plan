# Release plan

Working plan for the meal plan calendar. Each release has a goal, a scope checklist and the checks that must pass before it ships. Tick items as they land and move finished releases to the log at the bottom.

## How a release ships

1. Create a branch: `release/vX.Y`.
2. If the release can change which meals are picked (recipes, prices, rules), first lock the plan through the current Sunday: `node tools/lock-plan.js YYYY-MM-DD`. Then make the changes in `src/`, `tools/` or the docs. Never edit `index.html` by hand.
3. Run the checks:
   - `node tools/check-year.js`: exits with an error if a guarantee breaks (banned or unknown ingredient, missing nutrient values, a locked day changed, repeat violation, weekday time limit, weekly protein below target).
   - `node tools/check-prices.js`: every ingredient priced, no unit mismatches.
   - `node tools/check-waste.js`: shelf-life examples pass; weekly waste estimate not clearly higher than the last release.
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

Nothing scheduled. Candidates are in Later; the real-device check from v0.11 is still open.

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
- [ ] Replace estimates with checked prices from the reference store. Done in v0.13.
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
- [ ] A sample week's shopping total matches a real K-Ruoka basket within about 10 %. Done in v0.13.

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

- [x] Git history rewritten on every branch to remove the store names, then force-pushed (2026-10-19). Copies cloned before that are not affected.

Checks
- No store names in tracked files or either built page (manual search; the names are not written into a check script).

---

## v0.9: Correct numbers (shipped)

Goal: what the app says matches what you buy, cook and eat.

- [x] Shelf life by the day food is eaten. Each pack is tracked on its own; shelf life counts from opening (from buying, for loose produce). Expired leftovers stay in the waste figure.
- [x] Freezing: food that freezes is frozen on its last good day when a later day needs it, so the trip planner no longer buys a second pack for it. The trip shows "freeze the rest after Mon, for Fri"; end-of-week freezing is listed on the trip that covers that day.
- [x] Totals and shopping cover the same food. Tick boxes for the juice, snack 1 and snack 2 in the day view (saved on the device, all ticked by default); protein, calories, cost and shopping all follow them.
- [x] Swapping a meal refreshes the prepared next and previous pages, so a swapped double-batch dinner can't leave a stale leftover lunch on the next day.
- [x] Leftover lunch is the selected first entry in the swap list; any lunch, including the first, can be picked. The note says replacing it makes yesterday's dinner a single batch and how much less that is to buy.
- [x] Passata's Finnish label is now "paseerattu tomaatti".
- [x] `tools/check-waste.js` uses the app's trip planner (`Pricing.shoppingWeek`) and checks fixed shelf-life examples.
- [x] `tools/check-year.js` exits with an error on banned or unknown ingredients, repeat violations, or weekly protein below target (checked with meals and snack 1 only).
- [x] Duplicate `animate()` and `reduceMotion()` removed.
- [x] Plan range text is exact: 6 January 2025 to 4 January 2033.
- [x] If the browser blocks saving, the swap note says so. Stored swaps and extras are checked on load; unknown entries are dropped.
- [x] Browser tests for extras, swap refresh and the leftover swap list. The swap refresh test fails with the old code.

Results: waste estimate 2.96 € a week (was 4.04 € with the old one-shop model), checkout about 202 € a week with all extras ticked.

---

## v0.10: Cook and shop from the app (shipped)

Goal: everything on the day's plan can be made and bought using only the app.

- [x] Juices and snacks open like meals: ingredients for two, directions, protein and calories per serving. Juice names now list every ingredient.
- [x] Double-batch dinners show the doubled amounts and say to eat half tonight and keep half for tomorrow. Leftover lunches lead with reheating and serving, with yesterday's recipe folded below.
- [x] Weekday cooking time: Monday to Thursday dinners and weekday lunches take at most 60 minutes. A fixed rule in the engine rather than a device setting, so every device shows the same meals. The 150-minute stew now lands on Fridays and Sundays; `tools/check-year.js` fails if a weekday meal goes over.
- [x] Copy trip: items with Finnish names, a "check at home" list (long-life items with amounts, pantry items), freezer steps and the trip total.
- [x] Tick items off while shopping, saved per trip and week on the device, with a count in each trip.
- [x] "Have it" per item takes it off the trip and the totals. "First trip" picker for starting mid-week: earlier trips are skipped and nothing is assumed bought on them.
- [x] Checkout total says plainly that long-life restocking is not included.
- [x] Browser tests for all of the above.

---

## v0.10.1: Safari pinch at year level (shipped)

- [x] At year level the app no longer blocks a closing pinch. There is no level above Year, so the gesture is left to the browser and Safari on iPhone and iPad opens its tab overview as usual. A spreading pinch is still claimed on the first finger movement and opens a month. Month and day levels are unchanged.
- [x] Browser tests check that no touch event is cancelled during a closing pinch at year level, and that every event is claimed during a spreading one.
- Needs a check on a real iPhone: the browser tests run in Chromium, not Safari.

---

## v0.11: Today first, phone and iPad (shipped)

Goal: the everyday questions (what do we cook today, what do we buy next) are one tap away, and the app behaves on iPad rotation and with a keyboard.

- [x] Opens on today. `#year`, `#m…` and `#d…` links still open that level. A "This week" button (basket icon on phones) next to − and + opens the current week's shopping from any level.
- [x] Desktop and iPad landscape: the week and month summaries get a side panel up to 620 px wide, so the week table fits without sideways scrolling. Recipes keep the narrower panel.
- [x] Touch screens: header and zoom buttons at least 44 px tall (icon buttons 40 px wide so the phone header still fits), 44 px close button, wider week-number column. Month names are shortened in the breadcrumb on phones so it stays on one line.
- [x] Person 1 before Person 2 in recipe splits, the day view and meal summaries.
- [x] Move a plan between devices: "This device" section exports swaps, extras and shopping lists to a JSON file (share sheet on phones and tablets, download elsewhere) and imports one. Imported and stored data go through the same checks; a wrong file changes nothing. Open tabs on the same device follow each other's changes.
- [x] Rotation and resize: crossing the desktop width resets the sheet and its screen-reader state, rebuilds pages laid out for the old width, and draws the right panel content.
- [x] Day sheet as a dialog: `role="dialog"`, `aria-modal`, the page behind inert and hidden from screen readers while open, the sheet hidden while closed, focus moved in on open and back on close, Escape closes, arrow and +/− keys pause while the sheet is open or focus is in the panel. Focus is kept when the panel or calendar is redrawn.
- [ ] Test on a real iPhone and iPad in Safari, including VoiceOver and larger text. The browser tests run in Chromium only. Left open for you.

---

## v0.12: Fat, carbs and fibre; tortilla products; plan lock (shipped)

Goal: show the full nutrient picture and use the tortilla products we actually buy. Checking values against Fineli and labels, and prices in the stores, could not be done in this release (no browser on the user's computer, and both sites block automated reading); see "Check nutrition and prices" under Later.

- [x] Fat, carbohydrate and fibre per 100 g for every ingredient with nutrition values; chillies and limes now count too. Each ingredient's kcal matches its nutrients within 25 % (checked by `tools/check-year.js`). All values are marked as estimates in the data and on the page.
- [x] Day view: fat, carbs and fibre per person next to protein and kcal. Recipe view: per person's portion. Snacks and juices: per serving. Week view: daily averages per person.
- [x] Tortillas: Don Tortilla 14 cm corn tortillas, El Taco Truck wheat tortillas (15, 20 and 25 cm), and a new Antalya Dürüm 30 cm wheat tortilla for burritos and chimichangas (chicken burritos, beef chimichangas). Breakfast burritos keep the 20 cm size. Pack sizes and prices for these are estimates.
- [x] Tostadas: always corn tortillas baked at home ("Make the tostadas: brush lightly with oil, bake on a rack at 200 °C for 8–10 minutes, turning once"). `tools/check-year.js` fails if a tostada recipe uses anything else, or a burrito misses the 30 cm tortillas.
- [x] Plan lock: the new values and products would have reshuffled the rotation, including this week. Days up to Sunday 25 October 2026 are now fixed in `src/plan-lock.js` exactly as they were shown; the rotation replays them and picks new meals only after. `tools/lock-plan.js` extends the lock; the shipping routine now says when to run it.

Results: weekly protein averages unchanged in shape (Person 1 111–118 g, Person 2 150–162 g); waste estimate 2.79 € a week; checkout about 201 € a week.

---

## v0.13: Checked nutrition and prices (shipped)

Goal: replace the estimated nutrition values and prices with checked ones (was "Check nutrition and prices" under Later). Done in a browser on the user's computer on 2026-10-22. Reference stores are named in the request only, never in the repo.

Prices
- [x] Every priced ingredient checked on K-Ruoka with the first reference store selected: product, pack sizes, normal shelf price (no offers or Plussa prices). The first store stocked everything that either store stocks, so the second store was only used to confirm the gaps below.
- [x] All 93 entries marked `status: "checked"` with the date. New prices for grated cheese, feta, kidney beans and red lentils, which had none.
- [x] Pack sizes follow what the store sells (e.g. chicken breast 600 g, skyr 400 g, salsa verde 230 g, corn tortillas 250 g). The waste check's chicken example now uses amounts that fit a 600 g pack.

Not stocked in either store, with substitutes
- Chicken thigh fillets: only bone-in thigh pieces are sold. Recipes now use chicken breast fillets.
- Beef mince 5 %: only 10 % and 17 % are sold. Recipes now use 10 %.
- Habanero: now red chilli ("or habanero" if found).
- Light halloumi: now regular halloumi.
- El Taco Truck 15 cm and 25 cm wheat tortillas: the 15 cm slot uses El Taco Truck Street tortillas (8 × 18 g), the 25 cm slot Santa Maria Large (6 per pack).

Nutrition
- [x] Packaged products: protein, kcal, fat, carbohydrate and fibre from the product label on K-Ruoka. Loose produce: the store's produce data, which matches Fineli's figures. Fineli itself showed a bot check that could not be passed.
- [x] Source per ingredient in `src/data.js` (`src: "label"` or `"produce"`) and the check date in `NUTRI_CHECKED`. Spices, dried chillies and a few condiments keep typical values (small amounts).
- [x] Tortilla piece weights from the packs: El Taco Truck 20 cm 8 × 40 g, Street 8 × 18 g, Antalya Dürüm 30 cm 8 × 100 g. Don Tortilla's pack (250 g) doesn't state a count; 10 × 25 g assumed.
- [x] Page notes: prices are "normal shelf prices from a K-chain market, checked <date>"; nutrition notes say where values come from.

Checks
- [x] `node tools/check-prices.js`: 0 estimates, no missing prices.
- [x] Sample basket: the week of 26 October priced live, product by product, at the first reference store: 235.38 €, same as the app's checkout total. Loose produce is priced per piece at the store's approximate weight, so the till will differ slightly.
- [x] Weekly protein with checked values: Person 1 108–117 g, Person 2 146–161 g (targets 105 and 140).
- [x] Plan lock: all 658 locked days unchanged. UI tests pass.

Results: food cost 28.39 € a day (was 23.66 € with estimates); checkout about 224 € a week (was 201 €); waste 2.71 € a week (was 2.79 €). The biggest price gaps against the estimates were beef cuts, corn tortillas (Don Tortilla 5.15 € a pack), whey protein and frozen strawberries.

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

### Recipe style tags
- [ ] Add a `style` field to every recipe. Tag the current library `mexican` (the Healthy Ivonne-style base).
- [ ] `comfort` for non-Mexican healthy recipes, such as those adapted from Alex Hughes (see below).
- [ ] The tag list stays open: new tags are added when a new recipe source justifies one.
- [ ] Rotation balances styles across the week instead of clustering them.
- [ ] Show the style on the recipe and day views.
- Retagging the current library doesn't depend on new recipes, so it can ship on its own first.

### Recipe expansion: Alex Hughes, "Low-Cal Kitchen Bangers"
- Source: *Low-Cal Kitchen Bangers* (Ebury, 2024) and *20-Minute Low-Cal Kitchen Bangers* (Ebury, 2025). About 200 recipes in total, with macros for each.
- Goal: a second style alongside the Mexican base, made up of healthy comfort-food and American-style meals tagged `comfort`. They don't need to be made Mexican.
- [ ] Prerequisites: access to the books, and a research pass to shortlist recipes.
- [ ] Filter: protein per portion against the targets, remove excluded ingredients, and swap to ingredients available in Finland where needed.
- [ ] Adapted recipes only, with no verbatim copying into this public repo.

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
- [x] Fat, carbohydrate and fibre per ingredient, shown on day, recipe, snack and week views (v0.12; values checked in v0.13).
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
| v0.8 | 2026-10-19 | Store names removed; prices described as based on a K-chain market. Git history rewritten afterwards to remove them from old commits. |
| v0.9 | 2026-10-19 | Shelf life per pack by eating day, freezing for later days, extras tick boxes driving all totals, swap refresh and leftover swap fixes, failing checks. History rewritten to remove store names. |
| v0.10 | 2026-10-19 | Juice and snack recipes, doubled batch amounts, reheat-first leftovers, 60-minute weekday meals, shopping ticks, "Have it", mid-week start, fuller copy text. |
| v0.10.1 | 2026-10-19 | Closing pinch at year level left to Safari (tab overview) instead of being blocked. |
| v0.11 | 2026-10-19 | Opens on today, "This week" shopping button, wide desktop week panel, 44 px touch targets, Person 1 first, export/import between devices, dialog sheet with focus handling, layout changes on rotation. |
| v0.11.1 | 2026-10-19 | Export works in the Claude-hosted copy too (asks the host to save the file). |
| v0.12 | 2026-10-19 | Fat, carbs and fibre in all views (estimates); Don Tortilla, El Taco Truck and Antalya Dürüm tortillas; home-baked tostadas; plan lock keeps planned days fixed. Nutrition and price checks moved to Later. |
| v0.13 | 2026-10-22 | Checked shelf prices and pack sizes for all 93 ingredients; label and produce nutrition; substitutes for products neither store stocks (thigh fillets, 5 % mince, habanero, light halloumi, two tortilla sizes). |
