// Estimates weekly food waste with the same trip planner the app uses
// (three shopping trips a week, shelf life per pack, all extras ticked).
// Usage: node tools/check-waste.js
const P = require("../src/pricing.js");
const E = require("../src/engine.js");

function week(mon) {
  const plans = [];
  for (let k = 0; k < 7; k++) { const dt = new Date(mon + k * 864e5); plans.push(E.day(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())); }
  return P.shoppingWeek(plans);
}

const start = Date.UTC(2025, 11, 29); // Monday of ISO week 1, 2026
const weeks = [], byItem = {}, cost = [];
let fails = 0;
for (let w = 0; w < 52; w++) {
  const r = week(start + w * 7 * 864e5);
  weeks.push(r.waste); cost.push(r.total);
  for (const l of r.leftovers) if (l.kind === "waste") byItem[l.id] = (byItem[l.id] || 0) + l.value;
  // Every day's need must be covered by food that is within its shelf life that day.
  for (const tr of r.trips) for (const ln of tr.lines) if (ln.short > 1e-6) { console.log("Not covered:", "week", w + 1, ln.id, ln.short.toFixed(0)); fails++; }
}
const avg = weeks.reduce((a, b) => a + b, 0) / weeks.length;
console.log(`Estimated waste: ${avg.toFixed(2)} € a week on average, worst week ${Math.max(...weeks).toFixed(2)} €`);
console.log(`Checkout (three trips): ${(cost.reduce((a, b) => a + b, 0) / cost.length).toFixed(2)} € a week on average`);
console.log("Top items over the year: " + Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(0)} €`).join(", "));
// Shelf-life rules on fixed examples.
function expect(name, ok) { console.log((ok ? "ok   " : "FAIL ") + name); if (!ok) fails++; }
const T = P.TRIPS, empty = () => [{}, {}, {}, {}, {}, {}, {}];
{ // Skyr keeps 5 days once opened: Monday's leftover must not be used on Sunday.
  const n = empty(); n[0].skyr = 400; n[6].skyr = 400; const r = P.planTrips(n, T);
  const sun = r.trips[2].lines.find(l => l.id === "skyr");
  expect("skyr opened Monday is not used on Sunday", sun && sun.fromEarlier === 0 && sun.buy);
}
{ // Chicken keeps 2 days once opened, but freezes: the rest is frozen and used later.
  const n = empty(); n[0].chk = 300; n[4].chk = 150; n[6].chk = 150; const r = P.planTrips(n, T);
  expect("chicken left on Monday is frozen for Friday", r.trips[0].freeze.some(f => f.id === "chk" && /after Mon, for Fri/.test(f.text)));
  expect("no chicken bought for Friday-Sunday", !r.trips[2].lines.find(l => l.id === "chk").buy);
}
{ // Non-freezing food past its shelf life stays in the waste count.
  // Milk keeps 5 days once opened: Monday's carton is past it on Saturday.
  const n = empty(); n[0].milk = 300; n[5].milk = 300; const r = P.planTrips(n, T);
  const sat = r.trips[2].lines.find(l => l.id === "milk");
  expect("milk opened Monday counts as waste, Saturday buys new", sat.buy && sat.fromEarlier === 0 && r.leftovers.some(l => l.id === "milk" && l.kind === "waste" && l.amt > 650));
}
if (fails) { console.log("FAILED"); process.exitCode = 1; }
