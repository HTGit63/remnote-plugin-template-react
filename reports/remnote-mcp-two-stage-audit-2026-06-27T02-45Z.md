# RemNote MCP Two-Stage Audit - 2026-06-27T02:45Z

Verdict: SIMULATED_READY_FOR_REAL_LIVE_RERUN.

Real live RemNote proof was not run in this environment. Do not call this `LIVE_PROVEN_READY` until a connected RemNote plugin and disposable live root run the final 15-test suite.

## Stage Audit

| Stage | Status | Evidence |
| --- | --- | --- |
| 0 runtime/source alignment | SIMULATED_PASS | registry diagnostics expose git/build/profile/listed/runtime fields |
| 1 mass_note_writer lock-down | SIMULATED_PASS | default profile exactly 19 intended tools; style/card/delete hidden |
| 2 response envelope/timing | SIMULATED_PASS | standard envelope includes operation, idempotency, target IDs, verification, timing, retryable errors |
| 3 readback/scope | SIMULATED_PASS | search_rems forwards explicit contextRemId and scope |
| 4 file-backed import | SIMULATED_PASS | local path and file:// connector-style refs plan successfully with hashes |
| 5 Markdown/source fidelity | SIMULATED_PASS | underscore anchors preserved; no Size/H visible metadata; no duplicate wrapper root |
| 6 idempotency/duplicates | SIMULATED_PASS | same-key replay returns already_applied; same-title/different-key duplicate refused |
| 7 bulk resume/retry | SIMULATED_PASS | verified chunks skipped; partial job not treated as done |
| 8 timeout/disconnect | SIMULATED_PASS | unknown write status is retryable + platform-blocked, not success |
| 9 Chapter One/formula fidelity | SIMULATED_PASS | sections 1.1-1.5 present; Chapter Two absent; formula text preserved |
| 10 styling/design | SIMULATED_PASS | style-only invariant rejects child/text pollution |
| 11 card lifecycle | SIMULATED_PASS | basic, cloze, multiple-choice, list-answer detected by bounded verifier |
| 12 guarded cleanup | SIMULATED_PASS | broad delete hidden from mass_note_writer; cleanup remains gated |
| 13 final 15-test rerun | SIMULATED_READY | simulated 15-test matrix passes; real live suite still required |

## Audit Pass 1 - Code/Simulation

- Added `test:agents-simulated-live` with 11 tests covering unresolved AGENTS tasks.
- Fixed Markdown underscore normalization so IDs like `CN_01_03_anchor` stay exact.
- Fixed cached write/card replay statuses to report `already_applied`.
- Added same-title/same-parent/different-key refusal for `create_rem`.
- Classified `RETRYABLE_UNKNOWN_WRITE_STATUS`/delete status as platform-blocked retryable errors.

## Audit Pass 2 - Validation

PASS:

- `npm run check-types`
- `npm run validate`
- `npm run build` (3 existing webpack size warnings only)
- `npm run server:build`
- `npm test` (12 files, 54 tests)
- `npm run server:smoke`
- `npm run server:test:source-fidelity`
- `npm run server:test:tool-profile`
- `npm run server:test:idempotency`
- `npm run server:test:boundaries`
- `npm run test:style-correctness`
- `npm run test:agents-simulated-live` (11 tests)
- `git diff --check`
- `npm run server:mass-note-audit`

Latest readiness report:

- `reports/remnote-mcp-readiness-audit-2026-06-27T02-45-14-490Z.md`
- Summary: fail 0, registryPresent 2, readyForRuntimeTest 11, liveTestNotRun 4.

Remaining gate:

- Real live RemNote 15-test proof still needs running MCP server, connected plugin socket, and disposable `REMNOTE_LIVE_TEST_PARENT_ID`.
