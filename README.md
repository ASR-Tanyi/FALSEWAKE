# FALSEWAKE

*A village of broken truths.*

A single-player deduction game where a truthful witness can be Evil and an innocent person can be wrong. Presentation is static web code; authoritative rules and the sealed-case solver run in C++ compiled to WebAssembly.

**[Play the casebook](https://asr-tanyi.github.io/FALSEWAKE/casebook.html)** | **[Night sandbox](https://asr-tanyi.github.io/FALSEWAKE/)** | [Plan](plan.md) | [Build and deployment](https://github.com/ASR-Tanyi/FALSEWAKE/actions/workflows/ci.yml)

## v0.4: simple powers, misleading appearances

- Broad clues say **any apparent Evil / none**, not exact totals. Countkeeper gets an exact count only among the nearest living neighbors, skipping dead seats.
- Ordinary readings see registration, not True Evil. Devilmask can look Evil while innocent; an unmarked Smokescreen can fool both Lantern Reader and Guild Auditor.
- Numbered villagers (#01-#12) and distinct role sigils replace generic portrait heads. An unrevealed sigil depicts the claimed character, never the hidden role.
- Raw clues exclude their speaker, so generated bluffs do not accidentally announce their own Evil identity.
- Default claims are unique. **New disguises** redraws enemy claims: 90% unused-claim branch, 10% copying a Good Citizen claim, per enemy. The seed is saved; true teams do not move. This is not a procedural village generator.
- Both sealed cases are rewritten and independently validated. Every supported language (English, Simplified Chinese, Spanish, Japanese) uses the new rules.

Read [the exact v0.4 rules](docs/rules-v04.md). Broader reach and narrower precision are balancing guidelines, not a claim of completed playtesting.

## Two modes

### Sealed casebook

Twelve unique character claims, twelve short statements at one fixed dawn. Find three enemies while explaining a Good Drunk, and in case 02 a truthful Good Devilmask. Read for free; wrong trios cost Resolve without revealing individual hits. Keep notes, pin evidence, inspect replays, and use an optional evidence-only deduction assistant.

The independent validator checks **1,980** permitted assignments in case 01 and **15,840** in case 02. Full evidence gives one enemy trio and one placement of the Good Burdens in each. Tests compare every step with the WASM solver and complete a zero-loss winning route. Enemy subtypes are shown in the debrief but are not proof targets. These guarantees do not apply to the dynamic sandbox.

[Sealed-case rules, ABI and replay format](docs/sealed-cases.md).

### Night sandbox

Four investigations per day, one optional execution, three Resolve, night attacks, Wards, marks, Taint, death reveals, and victory/defeat. The actual roster is fixed. Restart replays its disguise seed; New disguises changes enemy claims only.

The useful interactions are real: a mark strips Smokescreen's disguise; a Ward can save a victim but Whisperer leaves them impaired; an impaired Cleanser cannot restore Neverdead; cleansing never cures the permanent Drunk. Historical evidence stores its original numbered targets instead of silently following today's neighbors.

## Language and saves

The header's language selector changes both modes without resetting progress. A supported `?lang=` URL takes priority over saved preference, browser languages, and finally English. Character symbols and seat numbers are language-independent. Notes are never translated. [Translation maintenance](docs/i18n.md).

**Rules v2 starts fresh saves.** Old `falsewake.case.v1` and `falsewake.sealed.v1.*` slots are preserved, not loaded under changed rules. New slots are `falsewake.case.v2` and `falsewake.sealed.v2.*`. Old sealed replays are rejected without changing the current case. The existing language preference is retained.

## Local development

Requirements: Node.js 22+, Clang with its WebAssembly target, LLD, and Chrome/Chromium for browser tests. Ubuntu setup:

```sh
sudo apt-get update
sudo apt-get install clang-18 lld-18 libclang-rt-18-dev fonts-noto-cjk
export CXX=clang++-18
npm test
npm run dev
```

Open `http://127.0.0.1:4173`. No npm install or runtime dependency is required. `CXX` chooses the compiler; `CHROME` chooses the browser. `PORT` changes the development port. The server binds to loopback. Do not use `file://` for modules/WASM.

```sh
npm run build          # Compile both v2 WASM modules and assemble dist/
npm test               # Native ASan/UBSan, WASM, solver, replay, i18n and fuzz tests
npm run test:browser   # Real HTTP Chrome tests, all languages, 320/390/1440px
npm run test:cases     # Sealed-case reference proof and native checks
npm run preview        # Serve an existing dist/
```

The browser suite fails explicitly if an environment blocks local HTTP navigation. A restricted local environment is not reported as a passing browser check. CI runs the actual HTTP suite before publishing.

## Architecture and public contract

`core/engine.cpp` compiles to `core.wasm`; `core/cases.cpp` compiles to `cases.wasm`. Neither imports a DOM, filesystem, clock, network, or allocator. JavaScript sends numeric commands and renders public observations; it is not a second rules implementation. C++ is portable to a later native bridge, but a WebView can reuse the current WASM unchanged.

Sandbox ABI v2: `fw_reset(seed)` accepts a nonnegative 31-bit disguise seed (0 is the curated script); `fw_command(op,source,target)` uses 1 testimony, 2 ability, 3 execution, 4 night. State fields 0-6 are day, Resolve, actions, status, execution-used, event count, seed. Person fields retain alive/claim/asked/used/marked/promised/revealed-role/revealed-team/spent. Event fields 0-5 are kind, day, source, target/reference, value, original subject mask. Report truth and living true roles remain private until explicit reveal.

Browser-local WASM is not anti-cheat; deliberate code/memory inspection can discover single-player secrets. API privacy prevents accidental UI leaks, not inspection by the player's own machine.

## CI and Pages

Pushes to `main` trigger native sanitizer checks, both WASM builds, all Node tests, and the unified Chrome suite. Tested static assets and screenshots are retained as artifacts, then Pages publishes from `main`. The same workflow also supports manual dispatch and test-only PR builds. Check the actual publishing step, not only a green build.

Repository Settings > Pages > Source must be **GitHub Actions**. The existing configured site does not need a personal access token. No generated WASM, screenshots, or binaries are committed.

## Android roadmap

A later Capacitor Android shell can bundle the same `dist/` and WASM. No Android project or APK is included yet. Device/offline tests, safe areas, navigation, migration, and a debug APK pipeline are separate tasks; release keys must stay in user-controlled secrets.

## License

The repository's existing [LICENSE](LICENSE) is preserved. The vector sigils and village artwork are local original code. No art or game text is copied from the reference games.
