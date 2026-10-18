// Estimates weekly food waste: perishable leftovers from the cheapest pack mix
// that will likely spoil before the next week (same rules as the shopping list).
// Usage: node tools/check-waste.js
const D = require("../src/data.js");
const { PRICES } = require("../src/prices.js");
const P = require("../src/pricing.js");
const E = require("../src/engine.js");

function weekWaste(mon) {
  const need = {};
  for (let k = 0; k < 7; k++) {
    const dt = new Date(mon + k * 864e5);
    const d = E.day(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
    if (!d) continue;
    const add = (it, m) => { const c = D.CAT[it[0]]; if (c.pantry || !PRICES[it[0]]) return; need[it[0]] = (need[it[0]] || 0) + P.need(it) * m; };
    for (const s of ["b", "l", "d"]) { const r = d.meals[s]; const m = r.leftover ? 0 : (r.batch || 1); r.ing.forEach(it => add(it, m)); }
    d.snacks.forEach(sn => sn.ing.forEach(it => add(it, 2)));
    d.juice.ing.forEach(it => add(it, 2));
  }
  let waste = 0; const items = {};
  for (const id of Object.keys(need)) {
    if (need[id] <= 0 || P.isStock(id)) continue;
    const res = P.bestPacks(id, need[id]); const adv = P.leftoverAdvice(id, res);
    if (adv && adv.kind === "waste") { waste += adv.value; items[id] = (items[id] || 0) + adv.value; }
  }
  return { waste, items };
}

const start = Date.UTC(2025, 11, 29); // Monday of ISO week 1, 2026
const weeks = []; const byItem = {};
for (let w = 0; w < 52; w++) {
  const r = weekWaste(start + w * 7 * 864e5); weeks.push(r.waste);
  for (const [k, v] of Object.entries(r.items)) byItem[k] = (byItem[k] || 0) + v;
}
const avg = weeks.reduce((a, b) => a + b, 0) / weeks.length;
console.log(`Estimated waste: ${avg.toFixed(2)} € a week on average, worst week ${Math.max(...weeks).toFixed(2)} €`);
console.log("Top items over the year: " + Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(0)} €`).join(", "));
