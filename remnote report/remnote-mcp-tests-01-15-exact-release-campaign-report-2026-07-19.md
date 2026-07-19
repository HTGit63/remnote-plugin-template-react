# RemNote MCP Tests 01–15 — Exact-Release Campaign — 2026-07-19

## Release identity and scope

- Branch: `fix/remnote-mcp-mass-note-creation-stability`
- HEAD/deployment: `aff5cbb71b4818c3e0e218d56355217099382904`
- Health: exact Git and deploy SHA matched
- Plugin connection: live; one active connection; zero pending requests
- SDK: `0.0.46`
- Initial sync: supported, complete, not timed out
- Focused approved root: `Plugin Test` (`OjLcSppWfIH0cpPoh`)
- Disposable campaign root: `Stage 6 Exact Release Proof — 2026-07-19 — aff5cbb` (`Tmbge6Mza34dYR7q5`)
- Permission boundary used: explicit IDs beneath the campaign root
- Destructive tools: none exposed; none called

Server health and bridge status were re-read live. Ping echoed
`stage6-aff5cbb-exact-release`. Campaign-root creation returned
`Tmbge6Mza34dYR7q5`; same-key repeat returned `already_applied` with no new ID.

## Exact-release verdict matrix

| Test | Verdict | Exact-release evidence |
| --- | --- | --- |
| 01 | `PASS_WITH_WARNINGS` | Exact SHA, connection, sync, SDK, focus, scope, and no-danger policy confirmed. Plugin runtime does not embed a separately readable build SHA. |
| 02 | `PASS_WITH_WARNINGS` | Read-only retrieval of `Nuclear Phyiscs` (`W4gpxhuH1uhVGGuvF`) and all 11 direct children passed. Source property records remain visible and were not mutated. |
| 03 | `PASS_WITH_WARNINGS` | Correct high-level tools chosen. Fresh basic card `9KLa5Ei2JjSjbEuG0` passed live property verification and same-key repeat. Existing-Rem heading limitations remain explicit. |
| 04 | `PASS_WITH_WARNINGS` | Existing full Test 04 root `Tte2RmAIX3VhMPfGY` read back. Fresh combined fixture `3YJzibRJqNMzhMG4s` created 24 nodes with verified hierarchy, formula, table, code, and zero cards. Native heading mutation remains limited. |
| 05 | `RECOVERY_PASS_WITH_WARNINGS` | Historical 2026-07-12 artifact was no longer present. Fresh Markdown fixture preview/write verified semantic content, math, ordering, table, code, no pollution, and same-key no-duplicate behavior. |
| 06 | `RECOVERY_PASS_WITH_WARNINGS` | Historical 2026-07-12 artifact was no longer present. Fresh rich Rem `bf43GXdSwya9GQ5LF` read back exact inline math nodes `E=mc^2` and `v=f\\lambda`; repeat was `already_applied`. |
| 07 | `RECOVERY_PASS_WITH_WARNINGS` | Fresh supported style witness `w62b2F9P32HJyAZhA` passed yellow whole-Rem highlight, blue `beta`, green-highlighted `gamma`, design verification, and idempotent repeat. Native heading limitations remain. |
| 08 | `RECOVERY_PASS` | Fresh additive extension created four IDs under preserved root `3YJzibRJqNMzhMG4s`; semantic verification passed; same-key repeat created nothing. |
| 09 | `RECOVERY_PASS` | Wrong `expectedPlainText` was rejected with `STALE_STATE_CONFLICT`; readback remained `Stage 6 guarded mutation baseline`. Correct guarded update then passed and repeated as `already_applied`. |
| 10 | `RECOVERY_PASS` | Full-list hierarchy reorder under `3YJzibRJqNMzhMG4s` passed dry run, mutation, exact child-order readback, and same-key no-op. IDs and text remained stable. |
| 11 | `PASS_WITH_WARNINGS` | Existing design root `ULl5YjWeiwqjNBvh9` and two children read back. Live design analysis inspected 80 nodes and returned reusable rules; max-node truncation was reported. |
| 12 | `PASS` | Existing repaired root `EcLKxRJzkvTEXQWCH` and fixture `Dy9Klw3unZomzsKcV` read back. Live analysis inspected all 40 bounded nodes with no truncation warning. |
| 13 | `PASS` | Existing Run 02 root `GMNfzaCUSFYIaFPMP` read back. Aggregate live-property verifier found 14 functional cards, zero issues, and returned `PASS`. Fresh card witness also passed. |
| 14 | `PASS` | Two independent four-chunk jobs paused at 50%, persisted, resumed without replay, verified every chunk once, passed whole-note live readback, and produced no completed-job replay. |
| 15 | `PASS_WITH_WARNINGS` | Existing capstone root `ud8LrqymXrkl0m3SS` and module `7xJiCOPRFqeUsBcNx` read back. Design analysis inspected 80 bounded nodes including 16 math blocks; combined fresh fixture re-proved write paths. Full historical capstone was not rewritten. |

Historical reports remained immutable. Missing 2026-07-12 artifacts were not
silently treated as current proof; fresh exact-release witnesses received
`RECOVERY_PASS` verdicts.

## Fresh exact-release witness manifest

| Witness | Rem ID | Proof |
| --- | --- | --- |
| Campaign root | `Tmbge6Mza34dYR7q5` | create/readback/idempotency |
| Guarded mutation | `zIieSg26ZOYnvChjG` | stale rejection/correct update/repeat |
| Rich formula | `bf43GXdSwya9GQ5LF` | two native inline-math nodes/readback/repeat |
| Supported styling | `w62b2F9P32HJyAZhA` | whole highlight/span styles/design verifier/repeat |
| Basic flashcard | `9KLa5Ei2JjSjbEuG0` | live card properties/readback/repeat |
| Combined note | `3YJzibRJqNMzhMG4s` | 24-node Markdown hierarchy/table/code/formula |
| Safe extension | `PyVfeBxjq1S0wyGtG` | additive-only append/readback/repeat |
| Test 14 Run 01 | `N5i0jC1aP2zk4T1wB` | job `stage6-test14-aff5cbb-run01-20260719` |
| Test 14 Run 02 | `yfLw7Ahe0kFneZfmZ` | job `stage6-test14-aff5cbb-run02-20260719` |

## Core proof sequence result

1. Bridge status: `PASS`
2. Plugin ping: `PASS`
3. Focused Rem: `PASS`
4. Bounded root read: `PASS`
5. Child/tree read: `PASS`
6. Small write: `PASS`
7. Readback: `PASS`
8. Same-key repeat: `PASS`, `already_applied`
9. Guarded stale-state rejection: `PASS`
10. Card creation/readback: `PASS`
11. Formula/rich-text preservation: `PASS`
12. Supported style verification: `PASS`
13. Resumable interruption: `PASS`
14. Job status: `PASS`
15. Reconnect: not forced; connection remained stable
16. Resume: `PASS`
17. Whole-note verification: `PASS`
18. Completed-job no-replay: `PASS`
19. Exact Test 14 twice: `PASS`
20. Image insertion: `BLOCKED` by stale connector tool surface
21. Audio insertion: `BLOCKED` by stale connector tool surface
22. Video insertion: `BLOCKED` by stale connector tool surface

## Release assessment

Tests 01–15 campaign is complete with explicit verdicts. Non-media exact-release
proof is strong. Stage 6 completion gate is not yet satisfied because current
connector session does not expose the three registered media calls. See media
report for exact blocker and refresh requirement.
