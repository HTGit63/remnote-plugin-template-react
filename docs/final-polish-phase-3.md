# Final Polish Phase 3

Status: complete at repo and mock-runtime level on 2026-05-17.

## Completed

- Added `server/src/tool-policy.ts` with policy groups for preferred, fallback, debug, read, cards, dangerous, unsupported, and legacy hidden tools.
- Added `REMNOTE_BRIDGE_TOOL_PROFILE=simple|full`.
- Kept `full` as the temporary default so existing ChatGPT connector expectations do not lose the 47-tool registry without an explicit operator choice.
- Made MCP registration, `tools/list`, unknown-tool handling, status, diagnostics, and plugin handshake use the active profile.
- Added profile metadata to bridge status: preferred tools, fallback tools, debug tools, read tools, card tools, dangerous tools, unsupported tools, and profile-hidden tools.
- Updated the capability guide and MCP tool descriptions so normal note creation prefers `create_polished_note_tree` or `apply_structured_note_batch`, existing-note styling prefers `apply_style_plan`, design checks prefer `verify_note_design`, and raw rich-text inspection stays debug-only.

## Validation

- `npm run check-types`: passed.
- `npm run server:build`: passed.
- `npm run server:smoke`: passed, including simple-profile coverage that hides low-level fallback/debug tools and returns `UNKNOWN_TOOL` for a hidden tool call.

## Remaining Live Proof

Live RemNote sandbox proof is still required before claiming every listed tool works against a real RemNote knowledge base.
