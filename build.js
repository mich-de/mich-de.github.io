const fs = require('fs');
const path = require('path');

async function fetchRepos(user) {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'User-Agent': 'mich-de-hobby-builder',
    'Accept': 'application/vnd.github.v3+json'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/\b(Piano di Sorrento|Sorrento|Campania|Benevento and Sannio)\b/gi, '')
    .trim();
}

function categorizeRepos(repos, config) {
  const excluded = new Set(config.excludedRepos.map(r => r.toLowerCase()));
  const categoryMap = new Map();

  for (const cat of config.categories) {
    categoryMap.set(cat.id, {
      ...cat,
      repos: []
    });
  }

  const assignedRepoNames = new Set();

  // First pass: explicit repo assignments
  for (const cat of config.categories) {
    const list = categoryMap.get(cat.id).repos;
    for (const exp of cat.explicit || []) {
      const found = repos.find(r => r.name.toLowerCase() === exp.toLowerCase());
      if (found && !excluded.has(found.name.toLowerCase())) {
        list.push(found);
        assignedRepoNames.add(found.name.toLowerCase());
      }
    }
  }

  // Second pass: automatic keyword / topic matching for newly added repos
  for (const repo of repos) {
    const nameLow = repo.name.toLowerCase();
    if (excluded.has(nameLow) || assignedRepoNames.has(nameLow) || repo.fork) {
      continue;
    }

    const topics = Array.isArray(repo.topics) ? repo.topics.map(t => t.toLowerCase()) : [];
    const desc = (repo.description || '').toLowerCase();
    const searchable = `${nameLow} ${topics.join(' ')} ${desc}`;

    let matchedCatId = null;
    for (const cat of config.categories) {
      const hit = (cat.keywords || []).some(k => searchable.includes(k.toLowerCase()));
      if (hit) {
        matchedCatId = cat.id;
        break;
      }
    }

    if (matchedCatId) {
      categoryMap.get(matchedCatId).repos.push(repo);
      assignedRepoNames.add(nameLow);
    }
  }

  return Array.from(categoryMap.values());
}

