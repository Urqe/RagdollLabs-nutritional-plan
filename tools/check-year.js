const E=require('../src/engine.js'); const D=require('../src/data.js');
const R=D.RECIPES;
console.log('recipes',R.length, R.reduce((a,r)=>(a[r.meal+(r.cheat?'-cheat':'')]=(a[r.meal+(r.cheat?'-cheat':'')]||0)+1,a),{}));
// banned check
const banned=/pork mince|kassler|fish|salmon|tuna|shrimp|prawn|eggplant|aubergine|zucchini|courgette/i;
for(const r of R){ for(const i of r.ing){ if(!D.CAT[i[0]]) console.log('MISSING',r.id,i[0]); if(banned.test(D.CAT[i[0]]?.n||'')) console.log('BANNED',r.id,i[0]);} }
for(const r of R) console.log(r.id.padEnd(4), r.P.toFixed(0).padStart(4)+'g', r.K.toFixed(0).padStart(5)+'kcal', 'P2',(r.P*r.share).toFixed(0),'P1',(r.P*(1-r.share)).toFixed(0), r.name);
// simulate a year
let s={p1:[],p2:[]},sn={p1:[0,0,0],p2:[0,0,0]},short={p1:0,p2:0},over={p1:0,p2:0};
let repeats={b:0,l:0,d:0}; let lastSeen={};
for(let i=0;i<365;i++){ const dt=new Date(Date.UTC(2026,0,1)+i*864e5); const d=E.day(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate());
 for(const p of ['p1','p2']){ const x=d.people[p]; s[p].push(x); sn[p][x.snacks.length]++; if(x.p<x.target-6) short[p]++; if(x.p>x.target+25) over[p]++; }
 for(const sl of ['b','l','d']){ const id=d.meals[sl].id; if(lastSeen[id]!=null && i-lastSeen[id]<(sl==='b'?5:sl==='l'?9:12) && !d.meals[sl].cheat && !d.meals[sl].weekend) repeats[sl]++; lastSeen[id]=i; }
}
for(const p of ['p1','p2']){ const a=s[p]; const avg=f=>(a.reduce((x,y)=>x+y[f],0)/a.length).toFixed(0);
 console.log(p,'avg protein',avg('p'),'meal protein',avg('mealP'),'avg kcal',avg('k'),'min p',Math.min(...a.map(x=>x.p)).toFixed(0),'max p',Math.max(...a.map(x=>x.p)).toFixed(0),'snacks dist',sn[p],'short',short[p],'over+25',over[p], 'kcal min/max',Math.min(...a.map(x=>x.k)).toFixed(0),Math.max(...a.map(x=>x.k)).toFixed(0));}
console.log('repeat violations',repeats);
// usage count
const use={}; for(let i=0;i<365;i++){const dt=new Date(Date.UTC(2026,0,1)+i*864e5); const d=E.day(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate()); for(const sl of ['b','l','d']) use[d.meals[sl].id]=(use[d.meals[sl].id]||0)+1;}
console.log(Object.entries(use).sort().map(([k,v])=>k+':'+v).join(' '));
const wk=[]; for(let i=0;i<14;i++){const dt=new Date(Date.UTC(2026,9,12)+i*864e5); const d=E.day(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate()); wk.push(d.key+' '+['Su','Mo','Tu','We','Th','Fr','Sa'][dt.getUTCDay()]+' '+d.meals.b.id+' '+d.meals.l.id+' '+d.meals.d.id+' p1 '+d.people.p1.p.toFixed(0)+'/'+d.people.p1.snacks.length+' p2 '+d.people.p2.p.toFixed(0)+'/'+d.people.p2.snacks.length);} console.log(wk.join('\n'));
