# Tool Reference

Generated from registry. Server 0.0.1. Registry 2026-06-25.problem-tool-status-matrix. Schema 2026-06-25.problem-tool-status-matrix.

| Tool | Category | Operation Tier | Scope | Access Tier | Risk | SDK Capability | Public | Default Tier | Danger Tier | Dry Run | Budget ms | Warning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| get_bridge_status | system | Read Only | none | basic | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| get_plugin_status | system | Read Only | none | basic | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| get_focused_rem | read | Read Only | focused-rem | basic | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| get_rem | read | Read Only | focused-rem | basic | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| get_children | read | Read Only | focused-rem | basic | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| get_rem_tree | read | Read Only | focused-rem | basic | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| get_rem_breadcrumbs | read | Read Only | focused-rem | basic | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| search_rems | read | Read Only | workspace_allowed | basic | low | bridge_or_read_sdk | true | true | true | false | 2000 |  |
| create_basic_flashcard | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | false | 3000 |  |
| create_cloze_card | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | false | 3000 |  |
| create_multiple_choice_card | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | false | 3000 |  |
| create_list_answer_card | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | false | 3000 |  |
| delete_rem_by_id | danger | Full Control With Delete Approval | current-rem-tree | danger | dangerous | plugin.rem SDK | true | false | true | true | 3000 | DANGER: delete_rem_by_id is destructive. Default dryRun=true. Real delete requires dryRun=false, confirmTitle, and expectedParentId or expectedAncestorId after user approval. |
| get_current_selection | read | Read Only | focused-rem | note_writer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| get_rem_rich | read | Read Only | focused-rem | note_writer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| get_document_or_folder_tree | read | Read Only | focused-rem | mass_note_writer | low | bridge_or_read_sdk | true | true | true | false | 1000 |  |
| create_rem | simple_write | Read + Create | approved-root | note_writer | medium | plugin.rem.createSingleRemWithMarkdown | true | false | true | false | 3000 |  |
| create_document | simple_write | Read + Create | approved-root | note_writer | medium | plugin.rem.createSingleRemWithMarkdown | true | false | true | false | 3000 |  |
| append_to_rem | simple_write | Read + Create | approved-root | note_writer | medium | plugin.rem SDK | true | false | true | false | 3000 |  |
| update_rem | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem mutation setters | true | false | true | true | 3000 |  |
| replace_rem | danger | Full Control With Delete Approval | current-rem-tree | danger | dangerous | plugin.rem SDK | false | false | false | true | 3000 | replace_rem is hidden until replacement guards and readback verification are live-proven safe. |
| move_rem | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem mutation setters | true | false | true | true | 3000 |  |
| reorder_children | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem mutation setters | true | false | true | true | 3000 |  |
| create_rem_tree | structured_note | Read + Create | approved-root | note_writer | medium | plugin.rem.createTreeWithMarkdown | true | false | true | false | 5000 |  |
| update_rem_rich | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| create_styled_rem_tree | structured_note | Read + Create | approved-root | note_writer | medium | plugin.rem.createTreeWithMarkdown | true | false | true | true | 5000 |  |
| create_polished_note_tree | design_template | Read + Create | approved-root | note_writer | medium | plugin.rem.createTreeWithMarkdown | true | false | true | true | 5000 |  |
| create_or_replace_note_from_markdown | markdown_note | Read + Create + Modify | approved-root | mass_note_writer | medium | plugin.rem.createTreeWithMarkdown | true | true | true | true | 5000 |  |
| plan_note_import | markdown_note | Read Only | none | mass_note_writer | low | server_local_bulk_import_manifest | true | true | true | true | 5000 |  |
| plan_note_import_from_file | markdown_note | Read Only | approved-root | mass_note_writer | low | server_local_bulk_import_manifest | true | true | true | true | 5000 | Reads only server-side source files under allowed roots. Configure REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS for additional import locations. |
| start_note_import_job | markdown_note | Read Only | none | mass_note_writer | low | server_local_bulk_import_manifest | true | true | true | true | 5000 |  |
| start_note_import_from_file | markdown_note | Read Only | approved-root | mass_note_writer | low | server_local_bulk_import_manifest | true | true | true | true | 5000 | Creates a memory-only resumable job from a server-side source file; chunk writes still require run_note_import_job_step. |
| run_note_import_job_step | markdown_note | Read + Create + Modify | approved-root | mass_note_writer | medium | server_local_bulk_import_manifest + create_or_replace_note_from_markdown | true | true | true | true | 10000 |  |
| get_note_import_job_status | markdown_note | Read Only | none | mass_note_writer | low | server_local_bulk_import_manifest | true | true | true | false | 5000 |  |
| resume_note_import_job | markdown_note | Read + Create + Modify | approved-root | mass_note_writer | medium | server_local_bulk_import_manifest + create_or_replace_note_from_markdown | true | true | true | true | 10000 |  |
| verify_note_import_job | markdown_note | Read Only | none | mass_note_writer | low | server_local_bulk_import_manifest | true | true | true | false | 5000 |  |
| cancel_note_import_job | markdown_note | Read Only | none | mass_note_writer | low | server_local_bulk_import_manifest | true | true | true | false | 5000 |  |
| preview_markdown_note_tree | markdown_note | Read Only | none | note_writer | low | plugin.rem SDK | true | false | true | true | 5000 |  |
| create_note_from_markdown_tree | markdown_note | Read + Create | approved-root | note_writer | medium | plugin.rem.createTreeWithMarkdown | true | false | true | true | 5000 | Legacy hierarchy writer. Prefer create_or_replace_note_from_markdown or the resumable bulk import job flow for normal ChatGPT note writing. |
| append_markdown_as_rem_tree | markdown_note | Read + Create | approved-root | note_writer | medium | plugin.rem.createTreeWithMarkdown | true | false | true | true | 5000 |  |
| apply_structured_note_batch | structured_note | Read + Create + Modify | approved-root | note_writer | medium | plugin.rem.createTreeWithMarkdown | true | false | true | true | 5000 |  |
| apply_style_plan | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | true | 3000 |  |
| verify_note_design | read | Read Only | focused-rem | note_writer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| analyze_note_design | design_template | Read Only | current-rem-tree | note_writer | low | plugin.rem read SDK | true | false | true | true | 5000 |  |
| save_note_design_template | design_template | Read + Create + Modify | approved-root | note_writer | medium | plugin.storage.local | true | false | true | false | 5000 |  |
| list_note_design_templates | design_template | Read Only | none | note_writer | low | plugin.storage.local | true | false | true | false | 5000 |  |
| preview_note_design_plan | design_template | Read Only | none | note_writer | low | plugin.rem read SDK | true | false | true | true | 5000 |  |
| export_note_design_template | design_template | Read Only | none | note_writer | low | plugin.storage.local | true | false | true | false | 5000 |  |
| import_note_design_template | design_template | Read + Create + Modify | approved-root | note_writer | medium | plugin.storage.local | true | false | true | false | 5000 |  |
| create_designed_note_tree | design_template | Read + Create | approved-root | note_writer | medium | plugin.rem.createTreeWithMarkdown + style setters | true | false | true | true | 5000 |  |
| update_note_with_design | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem.createTreeWithMarkdown + style setters | true | false | true | true | 3000 | Existing note design updates require dryRun preview or approved=true for real mutation. |
| verify_note_against_design | read | Read Only | focused-rem | note_writer | low | plugin.rem read SDK | true | false | true | false | 1000 |  |
| repair_note_design | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem.createTreeWithMarkdown + style setters | true | false | true | true | 3000 | repair_note_design defaults to dryRun and requires approved=true for real repair. |
| create_card_set_from_note | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | true | 3000 |  |
| create_flashcards_from_markdown | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | true | 3000 |  |
| create_cloze_cards_from_note | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | true | 3000 |  |
| verify_card_set | read | Read Only | focused-rem | note_writer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| repair_card_set | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem mutation setters | true | false | true | true | 3000 | repair_card_set defaults to dryRun and requires approved=true for real repair. |
| apply_remnote_command | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | true | 3000 |  |
| set_rem_heading_level | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| set_rem_text_color | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| set_rem_highlight_color | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| set_text_span_color | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| set_text_span_highlight | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| set_rem_type | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| set_hide_bullet | repair | Read + Create + Modify | current-rem-tree | power_user | medium | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| clear_rem_formatting | repair | Read + Create + Modify | current-rem-tree | power_user | high | plugin.rem mutation setters | true | false | true | false | 3000 |  |
| create_concept_card | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | false | 3000 |  |
| create_descriptor_card | study_card | Read + Create | approved-root | note_writer | medium | plugin.rem.createRem + card setters | true | false | true | false | 3000 |  |
| ping_remnote_plugin | debug | Read Only | none | developer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| get_bridge_diagnostics | debug | Read Only | none | developer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| run_bridge_health_check | debug | Read Only | none | developer | high | bridge_or_read_sdk | true | false | true | false | 12000 |  |
| get_remnote_capability_guide | debug | Read Only | none | developer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| debug_get_raw_rich_text | debug | Read Only | none | developer | low | bridge_or_read_sdk | true | false | true | false | 1000 |  |
| create_folder | simple_write | Read + Create | approved-root | unsupported | medium | no_verified_folder_api | false | false | false | false | 3000 | create_folder is hidden because no modern RemNote SDK folder creation path is live-verified. |
