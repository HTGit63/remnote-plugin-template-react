# RemNote MCP Tests 02–15 — Live Campaign Report

- **Campaign date:** 2026-07-16
- **Checkpoint generated:** 2026-07-17T16:35:33+03:00
- **Model:** Codex (GPT-5)
- **Approved mutable root:** `Plugin Test` (`OjLcSppWfIH0cpPoh`)
- **Deployed plugin branch:** `fix/remnote-mcp-mass-note-creation-stability`
- **Deployed plugin commit:** `76c6e2d0aa232f042c5b87d24d5729b8b7d87e51`
- **Requested scope:** redo Tests 02 and 04; run Tests 05–15, including required repeats and recovery challenges
- **Current campaign verdict:** `LIVE_BLOCKED_CONNECTION_DURING_TEST_11_RUN_02`

## Executive summary

Live execution now completes the corrected Test 02 read-only target, Tests 04–08, Test 09 main/repeat/recovery, and Test 10. Test 09 Repeat Run 02 independently reproduced the guarded correction workflow; its recovery challenge classified all five allegations as false or already correct and made zero mutations. Test 10 rejected four unsafe hierarchy probes, applied two guarded moves and three exact reorders, and preserved all 27 Rem IDs and texts.

Test 11 Run 01 completed the reference, one saved template, one chemistry target, exact readback, and reference-preservation proof. It passed with warnings because the deployed formula classifier over-applied blue emphasis and the deployed design/card verifiers misread native style metadata and direct Concept -> Descriptor pairs. Test 11 Run 02 then created exactly one root and one complete 43-node styled reference before the plugin disconnected. Two bounded recovery checks failed, so later live mutations are safely blocked at a certain read-only checkpoint. No write is uncertain, no later test has been falsely marked run, and no mutation was made outside the approved `Plugin Test` subtree.

## Flying-colour status table

| Test | Status | Verdict | Live artifact / proof | Score |
| ---: | :---: | --- | --- | ---: |
| 02 | 🟢 | `PASS_WITH_WARNINGS` | Test-02-only target `Nuclear Phyiscs` (`W4gpxhuH1uhVGGuvF`); ID, breadcrumbs, rich state, 11 root children, and 7 Chapter One children live-read; 0 mutations | 83.85 |
| 04 | 🟢 | `PASS_WITH_WARNINGS` | root `Tte2RmAIX3VhMPfGY`; lesson `BhHw2LOQ51BHL9euC`; 83 Rems; 6/6 sections; 6/6 representative formulas; 0 cards | 95.60 |
| 05 | 🟢 | `PASS_WITH_WARNINGS` | root `UuPPkuSH1iMX0PJIM`; import `MBjqpCgoxNRG5iIaJ`; 137 Rems; 10/10 formulas; exact 25-cell table; exact code lines | 94.65 |
| 06 | 🟢 | `PASS_WITH_WARNINGS` | root `qdZjGXEM4Ccf9tN7B`; note `pquseu5MirT57jTom`; 60 Rems; 32/32 rich formula occurrences | 98.20 |
| 07 | 🟢 | `PASS_WITH_WARNINGS` | root `LmBldceWhnSWxbteK`; fixture `nJXx47X0QnZCBXIwI`; 21/21 IDs; all supported styles/types/bullets/replacement exact; headings honestly unsupported | 94.05 |
| 08 | 🟢 | `PASS` | root `QiYWjNVfpQNrnGKBi`; lesson `6OG1NIWsLLQ3B8XXn`; 20/20 originals preserved; 34/34 extension Rems exact | 98.10 |
| 09 main | 🟢 | `PASS_WITH_WARNINGS` | root `UdzAb1oWxLcakeg9o`; lesson `CgatNoAshzz6FgCD8`; stale guard rejected; target `aqW2hEBlzH528EOGJ` corrected in place | 99.20 |
| 09 repeat | 🟢 | `PASS_WITH_WARNINGS` | root `s2DpJ6uQL8lc5SDMV`; lesson `1abQIRX0MOjXJQ85o`; stale guard rejected; original target `BphAWl3Jg9PuGIC0x` corrected in place | 98.85 |
| 09 recovery | 🟢 | `RECOVERY_PASS_WITH_WARNINGS` | main root `UdzAb1oWxLcakeg9o`; five allegations read as false/already correct; 0 mutations; direct-child fallback closed one tree-reader omission | 100 |
| 10 | 🟢 | `PASS_WITH_WARNINGS` | root `WDrbu99HPFzgFC3Nd`; fixture `DTfnMH2DPzLYKHdLZ`; 4/4 unsafe probes rejected; 27/27 IDs/texts preserved; exact final hierarchy | 98.50 |
| 11 run 01 | 🟢 | `PASS_WITH_WARNINGS` | root `ULl5YjWeiwqjNBvh9`; reference `7bFwrcOFLe6x7IwYh`; one saved template; chemistry target `NbVoUlg1EQdrJaHnU`; exact hierarchy/style/preservation reads | not rescored |
| 11 run 02 | 🟡 | `BLOCKED_CONNECTION_CERTAIN_BOUNDARY` | root `sXTWaFg3F9XIyZBSl`; complete 43-node reference `pwRROIyjk0yeUqHhx`; manual readback is next; 0 uncertain writes | pending |
| 12 | ⚪ | `NOT_RUN` | prompt extracted | pending |
| 13 main | ⚪ | `NOT_RUN` | prompt extracted | pending |
| 13 repeat | ⚪ | `NOT_RUN` | repeat-control prompt extracted | pending |
| 13 recovery | ⚪ | `NOT_RUN` | recovery prompt extracted | pending |
| 14 run 01 | ⚪ | `NOT_RUN` | prompt extracted; four-chunk resumable import required | pending |
| 14 run 02 | ⚪ | `NOT_RUN` | second independent run required | pending |
| 15 run 01 | ⚪ | `NOT_RUN` | prompt extracted | pending |
| 15 recovery | ⚪ | `NOT_RUN` | eight-case classification/targeted-repair challenge extracted | pending |
| 15 run 02 | ⚪ | `NOT_RUN` | second independent run required | pending |
| 15 run 03 | ⚪ | `NOT_RUN` | third independent run required | pending |

