# RemNote MCP Test 14 — Exact-Release Resumable Long Import — 2026-07-19

## Verdict

`PASS`

Two independent live runs completed against exact deployed commit
`aff5cbb71b4818c3e0e218d56355217099382904` on branch
`fix/remnote-mcp-mass-note-creation-stability`.

## Scope and source

- Focused approved root: `Plugin Test` (`OjLcSppWfIH0cpPoh`)
- Disposable campaign root: `Tmbge6Mza34dYR7q5`
- Raw fixture length: 6,432 characters
- Planned/extracted Chapter One length: 6,147 characters
- Start marker: `# Chapter One: Mechanical Waves and Sound`
- Stop-before marker: `# Chapter Two: Electromagnetic Waves`
- Raw planned source hash: `fnv1a32:b38fb659`
- Semantic hash: `fnv1a32:f35fc65b`
- Manifest units: 117
- Chunk limits: 4,000 characters, 35 estimated Rems, depth 6, 100 children per parent
- Plan result: 4 logical chunks, 4 native chunks, estimated 105 Rems

Chapter Two was excluded in both plans. No delete tool was exposed or used.

## Run 01

| Field | Evidence |
| --- | --- |
| Run root | `N5i0jC1aP2zk4T1wB` |
| Chapter root | `ts8frcHoAQnPMHrko` |
| Plan | `plan:fnv1a32:fbfed21f` |
| Job | `stage6-test14-aff5cbb-run01-20260719` |
| Storage | `persistent` |
| Pause checkpoint | revision 11; 2/4 verified; 50% |
| Final checkpoint | revision 19; 4/4 verified; 100% |
| Chunk created counts | 28, 25, 39, 34 |
| Chunk attempts | 1, 1, 1, 1 |
| Chunk verification | plugin verification and readback passed for all 4 |
| Total job-created IDs | 131 including chapter/section hierarchy roots |
| Whole-note verification | `PASS`; `live_readback_tree`; 4 reports |
| Completed-job repeat | `PASS`; zero new mutations; 4/4 remained verified |

The third chunk contained the native-table regression checkpoint. It created 39
IDs and verified on its first attempt.

## Run 02

| Field | Evidence |
| --- | --- |
| Run root | `yfLw7Ahe0kFneZfmZ` |
| Chapter root | `01o9NxognLhuxhqeK` |
| Plan | `plan:fnv1a32:46f35f5a` |
| Job | `stage6-test14-aff5cbb-run02-20260719` |
| Storage | `persistent` |
| Pause checkpoint | revision 11; 2/4 verified; 50% |
| Final checkpoint | revision 19; 4/4 verified; 100% |
| Chunk created counts | 28, 25, 39, 34 |
| Chunk attempts | 1, 1, 1, 1 |
| Chunk verification | plugin verification and readback passed for all 4 |
| Total job-created IDs | 131 including chapter/section hierarchy roots |
| Whole-note verification | `PASS`; `live_readback_tree`; 4 reports |
| Completed-job repeat | `PASS`; zero new mutations; 4/4 remained verified |

## Interruption, persistence, and replay audit

Both jobs were deliberately stopped after two chunks. A separate status read
showed persistent storage, revision 11, two verified chunks, two pending chunks,
and the next exact checkpoint. Resume started at chunk 3. No verified chunk was
rewritten. Each chunk contains one acknowledged write attempt and persisted
`pluginVerificationPassed` plus `readbackVerificationPassed` evidence.

`render.yaml` selects `REMNOTE_BRIDGE_STORAGE=postgres` and supplies
`DATABASE_URL`. Live jobs reported `storageDurability=persistent`. This proves
the release selected its persistent provider; no disruptive Render restart was
performed during the campaign.

## Regression discovered and repaired

The first pre-fix exact-release run wrote all four chunks, but whole-note
verification could not see sections 1.3 and 1.4. Root readback had exhausted its
node budget inside an earlier descendant, while the continuation pointed at that
descendant. Direct siblings omitted from the bounded response were not hydrated.

TDD added `restores direct siblings omitted when a descendant consumed node
budget`. `readCompleteRemTree` now enumerates direct children when `node_limit`
or `child_limit` occurs. Commit `aff5cbb` contains the fix. Both fresh runs above
prove the original live failure no longer occurs.

## Safety and fidelity

- Writes stayed beneath disposable root `Tmbge6Mza34dYR7q5`.
- Source hashes matched across both plans.
- Chapter Two was absent from the imported result.
- Verified chunks were never blindly replayed.
- Completed jobs produced no new mutation.
- No destructive tool was exposed or called.
