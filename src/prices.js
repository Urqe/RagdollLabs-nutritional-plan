// ---- Prices, pack sizes and shelf life -----------------------------------
// Prices are estimates based on a K-chain market.
// status "estimate" = typical everyday price, not yet checked in the store.
// packs: [size, unit, price €]. loose: [unit, € per unit] for items sold by weight or piece.
// keeps: days it stays good once opened (or bought, for fresh produce). freezes: freezes well.
var PRICE_META = { basis: "a K-chain market", updated: "2026-10-18" };

var PRICES = {
  // Meat
  chk:        { product: "Chicken breast fillets", packs: [[450,"g",6.49],[1000,"g",11.99]], keeps: 2, freezes: true },
  thigh:      { product: "Chicken thigh fillets", packs: [[450,"g",5.49],[900,"g",9.99]], keeps: 2, freezes: true },
  turkeymince:{ product: "Turkey mince", packs: [[400,"g",4.99]], keeps: 2, freezes: true },
  turkeyham:  { product: "Sliced turkey breast", packs: [[150,"g",2.29],[300,"g",3.99]], keeps: 4, freezes: true },
  beef5:      { product: "Beef mince 4–5 %", packs: [[400,"g",5.49]], keeps: 2, freezes: true },
  beef10:     { product: "Beef mince 10 %", packs: [[400,"g",4.69]], keeps: 2, freezes: true },
  sirloin:    { product: "Beef sirloin", packs: [[300,"g",10.99],[500,"g",17.99]], keeps: 3, freezes: true },
  strips:     { product: "Beef strips", packs: [[400,"g",7.49]], keeps: 2, freezes: true },
  chuck:      { product: "Stewing beef", packs: [[400,"g",6.49],[600,"g",8.99]], keeps: 2, freezes: true },
  bacon:      { product: "Bacon", packs: [[140,"g",1.99]], keeps: 7, freezes: true },
  chorizo:    { product: "Chorizo", packs: [[200,"g",3.49]], keeps: 21, freezes: true },
  egg:        { product: "Eggs", packs: [[10,"pc",2.89],[15,"pc",3.99]], keeps: 21, freezes: false },

  // Dairy
  quark:      { product: "Maitorahka 0.2 %", packs: [[250,"g",0.99]], keeps: 4, freezes: false },
  skyr:       { product: "Skyr, natural", packs: [[150,"g",0.85],[1000,"g",3.99]], keeps: 5, freezes: false },
  greek:      { product: "Greek-style yoghurt", packs: [[1000,"g",3.79]], keeps: 7, freezes: false },
  cottage:    { product: "Raejuusto", packs: [[200,"g",1.29],[450,"g",2.59]], keeps: 4, freezes: false },
  cheddar:    { product: "Cheddar slices", packs: [[150,"g",2.49]], keeps: 14, freezes: true },
  mozz:       { product: "Grated mozzarella", packs: [[150,"g",1.89],[300,"g",3.29]], keeps: 14, freezes: true },
  leipa:      { product: "Leipäjuusto", packs: [[250,"g",3.99]], keeps: 7, freezes: true },
  halloumi:   { product: "Light halloumi", packs: [[200,"g",3.79]], keeps: 7, freezes: true },
  creamch:    { product: "Light cream cheese", packs: [[200,"g",2.19]], keeps: 7, freezes: false },
  milk:       { product: "Milk 1.5 %", packs: [[1000,"ml",1.09]], keeps: 5, freezes: false },
  whey:       { product: "Whey protein powder", packs: [[500,"g",14.90],[1000,"g",24.90]], keeps: 180, freezes: false },

  // Bread and grains
  tortM:      { product: "Mini tortillas, 12 pcs", packs: [[12,"pc",2.49]], keeps: 7, freezes: true },
  tortS:      { product: "Small tortillas, 8 pcs", packs: [[8,"pc",1.79]], keeps: 7, freezes: true },
  tortL:      { product: "Large tortillas, 8 pcs", packs: [[8,"pc",1.99]], keeps: 7, freezes: true },
  tortC:      { product: "Corn tortillas, 10 pcs", packs: [[10,"pc",3.29]], keeps: 10, freezes: true },
  bun:        { product: "Burger buns, 4 pcs", packs: [[4,"pc",1.99]], keeps: 4, freezes: true },
  bread:      { product: "Wholegrain sliced bread", packs: [[14,"pc",2.29]], keeps: 6, freezes: true },
  roll:       { product: "Bread rolls, 6 pcs", packs: [[6,"pc",1.99]], keeps: 3, freezes: true },
  flour:      { product: "Wheat flour", packs: [[2000,"g",1.29]], keeps: 365, freezes: false },
  rye:        { product: "Rye bread, sliced", packs: [[14,"pc",1.69]], keeps: 7, freezes: true },
  ricecake:   { product: "Rice cakes", packs: [[12,"pc",1.29]], keeps: 30, freezes: false },
  oats:       { product: "Oat flakes", packs: [[500,"g",0.99],[1000,"g",1.49]], keeps: 180, freezes: false },
  pdough:     { product: "Fresh pizza dough", packs: [[400,"g",1.79]], keeps: 5, freezes: true },
  rice:       { product: "Long-grain rice", packs: [[1000,"g",1.69]], keeps: 365, freezes: false },
  pasta:      { product: "Wholewheat pasta", packs: [[500,"g",1.29]], keeps: 365, freezes: false },
  chips:      { product: "Tortilla chips", packs: [[200,"g",1.99]], keeps: 14, freezes: false },
  granola:    { product: "Granola", packs: [[500,"g",2.99]], keeps: 60, freezes: false },
  popcorn:    { product: "Popcorn kernels", packs: [[500,"g",1.99]], keeps: 365, freezes: false },

  // Tins and jars
  applesauce: { product: "Apple purée, unsweetened", packs: [[350,"g",1.49]], keeps: 7, freezes: true },
  blackbean:  { product: "Black beans, 380 g tin", packs: [[230,"g",1.19]], keeps: 3, freezes: true },
  refried:    { product: "Refried beans", packs: [[435,"g",2.49]], keeps: 4, freezes: true },
  chickpea:   { product: "Chickpeas, 400 g tin", packs: [[240,"g",0.99]], keeps: 3, freezes: true },
  crushed:    { product: "Crushed tomatoes", packs: [[400,"g",0.79]], keeps: 4, freezes: true },
  passata:    { product: "Passata", packs: [[500,"g",1.19]], keeps: 5, freezes: true },
  corn:       { product: "Sweetcorn, 300 g tin", packs: [[200,"g",0.99]], keeps: 3, freezes: true },
  salsa:      { product: "Salsa / taco sauce", packs: [[230,"g",1.99]], keeps: 14, freezes: false },
  salsaverde: { product: "Salsa verde", packs: [[450,"g",3.49]], keeps: 14, freezes: false },
  pickjal:    { product: "Pickled jalapeños", packs: [[215,"g",2.29]], keeps: 30, freezes: false },
  pineapple:  { product: "Pineapple in juice, 565 g tin", packs: [[340,"g",1.79]], keeps: 4, freezes: true },

  // Vegetables and fruit
  potato:     { product: "Potatoes, 2 kg bag", packs: [[2000,"g",1.99]], keeps: 21, freezes: false },
  cabbage:    { product: "White cabbage", loose: ["g",0.00129], keeps: 21, freezes: false },
  tomato:     { product: "Tomatoes", loose: ["pc",0.30], keeps: 7, freezes: false },
  onion:      { product: "Onions, 1 kg bag", packs: [[10,"pc",1.29]], keeps: 30, freezes: false },
  redonion:   { product: "Red onions", loose: ["pc",0.25], keeps: 21, freezes: false },
  pepper:     { product: "Bell peppers", loose: ["pc",0.99], keeps: 7, freezes: true },
  jalap:      { product: "Fresh chillies", loose: ["pc",0.20], keeps: 10, freezes: true },
  habanero:   { product: "Habanero", loose: ["pc",0.30], keeps: 10, freezes: true },
  avocado:    { product: "Avocados", loose: ["pc",1.19], keeps: 4, freezes: false },
  lime:       { product: "Limes", loose: ["pc",0.39], keeps: 14, freezes: false },
  apple:      { product: "Green apples", loose: ["pc",0.37], keeps: 21, freezes: false },
  pear:       { product: "Pears", loose: ["pc",0.50], keeps: 7, freezes: false },
  orange:     { product: "Oranges", loose: ["pc",0.37], keeps: 14, freezes: false },
  sweetpot:   { product: "Sweet potatoes", loose: ["g",0.00299], keeps: 14, freezes: false },
  kohlrabi:   { product: "Kohlrabi", loose: ["g",0.0039], keeps: 14, freezes: false },
  garlic:     { product: "Garlic, 3 bulbs", packs: [[30,"clove",1.19]], keeps: 30, freezes: false },
  cilantro:   { product: "Coriander, potted", packs: [[1,"bunch",1.79]], keeps: 5, freezes: false },
  basil:      { product: "Basil, potted", packs: [[1,"bunch",1.99]], keeps: 5, freezes: false },
  chives:     { product: "Chives", packs: [[1,"bunch",1.49]], keeps: 5, freezes: false },
  mint:       { product: "Mint, potted", packs: [[1,"bunch",1.99]], keeps: 5, freezes: false },
  springon:   { product: "Spring onions, bunch", packs: [[6,"pc",1.29]], keeps: 5, freezes: false },
  lettuce:    { product: "Romaine hearts, 2 pcs", packs: [[400,"g",1.99]], keeps: 5, freezes: false },
  spinach:    { product: "Baby spinach", packs: [[65,"g",1.49],[150,"g",2.69]], keeps: 3, freezes: true },
  cucumber:   { product: "Cucumber", packs: [[350,"g",1.29]], keeps: 7, freezes: false },
  mushroom:   { product: "Mushrooms", packs: [[250,"g",1.99]], keeps: 4, freezes: false },
  carrot:     { product: "Carrots, 1 kg", packs: [[1000,"g",0.99]], keeps: 21, freezes: false },
  cauli:      { product: "Cauliflower", packs: [[600,"g",2.49]], keeps: 5, freezes: true },
  celery:     { product: "Celery", packs: [[400,"g",1.69]], keeps: 10, freezes: false },
  grapes:     { product: "Red grapes", packs: [[500,"g",2.99]], keeps: 5, freezes: true },

  // Frozen
  strawb:     { product: "Frozen strawberries", packs: [[1000,"g",4.99]], keeps: 120, freezes: true },
  berries:    { product: "Frozen mixed berries", packs: [[1000,"g",4.49]], keeps: 120, freezes: true },
  mango:      { product: "Frozen mango", packs: [[1000,"g",4.49]], keeps: 120, freezes: true },
  lingon:     { product: "Frozen lingonberries", packs: [[500,"g",2.49]], keeps: 120, freezes: true },
  peas:       { product: "Frozen peas", packs: [[500,"g",1.29]], keeps: 120, freezes: true },
  fries:      { product: "Oven fries", packs: [[750,"g",2.49]], keeps: 120, freezes: true },

  // Other
  walnut:     { product: "Walnuts", packs: [[200,"g",3.49]], keeps: 90, freezes: true },
  almonds:    { product: "Almonds", packs: [[200,"g",2.99]], keeps: 90, freezes: true },
  peanut:     { product: "Unsalted peanuts", packs: [[300,"g",2.49]], keeps: 90, freezes: false },
  darkchoc:   { product: "Dark chocolate 70 %", packs: [[100,"g",2.29]], keeps: 180, freezes: false }
};
Object.keys(PRICES).forEach(function (k) { PRICES[k].status = PRICES[k].status || "estimate"; PRICES[k].checked = PRICES[k].checked || null; });

if (typeof module !== "undefined") module.exports = { PRICES, PRICE_META };
