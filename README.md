# FALSEWAKE

*A village of broken truths.*

A single-player deduction-game prototype. Twelve villagers sit around the Hollow Bell. Some are Evil. Some are Good and dangerously misleading. A true statement does not make its speaker innocent.

This first milestone is an interactive interface and a small, deterministic WebAssembly game core, not the complete 160-role design. See [plan.md](plan.md) for the product plan, interaction rules, milestones, and Android path.

## Play and deployment

Intended site: **https://asr-tanyi.github.io/FALSEWAKE/**. This address works only after GitHub Pages is enabled and a deployment succeeds.

The [Test, build and deploy workflow](../../actions/workflows/ci.yml) runs on pushes to `main`, pull requests, and manual dispatch. It compiles the native and WASM core, runs engine and real-browser tests, and uploads the tested static site. Only `main` can deploy.

**One-time repository setup:** Settings > Pages > Build and deployment > Source > **GitHub Actions**. Then rerun the workflow. The workflow deliberately does not request an administrative personal access token to enable Pages. If Pages cannot be configured, the build artifact is still available, and the run summary explains that deployment did not occur.

The workflow also retains desktop/mobile screenshots and a downloadable `falsewake-web` artifact for 14 days. A green build alone does not prove that Pages was deployed: check the deployment step and its URL.

## What works

- Circular twelve-seat board, original vector portraits, character inspector, mobile layout.
- Investigation budget, one execution attempt per day, Resolve, night attacks, death reveals, victory/defeat, and restart.
- Evidence journal, pins, role search and family filters, private hypotheses, and per-character notes.
- Actual WASM rules, not a JavaScript placeholder. Claims, true roles, registration, and report reliability remain separate.
- Three early interaction chains: Courier reveals Smokescreen; temporary Taint disables Neverdead; a ward saves a Whisperer victim but leaves them impaired.
- Browser-local versioned saves replay accepted commands. No server, account, analytics, CDN, or external runtime assets.
- Keyboard shortcuts (`1`, `2`, `3`, `?`, Escape), native dialogs, focus outlines, reduced-motion support, and escaped user notes.

The script has seven genuine Citizen role types, two Good Burdens, two Evil Agents, one Tyrant, and an Archivist claim. The grimoire explains precisely what is implemented. The roster is fixed, and replaying does not shuffle it. There is no procedural generator or uniqueness proof yet.

## Run locally

Requirements: **Node.js 22+**, **Clang with its WebAssembly target**, and **LLD**. Ubuntu 24.04 setup:

```sh
sudo apt-get update
sudo apt-get install clang-18 lld-18 libclang-rt-18-dev
export CXX=clang++-18
npm test
npm run dev
```

Open `http://127.0.0.1:4173`. Set `PORT` to change the port. `npm run dev` builds once, then serves; rerun it after changing source. `npm run preview` serves an existing build. No npm dependencies or install step are required.

On another system, set `CXX` to a compatible `clang++` executable. The development server intentionally binds to loopback only. Do not open `index.html` via `file://`; module and WASM loading require a web origin.

```sh
npm run build          # Compile core/engine.cpp; copy web/ to dist/
npm test               # Native ASan/UBSan + WASM + replay + static asset tests
npm run test:browser   # Chromium/Chrome real-HTTP integration and screenshots
```

The browser test discovers `chromium`, `google-chrome`, or `chromium-browser`; alternatively set `CHROME`. It needs permission to navigate to a local HTTP server. An environment that blocks all browser navigation cannot run that integration test. There is no silent skip or fake passing result. GitHub's Ubuntu hosted runner supplies Chrome.

## Architecture

```text
web/                    Browser ES modules, CSS, original vector art
  app.js                Views, events, dialog flow, notes and local saves
  engine.js             Versioned WASM adapter; command replay
  data.js               Role copy and structured event rendering
  art.js                Local portraits, icons and village silhouette
core/engine.cpp         Authoritative allocation-free C++ rules
scripts/                Build, local HTTP server, native/browser test runners
tests/                  Native assertions and WASM contract/property tests
.github/workflows/      Test/build/artifact/Pages pipeline
dist/                   Generated site (not committed)
```

The core has no DOM, filesystem, network, allocator, clock, or operating-system imports. Clang compiles it to a small freestanding `.wasm` file. The browser calls a numeric C ABI and renders public observations. It does not implement a second set of game rules.

