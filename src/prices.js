// ---- Prices, pack sizes and shelf life -----------------------------------
// Prices are based on a K-chain market, checked on the date in PRICE_META.
// status "estimate" = typical everyday price, not yet checked in the store.
// packs: [size, unit, price €]. loose: [unit, € per unit] for items sold by weight or piece.
// keeps: days it stays good once opened (or bought, for fresh produce). freezes: freezes well.
var PRICE_META = { basis: "a K-chain market", updated: "2026-10-22" };

var PRICES = {
  // Meat
  chk:        { product: "Chicken breast fillets, plain", packs: [[600, "g", 7.99]], status: "checked", checked: "2026-10-22", keeps: 2, freezes: true },
  turkeymince:{ product: "Turkey mince", packs: [[400, "g", 5.95]], status: "checked", checked: "2026-10-22", keeps: 2, freezes: true },
  turkeyham:  { product: "Sliced turkey breast", packs: [[300, "g", 3.29]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: true },
  beef10:     { product: "Beef mince 10 %", packs: [[400, "g", 6.39], [600, "g", 10.99]], status: "checked", checked: "2026-10-22", keeps: 2, freezes: true },
  sirloin:    { product: "Beef sirloin steaks", packs: [[300, "g", 16.69]], status: "checked", checked: "2026-10-22", keeps: 3, freezes: true },
  strips:     { product: "Beef strips (paistisuikale)", packs: [[400, "g", 9.49]], status: "checked", checked: "2026-10-22", keeps: 2, freezes: true },
  chuck:      { product: "Stewing beef (palapaisti)", packs: [[400, "g", 9.49]], status: "checked", checked: "2026-10-22", keeps: 2, freezes: true },
  bacon:      { product: "Bacon", packs: [[170, "g", 2.55]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  chorizo:    { product: "Chorizo", packs: [[230, "g", 3.49]], status: "checked", checked: "2026-10-22", keeps: 21, freezes: true },
  egg:        { product: "Eggs", packs: [[10, "pc", 2.59], [15, "pc", 4.59]], status: "checked", checked: "2026-10-22", keeps: 21, freezes: false },

  // Dairy
  quark:      { product: "Maitorahka 0.2 %", packs: [[250, "g", 0.99], [500, "g", 1.49]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: false },
  skyr:       { product: "Skyr, natural", packs: [[400, "g", 2.89]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  greek:      { product: "Greek yoghurt 0 %", packs: [[500, "g", 2.55]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: false },
  cottage:    { product: "Raejuusto", packs: [[200, "g", 1.49], [400, "g", 1.95]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: false },
  cheddar:    { product: "Cheddar slices", packs: [[200, "g", 2.99]], status: "checked", checked: "2026-10-22", keeps: 14, freezes: true },
  mozz:       { product: "Grated mozzarella", packs: [[250, "g", 2.35]], status: "checked", checked: "2026-10-22", keeps: 14, freezes: true },
  leipa:      { product: "Leipäjuusto", packs: [[310, "g", 4.99]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  halloumi:   { product: "Halloumi", packs: [[200, "g", 3.59]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  creamch:    { product: "Light cream cheese, plain", packs: [[200, "g", 2.29]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: false },
  milk:       { product: "Milk 1.5 %", packs: [[1000, "ml", 0.99]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  whey:       { product: "Whey protein powder, vanilla", packs: [[500, "g", 19.49]], status: "checked", checked: "2026-10-22", keeps: 180, freezes: false },

  // Bread and grains
  tortM:      { product: "El Taco Truck Street wheat tortillas, 8 pcs", packs: [[8, "pc", 2.09]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  tortS:      { product: "El Taco Truck wheat tortillas 20 cm, 8 pcs", packs: [[8, "pc", 2.39]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  tortL:      { product: "Santa Maria Large wheat tortillas, 6 pcs", packs: [[6, "pc", 2.39]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  tortC:      { product: "Don Tortilla corn tortillas 14 cm, 250 g", packs: [[10, "pc", 5.15]], status: "checked", checked: "2026-10-22", keeps: 10, freezes: true },
  tortXL:     { product: "Antalya Dürüm wheat tortillas 30 cm, 8 pcs", packs: [[8, "pc", 4.55]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  bun:        { product: "Large burger buns, 4 pcs", packs: [[4, "pc", 1.74]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: true },
  bread:      { product: "Wholegrain toast bread, 430 g", packs: [[12, "pc", 1.64]], status: "checked", checked: "2026-10-22", keeps: 6, freezes: true },
  roll:       { product: "Part-baked wheat rolls, 6 pcs", packs: [[6, "pc", 1.15]], status: "checked", checked: "2026-10-22", keeps: 3, freezes: true },
  flour:      { product: "Wheat flour", packs: [[2000, "g", 0.85]], status: "checked", checked: "2026-10-22", keeps: 365, freezes: false },
  rye:        { product: "Wholegrain rye bread, sliced, 400 g", packs: [[11, "pc", 2.38]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  ricecake:   { product: "Rice cakes, 100 g", packs: [[12, "pc", 0.61]], status: "checked", checked: "2026-10-22", keeps: 30, freezes: false },
  oats:       { product: "Oat flakes", packs: [[1000, "g", 0.99]], status: "checked", checked: "2026-10-22", keeps: 180, freezes: false },
  pdough:     { product: "Pizza dough, frozen, 4 × 150 g", packs: [[600, "g", 2.79]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: true },
  rice:       { product: "Long-grain rice", packs: [[1000, "g", 0.85]], status: "checked", checked: "2026-10-22", keeps: 365, freezes: false },
  pasta:      { product: "Wholewheat penne", packs: [[500, "g", 1.55]], status: "checked", checked: "2026-10-22", keeps: 365, freezes: false },
  chips:      { product: "Tortilla chips", packs: [[400, "g", 1.55]], status: "checked", checked: "2026-10-22", keeps: 14, freezes: false },
  granola:    { product: "Granola, plain", packs: [[750, "g", 4.79]], status: "checked", checked: "2026-10-22", keeps: 60, freezes: false },
  popcorn:    { product: "Popcorn kernels", packs: [[500, "g", 1.45]], status: "checked", checked: "2026-10-22", keeps: 365, freezes: false },

  // Tins and jars
  applesauce: { product: "Apple purée, unsweetened", packs: [[700, "g", 3.69]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  blackbean:  { product: "Black beans, 380 g tin", packs: [[230, "g", 0.79]], status: "checked", checked: "2026-10-22", keeps: 3, freezes: true },
  refried:    { product: "Refried beans", packs: [[215, "g", 2.29]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: true },
  chickpea:   { product: "Chickpeas, 380 g tin", packs: [[230, "g", 0.99]], status: "checked", checked: "2026-10-22", keeps: 3, freezes: true },
  crushed:    { product: "Crushed tomatoes", packs: [[400, "g", 0.33]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: true },
  passata:    { product: "Passata", packs: [[500, "g", 1.99]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: true },
  corn:       { product: "Sweetcorn, 340 g tin", packs: [[285, "g", 1.19]], status: "checked", checked: "2026-10-22", keeps: 3, freezes: true },
  salsa:      { product: "Taco sauce", packs: [[230, "g", 0.95]], status: "checked", checked: "2026-10-22", keeps: 14, freezes: false },
  salsaverde: { product: "Salsa verde", packs: [[230, "g", 1.99]], status: "checked", checked: "2026-10-22", keeps: 14, freezes: false },
  pickjal:    { product: "Pickled jalapeños", packs: [[160, "g", 1.79]], status: "checked", checked: "2026-10-22", keeps: 30, freezes: false },
  pineapple:  { product: "Pineapple in juice, 567 g tin", packs: [[340, "g", 1.24]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: true },

  // Vegetables and fruit
  potato:     { product: "Potatoes, 2 kg bag", packs: [[2000, "g", 1.59]], status: "checked", checked: "2026-10-22", keeps: 21, freezes: false },
  cabbage:    { product: "White cabbage", loose: ["g", 0.00139], status: "checked", checked: "2026-10-22", keeps: 21, freezes: false },
  tomato:     { product: "Tomatoes", loose: ["pc", 0.4], status: "checked", checked: "2026-10-22", keeps: 7, freezes: false },
  onion:      { product: "Onions, 1 kg bag", packs: [[10, "pc", 1.69]], status: "checked", checked: "2026-10-22", keeps: 30, freezes: false },
  redonion:   { product: "Red onions", loose: ["pc", 0.2], status: "checked", checked: "2026-10-22", keeps: 21, freezes: false },
  pepper:     { product: "Red peppers", loose: ["pc", 0.75], status: "checked", checked: "2026-10-22", keeps: 7, freezes: true },
  jalap:      { product: "Green chillies", loose: ["pc", 0.26], status: "checked", checked: "2026-10-22", keeps: 10, freezes: true },
  habanero:   { product: "Red chilli (habanero not stocked)", loose: ["pc", 0.24], status: "checked", checked: "2026-10-22", keeps: 10, freezes: true },
  avocado:    { product: "Ripe avocados", loose: ["pc", 1.76], status: "checked", checked: "2026-10-22", keeps: 4, freezes: false },
  lime:       { product: "Limes", loose: ["pc", 0.44], status: "checked", checked: "2026-10-22", keeps: 14, freezes: false },
  apple:      { product: "Granny Smith apples", loose: ["pc", 0.46], status: "checked", checked: "2026-10-22", keeps: 21, freezes: false },
  pear:       { product: "Conference pears", loose: ["pc", 0.64], status: "checked", checked: "2026-10-22", keeps: 7, freezes: false },
  orange:     { product: "Oranges", loose: ["pc", 0.59], status: "checked", checked: "2026-10-22", keeps: 14, freezes: false },
  sweetpot:   { product: "Sweet potatoes", loose: ["g", 0.00299], status: "checked", checked: "2026-10-22", keeps: 14, freezes: false },
  kohlrabi:   { product: "Kohlrabi", loose: ["g", 0.00499], status: "checked", checked: "2026-10-22", keeps: 14, freezes: false },
  garlic:     { product: "Garlic, 100 g", packs: [[20, "clove", 0.79]], status: "checked", checked: "2026-10-22", keeps: 30, freezes: false },
  cilantro:   { product: "Coriander, potted", packs: [[1, "bunch", 1.85]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  basil:      { product: "Basil, potted", packs: [[1, "bunch", 2.08]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  chives:     { product: "Chives, potted", packs: [[1, "bunch", 1.69]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  mint:       { product: "Mint, potted", packs: [[1, "bunch", 1.85]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  springon:   { product: "Spring onions, 100 g", packs: [[6, "pc", 2.39]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  lettuce:    { product: "Romaine lettuce", packs: [[250, "g", 1.99]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: false },
  spinach:    { product: "Baby spinach", packs: [[65, "g", 1.59]], status: "checked", checked: "2026-10-22", keeps: 3, freezes: true },
  cucumber:   { product: "Cucumber", loose: ["g", 0.00199], status: "checked", checked: "2026-10-22", keeps: 7, freezes: false },
  mushroom:   { product: "Mushrooms", packs: [[200, "g", 3.39]], status: "checked", checked: "2026-10-22", keeps: 4, freezes: false },
  carrot:     { product: "Carrots, 1 kg", packs: [[1000, "g", 1.19]], status: "checked", checked: "2026-10-22", keeps: 21, freezes: false },
  cauli:      { product: "Cauliflower", loose: ["g", 0.00349], status: "checked", checked: "2026-10-22", keeps: 5, freezes: true },
  celery:     { product: "Celery", packs: [[250, "g", 2.39]], status: "checked", checked: "2026-10-22", keeps: 10, freezes: false },
  grapes:     { product: "Dark seedless grapes", packs: [[500, "g", 2.29]], status: "checked", checked: "2026-10-22", keeps: 5, freezes: true },

  // Frozen
  strawb:     { product: "Frozen strawberries", packs: [[500, "g", 7.65]], status: "checked", checked: "2026-10-22", keeps: 120, freezes: true },
  berries:    { product: "Frozen mixed berries", packs: [[600, "g", 2.99]], status: "checked", checked: "2026-10-22", keeps: 120, freezes: true },
  mango:      { product: "Frozen mango", packs: [[300, "g", 1.89], [1000, "g", 8.39]], status: "checked", checked: "2026-10-22", keeps: 120, freezes: true },
  lingon:     { product: "Frozen lingonberries", packs: [[200, "g", 2.65], [500, "g", 5.89]], status: "checked", checked: "2026-10-22", keeps: 120, freezes: true },
  peas:       { product: "Frozen peas", packs: [[200, "g", 0.89]], status: "checked", checked: "2026-10-22", keeps: 120, freezes: true },
  fries:      { product: "Oven fries", packs: [[500, "g", 1.65]], status: "checked", checked: "2026-10-22", keeps: 120, freezes: true },

  cheese: { product: "Grated cheese 17 %", packs: [[150, "g", 2.99]], status: "checked", checked: "2026-10-22", keeps: 14, freezes: true },
  feta: { product: "Feta", packs: [[150, "g", 2.99]], status: "checked", checked: "2026-10-22", keeps: 7, freezes: false },
  kidney: { product: "Kidney beans, 380 g tin", packs: [[230, "g", 0.75]], status: "checked", checked: "2026-10-22", keeps: 3, freezes: false },
  lentil: { product: "Red lentils, dry", packs: [[400, "g", 1.69]], status: "checked", checked: "2026-10-22", keeps: 365, freezes: false },
  // Other
  walnut:     { product: "Walnuts", packs: [[100, "g", 2.35]], status: "checked", checked: "2026-10-22", keeps: 90, freezes: true },
  almonds:    { product: "Almonds", packs: [[150, "g", 2.55]], status: "checked", checked: "2026-10-22", keeps: 90, freezes: true },
  peanut:     { product: "Peanuts, unsalted", packs: [[250, "g", 1.64]], status: "checked", checked: "2026-10-22", keeps: 90, freezes: false },
  darkchoc:   { product: "Dark chocolate 70 %", packs: [[100, "g", 2.29]], status: "checked", checked: "2026-10-22", keeps: 180, freezes: false }
};
Object.keys(PRICES).forEach(function (k) { PRICES[k].status = PRICES[k].status || "estimate"; PRICES[k].checked = PRICES[k].checked || null; });

if (typeof module !== "undefined") module.exports = { PRICES, PRICE_META };
