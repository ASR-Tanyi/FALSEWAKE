# FALSEWAKE implementation plan

## Current milestone: v0.5 - the first Nightfall investigation

Continue directly on `main`, with tested builds deployed through GitHub Pages. The new playable feature is **The warded lantern**, an authored three-day/two-night teaching case using the existing C++ night simulation. It demonstrates how a successful rescue can impair a witness, why cleansing must precede a reading, and how a mark can expose a disguise or endanger an innocent.

The precise contract and proof limits are in [docs/nightfall.md](docs/nightfall.md). This is a bounded dynamic-script milestone, not completion of an unrestricted role engine or a procedural village generator.

### Deliverables and acceptance gates

- A dedicated `nightfall.html` entry point linked from the casebook and sandbox, with numbered role sigils, certified-helper/suspect labels, action budget, two-night progression, and final trio verdict.
- Public charter: four suspects contain one Good Drunk, Smokescreen, Rotmonger and Whisperer. Eight helpers have certified identities, not guaranteed health. Normal readings still see appearances.
- An initial mark on #12; normal wards, marks, Taint, cleansing, attacks and historical reports resolve in the shared engine. No duplicate JavaScript runtime rules.
- Immutable event timeline with target filtering, pins, visible night summaries, annotations, and post-case report review.
- Optional dynamic analyst: replay all 24 public-roster arrangements and compare only observable histories, not secret identities or truth flags.
- Native and independent-reference proofs that an observation-based policy wins in all 24 permitted worlds without deaths or lost Resolve and within the actual action budget.
- Counterexamples for omitted protection, reading before cleansing, and marking an innocent who then attracts the attack. Invalid, repeated and terminal actions are atomic.
- Separate replay/save schema; old sandbox and sealed cases are untouched. Malformed imports preserve the live run.
- Complete English, Simplified Chinese, Spanish and Japanese presentation, with catalog/placeholder checks and real-browser workflows at desktop and mobile widths.
- Existing suites plus the new sanitizer, model, replay, fuzz and browser tests must pass before Pages publishes.

The proof identifies the enemy trio and Good Drunk. Rotmonger and Whisperer can remain interchangeable. Do not claim a unique full assignment when the observations only prove the team.

## Non-negotiable design commitments from v0.4

1. **Broader scope gives less detail.** Three/six-person readings answer apparent Evil present/absent. Exact counts stay with the nearest living neighbors. Keep each power to one short question.
2. **Read appearances, not True Evil.** Team, visible role, claim, impairment and report truth remain distinct. Disguises fool ordinary checks. Death/end-of-case revelation is explicit.
3. **Distinct numbered characters.** Keep #01-#12 and a specific role sigil. Unrevealed symbols depict claims, never hidden roles. Default identities are unique; sandbox enemy claims prefer unused roles 90% of the time and deliberately copy a Good claim 10% per enemy.
4. **Believable testimony.** Raw scopes exclude their speaker. Evil may be truthful. A historical clue retains its original targets and time after deaths, marks or changed reliability.

See [docs/rules-v04.md](docs/rules-v04.md). Relative role strength still needs playtesting; simple text alone is not proof of balance.

## Delivered foundation

### M1: portable game interface

Twelve-seat village, inspector, notes, hypotheses, evidence pins, searchable grimoire, budgets, executions, attacks, wards, marks, Taint, death reveals and terminal states. Authoritative C++/WASM, local command-replay saves and CI/Pages. No accounts, backend, telemetry or external runtime assets. Existing license preserved.

### M2a: sealed cases

Two authored fixed-dawn puzzles with short claims, public-rule enumeration, optional assistant, hints, debrief, theory checks and JSON replay. v0.4 re-authored and re-proved the enemy teams and Burden positions with independent reference models. Their proof does not cover the unrestricted night sandbox.

### Localization

Four-language catalogs are shared by every mode. IDs, numbers, symbols and command schemas remain language-independent. Personal notes are never translated. Translations are an initial editorial pass; independent native-speaker review remains valuable.

### M2b: bounded dynamic-script rigor

Nightfall now supplies a concrete action-budget and survival proof, public/private event separation, and reproducible counterexamples. The certified helper roster is an explicit teaching premise. No claim is made that every character in an ordinary hidden-role village can be trusted.

## Next: expand dynamics without overwhelming the player

- Add a second authored Nightfall case with one new interaction at a time; retain short, understandable abilities.
- Remove one certified-helper guarantee only after the expanded hypothesis model and win policy are verified.
- Promote phase ordering and duration semantics into reusable primitives when a second case demonstrates the need.
- Keep a role-interaction matrix covering Courier + Smokescreen + Lantern/Auditor, Wardmaker + Whisperer, impaired Cleanser, Neverdead + Taint, Drunk vs cleansing, and living-neighbor/history changes.
- Distinguish ward consumption, removal and expiry. Define source-death behavior before introducing reactive powers.
- Test misleading but legal public histories, not merely the authored answer. Prove a valid policy under the actual action budget and enemy behavior.

## Later: generalized synergy engine

Introduce reusable triggers, selectors, durations, visits, bonds, multiple attack sources and bounded reaction queues. Preserve historical snapshots. Keep public and private event views separate. Test termination and registration recursion before adding combinations. Identity-copying roles must explicitly authorize duplicate claims.

## Later: procedural cases

New disguises changes enemy claims only; it does not generate the hidden village. Real procedural generation needs seeded roles/worlds, reproducible IDs, uniqueness and action-budget validation, difficulty measures, and rejection of ambiguous or unwinnable cases.

## Later: Android

Bundle the static interface and WASM in a Capacitor Android WebView. WASM alone does not produce an APK. A separate milestone must provide the Android project, pinned dependencies, device/offline tests, safe areas, back navigation, save migration, icons and debug APK CI. Release signing stays in user-controlled secrets; no committed keys.

## Architecture and compatibility

- `core/engine.cpp`: sandbox simulation and ABI v2; living enemy sources now located by role instead of fixed seat. Original roster behavior is preserved.
- `core/bluffs.h`: deterministic unused-versus-copy claim allocator.
- `core/cases.cpp`: sealed-case state and static evidence enumeration, ABI v2.
- `core/nightfall.cpp`: includes the same simulation, adds the bounded mission and public-history analyst, exports `fn_*` ABI v1.
- `web/`: presentation, numeric adapters, symbols, escaped notes and local catalogs. No alternative JavaScript rules implementation.
- `tests/`: native sanitizer assertions, independent test-only models, replay, rejected-action atomicity, fuzzing and translation coverage.
- `scripts/`: builds, local server and real-HTTP Chrome suites.
- `docs/`: exact rules and limits of each proof.
- `dist/`, `.build/`: generated artifacts only; do not commit WASM, screenshots or reference outputs.

Nightfall uses `falsewake.nightfall.v1`; existing sandbox, sealed and language slots remain compatible. Keep relative URLs for Pages and future WebViews. Browser-local WASM is not an anti-cheat boundary. Do not force-push, alter the license, request broad tokens, or announce deployment success without checking the publishing job.
