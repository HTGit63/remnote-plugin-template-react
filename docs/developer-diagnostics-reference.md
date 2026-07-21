# Developer Diagnostics Reference

Generated from registry. Registry 2026-07-21.hosted-media-files. Schema 2026-07-21.hosted-media-files.

## Runtime Fields

| Tool | Category | Declared | Registered | Listed | Callable | Live Verified | SDK Unsupported | Hidden | Budget ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| analyze_note_design | design_template | true | true | true | false | false | false | false | 5000 |
| append_markdown_as_rem_tree | markdown_note | true | true | true | false | false | false | false | 5000 |
| append_to_rem | simple_write | true | true | true | false | false | false | false | 3000 |
| apply_remnote_command | repair | true | true | true | false | false | false | false | 3000 |
| apply_structured_note_batch | structured_note | true | true | true | false | false | false | false | 5000 |
| apply_style_plan | repair | true | true | true | false | false | false | false | 3000 |
| cancel_note_import_job | markdown_note | true | true | true | true | false | false | false | 5000 |
| clear_rem_formatting | repair | true | true | true | false | false | false | false | 3000 |
| create_basic_flashcard | study_card | true | true | true | false | false | false | false | 3000 |
| create_card_set_from_note | study_card | true | true | true | false | false | false | false | 3000 |
| create_cloze_card | study_card | true | true | true | false | false | false | false | 3000 |
| create_cloze_cards_from_note | study_card | true | true | true | false | false | false | false | 3000 |
| create_concept_card | study_card | true | true | true | false | false | false | false | 3000 |
| create_descriptor_card | study_card | true | true | true | false | false | false | false | 3000 |
| create_designed_note_tree | design_template | true | true | true | false | false | false | false | 5000 |
| create_document | simple_write | true | true | true | false | false | false | false | 3000 |
| create_flashcards_from_markdown | study_card | true | true | true | false | false | false | false | 3000 |
| create_folder | simple_write | true | false | false | false | false | true | true | 3000 |
| create_list_answer_card | study_card | true | true | true | false | false | false | false | 3000 |
| create_multiple_choice_card | study_card | true | true | true | false | false | false | false | 3000 |
| create_note_from_markdown_tree | markdown_note | true | true | true | false | false | false | false | 5000 |
| create_or_replace_note_from_markdown | markdown_note | true | true | true | false | false | false | false | 5000 |
| create_polished_note_tree | design_template | true | true | true | false | false | false | false | 5000 |
| create_rem | simple_write | true | true | true | false | false | false | false | 3000 |
| create_rem_tree | structured_note | true | true | true | false | false | false | false | 5000 |
| create_styled_rem_tree | structured_note | true | true | true | false | false | false | false | 5000 |
| debug_get_raw_rich_text | debug | true | true | true | false | false | false | false | 1000 |
| delete_rem_by_id | danger | true | false | false | false | false | false | true | 3000 |
| export_note_design_template | design_template | true | true | true | false | false | false | false | 5000 |
| get_bridge_diagnostics | debug | true | true | true | true | false | false | false | 1000 |
| get_bridge_status | system | true | true | true | true | false | false | false | 1000 |
| get_children | read | true | true | true | false | false | false | false | 1000 |
| get_current_selection | read | true | true | true | false | false | false | false | 1000 |
| get_document_or_folder_tree | read | true | true | true | false | false | false | false | 1000 |
| get_focused_rem | read | true | true | true | false | false | false | false | 1000 |
| get_note_import_job_status | markdown_note | true | true | true | true | false | false | false | 5000 |
| get_plugin_status | system | true | true | true | false | false | false | false | 1000 |
| get_rem | read | true | true | true | false | false | false | false | 1000 |
| get_rem_breadcrumbs | read | true | true | true | false | false | false | false | 1000 |
| get_rem_rich | read | true | true | true | false | false | false | false | 1000 |
| get_rem_tree | read | true | true | true | false | false | false | false | 1000 |
| get_remnote_capability_guide | debug | true | true | true | true | false | false | false | 1000 |
| import_note_design_template | design_template | true | true | true | false | false | false | false | 5000 |
| insert_audio_from_file | simple_write | true | true | true | false | false | false | false | 3000 |
| insert_audio_from_url | simple_write | true | true | true | false | false | false | false | 3000 |
| insert_image_from_file | simple_write | true | true | true | false | false | false | false | 3000 |
| insert_image_from_url | simple_write | true | true | true | false | false | false | false | 3000 |
| insert_video_from_file | simple_write | true | true | true | false | false | false | false | 3000 |
| insert_video_from_url | simple_write | true | true | true | false | false | false | false | 3000 |
| list_note_design_templates | design_template | true | true | true | false | false | false | false | 5000 |
| move_rem | repair | true | true | true | false | false | false | false | 3000 |
| ping_remnote_plugin | debug | true | true | true | false | false | false | false | 1000 |
| plan_note_import | markdown_note | true | true | true | true | false | false | false | 5000 |
| plan_note_import_from_file | markdown_note | true | true | true | true | false | false | false | 5000 |
| preview_markdown_note_tree | markdown_note | true | true | true | true | false | false | false | 5000 |
| preview_note_design_plan | design_template | true | true | true | false | false | false | false | 5000 |
| reconcile_note_import_job_chunk | repair | true | true | true | true | false | false | false | 10000 |
| reorder_children | repair | true | true | true | false | false | false | false | 3000 |
| repair_card_set | repair | true | true | true | false | false | false | false | 3000 |
| repair_note_design | repair | true | true | true | false | false | false | false | 3000 |
| replace_rem | danger | true | false | false | false | false | false | true | 3000 |
| resume_note_import_job | markdown_note | true | true | true | true | false | false | false | 10000 |
| run_bridge_health_check | debug | true | true | true | true | false | false | false | 12000 |
| run_note_import_job_step | markdown_note | true | true | true | true | false | false | false | 10000 |
| save_note_design_template | design_template | true | true | true | false | false | false | false | 5000 |
| search_rems | read | true | true | true | false | false | false | false | 2000 |
| set_hide_bullet | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_heading_level | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_highlight_color | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_text_color | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_type | repair | true | true | true | false | false | false | false | 3000 |
| set_text_span_color | repair | true | true | true | false | false | false | false | 3000 |
| set_text_span_highlight | repair | true | true | true | false | false | false | false | 3000 |
| start_note_import_from_file | markdown_note | true | true | true | true | false | false | false | 5000 |
| start_note_import_job | markdown_note | true | true | true | true | false | false | false | 5000 |
| update_note_with_design | repair | true | true | true | false | false | false | false | 3000 |
| update_rem | repair | true | true | true | false | false | false | false | 3000 |
| update_rem_rich | repair | true | true | true | false | false | false | false | 3000 |
| verify_card_set | read | true | true | true | false | false | false | false | 1000 |
| verify_note_against_design | read | true | true | true | false | false | false | false | 1000 |
| verify_note_design | read | true | true | true | false | false | false | false | 1000 |
| verify_note_import_job | markdown_note | true | true | true | true | false | false | false | 5000 |

