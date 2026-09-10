(() => {
 'use strict';
 const en=document.documentElement.lang==='en';
 const say=(ko,english)=>en?english:ko;
 const dialog=document.querySelector('#export-dialog');
 let opener=null;
 document.querySelectorAll('[data-export-open]').forEach(button=>button.addEventListener('click',()=>{opener=button;dialog.showModal();}));
 dialog?.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 dialog?.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 const focus=document.querySelector('#pdf-focus');
 const query=new URLSearchParams(location.search);
 if(focus){if(['general','toss','motif','cohere'].includes(query.get('focus')))focus.value=query.get('focus');const sync=()=>document.querySelectorAll('[data-print-portfolio]').forEach(b=>b.dataset.focus=focus.value);focus.addEventListener('change',sync);sync();}
 document.querySelectorAll('[data-language-switch]').forEach(a=>{const u=new URL(a.href);for(const key of ['focus','q','type'])if(query.has(key))u.searchParams.set(key,query.get(key));u.hash=location.hash;a.href=u.href;});
 const legacy={featured:'work',projects:'work',experience:'about'};
 const old=location.hash.slice(1);if(legacy[old]){history.replaceState(null,'','#'+legacy[old]);document.getElementById(legacy[old])?.scrollIntoView({behavior:'instant'});}
 const archiveCards=[...document.querySelectorAll('.archive-card')];
 if(archiveCards.length){
   const search=document.querySelector('#project-search');let category=query.get('type')||'all';
   if(!['all','live','ai','web','app','play'].includes(category))category='all';search.value=query.get('q')||'';
   function update(){let visible=0;const needle=search.value.trim().toLocaleLowerCase();archiveCards.forEach(card=>{const match=(category==='all'||(category==='live'?card.dataset.live==='true':card.dataset.category===category))&&card.dataset.search.includes(needle);card.hidden=!match;if(match)visible++;});document.querySelector('#project-count').textContent=say(`${visible}개 / 전체 ${archiveCards.length}개 프로젝트`,`${visible} of ${archiveCards.length} projects`);document.querySelector('#project-empty').hidden=visible!==0;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));const url=new URL(location.href);category==='all'?url.searchParams.delete('type'):url.searchParams.set('type',category);needle?url.searchParams.set('q',search.value):url.searchParams.delete('q');history.replaceState(null,'',url);}
   document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;update();}));search.addEventListener('input',update);update();
 }
 const capture=document.querySelector('#anatomy-capture');
 if(capture)document.querySelectorAll('[data-anatomy-view]').forEach(button=>button.addEventListener('click',()=>{const split=button.dataset.anatomyView==='exploded';capture.src=split?capture.dataset.exploded:capture.dataset.whole;capture.alt=split?say('Anatomy Atlas 실제 캡처: 계통별로 분리한 인체 구조','Actual Anatomy Atlas screenshot: separated body systems'):say('Anatomy Atlas 실제 캡처: 전체 인체 구조','Actual Anatomy Atlas screenshot: whole-body view');document.querySelectorAll('[data-anatomy-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#anatomy-caption').textContent=split?say('라이브 사이트 실제 캡처 · 계통별 분리 상태','Actual live-site capture · separated body systems'):say('라이브 사이트 실제 캡처 · 전체 구조 보기','Actual live-site capture · whole-body view');}));
 document.querySelectorAll('[data-evaluation-widget]').forEach(widget=>widget.querySelectorAll('[data-evaluation]').forEach(button=>button.addEventListener('click',()=>{const after=button.dataset.evaluation==='after';widget.querySelectorAll('[data-evaluation]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));widget.querySelector('[data-eval-score]').innerHTML=(after?'20':'24')+'<span> / 24</span>';widget.querySelector('[data-eval-label]').textContent=after?say('문서를 함께 보고 평가한 답변 통과 수','Answers passing when the judge sees source documents'):say('질문과 답변만 보고 평가한 통과 수','Answers passing when the judge only sees question and answer');widget.querySelector('[data-eval-explanation]').textContent=after?say('근거 없는 주장과 존재하지 않는 인용 4건을 발견했습니다.','Four unsupported claims and invented citations became visible.'):say('모두 통과했지만, 실제 검색 문서의 근거성은 검증하지 못했습니다.','All answers passed, but grounding in the retrieved documents was not checked.');widget.querySelectorAll('.evaluation-grid i').forEach((tile,i)=>tile.classList.toggle('is-failure',after&&i>=20));})));
 const toc=[...document.querySelectorAll('.case-toc a')];
 if(toc.length&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{const entry=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(entry)toc.forEach(a=>{const selected=a.hash==='#'+entry.target.id;a.classList.toggle('is-active',selected);selected?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current');});},{rootMargin:'-100px 0px -60% 0px'});document.querySelectorAll('.case-section').forEach(s=>observer.observe(s));}
})();