Completed current-run score mean for Tests 02 and 04–10, counting Test 09 main and repeat as scored core runs but excluding recovery: **95.61/100**. This is a checkpoint statistic, not the final Tests 02–15 campaign score.

## Connection and scope proof

Before live writes, the bridge reported connected with one plugin, zero pending operations, initial sync complete, hosted mode, developer profile, SDK `0.0.46`, and deployed commit `76c6e2d0...`. Ping, plugin status, focused Rem, current selection, and breadcrumbs all independently identified `Plugin Test` (`OjLcSppWfIH0cpPoh`) as the approved mutable root.

Initial proof operations included:

- bridge status: `status-mrnkee5m`
- ping: `63a1f418-...`
- plugin status: `a282affc-...`
- focused Rem: `181ee902-...`
- current selection: `3295d303-...`
- approved-root breadcrumb: `82e28937-...`

All writes listed in this report were descendants of that root. Read-only searches outside it were permitted by the campaign rules; no external Rem was changed.

## Test 02 — Information Retrieval and Note Understanding

The approved-root direct-child listing and three bounded searches found no exact match for `Nuclear Physics — Chapter One Full Bulk Import Test — 2026-06-24`. The scoped exact search operation was `65866c94-...`; workspace exact and close searches were `868e6cd8-...` and `9d918a29-...`. Search results contained unrelated fuzzy matches only.

Initial classification was **`BLOCKED_TARGET_NOT_FOUND`**. The user then supplied the exact Test-02-only target ID `W4gpxhuH1uhVGGuvF`, titled `Nuclear Phyiscs`. Current live read-only verification resolved that ID to `3rd Year Notes > Semester Two > Nuclear Phyiscs`, confirmed H1/hidden-bullet root metadata, returned all 11 direct children and all seven Chapter One direct children, and read a bounded academic tree. Direct operations included `6aff3339-...`, `0c55c0b6-...`, `51d41ea3-...`, `9caee0ab-...`, `f0c510d4-...`, and `ccd00657-...`.

