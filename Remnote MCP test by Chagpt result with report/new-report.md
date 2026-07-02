# New RemNote MCP Reports

Compressed from `New report/*.md`.

## Summary

New run improved safe write/idempotency and some duplicate guards. Still not live-ready. Bulk import, file-backed import, formula fidelity, resume completion, long stability, full card/style proof failed or blocked.

## Test Matrix

| Test | Area | Verdict | Evidence |
|---|---|---|---|
| 01 | Preflight/focus/scope | PASS_WITH_WARNING | Bridge/plugin/focus/root readback worked; one direct read path platform-blocked. |
| 02 | Tool visibility/profile | PASS_WITH_WARNINGS | Danger profile exposed 72 public tools; default expected fewer; hidden/gated tools respected. |
| 03 | Default tool audit | FAILED_VERIFICATION | Read/write basics partly OK; import job source fidelity/file path failed. |
| 04 | Read-chain/search | PARTIAL | Core read worked; repeated children/exact search blocked; scope search weak. |
| 05 | Safe write/idempotency | PASS_WITH_WARNINGS | Same-key replay worked; warnings on `Status/Draft` and blank spacer. |
| 06 | Markdown preview/planning | PARTIAL | Preview/inline plan no-write OK; file plan failed proxied mount rewrite. |
| 07 | Small bulk import | FAILED_VERIFICATION | Root/chunk wrote; verifier failed source fidelity, missing sections. |
| 08 | Full file import | BLOCKED | Hosted server could not see local path; no import. |
| 09 | Resume/retry/partial | FAILED_VERIFICATION | Chunks 1-4 verified; chunk 5 failed long idempotency key; final missing sections. |
| 10 | Duplicate/scope/cleanup | PASS_WITH_WARNINGS | Same-key replay; same-parent/different-key refused; different-parent subtest blocked. |
| 11 | Formula fidelity | FAILED_VERIFICATION | Formula-heavy import still not proven; dependency on file import/bulk. |
| 12 | Design/style invariants rerun | PARTIAL_STABILITY_BLOCKED | Baseline/readback timeouts; style mutation not run. |
| 13 | Card lifecycle rerun | NOT_RUN_DEPENDENCY_BLOCKED | Blocked by plugin unresponsive state from Test 12. |
| 14 | Latency/stability | FAILED_STABILITY | Plugin-handled calls timed out; connected-looking status could be stale. |
| 15 | Final proof | NOT_LIVE_PROVEN_READY | Simple writes under parent worked; bulk/stability not ready. |

## Improvements Since Old Run

- Bulk job tools became callable.
- Safe `create_rem` idempotency improved.
- Same-title/same-parent duplicate refusal improved.
- Dry-run resume did not mutate.
- Some chunks verified before later failure.

## Worse Or Still Bad

- Stability still failed hard in Tests 12-15.
- File-backed import still blocked.
- Bulk source fidelity still failed.
- Long generated idempotency key broke resume.
- Formula/card/style proof still incomplete.
- Report/readback distinction still needed discipline.

## Current Codex Live Retest Addendum — 2026-07-02

Focused Rem: `Plugin Test`, `OjLcSppWfIH0cpPoh`.

Disposable root: `HZDcF0Y62bF9ptbfd`.

Passed:

- Bridge/plugin ping/focus/selection.
- Root create and parent proof.
- Same-key idempotency replay, zero created.
- Child create + breadcrumbs.
- No-write markdown preview.
- Basic flashcard readback.
- Simple text color/highlight readback.
- One inline formula rich readback.
- Short latency spot check.

Failed:

- Tiny bulk job returned `PARTIAL`.
- `verify_note_import_job` returned `source_fidelity_failed`.
- Readback missed `Alpha source sentence.`
- Bullet B/formula nested under Bullet A.
- Flashcard parser dry-run with `marker: both` emitted malformed extra basic card from cloze line.

Not run:

- Full file import.
- Full chapter import.
- `apply_style_plan`.
- Cloze/MC/list-answer live writes.
- Destructive cleanup.

## Final Readiness

Status: `PARTIAL_LIVE_PROOF_ONLY`.

Do not claim fixed. Next repair: bulk source coverage, sibling bullet hierarchy, flashcard parser marker routing, then rerun same mini-suite.
