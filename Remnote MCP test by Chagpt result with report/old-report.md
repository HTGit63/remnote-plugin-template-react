# Old RemNote MCP Reports

Compressed from `Old reports/*.md`.

## Summary

Old run verdict: not live-ready. Safe focus/read basics mostly worked. Bulk import, file-backed import, formula fidelity, style mutation, card lifecycle, duplicate control, resume, and stability failed or blocked.

## Test Matrix

| Test | Area | Verdict | Evidence |
|---|---|---|---|
| 01 | Preflight/focus/scope | PASS | Focus `Plugin Test`; disposable root/readback/breadcrumbs worked. |
| 02 | Tool visibility/profile | PASS_WITH_WARNINGS | Tool matrix visible; profile/default/danger distinctions confusing. |
| 03 | Default tool audit | PARTIAL | Default tools visible; job tools listed but not callable/proven. |
| 04 | Read-chain/search | PASS_WITH_WARNINGS | Core read chain worked; search/scope warnings. |
| 05 | Safe write/idempotency | FAILED_VERIFICATION | Writes mostly happened, but visible metadata/pollution and readback gaps. |
| 06 | Markdown preview/planning | PARTIAL | Preview no-write OK; planning/job paths incomplete. |
| 07 | Small bulk import | FAILED_VERIFICATION | Source fidelity failed; wrapper/pollution/anchor issues. |
| 08 | Full Chapter One import | BLOCKED | File-backed path/hosted boundary failed; no job created. |
| 09 | Resume/retry/partial | BLOCKED | Root creation not fully readback-verified; resume proof blocked. |
| 10 | Duplicate/scope/cleanup | FAILED_VERIFICATION | Same-title/same-parent/different-key duplicate risk. |
| 11 | Formula fidelity | FAILED_VERIFICATION | Fallback mini import low fidelity; formula-heavy proof failed. |
| 12 | Design/style invariants | FAILED_VERIFICATION | Styling created visible `Size/H1/H3`-style pollution/order issues. |
| 13 | Card lifecycle | FAILED_VERIFICATION | Basic/concept/descriptor partly worked; cloze/MC/list failed. |
| 14 | Latency/stability | FAILED_RUNTIME | Timeouts/stability failures under repeated calls. |
| 15 | Final proof | PARTIAL_PROOF | Some simple writes worked; plugin disconnected before full proof. |

## Tools That Looked Usable

- `get_bridge_status`
- `get_plugin_status`
- `get_focused_rem`
- `get_children`
- `get_rem_breadcrumbs`
- `search_rems` narrow cases
- `create_rem` narrow cases
- `preview_markdown_note_tree`
- Some basic card tools

## Tools With Failed Or Weak Proof

- `create_or_replace_note_from_markdown`
- `plan_note_import`
- `start_note_import_job`
- `run_note_import_job_step`
- `resume_note_import_job`
- `verify_note_import_job`
- `plan_note_import_from_file`
- `start_note_import_from_file`
- `apply_style_plan`
- `create_cloze_card`
- `create_multiple_choice_card`
- `create_list_answer_card`
- delete/cleanup tools, except dry-run-gated expectations.

## Main Bugs

- Tool call success confused with verification.
- Bulk source text not preserved.
- File-backed import path failed through hosted/proxied environment.
- Resume/no-duplicate proof incomplete.
- Visible style metadata/pollution.
- Formula fidelity unproven/failed.
- Card verification weak for non-basic cards.
- Stability and timeout behavior unacceptable.

## Repair Need

Fix order:

1. P0 scope/connection truth.
2. P1 verification status honesty.
3. P2 bulk source fidelity/resume/idempotency.
4. P3 formula/style/cards.
5. P4 report clarity.