The separate Chapter One tree call reproduced a known reader failure; direct-child fallback returned the exact five ordered academic sections. Test 02 made zero mutations, and this ID was not used by any other test. Verdict: **`PASS_WITH_WARNINGS`**.

## Test 04 — Clean Structured Academic Note

Exactly one root was created beneath `Plugin Test`:

- root: `RemNote MCP Test 04 — Clean Structured Academic Note — 2026-07-16 — Run 01`
- root ID: `Tte2RmAIX3VhMPfGY`
- root creation operation: `9742873f-...`
- root idempotency key: `remnote-mcp-test04-20260716-run01-root-v1`
- approved-root child count: 4 before, 5 after

The preview (`server-local-preview-1784210022591`) predicted 83 nodes, depth 4, 18 block-math occurrences, and 25 inline-math occurrences. The writer operation `f0392e7a-...` created lesson `BhHw2LOQ51BHL9euC` with 83 Rems and passed semantic verification.

Readback proved exactly six direct sections in order. Selective subtree reads closed the broad-reader 50-node truncation boundary. Six representative formulas were rich block math. Card verifier `5671eba0-...` found zero cards. No repair or out-of-scope mutation occurred.

Verdict: **`PASS_WITH_WARNINGS`**. Native heading metadata and ordered numeric marker styling were unavailable, but required content, hierarchy, formulas, and safety were correct.

## Test 05 — Exact Markdown Source Fidelity

The actual bounded fixture was 230 lines, 6,468 characters, 6,511 bytes, SHA-256 `519c3b015ff7d358b18d302630b54467e1f347c1ca71d362951b2e6fcd7f0557`. It differed from the prompt's declared manifest because of six bare bracket equation wrappers, three missing inline wrappers, one four-backtick close, and the final bullet marker. Only structural delimiter normalization was performed; prose, values, formula bodies, code, table cells, and order were not rewritten.

- root: `UuPPkuSH1iMX0PJIM`
- imported lesson: `MBjqpCgoxNRG5iIaJ`
- final preview: `server-local-preview-1784210845691`
- writer operation: `0fb71689-...`
- size: 137 Rems; depth 5
- semantic verification: passed
- formulas: 10/10 required rich reads exact
- table: 25/25 cells exact and ordered
- code: 9/9 non-empty lines exact, blank groupings preserved, no fences
- cards: 0

One invalid verifier input (`maxDepth=5` where the schema permits at most 4) was recovered with a corrected read-only call, operation `83ab5ebf-...`. Verdict: **`PASS_WITH_WARNINGS`** for representation-only fallbacks such as plain-text code and unavailable native heading/list metadata.

## Test 06 — Scientific Formula and Rich-Text Fidelity

The fixture exactly matched its canonical source manifest: 3,180 characters, 3,184 bytes, SHA-256 `69c061ec8defc586335c62acd96779009dc354c2d3e730f72ac93ecb39bbe7f8`. It contains 164 logical lines plus the terminal-position convention described as line 165.

- root: `qdZjGXEM4Ccf9tN7B`
- scientific note: `pquseu5MirT57jTom`
- preview: `server-local-preview-1784211106196`
- writer: `8e105f69-...`
- artifact: 60 Rems, seven direct sections
- formula audit: 32/32 occurrences passed
- inline math: 12/12 exact
- block math: 20/20 exact
- core and stress-case success: 100%
- cards: 0, verifier operation `5693ba2c-...`

Aligned, boxed, text-bearing, and chained-inequality stress formulas remained intact. No raw delimiters, malformed formulas, missing formulas, fallbacks, or repairs occurred. Verdict: **`PASS_WITH_WARNINGS`** only because native heading metadata remained unavailable.

## Test 07 — Precision Styling

Exactly one root and exact 21-Rem baseline fixture were created:

- Test 07 root: `LmBldceWhnSWxbteK`
- fixture root: `nJXx47X0QnZCBXIwI`
- root creation operation: `30193975-f829-...`
- fixture writer operation: `47bbe7f6-...`
- baseline tree read: `d33a1dbe-...`
- preview: `server-local-preview-1784211343492`

