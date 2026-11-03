// Independent TEST-ONLY model. This file is never shipped in dist/.
// It restates the public charter, then simulates only certified helper actions.
export const SUSPECTS=[2,3,6,9], POOL=580+8;
const BASE_ROLES=[1,2,11,9,4,5,12,7,10,13,6,8];
const CLAIMS=[1,2,3,14,4,5,15,7,10,16,6,8];
const bit=i=>1<<i,pop=m=>{let n=0;for(;m;m&=m-1)++n;return n;};
export const WORLDS=[];
for(const a of [9,11,12,13])for(const b of [9,11,12,13])if(a!==b)
for(const c of [9,11,12,13])if(c!==a&&c!==b)for(const d of [9,11,12,13])if(d!==a&&d!==b&&d!==c)WORLDS.push([a,b,c,d]);
export class Reference {
 constructor(world){this.day=1;this.resolve=3;this.actions=4;this.status=0;this.rejected=[];this.events=[];
  this.p=BASE_ROLES.map((role,id)=>({id,role,claim:CLAIMS[id],evil:role>=11&&role<=13,alive:true,taint:false,marked:id===11,ward:false,promised:false,used:0}));
  world.forEach((role,j)=>Object.assign(this.p[SUSPECTS[j]],{role,evil:role!==9}));this.emit(22,-1,11,1,bit(11));
 }
 emit(kind,source=-1,target=-1,value=0,subjects=0,truth=1){this.events.push({id:this.events.length,kind,day:this.day,source,target,value,subjects,truth});}
 registration(p){return p.role===10&&!p.taint?1:p.role===11&&!p.marked?0:+p.evil;}
 command(op,source=0,target=0){
  if(this.status)throw Error('ended');
  if(op===2){
   const a=this.p[source],b=this.p[target];if(!a||!b||SUSPECTS.includes(source)||!a.alive||!b.alive||this.actions===0||a.used===this.day||[4,10].includes(a.claim)||(source===target&&a.claim!==1))throw Error('invalid');
   this.actions--;a.used=this.day;
   if(a.claim===1){const group=[(source+11)%12,(source+1)%12];let actual=group.reduce((n,i)=>n+this.registration(this.p[i]),0);this.emit(2,source,source,a.taint?(actual+1)%3:actual,group.reduce((m,i)=>m|bit(i),0),!a.taint);}
   else if(a.claim===8||a.claim===5){const actual=a.claim===8?this.registration(b):+(b.role===11&&!b.marked||b.role===b.claim);this.emit(a.claim===8?3:4,source,target,a.taint?1-actual:actual,bit(target),!a.taint);}
   else if(a.claim===2){b.promised=true;if(!a.taint)b.ward=true;this.emit(6,source,target);}
   else if(a.claim===6){if(!a.taint)b.marked=true;this.emit(5,source,target);}
   else if(a.claim===7){if(!a.taint)b.taint=false;this.emit(7,source,target);}
   else throw Error('unmodeled');
  }else if(op===4){
   if(source||target||this.day>=3)throw Error('invalid');this.emit(11);this.p.forEach(p=>p.taint=false);
   this.p[4].taint=true; // Public case-specific policy, not an inferred secret.
   const victim=this.p.find(p=>p.marked&&!p.evil)||this.p[7];
   const immune=victim.role===4&&!victim.taint;
   if(immune||victim.ward){if(!immune)victim.ward=false;this.emit(13,-1,victim.id,+immune);victim.taint=true;}
   else{victim.alive=false;this.emit(12,-1,victim.id);}
   this.p.forEach(p=>{p.ward=false;p.promised=false;});this.day++;this.actions=4;this.emit(14,-1,-1,this.day);
   if(this.p.some(p=>!p.alive)){this.status=2;this.emit(15,-1,-1,2);}
  }else if(op===5){
   if(target||source<0||source>4095||(source&~POOL)||pop(source)!==3||this.day<3||this.rejected.includes(source))throw Error('invalid');
   const evil=this.p.reduce((m,p)=>p.evil?m|bit(p.id):m,0),correct=+(source===evil);this.emit(21,-1,-1,correct,source);
   if(correct)this.status=1;else{this.rejected.push(source);if(--this.resolve===0)this.status=2;}
   if(this.status)this.emit(15,-1,-1,this.status);
  }else throw Error('invalid');
  return this.snapshot();
 }
 snapshot(){return {day:this.day,resolve:this.resolve,actions:this.actions,status:this.status,nightsLeft:3-this.day,suspects:POOL,
  people:this.p.map(p=>({id:p.id,alive:p.alive,claim:p.claim,used:p.used===this.day,marked:p.marked,ward:p.promised,role:this.status||!p.alive?p.role:0,team:this.status||!p.alive?+p.evil:-1})),
  events:this.events.map(e=>({...e,truth:this.status&&[2,3,4].includes(e.kind)?+e.truth:-1}))};}
}
export function publicAnalysis(commands,observed){
 const candidates=WORLDS.map(w=>{const e=new Reference(w);try{for(const c of commands)e.command(...c);return e;}catch{return null;}}).filter(Boolean).filter(e=>{
  const candidate=e.snapshot();
  // Match only information available during play, even for a terminal debrief.
  const strip=s=>({...s,people:s.people.map(({role,team,...p})=>p),events:s.events.map(({truth,...event})=>event)});
  return JSON.stringify(strip(candidate))===JSON.stringify(strip(observed));
 });
 let good=4095,evil=4095,drunk=4095,smoke=4095;const teams=new Set();
 for(const c of candidates){const e=c.p.reduce((m,p)=>p.evil?m|bit(p.id):m,0);teams.add(e);good&=4095^e;evil&=e;drunk&=bit(c.p.findIndex(p=>p.role===9));smoke&=bit(c.p.findIndex(p=>p.role===11));}
 return {worlds:candidates.length,teams:teams.size,good:candidates.length?good:0,evil:candidates.length?evil:0,drunk:candidates.length?drunk:0,smoke:candidates.length?smoke:0};
}
