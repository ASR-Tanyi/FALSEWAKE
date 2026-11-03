# Sealed dawn: rules, proof scope, and engine contract

The casebook at `casebook.html` is an additional authored-puzzle mode. The original `index.html` remains the night-based sandbox with its original save and rules. These two modes deliberately do not share a rules implementation or a save slot.

## Public rules

Both cases have twelve fixed seats and exactly three Evil Conspirators. Every statement is a numerical count about a named set of seats at the same frozen dawn. A group can include its speaker. Reading is free, permanent, and available in any order. There are no deaths, night attacks, temporary Taint, changing registrations, or active-target choices in this mode.

| Role | Team | Testimony | Registration |
| --- | --- | --- | --- |
| Witness | Good | Must be true | Good |
| Drunk | Good | Must be false; any different legal count | Good |
| Devilmask | Good | Must be true | Evil |
| Conspirator | Evil | May be true or false | Evil |

Case 01, **The borrowed voice**, contains eight Witnesses, one Drunk, and three Conspirators. It asks only for counts of true Evil.

Case 02, **The painted saint**, contains seven Witnesses, one Drunk, one Devilmask, and three Conspirators. The two Burdens occupy different Good seats. Its statements use three distinct predicates:

- **True Evil:** Conspirators only.
- **Registered Evil:** Conspirators plus the Devilmask.
- **Good Burdens:** the Drunk and the Devilmask.

The roster and these rules are trusted. The statements are not. A true statement never proves the speaker Good. The Drunk's permanently wrong statement does not make them Evil. The Devilmask does not lie merely because it registers as Evil.

## Win, loss, and information

Players submit exactly three different suspects. A correct trio ends the case in victory. A wrong trio costs one of three Resolve and publicly rules out that entire trio; it does not identify an incorrect individual. Repeating a rejected trio is rejected without cost. Three wrong submissions end the case in defeat.

At either terminal state, all roles, all statements, the actual count behind each statement, and each statement's truth value become available for a debrief. Before that point, the public getters expose neither true roles nor hidden truth values. Opened statements never change.

This is a client-side single-player game, not an anti-cheat boundary. A user inspecting the compiled WASM or source can find the authored roster.

## What uniqueness means here

The solver enumerates every role assignment allowed by the public roster:

- Case 01: choose 3 of 12 Evil seats, then 1 of 9 Good seats as Drunk: **1,980 assignments**.
- Case 02: additionally choose 1 of the remaining 8 Good seats as Devilmask: **15,840 assignments**.

For every opened statement, a candidate Good Witness or Devilmask must report the candidate's actual count. A candidate Drunk must report a different count. A candidate Conspirator imposes no constraint on their own statement. Rejected trios exclude only that exact Evil set. Unopened statements impose no constraints.

For each shipped case, the complete record leaves exactly one full assignment, including the Burden seat(s), not merely a unique Evil trio. The tests also replay a legal read sequence and submit the evidence-derived trio with no Resolve loss. Since reading has no time or action cost and no attacks occur, the verified route is available to every fresh run.

This proof applies only to the two sealed cases under these rules. It does not prove uniqueness or strategic solvability of the dynamic sandbox, arbitrary scripts, the 160-role backlog, or procedural cases.

## The deduction assistant

The optional assistant starts hidden and shows remaining assignments, distinct Evil trios, and identities shared by every compatible assignment. It uses only the public rules, opened statements, and rejected trios. It does not read the authored solution. New evidence invalidates a displayed analysis so a stale result is never presented as current.

Working Good/Evil labels are separate annotations. "Check my theory" tests their joint consistency with the public record without turning those labels into facts. It does not spend Resolve. Three general reasoning hints explain the relevant mechanics without naming an answer.

## ABI: `cases.wasm`, version 1

All values are signed 32-bit integers. Seat indices are zero-based; seat masks use bits 0 through 11. Invalid getters return `-1`.

| Export | Contract |
| --- | --- |
| `fd_version()` | Returns 1. |
| `fd_reset(caseId)` | Select case 1 or 2 and reset. Invalid IDs leave state unchanged. |
| `fd_command(op, target)` | 1 opens a seat; 2 submits an Evil-seat mask. Zero means success. |
| `fd_state(field)` | 0 case ID; 1 opened mask; 2 Resolve; 3 status; 4 journal size. |
| `fd_clue(seat, field)` | 0 count type; 1 target mask; 2 reported count. Hidden until opened or the case ends. |
| `fd_entry(index, field)` | 0 operation; 1 target; 2 accusation result (1 correct, 0 otherwise). |
| `fd_analysis(field)` | 0 candidate assignments; 1 distinct Evil trios; 2 forced Good mask; 3 forced Evil; 4 forced Drunk; 5 forced Devilmask. |
| `fd_support(seat, role)` | Number of compatible assignments putting this seat in role 1 Witness, 2 Drunk, 3 Devilmask, 4 Conspirator. |
| `fd_theory(goodMask, evilMask)` | Number of compatible assignments satisfying both sets of labels. Invalid masks return -1. |
| `fd_compatible(evilMask, drunkSeat, maskSeat)` | 1 if this complete candidate fits public evidence; 0 otherwise. Use -1 for no Devilmask in case 01. |
| `fd_reveal(seat, field)` | Terminal only: 0 role, 1 actual count, 2 statement truth. Always -1 during play. |

Status is 0 playing, 1 won, 2 lost. Command errors are 1 invalid argument, 2 terminal case, 3 already opened, 4 not exactly three suspects, 5 repeated rejected trio, 6 full journal. Rejected commands are atomic. The bounded run has at most twelve reads and three accusations.

## Save and replay

The original sandbox keeps `falsewake.case.v1`. Each sealed case gets `falsewake.sealed.v1.<caseId>`. Its replay schema is `{version: 1, caseId, commands: [[op, target], ...]}` plus optional selected seat, notes, theory labels, and pinned seats. No hidden answer is exported.

The adapter validates shape, integer bounds, case ID, schema version, and every command through WASM. Malformed imports roll back atomically to the previous investigation. Valid imports replace only their own case's slot. File imports are bounded to 40 KB, replay histories to fifteen commands, and individual notes to 1,000 characters. UI annotation text is escaped before HTML insertion.

## Validation and maintenance

`npm run test:cases` runs native ASan/UBSan assertions, compiles the freestanding C++ module, and runs ten Node test cases. These include independent exhaustive enumeration after every step, complete winning replays, honest Evil and false Good examples, hidden-view checks, bad-input atomicity, joint hypotheses, import rollback, and 2,000 seeded boundary checks.

`npm test` runs the old and new suites. The independent reference model is test-only JavaScript; the browser has no rules fallback. A machine-readable proof summary is written to `.build/case-validation.json`.

`npm run test:browser` runs both the existing sandbox checks and the new real-Chrome casebook checks over HTTP at `/FALSEWAKE/`. It covers saved-state isolation, a full evidence-to-win interaction, debrief, valid and invalid replay imports, and 1440/390/320-pixel layouts. Screenshots go to the existing CI screenshot artifact.

The local authoring environment can block browser HTTP navigation. Offline visual previews are useful for layout inspection but are not counted as passing real-HTTP browser tests. CI must run those tests without a silent skip.