## Tool Correctness Matrix

| Tool | Profile Exposure | Schema Status | Server-Local Status | Live Status | ChatGPT Status | Codex Status | Next Test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| analyze_note_design | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| append_markdown_as_rem_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| append_to_rem | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| apply_remnote_command | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| apply_structured_note_batch | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| apply_style_plan | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| cancel_note_import_job | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| clear_rem_formatting | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_basic_flashcard | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_card_set_from_note | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_cloze_card | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_cloze_cards_from_note | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_concept_card | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_descriptor_card | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_designed_note_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_document | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_flashcards_from_markdown | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_folder | hidden_or_gated | sdk_unsupported | not_server_local | live_not_run | hidden_or_gated | hidden_or_gated | Add SDK-backed implementation, then run server:test:tool-schemas and targeted smoke. |
| create_list_answer_card | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_multiple_choice_card | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_note_from_markdown_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_or_replace_note_from_markdown | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_polished_note_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_rem | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_rem_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| create_styled_rem_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| debug_get_raw_rich_text | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics |
| delete_rem_by_id | hidden_or_gated | schema_ok | not_server_local | live_not_run | hidden_or_gated | hidden_or_gated | Enable danger profile only for dry-run plus guarded disposable delete smoke. |
| export_note_design_template | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_bridge_diagnostics | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics |
| get_bridge_status | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| get_children | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_current_selection | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_document_or_folder_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_focused_rem | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_note_import_job_status | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| get_plugin_status | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_rem | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_rem_breadcrumbs | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_rem_rich | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_rem_tree | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| get_remnote_capability_guide | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics |
| import_note_design_template | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| insert_audio_from_file | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| insert_audio_from_url | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| insert_image_from_file | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| insert_image_from_url | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| insert_video_from_file | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| insert_video_from_url | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| list_note_design_templates | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| move_rem | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| ping_remnote_plugin | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics |
| plan_note_import | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| plan_note_import_from_file | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| preview_markdown_note_tree | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| preview_note_design_plan | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| reconcile_note_import_job_chunk | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| reorder_children | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| repair_card_set | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| repair_note_design | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| replace_rem | hidden_or_gated | hidden_schema_present | not_server_local | live_not_run | hidden_or_gated | hidden_or_gated | Enable danger profile only for dry-run plus guarded disposable delete smoke. |
| resume_note_import_job | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| run_bridge_health_check | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics |
| run_note_import_job_step | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| save_note_design_template | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| search_rems | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| set_hide_bullet | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| set_rem_heading_level | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| set_rem_highlight_color | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| set_rem_text_color | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| set_rem_type | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| set_text_span_color | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| set_text_span_highlight | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| start_note_import_from_file | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| start_note_import_job | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |
| update_note_with_design | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| update_rem | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| update_rem_rich | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-advanced plus targeted Vitest/readback |
| verify_card_set | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| verify_note_against_design | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| verify_note_design | active_profile | schema_ok | not_server_local | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-core with connected plugin readback |
| verify_note_import_job | active_profile | schema_ok | server_local_verified | live_not_run | default_profile_available | same_registry_auth_and_scope_boundary | npm run server:test:tools-diagnostics or server-local smoke |

