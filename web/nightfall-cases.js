// Public case metadata only. No hidden assignments, answers, or solver inputs.
export const NIGHTFALL_CASES = [
 {
  id:'warded-lantern',number:1,store:'falsewake.nightfall.v1',
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
  id:'hollow-ward',number:2,store:'falsewake.nightfall.v1.hollow-ward',
  title:'The hollow ward',caption:'THE HOLLOW WARD',symbol:'broken-shield',
  subtitle:'A promise of protection. A shield that will not hold.',
  description:'Wardbreaker removes protection before the attack. Find another way to keep the watch alive.',
  roster:'These four hide one Drunk, one Smokescreen, one Wardbreaker and one Whisperer. The other eight identities are certified, but their powers can still be impaired.',
  order:'Night order: old Taint expires, Wardbreaker removes the victim\'s Ward, Whisperer attacks, remaining Wards expire, then dawn.',
  policy:'Wardbreaker removes a real Ward from the Whisperer\'s intended victim before the attack. Immunity is not a Ward. There is no Rotmonger in this case.',
  planning:'A Ward alone will not stop this attack. Plan who will face the night. Unused actions do not carry over.',
  hints:[
   'Wardbreaker removes Wards, not immunity. Which certified helper survives without a shield?',
   'A Courier mark on #05 draws the attack before #12. With no Rotmonger, old Taint expires before the next attack; no new Taint disables that immunity first.',
   'Compare a healthy Lantern reading with an Auditor reading of the same suspect. Good appearance plus a mismatched role identifies the Drunk; accuse the other three.'
  ]
 }
];
export function nightfallCase(id){return NIGHTFALL_CASES.find(c=>c.id===id)||null;}
