# RemNote MCP Release Threat Model - 2026-06-23

## Scope

System: RemNote plugin plus local MCP server for controlled ChatGPT access to RemNote read/write tools.

Release target: controlled local use with focused-Rem writes, resumable bulk imports, honest readback verification, and optional design styling.

This threat model was prepared without stopping for stakeholder interview because the active task requested uninterrupted execution. Open questions are listed as residual risks.

## Assets

- User RemNote knowledge base.
- Focused Rem identity and approved write root.
- Source files used for bulk import.
- MCP bearer token and hosted pairing/session secrets.
- Tool registry/profile policy.
- Bulk import job manifest, source hashes, created Rem IDs, and verification report.

## Trust Boundaries

- ChatGPT/MCP caller to local server.
- Local server to RemNote plugin WebSocket.
- Server-side file reader to local filesystem.
- Plugin write adapters to RemNote SDK.
- Readback verifier to RemNote tree/read APIs.

## Entry Points

- Public MCP tool calls.
- `plan_note_import_from_file` and `start_note_import_from_file`.
- Bulk job step/resume/verify tools.
- Style-only tools and design verification tools.
- Local/hosted pairing and diagnostics endpoints.

## Primary Threats And Mitigations

| Threat | Risk | Mitigation |
| --- | --- | --- |
| Arbitrary filesystem read through file-backed import | High | File imports are limited to allow roots, repo root, temp, `/mnt/data`, and `$HOME/Downloads/Remnote`; files must be regular files and under 2 MB. |
| Writes outside focused Rem | High | Workflow requires `get_focused_rem` before writes; bulk tools require explicit `targetRootId`; docs require disposable roots for tests. |
| False success after timeout or disconnect | High | Timeout/unknown write status becomes `partial`; successful write without explicit verification becomes `written_not_verified`; `not_verifiable` is never PASS. |
| Duplicate chapters/sections/chunks on resume | Medium | Import root, chapter, section, and chunk idempotency keys are separate; existing normalized child titles are reused; duplicate title matches create manual-review events. |
| Source mutation between plan and resume | High | Job store rejects changes to chunk `sourceText` and `expectedSourceText`; source hashes are included in IDs and reports. |
| Chapter Two or extra content imported | High | Marker extraction stops before `stopBeforeMarker`; final verification rejects Chapter Two and reports extra text previews. |
| Style-only operation mutates content/order | High | Style mutation invariants compare plain text and child order before/after; design verification must pass after styling. |
| Tool profile exposes unsafe tools by default | Medium | Default profile is `mass_note_writer`; dangerous delete remains gated; unsupported tools are hidden. |
| Live readiness overstated | High | Reports distinguish local/static readiness from live readback proof; `LIVE_PROVEN_READY` requires real Plugin Test readback. |

## Residual Risks

- Memory-only job storage is not durable across server restart.
- Rich-text styling fidelity depends on RemNote SDK readback detail; normalized plain-text proof is stronger than visual style proof.
- File allow roots may need deployment-specific tightening before multi-user hosted use.
- A live plugin/socket was not guaranteed during static work; live proof must be run separately if unavailable.

## Required Release Gates

- `npm run check-types`
- `npm run server:build`
- `npm test`
- `npm run server:test:tool-profile`
- `npm run server:smoke`
- `npm run server:mass-note-audit`
- `npm run validate`
- `npm run build`
- `npm run server:test:boundaries`
- `git diff --check`

Final release verdict must remain `READY_FOR_CONTROLLED_LIVE_TEST` unless the controlled live Plugin Test import passes with readback.
