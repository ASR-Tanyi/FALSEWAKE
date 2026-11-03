# Nightfall v1: The warded lantern

An authored three-day, two-night teaching investigation. Its simulation is the existing `core/engine.cpp`, included by `core/nightfall.cpp`; it is not a parallel JavaScript rules implementation. The new wrapper supplies a public roster, mission boundaries, and a dynamic evidence analyst. The sandbox and sealed cases keep their existing rules and saves.

## Public premises

Twelve fixed numbered seats and twelve different claims. Seats #03, #04, #07 and #10 contain, in some order, exactly one Good Drunk and three enemies: Smokescreen, Rotmonger and Whisperer. Their claims are unverified. The other eight identities are certified: Countkeeper #01, Wardmaker #02, Neverdead #05, Guild Auditor #06, Cleanser #08, Devilmask #09, Courier #11, Lantern Reader #12. A certified identity does not guarantee an unimpaired ability.

The four-role permutation gives 24 possible histories before investigation, and four possible enemy trios. Only one fixed authored arrangement is played. The assistant considers all 24 arrangements; the game is not a procedural generator.

#12 starts with a public permanent mark from the bell. A mark is neither a team result nor a protection. All previous appearance rules still apply. Smokescreen appears Good and consistent with its claimed role until marked. Devilmask is Good but appears Evil. Drunk is permanently impaired; ordinary cleansing does not cure the role. The ordinary readings do not bypass these appearances.

## Player actions and mission

There are four actions each day. Only certified helpers may activate powers, at most once per day. The normal action/target/impairment validation comes from the shared engine. Passive roles remain passive. The four suspects' untrusted claimed powers cannot be activated in this case; this restriction prevents arbitrary enemy bluff policies from becoming unadvertised solver assumptions.

No executions occur. End Day 1 and Day 2 voluntarily; unused actions are lost. The mission fails immediately after any night death. On Day 3, use the remaining investigations and submit exactly three of the four suspects. A wrong trio costs one of three Resolve and publicly rules out only that trio. Repeating an already rejected trio is invalid and costs nothing. There is no third night. A correct verdict ends the case and reveals identities. A terminal case rejects further commands until reset.

This is an explicit teaching premise, not a guarantee that normal-game helpers can be trusted.

## Night order and fixed enemy policy

The shared engine resolves:

1. Record nightfall and expire old temporary Taint.
2. A living Rotmonger applies fresh Taint. In both nights of this case the target is #05. This fixed case policy is public, not a hidden clue or a special True Evil scan.
3. A living Whisperer attacks the lowest-numbered marked Good villager; without one, the ordinary priority starts at #08. #12 is initially the only marked Good villager. Additional marks can change that target.
4. Check functioning immunity, then a real Ward. A blocked attack consumes the Ward, not the victim. The survivor becomes Tainted. Otherwise the victim dies.
5. Expire remaining Wards, advance the day, refresh actions, and apply the mission's no-death boundary.

Good and Evil marks are visually identical. Courier can remove Smokescreen's disguise, but marking the Good Drunk may divert an attack away from the protected #12. Wardmaker's successful rescue does not prevent the survivor's next reading from being corrupted. Cleanser must act before that reading to restore reliability. Cleansing afterward never rewrites an earlier report. Permanent Drunk remains a separate mechanism.

The small shared-engine refactor locates living attack/sabotage sources by true role rather than a hardcoded seat. The original sandbox roster, outputs, ABI v2 and save interpretation are unchanged.

## What the timeline reveals

Every report keeps its original day and numbered target mask. The timeline can filter one villager and pin reports without changing the engine. The night summary shows only observable survival/death events and the public ordering rule. It does not expose the attacker's hidden seat, secret Taint flags, real Ward flags, or report truth during play.

After victory or defeat, the debrief may display true identities and whether an earlier investigative observation was correct then. This is a terminal reveal, not an ordinary ability. The raw internal truth field remains absent from the gameplay event getter.

## Evidence-only analysis and proof scope

