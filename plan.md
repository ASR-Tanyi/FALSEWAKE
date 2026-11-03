# FALSEWAKE implementation plan

## Current milestone: v0.4 - focus, appearances, and distinct characters

Continue directly on `main`, with tested builds deployed through GitHub Pages. The night sandbox and two sealed cases remain separate modes. The rules requested in this milestone are implemented in both interfaces and their C++/WASM cores, not just in a design note.

### Four design commitments

1. **Broad scope gives less detail.** Three/six-person readings answer whether apparent Evil is present. Exact counts stay with the nearest living neighbors. Small pair or individual checks may be more precise. Keep a power to one understandable question.
2. **Information sees appearances.** Normal powers read registration, not True Evil. Disguises can fool team and role-consistency checks. True identity is revealed explicitly on death or case completion, not by an ordinary scan.
3. **Distinct numbered characters.** #01-#12 replace personal names in clues and actions. Each role has a distinct SVG sigil, shown according to the public claim until revelation. Default claims and true identities are unique. Seeded enemy bluffs favor unused claims 90% of the time, with a 10% duplicate branch per enemy.
4. **Believable testimony.** Raw clue scopes exclude the speaker, preventing accidental self-confessions. Enemies may tell the truth. Old reports retain their actual original target numbers after deaths or changed appearances.

The detailed contract is [docs/rules-v04.md](docs/rules-v04.md). Balance remains a playtesting task; simple does not automatically mean balanced.

### Deliverables and acceptance gates

- Rewrite the sealed cases using Boolean broad clues, focused local counts, and single-person condition checks.
- Re-prove unique enemy teams and Burden placements with an independent exhaustive reference model, checking every step of an evidence-derived zero-loss route.
- Replace portrait heads with claim-based role sigils in both boards and inspectors; preserve numbers, labels, keyboard access, and touch layouts.
- Update Countkeeper to skip dead seats, deduplicate a sole surviving neighbor, and freeze target masks in history.
- Replace the ordinary true-team scanner with Lantern Reader; make Auditor respect Smokescreen's visible-role disguise.
- Add deterministic, replayable enemy-disguise seeds without pretending the underlying village is procedurally generated.
- Keep English, Simplified Chinese, Spanish, and Japanese rule text synchronized and maintain placeholder/escaping checks.
- Bump both ABI and save formats to v2. Preserve old slots untouched; reject incompatible replay imports atomically.
- Run native sanitizers, WASM/reference tests, randomized-action tests, bluff-distribution checks, and real-browser interaction/language/layout tests before Pages deployment.

## Delivered foundation

### M1 - interface and portable rules

Responsive twelve-seat board, inspector, evidence, notes, hypotheses, grimoire, budgets, executions, night effects, game endings, real WASM, local saves, and CI/Pages. No backend, accounts, external runtime assets, or telemetry. Existing license is preserved.

### M2a - authored sealed cases

Two fixed-dawn puzzles with an optional evidence-only assistant, independent local saves, hints, debriefs, theory checking, and JSON replay import/export. v0.4 rewrites both puzzles rather than reinterpreting their old transcripts. The validation guarantee covers enemy teams and Good Burden placement, not the dynamic sandbox or every hidden enemy subtype.

### Localization

One presentation catalog for four languages. Numbers and lists are locale-aware; translations never become rule inputs. Language switching preserves numeric state, notes, and replay. Translations are an initial editorial pass; native-speaker review remains valuable.

## Next - small dynamic-script rigor

Freeze exact semantics for a small role set before adding the rest of the 160-role brainstorm. Formalize phase ordering, duration expiry, redirects, impairment, cleansing, protection, attacks, source death, and bounded reactions.

Preserve the regression chains: Courier + Smokescreen + Lantern Reader/Auditor; Wardmaker + Whisperer + impaired Cleanser; Neverdead + Taint; Cleanser + permanent Drunk; living-neighbor changes + historical evidence.

Validate authored dynamic puzzles against the actual action budget and enemy policy. Static uniqueness alone does not prove a dynamic case winnable. Add adversarial counterexamples, explanations, and a role-interaction matrix. Distinguish Ward removal from consumption. Do not use complex arithmetic or confusing wording as a balancing mechanism.

## Later - generalized synergy engine

Reusable triggers, selectors, conditions, durations, visits, bonds, multiple attack sources, and bounded queues. Separate private engine events from public observations. Snapshot registrations to avoid recursive neighbor dependencies. Property-test termination and historical correctness before adding more combinations. Identity-copying skills must explicitly authorize duplicates.

## Later - procedural cases

The current **New disguises** action only changes enemy claims. It is not a generated village. Future procedural generation needs reproducible case IDs, a seeded role/world generator, uniqueness proof, action-budget/win-path validation, difficulty scoring, and rejection of ambiguous or unwinnable scripts.

## Later - Android

Bundle the static interface and WASM in a Capacitor Android WebView. WASM alone does not create an APK. A separate milestone must add the Android project, pinned dependencies, device/offline tests, safe areas and back navigation, save migration, icons/splash, and debug APK CI. Release signing uses user-owned secrets, never a committed keystore.

## Architecture

- `core/engine.cpp`: dynamic sandbox, numeric ABI v2, historical scopes and seeded disguises.
- `core/bluffs.h`: portable deterministic unused-vs-copy claim allocator.
- `core/cases.cpp`: sealed-case state, public constraints, exhaustive solver, ABI v2.
- `web/`: UI, escaped annotations, numeric adapters, role symbols, and local translation catalogs.
- `tests/`: native assertions, independent reference evaluator, replay/atomicity, fuzzing, translation coverage.
- `scripts/`: both WASM builds, local server, native tests, unified Chrome integration suite.
- `docs/`: precise mode rules, proof limits, localization maintenance.
- `dist/`, `.build/`: generated output only, not committed.

Keep relative asset URLs for project-subpath and future WebView hosting. Browser WASM is not a secrecy/anti-cheat boundary. Do not force-push history, alter the license, request a broad access token, or report deployment success without checking the publish step.
