// Runs in the same real HTTP browser as the chapter-selection checks.
export async function checkBorrowedLight({navigate,evaluate,setup,send,screenshot}){
 const page=fn=>evaluate(`(async()=>{${setup}return (${fn.toString()})({$,click,check,power,night});})()`);
 for(const lang of ['en','zh-Hans','es','ja']){
  const url=`nightfall.html?lang=${lang}#case=borrowed-light`;
  await navigate(url);
  await page(async ({$,click,check,power})=>{
   const {t}=await import('./i18n.js');
   click('[data-action="reset"]');click('[data-action="confirm-reset"]');
   check($('#nf-title').textContent===t('The borrowed light'),'Localized chapter title');
   check($('.nf-badge').textContent===t('Good helper · unverified role'),'Uncertain reader badge');
   check(!$('#nf-use').disabled && $('[data-action="tag"][data-id="2"]').disabled,'Good helper can read but cannot be accused');
   click('[data-action="rules"]');check($('#modal').open,'Public charter opened');click('[data-action="close"]');
   for(let i=0;i<3;i++)click('[data-action="hint"]');
   check(document.querySelectorAll('.reasoning-hints p').length===3,'All three hints available');
   click('[data-action="analyze"]');
   check($('.analysis-summary strong').textContent==='48','Both reader conditions are initially possible');
   power(5,11);click('[data-action="analyze"]');
   check($('.analysis-summary strong').textContent==='24','One audit establishes reader identity');
   power(10,4);power(11,2);
   $('#nf-notes').value='Check this reading against the register';
   $('#nf-notes').dispatchEvent(new Event('input',{bubbles:true}));
   click('#nf-tab-timeline');click('[data-action="pin"][data-id="1"]');
  });
  await navigate(url);
  await page(({ $,click,check,power,night })=>{
   check($('#nf-actions').textContent==='1/4','Deep link restores actions');
   check($('#nf-notes').value==='Check this reading against the register','Reader note survived reload');
   click('#nf-tab-timeline');check($('[data-event="1"]').classList.contains('nf-pinned'),'Audit pin survived reload');
   click('#nf-tab-circle');night();
   power(5,2);power(10,6);power(11,6);night();
   power(10,3);power(11,3);click('[data-action="analyze"]');
   const forced=$('[data-forced="evil"]').textContent.match(/#\d{2}/g);
   check(forced?.length===3,'All three enemies identified from evidence');
   for(const seat of forced){
    click('#nf-seat-'+(Number(seat.slice(1))-1));click('[data-action="tag"][data-id="2"]');
   }
   click('#nf-next');click('[data-action="confirm-verdict"]');
   check(!!$('.result-banner.won'),'Verdict accepted');
   click('#nf-seat-11');check(!!$('.debrief-note'),'Reader identity revealed in debrief');
  });
  await page(async ({$,click,check})=>{
   // Exercise the UI import route with exactly the replay and annotations in the save.
   const store='falsewake.nightfall.v1.borrowed-light',saved=localStorage.getItem(store);
   click('[data-case="hollow-ward"]');
   const previous=localStorage.getItem('falsewake.nightfall.v1.hollow-ward');
   click('#nf-seat-11');check($('#nf-notes').value!=='Check this reading against the register','Notes stay case-local');
   const otherSave=localStorage.getItem('falsewake.nightfall.v1.hollow-ward');
   check(!!previous && !!otherSave,'Chapter two still has its own save');
   const data=new DataTransfer();
   data.items.add(new File([saved],'borrowed.json',{type:'application/json'}));
   $('#replay-file').files=data.files;$('#replay-file').dispatchEvent(new Event('change'));
   for(let i=0;i<100 && !location.hash.includes('borrowed-light');i++)await new Promise(resolve=>setTimeout(resolve,20));
   check(location.hash==='#case=borrowed-light' && !!$('.result-banner.won'),'Cross-case replay restores chapter and victory');
   check($('#nf-notes').value==='Check this reading against the register','Replay restored notes');
   check(localStorage.getItem('falsewake.nightfall.v1.hollow-ward')===otherSave,'Import preserved other chapter');
   click('[data-action="reset"]');click('[data-action="confirm-reset"]');
   check($('#nf-actions').textContent==='4/4' && $('#nf-notes').value==='','Restart clears chapter three');
   check(localStorage.getItem('falsewake.nightfall.v1.hollow-ward')===otherSave,'Restart preserved other chapter');
   const {missingMessages}=await import('./i18n.js');
   check(!missingMessages.size,'Missing translations: '+[...missingMessages].join(', '));
  });
  for(const [width,height] of [[1440,1100],[390,844],[320,740]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
   await page(({check})=>{
    check(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
    for(const card of document.querySelectorAll('.nf-case-card')){
     const bounds=card.getBoundingClientRect();
     check(bounds.left>=0 && bounds.right<=innerWidth,'Every chapter card is visible');
    }
   });
   if(lang==='en' && width===390)await screenshot('borrowed-light-mobile');
  }
  console.log(`The borrowed light: ${lang} win, saves, replay, and desktop/mobile layouts passed.`);
 }
}
