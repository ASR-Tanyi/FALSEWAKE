import {t,tr,ta,escapeHTML as esc,formatNumber,languagePicker,initLanguageUI} from './i18n.js';
import {NIGHTFALL_CASES,nightfallCase} from './nightfall-cases.js';
import {loadNightfall} from './nightfall-engine.js';
import {NIGHTFALL_ROLES as ROLES,eventText,eventLabel,isReport,name} from './data.js';
import {seatList} from './characters.js';
import {icon,villageArt} from './art.js';
import {emblem,sigil} from './symbols.js';
const $=s=>document.querySelector(s), bit=i=>1<<i, disabled=b=>b?' disabled':'';
const pop=m=>{let n=0;for(;m;m&=m-1)++n;return n;};
let currentCase=NIGHTFALL_CASES[0];
let engine,state,selected=11,target=2,tab='circle',tags=Array(12).fill(0),notes=Array(12).fill(''),pins=[],filter=-1;
let analysis=null,hints=0,toastTimer,returnFocus,storageWarning=false;
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),6000);}
function payload(){return {...engine.export(),selected,target,tags:[...tags],notes:[...notes],pins:[...pins],progress:{status:state.status,commands:engine.history.length}};}
function save(){try{localStorage.setItem(currentCase.store,JSON.stringify(payload()));}catch{if(!storageWarning){storageWarning=true;toast(t('Storage is unavailable. Export your replay to keep this investigation.'));}}}
function annotate(data){
 selected=Number.isInteger(data.selected)&&data.selected>=0&&data.selected<12?data.selected:11;
 target=Number.isInteger(data.target)&&data.target>=0&&data.target<12?data.target:2;
 tags=Array.from({length:12},(_,i)=>[0,1,2].includes(data.tags?.[i])?data.tags[i]:0);
 notes=Array.from({length:12},(_,i)=>typeof data.notes?.[i]==='string'?data.notes[i].slice(0,1000):'');
 pins=Array.isArray(data.pins)?[...new Set(data.pins.filter(i=>Number.isInteger(i)&&i>=0&&i<state.events.length))]:[];
 analysis=null;hints=0;filter=-1;tab='circle';
}
// Save slots are case-local; selection and import never reset another case.
function requestedCase(){
 const id=new URLSearchParams(location.hash.slice(1)).get('case');
 return nightfallCase(id)?.id||'warded-lantern';
}
function updateURL(){const url=new URL(location.href);url.hash='case='+currentCase.id;history.replaceState(null,'',url);document.title='FALSEWAKE - '+t(currentCase.title);}
function restoreCase(id){
 currentCase=nightfallCase(id)||NIGHTFALL_CASES[0];state=engine.reset(currentCase.id);annotate({});
 try{
  const raw=localStorage.getItem(currentCase.store);
  if(raw){if(raw.length>40000)throw Error('Oversized save');const data=JSON.parse(raw);
   if(data.caseId!==currentCase.id)throw Error('Wrong case slot');state=engine.replay(data);annotate(data);}
 }catch{state=engine.reset(currentCase.id);annotate({});toast(t('A damaged save was skipped. A fresh night watch is ready.'));}
 updateURL();
}
function switchCase(id){if(!nightfallCase(id)||id===currentCase.id)return;save();close();restoreCase(id);render();$('#nf-title')?.focus({preventScroll:true});}
window.addEventListener('hashchange',()=>{if(engine)switchCase(requestedCase());});
function savedProgress(c){
 if(c.id===currentCase.id)return state.status===1?'Solved':state.status===2?'Try again':engine.history.length?'In progress':'Ready';
 try{const data=JSON.parse(localStorage.getItem(c.store)||'null');
  if(data?.caseId===c.id&&Array.isArray(data.commands))return data.progress?.status===1?'Solved':data.progress?.status===2?'Try again':data.commands.length?'In progress':'Ready';
 }catch{}return 'Ready';
}
function caseLibrary(){return `<nav class="nf-library" aria-label="${ta('Choose a Nightfall investigation')}">${NIGHTFALL_CASES.map(c=>`<button class="nf-case-card ${currentCase.id===c.id?'active':''}" data-action="choose-case" data-case="${c.id}" aria-current="${currentCase.id===c.id?'page':'false'}"><span class="nf-case-symbol">${sigil(c.symbol)}</span><span class="nf-case-copy"><small>${tr('CHAPTER {number}',{number:String(c.number).padStart(2,'0')})}</small><strong>${tr(c.title)}</strong><span class="nf-case-status">${tr(savedProgress(c))}</span></span></button>`).join('')}</nav>`;}
function text(e){
 if(e.kind===22)return t('The bell has marked #12. This is a public starting condition.');
 if(e.kind===21)return t(e.value?'Verdict accepted: {seats}.':'Verdict rejected: {seats}. No individual identity was revealed.',{seats:seatList(e.subjects)});
 if(e.kind===15)return t(e.value===1?'Everyone survived. The enemy trio is exposed.':'The watch has failed. Review the timeline and try again.');
 return eventText(e);
}
function label(e){return e.kind===22?t('Public charter'):e.kind===21?t('Verdict'):eventLabel(e);}
function suspicion(){return tags.reduce((m,v,i)=>v===2?m|bit(i):m,0);}
function actor(){return state.people[selected];}
function role(p){return ROLES[p.role||p.claim];}
function header(){return `<header class="topbar"><a class="brand" href="./casebook.html" aria-label="${ta('FALSEWAKE casebook')}">${icon('eye')}<span>FALSEWAKE<small>${tr('A VILLAGE OF BROKEN TRUTHS')}</small></span></a><div class="case-label"><span class="tiny-diamond"></span> ${tr('NIGHTFALL')} <span class="case-no">V0.6</span></div><div class="top-actions">${languagePicker()}<button class="icon-button" data-action="rules" aria-label="${ta('Case rules')}">${icon('help')}</button><button class="icon-button" data-action="replay" aria-label="${ta('Replay inspector')}">${icon('book')}</button></div></header>`;}
function charter(){return `<details class="nf-charter"><summary>${icon('book')} ${tr('Read the public charter')}</summary><p>${tr('Keep every villager alive through two nights, then identify the three enemies among #03, #04, #07 and #10.')}</p><p>${tr(currentCase.roster)}</p><p>${tr('The bell has already marked #12. Wards last one night. A survivor of the Whisperer\'s attack is Tainted until cleansed or the next night.')}</p><p>${tr('The Whisperer attacks the lowest-numbered marked Good villager, or #08 if there is none. Extra marks can redirect the danger.')}</p><p>${tr('Four actions per day; each helper acts at most once. No executions. Any death fails the watch. On Day 3, a wrong trio costs one Resolve.')}</p></details>`;}
function board(){return `<section class="board-panel"><div class="panel-heading"><h2>${icon('circle')} ${tr('THE NIGHT WATCH')}</h2><span class="quiet">${tr('4 SUSPECTS / 8 CERTIFIED')}</span></div><div class="village-board"><div class="orbit orbit-outer"></div><div class="orbit orbit-inner"></div><div class="village-center">${villageArt()}<div class="village-caption"><span class="eyebrow">${tr(currentCase.caption)}</span><h2>${tr('Day {day}',{day:state.day})}</h2><p>${tr('{count} nights remaining',{count:state.nightsLeft})}</p></div></div>${state.people.map(p=>{
 const a=p.id*Math.PI/6,known=!(state.suspects&bit(p.id));
 return `<button id="nf-seat-${p.id}" class="villager ${selected===p.id?'selected':''} ${tags[p.id]===2?'evil-hypothesis':tags[p.id]===1?'good-hypothesis':''} ${!p.alive?'nf-dead':''}" style="--x:${50+37*Math.sin(a)}%;--y:${50-37*Math.cos(a)}%" data-action="select" data-id="${p.id}" aria-pressed="${selected===p.id}" aria-label="${ta('{seat}, {role}, {kind}',{seat:name(p.id),role:t(role(p).name),kind:t(known?'Certified identity':'Suspect')})}"><span class="portrait-wrap">${emblem(role(p).icon)}<span class="seat-number">${String(p.id+1).padStart(2,'0')}</span>${p.marked?`<span class="nf-token mark" title="${ta('Mark')}">${icon('feather')}</span>`:''}${p.ward?`<span class="nf-token ward" title="${ta('Protection')}">${icon('shield')}</span>`:''}</span><span class="villager-name">${name(p.id)}</span><span class="villager-role">${t(role(p).name)}</span></button>`;
 }).join('')}</div><div class="board-footer"><span>${tr('Symbols show claims, not hidden identities.')}</span><span>${tr('The marked lantern draws the night.')}</span></div></section>`;}
