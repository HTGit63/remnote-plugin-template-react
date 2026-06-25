# RemnoteMCP Mass Note Readiness Audit

Generated: 2026-06-25T14:13:27.108Z
Branch: fix/remnote-mcp-mass-note-creation-stability
Git SHA: efbc65d2a13abaad83ef66341815a0c2cac313dc
Tool registry version: 2026-06-25.problem-tool-status-matrix
Tool schema version: 2026-06-25.problem-tool-status-matrix
Default profile: mass_note_writer
Live proof: no

> This report is not live RemNote proof. Static/source rows use SOURCE_PRESENT, REGISTRY_PRESENT, or READY_FOR_RUNTIME_TEST, never runtime PASS.

## Local Gate Results

| Command | Result | Note |
| --- | --- | --- |
| npm run check-types | PASS |  |
| npm run server:build | PASS |  |
| npm test | PASS |  |
| npm run server:test:tool-profile | PASS |  |
| npm run server:smoke | PASS |  |
| npm run validate | PASS |  |
| npm run build | PASS | webpack size warnings only |
| npm run server:test:boundaries | PASS |  |
| npx vitest run tests/bulk-import.test.ts tests/bulk-import-tools.test.ts tests/timeout-budgets.test.ts tests/design-template-preview.test.ts tests/tool-status-matrix.test.ts | PASS |  |

## Readiness Rows

| Suite | Test Name | Tool Name | Status | Verification Layer | Evidence Mode | Live Proof | Duration Ms | Error Code | Root Cause Class | Fix Recommendation |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- |
| S00 | local source metadata fields | get_bridge_status | REGISTRY_PRESENT | static_source | local_execution | no | 0 |  |  |  |
| S00 | deployed source alignment | get_bridge_diagnostics | LIVE_TEST_NOT_RUN | live_remnote_plugin | live_required | no | 0 | LIVE_ENVIRONMENT_REQUIRED | live_environment_required | Run live read_only after MCP server and RemNote plugin are connected; compare deployed git/version values to this branch. |
| S01 | mass_note_writer profile listing and gating | tools/list | REGISTRY_PRESENT | static_source | local_execution | no | 0 |  |  |  |
| S02 | platform block classification | * | NOT_RUN | live_remnote_plugin | live_required | no | 0 | PLATFORM_PATH_REQUIRED | platform_environment_required | Run read_only and safe_sandbox from the real client path and record PLATFORM_BLOCKED separately from bridge failures. |
| S03 | read-only tools and standard envelope | *read_tools | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Run read tools through a local MCP smoke or live read_only path before treating this row as PASS. |
| S04 | stable markdown writer dry-run/readback contract | create_or_replace_note_from_markdown | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S05 | idempotency replay contract | create_or_replace_note_from_markdown | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S06 | guarded cleanup contract | delete_rem_by_id | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Run guarded cleanup dry-run plus current-session delete proof before treating this row as PASS. |
| S07 | phase timing/performance diagnostics | * | LIVE_TEST_NOT_RUN | live_remnote_plugin | live_required | no | 0 | LIVE_TIMING_REQUIRED | live_environment_required | Run five live warm calls plus idle retry to classify server/plugin/SDK latency. |
| S08 | style invariants with two children | *style_tools | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S09 | bounded card verifier | verify_card_set | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S10 | NotePlan wrapper equivalence | create_or_replace_note_from_markdown/apply_structured_note_batch | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S11 | chunked import dry-run manifest | create_or_replace_note_from_markdown | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S11 | 25/50/100 real live writes and guarded cleanup | create_or_replace_note_from_markdown | LIVE_TEST_NOT_RUN | live_remnote_plugin | live_required | no | 0 | LIVE_WRITE_REQUIRED | live_environment_required | Run full_sandbox only after read_only/safe_sandbox pass; verify and cleanup only current-session Rems. |
| S12 | design template normalized round-trip hash | export_note_design_template/import_note_design_template | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S12 | named note design presets | stylePreset | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S14 | resumable bulk import job honesty | plan/start/run/resume/verify_note_import_job | READY_FOR_RUNTIME_TEST | static_source | static_source_check | no | 0 | STATIC_READINESS_ONLY | static_readiness_only | Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS. |
| S13 | card creation lifecycle live proof | create_basic_flashcard/create_cloze_card/create_flashcards_from_markdown | LIVE_TEST_NOT_RUN | live_remnote_plugin | live_required | no | 0 | LIVE_CARD_WRITE_REQUIRED | live_environment_required | Run full_sandbox card lifecycle after verifier passes and cleanup is proven. |
