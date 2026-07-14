# RemNote MCP Tests 01–15 Post-Deploy Verification Report — 2026-07-14

## Executive verdict

`PARTIAL_PASS_WITH_BLOCKING_TEST_14_PLANNER_DEFECT`

All fifteen benchmark prompts were recovered from the 23 historical Markdown reports and exercised against deployed commit `81eef931bf598fcb46d89c8a44f1f4d4a7034320` on branch `fix/remnote-mcp-mass-note-creation-stability`. The bridge was connected before mutation, initial sync was complete, one plugin session was active, and the session stayed healthy for approximately 55 minutes. The run was confined to `Plugin Test` → `New test`; `Old test` was not mutated.

The campaign did **not** earn an honest 100/100 across all tests. Tests 09 and 13 were clean controls, the core content/card paths were generally strong, and no scope violation or persistent duplicate was observed. Test 14 stopped at its required pre-job safety gate because the deployed planner returned five logical sections instead of four. Tests 03, 04, 07, and 11–12 also retained SDK or design-verification limitations. No replacement Test 14 job was created after the failed gate.

Post-campaign code changes are local proof only. They were not live-retested because the deployed plugin cannot change until the user pushes and refreshes it.

## Proof boundary

| Evidence layer | Commit or artifact | Status |
| --- | --- | --- |
| Historical benchmark evidence | 23 report files dated 2026-07-12/13 | Read; prompts separated from observed results |
| Live RemNote campaign | Deployed `81eef93` | Tests 01–15 executed below `New test` |
| Local remediation | Working tree after `81eef93` | Unit/type/build proof only; not deployed |
| Post-fix live proof | Next pushed/deployed commit | Required; not yet available |

## Connection, deployment, and scope proof

