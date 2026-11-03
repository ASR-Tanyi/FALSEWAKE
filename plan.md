# FALSEWAKE implementation plan

Status: initial implementation plan. The first milestone is an interactive, deployable vertical slice, not the complete 160-role game. Work goes directly to `main`; no pull request is required for this initial setup.

## 1. Product direction

A single-player deduction game about a village in which allegiance, claimed identity, registered identity, and the reliability of testimony are different things. Good characters may cause harmful effects. Evil characters may tell the truth. The player must reason about interactions rather than equating a false statement with an evil speaker.

The first interface should feel like an occult investigation table: charcoal and midnight-blue surfaces, warm parchment typography, restrained amber highlights, a circular village, an illustrated village silhouette, and a persistent character inspector. No assets or text are copied from Demon Bluff or Blood on the Clocktower.

## 2. Milestone 1: interface plus working WASM slice

### Scope

- Responsive village board with 12 selectable villagers and fixed seat numbers.
- Character inspector with claimed role, ability description, testimony, and personal notes.
- Evidence journal with day/source attribution and pinning.
- Searchable/filterable grimoire that distinguishes implemented roles from future concepts.
- Local suspicion markers that are hypotheses, not verified alignment.
- Investigation budget, resolve, execution confirmation, day/night progression, victory/defeat, and restart.
- A deterministic tutorial case, not a random scenario generator.
- A real WebAssembly engine, with no JavaScript rules fallback that could silently diverge.
- Browser-local save/replay with an explicit schema version; no accounts, telemetry, backend, or secrets.
- Keyboard navigation, visible focus, reduced-motion support, accessible dialogs, and touch-friendly layout.
- Native core tests, WebAssembly contract/replay tests, and build validation in CI.
- Static artifact built on each push to main; GitHub Pages deployment when Pages is enabled.

### Non-goals for this milestone

Full 160-role support, multiplayer, a SAT/constraint solver, guaranteed unique solutions for generated cases, procedural scenarios, monetization, cloud saves, production audio, service-worker/offline caching, signed APK releases, and a complete Android project.

## 3. Technical decision

Use dependency-light browser ES modules and CSS for presentation, with a freestanding C++ core compiled to WebAssembly by Clang/LLD. Node's built-in tooling handles asset assembly, development serving, and tests. The C++ core has no DOM, filesystem, network, operating-system, or wall-clock dependencies.

C++ is selected over Rust for this first slice because the available development environment can compile and verify both its native and WebAssembly targets immediately. The important boundary is the engine API, not the source language; a later Rust core could implement the same contract.

### Boundaries

- `web/`: presentation, role copy, input handling, accessibility, local hypotheses, notes.
- `core/`: authoritative game state, rules, registration, action validation, event records, win/loss.
- `scripts/`: repeatable build, local server, native/WASM verification.
- `tests/`: engine invariants, ABI contract, deterministic replay, static asset checks.
- `.github/workflows/`: CI and GitHub Pages deployment.
- `dist/`: generated site and WASM; never commit generated output.

Only public information crosses the engine view boundary during play. Browser-local WASM is not anti-cheat: a determined player can inspect its memory. No security claim is made about hiding a single-player solution from its owner.

## 4. Engine contract

Keep a versioned, numeric C ABI with reset, command, and read operations. Document all opcodes and fields alongside the adapter. Validate source/target indices, dead characters, exhausted actions, repeated abilities, and terminal states in the core, not just the interface.

Store a bounded append-only public event history with stable event IDs. UI text renders structured event records. Test the native and compiled WASM representations against the same known expectations. Save accepted commands and replay them against a reset engine; reject incompatible or malformed saves.

Do not expose true role/team through public getters until death or the end-of-game reveal. Claimed-role text is not a verified fact. Personal suspicion labels never influence engine outcomes.

## 5. Rules to settle before expanding the role library

The previous 160-character catalogue is a brainstorming backlog, not an implementation specification. In particular:

- Separate true allegiance, registration, displayed claim, impairment, and report truth.
- Distinguish a permanent hidden Drunk role from temporary Taint. Cleansing Taint must not cure a Drunk.
- Wards stop a night attack, not execution. Removing a Ward is not consuming a Ward; trigger text must name the correct event.
- A copied claim does not automatically grant its power.
- Define whether effects stop on source death and when each duration expires.
- Distinguish ability disablement from deliberately inverted reports.
- Preserve the historical targets and state of each report; moving seats must not rewrite past truth.
- Freeze a snapshot before registration evaluation to avoid neighbor-registration recursion.
- Resolve each trigger at most once per triggering event; set explicit event/chain limits.
- Define an ordering for redirection, impairment, cleansing, protection, investigation, attacks, death triggers, and victory checks before adding interacting roles.
- Do not claim a unique solvable puzzle until a validator proves it under the actual information and action budget.

