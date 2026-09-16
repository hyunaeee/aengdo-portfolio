import {createInitialState,hydrateState,applyAction,refreshEnergy,refreshTravel,getEra,getLevel,ITEM_CHAINS} from './game.js';
import {ERAS,BUILDINGS} from './travel-content.js';
import {language,setLanguage,tx,itemName,resultMessage,esc} from './i18n.js';
import {icon,itemArt} from './art-v4.js';
import {homeView,boardView,selectionView,countdown,energyTime} from './views-v4.js';
import {panelView} from './panels-v4.js';
import {createProgressStore} from './progress-store.js';

const $=selector=>document.querySelector(selector);
const isNative=false;
let storage,progress;
try{storage=window.portfolioGameStorage;}catch{}
try{
 const preferences=undefined;
 progress=await createProgressStore({storage,preferences});
}catch(error){
 $('#app').innerHTML='<div style="padding:24px;text-align:center;color:white"><p>저장한 여행을 불러오지 못했어요.<br>Could not load your saved journey.</p><button style="margin-top:20px;padding:16px;background:#fff;border-radius:16px" id="retry-load">다시 시도 · Retry</button></div>';
 $('#retry-load').onclick=()=>location.reload();
 throw error;
}
let state,sound=true;
try{
 state=hydrateState(progress.raw);
}catch{state=createInitialState();}
try{sound=storage?.getItem('morning-merge-sound')!=='false';}catch{}
const ui={screen:'home',panel:null,selected:null,detail:null,collectionChain:'maedeup',character:0,building:'gate',eraView:ERAS.indexOf(getEra(state)),sound,purchase:null,scrollTo:true};
let returnFocus=null,toastTimer,scale=1,drag=null,mapDrag=null,ignoreMapClick=false,audioContext,memoryTimer;
setLanguage(language());
function persist(){progress.save(JSON.stringify(state)).catch(()=>toast(tx('여행을 저장하지 못했어요. 저장 공간을 확인해 주세요.','Could not save your journey. Please check your storage.')));}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
function fit(){const style=getComputedStyle($('#app')),width=(visualViewport?.width||innerWidth)-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=(visualViewport?.height||innerHeight)-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);scale=Math.min(width/450,height/980);document.documentElement.style.setProperty('--game-scale',scale);document.documentElement.style.setProperty('--stage-width',`${450*scale}px`);document.documentElement.style.setProperty('--stage-height',`${980*scale}px`);}
function identity(element){return element?.tagName==='BUTTON'?{...element.dataset}:null;}
function findButton(root,id){return id?[...root.querySelectorAll('button:not(:disabled)')].find(button=>Object.entries(id).every(([key,value])=>button.dataset[key]===value)):null;}
function render(){
 endMapDrag();
 const focus=identity(document.activeElement),wasInModal=Boolean(document.activeElement?.closest('.modal'));
 const oldPanel=$('.modal')?.dataset.panel,modalScroll=oldPanel===ui.panel?$('.modal-body')?.scrollTop||0:0;
 const oldMap=$('.map-viewport'),mapScroll=oldMap?{top:oldMap.scrollTop,left:oldMap.scrollLeft}:null,orderScroll=$('.order-track')?.scrollLeft||0;
 $('#app').innerHTML=ui.screen==='home'?homeView(state,ui):boardView(state,ui);
 if($('.order-track'))$('.order-track').scrollLeft=orderScroll;
 if($('.map-viewport')){
  const viewport=$('.map-viewport');
  if(ui.scrollTo||!mapScroll){const target=BUILDINGS[Math.min(11,Math.max(ui.eraView*3,Math.min(getLevel(state)-1,ui.eraView*3+2)))];viewport.scrollTop=Math.max(0,target.y*1800/1300+150-650);viewport.scrollLeft=(viewport.scrollWidth-viewport.clientWidth)/2;ui.scrollTo=false;}
  else {viewport.scrollTop=mapScroll.top;viewport.scrollLeft=mapScroll.left;}
 }
 renderPanel(modalScroll);
 $('#app').inert=Boolean(ui.panel);
 if(focus){const root=wasInModal?$('.modal'):$('#app');const target=root&&findButton(root,focus);if(target)target.focus({preventScroll:true});else if(wasInModal&&ui.panel)$('.modal-close')?.focus({preventScroll:true});}
}
function renderPanel(scroll=0){
 if(!ui.panel){$('#modal-root').innerHTML='';return;}
 const {title,body}=panelView(state,ui);
 $('#modal-root').innerHTML=`<div class="modal-backdrop" data-action="backdrop-close"><section class="modal travel-modal panel-${ui.panel}" data-panel="${ui.panel}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><h2 id="modal-title">${esc(title)}</h2><button class="modal-close" data-action="close" aria-label="${tx('닫기','Close')}">${icon('close')}</button></header><div class="modal-body">${body}</div></section></div>`;
 $('.modal-body').scrollTop=scroll;
}
function open(panel){const changed=ui.panel!==panel;if(!ui.panel)returnFocus=identity(document.activeElement);if(panel==='shop')ui.purchase=null;ui.panel=panel;render();if(changed)$('.modal-close')?.focus({preventScroll:true});if(panel==='memory'&&state.travel.memory.flipped.length===2){clearTimeout(memoryTimer);memoryTimer=setTimeout(()=>dispatch({type:'memoryHide'}),850);}}
function close(){ui.panel=null;ui.purchase=null;render();(findButton($('#app'),returnFocus)||$('.profile-frame'))?.focus({preventScroll:true});returnFocus=null;}
function navigate(screen,era){ui.screen=screen;ui.panel=null;ui.purchase=null;returnFocus=null;if(era!==undefined)ui.eraView=era;else if(screen==='home')ui.eraView=ERAS.indexOf(getEra(state));ui.scrollTo=true;render();}
function soundEffect(type){if(!ui.sound)return;try{audioContext||=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const notes=['fulfill','build','reward'].includes(type)?[523,659,784,1047]:type==='merge'?[587,880]:[700];notes.forEach((frequency,index)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),at=audioContext.currentTime+index*.065;oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.05,at+.01);gain.gain.exponentialRampToValueAtTime(.0001,at+.18);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(at);oscillator.stop(at+.2);});}catch{}}
function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const rect=$('.game-shell').getBoundingClientRect();for(let i=0;i<22;i++){const p=document.createElement('i');p.className='confetti';p.style.cssText=`left:${rect.x+Math.random()*rect.width}px;top:${rect.y+rect.height*.3}px;--dx:${-100+Math.random()*200}px;--delay:${Math.random()*.2}s;background:${['#ffda67','#6edccc','#fda3ca','#e6f5a0'][i%4]}`;document.body.append(p);setTimeout(()=>p.remove(),1600);}}
function dispatch(action){
 const previous=state,result=applyAction(state,action);
 if(!result.ok){toast(resultMessage(result));return false;}
 state=result.state;
 if(action.type==='move')ui.selected=action.to;
 else if(action.type==='generate')ui.selected=action.index??result.event?.index??null;
 else if(['store','sell','fulfill'].includes(action.type))ui.selected=null;
 const leveledUp=getLevel(state)>getLevel(previous);
 if(leveledUp)ui.eraView=ERAS.indexOf(getEra(state));
 persist();render();const event=result.event;
 if(event){
  soundEffect(event.type);
  if(['merge','generate','buyItem','retrieve'].includes(event.type))$(`[data-cell="${event.index}"]`)?.classList.add(event.type==='merge'?'just-merged':'just-created');
  if(event.type==='merge'&&event.newDiscovery)toast(`${tx('새로운 발견','New Discovery')} · ${itemName(event.item)}`);
  else if(event.type==='generate'&&ui.panel)toast(`${itemName(event.item)} · ${tx('보드에 놓았어요','Added to Your Board')}`);
  else if(event.type==='fulfill')toast(`${tx('주문 완료','Order Complete')} · +${event.coins} · +${event.xp} XP`);
  else if(!['move','swap','merge','generate','memoryStart','memoryHide','memoryFlip','rollYut'].includes(event.type))toast(resultMessage(result));
  if(['fulfill','build','claimDaily','claimAlbum','claimPass'].includes(event.type)||event.rewarded||event.type==='rollYut'&&event.completed)celebrate();
  if(event.type==='memoryFlip'&&state.travel.memory.flipped.length===2){clearTimeout(memoryTimer);memoryTimer=setTimeout(()=>{if(state.travel.memory.flipped.length===2)dispatch({type:'memoryHide'});},850);}
 }
 if(leveledUp){toast(`Lv.${getLevel(state)} · ${tx('새로운 여행지가 열렸어요!','A New Destination Awaits!')}`);celebrate();}
 return true;
}
function updateSelection(){document.querySelectorAll('[data-cell]').forEach(cell=>{const selected=Number(cell.dataset.cell)===ui.selected;cell.classList.toggle('selected',selected);cell.setAttribute('aria-pressed',String(selected));});if($('#selection-info'))$('#selection-info').innerHTML=selectionView(state,ui);}
function tap(index){const item=state.board[index];if(item?.generator){ui.selected=index;dispatch({type:'generate',index});return;}if(ui.selected===index){ui.selected=null;updateSelection();return;}const source=state.board[ui.selected];if(source&&!source.generator&&(!item||source.chain===item.chain&&source.level===item.level))dispatch({type:'move',from:ui.selected,to:index});else{ui.selected=item?index:null;updateSelection();}}
function detail(data){ui.detail={chain:data.chain,level:Number(data.level)||0,...(data.generator==='true'?{generator:true}:{})};open('detail');}

