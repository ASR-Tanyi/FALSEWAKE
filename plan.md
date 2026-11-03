# FALSEWAKE implementation plan

## Current state: v0.2 authored-puzzle milestone

Work continues directly on `main`, without a PR. The original night-based interface remains available. The next increment adds a separate **sealed-dawn casebook**: two finite logic puzzles whose complete solutions can be checked exhaustively under a precisely documented ruleset.

This is an authored-puzzle slice of M2, not completion of the generalized dynamic role engine. We do not claim that the night sandbox, all 160 proposed roles, or future procedural cases have validated solutions.

## Product direction

A single-player deduction game where true allegiance, registration, claimed identity, and reliability are distinct. A Good character may be wrong or harmful; an Evil character may tell the truth. The player should discover an explanation, not merely guess who lies.

Keep the occult investigation-table identity: charcoal surfaces, restrained gold, parchment typography, original vector villagers, a circular board, and an evidence-focused inspector. Do not copy art or game text from the reference games.

## M1: interface and portable rules baseline

Implemented in the initial release:

- Twelve-seat responsive village, inspector, notes, suspicion labels, evidence pins, searchable grimoire.
- Deterministic night-based prototype with investigation actions, Resolve, executions, attacks, wards, marks, Taint, survival, death reveals, and end states.
- Seven Citizen types, two Good Burdens, two Agents, one Tyrant, plus an Archivist claim. The larger catalogue remains a backlog.
- C++ compiled to real WASM, versioned public C ABI, authoritative core validation, and command-replay browser saves.
- Native tests, WASM tests, Chrome integration, and GitHub Pages build/deployment on pushes to main.
- Existing license preserved; no backend, accounts, telemetry, CDN, or external runtime assets.

The original sandbox is deliberately preserved, including `falsewake.case.v1`, so this release does not silently reinterpret old replays.

## M2a: sealed-dawn casebook (this increment)

### Deliverables

1. **The borrowed voice:** twelve statements, three Evil Conspirators, one Good Drunk. Eight other Good witnesses tell the truth. Evil may tell truth or lies.
2. **The painted saint:** adds a truthful Good Devilmask that registers as Evil. Distinguishes true Evil counts, registered Evil counts, and Good Burden counts.
3. A published, fixed-dawn ruleset: no night attacks, Taint, executions, or changing claims. Read in any order, form a trio, and submit an accusation. Three Resolve; wrong submissions rule out only the submitted trio.
4. Exhaustive enumeration of all public-rule assignments: 1,980 in case 01 and 15,840 in case 02. Each complete case has one full role assignment and a legal zero-penalty winning route.
5. Optional evidence-only deduction assistant, joint hypothesis checks, three reasoning hints per case, and end-of-case explanations of the correct count and each speaker's role.
6. Independent case saves; explicit replay inspection, JSON export/import, bounds checking, and atomic rejection of invalid imports.
7. Responsive casebook and investigation screens using the existing visual language. A clear link from the original sandbox preserves access to both modes.
8. Regression coverage integrated into the existing build and browser-test commands.

### Acceptance gates

- Native C++ checks pass with address and undefined-behavior sanitizers.
- Independent test-only enumeration agrees with WASM after every step of each proof route.
- Full evidence yields exactly one assignment, including Burdens, not only one Evil trio.
- The engine executes an evidence-derived winning route without Resolve loss.
- No true-role, truth-value, or unopened-statement getter leaks private state during play.
- Analysis consumes only opened evidence and publicly rejected trios. It does not inspect the authored solution.
- Repeated and invalid actions are atomic. Invalid imports preserve the current run.
- Old sandbox save data is untouched; cases save independently.
- Real-browser checks verify selection, notes, pins, rules, reload, win flow, debrief, import, and 320/390/1440-pixel layouts.
- GitHub Actions must pass before its deploy job publishes the artifact. A local offline render is not a replacement for the HTTP browser check.

See [docs/sealed-cases.md](docs/sealed-cases.md) for exact rules, proof scope, ABI, and replay schema. `npm run test:cases` produces `.build/case-validation.json` with proof counts.

## M2b: dynamic-script rigor (next)

