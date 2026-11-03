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
  1: {name:'Countkeeper',family:'Citizen',icon:'eye',target:false,active:'Read the circle',
    text:'Learn how many of your two fixed-seat neighbors register as Evil, including dead neighbors.',
    hint:'Registration is not allegiance. Compare counts before and after a mark.'},
  2: {name:'Wardmaker',family:'Citizen',icon:'shield',target:true,active:'Promise a ward',
    text:'Choose another living villager. A functioning ward blocks one night attack, then expires at dawn. It cannot stop an execution.',
    hint:'A promised ward is not proof that its maker is healthy.'},
  3: {name:'Archivist',family:'Citizen',icon:'book',target:true,active:'Verify a report',
    text:'Choose a living villager with a report. Learn whether their latest factual report was true when it was made.',
    hint:'Verification is itself testimony. An impaired or evil verifier can lie.'},
  4: {name:'Neverdead',family:'Citizen',icon:'flame',passive:true,
    text:'You cannot die from an attack or execution while your ability functions. Taint disables this protection.',
    hint:'Surviving an execution uses the daily attempt, but costs no Resolve.'},
  5: {name:'Guild Auditor',family:'Citizen',icon:'scales',target:true,active:'Audit a claim',
    text:'Choose a living villager. Learn whether their claimed role matches their true role.',
    hint:'A mismatched claim could hide an enemy or a Good Drunk.'},
  6: {name:'Courier',family:'Citizen',icon:'feather',target:true,active:'Place a mark',
    text:'Place a lasting, visible mark on a living villager. A marked Smokescreen loses their Good disguise.',
    hint:'Evil can forge a tangible mark too. Marked Good villagers attract the Whisperer.'},
  7: {name:'Cleanser',family:'Citizen',icon:'drop',target:true,active:'Perform cleansing',
    text:'Remove temporary Taint from a living villager. You cannot change a Drunk\'s true role. An impaired Cleanser cannot cleanse.',
    hint:'Cleansing is not confirmation that a target was ever Tainted.'},
  8: {name:'Trueglass',family:'Citizen',icon:'star',target:true,active:'Look beyond the mask',once:true,
    text:'Once per case, learn a living villager\'s true team, ignoring registration disguises. Your own Taint can still corrupt the result.',
    hint:'A very strong clue, but only from a healthy, genuine Trueglass.'},
  9: {name:'Drunk',family:'Burden',icon:'moon',passive:true,
    text:'You are Good but believe you are a Countkeeper. Your neighbor count is false: one higher, wrapping from two back to zero.',
    hint:'A permanent role, not temporary Taint. Cleansing does not cure you.'},
  10: {name:'Devilmask',family:'Burden',icon:'mask',passive:true,
    text:'You are Good, but register as Evil while your ability functions. A true-team check ignores the disguise.',
    hint:'Correct information about registration can still implicate an innocent.'},
  11: {name:'Smokescreen',family:'Agent',icon:'moon',passive:true,
    text:'You are Evil but register as Good until marked. In this case you claim Archivist and invert your verification reports.',
    hint:'Courier plus Countkeeper can expose the changing registration.'},
  12: {name:'Rotmonger',family:'Agent',icon:'drop',passive:true,
    text:'Each night, secretly Taint one living Citizen until the next night. You claim Courier and can forge a visible mark.',
    hint:'Taint corrupts information and disables beneficial powers. It does not change allegiance.'},
  13: {name:'Whisperer',family:'Tyrant',icon:'crown',passive:true,
    text:'Attack one Good villager each night, preferring marked victims. If they survive, Taint them until the next night. You claim Countkeeper.',
    hint:'A successful rescue may leave the survivor\'s next ability unreliable.'}
};
const TESTIMONY = {
  1:'A ward lasts until the next dawn. It will not stop the executioner\'s blade.',
  2:'There is one Burden among seats 03 through 06.',
  4:'An execution cannot kill me while my power is working.',
  5:'Of Mara and Thorne, exactly one is lying about their role.',
  6:'Ada is Evil. Her courier seal is a stolen one.',
  7:'I can remove Taint, but a Drunk\'s true role cannot be cured.',
  8:'I register as Evil. That does not make me your enemy.',
  10:'A mark strips Smokescreen of their disguise. But it can attract the Tyrant.',
  11:'Three enemies came to this village. Not every false voice belongs to one.'
};
export const name = id => PEOPLE[id]?.name || 'The village';
export function eventText(e) {
  const target=name(e.target);
  switch(e.kind) {
    case 1:return TESTIMONY[e.value] || 'The villager has nothing more to add.';
    case 2:return `${e.value===0?'Neither':e.value===1?'Exactly one':'Both'} of my neighbors ${e.value===1?'registers':'register'} as Evil.`;
    case 3:return `${target} belongs to the ${e.value?'Evil':'Good'} team.`;
    case 4:return `${target}'s claimed role ${e.value?'matches':'does not match'} their true role.`;
    case 5:return `A mark was attempted on ${target}. Check the board for its visible token.`;
    case 6:return `A ward is promised to ${target} until the next dawn.`;
    case 7:return `A cleansing ritual was performed on ${target}. Permanent roles are unchanged.`;
    case 8:return `Report #${e.target+1} was ${e.value?'true':'false'} when it was made.`;
    case 9:return `${target} was executed. They were ${e.value?'Evil':'Good'}.`;
    case 10:return `${target} survived the execution. No Resolve was lost.`;
    case 11:return 'The bell falls silent. Night descends on the village.';
    case 12:return `${target} died in the night. Their true identity is now revealed.`;
    case 13:return `${target} survived a night attack, protected by ${e.value?'their immunity':'a ward'}.`;
    case 14:return `Dawn breaks. Four investigations are available.`;
    case 15:return e.value===1?'Every Evil villager has fallen. The village is free.':'The investigation has ended. The hollow keeps its secrets.';
    default:return 'An unknown event was recorded.';
  }
}
export function eventLabel(e) {
  return ({1:'Testimony',2:'Neighbor count',3:'Team reading',4:'Role audit',5:'Mark',6:'Protection',
    7:'Cleansing',8:'Verification',9:'Execution',10:'Survival',11:'Nightfall',12:'Death',
    13:'Survival',14:'Dawn',15:'Case closed'})[e.kind] || 'Event';
}
