const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),site=path.join(root,'work/fall-in-korea');
const evidence=JSON.parse(fs.readFileSync(path.join(site,'evidence.json'),'utf8'));
assert.equal(evidence.failed,0);assert.equal(evidence.passed,56);assert.equal(evidence.total,56);
assert.ok(fs.existsSync(path.join(site,evidence.rawTapFile)), 'Raw test output must resolve beside the evidence record');
const archive=require('../assets/portfolio-archive.js');
assert.equal(archive.filter(e=>e.id==='fall-in-korea').length,1);
const entry=archive.find(e=>e.id==='fall-in-korea');
assert.equal(entry.live,true);assert.ok(entry.summary.ko&&entry.summary.en);
for(const file of ['index.html','en.html','preview.webp','showcase.css','showcase.js','tests.tap','source/package.json'])assert.ok(fs.existsSync(path.join(site,file)),file);
for(const lang of ['index.html','en.html']){
 const html=fs.readFileSync(path.join(site,lang),'utf8');
 assert.ok(/<html lang="(ko|en)"/.test(html));
 for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
  if(/^(https?:|data:|mailto:)/.test(match[1]))continue;
  const clean=match[1].split(/[?#]/)[0];
  assert.ok(fs.existsSync(path.resolve(site,clean)),`${lang}: ${match[1]}`);
 }
}
const game=path.join(site,'game');
const app=fs.readFileSync(path.join(game,'src/app-v4.js'),'utf8');
assert.ok(!app.includes('serviceWorker.register'), 'Embedded game must not register a service worker');
assert.ok(!app.includes('native-bridge.js'),'Native bridge must not run in the demo');
assert.ok(app.includes('event.source!==parent')&&app.includes('event.origin!==location.origin'));
assert.ok(fs.readFileSync(path.join(game,'bootstrap.js'),'utf8').includes("prefix='portfolio-fall-in-korea:'"));
for(const name of fs.readdirSync(path.join(game,'src'))){
 const text=fs.readFileSync(path.join(game,'src',name),'utf8');
 assert.ok(!/['"]\/(assets|fonts|src)\//.test(text),`${name}: unscoped asset URL`);
 for(const match of text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){
  if(match[1].startsWith('data:')||match[1].includes('$'))continue;
  const base=name.endsWith('.css')?path.join(game,'src'):game;
  assert.ok(fs.existsSync(path.resolve(base,match[1])),`${name}: ${match[1]}`);
 }
}
console.log('PASS: bilingual game entry, actual test evidence, scoped assets, iframe commands and isolated demo storage.');
