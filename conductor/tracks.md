# Tracks

## Active

| Track | Status | Source | Notes |
| --- | --- | --- | --- |
| `fix/remnote-mcp-mass-note-creation-stability` | active-local-repaired | `Agents.md` + 15 supplied live reports | Reran tests 01-15 under `Plugin Test`; local fixes cover idempotency envelopes, bulk source-fidelity readback, unsafe heading style mutation, and card lifecycle verification. Hosted proof still needs redeploy before live-ready claims. |
| `codex-hosted-mcp-plugin-routing` | active-local | pasted Codex routing brief | Add stable Codex bearer principal, explicit plugin-session link, safe single-active fallback, and diagnostics without weakening write/delete policy. |

## Completed

| Track | Status | Notes |
| --- | --- | --- |
| tool-matrix hardening | completed | Default profile narrowed to `mass_note_writer`; server-local preview remains out of default profile. |
| bulk-import readiness | completed-local | Planner/job source-fidelity tests exist; live proof still requires plugin socket. |
