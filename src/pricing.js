// ---- Pricing and pack guidance -----------------------------------------
var Pricing = (function () {
  var N = (typeof module !== "undefined");
  var CATX = N ? require("./data.js").CAT : CAT;
  var PX = N ? require("./prices.js").PRICES : PRICES;

  function packUnit(id) { var p = PX[id]; return p ? (p.loose ? p.loose[0] : p.packs[0][1]) : null; }

  // Amount of an ingredient line expressed in the unit the item is sold in.
  function need(it) {
    var id = it[0], a = it[1], u = it[2], pu = packUnit(id), c = CATX[id];
    if (!pu) return 0;
    if (u === pu) return a;
    if (pu === "g" && (u === "g" || u === "ml")) return a;
    if (pu === "ml" && (u === "g" || u === "ml")) return a;
    if (pu === "g" && u === "pc" && c.w) return a * c.w;
    if (pu === "pc" && (u === "g" || u === "ml") && c.w) return a / c.w;
    if (pu === "g" && u === "tbsp" && c.t) return a * c.t;
    return 0;
  }

  // Cheapest price per sold unit, used for what a meal actually consumes.
  function unitPrice(id) {
    var p = PX[id]; if (!p) return 0;
    if (p.loose) return p.loose[1];
    return Math.min.apply(null, p.packs.map(function (k) { return k[2] / k[0]; }));
  }

  function costOf(ing, mult) {
    var m = mult || 1;
    return ing.reduce(function (s, it) { return s + need(it) * unitPrice(it[0]) * m; }, 0);
  }

  // Cheapest mix of pack sizes covering the amount needed. Ties go to less leftover.
  function bestPacks(id, amount) {
    var p = PX[id];
    if (p.loose) {
      var buy = p.loose[0] === "pc" ? Math.ceil(amount - 1e-9) : amount;
      return { buy: buy, cost: buy * p.loose[1], left: buy - amount, packs: [], loose: true };
    }
    var packs = p.packs, best = null;
    var maxA = Math.ceil(amount / packs[0][0]) + 1;
    var maxB = packs[1] ? Math.ceil(amount / packs[1][0]) + 1 : 0;
    for (var a = 0; a <= maxA; a++) for (var b = 0; b <= maxB; b++) {
      var size = a * packs[0][0] + (packs[1] ? b * packs[1][0] : 0);
      if (size + 1e-9 < amount || (a === 0 && b === 0)) continue;
      var cost = a * packs[0][2] + (packs[1] ? b * packs[1][2] : 0);
      var count = a + b;
      // Prefer fewer packs when the price is within 3 %, then less leftover.
      var better = !best || cost < best.cost * 0.97 ||
        (cost <= best.cost * 1.03 && (count < best.count || (count === best.count && (cost < best.cost - 0.001 || size < best.buy))));
      if (better) {
        var list = []; if (a) list.push([a, packs[0]]); if (b) list.push([b, packs[1]]);
        best = { buy: size, cost: cost, left: size - amount, packs: list, loose: false, count: count };
      }
    }
    return best;
  }

  // What happens to the leftover of a pack bought for one week.
  function leftoverAdvice(id, res) {
    var p = PX[id];
    if (res.loose || res.buy <= 0 || res.left / res.buy <= 0.2) return null;
    var value = res.left * unitPrice(id);
    if (value < 0.3) return null;
    if (p.freezes) return { kind: "freeze", text: "freeze the rest", value: value };
    if (p.keeps >= 10) return { kind: "keeps", text: "keeps until next week", value: value };
    return { kind: "waste", text: "likely wasted unless used in the next " + p.keeps + " days", value: value };
  }

  // Long-life items (dry goods, frozen, powders) are bought when they run out, not every week.
  function isStock(id) { var p = PX[id]; return !!p && p.keeps >= 60; }

  // ---- Shopping in trips ------------------------------------------------------
  // dayNeeds: 7 objects (Mon..Sun) of ingredient id -> amount in its sold unit, fresh
  // items only. trips: arrays of day indexes, e.g. [[0,1],[2,3],[4,5,6]].
  //
  // Every pack is tracked on its own. A pack's shelf life ("keeps") counts from the day
  // it is opened; loose produce counts from the day it is bought. Food is only used on a
  // day when it is still within its shelf life on that day, oldest first.
  // Short-lived items are bought per trip. Items that keep 10 days or more are bought
  // once, on the first trip that needs them, for the rest of the week.
  // Whatever is left is reported once: frozen (with the day to freeze it), keeps into
  // next week, or wasted. Expired food is never dropped from the count.
  var LONG_KEEP = 10, DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function cloneLots(ls) { return ls.map(function (l) { return { trip: l.trip, bought: l.bought, opened: l.opened, size: l.size, left: l.left, last: l.last, frozen: l.frozen, usedFrozen: l.usedFrozen }; }); }
  // Use amount on day d from lots. Returns { used, fromEarlier, short }.
  // Food that freezes can be frozen on its last good day and used later in the week;
  // the lot remembers the day it has to go into the freezer.
  function draw(ls, d, amt, keeps, ti, freezes) {
    var res = { used: 0, fromEarlier: 0, short: 0 }, rest = amt;
    var open = ls.filter(function (l) { return l.opened !== null && l.left > 1e-9 && (freezes || d - l.opened < keeps); }).sort(function (a, b) { return a.opened - b.opened; });
    var closed = ls.filter(function (l) { return l.opened === null && l.left > 1e-9 && l.bought <= d; }).sort(function (a, b) { return a.size - b.size; });
    open.concat(closed).forEach(function (l) {
      if (rest <= 1e-9) return;
      if (l.opened === null) l.opened = d;
      if (d - l.opened >= keeps && l.frozen == null) l.frozen = l.last === null ? l.opened : l.last;
      if (l.frozen != null && l.usedFrozen == null) l.usedFrozen = d;
      var u = Math.min(rest, l.left);
      l.left -= u; rest -= u; l.last = d; res.used += u;
      if (l.trip < ti) res.fromEarlier += u;
    });
    res.short = rest > 1e-6 ? rest : 0;
    return res;
  }
  function addLots(ls, res, ti, day) {
    if (res.loose) { ls.push({ trip: ti, bought: day, opened: day, size: res.buy, left: res.buy, last: null, frozen: null, usedFrozen: null }); return; }
    res.packs.forEach(function (pk) { for (var i = 0; i < pk[0]; i++) ls.push({ trip: ti, bought: day, opened: null, size: pk[1][0], left: pk[1][0], last: null, frozen: null, usedFrozen: null }); });
  }
  function mergeRes(a, b) {
    if (!a) return b;
    var packs = a.packs.map(function (pk) { return [pk[0], pk[1]]; });
    b.packs.forEach(function (pk) { var hit = packs.filter(function (x) { return x[1] === pk[1]; })[0]; if (hit) hit[0] += pk[0]; else packs.push([pk[0], pk[1]]); });
    return { buy: a.buy + b.buy, cost: a.cost + b.cost, left: 0, packs: packs, loose: a.loose, count: (a.count || 0) + (b.count || 0) };
  }

  function planTrips(dayNeeds, trips) {
    var lots = {}, out = [];
    function needOn(d, id) { return (dayNeeds[d] || {})[id] || 0; }
    trips.forEach(function (days, ti) {
      var first = days[0], ids = {};
      days.forEach(function (d) { Object.keys(dayNeeds[d] || {}).forEach(function (id) { if (needOn(d, id) > 0) ids[id] = 1; }); });
      var lines = [], cost = 0;
      Object.keys(ids).forEach(function (id) {
        var p = PX[id], ls = lots[id] = lots[id] || [];
        var windowDays = days.slice();
        if (p.keeps >= LONG_KEEP) for (var d = days[days.length - 1] + 1; d < 7; d++) windowDays.push(d);
        // Buy until the simulated window has no shortfall (a second pack may be needed
        // when the first would be past its shelf life by a later day).
        var bought = null;
        for (var round = 0; round < 6; round++) {
          var sim = cloneLots(ls), short = 0;
          windowDays.forEach(function (d) { var n = needOn(d, id); if (n > 0) short += draw(sim, d, n, p.keeps, ti, p.freezes).short; });
          if (short <= 1e-6) break;
          var res = bestPacks(id, short);
          addLots(ls, res, ti, first); bought = mergeRes(bought, res);
        }
        // What the bought amount covers beyond this trip's own days.
        var forLater = 0;
        if (bought) {
          windowDays.forEach(function (d) { if (days.indexOf(d) < 0) forLater += needOn(d, id); });
        }
        var need = 0, fromEarlier = 0, short = 0;
        days.forEach(function (d) { var n = needOn(d, id); if (n > 0) { var r = draw(ls, d, n, p.keeps, ti, p.freezes); need += n; fromEarlier += r.fromEarlier; short += r.short; } });
        if (need <= 0) return;
        if (bought) cost += bought.cost;
        lines.push({ id: id, need: need, fromEarlier: fromEarlier, buy: bought, forLater: forLater, short: short });
      });
      out.push({ days: days, lines: lines, cost: cost, freeze: [] });
    });
    // What is left of each pack at the end of the week.
    var left = [], byKey = {};
    Object.keys(lots).forEach(function (id) {
      var p = PX[id];
      lots[id].forEach(function (l) {
        if (l.left <= 1e-6) return;
        var value = l.left * unitPrice(id), kind, day, text;
        var opened = l.opened === null ? null : l.opened, end = opened === null ? null : opened + p.keeps; // first day it is no longer good
        if (l.frozen != null) { kind = "freeze"; day = l.frozen; text = "already in the freezer"; }
        else if (opened === null && p.freezes) { kind = "freeze"; day = l.bought; text = "unopened: freeze it"; }
        else if (opened === null) { kind = "keeps"; day = 6; text = "unopened, keeps into next week"; }
        else if (end - 7 >= 3) { kind = "keeps"; day = 6; text = "keeps into next week"; }
        else if (p.freezes) { day = l.last === null ? opened : l.last; kind = "freeze"; text = "freeze the rest after " + DAYS[day]; }
        else if (end <= 7) { kind = "waste"; day = end - 1; text = "past its shelf life after " + DAYS[day]; }
        else { kind = "waste"; day = 6; text = "use by " + DAYS[(end - 1) % 7] + " next week or it goes to waste"; }
        var k = id + "|" + kind + "|" + day;
        if (!byKey[k]) { byKey[k] = { id: id, amt: 0, value: 0, kind: kind, day: day, text: text }; left.push(byKey[k]); }
        byKey[k].amt += l.left; byKey[k].value += value;
      });
    });
    left = left.filter(function (l) { return l.value >= 0.3; });
    // Mid-week freezing so a later day can use the rest.
    var actions = [];
    Object.keys(lots).forEach(function (id) {
      lots[id].forEach(function (l) {
        if (l.frozen == null) return;
        actions.push({ id: id, day: l.frozen, kind: "freeze", text: "freeze the rest after " + DAYS[l.frozen] + ", for " + DAYS[l.usedFrozen] });
      });
    });
    // Freezing has to happen on a given day, so show it on the trip that covers that day.
    actions.concat(left).forEach(function (l) {
      if (l.kind !== "freeze" || l.text === "already in the freezer") return;
      out.forEach(function (tr) { if (tr.days.indexOf(l.day) >= 0) tr.freeze.push(l); });
    });
    var waste = left.reduce(function (s, l) { return s + (l.kind === "waste" ? l.value : 0); }, 0);
    return { trips: out, leftovers: left, waste: waste };
  }

  // The week's shopping from 7 day plans (Mon..Sun, null for days outside the plan).
  // Uses exactly the food the day plan counts: meals (batch dinners doubled, leftover
  // lunches free) and the extras in plan.extras, each for two people.
  // start: index of the first trip actually made this week (0-2). Days before it are
  // left out, so nothing is assumed bought on a skipped trip.
  var TRIPS = [[0, 1], [2, 3], [4, 5, 6]];
  function shoppingWeek(plans, start) {
    start = start || 0;
    var first = TRIPS[start][0];
    var dayNeeds = [], dayStock = [], dayPantry = [], stockNeed = {}, pantry = {};
    plans.forEach(function (pl, di) {
      var nd = dayNeeds[di] = {}, ds = dayStock[di] = {}, dp = dayPantry[di] = {};
      if (!pl || di < first) return;
      function add(it, mult) {
        var id = it[0], c = CATX[id]; if (!c) return;
        if (c.pantry || !PX[id]) { pantry[c.n] = 1; dp[id] = 1; return; }
        var amt = need(it) * mult;
        if (isStock(id)) { stockNeed[id] = (stockNeed[id] || 0) + amt; ds[id] = (ds[id] || 0) + amt; }
        else nd[id] = (nd[id] || 0) + amt;
      }
      ["b", "l", "d"].forEach(function (s) { var r = pl.meals[s], mult = r.leftover ? 0 : (r.batch || 1); if (mult) r.ing.forEach(function (it) { add(it, mult); }); });
      (pl.extras || []).forEach(function (x) { x.ing.forEach(function (it) { add(it, 2); }); });
    });
    var plan = planTrips(dayNeeds, TRIPS);
    // Long-life and pantry items each trip's days use: check them at home before the trip.
    plan.trips.forEach(function (tr, ti) {
      var st = {}, pa = {};
      tr.days.forEach(function (d) {
        Object.keys(dayStock[d]).forEach(function (id) { st[id] = (st[id] || 0) + dayStock[d][id]; });
        Object.keys(dayPantry[d]).forEach(function (id) { pa[id] = 1; });
      });
      tr.stock = st; tr.pantry = Object.keys(pa);
      tr.skipped = ti < start;
    });
    plan.start = start;
    plan.dayNeeds = dayNeeds; plan.stockNeed = stockNeed; plan.pantry = Object.keys(pantry).sort();
    plan.total = plan.trips.reduce(function (s, tr) { return s + tr.cost; }, 0);
    return plan;
  }

  return { shoppingWeek: shoppingWeek, TRIPS: TRIPS, planTrips: planTrips, LONG_KEEP: LONG_KEEP, DAYS: DAYS, isStock: isStock, need: need, unitPrice: unitPrice, costOf: costOf, bestPacks: bestPacks, leftoverAdvice: leftoverAdvice, packUnit: packUnit };
})();
if (typeof module !== "undefined") module.exports = Pricing;
