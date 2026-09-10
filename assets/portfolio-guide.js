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
  {id:'intro',heading:say('안녕하세요, 체리예요.','Hi, I’m Cherry.'),message:say('어떤 문제를 풀고, 무엇을 검증했는지 함께 볼까요?','Let me show you the problems, decisions, and evidence behind the work.'),label:say('대표 작업부터 보기','Start with the work'),href:'#work'},
  {id:'work',heading:say('먼저, 평가를 고친 이야기예요.','First, an evaluation that learned to fail.'),message:say('평가자에게 검색 근거를 보여주자 실패 4건이 드러났어요. 그 과정을 확인해 보세요.','Giving the judge the retrieved evidence exposed four failures. Take a look at what changed.'),label:say('MED-RAG 평가 읽기','Read the MED-RAG evaluation'),href:`work/med-rag/${en?'en.html':'index.html'}#evaluation`},
  {id:'terracotta',heading:say('다음은, 실행을 통제하는 제품.','Next, a product with visible control.'),message:say('Terracotta는 도구 실행 승인과 비용, 배포 기록을 하나의 흐름으로 연결해요.','Terracotta connects tool approvals, cost records, and deployment into one workflow.'),label:say('제품의 설계 선택 보기','See the product decisions'),href:`work/terracotta/${en?'en.html':'index.html'}#decisions`},
  {id:'meeting',heading:say('실제 업무에 연결한 AI예요.','AI connected to everyday work.'),message:say('회의 어시스턴트는 RTX 4090에서 운영 중이에요. 처리 단계와 측정 범위를 구분했어요.','The meeting assistant runs on RTX 4090. Its processing stages and measurement scope are separated.'),label:say('운영 흐름 읽기','Read the workflow'),href:`work/meeting/${en?'en.html':'index.html'}#architecture`},
  {id:'live',heading:say('직접 펼쳐볼 수도 있어요.','You can explore this one yourself.'),message:say('Anatomy의 전체 구조와 계통 분해도를 비교하고, 라이브에서 직접 조작해 보세요.','Compare Anatomy’s whole-body and exploded captures, then explore the live model.'),label:say('Anatomy 라이브 열기','Open Anatomy live'),href:'https://anatomy-sample.vercel.app/'},
  {id:'about',heading:say('문제와 사람을 연결해 왔어요.','Connecting people and technical problems.'),message:say('제품 개발, 팀 프로젝트, 영어 코딩 수업에서 쌓은 경험을 소개해요.','Here is the experience behind the work: products, team projects, and coding classes in English.'),label:say('연락처로 이동','Get in touch'),href:'#contact'},
  {id:'contact',heading:say('만나서 반가웠어요.','Thanks for visiting.'),message:say('설계와 검증 결과는 PDF로도 읽을 수 있어요. 함께 풀 문제가 있다면 이야기해 주세요.','The decisions and evidence are also available as a PDF. Let’s talk about what comes next.'),label:say('메일로 이야기하기','Start a conversation'),href:'mailto:hyunaeee@gmail.com'}
 ];
 let loaded=false,expanded=true,paused=reduced.matches,current=0,frame=0,animationFrame=0,docked=false,firstGreeting=true;
 function idle(){if(!loaded)return;cancelAnimationFrame(animationFrame);guide.classList.add('is-idle');if(viewer.availableAnimations.includes('Idle')&&!paused&&!document.hidden){viewer.animationName='Idle';viewer.play();}else{viewer.pause();viewer.currentTime=0;}}
 function gesture(name='GreetingLoop'){
  if(!loaded||paused||document.hidden)return;cancelAnimationFrame(animationFrame);guide.classList.remove('is-idle');viewer.animationName=viewer.availableAnimations.includes(name)?name:viewer.availableAnimations[0];viewer.currentTime=0;viewer.play({repetitions:1});
  const start=performance.now();function check(){if(paused||document.hidden){viewer.pause();return;}if(performance.now()-start>(viewer.duration||4)*1000+100){idle();return;}animationFrame=requestAnimationFrame(check);}animationFrame=requestAnimationFrame(check);
 }
 function setExpanded(value,focusClose=false){expanded=value;bubble.hidden=!value;guide.classList.toggle('is-collapsed',!value);toggle.setAttribute('aria-expanded',String(value));toggle.textContent=value?say('안내 접기','Hide guide'):say('안내 열기','Guide');navButton.setAttribute('aria-expanded',String(value));if(focusClose&&docked&&mobile.matches)navButton.focus({preventScroll:true});}
 function setStop(index){current=index;const s=stops[index];heading.textContent=s.heading;message.textContent=s.message;next.textContent=s.label+' ↗';next.href=s.href;if(s.href.startsWith('http')){next.target='_blank';next.rel='noopener noreferrer';}else next.removeAttribute('target');guide.dataset.stop=s.id;}
 function update(){frame=0;const nextDock=home.getBoundingClientRect().bottom<105;if(nextDock!==docked){docked=nextDock;guide.classList.toggle('is-docked',docked);navButton.classList.toggle('is-visible',docked);if(docked)setExpanded(false);else if(firstGreeting)setExpanded(true);}let index=0;stops.forEach((s,i)=>{const el=document.getElementById(s.id);if(el&&el.getBoundingClientRect().top<=innerHeight*.34)index=i;});if(index!==current)setStop(index);}
 const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
 toggle.addEventListener('click',()=>{firstGreeting=false;setExpanded(!expanded);if(expanded)gesture('Point');});
 navButton.addEventListener('click',()=>{firstGreeting=false;setExpanded(!expanded);if(expanded){gesture('Point');next.focus({preventScroll:true});}});
 document.querySelector('#guide-close').addEventListener('click',()=>{firstGreeting=false;setExpanded(false,true);});
 document.querySelector('#guide-greet').addEventListener('click',()=>{firstGreeting=false;setExpanded(true);setStop(current);gesture();});
 next.addEventListener('click',()=>{firstGreeting=false;gesture('Point');if(next.hash&&next.origin===location.origin&&next.pathname===location.pathname&&mobile.matches)setExpanded(false);});
 function syncMotion(){motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-label',paused?say('움직임 재생','Resume motion'):say('움직임 멈추기','Pause motion'));if(paused||document.hidden){cancelAnimationFrame(animationFrame);viewer.pause();guide.classList.remove('is-idle');}else idle();}
 motion.addEventListener('click',()=>{paused=!paused;syncMotion();if(!paused)gesture();});reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();});document.addEventListener('visibilitychange',syncMotion);
 function fallback(){loaded=false;guide.classList.remove('is-ready');motion.disabled=true;document.querySelector('#guide-render-status').textContent=say('캐릭터 이미지로 안내 중','Guide available as a still image');}
 viewer.addEventListener('load',()=>{loaded=true;guide.classList.add('is-ready');motion.disabled=!viewer.availableAnimations.length;document.querySelector('#guide-render-status').textContent=say('3D 안내 캐릭터','3D guide');syncMotion();if(!paused)gesture();});viewer.addEventListener('error',fallback);
 import('./vendor/model-viewer.min.js').catch(fallback);
 window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded&&docked)setExpanded(false,true);});setStop(0);update();
})();
