# RemNote MCP Tests 01–15 — Live Campaign Completion Report — 2026-07-17

## Executive result

The exact benchmark prompts, including required repeats and recovery challenges, were executed inside approved root `OjLcSppWfIH0cpPoh`. Reads outside the focused test subtree were read-only. No delete tool was used and no write was made outside `Plugin Test`.

This is live discovery evidence against deployed commit `76c6e2d0aa232f042c5b87d24d5729b8b7d87e51`, not deployment proof for the newer local fixes.

Final connection check: bridge status `status-mrp5sprh` returned `connected:true`, `pluginConnected:true`, one active plugin connection, zero pending requests, initial sync complete, and SDK `0.0.46`. Ping operation `af3aac14-d9bf-438e-b207-84538e30ce56` passed in 197 ms.

| Test | Result | Live evidence summary |
| --- | --- | --- |
| 01 | 🟢 `PASS_WITH_WARNINGS` | Connection, deployed SHA, session, and approved root confirmed. |
| 02 | 🟢 `PASS_WITH_WARNINGS` | User-supplied Test-02-only Rem `W4gpxhuH1uhVGGuvF` read safely; direct-child fallback closed a bounded tree-reader failure; zero mutation. |
| 03 | 🟡 `PARTIAL` | Correct tool choice and five cards passed; existing-Rem headings were honestly SDK-unsupported. Local dry-run/envelope fixes added. |
| 04 | 🟢 `PASS_WITH_WARNINGS` | 83-Rem structured lesson, six sections, formulas, hierarchy, and zero-card invariant passed. |
| 05 | 🟢 `PASS_WITH_WARNINGS` | 137-Rem import, formulas, table, code, hierarchy, and zero-card invariant passed with representation-only fallbacks. |
| 06 | 🟢 `PASS_WITH_WARNINGS` | 60-Rem note and all 32 rich formula occurrences passed with 100% mathematical preservation. |
| 07 | 🟢 `PASS_WITH_WARNINGS` | Supported spans, highlight, types, bullet states, rich replacement, hierarchy, formula, and text invariants passed. |
| 08 | 🟢 `PASS` | Exact baseline preservation and one 34-Rem extension passed with no movement, replacement, reorder, delete, card, or repair. |
| 09 main/repeat/recovery | 🟢 `PASS_WITH_WARNINGS` / `RECOVERY_PASS_WITH_WARNINGS` | Two stale-guard workflows repaired only the intended IDs; recovery classified all allegations without mutation. |
| 10 | 🟢 `PASS_WITH_WARNINGS` | Unsafe probes rejected; two moves and three reorders preserved every ID and text. |
| 11 Run 01/02 | 🟢 `PASS_WITH_WARNINGS` | Two independent design learn/save/apply workflows completed. Direct role/style/card readback passed; deployed generic verification retained native-property/classifier warnings. |
| 12 | 🟡 `PARTIAL / PASS_WITH_LIMITATION` | 42 original IDs preserved plus one required spacer; 3/4 confirmed repairs applied; existing-Rem heading remained SDK-unsupported; 11/12 supported compliance. |
| 13 main/repeat/recovery | 🟢 `PASS_WITH_WARNINGS` | Exact Run 02 produced 14/14 functional cards and aggregate verifier `PASS`; sources unchanged; recovery performed zero mutations. |
| 14 Run 01/02 | 🔴 `BLOCKED_JOB_STATE` | Both four-chunk jobs verified chunks 1–2 and reproduced `actualNodeCount=40; maxNodes=30` on chunk 3. No blind retry or unsafe reconciliation. |
| 15 Run 01/02/03 + recovery | 🟢 `PASS_WITH_WARNINGS` | Three 160-node modules, 12 requested cards per run, three controlled same-ID repairs, and no-mutation recovery passed. Native `Size` metadata remains visible to deployed aggregate counts. |

## High-signal live findings

### Connection restoration

The live connector remained usable for the completed campaign, but the browser transport can remain stuck in WebSocket `CONNECTING` after an internet outage. The local candidate now listens for browser `online`, closes/replaces a stale socket, resets backoff, and opens a fresh connection without requiring manual plugin reconnection. This is unit-proven only until plugin deployment/reload.

### Test 14 release blocker

