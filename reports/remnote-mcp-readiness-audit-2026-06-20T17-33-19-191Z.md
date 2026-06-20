# RemnoteMCP Mass Note Readiness Audit

Generated: 2026-06-20T17:33:19.262Z
Branch: fix/remnote-mcp-mass-note-creation-stability
Git SHA: cfabab317fde680a9f6fa9d46b31e562978a1c96
Default profile: mass_note_writer
Live proof: no

> This report is not live RemNote proof. `PARTIAL` means static/source readiness is present but execution proof is still required.

| Suite | Test Name | Tool Name | Status | Evidence Mode | Live Proof | Duration Ms | Error Code | Root Cause Class | Fix Recommendation |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- |
| S00 | local source metadata fields | get_bridge_status | PASS | local_execution | no | 0 |  |  |  |
| S00 | deployed source alignment | get_bridge_diagnostics | GATED | live_required | no | 0 | LIVE_ENVIRONMENT_REQUIRED | live_environment_required | Run live read_only after MCP server and RemNote plugin are connected; compare deployed git/version values to this branch. |
| S01 | mass_note_writer profile listing and gating | tools/list | PASS | local_execution | no | 0 |  |  |  |
| S02 | platform block classification | * | GATED | live_required | no | 0 | PLATFORM_PATH_REQUIRED | platform_environment_required | Run read_only and safe_sandbox from the real client path and record PLATFORM_BLOCKED separately from bridge failures. |
| S03 | read-only tools and standard envelope | *read_tools | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Run read tools through a local MCP smoke or live read_only path before treating this row as PASS. |
| S04 | stable markdown writer dry-run/readback contract | create_or_replace_note_from_markdown | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static source readiness only. Run the matching local executable smoke or live MCP proof before treating this row as PASS. |
| S05 | idempotency replay contract | create_or_replace_note_from_markdown | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static source readiness only. Run the matching local executable smoke or live MCP proof before treating this row as PASS. |
| S06 | guarded cleanup contract | delete_rem_by_id | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Run guarded cleanup dry-run plus current-session delete proof before treating this row as PASS. |
| S07 | phase timing/performance diagnostics | * | GATED | live_required | no | 0 | LIVE_TIMING_REQUIRED | live_environment_required | Run five live warm calls plus idle retry to classify server/plugin/SDK latency. |
| S08 | style invariants with two children | *style_tools | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static source readiness only. Run the matching local executable smoke or live MCP proof before treating this row as PASS. |
| S09 | bounded card verifier | verify_card_set | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static source readiness only. Run the matching local executable smoke or live MCP proof before treating this row as PASS. |
| S10 | NotePlan wrapper equivalence | create_or_replace_note_from_markdown/apply_structured_note_batch | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static source readiness only. Run the matching local executable smoke or live MCP proof before treating this row as PASS. |
| S11 | chunked import dry-run manifest | create_or_replace_note_from_markdown | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static source readiness only. Run the matching local executable smoke or live MCP proof before treating this row as PASS. |
| S11 | 25/50/100 real live writes and guarded cleanup | create_or_replace_note_from_markdown | GATED | live_required | no | 0 | LIVE_WRITE_REQUIRED | live_environment_required | Run full_sandbox only after read_only/safe_sandbox pass; verify and cleanup only current-session Rems. |
| S12 | design template normalized round-trip hash | export_note_design_template/import_note_design_template | PARTIAL | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static source readiness only. Run the matching local executable smoke or live MCP proof before treating this row as PASS. |
| S13 | card creation lifecycle live proof | create_basic_flashcard/create_cloze_card/create_flashcards_from_markdown | GATED | live_required | no | 0 | LIVE_CARD_WRITE_REQUIRED | live_environment_required | Run full_sandbox card lifecycle after verifier passes and cleanup is proven. |
