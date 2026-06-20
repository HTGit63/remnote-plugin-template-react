# RemnoteMCP Mass Note Stability Plan

## Status

In progress on `fix/remnote-mcp-mass-note-creation-stability`.

## Checklist

- [x] Preserve baseline branch.
- [x] Add `mass_note_writer` profile.
- [x] Make `create_or_replace_note_from_markdown` the default bulk writer.
- [x] Hide design/card/debug/delete tools from default profile.
- [x] Add registry/source/deploy metadata fields.
- [x] Add standard tool response envelope.
- [x] Add phase-duration reporting from lifecycle events.
- [x] Add guarded cleanup flags and current-session creation ledger.
- [x] Bound `verify_card_set` with caps and timeout.
- [x] Add empty-root fast path for `verify_card_set`.
- [x] Make mass-note audit output report static readiness as `PARTIAL`, not fake live `PASS`.
- [x] Bind `serverVersion` to `packageVersion`.
- [x] Add card creation read-back verification fields.
- [x] Tighten style-only child order invariant.
- [x] Run all required local gates.
- [ ] Run live 15/50/100-node write proof with disposable cleanup when RemNote plugin is connected.

## Live Proof Boundary

Local registry, type, build, and smoke success is not live RemNote write proof. Live proof requires a connected plugin, approved write scope, disposable parent Rem, write verification, replay/idempotency, and cleanup verification.

## 2026-06-20 Code-Only Checkpoint

Local verification passed:

- `npm run check-types`
- `npm run validate`
- `npm run build` (passes with existing `bridge-status` bundle-size warnings)
- `npm run server:build`
- `npm run server:smoke`
- `npm run server:test:tool-profile`
- `npm run test:style-correctness`
- `npm run server:mass-note-audit`

Latest generated readiness report:

- `reports/remnote-mcp-readiness-audit-2026-06-20T17-33-19-191Z.md`
- `reports/remnote-mcp-readiness-audit-2026-06-20T17-33-19-191Z.json`

Readiness stats: `PASS=2`, `FAIL=0`, `PARTIAL=9`, `GATED=5`. This is not live RemNote proof.