Both fresh Test 14 runs used the exact 6,149-character bounded source and planned exactly four logical/native chunks. Each verified chunks 1–2, then chunk 3 failed before content mutation because the deployed companion wrapper supplied `maxNodes=30` to a table chunk whose exact planned node count was 40. A section root alone was created, the job was marked partial/reconciliation-required, and the connector exposed no reconciliation tool in this session. The local candidate now derives `maxNodes` from `estimatedRemCount` and exact manifest units. Targeted TDD and the full suite pass, but no live completion may be claimed before deployment/reload.

### Native property records

The RemNote SDK materializes heading metadata as native `Size` records in this deployed build. They do not invalidate direct content/card checks, but they pollute generic child/card counts. Local readers/verifiers filter verified native `Size`/`Color` records while preserving actual content. Native mutation of an existing Rem heading remains honestly unsupported.

## Test 11–15 artifact manifest

| Artifact | IDs / result |
| --- | --- |
| Test 11 Run 01 | root `ULl5YjWeiwqjNBvh9`; reference `7bFwrcOFLe6x7IwYh`; target `NbVoUlg1EQdrJaHnU`; template `design-test-11-clean-science-lesson-design-2026-07-17-run-01` |
| Test 11 Run 02 | root `sXTWaFg3F9XIyZBSl`; reference `pwRROIyjk0yeUqHhx`; target `hbrZT0NrzKFTHGfs9`; template `design-test-11-clean-science-lesson-design-2026-07-17-run-02` |
| Test 12 | root `EcLKxRJzkvTEXQWCH`; fixture `Dy9Klw3unZomzsKcV`; 42 originals + one spacer; 11/12 |
| Test 13 Run 01 | root `9e91QOcqeZY465R1N`; academic `jXaVHSt5uprhY6wxP`; markdown `TCcYL0Wv4m8iD7Qa0`; collection `pzox7Oe3BTvDt6uQv` |
| Test 13 Run 02 | root `GMNfzaCUSFYIaFPMP`; academic `AsU4t3i9G1itbSjcb`; markdown `V5YuXIdVojzmFXXLQ`; collection `zn2p8dTjStMuZoqWv`; verifier operation `065827b2-a4e6-4091-85f3-674fcf2fba1e` |
| Test 14 Run 01 | root `LrJLwj6KHjq33kaRQ`; job `test14-mechanical-waves-run01-20260717`; chapter `jgdkz0TW0MRAnHKfK`; blocker `actual 40 > max 30` |
| Test 14 Run 02 | root `VNf2RJG1iYjAAf5wn`; job `test14-mechanical-waves-run02-20260717`; chapter `mR7GNfOeF0SEVjLuv`; blocker reproduced |
| Test 15 Run 01 | root `ud8LrqymXrkl0m3SS`; module `7xJiCOPRFqeUsBcNx`; review `xk3W8l6t85iktsIfj`; controlled target `MUnFduvjwOg0kiG9R` |
| Test 15 Run 02 | root `rne4NnlxsxAH0ICGm`; module `ln5t9ztZUmcq51cLu`; review `4onwlQgp0IjIpLjVa`; controlled target `jYNOf3gEhoJVocTQL` |
| Test 15 Run 03 | root `vWzfylPf3wDotD89u`; module `rOPjFkMg1dWhSk6VC`; review `mMEQphu0vt4g9gP0j`; controlled target `IVc3prwz81YggIosN` |

## Local repair verification

| Gate | Result |
| --- | --- |
| `npm test` | 🟢 32 files / 288 tests |
| TypeScript | 🟢 PASS |
| SDK validation | 🟢 PASS |
| Plugin build | 🟢 PASS; performance-size warnings only |
| Server build | 🟢 PASS |
| Style correctness | 🟢 PASS |
| Tool schemas | 🟢 PASS |
| Security/session regression | 🟢 PASS |
| Boundaries | 🟢 PASS |
| Idempotency | 🟢 PASS |
| Health routing | 🟢 PASS |
| Memory/CAS bulk-storage smoke | 🟢 PASS |
| PostgreSQL bulk-storage proof | 🟡 `BLOCKED`: `DATABASE_URL` not configured |
| Registry production audit | 🟡 Historical only; installed npm registry quick-audit endpoint returns HTTP 410 |

## Release decision

`NOT_READY_TO_DEPLOY_AS_FINAL`.

The ordinary live RemNote workflows and the complete Test 15 capstone are strong. The release blocker is narrow and concrete: deploy/reload the local reconnect and Test 14 chunk-budget fixes, then complete two persistent Test 14 runs without replay, lost IDs, verifier mutation, duplicate content, or state/artifact disagreement. No commit, push, deployment, or branch finalization was performed in this phase.
