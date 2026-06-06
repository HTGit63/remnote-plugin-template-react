# RemnoteMCP Live Tool Smoke Report

- MCP URL: http://127.0.0.1:47392/mcp?tool_tier=developer
- Generated: 2026-06-06T04:52:23.889Z
- Passed: 1
- Failed: 6
- Skipped: 26

## Tool Results

| Tool | Category | Status | ms | Code | Layer | Reached Plugin | Changed | Fix |
|---|---|---:|---:|---|---|---:|---:|---|
| get_bridge_status | system/read | passed | 14 |  |  | no | no |  |
| get_plugin_status | system/read | failed | 1227 | PLUGIN_NOT_CONNECTED | server_or_bridge | no | no | Retry the read after the RemNote plugin reconnects. |
| ping_remnote_plugin | system/read | failed | 1215 | PLUGIN_NOT_CONNECTED | server_or_bridge | no | no | Retry the read after the RemNote plugin reconnects. |
| get_focused_rem | system/read | failed | 1217 | PLUGIN_NOT_CONNECTED | server_or_bridge | no | no | Retry the read after the RemNote plugin reconnects. |
| get_current_selection | system/read | failed | 1225 | PLUGIN_NOT_CONNECTED | server_or_bridge | no | no | Retry the read after the RemNote plugin reconnects. |
| get_children | system/read | skipped | 0 |  |  | no | no | Missing disposable root Rem ID. |
| get_rem_tree | system/read | skipped | 0 |  |  | no | no | Missing disposable root Rem ID. |
| get_rem_rich | system/read | skipped | 0 |  |  | no | no | Missing disposable root Rem ID. |
| create_rem | simple_write | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| append_to_rem | simple_write | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| create_rem_tree | simple_write | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| create_styled_rem_tree | simple_write | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| preview_markdown_note_tree | markdown_note | failed | 1216 | PLUGIN_NOT_CONNECTED | server_or_bridge | no | no | Retry the read after the RemNote plugin reconnects. |
| create_note_from_markdown_tree | markdown_note | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| append_markdown_as_rem_tree | markdown_note | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| apply_structured_note_batch | complex_note | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| create_polished_note_tree | complex_note | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| create_designed_note_tree | complex_note | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| verify_note_design | complex_note | skipped | 0 |  |  | no | no | Missing created/target Rem ID. |
| analyze_note_design | complex_note | skipped | 0 |  |  | no | no | Missing created/target Rem ID. |
| preview_note_design_plan | complex_note | failed | 1219 | PLUGIN_NOT_CONNECTED | server_or_bridge | no | no | Retry the read after the RemNote plugin reconnects. |
| create_basic_flashcard | flashcard | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| create_cloze_card | flashcard | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| create_flashcards_from_markdown | flashcard | skipped | 0 |  |  | no | no | Missing disposable parent Rem ID. |
| verify_card_set | flashcard | skipped | 0 |  |  | no | no | Missing created/target Rem ID. |
| set_rem_heading_level | style | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| set_rem_text_color | style | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| set_rem_highlight_color | style | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| set_hide_bullet | style | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| apply_style_plan | style | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| repair_note_design | repair/danger | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| repair_card_set | repair/danger | skipped | 0 |  |  | no | no | Missing target Rem ID. |
| delete_rem_by_id | repair/danger | skipped | 0 |  |  | no | no | Tool not listed for active tool tier. |

## Static Execution Matrix

