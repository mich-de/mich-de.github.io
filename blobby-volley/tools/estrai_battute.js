// Estrae tutte le battute del gioco (con le varianti per ogni spiaggia) e le stampa in JSON.
// Uso: node estrai_battute.js > battute.json
const path = require('path');
const s = require('fs').readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = s.indexOf('const BANTER = {'), b = s.indexOf('const lastPick');
const towns = [...s.matchAll(/town: "([^"]+)"/g)].map(m => m[1]);
const out = new Set();
eval(s.slice(a, b).replace(/const /g, 'var ') + `
for (const lvl in BANTER) for (const [l, w] of BANTER[lvl]) { out.add(l); out.add(w); }
for (const lvl in POINT_LOSER) POINT_LOSER[lvl].forEach(x => out.add(x));
for (const lvl in POINT_WINNER) POINT_WINNER[lvl].forEach(x => { if (x.includes('{town}')) towns.forEach(t => out.add(x.replace('{town}', t))); else out.add(x); });
`);
console.log(JSON.stringify([...out], null, 1));