The tutorial supports only its documented subset. Unsupported roles must not appear as functional abilities.

## 6. Art and interaction requirements

Desktop: compact game header, chapter/phase overview, circular village, investigator's notes, and a detailed selected-character panel. Evidence and grimoire are first-class views, not dead navigation links.

Mobile: preserve seat order and a usable board, then stack inspector and journal. Minimum 44px primary touch targets. Avoid hover-only instructions. Respect device safe areas. Use relative asset URLs so the same output works at `/FALSEWAKE/`, another subdirectory, or inside a native WebView.

Art consists of original inline/vector marks and architectural silhouettes. Use local/system fonts in the initial build, with no external requests at runtime. Motion is decorative and must be suppressed by `prefers-reduced-motion`.

## 7. CI and GitHub Pages

On push to `main`, and on manual `workflow_dispatch`:

1. Check out the exact commit.
2. Set up Node and install the required Clang/LLD toolchain.
3. Compile and run native engine tests.
4. Compile the core to `core.wasm` and assemble `dist/`.
5. Run WASM contract, replay, and static build tests.
6. Upload a downloadable site artifact and the Pages artifact.
7. Deploy only from `main`, using the `github-pages` environment, `pages: write`, and OIDC (`id-token: write`).

First-time setup: repository Settings > Pages > Build and deployment > Source > GitHub Actions. The available repository connector cannot change this administration setting. A normal workflow `GITHUB_TOKEN` also cannot automatically enable an unconfigured Pages site. The workflow should explain this in its summary rather than claiming the site is live. Once enabled, rerun the workflow or push another commit.

Expected URL after successful deployment: https://asr-tanyi.github.io/FALSEWAKE/

Do not request a broad personal access token, store secrets in the repository, force-push history, replace the existing license, or commit generated binaries.

## 8. APK path

Preferred first Android route: bundle the same static `dist/` and WASM in a Capacitor Android WebView. This preserves the UI and rules without rewriting the core. Later evaluate a native C++ bridge only if profiling or platform integration requires it.

Before an APK milestone: add the Android project and pinned dependencies, test WASM loading in a real device WebView, handle back navigation and safe areas, make saved-state upgrades explicit, add app icons/splash assets, define offline update behavior, and build a debug APK in CI. Release signing must use user-controlled GitHub secrets, never committed keystores. WASM alone does not produce an APK.

## 9. Follow-up milestones

### M2: small complete deduction script

Finalize 12-20 role specifications and deterministic effect ordering. Add test fixtures for Countkeeper + Drunk, Courier + Smokescreen, Wardmaker + Whisperer, and Cleanser + permanent impairment. Write authored cases with explanations and enforce solution validity. Add a replay inspector for development.

### M3: synergy engine

Introduce generalized triggers and durations, visits, bonds, multiple attack sources, historical evidence snapshots, and bounded reaction chains. Add a role-interaction matrix and property tests before importing additional catalogue entries.

### M4: procedural puzzles

Seeded PRNG, constraint model, contradiction explanations, uniqueness/action-budget verification, difficulty metrics, and reproducible case IDs. Reject ambiguous or unwinnable generated cases.

### M5: Android

Capacitor shell, device tests, offline bundle verification, save migration, debug APK artifacts, and separately authorized release signing.

## 10. Acceptance checklist

- [ ] The first screen looks and behaves like a game, not an admin dashboard.
- [ ] Board selection, evidence, grimoire, notes, and hypotheses work.
- [ ] Engine is loaded from a genuine compiled WASM file.
- [ ] Invalid/duplicate actions do not mutate game state.
- [ ] Resolve, deaths, and terminal states come from the engine.
- [ ] Protection/corruption interactions have regression tests.
- [ ] Reload can reconstruct the same run.
- [ ] Small-screen layout has no horizontal overflow.
- [ ] All runtime assets are local and work under a subpath.
- [ ] CI builds and tests successfully.
- [ ] Deployment status and any one-time setup requirement are reported accurately.
- [ ] Existing license remains untouched.
