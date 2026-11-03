// Source-language message IDs; catalog row order never affects identity or saves.
import ui from './locales/ui.js';
import game from './locales/game.js';
import help from './locales/help.js';
import rules from './locales/rules.js';
import nightfall from './locales/nightfall.js';
export const LOCALE_CODES = ['en','zh-Hans','es','ja'];
export const LANGUAGE_NAMES = ['English','\u7b80\u4f53\u4e2d\u6587','Espa\u00f1ol','\u65e5\u672c\u8a9e'];
export const STORAGE_KEY = 'falsewake.language.v1';
export const MESSAGE_ROWS = [...ui,...game,...help,...rules,...nightfall];
export const catalogs = Object.fromEntries(LOCALE_CODES.map((code,i)=>[code,Object.fromEntries(MESSAGE_ROWS.map(row=>[row[0],row[i]]))]));
export const missingMessages = new Set();
export function normalizeLocale(value) {
  if(typeof value!=='string')return null;
  const tag=value.trim().replaceAll('_','-').toLowerCase();
  if(tag==='zh'||tag==='zh-cn'||tag==='zh-sg'||/^zh-hans(?:-|$)/.test(tag))return 'zh-Hans';
  for(const code of ['en','es','ja'])if(tag===code||tag.startsWith(code+'-'))return code;
  return null;
}
export function chooseLocale({requested,stored,languages=[]}={}) {
  return [requested,stored,...languages].map(normalizeLocale).find(Boolean)||'en';
}
let current='en';
if(typeof document!=='undefined') {
  let stored;try{stored=localStorage.getItem(STORAGE_KEY);}catch{}
  current=chooseLocale({requested:new URL(location.href).searchParams.get('lang'),stored,
    languages:navigator.languages?.length?navigator.languages:[navigator.language]});
}
export const locale=()=>current;
export function setLocale(value,{persist=true}={}) {
  const next=normalizeLocale(value);if(!next)return false;
  current=next;
  if(typeof document!=='undefined') {
    document.documentElement.lang=current;document.documentElement.dir='ltr';
    if(persist){try{localStorage.setItem(STORAGE_KEY,current);}catch{}}
    // Keep a shared language URL in sync when present. No game state is encoded here.
    const url=new URL(location.href);if(url.searchParams.has('lang')){url.searchParams.set('lang',current);history.replaceState(null,'',url);}
    window.dispatchEvent(new Event('falsewake:language'));
  }
  return true;
}
const interpolate=(message,params,escapeValue=v=>String(v))=>message.replace(/\{([a-zA-Z][\w]*)\}/g,(token,key)=>Object.hasOwn(params,key)?escapeValue(params[key]):token);
function message(key) {
  if(!Object.hasOwn(catalogs.en,key))missingMessages.add(key);
  return (Object.hasOwn(catalogs[current],key)&&catalogs[current][key])||(Object.hasOwn(catalogs.en,key)&&catalogs.en[key])||key;
}
export function t(key,params={}) {return interpolate(message(key),params);}
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Rich translations allow a tiny, attribute-free formatting vocabulary. Values
// are escaped AFTER static markup, so notes/names/errors can never introduce HTML.
export function tr(key,params={}) {
  const safe=escapeHTML(message(key)).replace(/&lt;(\/?(?:strong|em|kbd|code)|br\s*\/?)&gt;/g,'<$1>');
  return interpolate(safe,params,escapeHTML);
}
export function ta(key,params={}) {return escapeHTML(t(key,params));}
export const formatNumber=value=>new Intl.NumberFormat(current).format(value);
export const formatList=values=>new Intl.ListFormat(current,{style:'long',type:'conjunction'}).format(values);
export const searchText=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase(current);
export function languagePicker(){
  return `<label class="language-picker" for="language-select"><span>${tr('Language')}</span><select id="language-select" aria-label="${ta('Language')}">${LOCALE_CODES.map((code,i)=>`<option value="${code}" lang="${code}"${code===current?' selected':''}>${LANGUAGE_NAMES[i]}</option>`).join('')}</select></label>`;
}
export function localizeDocument(page) {
  document.documentElement.lang=current;document.documentElement.dir='ltr';
  document.title='FALSEWAKE - '+t(page==='casebook'?'The sealed casebook':'A village of broken truths');
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-content]').forEach(el=>el.setAttribute('content',t(el.dataset.i18nContent)));
}
export function initLanguageUI(page,render) {
  localizeDocument(page);
  document.addEventListener('change',event=>{if(event.target.id==='language-select')setLocale(event.target.value);});
  window.addEventListener('falsewake:language',()=>{
    localizeDocument(page);
    document.querySelector('#modal')?.close();
    document.querySelector('#toast')?.classList.remove('visible');
    render();
  });
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY&&normalizeLocale(event.newValue))setLocale(event.newValue,{persist:false});});
}
