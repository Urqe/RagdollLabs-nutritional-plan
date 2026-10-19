// ---- Rotation engine -----------------------------------------------------
// Deterministic: the same date always gets the same meals (before swaps).
// Each pick scores candidates on: time since last use (with hard repeat gaps),
// variety of main protein, the day's protein balance, season, weekday budget,
// and food waste (prefer using packs opened earlier in the same shopping week).
var Engine = (function () {
  var D = (typeof module !== "undefined") ? require("./data.js") : null;
  var CATX = D ? D.CAT : CAT, RX = D ? D.RECIPES : RECIPES, S1 = D ? D.SNACKS1 : SNACKS1, S2 = D ? D.SNACKS2 : SNACKS2, JX = D ? D.JUICES : JUICES,
      PX = D ? D.PEOPLE : PEOPLE, SHARE = D ? D.DEFAULT_SHARE : DEFAULT_SHARE;
  var PR = (typeof module !== "undefined") ? require("./pricing.js") : (typeof Pricing !== "undefined" ? Pricing : null);
  var PRICEX = (typeof module !== "undefined") ? require("./prices.js").PRICES : (typeof PRICES !== "undefined" ? PRICES : {});

  var EPOCH = Date.UTC(2025, 0, 6); // a Monday
  var DAY = 86400000;
  // The plan is generated day by day from EPOCH, so cap how far ahead it goes.
  var MAX_DAYS = 365 * 8; // to the start of 2033
  // Minimum days between repeats.
  var RULES = { breakfast: 7, weekendBreakfast: 10, lunch: 14, dinner: 18, cheat: 35,
    weekdayDinnerTime: 60,   // Monday to Thursday dinners take at most this many minutes
    weekdayLunchTime: 60 };  // weekday lunches too
  // Protein the three meals should give two people together: both targets minus snack 1 each.
  var MEAL_GOAL = PX.p1.protein + PX.p2.protein - 2 * 23;
  // Season months (0 = January): summer May–August, winter November–March.
  var SEASON = { summer: [4, 5, 6, 7], winter: [10, 11, 0, 1, 2] };
  var W = { useLeftover: 3, newLeftover: 2, season: 8, offSeason: 15, budget: 0.6, protein: 0.4, variety: 8 };

  var byId = {}; RX.forEach(function (r) { byId[r.id] = r; });

  function grams(it) {
    var c = CATX[it[0]], a = it[1], u = it[2];
    if (!c) return 0;
    if (u === "g" || u === "ml") return a;
    if (u === "pc") return a * (c.w || 0);
    if (u === "tbsp") return a * (c.t || 0);
    if (u === "tsp") return a * (c.t || 0) / 3;
    return 0;
  }
  // Protein, kcal, fat, carbohydrate and fibre of an ingredient list (grams, kcal).
  function nutrOf(ing) {
    var n = { p: 0, k: 0, f: 0, c: 0, fb: 0 };
    ing.forEach(function (it) {
      var c = CATX[it[0]], g = grams(it);
      if (c && c.p != null) ["p", "k", "f", "c", "fb"].forEach(function (x) { n[x] += g * (c[x] || 0) / 100; });
    });
    return n;
  }
  // Recipes (for two): P protein, K kcal, Fat, Carb, Fib. Extras (one serving): p, k, fat, carb, fib.
  RX.forEach(function (r) { var n = nutrOf(r.ing); r.P = n.p; r.K = n.k; r.Fat = n.f; r.Carb = n.c; r.Fib = n.fb; r.share = r.split ? r.split.share : SHARE; });
  S1.concat(S2, JX).forEach(function (s) { var n = nutrOf(s.ing); s.p = Math.round(n.p); s.k = Math.round(n.k); s.fat = n.f; s.carb = n.c; s.fib = n.fb; });
  // Household cost of what each recipe or extra consumes (snacks and juice are per person).
  RX.forEach(function (r) { r.C = PR ? PR.costOf(r.ing) : 0; });
  S1.concat(S2, JX).forEach(function (s) { s.C = PR ? PR.costOf(s.ing, 2) : 0; });

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var pools = {
    wkBreakfast: RX.filter(function (r) { return r.meal === "breakfast" && !r.weekend; }),
    allBreakfast: RX.filter(function (r) { return r.meal === "breakfast"; }),
    lunch: RX.filter(function (r) { return r.meal === "lunch"; }),
    dinner: RX.filter(function (r) { return r.meal === "dinner" && !r.cheat; }),
    cheat: RX.filter(function (r) { return r.cheat; })
  };
  var avgDinnerC = pools.dinner.reduce(function (s, r) { return s + r.C; }, 0) / pools.dinner.length;

  // Batch-cooked dinner (double portion) and the leftover lunch it becomes.
  var batchCache = {}, leftCache = {};
  function batchOf(r) {
    if (!batchCache[r.id]) { var o = Object.create(r); o.batch = 2; o.C = r.C * 2; batchCache[r.id] = o; }
    return batchCache[r.id];
  }
  function leftoverOf(r) {
    if (!leftCache[r.id]) { var o = Object.create(r); o.leftover = true; o.batch = 0; o.C = 0; o.meal = "lunch"; o.time = 5; leftCache[r.id] = o; }
    return leftCache[r.id];
  }

  // ---- Waste tracking within a shopping week (Monday to Sunday) ----------
  var open = {}; // ingredient id -> amount left in opened packs, in the unit it is sold in
  function perishable(id) { var p = PRICEX[id]; return p && !CATX[id].pantry && !PR.isStock(id) && !p.freezes; }
  function wasteScore(ing, mult) {
    if (!PR || !mult) return 0;
    var s = 0;
    ing.forEach(function (it) {
      var id = it[0]; if (!perishable(id)) return;
      var amt = PR.need(it) * mult; if (amt <= 0) return;
      var have = open[id] || 0, use = Math.min(have, amt), rest = amt - use, up = PR.unitPrice(id);
      s += use * up * W.useLeftover;
      if (rest > 0) {
        var res = PR.bestPacks(id, rest), keepF = PRICEX[id].keeps >= 10 ? 0.4 : 1;
        if (!res.loose) s -= res.left * up * W.newLeftover * keepF;
      }
    });
    return s;
  }
  function consume(ing, mult) {
    if (!PR || !mult) return;
    ing.forEach(function (it) {
      var id = it[0]; if (!perishable(id)) return;
      var amt = PR.need(it) * mult; if (amt <= 0) return;
      var have = open[id] || 0;
      if (have >= amt) { open[id] = have - amt; return; }
      var res = PR.bestPacks(id, amt - have);
      open[id] = res.loose ? 0 : res.left;
    });
  }

  var plan = [], last = {}, uses = {}, rand = rng(20261018), weekJuices = null;
  var MAX_PER_YEAR = 20;
  function usedInYear(id, idx) {
    var u = uses[id]; if (!u) return 0;
    while (u.length && u[0] <= idx - 365) u.shift();
    return u.length;
  }

  function pick(pool, idx, gap, opts) {
    opts = opts || {};
    var best = null, bestScore = -Infinity;
    if (opts.force) best = opts.force; // a locked day: the choice is fixed, the bookkeeping still runs
    else pool.forEach(function (r) {
      var since = last[r.id] == null ? 999 : idx - last[r.id];
      var score = Math.min(since, 60) + rand() * 6;
      if (since < gap) score -= 1000;
      if (usedInYear(r.id, idx) >= MAX_PER_YEAR) score -= 500;
      if (opts.avoidMain && opts.avoidMain.indexOf(r.main) >= 0) score -= W.variety;
      if (r.season) score += SEASON[r.season].indexOf(opts.month) >= 0 ? W.season : -W.offSeason;
      score += wasteScore(r.ing, (opts.mult ? opts.mult(r) : 1));
      if (opts.extra) score += opts.extra(r);
      if (score > bestScore) { bestScore = score; best = r; }
    });
    if (!opts.peek) { last[best.id] = idx; (uses[best.id] = uses[best.id] || []).push(idx); }
    return best;
  }

  function pickExtra(pool, idx, tag, mult, force) {
    var best = force || null, bestScore = -Infinity;
    if (!force) pool.forEach(function (s) {
      var k = tag + s.id, since = last[k] == null ? 99 : idx - last[k];
      var score = Math.min(since, 10) * 1.5 + rand() * 2 + wasteScore(s.ing, mult);
      if (since < 2) score -= 100;
      if (score > bestScore) { bestScore = score; best = s; }
    });
    last[tag + best.id] = idx;
    return best;
  }

  // ---- Precomputed plan (built by build.py) --------------------------------
  // One row per day: b|l|lAlt|d|batch|juice|s1|s2, with "~id" for a leftover lunch.
  var TABLE = (typeof module === "undefined" && typeof PLAN_TABLE !== "undefined") ? PLAN_TABLE.split(";") : null;
  var LOCK = [];
  if (D) { try { LOCK = require("./plan-lock.js").PLAN_LOCK.split(";").map(function (r) { return r.split("|"); }); } catch (e) { LOCK = []; } }
  var exById = {}; S1.concat(S2, JX).forEach(function (s) { exById[s.id] = s; });
  function fromRow(row) {
    var f = row.split("|"), dRaw = byId[f[3]];
    var l = f[1].charAt(0) === "~" ? leftoverOf(byId[f[1].slice(1)]) : byId[f[1]];
    return { b: byId[f[0]], l: l, lAlt: f[2] ? byId[f[2]] : null, d: f[4] === "1" ? batchOf(dRaw) : dRaw, dRaw: dRaw,
      juice: exById[f[5]], snacks: [exById[f[6]], exById[f[7]]] };
  }
  function exportTable(n) {
    extendTo(n);
    return plan.slice(0, n + 1).map(function (p) {
      return [p.b.id, p.l.leftover ? "~" + p.dRawPrev : p.l.id, p.lAlt ? p.lAlt.id : "", p.dRaw.id, p.d.batch ? 1 : 0, p.juice.id, p.snacks[0].id, p.snacks[1].id].join("|");
    }).join(";");
  }

  function extendTo(idx) {
    if (TABLE) {
      while (plan.length <= idx && plan.length < TABLE.length) plan.push(fromRow(TABLE[plan.length]));
      return;
    }
    while (plan.length <= idx) {
      var i = plan.length, date = new Date(EPOCH + i * DAY), dow = date.getUTCDay(), month = date.getUTCMonth();
      if (dow === 1) open = {}; // new shopping week
      var weekend = dow === 0 || dow === 6;
      var prev = plan[i - 1];
      // Locked days replay the meals that were shown; F() gives the fixed recipe for a field.
      var lk = LOCK[i] || null, nx = LOCK[i + 1] || null;
      var F = function (k) { return lk && lk[k] ? byId[lk[k].replace("~", "")] : null; };
      var E = function (row, k) { return row && row[k] ? exById[row[k]] : null; };

      var b = weekend
        ? pick(pools.allBreakfast, i, RULES.weekendBreakfast, { month: month, force: F(0), extra: function (r) { return r.weekend ? 12 : 0; } })
        : pick(pools.wkBreakfast, i, RULES.breakfast, { month: month, force: F(0) });
      consume(b.ing, 1);

      // Yesterday's batch dinner becomes today's lunch.
      var l, lAlt = null;
      var lunchTime = function (r) { return !weekend && r.time > RULES.weekdayLunchTime ? -1000 : 0; };
      if (prev && prev.d.batch) {
        l = leftoverOf(prev.dRaw);
        lAlt = pick(pools.lunch, i, RULES.lunch, { month: month, avoidMain: [prev.d.main], peek: true, extra: lunchTime, force: F(2) });
      } else {
        l = pick(pools.lunch, i, RULES.lunch, { month: month, avoidMain: prev ? [prev.d.main] : null, extra: lunchTime, force: F(1) });
        consume(l.ing, 1);
      }

      var d, dRaw;
      if (dow === 6) { dRaw = d = pick(pools.cheat, i, RULES.cheat, { month: month, force: F(3) }); consume(d.ing, 1); }
      else {
        // A batch dinner only when tomorrow is not Saturday (cheat day) and today's lunch was not already leftovers.
        var canBatch = dow !== 5 && !l.leftover;
        dRaw = pick(pools.dinner, i, RULES.dinner, {
          month: month, force: F(3), avoidMain: [l.main].concat(prev ? [prev.d.main] : []),
          mult: function (r) { return r.twice && canBatch ? 2 : 1; },
          extra: function (r) {
            var e = -Math.abs(b.P + l.P + r.P - MEAL_GOAL) * W.protein;
            if (dow >= 1 && dow <= 4) e -= (r.C - avgDinnerC) * W.budget;
            if (dow >= 1 && dow <= 4 && r.time > RULES.weekdayDinnerTime) e -= 1000; // long dishes go to Friday or Sunday
            return e;
          }
        });
        d = (lk ? lk[4] === "1" : dRaw.twice && canBatch) ? batchOf(dRaw) : dRaw;
        consume(dRaw.ing, d.batch || 1);
      }

      // Two juices a week, alternating, so fresh herbs and part-used packs get used up.
      if (dow === 1 || !weekJuices) {
        // Locked: today's juice sits at i % 2 and tomorrow's at the other slot.
        var fj = [null, null]; if (lk) { fj[i % 2] = E(lk, 5); fj[(i + 1) % 2] = E(nx, 5); }
        var ja = pickExtra(JX, i, "j:", 6, fj[0]), jb = pickExtra(JX.filter(function (j) { return j !== ja; }), i, "j:", 6, fj[1]);
        weekJuices = [ja, jb];
      }
      var juice = weekJuices[i % 2];
      consume(juice.ing, 2);
      var s1 = pickExtra(S1, i, "s1:", 2, E(lk, 6)); consume(s1.ing, 2);
      var s2 = pickExtra(S2, i, "s2:", 2, E(lk, 7)); consume(s2.ing, 2);

      plan.push({ b: b, l: l, lAlt: lAlt, d: d, dRaw: dRaw, dRawPrev: l.leftover ? prev.dRaw.id : null, juice: juice, snacks: [s1, s2] });
    }
  }

  function idxOf(y, m, dd) { return Math.round((Date.UTC(y, m, dd) - EPOCH) / DAY); }
  function key(y, m, dd) { return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0"); }
  function keyOfIdx(i) { var t = new Date(EPOCH + i * DAY); return key(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()); }

  // overrides: { "2026-10-18|b": "b03", ... }
  // inc: which optional extras count as planned food: { juice, s1, s2 } (all true by default).
  // Protein, calories, cost and shopping all follow the same selection.
  var ALL_EXTRAS = { juice: true, s1: true, s2: true };
  function day(y, m, dd, overrides, inc) {
    inc = inc || ALL_EXTRAS;
    var i = idxOf(y, m, dd);
    if (i < 0 || i > MAX_DAYS) return null;
    extendTo(i + 1);
    if (!plan[i]) return null;
    var base = plan[i], k = key(y, m, dd), ov = overrides || {};
    var prevK = i > 0 ? keyOfIdx(i - 1) : null, nextK = keyOfIdx(i + 1);

    // Leftover lunch falls back to a normal lunch if yesterday's dinner was swapped.
    var lunch = base.l;
    if (base.l.leftover && prevK && ov[prevK + "|d"]) lunch = base.lAlt;
    // Batch dinner goes back to a single batch if it was swapped or tomorrow's lunch was swapped.
    var dinner = base.d;
    if (base.d.batch && (ov[nextK + "|l"] || ov[k + "|d"])) dinner = base.dRaw;

    var meals = {
      b: byId[ov[k + "|b"]] || base.b,
      l: byId[ov[k + "|l"]] || lunch,
      d: byId[ov[k + "|d"]] || dinner
    };
    var sn = base.snacks;
    var res = { key: k, meals: meals, base: { b: base.b, l: lunch, d: base.dRaw }, snacks: sn, juice: base.juice, people: {},
      inc: { juice: inc.juice !== false, s1: inc.s1 !== false, s2: inc.s2 !== false } };
    var extras = [];
    if (res.inc.juice) extras.push(base.juice);
    if (res.inc.s1) extras.push(sn[0]);
    if (res.inc.s2) extras.push(sn[1]);
    res.extras = extras;
    function xsum(f) { return extras.reduce(function (a, x) { return a + x[f]; }, 0); }
    var xp = xsum("p"), xk = xsum("k"), xf = xsum("fat"), xc = xsum("carb"), xb = xsum("fib");
    ["p1", "p2"].forEach(function (p) {
      var mp = 0, mk = 0, mf = 0, mc = 0, mb = 0;
      ["b", "l", "d"].forEach(function (s) {
        var r = meals[s], sh = p === "p2" ? r.share : 1 - r.share;
        mp += r.P * sh; mk += r.K * sh; mf += r.Fat * sh; mc += r.Carb * sh; mb += r.Fib * sh;
      });
      res.people[p] = { mealP: mp, mealK: mk, p: mp + xp, k: mk + xk, f: mf + xf, c: mc + xc, fb: mb + xb, target: PX[p].protein };
    });
    res.cheat = !!meals.d.cheat;
    res.cost = meals.b.C + meals.l.C + meals.d.C + extras.reduce(function (a, x) { return a + x.C; }, 0);
    return res;
  }

  function alternatives(slot, y, m, dd) {
    var dow = new Date(Date.UTC(y, m, dd)).getUTCDay();
    if (slot === "b") return (dow === 0 || dow === 6) ? pools.allBreakfast : pools.wkBreakfast;
    if (slot === "l") return pools.lunch;
    return dow === 6 ? pools.cheat.concat(pools.dinner) : pools.dinner;
  }

  function inRange(y, m, dd) { var i = idxOf(y, m, dd); return i >= 0 && i <= MAX_DAYS; }

  return { exportTable: exportTable, inRange: inRange, MAX_DAYS: MAX_DAYS, day: day, byId: byId, grams: grams, nutrOf: nutrOf, alternatives: alternatives, idxOf: idxOf, key: key, RULES: RULES, EPOCH: EPOCH };
})();
if (typeof module !== "undefined") module.exports = Engine;
