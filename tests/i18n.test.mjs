import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {LOCALE_CODES,MESSAGE_ROWS,catalogs,normalizeLocale,chooseLocale,setLocale,locale,t,tr,ta,formatList,formatNumber,searchText,missingMessages} from '../web/i18n.js';
import {ROLES,PEOPLE,eventText,eventLabel} from '../web/data.js';
import {CASE_CHARACTERS,clueText,seatList} from '../web/characters.js';
import {Engine} from '../web/engine.js';import {CaseEngine} from '../web/cases-engine.js';
const placeholders=s=>[...s.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map(m=>m[1]).sort();
const tags=s=>[...s.matchAll(/<[^>]*>/g)].map(m=>m[0]).sort();
test('all four catalogs are complete with exact placeholder and safe markup parity',()=>{
 assert.ok(MESSAGE_ROWS.length>=600);assert.equal(new Set(MESSAGE_ROWS.map(r=>r[0])).size,MESSAGE_ROWS.length);
 for(const row of MESSAGE_ROWS){assert.equal(row.length,4);for(const text of row){assert.ok(typeof text==='string'&&text.trim());assert.deepEqual(placeholders(text),placeholders(row[0]),row[0]);assert.deepEqual(tags(text),tags(row[0]),row[0]);for(const tag of tags(text))assert.match(tag,/^<(?:\/?(?:strong|em|kbd|code)|br\s*\/?)>$/);}}
});
test('locale negotiation respects requested, saved and ordered browser preferences',()=>{
 assert.equal(chooseLocale({requested:'es-MX',stored:'ja',languages:['zh-CN']}),'es');
 assert.equal(chooseLocale({requested:'invalid',stored:'ja-JP',languages:['es']}),'ja');
 assert.equal(chooseLocale({languages:['fr-FR','zh-SG','en']}),'zh-Hans');
 assert.equal(chooseLocale({languages:['zh-Hant-TW','ja']}),'ja');
 assert.equal(chooseLocale({stored:'bad',languages:[]}),'en');
 for(const s of ['zh','zh_CN','zh-Hans-CN'])assert.equal(normalizeLocale(s),'zh-Hans');
 for(const s of [null,1,'xx','zh-TW','javanese','english'])assert.equal(normalizeLocale(s),null);
});
test('missing strings fall back without accepting an unsupported language',()=>{
 setLocale('es');assert.equal(t('Unlisted fallback {n}',{n:3}),'Unlisted fallback 3');assert.equal(setLocale('unknown'),false);assert.equal(locale(),'es');setLocale('en');
});
test('translations escape parameters and permit only catalog-owned safe markup',()=>{
 setLocale('en');const payload='<img src=x onerror=alert(1)>"&';
 assert.ok(!tr('Correct observation: {report}',{report:payload}).includes('<img'));assert.match(ta('Pin {name}',{name:payload}),/&lt;img/);
 assert.match(tr('The actual count was <strong>{p2}</strong>; the report said <strong>{p3}</strong>. {p4}',{p2:2,p3:1,p4:payload}),/<strong>2<\/strong>/);
 assert.ok(!tr('<script>bad</script>').includes('<script>'));assert.equal(t('Pin {name}',{name:'{count}'}),'Pin {count}');
});
test('every role, new rule, clue predicate and public event has all translations',()=>{
 missingMessages.clear();
 for(const code of LOCALE_CODES){setLocale(code);
  for(const r of [...Object.values(ROLES),...Object.values(CASE_CHARACTERS)])for(const field of ['name','family','text','hint','active'])if(r[field])assert.ok(catalogs[code][r[field]],r[field]);
  for(const p of PEOPLE)assert.ok(catalogs[code][p.epithet]);
  for(let kind=1;kind<=20;kind++)for(let value=0;value<3;value++){
   const e={kind,value,source:0,target:1,subjects:6,day:1};assert.equal(typeof eventLabel(e),'string');assert.doesNotMatch(eventText(e),/\{\w+\}/);
  }
  for(let type=1;type<=8;type++)for(const value of [0,1])assert.doesNotMatch(clueText({type,value,targets:6}),/\{\w+\}/);
 }
 assert.deepEqual([...missingMessages],[]);setLocale('en');
});
test('localized lists and search retain unambiguous seat numbers',()=>{
 setLocale('es');assert.equal(searchText('M\u00c1SCARA'),searchText('mascara'));assert.equal(formatList(['#01','#02']),'#01 y #02');
 assert.equal(seatList(63),'#01\u2013#06');setLocale('ja');assert.equal(formatNumber(15840),'15,840');assert.ok(seatList(5).includes('#03'));setLocale('en');
});
test('language changes cannot change a seeded sandbox or its replay',async()=>{
 const bytes=await readFile(new URL('../dist/core.wasm',import.meta.url));const e=new Engine((await WebAssembly.instantiate(bytes,{})).instance.exports);
 e.reset(317);e.command(1,1);e.command(2,10,2);const snapshot=e.snapshot(),history=structuredClone(e.history);
 for(const code of LOCALE_CODES){setLocale(code);snapshot.events.forEach(eventText);assert.deepEqual(e.snapshot(),snapshot);assert.deepEqual(e.history,history);
  const other=new Engine((await WebAssembly.instantiate(bytes,{})).instance.exports);assert.deepEqual(other.replay(history,317),snapshot);
 }setLocale('en');
});
test('both new sealed solutions are identical in every language',async()=>{
 const bytes=await readFile(new URL('../dist/cases.wasm',import.meta.url));
 for(const id of [1,2]){
  const e=new CaseEngine((await WebAssembly.instantiate(bytes,{})).instance.exports);e.reset(id);for(let i=0;i<12;i++)e.command(1,i);
  const before=e.export(),analysis=e.analysis(),snapshot=e.snapshot();assert.equal(analysis.worlds,1);
  for(const code of LOCALE_CODES){setLocale(code);assert.deepEqual(e.export(),before);assert.deepEqual(e.analysis(),analysis);snapshot.clues.forEach(c=>clueText(c));
   assert.throws(()=>e.command(1,0),error=>error.message===t('That testimony is already open.'));assert.deepEqual(e.replay(before),snapshot);
   const copy=new CaseEngine((await WebAssembly.instantiate(bytes,{})).instance.exports);copy.replay(before);copy.command(2,analysis.evil);assert.equal(copy.snapshot().status,1);
  }
 }setLocale('en');
});
test('new symbol and translation assets are local and shared by both entry points',async()=>{
 for(const f of ['i18n.js','i18n.css','locales/rules.js','characters.js','characters.css','symbols.js'])assert.ok((await readFile(new URL('../dist/'+f,import.meta.url),'utf8')).length);
 for(const f of ['index.html','casebook.html'])assert.match(await readFile(new URL('../dist/'+f,import.meta.url),'utf8'),/href="\.\/characters\.css"/);
});
