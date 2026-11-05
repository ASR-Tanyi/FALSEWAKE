# Nightfall chapter 02: The hollow ward (v0.6)

Play `nightfall.html#case=hollow-ward`. The chapter selector keeps both Nightfall investigations accessible without locking either one. Chapter 01, **The warded lantern**, keeps its original rules, authored arrangement, replay version and save slot. This document extends [nightfall.md](nightfall.md); it does not redefine chapter 01.

## One new interaction

**Wardbreaker (Evil Agent): Before the Whisperer attacks, remove the intended victim's Ward. This does not remove immunity.**

The new character has a distinct broken-shield sigil. It borrows a unique Citizen claim during play; the true sigil appears only on an explicit end-of-case reveal. It is available in chapter 02, not added to the sandbox's bluff pool. No ordinary investigation gains a true-team bypass.

The public suspect seats remain #03, #04, #07 and #10. In this chapter they contain one Good Drunk, one Smokescreen, one Wardbreaker and one Whisperer. There is **no Rotmonger**. The other eight identities are certified, not necessarily healthy. #12 starts marked. Claims and actual characters are all distinct.

The objective is still to keep everyone alive through two nights and identify the three enemies on Day 3. Four actions per day; one use per helper per day; suspect powers and executions are unavailable. Any death immediately fails the case. A wrong trio costs one Resolve and rules out only that whole trio. Three attempts, two nights and the 32-command bound are unchanged.

## Precise effect order

1. Expire old temporary Taint. No Rotmonger applies new Taint in this chapter.
2. Determine the Whisperer's victim using the public policy: the lowest-numbered marked living Good villager, otherwise the established priority starting with #08.
3. If a living Wardbreaker exists and that victim has a real Ward, remove it. Emit public event **23: Ward removed** with the affected seat, but no saboteur identity. No real Ward means no removal event.
4. Resolve the attack: functioning Neverdead immunity first, then any real Ward still present, otherwise death. A surviving victim becomes Tainted after the attack.
5. Expire remaining Wards, advance the day, refresh actions, and check the no-death mission boundary.

Removal, consumption, and expiry are different. A removed Ward blocks nothing. A Ward consumed by an attack is reflected by the existing Ward-survival event. Unused Wards expire at dawn. Wardbreaker cannot remove Neverdead immunity, marks, permanent roles, or historical observations. The removal stops if the Wardbreaker is dead; the shared-core native tests cover this, even though ordinary player executions are disabled here.

A successful first-case routine is deliberately unsafe here: a Ward on #12 is removed and #12 dies. The public charter and visible warning disclose that before the player commits a night. Case-specific hints escalate from a conceptual prompt to an explicit strategy.

## Validation (contains strategy spoilers)

Both cases enumerate 24 permutations from their own public four-role roster. They are authored cases, not 24 randomly selected levels. Chapter 02 uses a different authored arrangement from chapter 01.

A safe observation-based policy for every permitted arrangement:

- Day 1: Courier marks certified Neverdead #05, moving the attack ahead of #12. Compare a healthy Lantern reading and Auditor reading of the first suspect. A spare action may promise a Ward to #05 to observe that removal is not consumption.
- Day 2: compare the next suspect. #05's old Taint expires before the next attack, and there is no Rotmonger to renew it first. The immunity works without a new Ward or a cleansing action.
- Day 3: compare the third suspect. Good appearance plus an inconsistent visible role identifies Drunk. If none of the first three has that signature, the published roster identifies the fourth as Drunk. Accuse the other three.

The policy uses only public identities and observed readings, not a hardcoded answer. Native ASan/UBSan tests execute it in all 24 worlds. A separate test-only JavaScript model repeats that proof, compares the authored WASM run after every action, and independently enumerates consistent public histories. Seeded action testing also compares accepted actions and rejections with that model.

The enemy team becomes unique; Wardbreaker and Whisperer may remain interchangeable. Do not claim unique enemy subtypes, safety of every strategy, arbitrary enemy-AI solvability, or validation of the unrestricted sandbox. Counterexamples include Ward-only protection, a dangerous mark on the Good suspect, and confusion between removal and immunity. `.build/hollow-validation.json` records the authored route and evidence counts; generated artifacts are not committed.

## Additive API and compatibility

`fn_version()` stays 1 because the original contract is preserved. New `fn_select(id)` accepts 1 or 2 and returns 0, or rejects other integers without mutation. Existing `fn_reset()` always resets chapter 01. State field 10 reports the active chapter; existing fields and snapshot shapes do not change. The adapter's `reset(caseId)` restarts the selected case; omitting the argument restarts its current case.

Both replays retain `{version:1, kind:'nightfall', caseId, commands}`. Valid case IDs are `warded-lantern` and `hollow-ward`. Imports select the explicitly named case only after validation; invalid cross-case imports restore the exact previous case, state and history. No public export accepts an arbitrary hidden arrangement.

The dynamic analyst uses the selected public roster, replays commands through the shared C++ simulation, compares only public outcomes, and restores the live case after enumeration. It never compares true roles, secret Taint, real Ward flags, or report truth to decide compatible histories. Nightfall-only events remain excluded from ordinary information/report classification.

## Interface and saves

- Chapter 01: existing `falsewake.nightfall.v1` (unchanged).
- Chapter 02: `falsewake.nightfall.v1.hollow-ward` (new).
- Sealed, sandbox and language saves remain untouched.

Case cards show Ready, In progress, Solved or Try again from local save metadata. These are navigation indicators, not rule evidence, remote achievements, or a security feature. Loading a case always validates and replays its numeric commands; imported progress metadata cannot manufacture a victory. Restart clears only the selected investigation. Notes and pins stay case-local. URLs retain the language parameter while adding `#case=<id>`.

English, Simplified Chinese, Spanish and Japanese include the charter, new ability, event, hints and selector. Catalog placeholders and cross-language state invariants are tested. CJK/system fonts remain local; there is no translation API or external runtime asset. Translation wording has not received independent native-speaker review.

## Running the new checks

```sh
node scripts/hollow-native-test.mjs
npm run build
node --test tests/hollow.test.mjs
node scripts/hollow-browser-test.mjs
```

The normal `npm test` and `npm run test:browser` commands include these checks alongside all previous suites. The browser suite exercises HTTP under `/FALSEWAKE/`, case switching, independent saves, deep links, complete wins in four languages, invalid cross-case replay imports, a losing route, and 1440/390/320px layouts. An environment that blocks local browser navigation is a failed browser check, not a pass; GitHub CI must pass the real HTTP suites before publishing.
