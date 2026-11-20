// Public case metadata only. No hidden assignments, answers, or solver inputs.
const wardbreakerOrder="Night order: old Taint expires, Wardbreaker removes the victim's Ward, Whisperer attacks, remaining Wards expire, then dawn.";
export const NIGHTFALL_CASES = [
 {
  id:'warded-lantern',number:1,worlds:24,store:'falsewake.nightfall.v1',
  title:'The warded lantern',caption:'THE WARDED LANTERN',symbol:'lantern',
  subtitle:'Two nights. One innocent mistake could cost a life.',
  description:'Protect the reader, then restore the reliability of their observations.',
  roster:'These four hide one Drunk, one Smokescreen, one Rotmonger and one Whisperer. The other eight identities are certified, but their powers can still be impaired.',
  order:'Night order: old Taint expires, Rotmonger acts, Whisperer attacks, Wards expire, then dawn. Hidden effects are not disclosed here.',
  policy:'Rotmonger Taints #05 on both nights in this case. This fixed policy is public; the culprit\'s identity is not.',
  planning:'Plan protection before ending the day. Unused actions do not carry over.',
  hints:[
   'Protect #12 before each night. A Ward prevents death, not the Whisperer\'s Taint.',
   'Use a healthy Cleanser before the Lantern Reader after a night attack. Compare readings from the same moment.',
   'Among the four suspects, a healthy reading of Good plus a mismatched visible role identifies the Drunk. Good plus a matching role can be Smokescreen.'
  ]
 },
 {
  id:'hollow-ward',number:2,worlds:24,store:'falsewake.nightfall.v1.hollow-ward',
  title:'The hollow ward',caption:'THE HOLLOW WARD',symbol:'broken-shield',
  subtitle:'A promise of protection. A shield that will not hold.',
  description:'Wardbreaker removes protection before the attack. Find another way to keep the watch alive.',
  roster:'These four hide one Drunk, one Smokescreen, one Wardbreaker and one Whisperer. The other eight identities are certified, but their powers can still be impaired.',
  order:wardbreakerOrder,
  policy:'Wardbreaker removes a real Ward from the Whisperer\'s intended victim before the attack. Immunity is not a Ward. There is no Rotmonger in this case.',
  planning:'A Ward alone will not stop this attack. Plan who will face the night. Unused actions do not carry over.',
  hints:[
   'Wardbreaker removes Wards, not immunity. Which certified helper survives without a shield?',
   'A Courier mark on #05 draws the attack before #12. With no Rotmonger, old Taint expires before the next attack; no new Taint disables that immunity first.',
   'Compare a healthy Lantern reading with an Auditor reading of the same suspect. Good appearance plus a mismatched role identifies the Drunk; accuse the other three.'
  ]
 },
 {
  id:'borrowed-light',number:3,worlds:48,store:'falsewake.nightfall.v1.borrowed-light',
  title:'The borrowed light',caption:'THE BORROWED LIGHT',symbol:'scales',
  subtitle:"Rain has washed the role from #12's entry in the watch register.",
  description:'Establish who is holding the lantern before you interpret its light.',
  uncertainHelper:11,
  roster:'The four suspects hide Smokescreen, Wardbreaker, Whisperer and one Good villager. The other seven helpers have certified roles. Everyone starts free of Taint.',
  order:wardbreakerOrder,
  policy:'#12 is Good. Between #12 and the Good suspect, one is the Lantern Reader and one is the Drunk. A Drunk using the lantern reports the opposite of the target’s appearance, even after cleansing.',
  planning:'Wardbreaker strips the victim’s Ward. Check which marked Good villager will face the Whisperer tonight.',
  hints:[
   'The Guild Auditor can check whether #12 matches the register. A single audit lets you interpret later lantern readings while the reader stays clear of Taint.',
   'On Day 1, mark #05, audit #12 and read #03. Leave #03 unmarked so the Auditor can compare that claim on Day 2.',
   'On Day 2, audit #03. A Good appearance with a mismatched claim identifies the Good suspect. Mark and read #07 today, then #04 after the last night. A mark exposes Smokescreen. If all three are Evil, clear #10.'
  ]
 }
];
export function nightfallCase(id){return NIGHTFALL_CASES.find(c=>c.id===id)||null;}
