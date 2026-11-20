# Nightfall chapter 03 — The borrowed light

[Play chapter 03](https://asr-tanyi.github.io/FALSEWAKE/nightfall.html#case=borrowed-light)

Rain has blurred the watch register. The village can vouch for #12's allegiance, but who is holding the lantern?

## Public charter

- #03, #04, #07 and #10 contain Smokescreen, Wardbreaker, Whisperer and one Good villager. One role belongs to each seat.
- #12 and the Good suspect hold the Lantern Reader and Drunk roles between them. #12 always claims Lantern Reader and can take readings. The other seven helpers have certified identities. Everyone starts free of Taint.
- An unimpaired reader reports the target's apparent allegiance. A Drunk reader reports the opposite appearance. Cleansing removes temporary Taint and leaves permanent Drunkenness in effect. An audit compares a visible role with its claim. An unmarked Smokescreen can pass that audit.
- Play four actions per day, up to one use per helper. The four suspects cannot activate powers. Keep all twelve villagers alive through two nights, then submit a trio on Day 3.
- #12 starts marked. Each night old Taint expires, Wardbreaker removes the intended victim's Ward and the Whisperer attacks. The lowest-numbered marked Good villager takes priority. Neverdead's functioning immunity blocks the attack. A survivor takes fresh Taint. Remaining Wards expire at dawn. [Full night order](hollow-ward.md).

An audit of #12 costs one action. It can explain a reading already in the timeline. Old reports keep their original day, targets and wording. The assistant considers 48 possible starting arrangements, combining the 24 suspect permutations with the two possible identities of #12. A single fixed arrangement is playable.

<details>
<summary>Strategy spoilers and proof scope</summary>

| Day | Actions | What the evidence establishes |
| --- | --- | --- |
| 1 | Have the Courier mark #05, the Guild Auditor check #12, and #12 read #03. End the day. | #05 is Neverdead and draws the attack. A match at #12 means the Lantern Reader holds the lantern. A mismatch means the Drunk holds it. Interpret the reading of #03 accordingly and record its appearance. |
| 2 | Audit the still-unmarked #03. Mark #07, then have #12 read #07. End the day. | A Good appearance on Day 1 plus a mismatch on Day 2 clears #03. A marked #07 has lost any Smokescreen disguise. #05 still draws the attack ahead of #07. |
| 3 | Mark #04, then have #12 read #04. Submit the other three suspects once you identify the Good seat. | No nights remain, so marking a lower seat is safe. If the evidence places #03, #07 and #04 on the enemy team, the public roster clears #10. |

This route uses three, three and two investigation actions. The reader stays clear of night Taint. The verdict costs no investigation action. Both the native simulation and an independent JavaScript model complete the route with all twelve villagers alive and all three Resolve points in each of the 48 arrangements.

The analyst can identify the Good suspect and the Drunk separately. The Drunk may sit at #12. Wardbreaker and Whisperer can remain interchangeable. A premature mark on a lower-numbered Good suspect can still cause a death.

</details>

## Saves and verification

The case ID is `borrowed-light`, the save slot is `falsewake.nightfall.v1.borrowed-light` and the WASM selector is `fn_select(3)`. The replay envelope, command encoding and public snapshot shape use the same v1 format as the earlier chapters. Open the case from the casebook or Nightfall chapter selector. The replay inspector can restore an exported investigation.

`npm run test:nightfall` exercises all three native cases, the independent models and WASM contracts. `npm run test:browser` plays the new case to a verdict in English, Simplified Chinese, Spanish and Japanese, including case switching, notes, pins and replay restoration.
