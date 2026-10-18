# RagdollLabs-nutritional-plan

A year-view meal calendar for two people doing strength training while losing fat. The recipes adapt the style of Healthy Ivonne's "Come Conmigo" plans: Mexican home cooking, spicy, with every ingredient available in Finnish supermarkets.

Open `index.html` in a browser. It is a single self-contained page with no server and no install.

## What it does

- Twelve months centred on the current month, with ISO week numbers and Monday-first weeks.
- Three zoom levels: year, month and day. Pinch out on a month or day to open it and pinch in to go back; on desktop use trackpad pinch, Ctrl + scroll, the − / + buttons or the + and − keys. Swipe or use the arrow keys to move between months or days. Taps and clicks work the same at every level.
- At month level each day shows its three meals and both people's protein. Phones get a list of days instead of a grid so the meal names stay readable.
- The current level is kept in the page address (for example `#m2026-10` or `#d2026-10-18`), so a bookmark opens straight to a month or a day.
- Tap a day for breakfast, lunch, dinner and optional snacks, with protein and calories per person.
- Tap a meal for ingredients for two, directions and how to split the portions.
- Tap a week number for daily totals, weekly cost and a shopping list that says which pack sizes to buy, what will be left over, and what is likely to go to waste.
- Tap a month name for the month's food cost and daily average.
- Food cost is shown for the household per recipe, day, week and month.
- Any single meal can be swapped. Swaps are saved in the browser on that device only.

## Portions

Each meal is planned for two and split between Person 1 and Person 2. Where possible the split is by count (for example 6 vs 4 tacos), otherwise about 57 / 43. Each person has a daily protein target. Every day also lists a morning juice and two optional snacks you can both have: snack 1 is protein-focused and counted in the daily totals, snack 2 is a light fruit or vegetable snack.

## Food rules

- No fish, seafood, eggplant or zucchini.
- No pork mince or thick pork cuts. Bacon and chorizo are allowed.
- Mince is always 100 % beef or turkey. Refried beans must be lard-free.
- Greek yoghurt replaces mayonnaise and sour cream on regular days. Saturday dinner is a cheat night.
- Ingredients that are hard to find in Finland are swapped: kohlrabi for jícama, leipäjuusto or light halloumi for panela, mozzarella for Oaxaca cheese, lingonberries for cranberries, chilli-lime salt for Tajín and chamoy.

## Rotation

82 recipes: 20 breakfasts (6 weekend-only), 30 lunches, 24 dinners and 8 cheat dinners. The plan is generated deterministically, so a date always gets the same meals. Minimum days between repeats:

| Slot | Gap |
|---|---|
| Weekday breakfast | 7 |
| Weekend breakfast | 10 |
| Lunch | 14 |
| Dinner | 18 |
| Cheat dinner | 35 |

Each pick also weighs:

- **Food waste.** The rotation tracks which perishable packs are opened in each shopping week (Monday to Sunday) and prefers recipes, juices and snacks that use up what is already open. Two morning juices are picked per week and alternated, so herbs and beetroot get used.
- **Cook once, eat twice.** Dinners marked for it are cooked as a double batch and become the next day's lunch. Swapping either meal undoes the pairing.
- **Season.** Soups and stews lean toward November–March, grill dishes toward May–August.
- **Weekday budget.** Monday to Thursday dinners lean slightly toward cheaper recipes.
- **Variety and protein.** Dinners avoid repeating the main protein of the previous dinner or the same day's lunch, and lean toward the one that brings the day's protein closest to target.

## Project layout

```
index.html            built page (generated, do not edit by hand)
src/data.js           targets, ingredient catalogue with nutrition values, recipes, optional snacks
src/prices.js         prices, pack sizes, shelf life and freezing per ingredient
src/pricing.js        recipe costs, cheapest pack mix and leftover advice
src/engine.js         rotation engine and daily protein/calorie calculation
src/app.html          page layout, styles and UI code
build.py              inlines src/*.js into src/app.html and writes index.html
tools/check-year.js   runs a year of the plan and reports protein, snacks and repeat violations
tools/check-prices.js reports missing prices, remaining estimates, stale prices and cost levels
tools/check-waste.js  estimates weekly food waste across a year of plans
```

## Changing things

1. Edit files in `src/`. To add a recipe, add an entry to `RECIPES` in `src/data.js` using ingredient ids from `CAT`. Protein and calories are calculated from the ingredient weights.
2. Run `node tools/check-year.js` to confirm targets are still met and no repeat rules are broken, `node tools/check-prices.js` to confirm every ingredient has a price, and `node tools/check-waste.js` to see the waste estimate.
3. Run `python3 build.py` to rebuild `index.html`.

## Prices

Prices are for a K-chain market, with a second K-chain store as the second store. They are estimates until checked in the store; each entry in `src/prices.js` has a `status` (`estimate` or `checked`) and the date it was checked. To update a price, change the pack prices, set `status: "checked"` and the `checked` date.

The shopping list picks the cheapest mix of pack sizes that covers the week, preferring fewer packs when the price is within 3 %. Long-life items (dry goods, frozen food, protein powder) are listed separately with how long a pack lasts, and are not counted in the weekly checkout total.

## Planned

See [RELEASE_PLAN.md](RELEASE_PLAN.md) for upcoming releases.

Nutrition values are per 100 g estimates for typical Finnish supermarket products. Check labels if exact numbers matter.
