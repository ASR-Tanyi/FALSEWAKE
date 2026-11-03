# FALSEWAKE

*A village of broken truths.*

A single-player deduction game about the difference between an enemy, an innocent liar, and a truthful witness who only **appears** Evil. The UI is static web code; authoritative rules run in compiled C++ WebAssembly.

## Play

**[Open the sealed casebook](https://asr-tanyi.github.io/FALSEWAKE/casebook.html)** - two authored logic cases with exhaustively validated solutions.

**[Enter the original night sandbox](https://asr-tanyi.github.io/FALSEWAKE/)** - experiment with roles, wards, Taint, marks, executions, and night attacks.

These URLs require a successful Pages deployment. Check the [Test, build and deploy workflow](../../actions/workflows/ci.yml) for the exact revision and publishing result.

## New in v0.2: the sealed dawn

**The borrowed voice** asks you to find three enemies while one Good Drunk gives a false count. **The painted saint** adds a Good Devilmask and separates true allegiance, registration, and Burden counts. Enemies can tell the truth in both cases.

Twelve sealed statements describe one frozen dawn. Open them in any order, keep notes, pin evidence, mark suspects, and submit a trio. Reading is free; wrong trios cost Resolve. After victory or defeat, inspect each witness's actual role and the correct count behind their testimony.

The optional deduction assistant considers only public rules, opened statements, and rejected trios. It starts hidden and can reveal conclusions already forced by that evidence. It never turns personal suspicion labels into facts. Replay inspection and JSON export/import preserve reproducibility, with isolated saves for each case and atomic rejection of malformed imports.

The validator exhausts **1,980** permitted assignments for case 01 and **15,840** for case 02. Full evidence leaves exactly one complete assignment in each, including the Burdens. Tests replay an evidence-derived winning route without Resolve loss. This guarantee applies to these two fixed-dawn cases, **not** the dynamic sandbox or future generated scripts.

Read [the exact sealed-case rules and ABI](docs/sealed-cases.md) and [the implementation roadmap](plan.md).

## The night sandbox

The original interface remains available with its existing save:

- Circular twelve-seat board, local vector portraits, character inspector, mobile layout, notes, hypotheses, evidence pins, and searchable grimoire.
- Four investigation actions per day, three Resolve, one optional execution attempt per day, night attacks, death reveals, victory/defeat, and restart.
- Actual WASM rules. Claims, true roles, registration, and report reliability remain distinct.
- Courier can remove Smokescreen's disguise. Taint can disable Neverdead. A ward can save a Whisperer victim but leave them impaired. Cleansing cannot cure the permanent Drunk role.
- Versioned replay saves, keyboard shortcuts, native dialogs, focus outlines, and reduced-motion support.

There are seven genuine Citizen role types, two Good Burdens, two Agents, one Tyrant, and an Archivist claim. Roles and authored attacks do not shuffle. This is a mechanics sandbox, not a proven unique deduction puzzle. The 160-role design is a backlog, not implemented content.

### Exact sandbox ordering

Day powers resolve immediately in command order. Questioning an arrival memory costs one action and is once per villager per case. Active powers cost one action and are once per day, except Trueglass, once per case. Mara's opening clue is free. Arrival memories are fixed unverified statements, not fresh ability readings.

Execution costs no action. Executing Good costs one Resolve; a failed execution consumes the daily attempt but no Resolve. A ward does not prevent execution. Win by eliminating all three Evil characters, not only the Tyrant. Lose at zero Resolve, no surviving Good, or after twelve nights.

At night: expire old Taint; a living Rotmonger Taints one Citizen; a living Whisperer attacks a marked Good victim or follows its authored priority beginning with Felix; test functioning Neverdead immunity before a real Ward; a survivor becomes Tainted, otherwise dies; expire wards; advance the day, refresh actions, and check the result.

Taint disables beneficial powers and corrupts information until the next night. Binary results flip; a neighbor count adds one modulo three. An impaired Cleanser cannot cleanse itself. Drunk is a permanent role, not curable Taint. A promised ward is not proof of real protection. Marks persist and may be forged by Evil. Death reveals identity and removes registration disguises. Fixed-seat counts include dead neighbors; old reports never change.

## Run locally

Requirements: **Node.js 22+**, **Clang with its WebAssembly target**, and **LLD**. For Ubuntu 24.04:

```sh
sudo apt-get update
sudo apt-get install clang-18 lld-18 libclang-rt-18-dev
export CXX=clang++-18
npm test
npm run dev
```

Open `http://127.0.0.1:4173/casebook.html` or the root for the sandbox. There are no npm dependencies to install. Set `CXX` for another compatible compiler and `PORT` for a different local port. `npm run dev` builds once, then serves; rerun after source changes. Do not use `file://`, which cannot load modules and WASM normally.

```sh
npm run build          # Compile both cores and assemble dist/
npm test               # Both native sanitizer suites, builds, all Node tests
npm run test:cases     # Sealed-case native + WASM + exhaustive model tests
npm run test:browser   # Both real-Chrome HTTP integration suites
npm run preview        # Serve an existing dist/
```

The browser tests discover Chrome/Chromium or use `CHROME`. They exercise the `/FALSEWAKE/` project subpath and desktop/390px/320px layouts. Environments that block browser navigation cannot run these HTTP checks; there is no fake-success fallback. GitHub CI runs them before deployment. `.build/case-validation.json` contains the generated proof summary; screenshots are in `.build/screenshots/`.

## Architecture

```text
web/                    UI, CSS, local SVG, copy, and ABI adapters
  app.js / engine.js    Original night sandbox
  casebook.js          Sealed-case interface and replay tools
  cases-engine.js      Sealed-case WASM adapter; no JS rule fallback
core/engine.cpp         Sandbox rules -> core.wasm
core/cases.cpp          Sealed-case rules and solver -> cases.wasm
tests/                  Native checks, WASM tests, independent reference model
scripts/                Build, serve, native/browser verification
docs/sealed-cases.md    Precise sealed-case rules, ABI, and proof scope
.github/workflows/      Existing test/build/artifact/Pages pipeline
dist/                   Generated site; not committed
```

The cores are freestanding, deterministic, and allocation-free, with no DOM, filesystem, network, clock, or OS imports. C++ was chosen so native and WASM targets could use the same tested code. The important portable boundary is the ABI, not the source language.

### Original sandbox ABI v1

Arguments/results are signed 32-bit integers. Seat indices are zero-based.

| Export | Contract |
| --- | --- |
| `fw_version()` | 1. |
| `fw_reset()` | Reset the fixed sandbox and free opening clue. |
| `fw_command(op, source, target)` | 1 question; 2 claimed ability; 3 execute; 4 advance night. Zero is success. Errors do not mutate state. |
| `fw_state(field)` | 0 day; 1 Resolve; 2 actions; 3 status; 4 execution used; 5 event count. |
| `fw_person(seat, field)` | 0 alive; 1 claim; 2 questioned; 3 used today; 4 marked; 5 ward promised; 6 revealed role; 7 revealed team; 8 once-per-case spent. |
| `fw_event(index, field)` | 0 kind; 1 day; 2 source; 3 target/reference; 4 public value. |

Status is 0 playing, 1 won, 2 lost. Hidden roles return 0; hidden teams return -1. True identity becomes public only on death or case completion. Public events do not expose a truth flag. Invalid sources, dead actors, unavailable powers, spent actions, and terminal commands are rejected. The sealed-case API is separate and documented in `docs/sealed-cases.md`.

No accounts, telemetry, external runtime assets, or server are used. Saves stay in the browser. Browser WASM is **not anti-cheat**: inspecting source or memory can reveal a single-player answer.

## CI and GitHub Pages

The workflow runs on `main` pushes, PRs, and manual dispatch. Only `main` deploys. It runs native sanitizers, builds both modules, runs Node and both browser suites, then uploads the tested static game and screenshots and deploys Pages. A green build is not proof of deployment: inspect the publish step.

For first-time setup, choose **Settings > Pages > Build and deployment > Source > GitHub Actions**, then rerun. No administrative personal access token is required by the workflow. Artifacts are retained for 14 days. The preexisting license and main history are preserved.

## Toward Android

The planned first Android route bundles the same static UI and WASM in a Capacitor WebView. Relative asset URLs and an environment-independent core support it. WASM alone does not produce an APK. The repository does not yet include an Android project, signing keys, or an APK workflow.

A later milestone must pin Capacitor dependencies, test real device WebViews and offline loading, define back-button and save-migration behavior, add app assets, and build debug APKs. Release signing uses user-controlled secrets, never committed keystores. A native C++ bridge remains optional.

References: [Capacitor Android](https://capacitorjs.com/docs/android), [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## License

The existing [LICENSE](LICENSE) remains unchanged. Portraits, symbols, and architecture are original local SVG code; no art or text is copied from the reference games.