function inspector(){
 const p=actor(),r=role(p),certified=!(state.suspects&bit(selected)),last=state.events.filter(e=>e.source===selected&&isReport(e)).at(-1);
 const choices=state.people.filter(q=>q.alive&&q.id!==selected);
 if(target===selected||!state.people[target]?.alive)target=choices[0]?.id??selected;
 return `<aside class="inspector case-inspector nf-inspector" aria-label="${ta('Selected witness')}"><button class="mobile-return" data-action="circle">${icon('arrow')} ${tr('Back to the circle')}</button><div class="inspector-top"><span class="eyebrow">${name(selected)}</span><span class="nf-badge ${certified?'certified':''}">${t(state.status?'REVEALED IDENTITY':certified?'Certified identity':'Unverified claim')}</span></div><div class="character-hero"><div class="portrait-halo">${emblem(r.icon,true)}</div><h2>${name(selected)}</h2><p>${t(certified?'Identity is certified. Health is not.':'One of the four hidden roles.')}</p></div><div class="role-plaque">${sigil(r.icon)}<div><span>${t(state.status?'REVEALED IDENTITY':'CLAIMED IDENTITY')}</span><h3>${t(r.name)}</h3></div></div><p class="ability-description">${t(r.text)}</p>
 ${last?`<section class="testimony"><h3 class="eyebrow">${tr('Day {day}',{day:last.day})} / ${tr('Report #{number}',{number:last.id+1})}</h3><blockquote>${esc(text(last))}</blockquote><span class="testimony-foot">${tr('Recorded then. Not a live reading.')}</span></section>`:''}
 ${!state.status&&certified&&!r.passive?`${r.target?`<div class="nf-target"><label for="nf-target">${tr('Target')}</label><select id="nf-target">${choices.map(q=>`<option value="${q.id}"${q.id===target?' selected':''}>${name(q.id)} / ${t(role(q).name)}</option>`).join('')}</select></div>`:''}<button class="button primary" id="nf-use" data-action="use"${disabled(!p.alive||p.used||!state.actions)}>${icon(r.icon)} ${t(r.active)} <span>${tr('1 action')}</span></button>`:`<p class="nf-explanation">${tr(state.status?'The case is closed. Read the timeline to see how each observation arose.':certified?'This ability is passive.':'Only certified helpers may act in this investigation.')}</p>`}
 <p class="hint">${t(r.hint)}</p>
 <div class="hypothesis"><span class="eyebrow">${tr('YOUR WORKING THEORY')}</span><div class="segmented" role="group" aria-label="${ta('Personal allegiance hypothesis')}">${['Unsure','Good','Evil'].map((v,i)=>`<button data-action="tag" data-id="${i}" aria-pressed="${tags[selected]===i}" class="${tags[selected]===i?'chosen':''}"${disabled(state.status||certified)}>${t(v)}</button>`).join('')}</div><span class="hint">${tr('Your notes, not a verified identity.')}</span></div><div class="notes"><label for="nf-notes">${tr('FIELD NOTES')}</label><textarea id="nf-notes" rows="3" maxlength="1000" placeholder="${ta('What would have to be true?')}">${esc(notes[selected])}</textarea></div>
 ${state.status?`<div class="debrief-note"><strong>${t(p.team?'Evil':'Good')} / ${t(r.name)}</strong><p>${t(r.hint)}</p></div>`:''}</aside>`;
}
function timeline(){const events=state.events.filter(e=>filter<0||e.subjects&bit(filter)||e.target===filter||e.source===filter);
 return `<section class="nf-timeline"><div class="panel-heading"><h2>${icon('book')} ${tr('The changing record')}</h2><span class="quiet">${tr('Original targets. Original time.')}</span></div><label class="nf-filter" for="nf-filter">${tr('Compare one villager')}<select id="nf-filter"><option value="-1">${tr('Everyone')}</option>${state.people.map(p=>`<option value="${p.id}"${filter===p.id?' selected':''}>${name(p.id)}</option>`).join('')}</select></label><p class="nf-order">${tr(currentCase.order)}</p><div class="nf-events">${events.map(e=>`<article class="evidence-card ${pins.includes(e.id)?'nf-pinned':''}" data-event="${e.id}"><div class="evidence-meta"><span class="event-index">${String(e.id+1).padStart(2,'0')}</span><span>${tr('Day {day}',{day:e.day})}</span><span class="event-label">${label(e)}</span><button class="pin-button ${pins.includes(e.id)?'pinned':''}" data-action="pin" data-id="${e.id}" aria-label="${ta(pins.includes(e.id)?'Unpin report':'Pin report')}" aria-pressed="${pins.includes(e.id)}">${icon('pin')}</button></div><p>${esc(text(e))}</p><footer><span>${e.source>=0?name(e.source):t('The village')}</span><span>${state.status&&e.truth>=0?t(e.truth?'Correct observation then':'Impaired reading then'):e.subjects?seatList(e.subjects):''}</span></footer></article>`).join('')||`<p>${tr('No matching observations yet.')}</p>`}</div></section>`;}