C++ was chosen for this slice so both native and WASM builds could be verified with the available toolchain. The stable boundary is the ABI, not the language. A future native shell or rewritten core can preserve that boundary.

### ABI v1

All arguments/results are signed 32-bit integers. Seats are zero-based in the API and one-based in the UI.

| Export | Contract |
| --- | --- |
| `fw_version()` | Returns `1`. |
| `fw_reset()` | Reset the fixed case, including the free opening clue. |
| `fw_command(op, source, target)` | `1` question, `2` claimed ability, `3` execute, `4` advance night. Returns `0` on success; nonzero errors do not mutate state. |
| `fw_state(field)` | `0` day, `1` Resolve, `2` actions, `3` status, `4` execution used, `5` event count. |
| `fw_person(seat, field)` | `0` alive, `1` claim, `2` questioned, `3` used today, `4` marked, `5` ward promised, `6` revealed role, `7` revealed team, `8` once-per-case spent. |
| `fw_event(index, field)` | `0` kind, `1` day, `2` source, `3` target/reference, `4` public value. |

Status: `0` playing, `1` won, `2` lost. Hidden roles return `0`; hidden teams return `-1`. True identity is exposed only on death or case completion. Events contain no public truth flag. Internal memory is not a security boundary: someone inspecting this single-player WASM can discover the solution. This is not an anti-cheat system.

The engine rejects out-of-range seats, dead actors/targets, spent actions, duplicate uses, passive actions, invalid self-protection, and commands after the end of the case. Event capacity and day count are bounded. The adapter also rejects malformed integer arguments and incompatible replay data.

### Exact prototype rules

You have four investigation actions per day and three Resolve. Questioning an arrival memory costs one action and is once per villager per case. These fixed statements are unverified, not dynamically generated powers. Active claimed abilities cost one action and are once per day, except Trueglass, once per case. Mara's opening Countkeeper report is free.

Execution is optional, costs no investigation action, and is limited to one attempt per day. A Good execution death costs one Resolve. A failed execution still consumes the attempt but no Resolve. Night deaths do not reduce Resolve. Win by executing all three Evil characters. Lose at zero Resolve, when all Good are dead, or after night twelve. Death reveals the true identity and removes registration disguises. Fixed-seat counts still include dead neighbors; historical reports never change.

Day powers resolve immediately in command order. Night resolves in this order:

1. Record nightfall and expire all old Taint.
2. A living Rotmonger Taints the first living Citizen found from its deterministic day-based starting seat.
3. A living Whisperer attacks the first marked living Good seat, otherwise a fixed authored priority (starting with Felix).
4. Functioning Neverdead immunity is checked before a real Ward. A surviving victim becomes Tainted; otherwise they die. No attacker identity is leaked in the event.
5. Wards expire, day advances, four actions and one execution attempt refresh, and victory/defeat is checked.

Taint corrupts generated information and disables beneficial powers until the next night. Information inversion is precise: binary values flip; a neighbor count adds one modulo three. It does not change allegiance. A Drunk is permanently impaired and cannot be cleansed. An impaired Cleanser cannot cure itself. A promised ward is not proof of real protection. Marks persist, and Evil can forge a tangible mark, so demonstrating that action does not prove a true Courier role.

This is intentionally a small authored ruleset. Bonds, seat swaps, generalized trigger stacks, multiple Tyrants, and the rest of the brainstorming catalogue are not implemented.

## Toward Android

Keep the current UI and compiled WASM, then bundle `dist/` in a **Capacitor Android WebView**. Relative asset URLs and the environment-independent core support that route. WASM alone is not an APK; this repository does not yet contain an Android project, signing keys, or a mobile build pipeline.

The later milestone must pin Capacitor dependencies, create the Android shell, test actual device WebViews/offline asset loading, define save migrations and back-button behavior, and build debug APK artifacts. Release signing belongs in user-controlled secrets, never in source control. A native C++ bridge is optional later, not a requirement for this first Android route.

References: [Capacitor Android](https://capacitorjs.com/docs/android), [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## License

The repository's existing [LICENSE](LICENSE) is preserved. Portraits, symbols, and village artwork in this prototype are original local SVG code. No art or game text is copied from the reference games.
