/* Explore recorded evidence; never submits requests to a model or live service. */
(() => {
 'use strict';
 const holder=document.querySelector('#lab-evidence');
 if(!holder)return;
 const data=JSON.parse(holder.textContent),en=document.documentElement.lang==='en';
 const T=(ko,english)=>en?english:ko;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const reasons={unknown_citation:T('존재하지 않는 인용','Unknown citation'),missing_citation:T('인용 누락','Missing citation'),overrefusal:T('과잉 거부','Over-refusal'),missing_expected_fact:T('기대 사실 누락','Missing expected fact'),fabricated_quote:T('위조 직접 인용','Fabricated quote'),missing_abstention:T('필요한 거부 누락','Missing abstention')};
 document.querySelectorAll('[data-lab-module]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-lab-module]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelectorAll('.lab-module-panel').forEach(p=>p.hidden=p.id!=='module-'+button.dataset.labModule);
 }));
 let candidate='good',selectedCase=0;
 function renderGate(){
  const gate=data.quality[candidate],bad=gate.status!=='pass';
  document.querySelector('#gate-status').innerHTML=`<span class="lab-pill ${bad?'is-fault':''}">${bad?'BLOCKED':'PASS'}</span><strong>${gate.case_count-gate.failed_cases}<span> / ${gate.case_count}</span></strong><p>${T('계약을 통과한 고정 답변','Fixed replies passing the contract')}</p>`;
  document.querySelectorAll('[data-case]').forEach((b,i)=>{const passed=gate.results[i].pass;b.classList.toggle('is-fault',!passed);b.setAttribute('aria-pressed',String(i===selectedCase));b.setAttribute('aria-label',data.quality.cases[i].id+' · '+(passed?T('통과','pass'):T('실패','failed')));b.querySelector('b').textContent=passed?'✓':'×';});
  const c=data.quality.cases[selectedCase],r=gate.results[selectedCase];
  document.querySelector('#case-detail').innerHTML=`<div class="lab-case-heading"><code>${esc(c.id)}</code><span class="lab-pill ${r.pass?'':'is-fault'}">${r.pass?'PASS':'FAIL'}</span></div><h3>${esc(c.question)}</h3><span class="lab-kicker">${T('검사할 답변','RESPONSE UNDER TEST')}</span><blockquote>${esc(candidate==='good'?c.reference:c.candidate)}</blockquote>${r.reasons.length?`<div class="lab-reasons">${r.reasons.map(reason=>`<span>${esc(reasons[reason]||reason)}</span>`).join('')}</div>`:''}<details><summary>${T('원본 근거 보기','View source context')}</summary><p>${esc(c.context.map(s=>s.source_id+': '+s.text).join('\n'))||T('제공된 근거 없음','No context provided')}</p></details>${en?'<p class="lab-footnote">Synthetic source questions and responses are preserved in their original Korean.</p>':''}`;
  document.querySelector('#release-quality').textContent=bad?'BLOCKED':'PASS';
  document.querySelector('#release-result').textContent=bad?T('생성 차단','Creation blocked'):T('준비됨 · 미배포','Prepared · not deployed');
 }
 document.querySelectorAll('[data-candidate]').forEach(button=>button.addEventListener('click',()=>{candidate=button.dataset.candidate;document.querySelectorAll('[data-candidate]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderGate();}));
 document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>{selectedCase=Number(button.dataset.case);renderGate();}));
 const descriptions={
  normal:T('정상 SSE 응답을 받고, 종료 표식과 manifest 식별자를 확인했습니다.','Received a complete SSE response and verified its end marker and manifest identity.'),
  capacity:T('4개 진행 중 요청이 슬롯을 모두 사용한 상태에서 보낸 다섯 번째 요청은 429로 거절됐습니다. 기존 요청을 끝낸 뒤 슬롯이 반환됐습니다.','With four requests occupying all slots, the fifth was rejected with 429. The slots were returned when the held requests completed.'),
  'not-ready':T('상류 health가 실패하면 gateway의 /ready도 503을 반환합니다. 프로세스가 살아 있는 것과 요청을 받을 준비가 된 상태를 구분했습니다.','When upstream health failed, gateway /ready returned 503. Liveness and readiness are checked separately.'),
  'upstream-error':T('합성 upstream에 503을 주입했습니다. gateway는 성공으로 처리하지 않고 오류를 client에 전달하고 카운터에 기록했습니다.','A 503 was injected into the scripted upstream. The gateway forwarded the error and counted it instead of reporting success.'),
  truncated:T('HTTP는 200이어도 SSE가 [DONE] 없이 끝나면 client가 missing_done으로 실패를 기록합니다. HTTP 상태만으로 완료를 판단하지 않습니다.','Even with HTTP 200, an SSE response ending without [DONE] fails with missing_done. An HTTP status alone does not establish completion.'),
  deadline:T('상류가 응답 헤더를 보내지 않도록 고정했습니다. gateway의 1초 deadline에서 504를 반환하고 연결과 슬롯을 정리했습니다.','The scripted upstream withheld response headers. The gateway returned 504 at its one-second deadline and cleaned up the connection and slot.'),
  recovered:T('주입한 장애를 해제한 뒤 readiness 200과 정상 SSE 응답을 확인했습니다. 프로세스를 교체한 배포 롤백이나 복구 시간 벤치마크는 아닙니다.','After removing the injected fault, readiness and streaming responses returned to 200. This is fault-removal recovery, not a deployment rollback or recovery-time benchmark.')
 };
 document.querySelectorAll('[data-trace]').forEach(button=>button.addEventListener('click',()=>{
  const event=data.events.find(e=>e.id===button.dataset.trace);
  document.querySelectorAll('[data-trace]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('#trace-detail h3').textContent=button.querySelector('strong').textContent;
  document.querySelector('#trace-description').textContent=descriptions[event.id];
  document.querySelector('#trace-json').textContent=JSON.stringify(event,null,2);
 }));
 document.querySelector('[data-copy-command]').addEventListener('click',async e=>{
  const button=e.currentTarget;
  try{await navigator.clipboard.writeText(document.querySelector('#reproduce-command').textContent);button.textContent=T('복사됨','Copied');}
  catch{button.textContent=T('명령을 선택해 복사','Select text to copy');}
 });
 renderGate();
})();
