# FALSEWAKE

*A village of broken truths.*

A single-player deduction game where a truthful witness can be Evil and an innocent person can be wrong. Static web presentation, authoritative C++ WebAssembly rules, no backend or runtime dependencies.

**[Play Nightfall](https://asr-tanyi.github.io/FALSEWAKE/nightfall.html)** | [Sealed casebook](https://asr-tanyi.github.io/FALSEWAKE/casebook.html) | [Night sandbox](https://asr-tanyi.github.io/FALSEWAKE/) | [Plan](plan.md) | [CI](https://github.com/ASR-Tanyi/FALSEWAKE/actions/workflows/ci.yml)

## New in v0.7 — The borrowed light

Rain has blurred one entry in the watch register. Everyone knows #12 is Good. Their role is the open question. Use the Guild Auditor to check the witness, then decide what their lantern readings tell you about the four suspects.

**[Play chapter 03](https://asr-tanyi.github.io/FALSEWAKE/nightfall.html#case=borrowed-light)** · [Public rules and strategy proof](docs/borrowed-light.md)

Chapter 03 has its own save, hints and replay ID in English, Simplified Chinese, Spanish and Japanese. A safe strategy is checked in all 48 starting arrangements allowed by its charter. The game plays one authored arrangement. The analyst considers them all.

## Three modes

**Nightfall** has three investigations. Each lasts three days and two nights. Keep the village alive, compare the timeline and identify the three enemies. Each chapter supports notes, pins, hints, evidence analysis and replay import/export.

| Chapter | What to investigate |
| --- | --- |
| [01 · The warded lantern](docs/nightfall.md) | Can a rescued witness give a reliable reading at dawn? |
| [02 · The hollow ward](docs/hollow-ward.md) | Who can survive when Wardbreaker removes a Ward before the attack? |
| [03 · The borrowed light](docs/borrowed-light.md) | How should you read the evidence when a Good witness's role is uncertain? |

**Sealed casebook:** two fixed-dawn cases. Broad clues report presence rather than exact totals; focused clues can be more precise. Find three enemies while explaining Good Drunk/Devilmask effects. Independent exhaustive validation covers 1,980 assignments in case 01 and 15,840 in case 02. Full evidence determines the enemy trio and Good Burden positions, not necessarily every enemy subtype. [Rules](docs/sealed-cases.md).

**Night sandbox:** four investigations and one optional execution per day, three Resolve, attacks, Wards, marks, Taint, death reveals and endings. The roster is fixed. **New disguises** changes enemy claims with a deterministic 90% unused / 10% copied-claim branch per enemy. The sandbox has no general uniqueness or win-policy proof. Wardbreaker appears in Nightfall chapters 02 and 03. [Rules](docs/rules-v04.md).

All modes use #01-#12 and claim-based role sigils. Raw information scopes exclude the speaker. Ordinary readings see appearances, not True Evil. A truthful observation can describe a disguise. Old reports retain their original targets and time.

## Languages and saves

The header selector switches English, Simplified Chinese, Spanish and Japanese without resetting progress. Supported `?lang=` parameters take priority over saved preference, browser languages, then English. Notes remain exactly as written. [Translation maintenance](docs/i18n.md). Chapter 03 text is in `web/locales/borrowed.js`.

Nightfall stores each chapter in its own slot, using `falsewake.nightfall.v1`, `falsewake.nightfall.v1.hollow-ward` and `falsewake.nightfall.v1.borrowed-light`. Existing sandbox, sealed, older v1 slots and `falsewake.language.v1` remain untouched. Malformed cross-case imports restore the exact previous case and history. Chapter statuses are local navigation indicators, not server achievements. Reset affects only the selected investigation.

## Local development

Node.js 22+, Clang with its WebAssembly target, LLD, and Chrome/Chromium for browser tests. Ubuntu:

```sh
sudo apt-get update
sudo apt-get install clang-18 lld-18 libclang-rt-18-dev fonts-noto-cjk
export CXX=clang++-18
npm test
npm run dev
```

Open `http://127.0.0.1:4173`. No npm install is needed. `CXX`, `CHROME` and `PORT` select the compiler, browser and local server port. Do not open the modules/WASM through `file://`.

```sh
npm run build          # Compile the three WASM modules and assemble dist/
npm test               # All native sanitizer, WASM, reference, replay, fuzz and i18n suites
npm run test:browser   # Real HTTP Chrome flows for all modes and four languages
npm run test:nightfall # All three Nightfall cases and their strategy proofs
npm run test:cases     # Sealed-case proofs
npm run preview        # Serve an existing build
```

Browser tests fail explicitly when local HTTP navigation is blocked. CI runs the actual browser suites before Pages publishes, including 1440/390/320px layouts. Screenshots and a static web bundle are downloadable workflow artifacts. Generated WASM, proof reports and screenshots are not committed.

## Architecture

`core/engine.cpp` is the shared sandbox/Nightfall simulation. `core/cases.cpp` contains the sealed-case solver. `core/nightfall.cpp` supplies bounded missions and an analyst that replays only public-rule worlds against public observations. The cores import no DOM, network, filesystem, clock or allocator. Independent JavaScript models exist only in tests, never in the shipped game.

Nightfall ABI v1 accepts chapter numbers 1, 2 and 3 through `fn_select`. State field 10 returns the active chapter. The original `fn_reset()` selects chapter 01. Existing snapshots/replay schemas remain compatible. Chapter metadata in the browser contains no hidden answers. Browser-local WASM is not an anti-cheat barrier; deliberate source/memory inspection can reveal single-player secrets.

## CI and Android

Every push to `main` runs the complete test/build/browser pipeline and deploys only its passing artifact to GitHub Pages. Pages must be configured to use GitHub Actions. Check the actual publish job rather than just a successful build. No personal access token is needed for normal deployment.

The Android roadmap remains a separate milestone: a Capacitor shell bundling the same UI and WASM, device/offline tests, safe areas/back navigation, migration, and debug APK CI. No APK or signing key is included. Release signing belongs in user-controlled secrets.

## License

The original [LICENSE](LICENSE) is preserved. Sigils and village artwork are local original vector code; no art or game text is copied from the reference games.
