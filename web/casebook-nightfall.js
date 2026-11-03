// Insert the new mode without coupling the sealed-case controller to its rules.
import {tr} from './i18n.js';
import {icon} from './art.js';
const app=document.querySelector('#app');
function advertise(){
 const cards=app?.querySelector('.case-cards');if(!cards||app.querySelector('#open-nightfall'))return;
 const banner=document.createElement('section');banner.className='nightfall-promo';
 banner.innerHTML=`<div><p class="eyebrow">${tr('NEW / NIGHTFALL')}</p><h2>${tr('The warded lantern')}</h2><p>${tr('Survive two nights. Learn why a saved witness can still mislead you.')}</p></div><a class="button primary" id="open-nightfall" href="./nightfall.html">${tr('Begin the night watch')} ${icon('arrow')}</a>`;
 cards.before(banner);
}
if(app){new MutationObserver(advertise).observe(app,{childList:true});advertise();}
