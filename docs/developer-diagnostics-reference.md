# Developer Diagnostics Reference

Generated from registry. Registry 2026-06-05.goal9-catalog. Schema 2026-06-05.goal9-registry-source.

## Runtime Fields

| Tool | Category | Declared | Registered | Listed | Callable | Live Verified | SDK Unsupported | Hidden | Budget ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| analyze_note_design | design_template | true | true | true | false | false | false | false | 5000 |
| append_markdown_as_rem_tree | markdown_note | true | true | true | false | false | false | false | 5000 |
| append_to_rem | simple_write | true | true | true | false | false | false | false | 3000 |
| apply_remnote_command | repair | true | true | true | false | false | false | false | 3000 |
| apply_structured_note_batch | structured_note | true | true | true | false | false | false | false | 5000 |
| apply_style_plan | repair | true | true | true | false | false | false | false | 3000 |
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
| get_bridge_diagnostics | debug | true | true | true | true | true | false | false | 1000 |
| get_bridge_status | system | true | true | true | true | true | false | false | 1000 |
| get_children | read | true | true | true | false | false | false | false | 1000 |
| get_current_selection | read | true | true | true | false | false | false | false | 1000 |
| get_document_or_folder_tree | read | true | true | true | false | false | false | false | 1000 |
| get_focused_rem | read | true | true | true | false | false | false | false | 1000 |
| get_plugin_status | system | true | true | true | false | false | false | false | 1000 |
| get_rem | read | true | true | true | false | false | false | false | 1000 |
| get_rem_breadcrumbs | read | true | true | true | false | false | false | false | 1000 |
| get_rem_rich | read | true | true | true | false | false | false | false | 1000 |
| get_rem_tree | read | true | true | true | false | false | false | false | 1000 |
| get_remnote_capability_guide | debug | true | true | true | true | true | false | false | 1000 |
| import_note_design_template | design_template | true | true | true | false | false | false | false | 5000 |
| list_note_design_templates | design_template | true | true | true | false | false | false | false | 5000 |
| move_rem | repair | true | true | true | false | false | false | false | 3000 |
| ping_remnote_plugin | debug | true | true | true | false | false | false | false | 1000 |
| preview_markdown_note_tree | markdown_note | true | true | true | false | false | false | false | 5000 |
| preview_note_design_plan | design_template | true | true | true | false | false | false | false | 5000 |
| reorder_children | repair | true | true | true | false | false | false | false | 3000 |
| repair_card_set | repair | true | true | true | false | false | false | false | 3000 |
| repair_note_design | repair | true | true | true | false | false | false | false | 3000 |
| replace_rem | danger | true | false | false | false | false | false | true | 3000 |
| run_bridge_health_check | debug | true | true | true | true | true | false | false | 12000 |
| save_note_design_template | design_template | true | true | true | false | false | false | false | 5000 |
| search_rems | read | true | true | true | false | false | false | false | 2000 |
| set_hide_bullet | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_heading_level | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_highlight_color | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_text_color | repair | true | true | true | false | false | false | false | 3000 |
| set_rem_type | repair | true | true | true | false | false | false | false | 3000 |
| set_text_span_color | repair | true | true | true | false | false | false | false | 3000 |
| set_text_span_highlight | repair | true | true | true | false | false | false | false | 3000 |
| update_note_with_design | repair | true | true | true | false | false | false | false | 3000 |
| update_rem | repair | true | true | true | false | false | false | false | 3000 |
| update_rem_rich | repair | true | true | true | false | false | false | false | 3000 |
| verify_card_set | read | true | true | true | false | false | false | false | 1000 |
| verify_note_against_design | read | true | true | true | false | false | false | false | 1000 |
| verify_note_design | read | true | true | true | false | false | false | false | 1000 |

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
| update_rem | repair | 3000 |
| replace_rem | danger | 3000 |
| move_rem | repair | 3000 |
| reorder_children | repair | 3000 |
| create_rem_tree | structured_note | 5000 |
| update_rem_rich | repair | 3000 |
| create_styled_rem_tree | structured_note | 5000 |
| create_polished_note_tree | design_template | 5000 |
| create_or_replace_note_from_markdown | markdown_note | 5000 |
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
