/* Recorded model-server evidence only. No inference or telemetry requests. */
(async()=>{
 const en=document.documentElement.lang==='en';
 const t=(ko,eng)=>en?eng:ko;
 document.querySelector('[data-print]').addEventListener('click',()=>window.print());
 try{
  const response=await fetch('operations-evidence/viewer.json');
  if(!response.ok)throw new Error('Evidence unavailable');
  const data=await response.json();
  const byLabel=Object.fromEntries(data.requests.map(r=>[r.label,r]));
  const normal=data.requests.filter(r=>r.label.startsWith('inference_'));
  const fixtures=data.summary.fixtures;
  const ns='http://www.w3.org/2000/svg';
  function selectRequest(row){
   const value=row.response;
   const frame=fixtures.findIndex(f=>f.sha256===value.image_sha256);
   document.querySelectorAll('[data-frame]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.frame)===frame)));
   document.querySelectorAll('.ops-bar').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.label===row.label)));
   document.getElementById('request-meta').textContent=`${row.label} · HTTP ${row.status} · ${row.elapsed_ms.toFixed(1)} ms · ${value.detections.length} ${t('검출','detections')}`;
   document.getElementById('request-json').textContent=JSON.stringify(value,null,2);
   const svg=document.getElementById('detection-scene');
   svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${value.width} ${value.height}`);
   const image=document.createElementNS(ns,'image');
   image.setAttribute('href','operations-evidence/'+fixtures[frame].file);
   image.setAttribute('width',value.width);image.setAttribute('height',value.height);svg.append(image);
   value.detections.forEach(d=>{const r=document.createElementNS(ns,'rect');
    Object.entries({x:d.xyxy[0],y:d.xyxy[1],width:d.xyxy[2]-d.xyxy[0],height:d.xyxy[3]-d.xyxy[1],fill:'#41d6a0','fill-opacity':'.12',stroke:'#1beeaa','stroke-width':'3'}).forEach(([k,v])=>r.setAttribute(k,v));svg.append(r);});
  }
  document.querySelectorAll('[data-frame]').forEach(b=>b.addEventListener('click',()=>selectRequest(normal[Number(b.dataset.frame)])));
  const chart=document.getElementById('latency-chart');
  const max=Math.max(...normal.map(r=>r.elapsed_ms));
  normal.forEach((row,i)=>{const b=document.createElement('button');b.className='ops-bar';b.dataset.label=row.label;b.style.height=(row.elapsed_ms/max*100)+'%';b.setAttribute('aria-label',`${t('요청','Request')} ${i+1}: ${row.elapsed_ms.toFixed(1)} ms`);b.setAttribute('aria-pressed','false');b.title=b.getAttribute('aria-label');b.addEventListener('click',()=>selectRequest(row));chart.append(b);});
  function scenario(kind){
   document.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scenario===kind)));
   const end=byLabel[kind==='crash'?'after_crash_inference':'after_deadline_inference'];
   const phase=data.summary.phases.find(p=>p.name===(kind==='crash'?'after_crash':'after_deadline'));
   const steps=kind==='crash'?[
    ['503',t('추론 프로세스 실제 종료','Actual inference-process exit'),t('HTTP 서버는 계속 응답','HTTP server stays live')],
    ['503',t('새 프로세스에서 모델 로드','Model load in a new process'),`${t('세대','Generation')} ${phase.generation}`],
    ['200',t('준비 상태 복구','Readiness recovered'),`${(phase.wait_ms/1000).toFixed(2)} s ${t('준비 대기','readiness wait')}`],
    ['200',t('실제 검출 응답 확인','Actual detections returned'),`${(phase.fault_request_to_success_ms/1000).toFixed(2)} s ${t('종료 요청부터 추론 성공까지','fault request to successful inference')}`]
   ]:[
    ['429',t('처리 중 추가 요청 거부','Additional request rejected'),t('worker에 의도적으로 60초 대기 주입','Injected 60-second stall in worker')],
    ['504',t('2초 deadline 이후 기존 worker 정리','Old worker disposed after 2-second deadline'),`${(byLabel.deadline.elapsed_ms/1000).toFixed(2)} s ${t('오류 응답까지','to error response')}`],
    ['503',t('재로딩 중 새 추론 거부','New inference rejected during reload'),`${t('새 프로세스 · 새 연결 · 세대','New process · new pipe · generation')} ${phase.generation}`],
    ['200',t('새 이미지로 추론 성공','New image inferred successfully'),`${(phase.wait_ms/1000).toFixed(2)} s ${t('준비 대기','readiness wait')}`]
   ];
   const panel=document.getElementById('recovery-events');panel.replaceChildren();
   steps.forEach(([status,label,note])=>{const row=document.createElement('div');row.className='ops-event';const code=document.createElement('b');code.textContent=status;if(status!=='200')code.className='error';const text=document.createElement('span');text.textContent=label;const small=document.createElement('small');small.textContent=note;text.append(small);row.append(code,text);panel.append(row);});
   document.getElementById('recovery-json').textContent=JSON.stringify(end.response,null,2);
  }
  document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>scenario(b.dataset.scenario)));
  selectRequest(normal[0]);scenario('deadline');
 }catch(error){document.getElementById('request-meta').textContent=t('기록을 불러오지 못했습니다. 상단의 원본 파일 링크를 확인해주세요.','Could not load interactive evidence. Use the raw-file links above.');}
})();