## Performance Budgets

| Tool | Category | Budget ms |
| --- | --- | --- |
| get_bridge_status | system | 1000 |
| get_plugin_status | system | 1000 |
| get_focused_rem | read | 1000 |
| get_rem | read | 1000 |
| get_children | read | 1000 |
| get_rem_tree | read | 1000 |
| get_rem_breadcrumbs | read | 1000 |
| search_rems | read | 2000 |
| create_basic_flashcard | study_card | 3000 |
| create_cloze_card | study_card | 3000 |
| create_multiple_choice_card | study_card | 3000 |
| create_list_answer_card | study_card | 3000 |
| delete_rem_by_id | danger | 3000 |
| get_current_selection | read | 1000 |
| get_rem_rich | read | 1000 |
| get_document_or_folder_tree | read | 1000 |
| create_rem | simple_write | 3000 |
| create_document | simple_write | 3000 |
| append_to_rem | simple_write | 3000 |
| insert_image_from_url | simple_write | 3000 |
| insert_image_from_file | simple_write | 3000 |
| insert_audio_from_url | simple_write | 3000 |
| insert_audio_from_file | simple_write | 3000 |
| insert_video_from_url | simple_write | 3000 |
| insert_video_from_file | simple_write | 3000 |
| update_rem | repair | 3000 |
| replace_rem | danger | 3000 |
| move_rem | repair | 3000 |
| reorder_children | repair | 3000 |
| create_rem_tree | structured_note | 5000 |
| update_rem_rich | repair | 3000 |
| create_styled_rem_tree | structured_note | 5000 |
| create_polished_note_tree | design_template | 5000 |
| create_or_replace_note_from_markdown | markdown_note | 5000 |
| plan_note_import | markdown_note | 5000 |
| plan_note_import_from_file | markdown_note | 5000 |
| start_note_import_job | markdown_note | 5000 |
| start_note_import_from_file | markdown_note | 5000 |
| run_note_import_job_step | markdown_note | 10000 |
| get_note_import_job_status | markdown_note | 5000 |
| resume_note_import_job | markdown_note | 10000 |
| reconcile_note_import_job_chunk | repair | 10000 |
| verify_note_import_job | markdown_note | 5000 |
| cancel_note_import_job | markdown_note | 5000 |
| preview_markdown_note_tree | markdown_note | 5000 |
| create_note_from_markdown_tree | markdown_note | 5000 |
| append_markdown_as_rem_tree | markdown_note | 5000 |
| apply_structured_note_batch | structured_note | 5000 |
| apply_style_plan | repair | 3000 |
| verify_note_design | read | 1000 |
| analyze_note_design | design_template | 5000 |
| save_note_design_template | design_template | 5000 |
| list_note_design_templates | design_template | 5000 |
| preview_note_design_plan | design_template | 5000 |
| export_note_design_template | design_template | 5000 |
| import_note_design_template | design_template | 5000 |
| create_designed_note_tree | design_template | 5000 |
| update_note_with_design | repair | 3000 |
| verify_note_against_design | read | 1000 |
| repair_note_design | repair | 3000 |
| create_card_set_from_note | study_card | 3000 |
| create_flashcards_from_markdown | study_card | 3000 |
| create_cloze_cards_from_note | study_card | 3000 |
| verify_card_set | read | 1000 |
| repair_card_set | repair | 3000 |
| apply_remnote_command | repair | 3000 |
| set_rem_heading_level | repair | 3000 |
| set_rem_text_color | repair | 3000 |
| set_rem_highlight_color | repair | 3000 |
| set_text_span_color | repair | 3000 |
| set_text_span_highlight | repair | 3000 |
| set_rem_type | repair | 3000 |
| set_hide_bullet | repair | 3000 |
| clear_rem_formatting | repair | 3000 |
| create_concept_card | study_card | 3000 |
| create_descriptor_card | study_card | 3000 |
| ping_remnote_plugin | debug | 1000 |
| get_bridge_diagnostics | debug | 1000 |
| run_bridge_health_check | debug | 12000 |
| get_remnote_capability_guide | debug | 1000 |
| debug_get_raw_rich_text | debug | 1000 |
| create_folder | simple_write | 3000 |
