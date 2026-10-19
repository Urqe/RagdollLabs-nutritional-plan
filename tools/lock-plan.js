// Extends the plan lock (src/plan-lock.js) to a date, using the meals the current rotation
// gives. Run it before a release that changes recipes, prices or rotation rules, with the
// last day that must stay as already shown (usually the Sunday of the current week):
//   node tools/lock-plan.js 2026-11-01
// The lock never shrinks: an earlier date than the current lock end is refused.
const fs = require("fs");
const path = require("path");
const E = require("../src/engine.js");
const { PLAN_LOCK_UNTIL } = require("../src/plan-lock.js");

const until = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(until || "")) { console.error("Usage: node tools/lock-plan.js YYYY-MM-DD"); process.exit(1); }
if (until < PLAN_LOCK_UNTIL) { console.error(`The lock already runs to ${PLAN_LOCK_UNTIL}; it never shrinks.`); process.exit(1); }
const [y, m, d] = until.split("-").map(Number);
const n = E.idxOf(y, m - 1, d);
if (n < 0 || n > E.MAX_DAYS) { console.error("Date outside the plan range."); process.exit(1); }

const rows = E.exportTable(n).split(";").slice(0, n + 1);
const file = path.join(__dirname, "..", "src", "plan-lock.js");
const src = fs.readFileSync(file, "utf8")
  .replace(/var PLAN_LOCK_UNTIL = "[^"]*";/, `var PLAN_LOCK_UNTIL = "${until}";`)
  .replace(/var PLAN_LOCK = "[^"]*";/, `var PLAN_LOCK = "${rows.join(";")}";`);
fs.writeFileSync(file, src);
console.log(`Plan locked through ${until} (${rows.length} days).`);