// Leave taps and native touch scrolling intact; only a mouse drag pans the map.
function endMapDrag(){
 if(!mapDrag)return;
 const {viewport,pointerId,moved}=mapDrag;
 mapDrag=null;
 if(moved)ignoreMapClick=true;
 viewport.classList.remove('is-panning');
 if(viewport.hasPointerCapture(pointerId))viewport.releasePointerCapture(pointerId);
}
document.addEventListener('pointerdown',event=>{
 ignoreMapClick=false;
 const viewport=event.target.closest('.map-viewport');
 if(!viewport||event.pointerType!=='mouse'||event.button!==0||mapDrag||ui.panel)return;
 mapDrag={viewport,pointerId:event.pointerId,x:event.clientX,y:event.clientY,top:viewport.scrollTop,left:viewport.scrollLeft,scale:viewport.getBoundingClientRect().width/viewport.clientWidth,moved:false};
});
document.addEventListener('pointermove',event=>{
 if(!mapDrag||event.pointerId!==mapDrag.pointerId)return;
 if(!(event.buttons&1)){endMapDrag();return;}
 const gesture=mapDrag;
 if(!gesture.moved){
  if(Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<5)return;
  gesture.moved=true;
  gesture.viewport.setPointerCapture(event.pointerId);
  gesture.viewport.classList.add('is-panning');
 }
 event.preventDefault();
 gesture.viewport.scrollTop=gesture.top-(event.clientY-gesture.y)/gesture.scale;
 gesture.viewport.scrollLeft=gesture.left-(event.clientX-gesture.x)/gesture.scale;
});
document.addEventListener('pointerup',event=>{if(event.pointerId===mapDrag?.pointerId)endMapDrag();});
document.addEventListener('pointercancel',event=>{if(event.pointerId===mapDrag?.pointerId)endMapDrag();});
document.addEventListener('lostpointercapture',event=>{if(event.pointerId===mapDrag?.pointerId)endMapDrag();});
window.addEventListener('blur',endMapDrag);
document.addEventListener('click',event=>{
 if(ignoreMapClick&&event.detail>0){ignoreMapClick=false;event.preventDefault();event.stopImmediatePropagation();}
},true);