The sealed casebook establishes the proof and replay workflow without conflating static testimony with night powers. The next step is to apply that discipline to a deliberately small dynamic script.

- Freeze exact specifications for 12-20 roles before extending the catalogue.
- Separate true role, claimed role, true team, registration, impairment, ability output, and report truth.
- Define explicit durations and phases: expire old effects, apply new impairment, redirect, cleanse, protect, investigate, attack, resolve death/reactions, check victory.
- Specify whether effects persist after source death and whether protection prevents execution or only attacks.
- Distinguish Ward removal from Ward consumption; do not trigger consumption abilities on removal.
- Preserve historical targets and snapshots when states or seats change.
- Model permanent Drunk separately from temporary Taint; no ordinary cleanse can change a hidden true role.
- Guard registration recursion using snapshots and cap reaction chains per event.
- Keep verified fixtures for Courier + Smokescreen, Wardmaker + Whisperer, Neverdead + Taint, and Cleanser + Drunk.
- Add genuinely helpful and harmful cross-role interactions incrementally, with a role-interaction matrix.
- Validate authored dynamic cases under their actual action budget and adversarial policy, not merely a final static assignment.

Completion means several explained, reproducible dynamic puzzles with tested interactions, not just a larger list of characters.

## M3: generalized synergy engine

Add reusable triggers, visits, bonds, durations, multiple attack sources, and bounded reaction queues. Log source, target, phase, and relevant historical facts. Define public/private event views explicitly. Property-test event ordering and loop termination before enabling new combinations.

The core should eventually express an ability through trigger, condition, target selector, effect, duration, and limit. Do not prematurely generalize before the small-script semantics are settled.

## M4: procedural puzzles

Seeded PRNG, reproducible case IDs, constraint model, explanations for contradictions, uniqueness validation, action-budget/win-path validation, and difficulty metrics. Reject ambiguous or unwinnable cases. Never label a generated case "proven" because its hidden solution merely satisfies its own evidence.

## M5: Android

Preferred first route: bundle the same static UI and WASM in a Capacitor Android WebView. WASM alone is not an APK. No Android project, debug APK pipeline, signing keys, or release APK is included yet.

Before implementation: pin dependencies, verify actual device WebViews and offline loading, handle back navigation and safe areas, define save migration, add launcher/splash assets, then build debug APK artifacts. Release signing uses user-controlled GitHub secrets; never commit a keystore. A native C++ bridge is optional only if profiling or platform integration justifies it.

## Architecture and boundaries

- `web/`: DOM, CSS, local artwork, copy, annotations, and versioned adapters.
- `core/engine.cpp`: unchanged dynamic sandbox rules; compiled to `core.wasm`.
- `core/cases.cpp`: sealed-case state, evidence constraints, and exhaustive deduction; compiled to `cases.wasm`.
- `tests/`: native assertions, WASM/API tests, independent case reference model, authored fixtures.
- `scripts/`: compiler/build steps, local HTTP server, real-browser tests.
- `docs/`: exact mode-specific rules and proof limitations.
- `dist/`, `.build/`: generated output; never commit generated WASM or screenshots.

The two modes have separate contracts because their semantics differ. The shared boundary is a versioned numeric C ABI with reset/command/read functions. No JavaScript runtime rules fallback, OS imports, filesystem, network, wall clock, or allocator in the cores. A later native shell can reuse the same logic.

Browser WASM is not an anti-cheat boundary. Deliberate source/memory inspection can disclose a single-player solution; only the normal public view is restricted.

## CI and deployment

The existing workflow remains the authority: native sanitizers, both WASM builds, all Node tests, both Chrome suites, then static artifacts and Pages deployment from `main`. Browser screenshots remain in the screenshot artifact. Preserve the Pages permissions/environment setup and relative asset URLs so `/FALSEWAKE/` and local hosting both work.

Repository settings must have Pages configured to use GitHub Actions. Do not request a broad personal access token, force-push history, alter the license, or claim deployment succeeded without checking the publish job.

## Deferred decisions

Multiplayer, cloud saves, service-worker/offline update policy, accounts, monetization, production sound, arbitrary role modding, and expansion to all 160 proposed skills are outside this milestone. Prioritize fair deductions, understandable interactions, and transparent validation over sheer content volume.
