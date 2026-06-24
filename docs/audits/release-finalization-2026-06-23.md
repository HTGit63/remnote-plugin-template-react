# Release Finalization Audit - 2026-06-23

## Scope

Branch: `fix/remnote-mcp-mass-note-creation-stability`

Audit focus:

- Bulk source/file import reliability.
- Real verification and honest status reporting.
- Optional design presets and style verification.
- Plugin UI consistency with RemNote dark surfaces.
- Tool registry/profile exposure.

## Module Map

| Module | Interface | Implementation Notes |
| --- | --- | --- |
| Shared bulk planner | `planNoteImport`, `extractMarkedSourceText`, `verifyBulkImportFinalReadback` | Owns source normalization, marker extraction, chunk manifest shape, source hashes, and final readback comparison. |
| Server bulk tools | `plan_note_import_from_file`, `start_note_import_from_file`, job step/resume/verify tools | Owns server-side file read safety, MCP schemas, hierarchy creation, and bridge calls. |
| Job store | `BulkImportJobStore` | Owns memory manifests, source mutation rejection, root IDs, chunk status transitions, and resumability. |
| Markdown writer | `create_or_replace_note_from_markdown` | Still owns actual RemNote tree writes and per-write source fidelity verification. |
| Style presets | `NOTE_STYLE_PRESETS`, `applyStylePresetToMarkdownArgs`, `applyStylePresetToTree` | Owns safe hierarchy defaults; does not rewrite content text. |
| UI widget | `BridgeWidgetHeader`, `src/index.css`, `public/logo.svg` | Owns operator-facing state display and MCP branding. |

## Architecture Findings

- File-backed source import belongs in the server adapter, but source extraction and planning belong in shared code. This keeps the deep logic testable without RemNote or MCP.
- The bulk import seam now separates raw extracted source, normalized planned source, and live readback. This prevents a local manifest check from being confused with live proof.
- Import root support preserves the requested hierarchy without changing existing jobs that only need a chapter root.
- Section roots now own section headings; chunks write section bodies. This avoids duplicate visible section headings.
- Style presets remain optional. Bulk import does not auto-style chunks because content fidelity is the higher-priority invariant.
- The file reader is intentionally narrow: allow roots, regular files only, 2 MB max, explicit marker extraction for long imports.

## Verification Requirements

Use automated gates for static readiness and a separate Plugin Test run for live readiness.

Static readiness can support `READY_FOR_CONTROLLED_LIVE_TEST`.

Only a real live RemNote run with readback can support `LIVE_PROVEN_READY`.
