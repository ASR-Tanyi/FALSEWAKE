// Real HTTP Chromium coverage for the second chapter and case-local saves.
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {serve} from './serve.mjs';
let chrome=process.env.CHROME;
if(!chrome)for(const name of ['chromium','google-chrome','chromium-browser']){try{execFileSync(name,['--version'],{stdio:'ignore'});chrome=name;break;}catch{}}
if(!chrome)throw Error('Install Chrome/Chromium or set CHROME.');
const profile=await mkdtemp(join(tmpdir(),'falsewake-hollow-')),server=serve(0);await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}/FALSEWAKE/`;
const child=spawn(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),20000);child.stderr.on('data',b=>{out+=b;const m=out.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});child.on('error',reject);});
 const tabs=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
 const pending=new Map(),errors=[];let id=0;
 socket.addEventListener('message',message=>{const d=JSON.parse(message.data);if(d.id&&pending.has(d.id)){const p=pending.get(d.id);clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(Error(d.error.message)):p.resolve(d.result);}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error(method+' timed out'));},20000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 async function ready(){for(let i=0;i<120;++i){if(await evaluate("!!document.querySelector('[data-ready]')"))return;await new Promise(r=>setTimeout(r,75));}throw Error('Page failed to load: '+await evaluate('document.body.innerText'));}
 async function navigate(path){await evaluate("document.querySelector('[data-ready]')?.removeAttribute('data-ready')");await send('Page.navigate',{url:base+path});await ready();}
 async function screenshot(name){await mkdir('.build/screenshots',{recursive:true});const png=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`.build/screenshots/${name}.png`,Buffer.from(png.data,'base64'));}
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 const setup=`const $=s=>document.querySelector(s),click=s=>{const e=$(s);if(!e)throw Error('Missing '+s);e.click();},check=(v,m)=>{if(!v)throw Error(m);};const power=(a,b)=>{click('#nf-seat-'+a);const s=$('#nf-target');if(s){s.value=String(b);s.dispatchEvent(new Event('change',{bubbles:true}));}click('#nf-use');if($('#modal').open)click('[data-action="confirm-mark"]');};const night=()=>{click('#nf-next');click('[data-action="confirm-night"]');click('[data-action="close"]');};`;
 await navigate('casebook.html?lang=en');
 if(!await evaluate("!!document.querySelector('#open-hollow-ward')"))throw Error('Second case is not discoverable');
 await navigate('nightfall.html?lang=en');
 await evaluate(`(()=>{${setup}power(11,2);$('#nf-notes').value='first case note';$('#nf-notes').dispatchEvent(new Event('input',{bubbles:true}));click('[data-case="hollow-ward"]');check($('#nf-actions').textContent==='4/4','New case starts fresh');check($('#nf-notes').value==='','New case has separate notes');power(10,4);$('#nf-notes').value='<img src=x onerror=alert(1)>';$('#nf-notes').dispatchEvent(new Event('input',{bubbles:true}));click('[data-case="warded-lantern"]');check($('#nf-actions').textContent==='3/4','First actions restored');check($('#nf-notes').value==='first case note','First notes restored');click('[data-case="hollow-ward"]');check($('#nf-actions').textContent==='3/4','Second actions restored');check($('#nf-notes').value.includes('<img'),'Second notes preserved');check(!document.querySelector('img[src=x]'),'Notes escaped');})()`);
 await navigate('nightfall.html?lang=en#case=hollow-ward');
 if(!await evaluate("document.querySelector('#nf-actions').textContent==='3/4'"))throw Error('Direct-link reload lost case state');
 await evaluate(`(()=>{${setup}click('.skip-link');check(location.hash.includes('hollow-ward'),'Skip link keeps the selected chapter');check(document.activeElement.id==='main','Skip link moves keyboard focus');})()`);
 console.log('Nightfall chapters: discovery, independent notes/actions, deep links, reload and escaped input passed.');
 for(const language of ['en','zh-Hans','es','ja']){
  await navigate(`nightfall.html?lang=${language}#case=hollow-ward`);
  await evaluate(`(()=>{${setup}click('[data-action="reset"]');click('[data-action="confirm-reset"]');click('[data-action="rules"]');check($('#modal').open,'Rules');click('[data-action="close"]');for(let i=0;i<3;++i)click('[data-action="hint"]');power(10,4);power(11,2);power(5,2);power(1,4);night();check($('#nf-actions').textContent==='4/4','Night refreshed actions');power(11,3);power(5,3);power(1,4);night();power(11,6);power(5,6);click('[data-action="analyze"]');const forced=$('[data-forced="evil"]').textContent.match(/#[0-9]{2}/g);check(forced?.length===3,'Evidence forces trio');for(const seat of forced){click('#nf-seat-'+(Number(seat.slice(1))-1));click('[data-action="tag"][data-id="2"]');}check(!$('#nf-next').disabled,'Verdict enabled');click('#nf-next');click('[data-action="confirm-verdict"]');check(!!$('.result-banner.won'),'Win');check(document.querySelectorAll('.nf-library .nf-case-card').length===2,'Two chapters remain');click('#nf-tab-timeline');check(document.querySelectorAll('[data-event]').length>12,'History retained');check(document.querySelectorAll('[data-symbol="broken-shield"]').length>=1,'Unique Wardbreaker sigil');click('[data-action="replay"]');check($('#modal').open,'Replay');click('[data-action="close"]');})()`);
  // Invalid cross-case replay cannot change the currently won game or its save.
  await evaluate(`(async()=>{${setup}const key='falsewake.nightfall.v1.hollow-ward',before=localStorage.getItem(key),other=localStorage.getItem('falsewake.nightfall.v1');const dt=new DataTransfer();dt.items.add(new File([JSON.stringify({version:1,kind:'nightfall',caseId:'warded-lantern',commands:[[2,11,2],[2,11,2]]})],'bad.json',{type:'application/json'}));$('#replay-file').files=dt.files;$('#replay-file').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));check(!!$('.result-banner.won'),'Bad import preserved victory');check(localStorage.getItem(key)===before&&localStorage.getItem('falsewake.nightfall.v1')===other,'Bad import preserved both saves');})()`);
  const missing=await evaluate("(async()=>[...(await import('./i18n.js')).missingMessages])()");if(missing.length)throw Error('Missing translations: '+missing.join(', '));
  if(language==='en')await screenshot('hollow-timeline');
  await evaluate(`(()=>{${setup}click('[data-action="reset"]');click('[data-action="confirm-reset"]');})()`);
  for(const [width,height] of [[1440,1100],[390,844],[320,740]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});await new Promise(r=>setTimeout(r,80));
   if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw Error(`${language} ${width}px overflow`);
   if(await evaluate("[...document.querySelectorAll('.villager')].some(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth;})"))throw Error('Offscreen seat');
   if(width===1440&&language==='en'||width===390&&['en','zh-Hans'].includes(language))await screenshot(`hollow-${language}-${width}`);
  }
  console.log(`Hollow ward: ${language} complete win, hints, rules, debrief, replay and 1440/390/320px passed.`);
 }
 // A real failing route exercises the removed-Ward report and immediate loss.
 await navigate('nightfall.html?lang=en#case=hollow-ward');
 await evaluate(`(()=>{${setup}power(1,11);night();check(!!$('.result-banner.lost'),'Ward alone loses');click('#nf-tab-timeline');check($('.nf-events').textContent.includes('removed before the attack'),'Removal observation rendered');click('[data-case="warded-lantern"]');check($('#nf-actions').textContent==='3/4','Other case still saved');})()`);
 if(await evaluate("performance.getEntriesByType('resource').some(r=>new URL(r.name).origin!==location.origin)"))throw Error('External runtime resource');
 if(errors.length)throw Error(errors.join('; '));
 console.log('Second-chapter real-browser checks passed.');
}finally{
 socket?.close();child.kill('SIGTERM');server.closeAllConnections();server.close();await new Promise(r=>setTimeout(r,200));await rm(profile,{recursive:true,force:true,maxRetries:3});
}
