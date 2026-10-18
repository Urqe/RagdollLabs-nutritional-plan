// ---- Rotation engine -----------------------------------------------------
// Deterministic: the same date always gets the same meals (before swaps).
var Engine = (function () {
  var D = (typeof module !== "undefined") ? require("./data.js") : null;
  var CATX = D ? D.CAT : CAT, RX = D ? D.RECIPES : RECIPES, SX = D ? D.SNACKS : SNACKS,
      PX = D ? D.PEOPLE : PEOPLE, SHARE = D ? D.DEFAULT_SHARE : DEFAULT_SHARE;

  var EPOCH = Date.UTC(2025, 0, 6); // a Monday
  var DAY = 86400000;
  var RULES = { breakfast: 5, lunch: 9, dinner: 12, cheat: 3 }; // min days between repeats
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
  function nutrOf(ing) {
    var p = 0, k = 0;
    ing.forEach(function (it) {
      var c = CATX[it[0]], g = grams(it);
      if (c && c.p != null) { p += g * c.p / 100; k += g * c.k / 100; }
    });
    return { p: p, k: k };
  }
  RX.forEach(function (r) { var n = nutrOf(r.ing); r.P = n.p; r.K = n.k; r.share = r.split ? r.split.share : SHARE; });

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  var pools = {
    wkBreakfast: RX.filter(function (r) { return r.meal === "breakfast" && !r.weekend; }),
    allBreakfast: RX.filter(function (r) { return r.meal === "breakfast"; }),
    wkndBreakfast: RX.filter(function (r) { return r.meal === "breakfast" && r.weekend; }),
    lunch: RX.filter(function (r) { return r.meal === "lunch"; }),
    dinner: RX.filter(function (r) { return r.meal === "dinner" && !r.cheat; }),
    cheat: RX.filter(function (r) { return r.cheat; })
  };

  var plan = [], last = {}, rand = rng(20261018);

  function pick(pool, idx, gap, avoidMain) {
    var best = null, bestScore = -Infinity;
    pool.forEach(function (r) {
      var since = last[r.id] == null ? 999 : idx - last[r.id];
      var score = Math.min(since, 60) + rand() * 6;
      if (since < gap) score -= 1000;
      if (avoidMain && avoidMain.indexOf(r.main) >= 0) score -= 25;
      if (score > bestScore) { bestScore = score; best = r; }
    });
    last[best.id] = idx;
    return best;
  }

  function extendTo(idx) {
    while (plan.length <= idx) {
      var i = plan.length, dow = new Date(EPOCH + i * DAY).getUTCDay(); // 0 Sun..6 Sat
      var weekend = dow === 0 || dow === 6;
      var prev = plan[i - 1];
      var b = weekend ? pick(pools.wkndBreakfast, i, 6) : pick(pools.wkBreakfast, i, RULES.breakfast);
      var l = pick(pools.lunch, i, RULES.lunch, prev ? [prev.d.main] : null);
      var d = dow === 6 ? pick(pools.cheat, i, RULES.cheat)
                        : pick(pools.dinner, i, RULES.dinner, [l.main].concat(prev ? [prev.d.main] : []));
      plan.push({ b: b, l: l, d: d });
    }
  }

  function idxOf(y, m, dd) { return Math.round((Date.UTC(y, m, dd) - EPOCH) / DAY); }
  function key(y, m, dd) { return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0"); }

  function fillSnacks(person, have, i) {
    var target = PX[person].protein, gap = target - have, out = [];
    var off = person === "p1" ? 0 : 2;
    var n = 0;
    // At least one snack a day (training support), a second one if still short.
    while (((out.length === 0 && gap > 0) || gap > 6) && out.length < 2) {
      var s = SX[(i + off + n) % SX.length]; n++;
      out.push(s); gap -= s.p;
    }
    return out;
  }

  // overrides: { "2026-10-18|b": "b03", ... }
  function day(y, m, dd, overrides) {
    var i = idxOf(y, m, dd);
    if (i < 0) return null;
    extendTo(i);
    var base = plan[i], k = key(y, m, dd), ov = overrides || {};
    var meals = {
      b: byId[ov[k + "|b"]] || base.b,
      l: byId[ov[k + "|l"]] || base.l,
      d: byId[ov[k + "|d"]] || base.d
    };
    var res = { key: k, meals: meals, base: base, people: {} };
    ["p1", "p2"].forEach(function (p) {
      var mp = 0, mk = 0;
      ["b", "l", "d"].forEach(function (s) {
        var r = meals[s], sh = p === "p2" ? r.share : 1 - r.share;
        mp += r.P * sh; mk += r.K * sh;
      });
      var sn = fillSnacks(p, mp, i);
      var sp = sn.reduce(function (a, s) { return a + s.p; }, 0), sk = sn.reduce(function (a, s) { return a + s.k; }, 0);
      res.people[p] = { mealP: mp, mealK: mk, snacks: sn, p: mp + sp, k: mk + sk, target: PX[p].protein };
    });
    res.cheat = !!meals.d.cheat;
    return res;
  }

  function alternatives(slot, y, m, dd) {
    var dow = new Date(Date.UTC(y, m, dd)).getUTCDay();
    if (slot === "b") return (dow === 0 || dow === 6) ? pools.allBreakfast : pools.wkBreakfast;
    if (slot === "l") return pools.lunch;
    return dow === 6 ? pools.cheat.concat(pools.dinner) : pools.dinner;
  }

  return { day: day, byId: byId, grams: grams, nutrOf: nutrOf, alternatives: alternatives, idxOf: idxOf, key: key, RULES: RULES, EPOCH: EPOCH };
})();
if (typeof module !== "undefined") module.exports = Engine;
