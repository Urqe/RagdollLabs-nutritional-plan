# RagdollLabs-nutritional-plan

A year-view meal calendar for two people doing strength training while losing fat. Mexican-style food, spicy, with ingredients available in Finland.

Open `index.html` in a browser. It is a single self-contained page with no server and no install.

## What it does

- Twelve months centred on the current month, with ISO week numbers and Monday-first weeks.
- Tap a day for breakfast, lunch, dinner and optional snacks, with protein and calories per person.
- Tap a meal for ingredients for two, directions and how to split the portions.
- Tap a week number for daily totals, weekly averages and a combined shopping list.
- Any single meal can be swapped. Swaps are saved in the browser on that device only.

## Portions

Each meal is planned for two and split between Person 1 and Person 2. Where possible the split is by count (for example 6 vs 4 tacos), otherwise about 57 / 43. Each person has a daily protein target. Every day also lists two optional snacks you can both have. Daily totals include optional snack 1.

## Food rules

- No fish, seafood, eggplant or zucchini.
- No pork mince or thick pork cuts. Bacon and chorizo are allowed.
- Mince is always 100 % beef or turkey. Refried beans must be lard-free.
- Greek yoghurt replaces mayonnaise and sour cream on regular days. Saturday dinner is a cheat night.

## Rotation

50 recipes: 12 breakfasts (4 weekend-only), 18 lunches, 15 dinners and 5 cheat dinners. The plan is generated deterministically, so a date always gets the same meals. Minimum days between repeats:

| Slot | Gap |
|---|---|
| Weekday breakfast | 5 |
| Lunch | 9 |
| Dinner | 12 |

Dinners also avoid repeating the main protein of the previous dinner or the same day's lunch where possible.

## Project layout

```
index.html            built page (generated, do not edit by hand)
src/data.js           targets, ingredient catalogue with nutrition values, recipes, optional snacks
src/engine.js         rotation engine and daily protein/calorie calculation
src/app.html          page layout, styles and UI code
build.py              inlines src/*.js into src/app.html and writes index.html
tools/check-year.js   runs a year of the plan and reports protein, snacks and repeat violations
```

## Changing things

1. Edit files in `src/`. To add a recipe, add an entry to `RECIPES` in `src/data.js` using ingredient ids from `CAT`. Protein and calories are calculated from the ingredient weights.
2. Run `node tools/check-year.js` to confirm targets are still met and no repeat rules are broken.
3. Run `python3 build.py` to rebuild `index.html`.

Nutrition values are per 100 g estimates for typical Finnish supermarket products. Check labels if exact numbers matter.
