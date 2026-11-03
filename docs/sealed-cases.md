# Sealed dawn: v0.4 rules and ABI v2

Two authored twelve-seat investigations, with unique numbered character claims and original role sigils. All people are alive and statements describe one frozen dawn. There are no executions, visits, night attacks, position swaps, or changing effects in this mode.

## Public roster and truth conditions

Case 01 has three Evil enemies, one Good Drunk, and eight other Good Citizens. Case 02 replaces one Citizen with a Good Devilmask. The Drunk and Devilmask are distinct people. A healthy Good character reports a correct observation; the Good Drunk's observation is wrong; an enemy may tell the truth or lie. An Evil appearance is not an Evil team.

All ordinary allegiance clues read apparent alignment. In case 01 registered Evil equals the three enemies. In case 02 it also includes the Good Devilmask. Single-person Burden readings see the Drunk or Devilmask; single-person impairment readings see the Drunk (there is no temporary Taint in a sealed case). There is no true-team investigation.

Broad scopes of three or six seats give only presence/absence. Exact counts are restricted to a speaker's two living neighbors. Other readings ask about one person or compare two people. No statement includes its speaker among its targets. Each claim has a declared capability; a character does not get arbitrary questions.

## Characters

| Claimed character | Sealed reading |
| --- | --- |
| Countkeeper | Exact apparent-Evil count among its two living neighbors. |
| Lantern Reader | One living neighbor's apparent team. |
| Bellkeeper | Any apparent Evil in six consecutive other seats? |
| Lookout | Any apparent Evil in three consecutive other seats? |
| Kinseeker | Do two selected other people appear to share a team? |
| Gatekeeper | Does exactly one of two selected others appear Evil? |
| Twinwatch | Do both selected others appear Evil? |
| Compass | Any apparent Evil in the next three living seats clockwise? |
| Backtracker | The same question counterclockwise. |
| Farwatch | The opposite seat's apparent team. |
| Hollow Eye | Does one other person appear to be a Burden? |
| Taintreader | Does one other person appear impaired? |

Each case uses every claim once, in a different order. Good ordinary characters really have their claimed identities. Hidden Burdens and enemies borrow claims. The revealed enemies have three distinct character identities (Forger, Familiar, Whisperer); in this fixed-dawn mode they share the public permission to bluff, with no additional active powers. Enemy subtype is not a solver target.

## Player actions

Open any unopened testimony for free. Mark private Good/Evil hypotheses, take notes, pin evidence, and submit exactly three suspect numbers. A wrong trio costs one of three Resolve and excludes that whole trio only. It gives no individual hit count. Repeating an excluded trio is rejected without penalty. The correct trio wins; three wrong trios lose. Either ending reveals all identities and compares each report with the correct **observation**, including misleading appearances.

The optional assistant is hidden initially. It enumerates only public rules, opened statements, and rejected trios. It never consults the authored solution, unopened statements, or personal notes. The separate theory checker filters that same set by all the user's proposed Good/Evil labels jointly. A possible theory is not a proven fact.

## Validation scope

The independent test model enumerates 1,980 possible assignments for case 01 (three Evil plus one distinct Good Drunk) and 15,840 for case 02 (also one distinct Good Devilmask). With all twelve statements, each case has exactly one enemy trio and exactly one placement of its Good Burdens. Tests compare the independent evaluator with WASM after **every opened statement**, including forced-role masks and role support counts, then submit an evidence-derived winning trio with no Resolve loss.

This proves the enemy team and Burden placement for these two fixed authored cases, not arbitrary enemy subtypes, the dynamic sandbox, future role combinations, or a procedural generator. Independent proof reports are written to `.build/case-1-validation.json` and `.build/case-2-validation.json`.

## Numeric ABI v2

All arguments and results are signed 32-bit integers. Seat indices are zero-based internally and displayed as #01 through #12. A mask uses bit `1 << seat`.

| Export | Meaning |
| --- | --- |
| `fd_version()` | 2. |
| `fd_reset(id)` | Open case 1 or 2; invalid IDs are atomic. |
| `fd_command(op,target)` | 1: open numbered seat; 2: accuse a three-bit trio. 0 means success. |
| `fd_state(field)` | 0 case ID; 1 opened mask; 2 Resolve; 3 status (0 playing, 1 won, 2 lost); 4 journal size. |
| `fd_claim(seat)` | Public claimed-character ID, even before opening testimony. |
| `fd_clue(seat,field)` | 0 predicate; 1 target mask; 2 reported value. All return -1 before reading, except in debrief. |
| `fd_entry(index,field)` | 0 operation; 1 seat/trio argument; 2 accusation result. |
| `fd_analysis(field)` | 0 assignments; 1 distinct trios; 2 forced Good; 3 forced Evil; 4 forced Drunk; 5 forced Devilmask. |
| `fd_support(seat,role)` | Number of evidence-compatible worlds supporting family 1 Citizen, 2 Drunk, 3 Devilmask, 4 Enemy. |
| `fd_theory(good,evil)` | Count compatible worlds also fitting both hypothesis masks. |
| `fd_compatible(evil,drunk,mask)` | Whether a hypothetical assignment fits public evidence, not whether it is the actual world. |
| `fd_reveal(seat,field)` | Only after ending: 0 family; 1 correct observation; 2 whether report was correct; 3 actual unique character ID. |

Predicate IDs: 1 apparent-Evil presence, 2 exact living-neighbor count, 3 one person's apparent team, 4 same apparent team, 5 both apparent Evil, 6 one-person Burden, 7 one-person impairment, 8 exactly-one apparent Evil. All except 2 are Boolean (0/1). Predicate 2 has exactly two targets in sealed cases.

Errors: 1 invalid input, 2 terminal case, 3 duplicate read, 4 not exactly three suspects, 5 already rejected trio, 6 full journal. Invalid commands do not mutate state. The journal has capacity 32; a legal run needs at most 15 entries.

## Replay v2

`{version:2, caseId:1|2, commands:[[op,target],...]}` stores accepted commands only. UI annotations add selected seat, tags, pins, and notes, with length/type bounds. The adapter validates imports and restores the existing run on any failed command. Maximum 15 commands and 40 KB upload. Old version-1 replays are deliberately incompatible because both authored solutions and clue semantics changed.

Storage keys: `falsewake.sealed.v2.1`, `falsewake.sealed.v2.2`. Old slots are not deleted. Changing language never changes the numeric state or replay schema. Notes are escaped, never interpreted as HTML.

Browser-local WASM is not anti-cheat: deliberate source or memory inspection can discover a solution. Only the normal public API is designed not to leak hidden information.