- Approved root: `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- Organization root: `New test` (`SMPeZUPMV64bHl7JI`).
- Preserved sibling: `Old test` (`8RmenkVwDXr88CQYy`).
- Campaign root: `Post-Deploy Benchmark 01–15 — 2026-07-14 — 81eef93` (`3QR2MpAEihc3YMXkJ`).
- Runtime: hosted Render bridge, SDK `0.0.46`, one active session, initial sync complete.
- Health check: 34 checks passed, 0 failed, 39 write checks intentionally skipped by the read-only health profile.
- Long-run observation: no reconnect attempt, late response, or pending-request leak was reported during the approximately 55-minute campaign.
- Connector drift: the installed `get_children` descriptor did not accept `startIndex` although current source supports it. Refreshing the connector after the next deployment remains required.

This proves the session was healthy during the campaign. It does not prove recovery from actual packet loss. Reconnect recovery is covered locally by new deterministic timer/socket tests and needs a post-deploy fault/soak run.

## Formula capability boundary

The supported operation is whole-Rem highlighting of the Rem that contains a formula. The SDK does not expose a safe way to change the formula glyph font color for inline or block math. Native heading mutation also remains unsupported on SDK `0.0.46` unless direct property readback proves a future capability. These are explicit SDK limits, not plugin defects to hide with visible metadata or destructive rich-text replacement.

## Test-level results

| Test | Live test root | Exact-prompt result | 100/100 gate | Main evidence |
| --- | --- | --- | --- | --- |
| 01 | Campaign root | `PASS_WITH_WARNING` | No | Connected, synced, one session, correct root; connector descriptor omitted `startIndex`. |
| 02 | `TlMjolAPUGSNMAXej` | `PASS_WITH_WARNING` | No | Semantic import and direct readback passed; symbol-heavy search returned a false negative for content available by ID. |
| 03 | `hZ0J3y9AfNA67Ziv7` | `PASS_WITH_SDK_LIMIT` | No | Tool choice/card behavior passed; deployed whole-formula-Rem highlight returned `SDK_UNSUPPORTED`. |
| 04 | `5MESqbpstKKxJlUET` | `PASS_WITH_SDK_LIMIT` | No | 82 Rems and required content/formulas were present; native heading readback remained `normal`. |
| 05 | `Ts0oqy3e7t6UPXIS2` | `PASS_WITH_REPRESENTATION_WARNINGS` | No | 6,467 source chars, 137 Rems, table/formulas and semantic text passed; code is a plain-text fallback and thematic break `---` remained visible. |
| 06 | `WQCcqnGIiMi2m9ddT` | `PASS` | Yes for requested formula creation | 60 Rems; formula content and structure read back exactly. Formula glyph color was not claimed. |
| 07 | `KMCbNuJQGd3kMfQKH` | `PARTIAL_THEN_REPAIRED` | No | `preserveBlankLines:false` still created six spacers and verifier falsely passed; a source-without-blank-lines recovery passed. Heading mutation remained unsupported. |
| 08 | `WHYKc255QjmZrYgO3` | `PARTIAL_THEN_REPAIRED` | No | Simple append passed; structured same-level append added a wrapper and duplicated `4.1`; targeted manual repair restored the expected tree. |
| 09 | `u5LezcbLjAbLdx4U6` | `PASS` | Yes | Guarded update passed; stale text returned `STALE_STATE_CONFLICT` with expected/actual evidence. |
| 10 | `OTqs4mAMHBVwDuDgQ` | `PASS_WITH_ERROR_TAXONOMY_WARNING` | No | Hierarchy surgery passed; stale expected parent still returned generic `INVALID_ARGS` on deployed code. |
| 11 | `ZgX1MM1RSQxQkz8ab` | `PARTIAL` | No | Correct target analyzed; one target root and seven sections created. Formula Rem highlight failed; answer label/result styling over-applied; summary bullets were hidden; self-manifest verification falsely passed incomplete semantics. |
| 12 | `48iGcjXz8p810G3aZ` | `PASS_WITH_ENVELOPE_AND_SDK_WARNINGS` | No | Approved warning repair passed and formula conversion preserved content; dry-run returned outer `ok:false` despite a valid plan. Heading/spacing mutation remained unsupported. |
| 13 | `Tdeqr4ELKCqm9ieV1` | `PASS` | Yes | All 14 functional cards passed direct metadata readback; aggregate verification passed and no duplicate cards were found. |
| 14 | `n1lnezbc0R6a7og8o` | `BLOCKED_BEFORE_JOB_CREATION` | No | Exact 6,149-char/6,243-byte bounded source planned as five logical sections because H1/preamble became a synthetic introduction. Required four-section safety gate prevented job creation. |
| 15 | `7a81FB7yGHV2gRkPT` | `PASS_WITH_DESIGN_LIMITS` | No | 154 Rems, exactly 11 direct sections, 12/12 cards, formula-ID-preserving repair, and no duplicate root passed. Whole-formula-Rem highlight and reusable design transfer inherited Test 11 limitations. |

## Test 11 artifact evidence

- Reference root: `zIt1aBHfgxYOLPKtc`.
- Template: `design-test-11-clean-science-lesson-design-2026-07-14-run-01`.
- Target root: `76wa1vO79It5UR7EY`.
- Target contained the correct chemistry content and exactly seven direct sections.
- Analyzer resolved the supplied source, not the focused Rem.
- No purple `Carbon-14` style leaked into the target. Aggregate color counts remained observations rather than reusable selectors.
- Deployed role classification applied green answer treatment to both the `Answer` label and result. The prompt requires the label to retain the worked-example subheading treatment and only the result to receive positive-result emphasis.
- Summary children read as hidden bullets although the source demanded ordinary visible bullets.
- `exact_manifest` verified the compiler’s own incomplete role map; it did not prove every semantic requirement from the benchmark.

## Test 12 artifact evidence

- Damaged-note root: `zvMFsvJzBpQqVmCFf`.
- The final warning repair passed direct readback.
- The dry-run repair plan was valid and mutation-free, but the deployed outer envelope reported failure because it inherited the failing pre-repair verification state.
- Native heading and spacing changes remained unsupported. The raw formula was converted without changing the requested formula content.

## Test 14 exact source and gate

The bounded source used in the campaign matched the prompt manifest:

| Property | Value |
| --- | ---: |
| Unicode characters | 6,149 |
| UTF-8 bytes | 6,243 |
| Source line count | 144 |
| SHA-256 | `2947ffedf423608e66a1d8bdbd9f963bd26b52065277b0b772b1ec56384e6d32` |
| Required H2 logical sections | 4 |
| Deployed logical sections | 5 |
| Persistent jobs created | 0 |

The local planner fix attaches the H1 and introductory paragraphs to the first H2 logical section instead of creating a synthetic introduction. A temporary exact-fixture proof after the fix returned four expected H2 titles, four logical sections, and four native chunks with `maxCharsPerChunk=24000` and `maxRemsPerChunk=120`. The temporary test file was removed; the durable smaller regression is in `tests/bulk-import.test.ts`. Full job execution, persistence, pause/resume, reconnect, reverification, and replay prevention still require a post-deploy Test 14 rerun.

## Confirmed defects and local response

| ID | Deployed behavior | Local change | Regression proof |
| --- | --- | --- | --- |
| `CONN-001` | Heartbeat could close a session after one missed pong rather than configured timeout. | Track last pong time and honor hosted/local heartbeat timeout. | `tests/bridge-reconnect.test.ts` |
| `CONN-002` | Client could stack reconnect timers, race stale socket close events, keep failed-registration sockets, and reset backoff too early. | One active connect/timer, captured socket lifecycle, stale-event guard, close failed registration, reset only after `server_hello`. | `tests/bridge-reconnect.test.ts` |
| `IMP-PLAN-001` | Test 14 H1/preamble became a fifth logical section. | Merge pre-H2 material into the first H2 logical section while retaining full section source manifest. | `tests/bulk-import.test.ts` plus exact temporary fixture proof |
| `MD-001` | `preserveBlankLines:false` still inserted section spacers. | Default `insertSpacerBetweenSections` to false when blank lines are explicitly not preserved. | `tests/bulk-import.test.ts` |
| `MD-002` | Markdown bullets relied on SDK defaults and could read back hidden. | Explicitly write Markdown list nodes with `hideBullet:false`. | `tests/bulk-import.test.ts`, `tests/design-template-phase3.test.ts` |
| `APPEND-001` | Same-level structured append introduced a wrapper/duplicate heading. | Route append fragments through `append_children_to_target`. | `tests/write-idempotency-duplicates.test.ts` |
| `ERR-001` | Stale expected parent returned `INVALID_ARGS`. | Return `STALE_STATE_CONFLICT` with expected/actual parent IDs. | `tests/read-error-phase6.test.ts` |
| `DES-001` | Answer emphasis styled both label and result. | Treat descendants of `Answer` as results; retain the label’s worked-example role. | `tests/design-template-phase3.test.ts` |
| `DES-002` | Numbered summary labels were not recognized and visible-bullet rules were not transferred. | Learn summary child treatment, preserve both true and false bullet visibility, and apply it to summary descendants. | `tests/design-template-phase3.test.ts` |
| `DES-003` | Valid dry-run repair reported outer failure. | A mutation-free valid plan returns `ok:true` while preserving failing before-state evidence. | `tests/design-template-preview.test.ts` |
| `RICH-001` | Whole formula Rem highlight was gated off by default despite native SDK support. | Enable native whole-Rem highlight by default; explicit false retains conservative fallback. | `tests/rich-repair-phase5.test.ts`, style correctness smoke |

## Local verification after remediation

| Command or proof | Result |
| --- | --- |
| `npm test` | PASS — 26 files, 249 tests |
| `npm run check-types` | PASS |
| `npm run validate` | PASS using a temporary SDK git-discovery shim because this sandbox blocks the SDK’s internal `/bin/sh`; shim removed |
| `npm run build` | PASS; plugin zip produced; webpack reported only existing bundle-size warnings |
| `npm run server:build` | PASS |
| Style correctness via `node --import tsx` | PASS |
| Source fidelity, Markdown importer, schema, idempotency, style schema, structured depth, direct-write, and performance Area 1 gates | PASS |
| Markdown pipeline benchmark | PASS for all cases |
| Performance benchmark | PASS; large formula case reported the expected fallback performance warning |
| `npm run server:smoke` | ENVIRONMENT BLOCKED — sandbox forbids `tsx` IPC and `127.0.0.1` listen |
| PostgreSQL bulk durability | EXTERNAL BLOCKED — `DATABASE_URL` is not configured; memory path passed and stale writer was rejected |

## Remaining post-push proof

1. Push and deploy the committed candidate, then refresh the ChatGPT connector descriptors.
2. Confirm one connected session and `server_hello` before any write.
3. Rerun Test 03 whole-formula-Rem highlight; do not test or claim formula glyph font color.
4. Rerun Test 07 blank-line handling and exact verifier readback.
5. Rerun Test 08 structured same-level append without wrapper creation.
6. Rerun Test 10 stale-parent conflict classification.
7. Rerun Test 11 twice, including answer-label/result separation and visible summary bullets.
8. Rerun Test 12 dry-run envelope and approved repair.
9. Rerun exact Test 14 twice with durable storage, forced pause/resume, read-only reverification, reconnect, and completed replay prevention.
10. Rerun independent Test 15 and a weak-network/heartbeat soak.

## Final recommendation

`PUSH_AND_DEPLOY_LOCAL_CANDIDATE_THEN_RUN_TARGETED_LIVE_GATES`

Do not claim a 100/100 release yet. The local candidate closes every currently reproducible code defect from this campaign, but Test 14 job execution and the other post-fix live paths cannot be proven until the user pushes and refreshes the plugin. SDK limitations must stay explicit rather than being counted as fixed plugin behavior.
