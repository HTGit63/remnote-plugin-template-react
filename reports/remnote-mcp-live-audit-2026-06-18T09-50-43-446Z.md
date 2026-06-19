# RemnoteMCP Live Audit

Generated: 2026-06-18T09:50:43.460Z
Branch: fix/remnote-mcp-mass-note-creation-stability
Git SHA: f9b3b84d2c108c452a3c4f6b6b0e56d6337c6d6f
Default profile: mass_note_writer

| Suite | Test Name | Tool Name | Status | Duration Ms | Error Code | Root Cause Class | Fix Recommendation |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| S00 | local source metadata fields | get_bridge_status | PASS | 0 |  |  |  |
| S00 | deployed source alignment | get_bridge_diagnostics | GATED | 0 | LIVE_ENVIRONMENT_REQUIRED | live_environment_required | Run live read_only after MCP server and RemNote plugin are connected; compare deployed git/version values to this branch. |
| S01 | mass_note_writer profile listing and gating | tools/list | PASS | 0 |  |  |  |
| S02 | platform block classification | * | GATED | 0 | PLATFORM_PATH_REQUIRED | platform_environment_required | Run read_only and safe_sandbox from the real client path and record PLATFORM_BLOCKED separately from bridge failures. |
| S03 | read-only tools and standard envelope | *read_tools | PASS | 0 |  |  |  |
| S04 | stable markdown writer dry-run/readback contract | create_or_replace_note_from_markdown | PASS | 0 |  |  |  |
| S05 | idempotency replay contract | create_or_replace_note_from_markdown | PASS | 0 |  |  |  |
| S06 | guarded cleanup contract | delete_rem_by_id | PASS | 0 |  |  |  |
| S07 | phase timing/performance diagnostics | * | GATED | 0 | LIVE_TIMING_REQUIRED | live_environment_required | Run five live warm calls plus idle retry to classify server/plugin/SDK latency. |
| S08 | style invariants with two children | *style_tools | PASS | 0 |  |  |  |
| S09 | bounded card verifier | verify_card_set | PASS | 0 |  |  |  |
| S10 | NotePlan wrapper equivalence | create_or_replace_note_from_markdown/apply_structured_note_batch | PASS | 0 |  |  |  |
| S11 | chunked import dry-run manifest | create_or_replace_note_from_markdown | PASS | 0 |  |  |  |
| S11 | 25/50/100 real live writes and guarded cleanup | create_or_replace_note_from_markdown | GATED | 0 | LIVE_WRITE_REQUIRED | live_environment_required | Run full_sandbox only after read_only/safe_sandbox pass; verify and cleanup only current-session Rems. |
| S12 | design template normalized round-trip hash | export_note_design_template/import_note_design_template | PASS | 0 |  |  |  |
| S13 | card creation lifecycle live proof | create_basic_flashcard/create_cloze_card/create_flashcards_from_markdown | GATED | 0 | LIVE_CARD_WRITE_REQUIRED | live_environment_required | Run full_sandbox card lifecycle after verifier passes and cleanup is proven. |
