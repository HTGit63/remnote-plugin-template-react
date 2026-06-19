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
- [x] Tighten style-only child order invariant.
- [x] Run all required local gates.
- [ ] Run live 15/50/100-node write proof with disposable cleanup when RemNote plugin is connected.

## Live Proof Boundary

Local registry, type, build, and smoke success is not live RemNote write proof. Live proof requires a connected plugin, approved write scope, disposable parent Rem, write verification, replay/idempotency, and cleanup verification.
