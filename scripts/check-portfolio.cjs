// Offline checks for generated-page links, fragments and bilingual content.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const data = require('../assets/portfolio-content.js');
const files = ['history.html','history-en.html','index.html','portfolio.html','en.html','archive.html','archive-en.html','creative.html','creative-en.html', ...data.projects.flatMap(p => [`work/${p.id}/index.html`,`work/${p.id}/en.html`])];
const origin = 'https://hyunaeee.github.io/aengdo-portfolio/';
const errors = [];
function localized(value, where) {
  if (Array.isArray(value)) return value.forEach((v,i) => localized(v,`${where}[${i}]`));
  if (!value || typeof value !== 'object') return;
  if ('ko' in value || 'en' in value) {
    for (const lang of ['ko','en']) if (typeof value[lang] !== 'string' || !value[lang].trim()) errors.push(`Missing ${lang}: ${where}`);
  }
  for (const [key,child] of Object.entries(value)) localized(child,`${where}.${key}`);
}
localized(data,'content');
assert.equal(new Set(data.projects.map(p=>p.id)).size,data.projects.length);
assert.equal(new Set(data.archive.map(p=>p.id)).size,data.archive.length);
for (const entry of data.archive) if (entry.caseId) assert(data.projects.some(p=>p.id===entry.caseId),`Archive case: ${entry.id}`);
const featured = data.projects.filter(p=>p.id!=='anatomy' && p.featured!==false).map(p=>p.id);
for (const file of ['index.html','portfolio.html','en.html']) {
  const html = fs.readFileSync(path.join(root,file),'utf8');
  const visible = [...html.matchAll(/class="project-feature project-([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(visible,featured,`Featured projects: ${file}`);
  assert(html.includes(`${String(featured.length).padStart(2,'0')} PROJECTS`),`Featured count: ${file}`);
}
let checked=0;
for (const file of files) {
  const html = fs.readFileSync(path.join(root,file),'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`Static heading: ${file}`);
  assert(html.includes('Hyunae Park'),file);
  const schema = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(schema,`Structured data: ${file}`);JSON.parse(schema[1]);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw=match[1].replaceAll('&amp;','&');
    const url=new URL(raw,origin+file);
    if (!url.href.startsWith(origin)) continue;
    let rel=decodeURIComponent(url.pathname.slice(new URL(origin).pathname.length));
    if (!rel || rel.endsWith('/')) rel+='index.html';
    const target=path.resolve(root,rel);checked++;
    if (!target.startsWith(root+path.sep) || !fs.existsSync(target)) {errors.push(`${file}: missing ${raw}`);continue;}
    if (url.hash && target.endsWith('.html')) {
      // Legacy OS deep links are handled in JavaScript.
      if (['#os','#phone','#hb'].includes(url.hash)) continue;
      const source=fs.readFileSync(target,'utf8');
      const fragment=decodeURIComponent(url.hash.slice(1));
      if (!source.includes(`id="${fragment}"`)&&!source.includes(`id='${fragment}'`)) errors.push(`${file}: missing fragment ${raw}`);
    }
  }
}
if(errors.length) {console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: ${files.length} pages, ${checked} local links/assets, complete KO/EN content and structured data.`);
