import {t,tr,ta,locale,formatNumber,formatList,searchText,languagePicker,initLanguageUI} from './i18n.js';
import {loadEngine} from './engine.js';
import {PEOPLE,ROLES,name,eventText,eventLabel} from './data.js';
import {icon,portrait,villageArt} from './art.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE='falsewake.case.v1';
let engine,state,selected=0,view='village',tags=Array(12).fill(0),notes=Array(12).fill(''),pins=[];
let filter='All',query='',onlyPinned=false,toastTimer,modalReturn,storageWarned=false;
const targets=Array.from({length:12},(_,i)=>(i+1)%12);
const activeEvents=()=>state.events.filter(e=>![11,14].includes(e.kind));
function toast(text) { clearTimeout(toastTimer); $('#toast').textContent=text; $('#toast').classList.add('visible'); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200); }
function save() {
  try { localStorage.setItem(STORE,JSON.stringify({version:1,history:engine.history,selected,tags,notes,pins})); }
  catch { if(!storageWarned) { toast(t("Browser storage is unavailable. This run will not survive a reload.")); storageWarned=true; } }
}
function restore() {
  try {
    const raw=localStorage.getItem(STORE); if(!raw) return;
    if(raw.length>200000) throw new Error('Oversized save');
    const data=JSON.parse(raw); if(data.version!==1) throw new Error('Save version');
    state=engine.replay(data.history);
    selected=Number.isInteger(data.selected)&&data.selected>=0&&data.selected<12?data.selected:0;
    if(Array.isArray(data.tags)&&data.tags.length===12) tags=data.tags.map(t=>[0,1,2].includes(t)?t:0);
    if(Array.isArray(data.notes)&&data.notes.length===12) notes=data.notes.map(n=>typeof n==='string'?n.slice(0,1000):'');
    if(Array.isArray(data.pins)) pins=[...new Set(data.pins.filter(n=>Number.isInteger(n)&&n>=0&&n<state.events.length))];
  } catch { state=engine.reset(); toast(t("An incompatible or damaged save was skipped. A fresh case is ready.")); }
}
function disabled(condition) { return condition?' disabled':''; }
function canAct(p) { return p.alive&&!state.status&&state.actions>0; }
function personButton(p) {
  const angle=p.id*Math.PI/6, x=50+37*Math.sin(angle), y=50-37*Math.cos(angle);
  const known=p.team>=0, tag=known?p.team+1:tags[p.id];
  return `<button id="seat-${p.id}" class="villager ${selected===p.id?'selected':''} ${!p.alive?'dead':''} ${tag===1?'good-hypothesis':tag===2?'evil-hypothesis':''}" style="--x:${x}%;--y:${y}%" data-action="select" data-id="${p.id}" aria-label="${ta(p.alive?'Seat {seat}, {name}, claims {role}':'Seat {seat}, {name}, claims {role}, dead',{seat:p.id+1,name:name(p.id),role:t(ROLES[p.claim].name)})}" aria-pressed="${selected===p.id}">
    <span class="portrait-wrap">${portrait(p.id)}<span class="seat-number">${String(p.id+1).padStart(2,'0')}</span>${!p.alive?`<span class="death-mark">${icon('skull')}</span>`:''}${p.marked?`<span class="mark-dot" title="${ta("Marked")}">&#10022;</span>`:''}</span>
    <span class="villager-name">${name(p.id)}</span><span class="villager-role">${t(ROLES[p.role||p.claim].name)}</span>
  </button>`;
}
function header() {
 const alive=state.people.filter(p=>p.alive).length;
 return `<header class="topbar"><a href="#" class="brand" data-action="view" data-view="village" aria-label="${ta("FALSEWAKE village")}">${icon('eye')}<span>FALSEWAKE<small>${tr("A VILLAGE OF BROKEN TRUTHS")}</small></span></a>
 <div class="case-label"><span class="tiny-diamond"></span> ${tr("THE HOLLOW BELL")} <span class="case-no">${tr("CASE 001")}</span></div>
 <div class="top-actions">${languagePicker()}<span class="engine-status" title="${ta("Game rules run locally in WebAssembly")}"><span></span> ${tr("WASM CORE")}</span><button class="icon-button" data-action="help" aria-label="${ta("How to play")}" title="${ta("How to play (?)")}">${icon('help')}</button><button class="icon-button" data-action="restart" aria-label="${ta("Restart case")}" title="${ta("Restart case")}">${icon('reset')}</button></div></header>
 <nav class="rail" aria-label="${ta("Game views")}">${[['village','village',t("Village")],['evidence','feather',t("Evidence")],['grimoire','book',t("Grimoire")]].map(([v,i,label])=>`<button id="nav-${v}" data-action="view" data-view="${v}" class="rail-button ${view===v?'active':''}" aria-label="${label}" ${view===v?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${v==='evidence'?`<b>${activeEvents().length}</b>`:''}</button>`).join('')}<div class="rail-bottom">${icon('moon')}<span>v0.3</span></div></nav>
 <main id="main" data-ready="true"><div class="chapter-heading"><div><p class="eyebrow"><span class="tiny-diamond"></span> ${tr("CHAPTER I")} <span>/</span> ${tr("AN AUTHORED CASE")}</p><h1>${view==='village'?t("The village remembers."):view==='evidence'?t("Every word leaves a trace."):t("Know the possible. Suspect the rest.")}</h1><p class="chapter-copy">${view==='village'?t("Twelve strangers. Three hidden enemies. A truth worth finding."):view==='evidence'?t("Testimony is evidence, not certainty. Keep the contradictions close."):t("Thirteen roles in this case. A claimed identity is never a guarantee.")}</p></div>
 <div class="metrics" aria-label="${ta("Game status")}"><div><span>${tr("DAY")}</span><strong>${String(state.day).padStart(2,'0')}<small>/ 12</small></strong></div><div><span>${tr("ALIVE")}</span><strong>${alive}<small>/ 12</small></strong></div><div class="resolve"><span>${tr("RESOLVE")}</span><strong aria-label="${ta("{p9} of 3 Resolve",{p9:state.resolve})}">${[0,1,2].map(i=>icon('heart',i<state.resolve?'filled':'empty')).join('')}</strong></div></div></div>`;
}
function evidenceCard(e,compact=false) {
 const isReport=e.kind<=4||e.kind===8;
 return `<article class="evidence-card ${compact?'compact':''}"><div class="evidence-meta"><span class="event-index">${String(e.id+1).padStart(2,'0')}</span><span>${e.source>=0?escape(name(e.source)):t("Village record")}</span><span class="event-label">${eventLabel(e)}</span><button class="pin-button ${pins.includes(e.id)?'pinned':''}" data-action="pin" data-id="${e.id}" aria-label="${ta(pins.includes(e.id)?'Unpin report {number}':'Pin report {number}',{number:e.id+1})}" aria-pressed="${pins.includes(e.id)}">${icon('pin')}</button></div><p>${isReport?'&ldquo;':''}${escape(eventText(e))}${isReport?'&rdquo;':''}</p><footer><span>${tr("DAY {p12}",{p12:String(e.day).padStart(2,'0')})}</span><span>${isReport?t("UNVERIFIED CLAIM"):t("RECORDED EVENT")}</span></footer></article>`;
}
function inspector() {
 const p=state.people[selected],r=ROLES[p.role||p.claim],claim=ROLES[p.claim];
 const reports=state.events.filter(e=>e.source===selected&&[1,2,3,4,8].includes(e.kind));
 const latest=reports.at(-1),known=p.team>=0;
 const unavailable=!canAct(p)||p.used||(claim.once&&p.spent);
 const targetsAlive=state.people.filter(t=>t.alive&&(p.claim!==2||t.id!==p.id));
 if(!targetsAlive.some(t=>t.id===targets[selected])) targets[selected]=targetsAlive[0]?.id??0;
 return `<aside class="inspector" aria-label="${ta("Selected villager")}"><button class="mobile-return" data-action="back-to-board">${icon('arrow')} ${tr("Back to the circle")}</button><div class="inspector-top"><span class="eyebrow">${tr("VILLAGER {p1}",{p1:String(selected+1).padStart(2,'0')})}</span><span class="life-status ${p.alive?'':'is-dead'}"><i></i>${p.alive?t("ALIVE"):t("DEAD")}</span></div>
 <div class="character-hero"><div class="portrait-halo">${portrait(selected,true)}</div><h2>${name(selected)}</h2><p>${t(PEOPLE[selected].epithet)}</p></div>
 <div class="role-plaque ${known&&p.team?'evil':''}">${icon(r.icon)}<div><span>${known?t("REVEALED IDENTITY"):t("CLAIMED IDENTITY")}</span><h3>${t(r.name)}</h3></div><span class="family-tag">${known?(p.team?t("EVIL"):t("GOOD")):'?'}</span></div>
 <p class="ability-description">${t(r.text)}</p>
 <div class="character-tokens">${p.marked?`<span>${icon('star')} ${tr("Marked")}</span>`:''}${p.ward?`<span>${icon('shield')} ${tr("Ward promised")}</span>`:''}${!known?`<span class="unconfirmed">${tr("Allegiance unconfirmed")}</span>`:''}</div>
 <section class="testimony"><h3 class="eyebrow">${icon('feather')} ${tr("LAST WORD ON RECORD")}</h3><blockquote>${latest?escape(eventText(latest)):t("There is more to their story. Ask, and listen carefully.")}</blockquote>${latest?`<span class="testimony-foot">${tr("DAY {p0} · {p1} · UNVERIFIED",{p0:latest.day,p1:eventLabel(latest).toUpperCase()})}</span>`:''}</section>
 <div class="investigation-controls"><button id="ask" class="button secondary" data-action="ask"${disabled(!canAct(p)||p.asked)}>${icon('feather')}<span>${p.asked?t("Testimony recorded"):t("Hear testimony")}</span><small>${p.asked?icon('check'):t('1 action')}</small></button>
 ${!claim.passive?`<div class="ability-control">${claim.target?`<label for="target">${tr("ABILITY TARGET")}</label><select id="target"${disabled(unavailable)}>${targetsAlive.map(t=>`<option value="${t.id}"${targets[selected]===t.id?' selected':''}>${tr("{p2} · {p3}",{p2:String(t.id+1).padStart(2,'0'),p3:name(t.id)})}</option>`).join('')}</select>`:''}<button id="use" class="button primary" data-action="use"${disabled(unavailable)}>${icon(claim.icon)}<span>${claim.once&&p.spent?t("Ability spent"):p.used?t("Used today"):t(claim.active)}</span><small>${tr("1 action")}</small></button></div>`:`<div class="passive-note">${icon('star')} ${tr("Passive ability · no action required")}</div>`}</div>
 <div class="hypothesis"><span class="eyebrow">${tr("YOUR WORKING THEORY")}</span><div class="segmented" role="group" aria-label="${ta("Personal allegiance hypothesis")}">${[t("Unsure"),t("Good"),t("Evil")].map((t,i)=>`<button data-action="tag" data-id="${i}" aria-pressed="${tags[selected]===i}" class="${tags[selected]===i?'chosen':''}"${disabled(known)}>${t}</button>`).join('')}</div><span class="hint">${tr("A private note, not a verified fact.")}</span></div>
 <div class="notes"><label for="notes">${tr("FIELD NOTES")}</label><textarea id="notes" maxlength="1000" rows="2" placeholder="${ta("A contradiction? A connection?")}" spellcheck="true">${escape(notes[selected])}</textarea></div>
 <button id="execute" class="button danger" data-action="execute"${disabled(!p.alive||state.status||state.executed)}>${icon('scales')}<span>${state.executed?t("Execution used today"):t("Put to the gallows")}</span>${icon('arrow')}</button><p class="execution-warning">${tr("Executing Good costs 1 Resolve. Choose carefully.")}</p></aside>`;
}
function board() {
 const latest=activeEvents().slice(-2).reverse();
 return `<div class="workspace"><section class="board-panel" aria-labelledby="board-title"><div class="panel-heading"><h2 id="board-title">${icon('village')} ${tr("THE VILLAGE")}</h2><span class="quiet">${tr("Select a villager to investigate")}</span></div>
 <div class="village-board" aria-label="${ta("Twelve villagers arranged clockwise in fixed seats")}"><div class="orbit orbit-outer"></div><div class="orbit orbit-inner"></div><span class="compass-point north">N</span>
 <div class="village-center">${villageArt()}<div class="village-caption"><span>${tr("THE HOLLOW BELL")}</span><p>${state.status?t("A story brought to light."):t("The innocent do not always speak the truth.")}</p></div></div>
 ${state.people.map(personButton).join('')}</div>
 <div class="board-footer"><span><i class="legend-dot"></i> ${tr("Unconfirmed")}</span><span><i class="legend-dot good"></i> ${tr("Your Good theory")}</span><span><i class="legend-dot evil"></i> ${tr("Your Evil theory")}</span></div>
 <div class="day-actions"><div><span class="eyebrow">${tr("INVESTIGATIONS LEFT")}</span><div class="action-pips" aria-label="${ta("{p4} of 4 investigations",{p4:state.actions})}">${[0,1,2,3].map(i=>`<span class="${i<state.actions?'available':''}"></span>`).join('')}<strong>${state.actions}<small>/ 4</small></strong></div></div><button id="end-day" class="button night" data-action="night"${disabled(state.status)}>${icon('moon')}<span>${tr("Let night fall")}</span>${icon('arrow')}</button></div>
 <div class="recent-evidence"><div class="section-heading"><h2 class="eyebrow">${icon('feather')} ${tr("LATEST EVIDENCE")}</h2><button class="text-button" data-action="view" data-view="evidence">${tr("Open journal")} ${icon('arrow')}</button></div><div class="recent-grid">${latest.map(e=>evidenceCard(e,true)).join('')} ${latest.length<2?`<div class="evidence-placeholder"><span>II</span><p>${tr("The next clue is waiting.<br>Choose a villager. Hear their story.")}</p></div>`:''}</div></div></section>${inspector()}</div>`;
}
function journal() {
 const events=activeEvents().filter(e=>!onlyPinned||pins.includes(e.id)).reverse();
 return `<section class="library"><div class="library-toolbar"><div><h2>${tr("The evidence journal")}</h2><p>${tr('Records: {records}. Pinned: {pins}. Reports preserve the state when they were made.',{records:activeEvents().length,pins:pins.length})}</p></div><button class="button secondary" data-action="pinned" aria-pressed="${onlyPinned}">${icon('pin')}${onlyPinned?t("Show every record"):t("Pinned only")}</button></div><div class="journal-grid">${events.length?events.map(e=>evidenceCard(e)).join(''):`<div class="empty-state">${tr("No pinned evidence yet. Pin a report to keep it close.")}</div>`}</div></section>`;
}
function grimoire() {
 const entries=Object.entries(ROLES).filter(([,r])=>(filter==='All'||r.family===filter)&&searchText(`${r.name} ${r.text} ${t(r.name)} ${t(r.text)}`).includes(searchText(query)));
 return `<section class="library"><div class="library-toolbar"><div><h2>${tr("The grimoire")}</h2><p>${tr("Seven Citizen roles, two Burdens, two Agents, one Tyrant, and the Archivist claim.")}</p></div><label class="search-field">${icon('search')}<input id="role-search" type="search" value="${escape(query)}" placeholder="${ta("Search roles...")}" aria-label="${ta("Search roles")}"></label></div>
 <div class="filters" aria-label="${ta("Filter role family")}">${['All','Citizen','Burden','Agent','Tyrant'].map(f=>`<button data-action="filter" data-filter="${f}" class="${filter===f?'active':''}" aria-pressed="${filter===f}">${t({All:'All roles',Citizen:'Citizens',Burden:'Burdens',Agent:'Agents',Tyrant:'Tyrants'}[f])}</button>`).join('')}<span>${tr(entries.length===1?'{count} role':'{count} roles',{count:entries.length})}</span></div>
 <div class="role-grid">${entries.map(([id,r])=>`<article class="grimoire-card ${r.family.toLowerCase()}"><div class="grimoire-top"><span class="role-symbol">${icon(r.icon)}</span><span class="eyebrow">${tr("{p2} · {p3}",{p2:t(r.family).toLocaleUpperCase(locale()),p3:r.family==='Citizen'||r.family==='Burden'?t("GOOD"):t("EVIL")})}</span><span class="role-number">${String(id).padStart(2,'0')}</span></div><h3>${t(r.name)}</h3><p>${t(r.text)}</p><div class="synergy-hint">${icon('star')}<span>${t(r.hint)}</span></div><footer>${r.passive?t("PASSIVE / AUTOMATIC"):r.once?t("ONCE PER CASE"):t("ONCE PER DAY")}<span>${tr("IMPLEMENTED")}</span></footer></article>`).join('')||`<div class="empty-state">${tr("No roles match that search.")}</div>`}</div>
 <div class="design-note">${icon('book')}<p>${tr("<strong>A small script, by design.</strong> The larger role catalogue is a design backlog. This prototype only uses the rules documented here; generated cases and the full synergy system are planned, not simulated.")}</p></div></section>`;
}
function render() {
 const focused=document.activeElement, focus=focused?.id;
 const selection=focused?.tagName==='INPUT'&&focused.type==='search'?[focused.selectionStart,focused.selectionEnd]:null;
 $('#app').innerHTML=header()+(state.status?`<div class="result-banner ${state.status===1?'won':''}" role="status">${icon(state.status===1?'star':'moon')}<div><strong>${state.status===1?t("The hollow wakes. Evil has fallen."):t("The case is closed. The truth remains.")}</strong><span>${tr("All identities are now revealed. Explore the evidence or begin again.")}</span></div><button class="button secondary" data-action="restart">${tr("Replay case")} ${icon('reset')}</button></div>`:'')+(view==='village'?board():view==='evidence'?journal():grimoire())+`<footer class="site-footer"><span>FALSEWAKE <i>&middot;</i> ${tr("NIGHT SANDBOX 0.3")}</span><span>${tr("LOCAL SAVES")} <i>&middot;</i> ${tr("NO ACCOUNTS")} <i>&middot;</i> ${state.status?t("CASE CLOSED"):t("TRUST CAREFULLY")}</span></footer></main>`;
 if(focus) {const next=document.getElementById(focus);next?.focus({preventScroll:true});if(selection)next?.setSelectionRange(...selection);}
}
function closeModal() { $('#modal').close(); modalReturn?.focus({preventScroll:true}); }
function modal(title,body,buttons) {
 modalReturn=document.activeElement;
 $('#modal-body').innerHTML=`<button class="modal-close icon-button" data-action="close" aria-label="${ta("Close dialog")}">${icon('close')}</button><span class="eyebrow">${tr("THE HOLLOW BELL")}</span><h2 id="modal-title">${title}</h2>${body}<div class="modal-actions">${buttons}</div>`;
 $('#modal').showModal();
}
const cancel=()=>`<button class="button secondary" data-action="close">${tr("Return to the village")}</button>`;
function help() {
 modal(t("Trust is not a fact."),`<div class="guide"><p>${tr("You are the investigator. Find and execute <strong>all three Evil villagers</strong> before your Resolve or your village is lost.")}</p><h3>${tr("Read the circle")}</h3><p>${tr("Select a portrait. Hear testimony or invoke a claimed ability; each costs one of your four daily investigations. Mara's opening clue is free. Each villager gives their arrival testimony once per case. Active powers work once per day, except Trueglass, once per case.")}</p><h3>${tr("Separate the four questions")}</h3><p>${tr("What do they <em>claim</em>? What do they <em>register as</em>? Are they <em>actually Good</em>? Was their ability <em>working</em>? A Good Drunk can be wrong. An Evil villager can tell the truth. Green and red theory markers are your notes, never evidence.")}</p><h3>${tr("Follow a connection")}</h3><p>${tr("<strong>Courier + Countkeeper:</strong> mark a suspected Smokescreen, then check a neighbor's count. <strong>Wardmaker + Whisperer:</strong> a rescued villager may survive but become Tainted. <strong>Cleanser + Drunk:</strong> a ritual cannot change someone's permanent role.")}</p><h3>${tr("Face the night")}</h3><p>${tr("You may attempt one execution per day, free of investigation cost. Executing Good costs one of three Resolve. A failed execution still uses the attempt. Night kills do not cost Resolve. Wards expire at dawn; marks remain. The seat order never changes. Death removes registration disguises; historical reports do not change.")}</p><p>${tr("The Tyrant prefers marked Good victims; otherwise its fixed preference begins with Felix. Rotmonger applies one hidden Taint each night. All old Taint expires at the following night before new effects. Tainted information powers return false results; beneficial powers fail. Arrival memories are fixed unverified statements, not new ability readings.")}</p><h3>${tr("Finish the case")}</h3><p>${tr("Win by eliminating all Evil, not only the Tyrant. Lose at zero Resolve, when no Good villagers remain, or after the twelfth night. Deaths reveal true identities. This is a fixed, replayable interface case, not a randomly generated puzzle.")}</p><h3>${tr("Make it yours")}</h3><p>${tr("Pin reports in the journal and keep private notes. Your browser saves accepted actions and replays them on reload. Nothing is sent to a server. Press <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd> to change views, <kbd>?</kbd> for this guide, and <kbd>Esc</kbd> to close dialogs.")}</p></div>`,`<button class="button primary" data-action="close">${tr("Begin the investigation")} ${icon('arrow')}</button>`);
}
function act(op,a=0,b=0) {
 try { state=engine.command(op,a,b); save(); render();
   if(state.status) toast(state.status===1?t("Case solved. Every Evil villager has fallen."):t("The case is closed. All identities are now revealed."));
   else toast(op===4?t('Dawn {day}. The journal records what happened.',{day:state.day}):eventText(state.events.at(-1)));
 } catch(error) { toast(error.message); }
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]'); if(!button||button.disabled||!engine) return;
 const action=button.dataset.action,id=Number(button.dataset.id);
 if(button.tagName==='A') event.preventDefault();
 if(action==='select') { selected=id; render(); save(); if(innerWidth<=690) $('.inspector').scrollIntoView({block:'start'}); }
 else if(action==='back-to-board') $('.panel-heading').scrollIntoView({block:'start'});
 else if(action==='view') { view=button.dataset.view; render(); }
 else if(action==='tag') { tags[selected]=id; save(); render(); }
 else if(action==='pin') { pins=pins.includes(id)?pins.filter(p=>p!==id):[...pins,id]; save(); render(); }
 else if(action==='ask') act(1,selected);
 else if(action==='use') act(2,selected,ROLES[state.people[selected].claim].target?targets[selected]:selected);
 else if(action==='help') help();
 else if(action==='close') closeModal();
 else if(action==='execute') modal(t('Execute {name}?',{name:name(selected)}),`<p class="modal-copy">${tr("This is your one execution attempt for Day {p0}. If {p1} is Good and dies, you lose <strong>1 Resolve</strong>. A claim is not a confession.",{p0:state.day,p1:name(selected)})}</p>`,`${cancel()}<button class="button danger" data-action="confirm-execute">${tr("Confirm execution")} ${icon('scales')}</button>`);
 else if(action==='confirm-execute') { closeModal(); act(3,selected); }
 else if(action==='night') modal(t("Let the lanterns go dark?"),`<p class="modal-copy">${tr("Remaining investigations: <strong>{count}</strong>. {execution} Unused actions do not carry over. The living Tyrant will attack tonight.",{count:state.actions,execution:state.executed?t("Today's execution has been used."):t("You have not attempted an execution.")})}</p>`,`${cancel()}<button class="button primary" data-action="confirm-night">${tr("Let night fall")} ${icon('moon')}</button>`);
 else if(action==='confirm-night') { closeModal(); act(4); }
 else if(action==='restart') modal(t("Return to the first bell?"),`<p class="modal-copy">${tr("Restart this same authored case. Your actions, private notes, and pinned evidence will be cleared. Roles do not shuffle in this prototype.")}</p>`,`${cancel()}<button class="button primary" data-action="confirm-restart">${tr("Restart case")} ${icon('reset')}</button>`);
 else if(action==='confirm-restart') { closeModal(); state=engine.reset();selected=0;tags.fill(0);notes.fill('');pins=[];view='village';save();render();toast(t("A fresh investigation. The same village, another chance.")); }
 else if(action==='pinned') { onlyPinned=!onlyPinned;render(); }
 else if(action==='filter') { filter=button.dataset.filter;render(); }
});
document.addEventListener('input',event=>{
 if(event.target.id==='notes') {notes[selected]=event.target.value;save();}
 if(event.target.id==='role-search') {query=event.target.value;render();}
});
document.addEventListener('change',event=>{if(event.target.id==='target') targets[selected]=Number(event.target.value);});
document.addEventListener('keydown',event=>{
 if(!engine||$('#modal').open||event.ctrlKey||event.altKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) return;
 if(['1','2','3'].includes(event.key)) {view=['village','evidence','grimoire'][Number(event.key)-1];render();}
 if(event.key==='?') help();
});
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')) {const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeModal();}});
initLanguageUI('sandbox',()=>{if(engine&&state)render();});
try { engine=await loadEngine();state=engine.snapshot();restore();render(); }
catch(error) {
 $('#app').innerHTML=`<main class="loading fatal" id="main"><h1>${tr("The lanterns could not be lit.")}</h1><p>${escape(error.message)}</p><p>${tr("The real WASM engine is required. Serve the built <code>dist/</code> directory over HTTP, not a file URL.")}</p><button class="button primary" id="retry">${tr("Try again")}</button></main>`;
 $('#retry').addEventListener('click',()=>location.reload());
 console.error(error);
}