document.addEventListener('click',event=>{
 const cell=event.target.closest('[data-cell]');if(cell&&event.detail===0){tap(Number(cell.dataset.cell));return;}
 const button=event.target.closest('[data-action]');if(!button||button.disabled)return;const d=button.dataset,a=d.action;
 if(a==='backdrop-close'&&event.target!==button)return;
 if(a==='close'||a==='backdrop-close'){close();return;}
 if(a==='home'||a==='board'){navigate(a);return;}
 if(a==='language'){setLanguage(language()==='ko'?'en':'ko');render();return;}
 if(a==='sound'){ui.sound=!ui.sound;try{window.portfolioGameStorage.setItem('morning-merge-sound',String(ui.sound));}catch{}render();return;}
 if(a==='visit-era'){navigate('home',Number(d.index));return;}
 if(a==='building'){ui.building=d.building;open('building');return;}
 if(a==='character'){ui.character=Number(d.index);open('characters');return;}
 if(a==='favorite'||a==='collection-tab'){ui.collectionChain=d.chain;open('collection');return;}
 if(a==='detail'||a==='detail-step'){detail(d);return;}
 if(a==='selected-detail'){const item=state.board[ui.selected];if(item){ui.detail={...item};open('detail');}return;}
 if(a==='source'){const index=state.board.findIndex(item=>item?.generator&&item.chain===d.chain);if(index>=0){ui.selected=index;navigate('board');}else open('workshop');return;}
 if(a==='welcome'||a==='offer'){open('shop');ui.purchase={type:'offer',id:d.offer||'welcome'};render();return;}
 if(a==='confirm-pass'){open('shop');ui.purchase={type:'pass'};render();return;}
 if(a==='confirm-item'){open('shop');ui.purchase={type:'item',chain:d.chain,level:Number(d.level)};render();return;}
 if(a==='purchase'){
  const p=ui.purchase;if(!p)return;const action=p.type==='offer'?{type:'buyOffer',offerId:p.id}:p.type==='pass'?{type:'buyPass'}:{type:'buyItem',chain:p.chain,level:p.level};
  if(dispatch(action)){ui.purchase=null;if(p.type==='pass')ui.panel='pass';if(p.type==='item'){ui.screen='board';ui.panel=null;}render();}return;
 }
 if(['collection','inventory','quests','energy','shop','help','settings','characters','workshop','eras','daily','memory','yut','album','pass'].includes(a)){open(a);return;}
 if(a==='craft')dispatch({type:'generate',chain:d.chain});
 else if(a==='generate')dispatch({type:'generate',index:Number(d.index)});
 else if(a==='fulfill')dispatch({type:a,orderId:d.order});
 else if(a==='store'||a==='sell'){if(ui.selected!==null&&dispatch({type:a,index:ui.selected})&&a==='sell')close();}
 else if(a==='retrieve')dispatch({type:a,inventoryIndex:Number(d.index)});
 else if(a==='claimQuest')dispatch({type:a,questId:d.quest});
 else if(a==='build')dispatch({type:a,buildingId:d.building});
 else if(a==='claimAlbum')dispatch({type:a,chain:d.chain});
 else if(a==='claimPass')dispatch({type:a,tier:Number(d.tier),premium:d.premium==='true'});
 else if(a==='memoryFlip')dispatch({type:a,index:Number(d.index)});
 else if(['refill','gemRefill','claimDaily','memoryStart','rollYut'].includes(a))dispatch({type:a});
});
document.addEventListener('pointerdown',event=>{const cell=event.target.closest('[data-cell]');if(!cell||event.button!==0||drag||ui.panel)return;drag={index:Number(cell.dataset.cell),x:event.clientX,y:event.clientY,pointerId:event.pointerId,moved:false};cell.setPointerCapture?.(event.pointerId);event.preventDefault();});
document.addEventListener('pointermove',event=>{
 if(!drag||drag.pointerId!==event.pointerId)return;
 if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7&&state.board[drag.index]){drag.moved=true;$('#drag-ghost').innerHTML=itemArt(state.board[drag.index]);$('#drag-ghost').classList.add('visible');$(`[data-cell="${drag.index}"]`)?.classList.add('drag-origin');}
 if(drag.moved){const size=Math.max(54,76*scale);$('#drag-ghost').style.width=`${size}px`;$('#drag-ghost').style.height=`${size}px`;$('#drag-ghost').style.transform=`translate(${event.clientX-size/2}px,${event.clientY-size*.6}px)`;document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cell]');if(cell&&Number(cell.dataset.cell)!==drag.index)cell.classList.add('drop-target');}
});
function clearDrag(){drag=null;$('#drag-ghost').classList.remove('visible');document.querySelectorAll('.drag-origin,.drop-target').forEach(el=>el.classList.remove('drag-origin','drop-target'));}
document.addEventListener('pointerup',event=>{if(!drag||drag.pointerId!==event.pointerId)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cell]'),{index,moved}=drag;clearDrag();if(moved){if(cell&&Number(cell.dataset.cell)!==index)dispatch({type:'move',from:index,to:Number(cell.dataset.cell)});}else if(cell&&Number(cell.dataset.cell)===index)tap(index);});
document.addEventListener('pointercancel',clearDrag);window.addEventListener('blur',clearDrag);
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(ui.panel)close();else if(ui.screen==='board'){ui.selected=null;updateSelection();}}if(ui.panel&&event.key==='Tab'){const buttons=[...document.querySelectorAll('.modal button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
setInterval(()=>{
 const next=refreshTravel(refreshEnergy(state)),changed=next.energy!==state.energy||next.travel.day!==state.travel.day||next.travel.pass.week!==state.travel.pass.week;state=next;
 if(changed){persist();render();}
 if($('#energy-timer'))$('#energy-timer').textContent=state.energy===100?'MAX':energyTime(state);
 document.querySelectorAll('[data-countdown]').forEach(element=>element.textContent=countdown(element.dataset.countdown));
},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){state=refreshTravel(refreshEnergy(state));persist();render();}});
window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);fit();render();persist();

const requestedLanguage=new URLSearchParams(location.search).get('lang');
if(requestedLanguage==='ko'||requestedLanguage==='en'){setLanguage(requestedLanguage);render();}
ui.sound=false;
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='fall-in-korea-command')return;
 if(['home','board'].includes(event.data.action))navigate(event.data.action);
 if(event.data.action==='language'&&['ko','en'].includes(event.data.value)){setLanguage(event.data.value);render();}
});
parent.postMessage({type:'fall-in-korea-ready'},location.origin);
