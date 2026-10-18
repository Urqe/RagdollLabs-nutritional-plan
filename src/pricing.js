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
  // Short-lived items are bought per trip. Items that keep 10 days or more are bought
  // once, on the first trip that needs them, for the rest of the week. Leftovers from
  // an earlier trip are used first while still good.
  var LONG_KEEP = 10;
  function planTrips(dayNeeds, trips) {
    var carry = {}, out = [];
    trips.forEach(function (days, ti) {
      var first = days[0], need = {}, later = {};
      days.forEach(function (d) { Object.keys(dayNeeds[d] || {}).forEach(function (id) { need[id] = (need[id] || 0) + dayNeeds[d][id]; }); });
      for (var tj = ti + 1; tj < trips.length; tj++) trips[tj].forEach(function (d) {
        Object.keys(dayNeeds[d] || {}).forEach(function (id) { later[id] = (later[id] || 0) + dayNeeds[d][id]; });
      });
      var lines = [], cost = 0;
      Object.keys(need).forEach(function (id) {
        var n = need[id]; if (n <= 0) return;
        var p = PX[id], c = carry[id], use = 0;
        if (c && c.amt > 1e-6 && first - c.day < p.keeps) use = Math.min(n, c.amt);
        var rest = n - use;
        if (rest <= 1e-6) { c.amt -= use; lines.push({ id: id, need: n, fromEarlier: use, buy: null, forLater: 0 }); return; }
        var extra = p.keeps >= LONG_KEEP ? (later[id] || 0) : 0;
        var res = bestPacks(id, rest + extra);
        cost += res.cost;
        carry[id] = { amt: res.buy - rest, day: first };
        lines.push({ id: id, need: n, fromEarlier: use, buy: res, forLater: extra });
      });
      out.push({ days: days, lines: lines, cost: cost });
    });
    // What is left at the end of the week, and what happens to it.
    var left = [];
    Object.keys(carry).forEach(function (id) {
      var c = carry[id], p = PX[id]; if (c.amt <= 1e-6) return;
      var value = c.amt * unitPrice(id); if (value < 0.3) return;
      var life = p.keeps - (7 - c.day), kind = p.freezes ? "freeze" : life >= 3 ? "keeps" : "waste";
      left.push({ id: id, amt: c.amt, value: value, kind: kind,
        text: kind === "freeze" ? "freeze the rest" : kind === "keeps" ? "keeps into next week" : "likely wasted unless used early next week" });
    });
    return { trips: out, leftovers: left };
  }

  return { planTrips: planTrips, LONG_KEEP: LONG_KEEP, isStock: isStock, need: need, unitPrice: unitPrice, costOf: costOf, bestPacks: bestPacks, leftoverAdvice: leftoverAdvice, packUnit: packUnit };
})();
if (typeof module !== "undefined") module.exports = Pricing;
