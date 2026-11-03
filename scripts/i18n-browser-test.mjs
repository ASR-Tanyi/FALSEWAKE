// Real Chromium integration, no test framework/runtime dependency (Node 22+).
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {serve} from './serve.mjs';
let chrome=process.env.CHROME;
if(!chrome)for(const c of ['chromium','google-chrome','chromium-browser'])try{execFileSync(c,['--version'],{stdio:'ignore'});chrome=c;break;}catch{}
if(!chrome)throw Error('Install Chromium/Chrome or set CHROME.');
const profile=await mkdtemp(join(tmpdir(),'falsewake-i18n-'));
const server=serve(0);await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}/FALSEWAKE/`;
const child=spawn(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Browser startup timed out')),20000);child.stderr.on('data',d=>{output+=d;const m=output.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});child.on('error',e=>{clearTimeout(timer);reject(e);});});
 const tabs=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 let next=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',m=>{const d=JSON.parse(m.data);if(d.id&&pending.has(d.id)){const p=pending.get(d.id);clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(Error(d.error.message)):p.resolve(d.result);}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error(`${method} timed out`));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression:`(async()=>{${expression}})()`,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
 const check=async(expression,message)=>{if(!await evaluate(`return (${expression});`))throw Error(message);};
 async function ready(){for(let i=0;i<200;++i){try{if(await evaluate("return !!document.querySelector('[data-ready]')"))return;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error('UI not ready: '+await evaluate('return document.body.innerText'));}
 async function navigate(path){await evaluate("document.querySelector('[data-ready]')?.removeAttribute('data-ready')");const result=await send('Page.navigate',{url:base+path});if(result.errorText)throw Error(result.errorText);await ready();}
 const click=selector=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control: '+${JSON.stringify(selector)});e.click();})()`);
 async function layout(label,width){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<700});await evaluate('return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const dimensions=await evaluate(`return ({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.villager,#language-select')].filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5;}).map(e=>e.id)})`);
  if(dimensions.scroll>width||dimensions.bad.length)throw Error(`${label} ${width}px overflow: `+JSON.stringify(dimensions));
 }
 async function noMissing(){const missing=await evaluate("return [...(await import('./i18n.js')).missingMessages]");if(missing.length)throw Error('Uncatalogued UI messages: '+JSON.stringify(missing));}
 async function shot(name){await mkdir('.build/screenshots',{recursive:true});const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`.build/screenshots/${name}.png`,Buffer.from(image.data,'base64'));}
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await navigate('index.html?lang=en');await evaluate('localStorage.clear()');await navigate('index.html?lang=en');
 await click('#seat-5');await click('#ask');
 await evaluate(`document.querySelector('#notes').value='NOT A TRANSLATION <script>no()</script>';document.querySelector('#notes').dispatchEvent(new Event('input',{bubbles:true}));window.savedSandbox=localStorage.getItem('falsewake.case.v1')`);
 for(const code of ['en','zh-Hans','es','ja']){
  await evaluate(`document.querySelector('#language-select').value=${JSON.stringify(code)};document.querySelector('#language-select').dispatchEvent(new Event('change',{bubbles:true}))`);
  await check(`document.documentElement.lang===${JSON.stringify(code)}&&localStorage.getItem('falsewake.language.v1')===${JSON.stringify(code)}`,'Language preference');
  await check(`localStorage.getItem('falsewake.case.v1')===window.savedSandbox&&document.querySelector('#notes').value==='NOT A TRANSLATION <script>no()</script>'`,'Language switch changed notes or game state');
  await click('#nav-evidence');await check(`document.querySelector('.chapter-heading h1').textContent===(await import('./i18n.js')).t('Every word leaves a trace.')`,'Journal translation');
  await click('#nav-grimoire');await check(`document.querySelector('.grimoire-card h3').textContent===(await import('./i18n.js')).t('Countkeeper')`,'Role translation');
  await evaluate(`const q=document.querySelector('#role-search');q.value=(await import('./i18n.js')).t('Drunk');q.dispatchEvent(new Event('input',{bubbles:true}))`);
  await check(`document.querySelectorAll('.grimoire-card').length===2`,'Localized search');
  await evaluate(`const q=document.querySelector('#role-search');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}))`);
  await click('[data-filter="Burden"]');await check(`document.querySelectorAll('.grimoire-card').length===2`,'Stable family filter');await click('[data-filter="All"]');
  await click('#nav-village');await click('[data-action="help"]');
  await check(`document.querySelector('#modal-title').textContent===(await import('./i18n.js')).t('Trust is not a fact.')`,'Translated guide');await click('[data-action="close"]');
  await click('#execute');await click('[data-action="close"]');await click('#end-day');await click('[data-action="close"]');
  for(const width of [1440,390,320])await layout('sandbox '+code,width);
  if(code==='zh-Hans'){await layout('sandbox screenshot',1440);await shot('i18n-zh-sandbox');}
  await noMissing();console.log('Languages: sandbox '+code+' - state, search, roles, help and responsive layout passed.');
 }
 // Test persistence across routes and reloads without a language parameter.
 await navigate('casebook.html');await check(`document.documentElement.lang==='ja'`,'Language did not persist across modes');
 for(const code of ['en','zh-Hans','es','ja']){
  await navigate('casebook.html?lang='+code);
  for(const width of [1440,390,320])await layout('casebook '+code,width);
  if(code==='es'){await layout('casebook screenshot',1440);await shot('i18n-es-casebook');}
  for(const id of [1,2]){
   await evaluate(`localStorage.removeItem('falsewake.sealed.v1.'+${id})`);await click(`[data-action="start"][data-id="${id}"]`);
   await click('#read-testimony');
   await evaluate(`document.querySelector('#case-notes').value='KEEP MY WORDS';document.querySelector('#case-notes').dispatchEvent(new Event('input',{bubbles:true}));window.savedCase=localStorage.getItem('falsewake.sealed.v1.'+${id})`);
   // Switching twice must retain the active case, evidence, notes, and selector focus.
   await evaluate(`const m=await import('./i18n.js');m.setLocale('en');m.setLocale(${JSON.stringify(code)})`);
   await check(`localStorage.getItem('falsewake.sealed.v1.'+${id})===window.savedCase&&document.querySelector('#case-notes').value==='KEEP MY WORDS'`,'Case save changed with language');
   await click('[data-action="analyze"]');await click('[data-action="hint"]');await click('[data-action="hint"]');await click('[data-action="hint"]');
   await click('[data-action="check-theory"]');await click('[data-action="close"]');await click('[data-action="rules"]');await click('[data-action="close"]');
   for(const width of [1440,390,320])await layout('case '+id+' '+code,width);
   if(code==='ja'&&id===2){await layout('Japanese screenshot',1440);await shot('i18n-ja-investigation');}
   if(code==='zh-Hans'&&id===1){await layout('Chinese screenshot',390);await shot('i18n-zh-mobile');}
   await click('#case-tab-evidence');await click('[data-action="pin"]');await click('#case-tab-circle');
   // A proof-to-win route derived from all publicly opened evidence, not a hidden answer table.
   await evaluate(`for(let i=1;i<12;++i){document.querySelector('#case-seat-'+i).click();document.querySelector('#read-testimony').click();}
    const e=await(await import('./cases-engine.js')).loadCases();e.replay(JSON.parse(localStorage.getItem('falsewake.sealed.v1.'+${id})));
    const mask=e.analysis().evil;for(let i=0;i<12;++i)if(mask&(1<<i)){document.querySelector('#case-seat-'+i).click();document.querySelector('[data-action="tag"][data-id="2"]').click();}`);
   await click('#submit-trio');await click('[data-action="confirm-accuse"]');
   await check(`document.querySelector('.result-banner').classList.contains('won')`,'Translated case did not win');
   await click('[data-action="replay"]');await click('[data-action="close"]');await noMissing();
   await click('[data-action="home"]');console.log('Languages: '+code+' case '+id+' - clues, hints, rules, assistant, replay and victory passed.');
  }
 }
 await navigate('casebook.html');await check(`document.documentElement.lang==='ja'`,'Stored language lost on reload');
 // An unsupported URL should not defeat a valid saved preference.
 await navigate('casebook.html?lang=unsupported');await check(`document.documentElement.lang==='ja'`,'Unknown locale fallback');
 const external=await evaluate(`return performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin!==location.origin).map(r=>r.name)`);if(external.length)throw Error('External resource requests: '+external);
 if(errors.length)throw Error('Browser errors: '+errors.join('\n'));
 console.log('All four languages passed real-browser checks, including narrow layouts and locale-independent saves.');
}finally{socket?.close();child.kill('SIGTERM');server.closeAllConnections();server.close();await new Promise(r=>setTimeout(r,250));await rm(profile,{recursive:true,force:true,maxRetries:3});}
