# RemnoteMCP Live Audit

Generated: 2026-06-17T10:42:04.336Z
Branch: fix/remnote-mcp-mass-note-creation-stability
Git SHA: f9b3b84d2c108c452a3c4f6b6b0e56d6337c6d6f
Default profile: mass_note_writer

| Suite | Test | Tool | Status | Error | Fix |
| --- | --- | --- | --- | --- | --- |
| S00 | source and deployment metadata fields | get_bridge_status | PASS |  |  |
| S01 | default mass note writer profile | tools/list | PASS |  |  |
| S03 | standard response envelope schema | * | PASS |  |  |
| S06 | guarded disposable cleanup flags | delete_rem_by_id | PASS |  |  |
| S08 | bounded card verifier | verify_card_set | PASS |  |  |
| S10 | 15 node live write/readback/cleanup | create_or_replace_note_from_markdown | GATED | Live RemNote plugin access is required. | Run bridge live smoke with a disposable parent after connecting the plugin. |
| S10 | 50 node live write/readback/cleanup | create_or_replace_note_from_markdown | GATED | Live RemNote plugin access is required. | Run bridge live smoke with a disposable parent after connecting the plugin. |
| S10 | 100 node live write/readback/cleanup | create_or_replace_note_from_markdown | GATED | Live RemNote plugin access is required. | Run bridge live smoke with a disposable parent after connecting the plugin. |
