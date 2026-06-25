# Live Testing

Live proof requires a connected RemNote plugin and a disposable root under the current focused Rem.

## Readiness Verdicts

- `NOT_READY`: critical local failures or unsafe behavior.
- `STATIC_READY_NEEDS_LIVE_TEST`: local/static checks pass, live RemNote not tested.
- `READY_FOR_CONTROLLED_LIVE_TEST`: local gates pass and default tool surface is stable.
- `READY_WITH_WARNINGS`: usable for controlled use, with documented non-critical limits.
- `LIVE_PROVEN_READY`: live tool audit, full Chapter One import, design verification or safe skip, and compact final report all pass.

## Required Focus Rule

1. Call `get_focused_rem`.
2. Confirm title is `Plugin Test` or the user-approved target.
3. Use only a disposable child root.
4. Stop if plugin disconnects or focus cannot be confirmed.

Known previous Plugin Test ID: `OjLcSppWfIH0cpPoh`. Treat it as context, not proof; confirm live focus each run.

## Live Test A: Tool Matrix

- Discover tools.
- Classify public, hidden, blocked, and server-local tools.
- Test every public tool safely.
- Keep destructive tools dry-run unless explicit disposable cleanup proof exists.
- Write a compact report with sections:
  - Summary
  - Tool Totals
  - Failed Tools
  - Blocked Tools
  - Hidden Tools
  - Latency Summary
  - Bulk Import Summary
  - Design Verification Summary
  - Remaining Risks
  - Final Verdict

Do not write giant Markdown tables into RemNote.

## Live Test B: Bulk Import

- Import Chapter One only.
- Verify source length, line count, and SHA-256.
- Verify sections 1.1 through 1.5.
- Missing snippets: 0.
- Extra snippets: 0.
- Structure mismatches: 0.
- Chapter Two present: no.
- Metadata pollution: none.

## Live Test C: Design

- Apply `formula_heavy` or `exam_ready` only after content verification.
- Verify plain text unchanged.
- Verify child order unchanged.
- Verify no `Size`/`H1`/`H3` pollution.
- If styling is unsafe, skip styling and report why.

## Timeout And Disconnect Recovery

- Use same idempotency key on retry.
- Mark unknown write state as partial/needs verification.
- Resume chunked imports through `get_note_import_job_status` then `resume_note_import_job`.
- Resume compact report writing by idempotency key and verified chunk section.

## Required Local Gates Before Live

```bash
npm run check-types
npm run server:build
npm test
npm run server:test:tool-profile
npm run server:smoke
npm run server:mass-note-audit
npm run validate
npm run build
npm run server:test:boundaries
git diff --check
```
