# FALSEWAKE

*A village of broken truths.*

A single-player deduction game where a truthful witness can be Evil and an innocent person can be wrong. Static web presentation, authoritative C++ WebAssembly rules, no backend or runtime dependencies.

**[Play Nightfall](https://asr-tanyi.github.io/FALSEWAKE/nightfall.html)** | [Sealed casebook](https://asr-tanyi.github.io/FALSEWAKE/casebook.html) | [Night sandbox](https://asr-tanyi.github.io/FALSEWAKE/) | [Plan](plan.md) | [CI](https://github.com/ASR-Tanyi/FALSEWAKE/actions/workflows/ci.yml)

## New in v0.5: The warded lantern

The first **Nightfall investigation** spans three days and two nights. Keep all twelve villagers alive, then identify three enemies among four suspects. The fourth is a Good Drunk. Eight certified helpers introduce the difference between knowing a role and trusting its current ability.

A Ward can save the Lantern Reader while Whisperer leaves them Tainted. Cleanse before reading; cleansing afterward cannot repair the past. A Courier mark strips Smokescreen's disguise, but marking an innocent can redirect the attack. Ordinary powers still see appearances, not True Evil.

The new screen includes an immutable timeline, per-villager comparison, pinned evidence, night summaries, private notes, optional reasoning hints and an evidence-only dynamic assistant. Saves and JSON replays are independent of the other modes. English, Simplified Chinese, Spanish and Japanese work throughout.

The analyst replays **24 public-roster arrangements** using the same night simulation. Independent tests compare public state and deductions after each action. Both native and reference tests verify an observation-based winning policy in all 24 arrangements, within the budget, with everyone alive and no Resolve lost. Rotmonger and Whisperer can remain interchangeable: the proof identifies the enemy trio, not every subtype. This guarantee belongs to the bounded teaching case and its published enemy policy, not an unrestricted or generated village.

[Exact Nightfall rules, ABI and proof scope](docs/nightfall.md).

## Existing modes

**Sealed casebook:** two fixed-dawn logic cases with twelve distinct numbered claims. Broad clues give presence, not exact totals; focused readings can be more precise. Find three enemies while explaining Good Drunk/Devilmask effects. Read for free, annotate, inspect evidence, and submit a trio. Independent exhaustive validation covers 1,980 assignments in case 01 and 15,840 in case 02. Full evidence leaves one enemy team and one placement of the Good Burdens, not necessarily unique enemy subtypes. [Rules](docs/sealed-cases.md).

**Night sandbox:** four investigations and one optional execution per day, three Resolve, attacks, protection, Taint, marks, death reveals and end states. The actual roster is fixed; **New disguises** changes enemy claims with a seeded 90% unused / 10% copy policy per enemy. It is not a procedural village generator. Useful interactions are real, but the sandbox has no general uniqueness or win-policy proof. [Rules](docs/rules-v04.md).

All modes use #01-#12 and distinct claim-based sigils rather than generic heads. Raw informational scopes exclude the speaker. Masks can fool both team and role readings; truthfulness does not establish allegiance.

## Languages and saves

The header selector switches English, Simplified Chinese, Spanish and Japanese without restarting. A supported `?lang=` URL overrides saved preference, browser-language negotiation and the English fallback. Notes are never translated. [Translation maintenance](docs/i18n.md); Nightfall messages are in `web/locales/nightfall.js`.

Nightfall adds only `falsewake.nightfall.v1`. Existing `falsewake.case.v2`, `falsewake.sealed.v2.*`, older v1 slots, and `falsewake.language.v1` remain untouched. Different rules/replay formats are not silently interchanged. Invalid Nightfall replay imports preserve the active case.

## Run locally

Requirements: Node.js 22+, Clang with the WebAssembly target, LLD, and Chrome/Chromium for browser tests. On Ubuntu:

```sh
sudo apt-get update
sudo apt-get install clang-18 lld-18 libclang-rt-18-dev fonts-noto-cjk
export CXX=clang++-18
npm test
npm run dev
```

Open `http://127.0.0.1:4173/nightfall.html`. No npm install is needed. `CXX` chooses the compiler; `CHROME` the browser; `PORT` the loopback development port. Serve over HTTP, not `file://`.

```sh
npm run build          # Existing modules, then shared-core Nightfall wrapper
npm test               # Three native sanitizer suites and all Node tests
npm run test:cases     # Existing sealed-case validation
npm run test:nightfall # Bounded dynamic policy, reference, replay and fuzz tests
npm run test:browser   # Existing suite plus multilingual Nightfall HTTP flows
npm run preview        # Serve an existing dist/
```

Native and independent reference checks validate gameplay. Browser checks exercise the actual controls, persistence, full evidence-to-victory path, imports, languages and 1440/390/320px layouts. An environment that blocks local HTTP fails that integration test explicitly; offline layout rendering is not counted as an HTTP pass. CI must run the real suite before deployment.

## Architecture

- `core/engine.cpp` -> `core.wasm`: dynamic sandbox, ABI v2.
- `core/cases.cpp` -> `cases.wasm`: sealed-case state and evidence solver, ABI v2.
- `core/nightfall.cpp` -> `nightfall.wasm`: **includes the same sandbox simulation**, with a mission boundary and replay-based analyst, ABI v1.
- `web/`: presentation, numeric adapters, local SVG symbols, catalogs, and annotations.
- `tests/`: native assertions and independent test-only reference models; never shipped in `dist/`.
- `scripts/`: deterministic builds, HTTP serving and Chrome tests.

The cores import no filesystem, clock, network, DOM or allocator. The browser renders public observations and sends numeric commands; there is no JavaScript rules fallback. Historical reports retain their original targets. Source death is checked by role rather than assuming an enemy always occupies a particular seat.

WASM on a player's own device is inspectable, not an anti-cheat boundary. Public getters prevent accidental interface leaks, not deliberate source/memory inspection.

## CI, Pages and Android

Pushes to `main` run native sanitizers, all WASM builds, reference/replay/fuzz/translation tests and both real-browser suites. Successful builds upload the static game and screenshots, then deploy to GitHub Pages. Check the publishing step, not only the build. Repository Settings > Pages > Source must remain **GitHub Actions**. No personal token is needed for normal deployment; generated files are not committed.

A future Capacitor Android shell can reuse the same static site and WASM. This release does not add an APK, signing keys, cloud saves or a backend. Android device/offline testing, safe areas, navigation, migrations and debug APK CI remain a separate milestone.

## License

The existing [LICENSE](LICENSE) is preserved. Symbols and village artwork are original local SVG code. No art or game text is copied from the reference games.
