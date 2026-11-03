import {t} from './i18n.js';
import {seatNumber,seatList,clueText} from './characters.js';
export const PEOPLE = [
  ['Mara','The watchful one',0], ['Oren','Keeper of the flame',1],
  ['Silas','A familiar stranger',2], ['Elowen','Lost in a waking dream',3],
  ['Bram','The last to leave',4], ['Iona','Nothing escapes her',5],
  ['Vesper','A letter never sent',6], ['Felix','Mender of broken things',7],
  ['Rowan','An unwelcome omen',8], ['Thorne','Soft words, sharp edges',9],
  ['Ada','Always on her way',10], ['Lenna','A light in the hollow',11]
].map(([name,epithet,portrait],id)=>({id,name,epithet,portrait}));
// Only this small, implemented script is offered in the first playable case.
export const ROLES = {
 1:{name:'Countkeeper',family:'Citizen',icon:'count',target:false,active:'Read the circle',
    text:'Learn exactly how many of your nearest living neighbors appear Evil. Skip dead seats.',hint:'A wider view gives less detail. Exact counts stay close to home.'},
 2:{name:'Wardmaker',family:'Citizen',icon:'shield',target:true,active:'Promise a ward',
    text:'Choose another living villager. A functioning ward blocks one night attack, then expires at dawn. It cannot stop an execution.',hint:'A promised ward is not proof that its maker is healthy.'},
 3:{name:'Archivist',family:'Citizen',icon:'book',target:true,active:'Verify a report',
    text:'Choose another living villager. Was their latest factual report correct about what it observed?',hint:'A correct report can describe a disguise. Truthful does not mean Good.'},
 4:{name:'Neverdead',family:'Citizen',icon:'infinity',passive:true,
    text:'You cannot die from an attack or execution while your ability functions. Taint disables this protection.',hint:'Surviving an execution uses the daily attempt, but costs no Resolve.'},
 5:{name:'Guild Auditor',family:'Citizen',icon:'scales',target:true,active:'Audit a claim',
    text:"Compare another villager's claimed role with the role you can see. A disguise can fool you.",hint:'A marked Smokescreen no longer looks like the borrowed role.'},
 6:{name:'Courier',family:'Citizen',icon:'feather',target:true,active:'Place a mark',
    text:'Place a lasting, visible mark on another living villager. A marked Smokescreen loses their disguise.',hint:'Evil can forge a tangible mark too. Marked Good villagers attract the Whisperer.'},
 7:{name:'Cleanser',family:'Citizen',icon:'drop',target:true,active:'Perform cleansing',
    text:'Remove temporary Taint from another living villager. An impaired Cleanser cannot cleanse. Drunk is permanent.',hint:'Cleansing is not confirmation that a target was ever Tainted.'},
 8:{name:'Lantern Reader',family:'Citizen',icon:'lantern',target:true,active:'Read an appearance',
    text:'Choose another living villager. Learn whether they appear Evil, not their true team.',hint:'Devilmask looks Evil. An unmarked Smokescreen looks Good.'},
 9:{name:'Drunk',family:'Burden',icon:'cup',passive:true,
    text:'Good, permanently impaired, and unaware. Your claimed information is wrong.',hint:'A permanent role, not temporary Taint. Cleansing does not cure you.'},
 10:{name:'Devilmask',family:'Burden',icon:'mask',passive:true,
    text:'Good, but appears Evil to ordinary readings. Your own information is truthful when healthy.',hint:'Correct information about registration can still implicate an innocent.'},
 11:{name:'Smokescreen',family:'Agent',icon:'smoke',passive:true,
    text:'Evil, but your team and borrowed role appear innocent until you are marked.',hint:'Courier plus Lantern Reader can expose the changing appearance.'},
 12:{name:'Rotmonger',family:'Agent',icon:'thorn',passive:true,
    text:'Each night, secretly Taint one living Citizen until the next night. You borrow a Citizen identity.',hint:'Taint corrupts information and disables beneficial powers. It does not change allegiance.'},
 13:{name:'Whisperer',family:'Tyrant',icon:'whisper',passive:true,
    text:'Attack one Good villager each night, preferring marked victims. A survivor becomes Tainted. You borrow a Citizen identity.',hint:"A successful rescue may leave the survivor's next ability unreliable."},
 14:{name:'Lookout',family:'Citizen',icon:'tower',target:true,active:'Survey three seats',
    text:'From a chosen seat, scan the next three other living villagers clockwise. Learn only whether any appear Evil.',hint:'The numbered targets are recorded with the clue, even if someone later dies.'},
 15:{name:'Bellkeeper',family:'Citizen',icon:'bell',target:true,active:'Survey six seats',
    text:'From a chosen seat, scan the next six other living villagers clockwise. Learn only whether any appear Evil.',hint:'A wider view gives less detail. Exact counts stay close to home.'},
 16:{name:'Kinseeker',family:'Citizen',icon:'links',target:true,active:'Compare a pair',
    text:'Read a chosen villager and the next other living villager clockwise. Do they appear to be on the same team?',hint:'You are excluded from the pair. At least two other villagers must be alive.'},
 17:{name:'Taintreader',family:'Citizen',icon:'flask',target:true,active:'Check impairment',
    text:'Read one other villager: do they appear impaired? This does not distinguish Drunk from Taint.',hint:'Impairment is a condition, not an allegiance.'},
 18:{name:'Gatekeeper',family:'Citizen',icon:'gate',target:true,active:'Check one of two',
    text:'Read a chosen villager and the next other living villager clockwise. Does exactly one appear Evil?',hint:'You are excluded from the pair. At least two other villagers must be alive.'},
 19:{name:'Hollow Eye',family:'Citizen',icon:'hollow',target:true,active:'Read a Burden',
    text:'Read one other villager: do they appear to be a Burden? This is not a team check.',hint:'A condition clue is specific, not a broad scan of true teams.'}
};
export const name=seatNumber;
export const isReport=e=>[2,3,4,8,16,17,18,19,20].includes(e.kind);
export function eventText(e) {
  const target=name(e.target);
  switch(e.kind) {
    case 1:return t(ROLES[e.value]?.text || 'The villager has nothing more to add.');
    case 2:return e.subjects?clueText({type:2,targets:e.subjects,value:e.value}):t('I have no other living neighbors.');
    case 3:return clueText({type:3,targets:e.subjects||1<<e.target,value:e.value});
    case 4:return t(e.value?"{target}'s claim matches their visible role.":"{target}'s claim does not match their visible role.",{target});
    case 5:return t('A mark was attempted on {target}. Check the board for its visible token.',{target});
    case 6:return t('A ward is promised to {target} until the next dawn.',{target});
    case 7:return t('A cleansing ritual was performed on {target}. Permanent roles are unchanged.',{target});
    case 8:return t(e.value?'Report #{number} was true when it was made.':'Report #{number} was false when it was made.',{number:e.target+1});
    case 9:return t(e.value?'{target} was executed. They were Evil.':'{target} was executed. They were Good.',{target});
    case 10:return t('{target} survived the execution. No Resolve was lost.',{target});
    case 11:return t('The bell falls silent. Night descends on the village.');
    case 12:return t('{target} died in the night. Their true identity is now revealed.',{target});
    case 13:return t(e.value?'{target} survived a night attack, protected by their immunity.':'{target} survived a night attack, protected by a ward.',{target});
    case 14:return t('Dawn breaks. Four investigations are available.');
    case 15:return t(e.value===1?'Every Evil villager has fallen. The village is free.':'The investigation has ended. The hollow keeps its secrets.');
    case 16:return clueText({type:1,targets:e.subjects,value:e.value});
    case 17:return clueText({type:4,targets:e.subjects,value:e.value});
    case 18:return clueText({type:7,targets:e.subjects,value:e.value});
    case 19:return clueText({type:6,targets:e.subjects,value:e.value});
    case 20:return clueText({type:8,targets:e.subjects,value:e.value});
    default:return t('An unknown event was recorded.');
  }
}
export function eventLabel(e) {
  return t(({1:'Testimony',2:'Neighbor count',3:'Appearance reading',4:'Role audit',5:'Mark',6:'Protection',
    7:'Cleansing',8:'Verification',9:'Execution',10:'Survival',11:'Nightfall',12:'Death',
    13:'Survival',14:'Dawn',15:'Case closed',16:'Presence check',17:'Pair comparison',18:'Impairment',19:'Burden reading',20:'Pair comparison'})[e.kind] || 'Event');
}
