// Real HTTP browser checks; no mocked engine or screenshot-only passing path.
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';
import {serve} from './serve.mjs';
let chrome=process.env.CHROME;
if(!chrome)for(const p of ['chromium','google-chrome','chromium-browser'])try{execFileSync(p,['--version'],{stdio:'ignore'});chrome=p;break;}catch{}
if(!chrome)throw Error('Chrome/Chromium required, or set CHROME.');
const profile=await mkdtemp(join(tmpdir(),'falsewake-nightfall-'));
const server=serve(0);await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}/FALSEWAKE/`;
const child=spawn(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Browser startup timeout')),20000);child.stderr.on('data',chunk=>{out+=chunk;const m=out.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});child.on('error',e=>{clearTimeout(timer);reject(e);});});
 const tabs=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 let next=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 async function ready(mode='nightfall'){for(let i=0;i<160;i++){if(await evaluate(`!!document.querySelector('[data-ready="${mode}"]')`))return;await new Promise(r=>setTimeout(r,50));}throw Error('Page did not load over HTTP: '+await evaluate('document.body.innerText'));}
 async function navigate(path,mode='nightfall'){await evaluate(`document.querySelector('[data-ready]')?.removeAttribute('data-ready')`);await send('Page.navigate',{url:base+path});await ready(mode);}
 async function screenshot(name){await mkdir('.build/screenshots',{recursive:true});const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`.build/screenshots/${name}.png`,Buffer.from(s.data,'base64'));}
 const setup=`const $=s=>document.querySelector(s),check=(v,m)=>{if(!v)throw Error(m);},click=s=>{const b=$(s);check(b&&!b.disabled,'Cannot click '+s);b.click();},close=()=>{if($('#modal').open)click('[data-action="close"]');},use=(a,b)=>{click('#nf-seat-'+a);if($('#nf-target')){$('#nf-target').value=String(b);$('#nf-target').dispatchEvent(new Event('change',{bubbles:true}));}click('#nf-use');if($('#modal').open)click('[data-action="confirm-mark"]');},night=()=>{click('#nf-next');click('[data-action="confirm-night"]');check($('#modal').open,'Night summary opens');close();};`;
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await navigate('casebook.html?lang=en','casebook');
 if(!await evaluate(`!!document.querySelector('#open-nightfall')`))throw Error('Casebook does not link to Nightfall');
 await navigate('nightfall.html?lang=en');
 await evaluate(`(()=>{${setup}check(document.querySelectorAll('.villager').length===12,'12 numbered villagers');check(!$('.analysis-summary'),'Assistant hidden');localStorage.setItem('falsewake.case.v2','sandbox-sentinel');localStorage.setItem('falsewake.sealed.v2.1','sealed-sentinel');$('#nf-notes').value='<img src=x onerror=alert(1)>';$('#nf-notes').dispatchEvent(new Event('input',{bubbles:true}));use(11,2);check($('#nf-actions').textContent==='3/4','WASM action budget');})()`);
 await evaluate(`document.querySelector('#language-select').value='ja';document.querySelector('#language-select').dispatchEvent(new Event('change',{bubbles:true}))`);
 await evaluate(`(()=>{${setup}check(document.documentElement.lang==='ja','Live language');check($('#nf-actions').textContent==='3/4','Language did not spend/reset actions');check($('#nf-notes').value==='<img src=x onerror=alert(1)>','Notes retained');check(!document.querySelector('img[src=x]'),'Notes escaped');})()`);
 await navigate('nightfall.html');
 await evaluate(`(()=>{${setup}check(document.documentElement.lang==='ja','Preference remembered');check($('#nf-actions').textContent==='3/4','Replay restored action');click('[data-action="replay"]');check(document.querySelectorAll('.replay-list li').length===1,'Replay inspector');close();})()`);
 console.log('Nightfall browser: discovery, WASM actions, live language, escaped notes, reload and replay.');
 for(const language of ['en','zh-Hans','es','ja']){
  await evaluate(`localStorage.removeItem('falsewake.nightfall.v1')`);await navigate('nightfall.html?lang='+language);
  if(language==='en')await screenshot('nightfall-desktop');
  await evaluate(`(()=>{${setup}click('[data-action="rules"]');check($('#modal-body').textContent.length>200,'Rules');close();for(let i=0;i<3;i++)click('[data-action="hint"]');click('[data-action="analyze"]');check($('.analysis-summary strong').textContent==='24','24 initial public worlds');use(11,2);use(5,2);use(10,2);use(1,11);night();check($('#nf-actions').textContent==='4/4','Dawn budget');use(7,11);use(11,3);use(5,3);use(1,11);night();use(7,11);use(11,2);click('[data-action="analyze"]');check($('.analysis-summary strong').textContent==='2','Two subtype histories');const numbers=[...document.querySelector('[data-forced="evil"]').textContent.matchAll(/#(\\d{2})/g)].map(m=>Number(m[1])-1);check(numbers.length===3,'Three evidence-derived enemies');for(const i of numbers){click('#nf-seat-'+i);click('[data-action="tag"][data-id="2"]');}click('#nf-next');click('[data-action="confirm-verdict"]');check(!!$('.result-banner.won'),'Winning verdict');check(localStorage.getItem('falsewake.case.v2')==='sandbox-sentinel','Sandbox untouched');check(localStorage.getItem('falsewake.sealed.v2.1')==='sealed-sentinel','Sealed slot untouched');click('#nf-tab-timeline');check(document.querySelectorAll('.evidence-card').length>12,'Timeline');click('[data-action="pin"]');check(!!$('.nf-pinned'),'Evidence pin');$('#nf-filter').value='2';$('#nf-filter').dispatchEvent(new Event('change',{bubbles:true}));check(document.querySelectorAll('.evidence-card').length>=3,'Historical target comparison');})()`);
  if(language==='en')await screenshot('nightfall-timeline');
  // A malformed replay must not replace a won game or any saved annotations.
  await evaluate(`(async()=>{${setup}const before=localStorage.getItem('falsewake.nightfall.v1');const dt=new DataTransfer();dt.items.add(new File([JSON.stringify({version:1,kind:'nightfall',caseId:'warded-lantern',commands:[[2,11,2],[2,11,2]]})],'bad.json',{type:'application/json'}));$('#replay-file').files=dt.files;$('#replay-file').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));check(!!$('.result-banner.won'),'Invalid replay preserved terminal state');check(localStorage.getItem('falsewake.nightfall.v1')===before,'Invalid replay preserved save');})()`);
  const missing=await evaluate(`(await import('./i18n.js')).missingMessages.size?[...(await import('./i18n.js')).missingMessages]:[]`);
  if(missing.length)throw Error('Missing translation IDs: '+JSON.stringify(missing));
  // Fresh board and timeline at every language/viewport combination.
  await evaluate(`(()=>{${setup}click('[data-action="reset"]');click('[data-action="confirm-reset"]');})()`);
  for(const width of [1440,390,320]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:width<700?844:1100,deviceScaleFactor:1,mobile:width<700});
   await new Promise(r=>setTimeout(r,60));
   for(const view of ['circle','timeline']){
    await evaluate(`document.querySelector('#nf-tab-${view}').click()`);
    if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw Error(`${language}/${width}/${view}: horizontal overflow`);
    if(view==='circle'&&await evaluate(`Array.from(document.querySelectorAll('.villager')).some(b=>{const r=b.getBoundingClientRect();return r.left<0||r.right>innerWidth;})`))throw Error(`${language}/${width}: offscreen villagers`);
   }
   await evaluate(`document.querySelector('#nf-tab-circle').click()`);
   if(width===390&&(language==='en'||language==='zh-Hans'||language==='ja'))await screenshot('nightfall-'+language+'-mobile');
  }
  console.log(`Nightfall browser: ${language} full winning route, atomic import, 1440/390/320px views.`);
 }
 // Test import success and failure branch through the same UI.
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await evaluate(`(async()=>{${setup}const dt=new DataTransfer();dt.items.add(new File([JSON.stringify({version:1,kind:'nightfall',caseId:'warded-lantern',commands:[[2,1,11],[4,0,0]],selected:11})],'ok.json',{type:'application/json'}));$('#replay-file').files=dt.files;$('#replay-file').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));check($('#nf-actions').textContent==='4/4','Valid replay import');click('[data-action="reset"]');click('[data-action="confirm-reset"]');night();check(!!$('.result-banner.lost'),'Missing protection loses');})()`);
 if(await evaluate(`performance.getEntriesByType('resource').some(r=>new URL(r.name).origin!==location.origin)`))throw Error('Unexpected external assets');
 if(errors.length)throw Error('Browser exceptions: '+errors.join('; '));
 console.log('Nightfall HTTP browser suite passed.');
}finally{socket?.close();child.kill('SIGTERM');server.closeAllConnections();server.close();await new Promise(r=>setTimeout(r,250));await rm(profile,{recursive:true,force:true,maxRetries:3});}
