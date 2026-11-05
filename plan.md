# FALSEWAKE implementation plan

## Current milestone: v0.6 - a second Nightfall investigation

Continue directly on `main`, with tested builds deployed through GitHub Pages. **The hollow ward** adds one new enemy interaction: Wardbreaker removes a Ward before an attack, but cannot remove immunity. The public roster replaces Rotmonger with Wardbreaker. This is an authored chapter using the shared C++ simulation, not a new procedural generator.

The chapter selector provides independent progress, notes, pins and replay saves. Both chapters remain accessible immediately. Chapter 01 keeps its rules and existing save. Exact rules, effect ordering, proof limits and additive API details are in [docs/hollow-ward.md](docs/hollow-ward.md).

### Acceptance gates

- Ward removal is a distinct public event, not protection consumption or expiry. It reveals an affected seat, never the hidden saboteur.
- One new role, a unique sigil, short ability text, no broad exact-count or True Evil scan.
- Separate case selection in the core; invalid IDs and malformed cross-case replays are atomic.
- Evidence analysis uses the selected public roster and restores the complete live case after enumeration.
- Native and independent-reference tests verify a safe observation-based winning policy in all 24 permitted chapter-02 arrangements within the budget, with everyone alive and no Resolve loss.
- Counterexamples cover relying on a Ward alone and redirecting danger toward an innocent. Source-death behavior and actual-Ward versus promised-Ward distinctions are explicit.
- Original first-case behavior remains compatible. A local differential test compares 4,000 commands and analyses against the deployed v0.5 WASM; existing CI regression suites still run.
- Case-local saves, status cards, deep links, notes, pins, reset and replay import/export work in all four languages.
- Native sanitizers, all Node suites and real-HTTP browser suites must pass before Pages deployment. Check the actual publish job, not just a green build.

The proof establishes the enemy trio and Good Drunk, not every enemy subtype. Wardbreaker and Whisperer can remain indistinguishable. This is a bounded teaching case; eight certified helpers remain a published premise.

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

## Next: uncertainty in helpers

Remove one certified-helper guarantee only after modeling all permitted helper conditions and proving a safe evidence-based policy. Do not simply add an unannounced liar. Give the player a visible reason to investigate reliability and an affordable way to recover. Introduce only one new ambiguity or ability interaction at a time.

Keep the interaction matrix: Courier + Smokescreen + Lantern/Auditor; Wardmaker + Whisperer; impaired Cleanser; Neverdead + Taint; Drunk versus cleansing; historical neighbors; Wardbreaker + Wardmaker + Neverdead. Separate expiry, removal and consumption before any reactive power depends on them.

## Later milestones

**Reusable effects:** define shared phase primitives, source-death behavior, durations and bounded trigger queues when multiple cases need them. Then add visits, bonds and multiple attack sources, with private/public views and loop-termination tests.

**Procedural cases:** seeded hidden-world generation, reproducible IDs, difficulty measurements, unique team/Burden constraints and action-budget win-policy proofs. New disguises remains claim randomization only. Reject ambiguous or unwinnable generated cases.

**Android:** bundle the static UI and WASM in a Capacitor shell. Add pinned dependencies, real WebView/device tests, offline asset checks, safe areas/back navigation, migration, icons and debug APK CI. Release keys remain user-controlled secrets. No APK is delivered by this milestone.

## Architecture and compatibility

`core/engine.cpp` remains the simulation shared by sandbox and Nightfall. `core/nightfall.cpp` supplies case selection, public rosters, mission bounds and dynamic analysis. `core/cases.cpp` supplies the separate sealed-case solver. `web/nightfall-cases.js` contains public descriptions only, never answers. Test-only reference models never enter `dist/`.

Chapter 01 keeps `falsewake.nightfall.v1`; chapter 02 adds `falsewake.nightfall.v1.hollow-ward`. Existing sandbox, sealed and language slots remain compatible. Additive fn_select and state field 10 preserve ABI v1's original entry points and snapshot shape.

Keep relative URLs, local assets, escaped annotations and accessible text beside sigils. Browser WASM is not anti-cheat. Never force-push, change the existing license, commit generated binaries/screenshots, or request a broad access token.
