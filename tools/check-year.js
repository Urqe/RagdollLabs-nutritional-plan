const E=require('../src/engine.js'); const D=require('../src/data.js');
const R=D.RECIPES;
console.log('recipes',R.length, R.reduce((a,r)=>(a[r.meal+(r.cheat?'-cheat':'')]=(a[r.meal+(r.cheat?'-cheat':'')]||0)+1,a),{}));
// banned check
const banned=/pork mince|kassler|fish|salmon|tuna|shrimp|prawn|eggplant|aubergine|zucchini|courgette|banana|beetroot|punajuuri|banaani/i;
const BANNED_IDS=['banana','beetroot'];
let bannedHits=0; const fails=[];
// Protein guarantees are checked on meals plus optional snack 1 only (juice and snack 2 off),
// so they hold whatever extras are ticked in the app.
const MIN={juice:false,s1:true,s2:false};
for(const r of [...R,...D.SNACKS1,...D.SNACKS2,...D.JUICES]){ if(banned.test(r.name||'')||(r.steps||[]).some(s=>banned.test(s))){console.log('BANNED in text',r.id);bannedHits++;} for(const i of r.ing){ if(!D.CAT[i[0]]) { console.log('MISSING',r.id,i[0]); fails.push('unknown ingredient '+i[0]+' in '+r.id); } if(BANNED_IDS.includes(i[0])||banned.test(D.CAT[i[0]]?.n||'')){ console.log('BANNED',r.id,i[0]); bannedHits++; } } }
console.log('banned ingredients found:', bannedHits); if(bannedHits) fails.push(bannedHits+' banned ingredient hits');
for(const r of R) console.log(r.id.padEnd(4), r.P.toFixed(0).padStart(4)+'g', r.K.toFixed(0).padStart(5)+'kcal', 'P2',(r.P*r.share).toFixed(0),'P1',(r.P*(1-r.share)).toFixed(0), r.name);
// simulate a year
let s={p1:[],p2:[]},sn={p1:[0,0,0],p2:[0,0,0]},short={p1:0,p2:0},over={p1:0,p2:0};
let repeats={b:0,l:0,d:0}; let lastSeen={};
for(let i=0;i<365;i++){ const dt=new Date(Date.UTC(2026,0,1)+i*864e5); const d=E.day(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate(),{},MIN);
 for(const p of ['p1','p2']){ const x=d.people[p]; s[p].push(x); if(x.p<x.target-6) short[p]++; if(x.p>x.target+25) over[p]++; }
 for(const sl of ['b','l','d']){ const r=d.meals[sl]; if(r.leftover) continue; const id=r.id+sl; const gap=sl==='b'?(r.weekend?E.RULES.weekendBreakfast:E.RULES.breakfast):sl==='l'?E.RULES.lunch:(r.cheat?E.RULES.cheat:E.RULES.dinner); const dw=dt.getUTCDay(); if(lastSeen[id]!=null && i-lastSeen[id]<gap && !(sl==='b' && (dw===0||dw===6))) repeats[sl]++; lastSeen[id]=i; }
}
for(const p of ['p1','p2']){ const a=s[p]; const avg=f=>(a.reduce((x,y)=>x+y[f],0)/a.length).toFixed(0);
 console.log(p,'avg protein',avg('p'),'meal protein',avg('mealP'),'avg kcal',avg('k'),'min p',Math.min(...a.map(x=>x.p)).toFixed(0),'max p',Math.max(...a.map(x=>x.p)).toFixed(0),'short',short[p],'over+25',over[p], 'kcal min/max',Math.min(...a.map(x=>x.k)).toFixed(0),Math.max(...a.map(x=>x.k)).toFixed(0));}
console.log('repeat violations',repeats); if(repeats.b+repeats.l+repeats.d) fails.push('repeat violations '+JSON.stringify(repeats));
// usage count
const use={}; for(let i=0;i<365;i++){const dt=new Date(Date.UTC(2026,0,1)+i*864e5); const d=E.day(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate()); for(const sl of ['b','l','d']) { if(d.meals[sl].leftover) continue; use[d.meals[sl].id]=(use[d.meals[sl].id]||0)+1; }}
console.log(Object.entries(use).sort().map(([k,v])=>k+':'+v).join(' '));
const wk=[]; for(let i=0;i<14;i++){const dt=new Date(Date.UTC(2026,9,12)+i*864e5); const d=E.day(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate()); wk.push(d.key+' '+['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getUTCDay()]+' '+d.meals.b.id+' '+d.meals.l.id+' '+d.meals.d.id+' p1 '+d.people.p1.p.toFixed(0)+' snack1 '+d.snacks[0].id+' p2 '+d.people.p2.p.toFixed(0));} console.log(wk.join('\n'));
// weekly averages (Mon-Sun) for 2026
{ const W={p1:[],p2:[]}; let start=Date.UTC(2025,11,29);
  for(let w=0;w<52;w++){ const acc={p1:0,p2:0}; for(let k=0;k<7;k++){ const dt=new Date(start+(w*7+k)*864e5); const d=E.day(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate(),{},MIN); acc.p1+=d.people.p1.p; acc.p2+=d.people.p2.p; } W.p1.push(acc.p1/7); W.p2.push(acc.p2/7); }
  for(const p of ['p1','p2']) { console.log('weekly avg',p,'min',Math.min(...W[p]).toFixed(0),'max',Math.max(...W[p]).toFixed(0)); if(Math.min(...W[p]) < D.PEOPLE[p].protein) fails.push(p+' weekly protein average below target'); } }
if(fails.length){ console.log('FAILED: '+fails.join('; ')); process.exitCode=1; } else console.log('All guarantees hold: no banned ingredients, no unknown ingredients, no repeat violations, weekly protein at or above target.');
