// Real Chromium tests, with the same /FALSEWAKE/ subpath as GitHub Pages.
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {serve} from './serve.mjs';
let chrome=process.env.CHROME;
if(!chrome)for(const candidate of ['chromium','google-chrome','chromium-browser']){
  try{execFileSync(candidate,['--version'],{stdio:'ignore'});chrome=candidate;break;}catch{}
}
if(!chrome)throw Error('Install Chrome/Chromium or set CHROME.');
const profile=await mkdtemp(join(tmpdir(),'falsewake-cases-'));
const server=serve(0);await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}/FALSEWAKE/`;
const child=spawn(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try {
  const endpoint=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Chrome startup timed out.')),20000);let output='';
    child.stderr.on('data',chunk=>{output+=chunk;const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
    child.on('error',error=>{clearTimeout(timer);reject(error);});
  });
  const tabs=await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
  let next=0;const pending=new Map(),errors=[];
  socket.addEventListener('message',message=>{const data=JSON.parse(message.data);
    if(data.id&&pending.has(data.id)){const p=pending.get(data.id);clearTimeout(p.timer);pending.delete(data.id);data.error?p.reject(Error(data.error.message)):p.resolve(data.result);}
    if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);
  });
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error(`${method} timed out`));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
  async function ready(){for(let i=0;i<200;++i){try{if(await evaluate("!!document.querySelector('[data-ready]')"))return;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error('Casebook did not load: '+await evaluate('document.body?.innerText'));}
  async function reload(){await evaluate("document.querySelector('[data-ready]')?.removeAttribute('data-ready')");await send('Page.reload');await ready();}
  async function screenshot(name){await mkdir('.build/screenshots',{recursive:true});const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`.build/screenshots/${name}.png`,Buffer.from(s.data,'base64'));}
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base+'casebook.html?lang=en'});await ready();await screenshot('casebook');
  console.log(await evaluate(`(()=>{
    const $=s=>document.querySelector(s),click=s=>{const e=$(s);if(!e)throw Error('Missing '+s);e.click();},check=(x,m)=>{if(!x)throw Error(m);};
    check(document.querySelectorAll('.case-cover').length===3,'Two cases plus sandbox');
    localStorage.setItem('falsewake.case.v1','legacy-sentinel');
    click('[data-action="start"][data-id="1"]');
    check(document.querySelectorAll('.villager').length===12,'12 witnesses');
    check(!$('.analysis-summary'),'Assistant hidden by default');
    click('[data-action="analyze"]');check($('.analysis-summary strong').textContent==='1,980','Evidence-only initial enumeration');
    click('#read-testimony');check(!$('.analysis-summary'),'Opening evidence invalidates displayed analysis');
    click('[data-action="tag"][data-id="1"]');
    $('#case-notes').value='<img src=x onerror=alert(1)>';$('#case-notes').dispatchEvent(new Event('input',{bubbles:true}));
    click('[data-action="pin"]');click('#case-tab-evidence');check(document.querySelectorAll('.evidence-card').length===1,'Journal opens only read evidence');
    check(document.querySelectorAll('.pinned').length===1,'Pinned evidence');
    click('#case-tab-circle');click('[data-action="rules"]');check($('#modal').open,'Rules dialog');click('[data-action="close"]');
    check(!document.querySelector('img[src=x]'),'Annotations escaped');
    return 'Case browser: selection, sealed reads, optional analysis, notes, pins, journal, rules.';
  })()`));
  await reload();
  if(!await evaluate(`document.querySelector('#case-notes').value==='<img src=x onerror=alert(1)>'&&document.querySelector('#read-testimony').disabled`))throw Error('Case-local save did not restore');
  console.log(await evaluate(`(()=>{
    const $=s=>document.querySelector(s),click=s=>$(s).click(),check=(x,m)=>{if(!x)throw Error(m);};
    click('[data-action="home"]');click('[data-action="start"][data-id="2"]');
    check(!$('#read-testimony').disabled,'Case 2 has its own state');check($('#case-notes').value==='','Case 2 notes separate');
    click('[data-action="home"]');click('[data-action="start"][data-id="1"]');check($('#case-notes').value.includes('<img'),'Case 1 retained');
    for(let i=0;i<12;++i){click('#case-seat-'+i);if(!$('#read-testimony').disabled)click('#read-testimony');}
    click('[data-action="analyze"]');check($('.analysis-summary strong').textContent==='1','Unique assignment');
    // Match visible, unique witness names instead of assuming comma-only list grammar.
    // This remains a proof from public evidence, not a hidden solution table.
    const forced=Array.from(document.querySelectorAll('.forced-facts p')).find(p=>p.textContent.startsWith('Forced Evil:')).textContent;
    const enemyNames=Array.from(document.querySelectorAll('.villager-name'),el=>el.textContent).filter(n=>forced.includes(n));
    check(enemyNames.length===3,'Public deductions name exactly three enemies');
    for(let i=0;i<12;++i){click('#case-seat-'+i);click('[data-action="tag"][data-id="'+(enemyNames.includes($('.character-hero h2').textContent)?2:0)+'"]');}
    check(!$('#submit-trio').disabled,'Complete trio can be submitted');click('#submit-trio');check($('#modal').open,'Accusation confirmation');
    click('[data-action="confirm-accuse"]');check(!!$('.result-banner.won'),'Evidence-derived winning route');
    check(!!$('.debrief-note'),'Debrief explains actual vs reported count');
    click('[data-action="replay"]');check(document.querySelectorAll('.replay-list li').length===13,'Replay inspector records all actions');click('[data-action="close"]');
    check(localStorage.getItem('falsewake.case.v1')==='legacy-sentinel','Sandbox save untouched');
    return 'Case browser: independent saves, deterministic reload, complete proof-to-victory UI route, debrief, replay inspector.';
  })()`));
  // Import through the file input using browser File/DataTransfer APIs.
  console.log(await evaluate(`(async()=>{
    const $=s=>document.querySelector(s),wait=()=>new Promise(r=>setTimeout(r,80));
    async function upload(data){const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(data)],'replay.json',{type:'application/json'}));$('#replay-file').files=dt.files;$('#replay-file').dispatchEvent(new Event('change'));await wait();}
    const before=localStorage.getItem('falsewake.sealed.v1.1');
    await upload({version:1,caseId:2,commands:[[1,0],[1,0]]});
    if(!$('.result-banner.won')||localStorage.getItem('falsewake.sealed.v1.1')!==before)throw Error('Invalid import mutated the run');
    await upload({version:1,caseId:2,commands:[[1,1]],selected:1,notes:['imported']});
    if(!location.hash.includes('2')||!$('#read-testimony').disabled)throw Error('Valid import did not replay');
    return 'Case browser: valid replay import and atomic rejection of malformed replay.';
  })()`));
  await evaluate(`document.querySelector('[data-action="reset"]').click();document.querySelector('[data-action="confirm-reset"]').click();document.querySelector('#read-testimony').click();`);
  for(const [label,width,height] of [['case-desktop',1440,1100],['case-mobile',390,844],['case-narrow',320,740]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
    await new Promise(r=>setTimeout(r,80));
    if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw Error(label+' horizontal overflow');
    if(await evaluate(`Array.from(document.querySelectorAll('.villager')).some(b=>{const r=b.getBoundingClientRect();return r.left<0||r.right>innerWidth;})`))throw Error(label+' offscreen witnesses');
    await screenshot(label);console.log(`Case browser: ${width}px layout passed.`);
  }
  await evaluate(`document.querySelector('[data-action="home"]').click()`);
  if(await evaluate('document.documentElement.scrollWidth>innerWidth'))throw Error('Casebook narrow overflow');
  await screenshot('casebook-mobile');
  if(await evaluate(`performance.getEntriesByType('resource').some(r=>new URL(r.name).origin!==location.origin)`))throw Error('External runtime asset');
  if(errors.length)throw Error('Browser exceptions: '+errors.join('; '));
  console.log('Sealed-case browser checks passed.');
} finally {
  socket?.close();child.kill('SIGTERM');server.closeAllConnections();server.close();
  await new Promise(r=>setTimeout(r,250));await rm(profile,{recursive:true,force:true,maxRetries:3});
}
