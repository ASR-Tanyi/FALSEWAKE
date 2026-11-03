import {t,tr,ta,locale,formatNumber,formatList,searchText,languagePicker,initLanguageUI} from './i18n.js';
import {loadEngine} from './engine.js';
import {PEOPLE,ROLES,name,eventText,eventLabel,isReport} from './data.js';
import {icon,villageArt} from './art.js';
import {emblem,sigil} from './symbols.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE='falsewake.case.v2';
let engine,state,selected=0,view='village',tags=Array(12).fill(0),notes=Array(12).fill(''),pins=[];
let filter='All',query='',onlyPinned=false,toastTimer,modalReturn,storageWarned=false;
const targets=Array.from({length:12},(_,i)=>(i+1)%12);
const activeEvents=()=>state.events.filter(e=>![11,14].includes(e.kind));
function toast(text) { clearTimeout(toastTimer); $('#toast').textContent=text; $('#toast').classList.add('visible'); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200); }
function save() {
  try { localStorage.setItem(STORE,JSON.stringify({version:2,seed:state.seed,history:engine.history,selected,tags,notes,pins})); }
  catch { if(!storageWarned) { toast(t("Browser storage is unavailable. This run will not survive a reload.")); storageWarned=true; } }
}
function restore() {
  try {
    const raw=localStorage.getItem(STORE); if(!raw) return;
    if(raw.length>200000) throw new Error('Oversized save');
    const data=JSON.parse(raw); if(data.version!==2) throw new Error('Save version');
    state=engine.replay(data.history,data.seed);
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
    <span class="portrait-wrap">${emblem(ROLES[p.role||p.claim].icon)}<span class="seat-number">${String(p.id+1).padStart(2,'0')}</span>${!p.alive?`<span class="death-mark">${icon('skull')}</span>`:''}${p.marked?`<span class="mark-dot" title="${ta("Marked")}">&#10022;</span>`:''}</span>
    <span class="villager-name">${name(p.id)}</span><span class="villager-role">${t(ROLES[p.role||p.claim].name)}</span>
  </button>`;
}
function header() {
 const alive=state.people.filter(p=>p.alive).length;
 return `<header class="topbar"><a href="#" class="brand" data-action="view" data-view="village" aria-label="${ta("FALSEWAKE village")}">${icon('eye')}<span>FALSEWAKE<small>${tr("A VILLAGE OF BROKEN TRUTHS")}</small></span></a>
 <div class="case-label"><span class="tiny-diamond"></span> ${tr("THE HOLLOW BELL")} <span class="case-no">${tr("DISGUISES {seed}",{seed:state.seed})}</span></div>
 <div class="top-actions">${languagePicker()}<span class="engine-status" title="${ta("Game rules run locally in WebAssembly")}"><span></span> ${tr("WASM CORE")}</span><button class="icon-button" data-action="help" aria-label="${ta("How to play")}" title="${ta("How to play (?)")}">${icon('help')}</button><button class="icon-button" data-action="restart" aria-label="${ta("Restart case")}" title="${ta("Restart case")}">${icon('reset')}</button></div></header>
 <nav class="rail" aria-label="${ta("Game views")}">${[['village','village',t("Village")],['evidence','feather',t("Evidence")],['grimoire','book',t("Grimoire")]].map(([v,i,label])=>`<button id="nav-${v}" data-action="view" data-view="${v}" class="rail-button ${view===v?'active':''}" aria-label="${label}" ${view===v?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${v==='evidence'?`<b>${activeEvents().length}</b>`:''}</button>`).join('')}<div class="rail-bottom">${icon('moon')}<span>v0.4</span></div></nav>
 <main id="main" data-ready="true"><div class="chapter-heading"><div><p class="eyebrow"><span class="tiny-diamond"></span> ${tr("CHAPTER I")} <span>/</span> ${tr("AN AUTHORED CASE")}</p><h1>${view==='village'?t("The village remembers."):view==='evidence'?t("Every word leaves a trace."):t("Know the possible. Suspect the rest.")}</h1><p class="chapter-copy">${view==='village'?t("Twelve strangers. Three hidden enemies. A truth worth finding."):view==='evidence'?t("Testimony is evidence, not certainty. Keep the contradictions close."):t("Distinct characters. Simple powers. A claimed identity is never a guarantee.")}</p></div>
 <div class="metrics" aria-label="${ta("Game status")}"><div><span>${tr("DAY")}</span><strong>${String(state.day).padStart(2,'0')}<small>/ 12</small></strong></div><div><span>${tr("ALIVE")}</span><strong>${alive}<small>/ 12</small></strong></div><div class="resolve"><span>${tr("RESOLVE")}</span><strong aria-label="${ta("{p9} of 3 Resolve",{p9:state.resolve})}">${[0,1,2].map(i=>icon('heart',i<state.resolve?'filled':'empty')).join('')}</strong></div></div></div>`;
}
function evidenceCard(e,compact=false) {
 const report=e.kind===1||isReport(e);
 return `<article class="evidence-card ${compact?'compact':''}"><div class="evidence-meta"><span class="event-index">${String(e.id+1).padStart(2,'0')}</span><span>${e.source>=0?escape(name(e.source)):t("Village record")}</span><span class="event-label">${eventLabel(e)}</span><button class="pin-button ${pins.includes(e.id)?'pinned':''}" data-action="pin" data-id="${e.id}" aria-label="${ta(pins.includes(e.id)?'Unpin report {number}':'Pin report {number}',{number:e.id+1})}" aria-pressed="${pins.includes(e.id)}">${icon('pin')}</button></div><p>${report?'&ldquo;':''}${escape(eventText(e))}${report?'&rdquo;':''}</p><footer><span>${tr("DAY {p12}",{p12:String(e.day).padStart(2,'0')})}</span><span>${report?t("UNVERIFIED CLAIM"):t("RECORDED EVENT")}</span></footer></article>`;
}
function inspector() {
 const p=state.people[selected],r=ROLES[p.role||p.claim],claim=ROLES[p.claim];
 const reports=state.events.filter(e=>e.source===selected&&(e.kind===1||isReport(e)));
 const latest=reports.at(-1),known=p.team>=0;
 const unavailable=!canAct(p)||p.used||(claim.once&&p.spent);
 const targetsAlive=state.people.filter(t=>t.alive&&t.id!==p.id);
 if(!targetsAlive.some(t=>t.id===targets[selected])) targets[selected]=targetsAlive[0]?.id??0;
 return `<aside class="inspector" aria-label="${ta("Selected villager")}"><button class="mobile-return" data-action="back-to-board">${icon('arrow')} ${tr("Back to the circle")}</button><div class="inspector-top"><span class="eyebrow">${tr("VILLAGER {p1}",{p1:String(selected+1).padStart(2,'0')})}</span><span class="life-status ${p.alive?'':'is-dead'}"><i></i>${p.alive?t("ALIVE"):t("DEAD")}</span></div>
 <div class="character-hero"><div class="portrait-halo">${emblem(r.icon,true)}</div><h2>${name(selected)}</h2><p>${t("A symbol is a claim, not proof.")}</p></div>
 <div class="role-plaque ${known&&p.team?'evil':''}">${sigil(r.icon)}<div><span>${known?t("REVEALED IDENTITY"):t("CLAIMED IDENTITY")}</span><h3>${t(r.name)}</h3></div><span class="family-tag">${known?(p.team?t("EVIL"):t("GOOD")):'?'}</span></div>
 <p class="ability-description">${t(r.text)}</p>
 <div class="character-tokens">${p.marked?`<span>${icon('star')} ${tr("Marked")}</span>`:''}${p.ward?`<span>${icon('shield')} ${tr("Ward promised")}</span>`:''}${!known?`<span class="unconfirmed">${tr("Allegiance unconfirmed")}</span>`:''}</div>
 <section class="testimony"><h3 class="eyebrow">${icon('feather')} ${tr("LAST WORD ON RECORD")}</h3><blockquote>${latest?escape(eventText(latest)):t("There is more to their story. Ask, and listen carefully.")}</blockquote>${latest?`<span class="testimony-foot">${tr("DAY {p0} · {p1} · UNVERIFIED",{p0:latest.day,p1:eventLabel(latest).toUpperCase()})}</span>`:''}</section>
 <div class="investigation-controls"><button id="ask" class="button secondary" data-action="ask"${disabled(!canAct(p)||p.asked)}>${icon('feather')}<span>${p.asked?t("Testimony recorded"):t("Hear testimony")}</span><small>${p.asked?icon('check'):t('1 action')}</small></button>
 ${!claim.passive?`<div class="ability-control">${claim.target?`<label for="target">${tr("ABILITY TARGET")}</label><select id="target"${disabled(unavailable)}>${targetsAlive.map(t=>`<option value="${t.id}"${targets[selected]===t.id?' selected':''}>${name(t.id)}</option>`).join('')}</select>`:''}<button id="use" class="button primary" data-action="use"${disabled(unavailable)}>${sigil(claim.icon)}<span>${claim.once&&p.spent?t("Ability spent"):p.used?t("Used today"):t(claim.active)}</span><small>${tr("1 action")}</small></button></div>`:`<div class="passive-note">${icon('star')} ${tr("Passive ability · no action required")}</div>`}</div>
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
 return `<section class="library"><div class="library-toolbar"><div><h2>${tr("The grimoire")}</h2><p>${tr("Distinct characters. Simple powers. A claimed identity is never a guarantee.")}</p></div><label class="search-field">${icon('search')}<input id="role-search" type="search" value="${escape(query)}" placeholder="${ta("Search roles...")}" aria-label="${ta("Search roles")}"></label></div>
 <div class="filters" aria-label="${ta("Filter role family")}">${['All','Citizen','Burden','Agent','Tyrant'].map(f=>`<button data-action="filter" data-filter="${f}" class="${filter===f?'active':''}" aria-pressed="${filter===f}">${t({All:'All roles',Citizen:'Citizens',Burden:'Burdens',Agent:'Agents',Tyrant:'Tyrants'}[f])}</button>`).join('')}<span>${tr(entries.length===1?'{count} role':'{count} roles',{count:entries.length})}</span></div>
 <div class="role-grid">${entries.map(([id,r])=>`<article class="grimoire-card ${r.family.toLowerCase()}"><div class="grimoire-top"><span class="role-symbol">${sigil(r.icon)}</span><span class="eyebrow">${tr("{p2} · {p3}",{p2:t(r.family).toLocaleUpperCase(locale()),p3:r.family==='Citizen'||r.family==='Burden'?t("GOOD"):t("EVIL")})}</span><span class="role-number">${String(id).padStart(2,'0')}</span></div><h3>${t(r.name)}</h3><p>${t(r.text)}</p><div class="synergy-hint">${icon('star')}<span>${t(r.hint)}</span></div><footer>${r.passive?t("PASSIVE / AUTOMATIC"):r.once?t("ONCE PER CASE"):t("ONCE PER DAY")}<span>${tr("IMPLEMENTED")}</span></footer></article>`).join('')||`<div class="empty-state">${tr("No roles match that search.")}</div>`}</div>
 <div class="design-note">${icon('book')}<p>${tr("<strong>A small script, by design.</strong> The larger role catalogue is a design backlog. This prototype only uses the rules documented here; generated cases and the full synergy system are planned, not simulated.")}</p></div></section>`;
}
function render() {
 const focused=document.activeElement, focus=focused?.id;
 const selection=focused?.tagName==='INPUT'&&focused.type==='search'?[focused.selectionStart,focused.selectionEnd]:null;
 $('#app').innerHTML=header()+(state.status?`<div class="result-banner ${state.status===1?'won':''}" role="status">${icon(state.status===1?'star':'moon')}<div><strong>${state.status===1?t("The hollow wakes. Evil has fallen."):t("The case is closed. The truth remains.")}</strong><span>${tr("All identities are now revealed. Explore the evidence or begin again.")}</span></div><button class="button secondary" data-action="restart">${tr("Replay case")} ${icon('reset')}</button></div>`:'')+(view==='village'?board():view==='evidence'?journal():grimoire())+`<footer class="site-footer"><span>FALSEWAKE <i>&middot;</i> ${tr("NIGHT SANDBOX 0.4")}</span><span>${tr("LOCAL SAVES")} <i>&middot;</i> ${tr("NO ACCOUNTS")} <i>&middot;</i> ${state.status?t("CASE CLOSED"):t("TRUST CAREFULLY")}</span></footer></main>`;
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
 modal(t("Trust is not a fact."),`<div class="guide">
 <p>${tr("Find all three enemies. Numbers identify villagers; symbols show claimed characters, not verified identities.")}</p>
 <h3>${tr("Simple scope, precise meaning")}</h3><p>${tr("Broad powers answer whether any Evil is present, never how many. Countkeeper reads the nearest living neighbor on each side, skipping dead seats. Every clue records its numbered targets at the time it is made.")}</p>
 <h3>${tr("Appearance is not allegiance")}</h3><p>${tr("Ordinary readings see appearances. Devilmask is Good but looks Evil. Smokescreen looks Good until marked. Guild Auditor can also be fooled by that disguise. No normal power reads a true team.")}</p>
 <h3>${tr("A believable village")}</h3><p>${tr("Clues never target their own speaker. Characters normally have different identities. New disguises give each enemy a 90% chance to choose an unused Citizen claim and a 10% chance to copy a Good claim. A duplicate is suspicious, not a verdict.")}</p>
 <h3>${tr("Follow a connection")}</h3><p>${tr("Courier reveals Smokescreen to appearance checks. A Ward can save a Whisperer victim but leave them impaired. Cleansing removes Taint, never the permanent Drunk role.")}</p>
 <h3>${tr("Face the night")}</h3><p>${tr("Four investigations and one optional execution per day. Killing Good by execution costs Resolve; night deaths do not. Wards stop attacks, not executions, and expire at dawn. Win when all three enemies die; lose at zero Resolve, no living Good, or after twelve nights.")}</p>
 <p>${tr("Hear testimony asks an information character to make a reading using the next living seat as its starting target. Other characters explain their power. Invoke a power to choose its target. Both actions cost one investigation.")}</p>
 <p>${tr("Old Taint expires before each night. Rotmonger then impairs a Citizen. Whisperer attacks marked Good first, otherwise starting with #08. A surviving victim becomes impaired. False reports stay in the historical record.")}</p>
 <h3>${tr("Saves and disguises")}</h3><p>${tr("Restart repeats this script. New disguises changes only enemy claims, not hidden teams. The seed is saved for exact replay. Earlier-version saves are preserved but are not reinterpreted under these new rules.")}</p></div>`,
 `<button class="button primary" data-action="close">${tr("Begin the investigation")} ${icon('arrow')}</button>`);
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
 else if(action==='restart') modal(t("Return to the first bell?"),`<p class="modal-copy">${tr("Restart repeats the same disguises. New disguises redraws enemy claims only. Either choice clears this run and its notes; hidden teams do not move.")}</p>`,`${cancel()}<button class="button primary" data-action="confirm-restart">${tr("Restart case")} ${icon('reset')}</button><button class="button secondary" data-action="new-disguises">${tr("New disguises")}</button>`);
 else if(action==='confirm-restart'||action==='new-disguises') { const seed=action==='new-disguises'?(crypto.getRandomValues(new Uint32Array(1))[0]&2147483647)||1:state.seed; closeModal(); state=engine.reset(seed);selected=0;tags.fill(0);notes.fill('');pins=[];view='village';save();render();toast(t("A fresh investigation. The same village, another chance.")); }
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
