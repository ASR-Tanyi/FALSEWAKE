# FALSEWAKE v0.4: focus, appearances, and believable characters

This specification supersedes the old broad exact-count and true-team readings. It applies to the v2 sandbox and the two rewritten v2 sealed cases. The 160-role brainstorm is a backlog, not the rules implementation.

## Information budget

A broad search buys coverage, not precision. A power that covers three or six people reports only **any apparent Evil / no apparent Evil**. It never gives the exact number in that broad group. A one-person reading can classify that person's apparent team or condition. A two-person reading may compare their apparent teams. Countkeeper gets an exact count only among the closest living person in each direction.

For example, "At least one of #01-#06 appears Evil" is a legal broad clue. "There are exactly three Evil in #01-#06" is not. "Among my living neighbors (#02 and #05), exactly one appears Evil" is a legal local clue.

Keep each role to one short question. Do not compensate for power with elaborate arithmetic, arbitrary exceptions, or long compound propositions. These are design constraints, not a claim that every role is competitively balanced; further playtesting is needed.

## What a reading can know

True team, registered team (appearance), claimed role, visible role, and impairment are separate engine facts. Normal allegiance powers use **registered team**, never true team. No ordinary true-team scanner is in this script. A future exceptional bypass must be explicitly named, scarce, and separately tested.

- Devilmask is Good but appears Evil while functioning.
- Smokescreen is Evil but appears Good and consistent with its borrowed role until marked. A Courier mark exposes both forms of disguise.
- Guild Auditor compares the claim with the **visible role**, not an omniscient role lookup.
- Archivist verifies whether a historical statement correctly described its observation, not whether its speaker is Good or a disguise was genuine.
- Hollow Eye and Taintreader are narrow condition checks on one other person. They are not bulk true-team scans.
- Death and the end-of-case debrief reveal true identity; those are explicit system reveals, not investigation abilities.

Temporary Taint and permanent Drunk are different. A cleanser cannot cure Drunk. An impaired cleanser cannot cleanse another person. A ward can save a Whisperer victim while leaving that victim impaired.

## Numbers and symbols

Villagers are referenced as #01 through #12, including targets, clues, evidence, accusations, confirmations, and replay descriptions. Number ranges are compacted only when consecutive; otherwise the actual numbers are listed. The numbers never change when somebody dies.

Each character has an original, distinct SVG sigil. The board and inspector render the **claimed** character's sigil during play. They never render an unrevealed true-role symbol or encode a hidden team in its color. After an explicit reveal, the visible symbol may change to the actual character. Text names, numbers, focus states, and accessible labels remain alongside the symbol; color is not the sole identifier.

The default sandbox and each sealed case have twelve unique claims and twelve unique actual character identities. Good Citizens are not randomly duplicated. The Drunk believes a different, unused Citizen role rather than automatically creating another Countkeeper.

## Believable bluff policy

The introductory sandbox seed 0 is curated and duplicate-free. **New disguises** chooses a positive seed and redraws enemy claims, without moving true teams or changing the true roster. For each enemy independently:

- 90% branch: choose uniformly from still-unused Citizen claims.
- 10% branch: copy a Citizen claim held by a Good character (including the Good Drunk's claim).

Previously assigned enemy claims are excluded from the unused pool. Rejection-sampled, deterministic C++ randomness avoids a modulo-biased branch choice. The 10% is per enemy, not per whole village; a village can have more than one collision. The same seed gives exactly the same claims and replay. Matching claims are an intentional exception, not an automatic proof of Evil.

The two sealed cases are authored, not randomized: their curated claims are unique. Do not describe them as random 90/10 draws. Future identity-copying Evil/Burden powers must explicitly authorize additional collisions; there is no implicit duplicate-role rule.

## No accidental self-confessions

All raw informational target groups exclude their own speaker. Small statements such as "Both #04 and #07 appear Evil" cannot accidentally include the person saying them. False outputs must still be legal outputs for that ability and its actual target scope.

This does not prevent contradictions across witnesses; those are the puzzle. It prevents a generic bluff generator from announcing its own Evil identity. A verification can refer to another historical report about the verifier; it names a report ID, not a newly generated self-accusation.

Enemy testimony may be true. The sandbox uses a deterministic bluff policy in which some enemy readings are accurate; it never uses truthfulness as a public allegiance flag. Sealed-case enemies may make either observation under the published constraint model.

## Living neighbors and historical targets

Countkeeper walks clockwise and counterclockwise until the first living *other* villager in each direction. Dead seats are skipped. If only one other person survives, count that person once. With none, report no living neighbors. Exact counts always lie between zero and the number of actual targets.

Every sandbox report stores a public `subjects` bitmask for its original targets. A later death, mark, or impairment never rewrites the old report or its targets. Boolean pair results use separate same-team and exactly-one event kinds so replay never confuses their meanings.

## Rules and save versions

Both C ABIs are now version 2. Sandbox saves use `falsewake.case.v2`; sealed saves use `falsewake.sealed.v2.<caseId>`. The language key remains `falsewake.language.v1`. Existing v1 saves are left untouched, not silently interpreted using a different roster or different solutions. Old sealed replay imports are rejected atomically.

This release is not a procedural village generator, a dynamic-scenario uniqueness proof, or an APK release. Sealed-case validation and its limits are documented in [sealed-cases.md](sealed-cases.md).
