(() => {
 'use strict';
 const guide=document.querySelector('#portfolio-guide');if(!guide)return;
 const home=document.querySelector('.guide-home'),viewer=document.querySelector('#guide-model'),bubble=document.querySelector('#guide-bubble');
 const heading=document.querySelector('#guide-heading'),message=document.querySelector('#guide-message'),next=document.querySelector('#guide-next');
 const toggle=document.querySelector('#guide-toggle'),motion=document.querySelector('#guide-motion');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:760px)');
 const en=document.documentElement.lang==='en',say=(ko,english)=>en?english:ko;
 const navButton=document.createElement('button');navButton.className='mobile-guide-button';navButton.setAttribute('aria-label',say('체리 안내 열기','Open Cherry’s guide'));navButton.innerHTML='<img src="assets/hyunae-guide-poster.png" alt="">';document.querySelector('.nav-actions').prepend(navButton);
 const stops=[
  {id:'intro',heading:'Projects',message:say('프로젝트 목록으로 이동합니다.','Open the project list.'),label:say('대표 작업부터 보기','Start with the work'),href:'#work'},
  {id:'work',heading:'MED-RAG',message:say('평가 결과와 QLoRA 실험을 확인할 수 있습니다.','Evaluation results and QLoRA experiments.'),label:say('MED-RAG 평가 읽기','Read the MED-RAG evaluation'),href:`work/med-rag/${en?'en.html':'index.html'}#evaluation`},
  {id:'terracotta',heading:'Terracotta',message:say('설계와 배포 정보를 확인할 수 있습니다.','Design and deployment details.'),label:say('제품의 설계 선택 보기','See the product decisions'),href:`work/terracotta/${en?'en.html':'index.html'}#decisions`},
  {id:'meeting',heading:'Meeting Assistant',message:say('RTX 4090에서 운영 중인 회의 어시스턴트입니다.','Meeting assistant running on RTX 4090.'),label:say('운영 흐름 읽기','Read the workflow'),href:`work/meeting/${en?'en.html':'index.html'}#architecture`},
  {id:'live',heading:'Anatomy Atlas',message:say('전체 구조와 계통 분해도를 전환할 수 있습니다.','Switch between whole-body and exploded views.'),label:say('Anatomy 라이브 열기','Open Anatomy live'),href:'https://anatomy-sample.vercel.app/'},
  {id:'about',heading:'Experience',message:say('경력과 학력입니다.','Work experience and education.'),label:say('연락처로 이동','Get in touch'),href:'#contact'},
  {id:'contact',heading:'Contact',message:say('이메일과 GitHub 링크입니다.','Email and GitHub links.'),label:say('메일로 이야기하기','Start a conversation'),href:'mailto:hyunaeee@gmail.com'}
 ];
 let loaded=false,expanded=false,paused=reduced.matches,current=0,frame=0,animationFrame=0,docked=false;
 function idle(){if(!loaded)return;cancelAnimationFrame(animationFrame);guide.classList.add('is-idle');if(viewer.availableAnimations.includes('Idle')&&!paused&&!document.hidden){viewer.animationName='Idle';viewer.play();}else{viewer.pause();viewer.currentTime=0;}}
 function gesture(name='GreetingLoop'){
  if(!loaded||paused||document.hidden)return;cancelAnimationFrame(animationFrame);guide.classList.remove('is-idle');viewer.animationName=viewer.availableAnimations.includes(name)?name:viewer.availableAnimations[0];viewer.currentTime=0;viewer.play({repetitions:1});
  const start=performance.now();function check(){if(paused||document.hidden){viewer.pause();return;}if(performance.now()-start>(viewer.duration||4)*1000+100){idle();return;}animationFrame=requestAnimationFrame(check);}animationFrame=requestAnimationFrame(check);
 }
 function setExpanded(value,focusClose=false){expanded=value;bubble.hidden=!value;guide.classList.toggle('is-collapsed',!value);toggle.setAttribute('aria-expanded',String(value));toggle.textContent=value?say('안내 접기','Hide guide'):say('안내 열기','Guide');navButton.setAttribute('aria-expanded',String(value));if(focusClose&&docked&&mobile.matches)navButton.focus({preventScroll:true});}
 function setStop(index){current=index;const s=stops[index];heading.textContent=s.heading;message.textContent=s.message;next.textContent=s.label+' ↗';next.href=s.href;if(s.href.startsWith('http')){next.target='_blank';next.rel='noopener noreferrer';}else next.removeAttribute('target');guide.dataset.stop=s.id;}
 function update(){frame=0;const nextDock=home.getBoundingClientRect().bottom<105;if(nextDock!==docked){docked=nextDock;guide.classList.toggle('is-docked',docked);navButton.classList.toggle('is-visible',docked);if(docked)setExpanded(false);}let index=0;stops.forEach((s,i)=>{const el=document.getElementById(s.id);if(el&&el.getBoundingClientRect().top<=innerHeight*.34)index=i;});if(index!==current)setStop(index);}
 const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
 toggle.addEventListener('click',()=>{setExpanded(!expanded);if(expanded)gesture('Point');});
 navButton.addEventListener('click',()=>{setExpanded(!expanded);if(expanded){gesture('Point');next.focus({preventScroll:true});}});
 document.querySelector('#guide-close').addEventListener('click',()=>{setExpanded(false,true);});
 document.querySelector('#guide-greet').addEventListener('click',()=>{setExpanded(true);setStop(current);gesture();});
 next.addEventListener('click',()=>{gesture('Point');if(next.hash&&next.origin===location.origin&&next.pathname===location.pathname&&mobile.matches)setExpanded(false);});
 function syncMotion(){motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-label',paused?say('움직임 재생','Resume motion'):say('움직임 멈추기','Pause motion'));if(paused||document.hidden){cancelAnimationFrame(animationFrame);viewer.pause();guide.classList.remove('is-idle');}else idle();}
 motion.addEventListener('click',()=>{paused=!paused;syncMotion();if(!paused)gesture();});reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();});document.addEventListener('visibilitychange',syncMotion);
 function fallback(){loaded=false;guide.classList.remove('is-ready');motion.disabled=true;document.querySelector('#guide-render-status').textContent=say('캐릭터 이미지로 안내 중','Guide available as a still image');}
 viewer.addEventListener('load',()=>{loaded=true;guide.classList.add('is-ready');motion.disabled=!viewer.availableAnimations.length;document.querySelector('#guide-render-status').textContent=say('3D 안내 캐릭터','3D guide');syncMotion();if(!paused)gesture();});viewer.addEventListener('error',fallback);
 import('./vendor/model-viewer.min.js').catch(fallback);
 window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded&&docked)setExpanded(false,true);});setExpanded(false);setStop(0);update();
})();
