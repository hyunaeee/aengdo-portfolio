const fs = require('node:fs');
const path = require('node:path');
const cv = require('../assets/portfolio-cv.js');
const root = path.resolve(__dirname, '..');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const anchor = (url, label) => `<a href="${esc(url)}"${url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''}>${esc(label)}<span class="outbound" aria-hidden="true">↗</span></a>`;
const points = list => list?.length ? `<ul>${list.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>` : '';
function entry(item) {
  return `<article class="cv-entry"><div class="entry-title"><h3>${item.url?anchor(item.url,item.title):esc(item.title)}</h3></div><div class="entry-meta"><p>${esc(item.role)}</p><span class="entry-date">${esc(item.date)}</span></div>${item.note?`<p class="entry-note">${esc(item.note)}</p>`:''}${points(item.points)}${(item.items||[]).map(sub=>`<div class="cv-subentry"><h4>${anchor(sub.url,sub.title)}</h4>${points(sub.points)}</div>`).join('')}${item.links?.length?`<div class="entry-links">${item.links.map(([label,url])=>anchor(url,label)).join('')}</div>`:''}</article>`;
}
const section = (id,title,entries)=>`<section class="cv-section" id="${id}" aria-labelledby="${id}-title"><h2 id="${id}-title">${title}</h2>${entries.map(entry).join('')}</section>`;
function build() {
  const canonical = 'https://hyunaeee.github.io/aengdo-portfolio/cv/';
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'ProfilePage',name:'Hyunae Park — CV',url:canonical,dateModified:cv.updated,mainEntity:{'@type':'Person',name:cv.name,jobTitle:cv.role,email:cv.email,url:canonical,sameAs:['https://github.com/hyunaeee','https://velog.io/@hyunaeee']}}).replace(/</g,'\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hyunae Park — AI Engineer · CV</title><meta name="description" content="Hyunae Park’s English CV. AI engineering, agent systems, RAG, speech workflows, evaluation, and service operations."><meta name="theme-color" content="#080808"><meta property="og:title" content="Hyunae Park — AI Engineer · CV"><meta property="og:description" content="Experience, selected projects, research, and education."><meta property="og:type" content="profile"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary"><link rel="canonical" href="${canonical}"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../assets/portfolio-cv.css"><script type="application/ld+json">${schema}</script><script src="../assets/portfolio-cv-ui.js" defer></script></head>
<body><a class="skip-link" href="#cv">Skip to CV</a><div class="cv-shell"><nav class="cv-toolbar" aria-label="CV actions"><a href="../en.html">← Portfolio</a><div><span class="language-label">EN</span><button type="button" id="cv-print" hidden>Print / Save PDF <span aria-hidden="true">↗</span></button></div></nav>
<main id="cv"><header class="cv-profile"><div class="profile-row"><div class="profile-monogram" aria-hidden="true">HP</div><div><h1>${esc(cv.name)}</h1><p class="profile-position">${esc(cv.role)} <span aria-hidden="true">·</span> ${esc(cv.location)}</p><a class="profile-email" href="mailto:${esc(cv.email)}">${esc(cv.email)}</a></div></div><p class="profile-summary">${esc(cv.summary)}</p></header>
<div class="cv-columns"><div class="cv-main">${section('experience','Experience',cv.experience)}${section('projects','Selected Projects',cv.projects)}${section('research','Research',cv.research)}${section('teaching','Teaching',cv.teaching)}</div>
<aside class="cv-sidebar" aria-label="Education, skills, and activities">${section('education','Education',cv.education)}<section class="cv-section" id="skills" aria-labelledby="skills-title"><h2 id="skills-title">Skills</h2><dl class="cv-skills">${cv.skills.map(([label,body])=>`<div><dt>${esc(label)}</dt><dd>${esc(body)}</dd></div>`).join('')}</dl></section>${section('training','Professional Training',cv.training)}${section('community','Community & Exhibitions',cv.community)}<section class="cv-section" id="languages" aria-labelledby="languages-title"><h2 id="languages-title">Languages</h2><p>Korean · Native</p><p>English · Teaching and study experience</p></section><section class="cv-section" id="contact" aria-labelledby="contact-title"><h2 id="contact-title">Contact</h2><dl class="cv-contact">${cv.contacts.map(([label,url,text])=>`<div><dt>${esc(label)}</dt><dd>${anchor(url,text)}</dd></div>`).join('')}</dl></section></aside></div></main>
<footer class="cv-footer"><span>Hyunae Park</span><span>Updated <time datetime="${cv.updated}">October 6, 2026</time></span><a href="../roles/ai-agent/en.html">AI Agent case studies ↗</a></footer></div></body></html>\n`;
  fs.mkdirSync(path.join(root,'cv'),{recursive:true});fs.writeFileSync(path.join(root,'cv/index.html'),html);
  console.log('Built English CV.');
}
module.exports = build;
if(require.main === module)build();
