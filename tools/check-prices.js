// Reports missing prices, remaining estimates and stale prices, plus cost levels.
// Usage: node tools/check-prices.js
const D = require("../src/data.js");
const { PRICES, PRICE_META } = require("../src/prices.js");
const Pricing = require("../src/pricing.js");
const E = require("../src/engine.js");

const STALE_DAYS = 90;
const today = new Date();
const lines = [...D.RECIPES, ...D.SNACKS1, ...D.SNACKS2, ...D.JUICES].flatMap(r => r.ing.map(i => [r.id, i]));

const missing = new Set(), unconvertible = new Set();
for (const [rid, it] of lines) {
  const c = D.CAT[it[0]];
  if (c.pantry) continue;
  if (!PRICES[it[0]]) missing.add(it[0]);
  else if (Pricing.need(it) === 0) unconvertible.add(`${it[0]} (${it[2]} in ${rid})`);
}
const estimates = Object.keys(PRICES).filter(k => PRICES[k].status !== "checked");
const stale = Object.keys(PRICES).filter(k => {
  const d = PRICES[k].checked; if (!d) return false;
  return (today - new Date(d)) / 864e5 > STALE_DAYS;
});

console.log(`Prices based on ${PRICE_META.basis}, updated ${PRICE_META.updated}`);
console.log(`Priced ingredients: ${Object.keys(PRICES).length}`);
console.log(`Missing prices: ${missing.size ? [...missing].join(", ") : "none"}`);
console.log(`Unit mismatches: ${unconvertible.size ? [...unconvertible].join(", ") : "none"}`);
console.log(`Still estimates: ${estimates.length}`);
console.log(`Checked more than ${STALE_DAYS} days ago: ${stale.length ? stale.join(", ") : "none"}`);

let total = 0, n = 0; const months = {};
for (let i = 0; i < 365; i++) {
  const dt = new Date(Date.UTC(today.getUTCFullYear(), 0, 1) + i * 864e5);
  const d = E.day(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  total += d.cost; n++; months[dt.getUTCMonth()] = (months[dt.getUTCMonth()] || 0) + d.cost;
}
const m = Object.values(months);
console.log(`Food cost: ${(total / n).toFixed(2)} € a day, months ${Math.min(...m).toFixed(0)}–${Math.max(...m).toFixed(0)} €`);

process.exit(missing.size || unconvertible.size ? 1 : 0);