function assistant(){return `<section class="case-assistant"><div class="panel-heading"><h2>${icon('eye')} ${tr('Optional deduction assistant')}</h2></div><p>${tr('Replay all 24 permitted worlds against your public observations. Personal labels and secret identities are not evidence.')}</p><button class="button secondary" data-action="analyze">${tr('Analyze the timeline')}</button><button class="text-button" data-action="hint"${disabled(hints>=3)}>${tr('Reasoning hint')} ${hints}/3</button>${hints?`<div class="reasoning-hints">${currentCase.hints.slice(0,hints).map(h=>`<p>${t(h)}</p>`).join('')}</div>`:''}${analysis?`<div class="analysis-summary"><strong>${formatNumber(analysis.worlds)}</strong><span>${tr('compatible histories')}<small>${tr('{count} possible enemy trios',{count:analysis.teams})}</small></span></div><div class="forced-facts"><p data-forced="evil">${tr('Forced Evil: {seats}',{seats:analysis.evil?seatList(analysis.evil):t('Not yet determined')})}</p><p>${tr('Forced Drunk: {seats}',{seats:analysis.drunk?seatList(analysis.drunk):t('Not yet determined')})}</p><p>${tr('Forced Smokescreen: {seats}',{seats:analysis.smoke?seatList(analysis.smoke):t('Not yet determined')})}</p><small>${tr(currentCase.number===1?'Rotmonger and Whisperer may remain interchangeable. The objective is the enemy trio, not every subtype.':'Wardbreaker and Whisperer may remain interchangeable. The objective is the enemy trio, not every subtype.')}</small></div>`:''}</section>`;}
function controls(){const mask=suspicion();return `<section class="nf-controls"><div class="nf-progress">${[1,2,3].map(d=>`<span class="${state.day===d?'current':state.day>d?'complete':''}"><b>${String(d).padStart(2,'0')}</b>${tr(d===3?'Verdict':'Day {day}',{day:d})}</span>`).join('')}</div><div class="nf-metrics"><span>${tr('Investigations')} <strong id="nf-actions">${state.actions}/4</strong></span><span>${tr('Resolve')} <strong>${state.resolve}/3</strong></span><span>${tr('Alive')} <strong>${state.people.filter(p=>p.alive).length}/12</strong></span></div>${state.status?`<div class="result-banner ${state.status===1?'won':'lost'}"><h2>${tr(state.status===1?'Everyone survived. The enemy trio is exposed.':'The watch has failed. Review the timeline and try again.')}</h2><button class="text-button" data-action="tab" data-tab="timeline">${tr('Review the timeline')} ${icon('arrow')}</button></div>`:`<div class="nf-next"><p>${tr(state.day<3?currentCase.planning:'Both nights are over. Compare the record and mark three suspects Evil.')}</p><button class="button ${state.day<3?'primary':'danger'}" id="nf-next" data-action="${state.day<3?'night':'verdict'}"${disabled(state.day===3&&(pop(mask)!==3||(mask&~state.suspects)))}>${icon(state.day<3?'moon':'scales')} ${tr(state.day<3?'Resolve night {night}':'Submit trio',{night:state.day})}</button></div>`}</section>`;}
function render(){const focus=document.activeElement?.id;
 $('#app').innerHTML=header()+`<main id="main" class="case-main" data-ready="nightfall"><div class="case-breadcrumb"><a class="text-button" href="./casebook.html">${icon('arrow')} ${tr('Back to the casebook')}</a><span>${tr('DYNAMIC CASE / {number}',{number:String(currentCase.number).padStart(2,'0')})}</span><button class="text-button" data-action="reset">${tr('Restart this case')}</button></div>${caseLibrary()}<section class="nf-heading"><div><p class="eyebrow">${tr('NIGHTFALL INVESTIGATIONS')}</p><h1 id="nf-title" tabindex="-1">${tr(currentCase.title)}</h1><p>${tr(currentCase.subtitle)}</p></div><span class="nf-seal" aria-hidden="true">${sigil(currentCase.symbol)}</span></section><p class="nf-objective">${tr("Keep every villager alive through two nights, then identify the three enemies among #03, #04, #07 and #10.")}</p>${currentCase.number===2?`<p class="nf-threat">${sigil('broken-shield')}${tr(currentCase.policy)}</p>`:''}${charter()}${controls()}<nav class="case-tabs" aria-label="${ta('Investigation views')}"><button id="nf-tab-circle" data-action="tab" data-tab="circle" class="${tab==='circle'?'active':''}" aria-current="${tab==='circle'?'page':'false'}">${icon('circle')} ${tr('The village')}</button><button id="nf-tab-timeline" data-action="tab" data-tab="timeline" class="${tab==='timeline'?'active':''}" aria-current="${tab==='timeline'?'page':'false'}">${icon('book')} ${tr('Timeline')} <span>${state.events.length}</span></button></nav><div class="workspace"><div class="case-left">${tab==='circle'?board():timeline()}${assistant()}</div>${inspector()}</div><footer class="site-footer"><span>FALSEWAKE <i>&middot;</i> ${tr('NIGHTFALL')} 0.6</span><span>${tr('Shared WASM rules. Separate save.')}</span></footer></main>`;
 if(focus)document.getElementById(focus)?.focus({preventScroll:true});
}
function modal(title,body,actions=''){returnFocus=document.activeElement;$('#modal-body').innerHTML=`<h2 id="modal-title">${esc(title)}</h2>${body}<div class="modal-actions">${actions||`<button class="button primary" data-action="close">${tr('Close')}</button>`}</div>`;$('#modal').showModal();}
function close(){$('#modal').close();}
function rules(){modal(t('Nightfall: the public rules'),`${charter().replace('<details class="nf-charter">','<details class="nf-charter" open>')}<h3>${tr('Read the order, not just the result.')}</h3><p>${tr(currentCase.order)}</p><p>${tr(currentCase.policy)}</p><p>${tr('Smokescreen fools team and role readings until marked. Drunk stays impaired after cleansing. Ordinary readings never bypass appearances.')}</p><p>${tr('This is an authored teaching case with certified helpers, not a randomly generated village. The optional assistant checks only the public charter and observed action history.')}</p>`);}
function act(op,source=0,to=0){try{
 const before=state.events.length;state=engine.command(op,source,to);analysis=null;save();render();
 if(op===4){const news=state.events.slice(before).filter(e=>[12,13,23].includes(e.kind));
  modal(t('Night {night}: the public record',{night:state.day-1}),`${news.map(e=>`<p>${esc(text(e))}</p>`).join('')}${news.some(e=>e.kind===13)?`<p>${tr('A saved victim is alive, but the Whisperer leaves them Tainted. Protection does not certify their next report.')}</p>`:''}<p class="hint">${tr(currentCase.number===1?'No hidden attacker or sabotage target is revealed by this summary.':'The record shows the affected seat, never the hidden saboteur.')}</p>`);
 }else toast(text(state.events.at(-1)));
 }catch(error){toast(error.message);}}
