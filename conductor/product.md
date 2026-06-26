# Product

RemnoteMCP bridges ChatGPT and RemNote for controlled reading, verified Markdown note creation, bulk import planning, diagnostics, and guarded sandbox cleanup.

## Goal

Make mass note creation safe, repeatable, and source-faithful before real course-note imports.

## Users

- ChatGPT user importing long Markdown notes into RemNote.
- Developer/operator checking MCP runtime, tool profile, bridge connection, and live proof.

## Guarantees

- Default profile is `mass_note_writer`.
- Normal note creation prefers `create_or_replace_note_from_markdown`.
- Bulk import stays resumable and verification-driven.
- Live proof stays separate from static, build, and mock proof.
- No fake plugin success, fake hosted user, or dummy RemNote state.
