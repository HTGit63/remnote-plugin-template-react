# RemNote MCP Test 14 — Resumable Long Import — 2026-07-17

## Source proof

| Fixture | Characters | Bytes | Lines | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| Full prompt source | 6,432 | 6,532 | 153 | `eea8d99e...a094` |
| Bounded import source | 6,149 | 6,243 | 144 | `2947ffed...6d32` |

The bounded source contained one start marker, one stop marker, and no sentinel. Both live plans produced exactly four logical chunks and four native chunks.

## Independent run results

| Metric | Run 01 | Run 02 |
| --- | --- | --- |
| Root | `LrJLwj6KHjq33kaRQ` | `VNf2RJG1iYjAAf5wn` |
| Plan | `plan:fnv1a32:533a668a` | `plan:fnv1a32:7d94a99f` |
| Job | `test14-mechanical-waves-run01-20260717` | `test14-mechanical-waves-run02-20260717` |
| Chapter | `jgdkz0TW0MRAnHKfK` | `mR7GNfOeF0SEVjLuv` |
| Chunk 1 | verified, 28 created | verified |
| Chunk 2 | verified, 25 created | verified |
| Midpoint | 2/4, 50%; only sections 1.1 and 1.2 | 2/4, 50%; only sections 1.1 and 1.2 |
| Resume target | exact section 1.3 | exact section 1.3 |
| Chunk 3 | `INVALID_ARGS`: actual 40 > max 30 | identical reproduction |
| Chunk 4 | pending | pending |
| Verdict | `BLOCKED_JOB_STATE` | `BLOCKED_JOB_STATE` |

Chunk 3 created only its section root (`T2NVEkODdnX72pE5t` in Run 01; `tMKJ3WUHktHtsBmKa` in Run 02) before the deployed wrapper rejected the 40-node table payload. It returned zero chunk mutation IDs and required reconciliation. The active connector tool surface did not expose `reconcile_note_import_job_chunk`, so execution stopped without a blind retry. No completed chunk was replayed and no delete was used.

## Local fix

The failing regression proved the table chunk's wrapper budget was hard-capped below its exact manifest. `register-bulk-import-tools.ts` now derives `maxNodes` from `estimatedRemCount + 5` and `sourceManifest.units.length + 12` with a floor of 10. The targeted regression and the final 32-file/292-test suite pass. This is not live proof; deploy/reload and repeat both jobs before release.