The analyst enumerates the 24 permutations allowed by the public charter. For each one it resets the same simulation, replays the player's accepted commands, and compares public events, visible board fields, action budget, day, Resolve and terminal outcome. It does not compare hidden role fields, Taint, internal Ward validity or report truth. Wrong verdicts constrain whole trios. Personal labels and notes are never inputs.

Analysis restores the complete live state and command journal after enumeration. It reports compatible histories, distinct enemy trios, and any forced Evil, Drunk or Smokescreen seats. It is optional and hidden until requested. The Rotmonger/Whisperer assignments can remain interchangeable; the objective is the enemy trio, not a unique complete enemy-subtype assignment.

Validation has two parts:

- A structurally independent, test-only JavaScript model is compared with the WASM public state and analyst after each step of the authored route. It also checks failure paths and seeded invalid actions. This reference model is not shipped to browsers.
- Native sanitizer tests and the independent model both execute an observation-based decision policy in every one of the 24 permitted initial worlds. On successive days, compare a healthy Lantern reading and Auditor reading of the first three suspects. Cleanse the reader before acting after each attack; protect the reader before each night. A Good appearance and inconsistent visible role identifies Drunk. If none of the first three has that signature, the public roster implies the fourth is Drunk. Accuse the other three on Day 3. Every world has a zero-Resolve-loss, all-alive result within its action budget.

This proves existence of a safe evidence-derived policy for this bounded teaching case and published enemy policy. It does not prove all strategies safe, arbitrary enemy AI solvable, the entire sandbox unique, or future generated villages valid. Counterexamples deliberately test omitted protection, premature unreliable readings, and dangerous extra marks. `.build/nightfall-validation.json` records the authored proof path.

## Public numeric ABI

`nightfall.wasm` imports no environment functions. It exports only memory and the `fn_*` API:

- `fn_version()` -> 1; `fn_reset()` starts the fixed case. No export accepts a hidden world or solution.
- `fn_command(op, source, target)`: 2 = helper ability; 4 = resolve night with zero source/target; 5 = verdict, with source holding the three-seat mask and target zero. Error return values never mutate state.
- `fn_state(field)`: fields 0-6 retain the sandbox public day/Resolve/actions/status/execution/event-count/seed shape; 7 command count, 8 nights left, 9 public suspect mask.
- `fn_person(seat, field)` and `fn_event(index, field)` retain sandbox ABI v2 public views. Living true identities remain hidden during play.
- `fn_entry(index, field)` returns accepted opcode/source/target at fields 0/1/2.
- `fn_analysis(field)`: 0 histories, 1 enemy trios, 2 forced Good, 3 forced Evil, 4 forced Drunk, 5 forced Smokescreen. Seat sets are bitmasks.
- `fn_report_truth(index)` returns -1 during play or for non-report entries; terminal investigative reports return 0 or 1.

Seats are zero-based in the ABI, #01-#12 in the UI. Status is 0 playing, 1 won, 2 lost. Case limits: 32 accepted commands, three verdict attempts, two nights. The same bounds apply to replay imports.

## Saves, languages and deployment

The new key is `falsewake.nightfall.v1`. Sandbox `falsewake.case.v2`, sealed `falsewake.sealed.v2.*`, older slots and `falsewake.language.v1` are not rewritten. Replay envelope: `{version:1, kind:'nightfall', caseId:'warded-lantern', commands:[[op,source,target], ...]}`. Optional notes/tags/pins are sanitized presentation annotations. Imports are capped at 40 KB and validated atomically; incompatible or invalid data leaves the current investigation intact.

English, Simplified Chinese, Spanish and Japanese copy is in `web/locales/nightfall.js`. Translated text never becomes a rule input. Language switching retains commands, notes and selected targets. No new runtime dependency, external asset, account or backend is required. The new static entry point is `nightfall.html` and all URLs are relative.

The existing CI runs the old suites plus the native Nightfall proof, Node tests, and real-HTTP Chrome flows in all four languages at 1440/390/320px. A local offline screenshot preview is visual QA only and is not counted as HTTP browser validation. Pages deploys only after the real checks pass.

Browser WASM remains inspectable by its owner; this is not an anti-cheat boundary.
