# FALSEWAKE implementation plan

## Current milestone — v0.7, uncertainty in a helper

Continue on `main`, with tested builds deployed through GitHub Pages.

[The borrowed light](docs/borrowed-light.md) removes the guarantee on one helper's role. Seven helpers have certified identities. #12 is known Good and shares the Lantern Reader and Drunk roles with the one Good suspect. The public charter discloses this uncertainty. One audit can establish how to interpret three days of readings.

The chapter uses the existing Wardbreaker night order, four daily actions, and the shared engine's appearance and impairment rules. The proof covers all 24 suspect permutations under both helper conditions. A player following the public evidence can keep everyone alive and identify the trio on the first verdict. The analyst separately reports which teams and Drunk positions are forced.

Keep all three chapters accessible from the casebook. Each uses its own save and replay ID. The native proof, independent model, WASM replay tests and four-language browser flows run in the existing CI before the Pages publish step.

## Non-negotiable design commitments

1. **Broad scope means less detail.** Three/six-person readings report apparent Evil present/absent. Exact counts stay with nearest living neighbors. Keep each ability to one short question.
2. **Appearances are not True Evil.** True team, registered team, visible role, claim and impairment remain separate. Explicit death/end reveals are not ordinary scans.
3. **Distinct numbered characters.** Use #01-#12 and claim-based sigils, never hidden-role art. Default identities are unique. Sandbox enemy bluffs use a 90% unused / 10% deliberate-copy branch per enemy.
4. **Believable testimony and history.** Raw information scopes exclude the speaker; Evil may be truthful. Old reports preserve their actual time and numbered targets.

Relative ability strength still needs playtesting. More complicated wording is not a substitute for balance. See [docs/rules-v04.md](docs/rules-v04.md).

## Delivered foundation

- **Portable interface:** responsive village, inspector, notes, hypotheses, grimoire, budgets, executions, protection, corruption, death reveals and terminal states. C++/WASM rules, no JavaScript runtime fallback, local saves and CI/Pages.
- **Sealed cases:** two fixed-dawn puzzles, public-evidence solver, independent reference proofs, hints, debriefs and replay tools. Proof covers enemy teams and Good Burdens, not all enemy subtypes.
- **Four languages:** English, Simplified Chinese, Spanish and Japanese; numeric state and symbols stay language-independent. Notes are never translated. Native-speaker editorial review is still desirable.
- **Nightfall chapter 01:** The warded lantern, a three-day/two-night case about protection, impaired witnesses and cleansing order. A safe policy is checked in all 24 public-roster arrangements.
- **Nightfall chapter 02:** The hollow ward, about removal versus consumption, immunity, and the order of impairment expiry. It has its own 24-arrangement proof and save.
- **Nightfall chapter 03:** The borrowed light, with one uncertain helper, an affordable identity check and a 48-arrangement strategy proof.

Keep the interaction matrix: Courier + Smokescreen + Lantern/Auditor; Wardmaker + Whisperer; impaired Cleanser; Neverdead + Taint; Drunk versus cleansing; historical neighbors; Wardbreaker + Wardmaker + Neverdead. Separate expiry, removal and consumption before any reactive power depends on them.

## Later milestones

**Reusable effects:** define shared phase primitives, source-death behavior, durations and bounded trigger queues when multiple cases need them. Then add visits, bonds and multiple attack sources, with private/public views and loop-termination tests.

**Procedural cases:** seeded hidden-world generation, reproducible IDs, difficulty measurements, unique team/Burden constraints and action-budget win-policy proofs. New disguises remains claim randomization only. Reject ambiguous or unwinnable generated cases.

**Android:** bundle the static UI and WASM in a Capacitor shell. Add pinned dependencies, real WebView/device tests, offline asset checks, safe areas/back navigation, migration, icons and debug APK CI. Release keys remain user-controlled secrets. No APK is delivered by this milestone.

## Architecture and compatibility

`core/engine.cpp` remains the simulation shared by sandbox and Nightfall. `core/nightfall.cpp` supplies case selection, public rosters, mission bounds and dynamic analysis. `core/cases.cpp` supplies the separate sealed-case solver. `web/nightfall-cases.js` contains public descriptions only, never answers. Test-only reference models never enter `dist/`.

Chapter 01 uses `falsewake.nightfall.v1`. Chapters 02 and 03 use the suffixes `.hollow-ward` and `.borrowed-light`. Existing sandbox, sealed and language slots remain compatible. Additive fn_select and state field 10 preserve ABI v1's original entry points and snapshot shape.

Keep relative URLs, local assets, escaped annotations and accessible text beside sigils. Browser WASM is not anti-cheat. Never force-push, change the existing license, commit generated binaries/screenshots, or request a broad access token.