| Tool | MCP | Schema | Bridge | Normalize | Handler | Function | Live |
|---|---:|---:|---|---:|---:|---:|---|
| analyze_note_design | yes | yes | analyze_note_design | yes | yes | yes | skipped |
| append_markdown_as_rem_tree | yes | yes | append_markdown_as_rem_tree | yes | yes | yes | skipped |
| append_to_rem | yes | yes | append_to_rem | yes | yes | yes | skipped |
| apply_remnote_command | yes | yes | apply_remnote_command | yes | yes | yes | not_run |
| apply_structured_note_batch | yes | yes | apply_structured_note_batch | yes | yes | yes | skipped |
| apply_style_plan | yes | yes | apply_style_plan | yes | yes | yes | skipped |
| clear_rem_formatting | yes | yes | clear_rem_formatting | yes | yes | yes | not_run |
| create_basic_flashcard | yes | yes | create_basic_flashcard | yes | yes | yes | skipped |
| create_card_set_from_note | yes | yes | create_card_set_from_note | yes | yes | yes | not_run |
| create_cloze_card | yes | yes | create_cloze_card | yes | yes | yes | skipped |
| create_cloze_cards_from_note | yes | yes | create_cloze_cards_from_note | yes | yes | yes | not_run |
| create_concept_card | yes | yes | create_concept_card | yes | yes | yes | not_run |
| create_descriptor_card | yes | yes | create_descriptor_card | yes | yes | yes | not_run |
| create_designed_note_tree | yes | yes | create_designed_note_tree | yes | yes | yes | skipped |
| create_document | yes | yes | create_document | yes | yes | yes | not_run |
| create_flashcards_from_markdown | yes | yes | create_flashcards_from_markdown | yes | yes | yes | skipped |
| create_list_answer_card | yes | yes | create_list_answer_card | yes | yes | yes | not_run |
| create_multiple_choice_card | yes | yes | create_multiple_choice_card | yes | yes | yes | not_run |
| create_note_from_markdown_tree | yes | yes | create_note_from_markdown_tree | yes | yes | yes | skipped |
| create_or_replace_note_from_markdown | yes | yes | create_or_replace_note_from_markdown | yes | yes | yes | not_run |
| create_polished_note_tree | yes | yes | create_polished_note_tree | yes | yes | yes | skipped |
| create_rem | yes | yes | create_rem | yes | yes | yes | skipped |
| create_rem_tree | yes | yes | create_rem_tree | yes | yes | yes | skipped |
| create_styled_rem_tree | yes | yes | create_styled_rem_tree | yes | yes | yes | skipped |
| debug_get_raw_rich_text | yes | yes | debug_get_raw_rich_text | yes | yes | yes | not_run |
| export_note_design_template | yes | yes | export_note_design_template | yes | yes | yes | not_run |
| get_bridge_diagnostics | yes | yes |  | yes | yes | yes | not_run |
| get_bridge_status | yes | yes |  | yes | yes | yes | passed |
| get_children | yes | yes | get_children | yes | yes | yes | skipped |
| get_current_selection | yes | yes | get_current_selection | yes | yes | yes | failed |
| get_document_or_folder_tree | yes | yes | get_document_or_folder_tree | yes | yes | yes | not_run |
| get_focused_rem | yes | yes | get_focused_rem | yes | yes | yes | failed |
| get_plugin_status | yes | yes | get_status | yes | yes | yes | failed |
| get_rem | yes | yes | get_rem | yes | yes | yes | not_run |
| get_rem_breadcrumbs | yes | yes | get_rem_breadcrumbs | yes | yes | yes | not_run |
| get_rem_rich | yes | yes | get_rem_rich | yes | yes | yes | skipped |
| get_rem_tree | yes | yes | get_rem_tree | yes | yes | yes | skipped |
| get_remnote_capability_guide | yes | yes |  | yes | yes | yes | not_run |
| import_note_design_template | yes | yes | import_note_design_template | yes | yes | yes | not_run |
| list_note_design_templates | yes | yes | list_note_design_templates | yes | yes | yes | not_run |
| move_rem | yes | yes | move_rem | yes | yes | yes | not_run |
| ping_remnote_plugin | yes | yes | ping | yes | yes | yes | failed |
| preview_markdown_note_tree | yes | yes | preview_markdown_note_tree | yes | yes | yes | failed |
| preview_note_design_plan | yes | yes | preview_note_design_plan | yes | yes | yes | failed |
| reorder_children | yes | yes | reorder_children | yes | yes | yes | not_run |
| repair_card_set | yes | yes | repair_card_set | yes | yes | yes | skipped |
| repair_note_design | yes | yes | repair_note_design | yes | yes | yes | skipped |
| run_bridge_health_check | yes | yes |  | yes | yes | yes | not_run |
| save_note_design_template | yes | yes | save_note_design_template | yes | yes | yes | not_run |
| search_rems | yes | yes | search_rems | yes | yes | yes | not_run |
| set_hide_bullet | yes | yes | set_hide_bullet | yes | yes | yes | skipped |
| set_rem_heading_level | yes | yes | set_rem_heading_level | yes | yes | yes | skipped |
| set_rem_highlight_color | yes | yes | set_rem_highlight_color | yes | yes | yes | skipped |
| set_rem_text_color | yes | yes | set_rem_text_color | yes | yes | yes | skipped |
| set_rem_type | yes | yes | set_rem_type | yes | yes | yes | not_run |
| set_text_span_color | yes | yes | set_text_span_color | yes | yes | yes | not_run |
| set_text_span_highlight | yes | yes | set_text_span_highlight | yes | yes | yes | not_run |
| update_note_with_design | yes | yes | update_note_with_design | yes | yes | yes | not_run |
| update_rem | yes | yes | update_rem | yes | yes | yes | not_run |
| update_rem_rich | yes | yes | update_rem_rich | yes | yes | yes | not_run |
| verify_card_set | yes | yes | verify_card_set | yes | yes | yes | skipped |
| verify_note_against_design | yes | yes | verify_note_against_design | yes | yes | yes | not_run |
| verify_note_design | yes | yes | verify_note_design | yes | yes | yes | skipped |