The preview and complete readback proved one fixture root plus 20 descendants, seven ordered sections, exact target text, original IDs, neutral types, and formula control `A(t)=A₀e^(−λt)`.

Style-plan dry-run `9cdb63e9-9651-...` passed. The live style-plan wrapper returned a generic runtime error, so no blind retry was made. Immediate rich readback established the actual outcome:

- exact bold span: passed
- exact italic span: passed
- exact red-text span: passed
- exact yellow-highlight span: passed
- exact whole-Rem green highlight: passed
- eight heading-property mutations: unsupported; all remained `normal`
- all target plain text: unchanged

After reconnection, pre-write reads proved that the four property targets and replacement target were still neutral and beneath the verified fixture, while focus and selection both remained `Plugin Test`. The already-applied style plan was not replayed.

- concept type: `1tiQ4jMfmG8R8be4Y`, operation `86d5cf65-...`, readback `remType=concept`
- descriptor type: `YL0IFC0TDuIAwWtLN`, operation `82facfa6-...`, readback `remType=descriptor`
- visible bullet: `m0xdBhDJb21GLUt4u`, operation `021345c3-...`, readback `hideBullet=false`
- hidden bullet: `jLdd9Nf4TTFaKy5x7`, operation `4161c902-...`, readback `hideBullet=true`
- exact rich replacement: `UQ7CKPJaUAyhpvVkl`, operation `0ff2842f-...`; only `10 minutes` is bold

Independent rich reads then reverified all prior span styles, whole-Rem green highlight, types, bullet states, formula text, replacement text, the seven-section order, and the complete 21-ID hierarchy. Parent, sibling-order, child-order, and expected plain-text invariants passed in the mutation responses. Existing-Rem headings remain honestly `PROPERTY_UNSUPPORTED`; no visible metadata-child workaround was used. Verdict: **`PASS_WITH_WARNINGS`**.

## Test 08 — Safe Extension of an Existing Note

- root: `QiYWjNVfpQNrnGKBi`
- lesson: `6OG1NIWsLLQ3B8XXn`
- extension parent: `yXBQTUhl78XuawHIo`
- original baseline: 20 Rems, exact before-state tree operation `ac0509ba-...`
- simple append: `tr7u7UaNAlk1ajojO`, operation `7174a4e1-...`
- SEMF tree: `kiCZbH3MHbGRUDEE4`, 20 Rems, operation `8ea57648-...`
- worked-example tree: `a4anfQc0yDFGq5wnZ`, 13 Rems, operation `617f6f87-...`

Final direct-child order under `4. Advanced Topics` is exactly reserved child, simple child, SEMF section, worked-example section. The original 20 IDs, texts, parents, order, formula `B=Δmc²`, Helium-4 example, and three-point summary remained exact. All 34 required extension Rems were independently read. No movement, reorder, replacement, deletion, cards, duplicate, or repair occurred. Verdict: **`PASS`**.

## Test 09 — Safe Factual Correction

Main Run 01 created root `UdzAb1oWxLcakeg9o` and exact 16-Rem lesson `CgatNoAshzz6FgCD8`. The target was uniquely identified as `aqW2hEBlzH528EOGJ`, second child of `oZ4kg4kqk85x3xJlz`, between formula `ldoMc5lnj1ciOMaJD` and the similar correct statement `l4I6Ssf0zQR9u9fl4`.

Dry-run operation `46ea7ceb-...` confirmed the intended guarded replacement. The one required stale call was rejected with `STALE_STATE_CONFLICT`; mandatory rich and sibling reads `f070ff43-...` and `5f7a05e8-...` proved no mutation. Valid guarded operation `6dacabca-...` changed only the existing target to `A larger decay constant λ corresponds to a shorter half-life.` Final target, sibling, full-tree, and formula reads preserved all 15 non-target Rems and both formulas. Verdict: **`PASS_WITH_WARNINGS`**, limited to the client surfacing the structured stale rejection as a generic runtime exception.