function buildHtml(categories, config) {
  let totalRepos = 0;
  for (const cat of categories) {
    totalRepos += cat.repos.length;
  }

  const navItems = categories.map(cat => {
    return `      <li style="--h:${cat.hue}"><a href="#${cat.id}"><i class="sw" aria-hidden="true"></i>${escapeHtml(cat.title)} <span class="n mono">${cat.repos.length}</span></a></li>`;
  }).join('\n');

  const hobbySections = categories.map(cat => {
    const repoRows = cat.repos.map(repo => {
      const override = config.repoOverrides[repo.name] || {};
      const title = override.title || repo.name.replace(/[-_]/g, ' ');
      let desc = override.description || sanitizeText(repo.description) || 'Open source project';
      const kind = override.kind || (repo.homepage ? 'Play' : 'Code');
      const href = override.url || repo.homepage || repo.html_url;
      const isPlay = kind.toLowerCase() === 'play';

      return `      <li><a class="row" href="${escapeHtml(href)}"><span class="slug mono">${escapeHtml(repo.name)}</span><span class="main"><span class="t">${escapeHtml(title)}</span><span class="d">${escapeHtml(desc)}</span></span><span class="k${isPlay ? ' play' : ''} mono">${escapeHtml(kind)}</span><svg class="arr"><use href="#i-arrow"/></svg></a></li>`;
    }).join('\n');

    return `  <section class="hobby" id="${cat.id}" style="--h:${cat.hue}">
    <div class="hobby-head"><div class="stick">
      <div class="top"><svg class="ico"><use href="${cat.icon}"/></svg><span class="mono">${cat.repos.length} ${cat.repos.length === 1 ? 'repo' : 'repos'}</span></div>
      <h2>${escapeHtml(cat.title)}</h2>
      <p>${escapeHtml(cat.description)}</p>
    </div></div>
    <ul class="rows">
${repoRows}
    </ul>
  </section>`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(config.user)} · Hobbies</title>
<meta name="description" content="The hobbies behind ${escapeHtml(config.user)}'s open source projects.">
<meta name="color-scheme" content="light dark">
<script>
  (function () {
    var t = localStorage.getItem('theme');
    if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Doto:wght@700;900&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root, [data-theme="light"] {
    --bg:#f3f2ef; --surface:#fbfaf8; --line:#d9d6d0; --line-strong:#bdb9b1;
    --text:#141413; --muted:#5f5b55;
    --accent:#e5481a; --accent-ink:#b3360f; --on-accent:#fff;
    --dot:#cfcbc4; --band:#ecebe6;
  }
  [data-theme="dark"] {
    --bg:#0e0e0e; --surface:#151515; --line:#262626; --line-strong:#3a3a3a;
    --text:#ecebe8; --muted:#9a968f;
    --accent:#ff5a1f; --accent-ink:#ff7a45; --on-accent:#0e0e0e;
    --dot:#2b2b2b; --band:#131313;
  }

  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth;scrollbar-color:var(--line-strong) var(--bg)}
  body{
    background:var(--bg);color:var(--text);
    font:16px/1.6 Geist,system-ui,sans-serif;
    -webkit-font-smoothing:antialiased;
    transition:background-color .35s ease,color .35s ease;
  }
  ::selection{background:var(--accent);color:var(--on-accent)}
  ::-webkit-scrollbar{width:10px}
  ::-webkit-scrollbar-track{background:var(--bg)}
  ::-webkit-scrollbar-thumb{background:var(--line-strong);border:3px solid var(--bg);border-radius:10px}
  a{color:inherit;text-decoration:none}
  :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
  .mono{font-family:"Geist Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}
  .wrap{max-width:1200px;margin:0 auto;padding:0 32px}
  svg.ico{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;flex:none}

  /* Top bar */
  .bar{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  .bar .wrap{display:flex;align-items:center;justify-content:space-between;height:56px;gap:16px}
  .handle{display:flex;align-items:center;gap:10px;font-size:14px}
  .led{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
  .bar-right{display:flex;align-items:center;gap:20px;font-size:13px;color:var(--muted)}
  .toggle{
    display:inline-flex;align-items:center;gap:8px;cursor:pointer;
    font:500 12px/1 "Geist Mono",monospace;letter-spacing:.06em;text-transform:uppercase;
    color:var(--text);background:var(--surface);border:1px solid var(--line);
    padding:8px 12px;border-radius:999px;transition:border-color .2s;
  }
  .toggle:hover{border-color:var(--text)}
  .toggle svg{width:15px;height:15px}
  [data-theme="light"] .i-sun,[data-theme="dark"] .i-moon{display:none}

  /* Hero */
  .hero{
    border-bottom:1px solid var(--line);
    background-image:radial-gradient(var(--dot) 1.2px,transparent 1.2px);
    background-size:16px 16px;background-position:-8px -8px;
  }
  .hero .wrap{padding-top:112px;padding-bottom:72px;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:56px;align-items:end}
  h1{
    font-family:Doto,"Geist Mono",monospace;font-weight:900;
    font-size:clamp(48px,8.2vw,108px);line-height:.95;letter-spacing:-.02em;
    text-wrap:balance;
    animation:wipe 1.4s cubic-bezier(.16,1,.3,1) both;
  }
  h1 .hot{color:var(--accent)}
  @keyframes wipe{from{clip-path:inset(0 100% 0 0);filter:blur(6px)}to{clip-path:inset(0 0 0 0);filter:blur(0)}}
  .lead{font-size:18px;color:var(--muted);max-width:42ch}
  .lead strong{color:var(--text);font-weight:500}

  /* Index */
  .index{border-bottom:1px solid var(--line)}
  .index ul{list-style:none;display:grid;grid-template-columns:repeat(4,1fr)}
  .index li{border-right:1px solid var(--line)}
  .index li:nth-child(4n){border-right:0}
  .index li:nth-child(-n+4){border-bottom:1px solid var(--line)}
  .index a{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px;font-size:15px;font-weight:500;transition:background-color .2s,color .2s}
  .index a:hover{background:var(--surface);color:var(--accent-ink)}
  .index .n{font-size:12px;color:var(--muted)}

  /* Hobby blocks */
  .hobby{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);border-bottom:1px solid var(--line);scroll-margin-top:56px}
  .hobby-head{padding:48px 40px 48px 0;border-right:1px solid var(--line)}
  .hobby-head > *{position:relative}
  @media (min-width:961px){.hobby-head .stick{position:sticky;top:96px}}
  .hobby-head .top{display:flex;align-items:center;justify-content:space-between;color:var(--accent-ink);margin-bottom:28px}
  .hobby-head .top .mono{font-size:12px;color:var(--muted)}
  .hobby-head h2{font-size:30px;font-weight:600;line-height:1.1;letter-spacing:-.025em;margin-bottom:12px}
  .hobby-head p{color:var(--muted);font-size:15px;max-width:34ch}

  .rows{list-style:none;padding:24px 0}
  .row{
    position:relative;display:grid;grid-template-columns:minmax(0,190px) minmax(0,1fr) 92px 20px;
    gap:24px;align-items:baseline;padding:18px 0 18px 40px;
    border-bottom:1px solid var(--line);isolation:isolate;
  }
  .rows li:last-child .row{border-bottom:0}
  .row::before{
    content:"";position:absolute;inset:0 0 0 24px;z-index:-1;background:var(--surface);
    transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.16,1,.3,1);
  }
  .row:hover::before,.row:focus-visible::before{transform:scaleX(1)}
  .row .slug{font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .row .t{font-weight:500}
  .row .d{display:block;color:var(--muted);font-size:14px;margin-top:2px}
  .row .k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);justify-self:end}
  .row .k.play{color:var(--accent-ink)}
  .row .arr{width:16px;height:16px;justify-self:end;color:var(--muted);transition:transform .3s cubic-bezier(.16,1,.3,1),color .2s}
  .row:hover .arr{transform:translate(3px,-3px);color:var(--accent-ink)}
  .row:hover .t{color:var(--accent-ink)}

  /* Per-hobby hue: a hair of difference between sections */
  [style*="--h"]{--hc:oklch(.56 .14 var(--h))}
  [data-theme="dark"] [style*="--h"]{--hc:oklch(.76 .12 var(--h))}
  .index a{justify-content:flex-start}
  .index .n{margin-left:auto}
  .sw{width:8px;height:8px;border-radius:2px;background:var(--hc);flex:none}
  .index a:hover{color:var(--text)}
  .hobby-head .top{color:var(--hc)}
  .hobby:nth-of-type(even){background:var(--band);box-shadow:0 0 0 100vmax var(--band);clip-path:inset(0 -100vmax)}
  .row::before{background:color-mix(in oklch,var(--hc) 9%,var(--surface))}
  .row:hover .t,.row:hover .arr,.row .k.play{color:var(--hc)}

  footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:40px;padding-bottom:56px;font-size:13px;color:var(--muted)}
  footer a{color:var(--text);border-bottom:1px solid var(--line-strong);transition:border-color .2s}
  footer a:hover{border-color:var(--accent)}

  @media (max-width:960px){
    .hero .wrap{grid-template-columns:1fr;gap:28px;padding-top:80px;padding-bottom:56px}
    .index ul{grid-template-columns:repeat(2,1fr)}
    .index li{border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
    .index li:nth-child(2n){border-right:0}
    .index li:nth-last-child(-n+2){border-bottom:0}
    .hobby{grid-template-columns:1fr}
    .hobby-head{padding:40px 0 24px;border-right:0}
    .rows{padding:0 0 24px}
    .row{padding-left:0;grid-template-columns:minmax(0,1fr) 20px;gap:4px 16px}
    .row::before{inset:0 -12px}
    .row .slug{grid-column:1;order:0}
    .row .main{grid-column:1}
    .row .k{display:none}
    .row .arr{grid-column:2;grid-row:1 / span 2;align-self:center}
  }
  @media (max-width:560px){
    .wrap{padding:0 20px}
    .bar-right .count{display:none}
  }
  @media (prefers-reduced-motion:reduce){
    *,*::before{animation:none!important;transition:none!important}
    html{scroll-behavior:auto}
  }
</style>
</head>
<body>

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-arrow" viewBox="0 0 16 16"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-game" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="11" r=".6"/><circle cx="18" cy="13" r=".6"/></symbol>
  <symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z"/></symbol>
  <symbol id="i-gauge" viewBox="0 0 24 24"><path d="M3.5 17a8.5 8.5 0 1 1 17 0"/><path d="M12 17l4.5-5"/><circle cx="12" cy="17" r="1"/><path d="M6.5 10.5l1 1M12 6.5V8M17.5 10.5l-1 1"/></symbol>
  <symbol id="i-glass" viewBox="0 0 24 24"><path d="M8 3h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 7h8M12 11.5V20M8.5 20.5h7"/></symbol>
  <symbol id="i-bottle" viewBox="0 0 24 24"><rect x="6" y="9" width="12" height="12" rx="2.5"/><path d="M9.5 9V5.5h5V9M12 5.5V3M15 3h-6"/></symbol>
  <symbol id="i-server" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2M10.5 9.5h3v4h-3zM11.5 8.5h1"/></symbol>
  <symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/></symbol>
</svg>

<div class="bar">
  <div class="wrap">
    <a class="handle mono" href="https://github.com/${escapeHtml(config.user)}"><span class="led" aria-hidden="true"></span>${escapeHtml(config.user)}</a>
    <div class="bar-right">
      <span class="count mono">${categories.length} hobbies · ${totalRepos} repos</span>
      <button class="toggle" id="theme" type="button" aria-label="Switch color theme">
        <svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>
        <svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
        <span id="theme-label">Light</span>
      </button>
    </div>
  </div>
</div>

<header class="hero">
  <div class="wrap">
    <h1>Code born from <span class="hot">hobbies.</span></h1>
    <p class="lead">Almost every repository I have starts with a hobby: <strong>an old game to bring back to life, a trip to plan, an engine to look after.</strong> Here they are, grouped by passion.</p>
  </div>
</header>

<nav class="index" aria-label="Hobbies">
  <div class="wrap">
    <ul>
${navItems}
    </ul>
  </div>
</nav>

<main class="wrap">

${hobbySections}

</main>

<footer>
  <div class="wrap">
    <span>All projects at <a href="https://github.com/${escapeHtml(config.user)}">github.com/${escapeHtml(config.user)}</a></span>
    <span class="mono">Built by hand · no tracking</span>
  </div>
</footer>

<script>
  (function () {
    var root = document.documentElement, btn = document.getElementById('theme'), label = document.getElementById('theme-label');
    function sync() {
      var dark = root.dataset.theme === 'dark';
      label.textContent = dark ? 'Dark' : 'Light';
      btn.setAttribute('aria-pressed', dark);
    }
    btn.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', root.dataset.theme);
      sync();
    });
    sync();
  })();
</script>
</body>
</html>
`;
}

async function main() {
  const configPath = path.join(__dirname, 'hobbies.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  console.log(`Fetching repositories for ${config.user}...`);
  const repos = await fetchRepos(config.user);
  console.log(`Received ${repos.length} public repos from GitHub.`);

  const categories = categorizeRepos(repos, config);
  const totalAssigned = categories.reduce((sum, c) => sum + c.repos.length, 0);
  console.log(`Categorized ${totalAssigned} repos across ${categories.length} hobby categories.`);

  const html = buildHtml(categories, config);
  const outPath = path.join(__dirname, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Successfully generated ${outPath}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
