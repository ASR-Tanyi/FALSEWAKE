// Real HTTP /FALSEWAKE/ integration, zero browser-library dependency (Node 22+).
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';
import {serve} from './serve.mjs';
let chrome=process.env.CHROME;
if(!chrome)for(const candidate of ['chromium','google-chrome','chromium-browser']){try{execFileSync(candidate,['--version'],{stdio:'ignore'});chrome=candidate;break;}catch{}}
if(!chrome)throw Error('Install Chrome/Chromium or set CHROME.');
const profile=await mkdtemp(join(tmpdir(),'falsewake-v4-')),server=serve(0);await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}/FALSEWAKE/`;
const child=spawn(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Chrome startup timed out')),20000);
  child.stderr.on('data',chunk=>{output+=chunk;const m=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
  child.on('error',e=>{clearTimeout(timer);reject(e);});});
 const tabs=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 let next=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',message=>{const d=JSON.parse(message.data);if(d.id&&pending.has(d.id)){const p=pending.get(d.id);clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(Error(d.error.message)):p.resolve(d.result);}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);});
 function send(method,params={}){return new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
 async function ready(){for(let i=0;i<200;i++){try{if(await evaluate("!!document.querySelector('[data-ready]')"))return;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error('Interface did not load: '+await evaluate('document.body?.innerText'));}
 async function navigate(path){await evaluate("document.querySelector('[data-ready]')?.removeAttribute('data-ready')");await send('Page.navigate',{url:base+path});await ready();}
 async function reload(){await evaluate("document.querySelector('[data-ready]')?.removeAttribute('data-ready')");await send('Page.reload');await ready();}
 async function viewport(width,height=1000){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});await new Promise(r=>setTimeout(r,100));}
 async function layout(label){if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw Error(label+' horizontal overflow');
  if(await evaluate("Array.from(document.querySelectorAll('.villager')).some(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth;})"))throw Error(label+' offscreen character');}
 async function screenshot(name){await mkdir('.build/screenshots',{recursive:true});const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`.build/screenshots/${name}.png`,Buffer.from(s.data,'base64'));}
 await send('Runtime.enable');await send('Page.enable');await viewport(1440,1150);await navigate('index.html?lang=en');
 console.log(await evaluate(`(()=>{
  const $=s=>document.querySelector(s),click=s=>{const e=$(s);if(!e)throw Error('Missing '+s);e.click();},check=(x,m)=>{if(!x)throw Error(m);};
  check(document.querySelectorAll('.villager .role-emblem').length===12,'12 sigils instead of heads');
  check(new Set(Array.from(document.querySelectorAll('.villager [data-symbol]')).map(e=>e.dataset.symbol)).size===12,'Default symbols are unique');
  check(Array.from(document.querySelectorAll('.villager-name')).every(e=>/^#\\d{2}$/.test(e.textContent)),'Numbered identities');
  click('#seat-5');check($('.character-hero h2').textContent==='#06','Numbered inspector');click('#ask');
  check($('.action-pips strong').textContent.replace(/\\s/g,'')==='3/4','Action budget');
  click('[data-action="tag"][data-id="2"]');check($('#seat-5').classList.contains('evil-hypothesis'),'Personal theory');
  $('#notes').value='<img src=x onerror=alert(1)>';$('#notes').dispatchEvent(new Event('input',{bubbles:true}));
  localStorage.setItem('falsewake.case.v1','old-night-sentinel');localStorage.setItem('falsewake.sealed.v1.1','old-case-sentinel');
  click('#execute');check($('#modal').open,'Execution confirmation');click('[data-action="close"]');
  click('#nav-evidence');click('[data-action="pin"]');check(!!$('.pinned'),'Evidence pin');
  click('#nav-grimoire');check(document.querySelectorAll('.grimoire-card').length===19,'All implemented roles');
  click('[data-filter="Tyrant"]');check(document.querySelectorAll('.grimoire-card').length===1,'Family filter');
  click('[data-filter="All"]');$('#role-search').value='Lantern';$('#role-search').dispatchEvent(new Event('input',{bubbles:true}));check(document.querySelectorAll('.grimoire-card').length>0,'Search');
  click('#nav-village');click('[data-action="help"]');check($('#modal').innerText.includes('No normal power reads a true team.'),'New appearance rules');click('[data-action="close"]');
  check(!document.querySelector('img[src=x]'),'Notes escaped');return 'Sandbox: numbers, unique symbols, actions, notes, journal, grimoire and rules passed.';
 })()`));
 await reload();if(!await evaluate("document.querySelector('#notes').value.includes('<img')&&document.querySelector('.action-pips strong').textContent.replace(/\\s/g,'')==='3/4'"))throw Error('Seeded save did not restore');
 for(const code of ['zh-Hans','es','ja','en']){
  await evaluate(`(async()=>{const {setLocale,missingMessages}=await import('./i18n.js');missingMessages.clear();const before=localStorage.getItem('falsewake.case.v2');setLocale('${code}');if(localStorage.getItem('falsewake.case.v2')!==before)throw Error('Language changed game save');if(!document.querySelector('#notes').value.includes('<img'))throw Error('Notes lost');document.querySelector('[data-action="help"]').click();document.querySelector('[data-action="close"]').click();if(missingMessages.size)throw Error('Missing translations: '+[...missingMessages]);})()`);
  for(const w of [1440,390,320]){await viewport(w,w===1440?1150:844);await layout(code+' sandbox '+w);}
 }
 await viewport(1440,1150);await screenshot('v04-sandbox');
 // Redraw disguises through the UI, then replay the exact seed after reload.
 await evaluate("document.querySelector('[data-action=restart]').click();document.querySelector('[data-action=new-disguises]').click()");
 const seeded=await evaluate("localStorage.getItem('falsewake.case.v2')");await reload();if(await evaluate("localStorage.getItem('falsewake.case.v2')")!==seeded)throw Error('Disguise seed did not replay');
 if(!await evaluate("JSON.parse(localStorage.getItem('falsewake.case.v2')).seed>0"))throw Error('Disguise seed absent');
 console.log('Sandbox: shared languages, narrow layouts and new-disguise replay passed.');
 // All languages and both case solutions go through the visible evidence assistant.
 for(const code of ['en','zh-Hans','es','ja']){
  await viewport(1440,1150);await navigate('casebook.html?lang='+code);
  if(code==='en')await screenshot('v04-casebook');
  for(const id of [1,2]){
   console.log(await evaluate(`(async()=>{
    const {t,missingMessages}=await import('./i18n.js');missingMessages.clear();
    const $=s=>document.querySelector(s),click=s=>{const e=$(s);if(!e)throw Error('Missing '+s);e.click();},check=(x,m)=>{if(!x)throw Error(m);};
    if($('[data-action="home"]'))click('[data-action="home"]');click('[data-action="start"][data-id="${id}"]');
    click('[data-action="reset"]');click('[data-action="confirm-reset"]');
    check(new Set(Array.from(document.querySelectorAll('.villager [data-symbol]')).map(e=>e.dataset.symbol)).size===12,'12 different character claims');
    check(!$('.analysis-summary'),'Assistant starts hidden');
    click('#read-testimony');check(document.querySelectorAll('.in-scope.selected').length===0,'Clue excludes speaker');
    check($('.testimony blockquote').textContent.includes('#'),'Numbered clue');
    $('#case-notes').value='case ${id} ${code} <script>safe</script>';$('#case-notes').dispatchEvent(new Event('input',{bubbles:true}));
    click('[data-action="pin"]');click('#case-tab-evidence');check(!!$('.pinned'),'Case pin');click('#case-tab-circle');
    click('[data-action="rules"]');check($('#modal').innerText.includes(t('Appearance is not allegiance')),'Localized new rules');click('[data-action="close"]');
    click('[data-action="hint"]');click('[data-action="hint"]');click('[data-action="hint"]');
    for(let i=0;i<12;i++){click('#case-seat-'+i);if(!$('#read-testimony').disabled)click('#read-testimony');}
    click('[data-action="analyze"]');check($('.analysis-summary strong').textContent==='1','Unique explanation');
    const evil=Number($('.forced-facts').dataset.forcedEvil);check(evil>0,'Public evidence-derived trio');
    for(let i=0;i<12;i++){click('#case-seat-'+i);click('[data-action="tag"][data-id="'+((evil&(1<<i))?2:0)+'"]');}
    check(!$('#submit-trio').disabled,'Trio submission enabled');click('#submit-trio');click('[data-action="confirm-accuse"]');
    check(!!$('.result-banner.won'),'Evidence-to-victory route');
    for(let i=0;i<12;i++){click('#case-seat-'+i);check(!!$('.debrief-note'),'Explanatory debrief');}
    click('[data-action="replay"]');check(document.querySelectorAll('.replay-list li').length===13,'Replay inspector');click('[data-action="close"]');
    check(localStorage.getItem('falsewake.case.v1')==='old-night-sentinel','Old sandbox preserved');
    check(localStorage.getItem('falsewake.sealed.v1.1')==='old-case-sentinel','Old case preserved');
    check(!document.querySelector('script:not([src])'),'No note injection');
    check(!missingMessages.size,'Missing translations: '+[...missingMessages]);
    return '${code} case ${id}: symbols, numeric clues, hints, rules, complete victory, debrief, replay and translation coverage passed.';
   })()`));
  }
  await reload();if(!await evaluate("!!document.querySelector('.result-banner.won')"))throw Error('Case completion did not replay');
  for(const w of [1440,390,320]){await viewport(w,w===1440?1150:844);await layout(code+' case '+w);}
 }
 // Valid v2 imports and atomic v1/malformed rejection, with independent case saves.
 console.log(await evaluate(`(async()=>{
  const $=s=>document.querySelector(s),wait=()=>new Promise(r=>setTimeout(r,120));
  async function upload(data){const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(data)],'replay.json',{type:'application/json'}));$('#replay-file').files=dt.files;$('#replay-file').dispatchEvent(new Event('change'));await wait();}
  const old=localStorage.getItem('falsewake.sealed.v2.2');
  for(const data of [{version:1,caseId:2,commands:[[1,0]]},{version:2,caseId:2,commands:[[1,0],[1,0]]}]){
   await upload(data);if(!$('.result-banner.won')||localStorage.getItem('falsewake.sealed.v2.2')!==old)throw Error('Invalid/old import changed case');
  }
  await upload({version:2,caseId:1,commands:[[1,1]],selected:1,notes:['imported']});
  if(!location.hash.includes('1')||!$('#read-testimony').disabled)throw Error('Valid v2 import failed');
  if(localStorage.getItem('falsewake.sealed.v2.2')!==old)throw Error('Import changed another case');
  return 'Versioned imports and independent slots passed.';
 })()`));
 await evaluate("(async()=>{const {setLocale}=await import('./i18n.js');setLocale('en');})()");
 await viewport(1440,1150);await screenshot('v04-investigation');await viewport(390,844);await screenshot('v04-mobile');
 if(await evaluate("performance.getEntriesByType('resource').some(r=>new URL(r.name).origin!==location.origin)"))throw Error('External runtime resource');
 if(errors.length)throw Error('Browser exceptions: '+errors.join('; '));
 console.log('All real-browser checks passed.');
}finally{
 socket?.close();child.kill('SIGTERM');server.closeAllConnections();server.close();await new Promise(r=>setTimeout(r,250));await rm(profile,{recursive:true,force:true,maxRetries:3});
}