Independent Repeat Run 02 collision search `0ef62502-...` found no exact root. The following root-write operation `9c9080a4-...` failed before plugin execution with `PLUGIN_NOT_CONNECTED` and zero mutations. It is safe to retry the same idempotency key after reconnection.

### Test 09 independent repeat completion

The safe retry created the intended existing Run 02 root exactly once using the original retry identity:

- root ID: `s2DpJ6uQL8lc5SDMV`
- root creation: `f0727364-68fc-4de3-be91-e0e915fb5cf1`
- idempotency key: `test09-root-20260716-run02`
- lesson ID: `1abQIRX0MOjXJQ85o`
- baseline creation: `4f2cc5cb-f113-436b-baad-17fed375d1e4`
- baseline size: 16 exact Rems
- correction target: `BphAWl3Jg9PuGIC0x`

Dry-run `4e768d50-f799-4962-8646-25ea7f32af45` previewed the exact replacement but exposed a standard-envelope bug: the inner result was `dry_run`, while the outer envelope falsely reported one update. Stale operation `5f8765aa-4d2d-40f0-b9cd-9a2356c9b46a` then rejected the deliberately wrong expected text with `STALE_STATE_CONFLICT` and zero mutations. Mandatory rereads proved the target, parent, formula, neighbor, and order unchanged. Valid guarded operation `f79f8436-8032-41b6-ba48-9a2d6a7b44b8` corrected the original target in place. Final tree `59d8397d-47c9-40e2-9c4c-e2c02a1db54a` proved all 16 IDs and all 15 non-target texts unchanged. Verdict: **`PASS_WITH_WARNINGS`**.

### Test 09 recovery challenge

Recovery used the existing main Run 01 root `UdzAb1oWxLcakeg9o`, lesson `CgatNoAshzz6FgCD8`, and target `aqW2hEBlzH528EOGJ`. Read operations `40a9c78c-6247-4c98-9f47-e2dae080f006`, `42a6e1bd-...`, `efa10c08-...`, `03f2e93b-...`, `85496604-...`, `90ff5bdf-...`, and `2de8e881-...` established:

1. The corrected target was already exact.
2. The neighbor was unchanged.
3. The formula was unchanged.
4. The target retained its original ID, parent, and index.
5. Summary order was unchanged.

The bounded tree reader omitted two Definition descendants while marking their parent leaf-like. Direct-child operation `2949ef86-0018-403b-9d99-ff01ff4dd32d` proved both exact children still existed. The artifact required no repair and received zero mutations. Verdict: **`RECOVERY_PASS_WITH_WARNINGS`**.

## Test 10 — Hierarchy Surgery

- root: `WDrbu99HPFzgFC3Nd`
- root creation: `4bd9578d-0918-4954-882e-75089372dd2d`
- fixture: `DTfnMH2DPzLYKHdLZ`
- fixture creation: `aa335197-4fbe-4df5-8f97-481a91f44393`
- baseline size: 27 exact Rems

Four read-protected probes all rejected before mutation:

| Probe | Expected rejection | Operation | Post-probe result |
| --- | --- | --- | --- |
| Incomplete full reorder | `INVALID_ARGS`, missing Summary ID | `1a45a1b0-a93b-42dc-89ff-0fb0b51e3941` | lesson order unchanged |
| Move with stale expected parent | `STALE_STATE_CONFLICT` | `1fcce8c5-8565-4b6b-bbbc-b87e7fb8e576` | Overview, Conservation, breadcrumb unchanged |
| Move ancestor beneath descendant | `INVALID_ARGS`, cycle | `71802db2-0229-4d23-8bd3-6b7b952692ca` | lesson and Worked Example unchanged |
| Out-of-range index 99 | `INVALID_ARGS` | `b76d1e91-fdfd-4e5c-a8d7-741890536db9` | lesson order unchanged |

The valid plan then:

1. moved `IUngUaUoSPAlaFESF` from Overview to Conservation index 1 (`f0a24df0-e806-462a-92e3-660847dfe380`);
2. moved Final Answer `U405cmGTy4sOH31JU` from Summary to Worked Example index 3 (`338788a7-b60d-4350-b2eb-c757c8ec9f22`);
3. reordered the five principal sections (`5efd224c-2d18-4383-ad09-56f6c21028aa`);
4. reordered Q-Value definition/formula/exoergic/endoergic (`4f282f5b-2ed6-4857-bb2c-506d31e85e93`);
5. reordered the three Summary statements (`9c5b3d6b-7cc3-43c6-bc4e-f6b900a33071`).

The first real Summary reorder request failed at the connector HTTP transport. Connection/readback showed the desired order had not applied, so retrying the same idempotency key was safe. Final tree `0d7240c1-56e5-4a83-b2c7-3bf343e6f8d0`, direct reads, breadcrumbs, and formula rich read `e61fb38c-40a6-4ae8-9fb3-131551adda2e` proved the exact desired hierarchy, all 27 IDs/texts preserved, and zero cards (`4b8a4bc4-2999-448a-97d9-24da18b13b99`). The deployed standard envelope incorrectly reports zero updates for real moves and reorders; local red/green tests now normalize moved and changed-order IDs. Verdict: **`PASS_WITH_WARNINGS`**.

## Test 11 Run 01 — Complete live run

Collision search `b0a0eb04-5433-4538-90ce-39bf130b7016` found no exact current-date Run 01 title. Root operation `9ac9c72b-cf20-4376-8204-260411d4cdce` created exactly one root `ULl5YjWeiwqjNBvh9` with idempotency key `test11-root-20260717-run01`.

Reference root `7bFwrcOFLe6x7IwYh` was created from a 37-content-Rem styled plan. Six non-visible U+200B spacers were added and exact root order was proven by `62c4156b-82ce-4023-ab05-6db7fa31ef89`. Rich reads proved the exact yellow/bold `Key idea:` span, blue principal formula, green answer, red/bold warning, visible summary bullets, and two concept/descriptor pairs. Analyzer `41941955-e317-4b95-808d-bbce4f40692e` reported 37 content Rems, six spacers, and eight exposed native `Size` property records.

Exactly one template was saved: `Test 11 — Clean Science Lesson Design — 2026-07-17 — Run 01`, ID `design-test-11-clean-science-lesson-design-2026-07-17-run-01`, operation `01541a5c-6445-4643-89f3-c4321840bb74`.

Target `Designed Lesson — Chemical Equilibrium` (`NbVoUlg1EQdrJaHnU`) was previewed by `846ad964-4c93-4e74-9cbe-3e5912c5ca66` and created by `00987f63-e5cf-4bb4-8edd-e6c6ba4bedf7` in Markdown mode. Exact hierarchy, title treatment, spacing, key-idea styling, principal-formula emphasis, positive answer, warning treatment, visible summary bullets, and both concept/descriptor pairs passed direct readback. Reference reads `1162e74f-...` and `94fe19ea-...` proved it remained unchanged. Root read `57f0d215-f20c-448b-afe4-71dda0247db9` proved exactly the reference and target children.

Two deployed defects remain visible. Analyzer `bac08e3b-99db-4390-bb55-b8a7d837aee2` showed formula emphasis over-applied to seven formula-like Rems instead of the principal formula only. Design/card verifiers treated native `Size` records as content and did not recognize direct Concept -> Descriptor pairs. Local TDD now narrows formula classification, filters verified property records, recognizes the pair hierarchy, and returns diagnostic mismatch as structured `FAIL` evidence instead of an MCP execution error. Run 01 verdict: **`PASS_WITH_WARNINGS`**.

## Test 11 Run 02 — Certain live checkpoint

Collision search `9ec45e59-70f5-46e3-be30-ea9e7f14622e` found no exact Run 02 root. Root operation `9c89657f-4545-4684-9dbc-f654d700e81b` created exactly one root `sXTWaFg3F9XIyZBSl` with key `test11-root-20260717-run02`.

Preview `442a4e8b-6334-4ac7-b065-601cca7bd05e` planned 43 nodes: 37 content Rems plus six spacers. Writer `e51d7698-4049-448a-a4d2-7b377ac35765` created exactly one styled reference `pwRROIyjk0yeUqHhx` with those 43 nodes and the required hierarchy, title/section headings, one purple Carbon-14 sentence, yellow/bold key idea, blue principal formula, worked-example labels, green answer, red/bold warning, visible summary, and two concept/descriptor pairs.

