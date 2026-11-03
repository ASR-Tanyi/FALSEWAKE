// Public character copy only. No hidden roster or solution is stored here.
import {t,formatList} from './i18n.js';
export const seatNumber=id=>id>=0&&id<12?'#'+String(id+1).padStart(2,'0'):t('The village');
export function seatList(mask){
 const ids=Array.from({length:12},(_,i)=>i).filter(i=>mask&(1<<i));
 if(ids.length>=3&&ids.at(-1)-ids[0]===ids.length-1)return seatNumber(ids[0])+'\u2013'+seatNumber(ids.at(-1));
 return formatList(ids.map(seatNumber));
}
export const CASE_CHARACTERS={
 1:{name:'Countkeeper',symbol:'count',text:'Learn exactly how many of your nearest living neighbors appear Evil. Skip dead seats.'},
 2:{name:'Lantern Reader',symbol:'lantern',text:'Read one living neighbor: do they appear Evil?'},
 3:{name:'Bellkeeper',symbol:'bell',text:'Sense whether any of six consecutive other seats appear Evil. No exact count.'},
 4:{name:'Lookout',symbol:'tower',text:'Sense whether any of three consecutive other seats appear Evil. No exact count.'},
 5:{name:'Kinseeker',symbol:'links',text:'Choose two other villagers. Do they appear to be on the same team?'},
 6:{name:'Gatekeeper',symbol:'gate',text:'Choose two other villagers. Does exactly one appear Evil?'},
 7:{name:'Twinwatch',symbol:'twin',text:'Choose two other villagers. Do both appear Evil?'},
 8:{name:'Compass',symbol:'compass',text:'Sense Evil among the next three living seats clockwise. No exact count.'},
 9:{name:'Backtracker',symbol:'back',text:'Sense Evil among the next three living seats counterclockwise. No exact count.'},
 10:{name:'Farwatch',symbol:'scope',text:'Read the seat opposite you: do they appear Evil?'},
 11:{name:'Hollow Eye',symbol:'hollow',text:'Read one other villager: do they appear to be a Burden? This is not a team check.'},
 12:{name:'Taintreader',symbol:'flask',text:'Read one other villager: do they appear impaired? This does not distinguish Drunk from Taint.'},
 101:{name:'Drunk',symbol:'cup',text:'Good, permanently impaired, and unaware. Your claimed information is wrong.'},
 102:{name:'Devilmask',symbol:'mask',text:'Good, but appears Evil to ordinary readings. Your own information is truthful when healthy.'},
 103:{name:'Forger',symbol:'smoke',text:'An enemy behind a borrowed character. Night powers are inactive in sealed cases.'},
 104:{name:'Familiar',symbol:'thorn',text:'An enemy behind a borrowed character. Night powers are inactive in sealed cases.'},
 105:{name:'Whisperer',symbol:'whisper',text:'An enemy behind a borrowed character. Night powers are inactive in sealed cases.'}
};
export function clueText(c,override=c.value){
 const seats=seatList(c.targets),count=override;
 const keys={
  1:['None of {seats} appear Evil.','At least one of {seats} appears Evil.'],
  3:['{seats} appears Good.','{seats} appears Evil.'],
  4:['{seats} appear to be on different teams.','{seats} appear to be on the same team.'],
  5:['{seats} do not both appear Evil.','Both {seats} appear Evil.'],
  6:['{seats} does not appear to be a Burden.','{seats} appears to be a Burden.'],
  7:['{seats} does not appear impaired.','{seats} appears impaired.'],
  8:['It is not the case that exactly one of {seats} appears Evil.','Exactly one of {seats} appears Evil.']
 };
 if(c.type===2)return t('Among my living neighbors ({seats}), exactly {count} appear Evil.',{seats,count});
 return t(keys[c.type]?.[override]||'The villager has nothing more to add.',{seats,count});
}
