// Zero-dependency Chromium smoke checks via the DevTools Protocol (Node 22+).
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {serve} from './serve.mjs';
let chrome=process.env.CHROME;
if(!chrome) for(const candidate of ['chromium','google-chrome','chromium-browser']) {
  try{execFileSync(candidate,['--version'],{stdio:'ignore'});chrome=candidate;break;}catch{}
}
if(!chrome) throw new Error('Install Chromium/Chrome or set CHROME to its executable.');
const profile=await mkdtemp(join(tmpdir(),'falsewake-browser-'));
const server=serve(0);await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}/FALSEWAKE/`;
const processChrome=spawn(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket;
try {
  const endpoint=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Chrome startup timed out')),20000);
    let output='';processChrome.stderr.on('data',chunk=>{output+=chunk;const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
    processChrome.on('error',error=>{clearTimeout(timer);reject(error);});
  });
  const port=new URL(endpoint).port;
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await once(socket,'open');
  let next=0;const pending=new Map(),errors=[];
  socket.addEventListener('message',message=>{
    const data=JSON.parse(message.data);
    if(data.id&&pending.has(data.id)){const {resolve,reject,timer}=pending.get(data.id);clearTimeout(timer);pending.delete(data.id);data.error?reject(new Error(data.error.message)):resolve(data.result);}
    if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);
  });
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`${method} timed out`));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
  async function ready(){for(let i=0;i<200;i++){try{if(await evaluate("!!document.querySelector('[data-ready]')"))return;}catch{}await new Promise(r=>setTimeout(r,50));}throw new Error('Interface did not load: '+await evaluate('document.body?.innerText'));}
  async function reload(){await evaluate("document.querySelector('[data-ready]')?.removeAttribute('data-ready')");await send('Page.reload');await ready();}
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base});await ready();
  const results=await evaluate(`(async()=>{
    const $=s=>document.querySelector(s), click=s=>{const el=$(s);if(!el)throw Error('Missing '+s);el.click();};
    const check=(v,m)=>{if(!v)throw Error(m);};
    check(document.querySelectorAll('.villager').length===12,'12 seats');
    check($('.engine-status').textContent.includes('WASM'),'WASM indicator');
    click('#seat-5');check($('.character-hero h2').textContent==='Iona','Selection');
    click('#ask');check($('.action-pips strong').textContent==='3/ 4','Action budget');
    click('[data-action="tag"][data-id="2"]');check($('#seat-5').classList.contains('evil-hypothesis'),'Hypothesis');
    $('#notes').value='<script>not executable</script>';$('#notes').dispatchEvent(new Event('input',{bubbles:true}));
    click('#seat-0');click('#seat-5');check($('#notes').value.includes('<script>'),'Escaped notes');
    click('#execute');check($('#modal').open,'Execution confirmation');click('[data-action="close"]');
    click('#nav-evidence');click('[data-action="pin"]');check(document.querySelectorAll('.pinned').length>0,'Pin');
    click('[data-action="pinned"]');check(document.querySelectorAll('.evidence-card').length===1,'Pinned filter');
    click('#nav-grimoire');check(document.querySelectorAll('.grimoire-card').length===13,'13 role cards');
    $('#role-search').value='Drunk';$('#role-search').dispatchEvent(new Event('input',{bubbles:true}));
    check(document.querySelectorAll('.grimoire-card').length===2,'Role search includes descriptions');
    $('#role-search').value='';$('#role-search').dispatchEvent(new Event('input',{bubbles:true}));
    click('[data-filter="Tyrant"]');check(document.querySelectorAll('.grimoire-card').length===1,'Family filter');
    click('#nav-village');click('[data-action="help"]');check($('#modal').open,'Help dialog');click('[data-action="close"]');
    check(!document.querySelector('script:not([src])'),'No injected script');
    return 'Selection, actions, notes, hypotheses, journal pins, grimoire search/filter, confirmations, help';
  })()`);
  console.log(`Browser: ${results}`);
  await reload();
  const restored=await evaluate(`document.querySelector('#notes').value==='<script>not executable</script>'&&document.querySelector('.action-pips strong').textContent==='3/ 4'`);
  if(!restored)throw new Error('Save/replay did not restore notes and engine state');
  await evaluate(`localStorage.clear()`);await reload();
  await mkdir('.build/screenshots',{recursive:true});
  for(const [label,width,height] of [['desktop',1440,1100],['mobile',390,844],['narrow',320,740]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
    await new Promise(r=>setTimeout(r,100));
    const overflow=await evaluate(`document.documentElement.scrollWidth>innerWidth`);
    if(overflow)throw new Error(`${label} layout overflows horizontally`);
    const hidden=await evaluate(`Array.from(document.querySelectorAll('.villager')).some(b=>{const r=b.getBoundingClientRect();return r.left<0||r.right>innerWidth;})`);
    if(hidden)throw new Error(`${label} has offscreen villager buttons`);
    const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    await writeFile(`.build/screenshots/${label}.png`,Buffer.from(screenshot.data,'base64'));
    console.log(`Browser: ${label} (${width}px), no overflow; screenshot saved.`);
  }
  const external=await evaluate(`performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin!==location.origin).map(r=>r.name)`);
  if(external.length)throw new Error('Unexpected external resources: '+external.join(', '));
  if(errors.length)throw new Error('Uncaught browser errors: '+errors.join(', '));
  console.log('Browser smoke checks passed, including subpath WASM loading and local save replay.');
} finally {
  socket?.close();processChrome.kill('SIGTERM');server.closeAllConnections();server.close();
  await new Promise(r=>setTimeout(r,250));await rm(profile,{recursive:true,force:true,maxRetries:3});
}