The next manual reference read failed before dispatch with `PLUGIN_NOT_CONNECTED`, operation `868e4a0f-b7b5-49a4-a5ac-a4c3e870e3aa`. No Run 02 template save or target creation has begun. The exact safe resume point is manual readback of `pwRROIyjk0yeUqHhx`; creating the root or reference again would be a duplicate.

## Connection lifecycle and current stopping boundary

The plugin reconnected at `2026-07-17T14:33:24.333Z` and disconnected at `2026-07-17T14:44:09.646Z`. Two bounded recovery checks reported `connected:false`, `pluginConnected:false`, zero active plugin connections, zero pending requests, and deployed SHA `76c6e2d0...`; the second status operation was `status-mrp1xi16`.

The boundary is certain: Tests 02 and 04-10 are complete, Test 11 Run 01 is complete with warnings, and Test 11 Run 02 has one root and one complete reference fixture awaiting readback. All post-disconnect calls were read-only and rejected before plugin dispatch. No uncertain write exists. The Test 12 prompt requires live mutation to stop after two reasonable connection-recovery attempts fail, so Tests 12-15 cannot safely begin until a plugin session reconnects.

## Local connection-lifetime repair

The local candidate now moves transport ownership to a persistent index-plugin runtime. The sidebar is a storage-backed view/approval adapter; detaching it no longer stops transport. Explicit approvals remain request-ID-bound, open the sidebar when needed, never auto-approve, and resolve cancellation/timeouts safely. Permission/scope snapshots update without socket replacement; only connection identity changes recycle the socket.

TDD evidence:

- RED: missing persistent runtime module
- GREEN: sidebar detach and replacement-subscription lifecycle
- RED/GREEN: request-ID-bound cross-widget approval channel
- RED/GREEN: truthful `disconnected` and `not_paired` snapshots replace stale connected state
- focused connection/UI suite: passed
- partial-result mapper regression: `PARTIAL` preserves structured evidence without becoming an MCP transport error; true `FAIL` still sets `isError`
- focused runtime/channel/mapper suite: 3 files / 17 tests passed
- fresh full suite after all current fixes: 32 files / 286 tests passed
- TypeScript: passed
- RemNote SDK validation: passed
- production plugin build: passed with existing webpack size warnings
- server TypeScript build, auth/security regression, boundary smoke, hosted routing, idempotency certification, style correctness, full smoke, and tool-schema certification: passed

This is local code proof only. Deployed commit remains `76c6e2d0...`; sidebar-close persistence requires plugin reload followed by live soak, then push/deploy only when the user authorizes branch finalization.

## Safety and mutation audit

| Check | Result |
| --- | --- |
| Writes outside `Plugin Test` | 0 |
| Deletes | 0 |
| Focus/selection changes | 0 |
| Blind retries after uncertain write | 0 |
| Duplicate current-run test roots | 0 observed |
| Cards created in Tests 04–09 | 0 |
| External academic sources | 0 |
| Tests falsely marked passed | 0 |

## Resume contract

After the RemNoteMCP connector is reauthenticated and the bridge reports `pluginConnected:true`:

1. Reconfirm focus, selection, approved-root ID, and breadcrumbs.
2. Resume Test 11 Run 02 at manual readback of reference `pwRROIyjk0yeUqHhx`; do not recreate its root or reference.
3. Save exactly one Run 02 template, create its chemistry target in the required second writing mode, and complete target/reference readback.
4. Execute Test 12, Test 13 main/repeat/recovery, Test 14 independent resumable runs, and Test 15 main/recovery/independent runs in prompt order.
5. Rerun the complete local validation gate, update this file and `AGENTS.md`, and only then issue the final campaign verdict.

## Report-integrity declaration

This checkpoint separates live proof, blocked outcomes, partial work, and unrun work. It does not treat historical reports, local code tests, preview output, or tool success messages as substitutes for current live RemNote readback.