function replay(){modal(t('The investigation, in order.'),`<p>${tr('Nightfall replay v1. Import restores the case named in the file; the other investigation stays saved.')}</p><p><strong>${tr(currentCase.title)}</strong></p><ol class="replay-list">${engine.history.map(([op,a,b])=>`<li>${op===4?t('Resolve night'):op===5?t('Accused {names}',{names:seatList(a)}):t('{source} used an ability on {target}',{source:name(a),target:name(b)})}</li>`).join('')||`<li>${tr('No actions yet.')}</li>`}</ol>`,`<button class="button secondary" data-action="close">${tr('Close')}</button><button class="button secondary" data-action="import">${tr('Import replay')}</button><button class="button primary" data-action="export">${tr('Export replay')}</button>`);}
document.addEventListener('click',event=>{
 if(event.target.closest('.skip-link')){event.preventDefault();const main=$('#main');main?.setAttribute('tabindex','-1');main?.focus();return;}
 const b=event.target.closest('[data-action]');if(!b||b.disabled||!engine)return;const a=b.dataset.action,id=Number(b.dataset.id);
 if(a==='choose-case'){switchCase(b.dataset.case);}
 else if(a==='select'){selected=id;if([1,7].includes(id))target=11;render();save();if(innerWidth<=690)$('.nf-inspector').scrollIntoView({block:'start'});}
 else if(a==='circle')$('.case-tabs')?.scrollIntoView({block:'start'});
 else if(a==='tab'){tab=b.dataset.tab;render();}
 else if(a==='tag'){tags[selected]=id;save();render();}
 else if(a==='pin'){pins=pins.includes(id)?pins.filter(p=>p!==id):[...pins,id];save();render();}
 else if(a==='use'){
  if(actor().claim===6)modal(t('Place a lasting mark?'),`<p>${tr('Marking Smokescreen removes the disguise. Marking a Good villager can redirect tonight\'s attack. The mark cannot be removed.')}</p><p><strong>${name(target)}</strong></p>`,`<button class="button secondary" data-action="close">${tr('Cancel')}</button><button class="button primary" data-action="confirm-mark">${tr('Place a mark')}</button>`);
  else act(2,selected,actor().claim===1?selected:target);
 }
 else if(a==='confirm-mark'){close();act(2,selected,target);}
 else if(a==='night')modal(t('End Day {day}?',{day:state.day}),`<p>${tr(currentCase.planning)}</p><p>${tr('Wards promised to: {seats}',{seats:seatList(state.people.reduce((m,p)=>p.ward?m|bit(p.id):m,0))||t('None')})}</p>`,`<button class="button secondary" data-action="close">${tr('Keep investigating')}</button><button class="button primary" data-action="confirm-night">${tr('Resolve night')}</button>`);
 else if(a==='confirm-night'){close();act(4);}
 else if(a==='verdict')modal(t('Accuse these three numbers?'),`<p><strong>${esc(seatList(suspicion()))}</strong></p><p>${tr('A wrong accusation costs one Resolve. Only the full trio is checked. You have {p1} Resolve remaining.',{p1:state.resolve})}</p>`,`<button class="button secondary" data-action="close">${tr('Keep investigating')}</button><button class="button danger" data-action="confirm-verdict">${tr('Confirm trio')}</button>`);
 else if(a==='confirm-verdict'){close();act(5,suspicion());}
 else if(a==='analyze'){analysis=engine.analysis();render();}
 else if(a==='hint'){hints=Math.min(hints+1,3);render();}
 else if(a==='rules')rules();else if(a==='replay')replay();else if(a==='close')close();
 else if(a==='reset')modal(t('Restart the night watch?'),`<p>${tr('Only this Nightfall investigation and its notes will be cleared. Your sandbox, sealed cases and language preference stay unchanged.')}</p>`,`<button class="button secondary" data-action="close">${tr('Cancel')}</button><button class="button danger" data-action="confirm-reset">${tr('Restart this case')}</button>`);
 else if(a==='confirm-reset'){close();state=engine.reset();annotate({});save();render();}
 else if(a==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`falsewake-${currentCase.id}-replay.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 else if(a==='import')$('#replay-file').click();
});
document.addEventListener('input',event=>{if(event.target.id==='nf-notes'){notes[selected]=event.target.value.slice(0,1000);save();}});
document.addEventListener('change',event=>{if(event.target.id==='nf-target'){target=Number(event.target.value);save();}else if(event.target.id==='nf-filter'){filter=Number(event.target.value);render();}});
document.addEventListener('keydown',event=>{if(event.key==='?'&&!$('#modal').open&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))rules();});
$('#modal').addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));
$('#replay-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;
 try{if(file.size>40000)throw Error(t('Replay files must be smaller than 40 KB.'));const data=JSON.parse(await file.text());
  state=engine.replay(data);currentCase=nightfallCase(engine.caseId);annotate(data);save();updateURL();close();render();toast(t('Replay imported. Every accepted action was validated by WASM.'));
 }catch(error){toast(t('Import rejected: {error}',{error:error.message}));}finally{event.target.value='';}
});
initLanguageUI('nightfall',()=>{document.title='FALSEWAKE - '+t(currentCase.title);if(engine)render();});
try{engine=await loadNightfall();restoreCase(requestedCase());render();
}catch(error){$('#app').innerHTML=`<main class="loading fatal" id="main"><h1>${tr('The night watch could not begin.')}</h1><p>${esc(error.message)}</p><a href="./casebook.html" class="button secondary">${tr('Back to the casebook')}</a></main>`;console.error(error);}
