import type { BridgeToolName } from '../../src/bridge/protocol.js';

export function publicMcpToolNameForBridgeTool(tool: BridgeToolName): string {
  switch (tool) {
    case 'ping':
      return 'ping_remnote_plugin';
    case 'get_status':
      return 'get_plugin_status';
    default:
      return tool;
  }
}

export function bridgeToolNameForPublicMcpTool(tool: string): BridgeToolName | undefined {
  switch (tool) {
    case 'ping_remnote_plugin':
      return 'ping';
    case 'get_plugin_status':
      return 'get_status';
    case 'get_focused_rem':
    case 'get_rem':
    case 'get_rem_tree':
    case 'get_rem_rich':
    case 'get_current_selection':
    case 'get_children':
    case 'get_rem_breadcrumbs':
    case 'search_rems':
    case 'get_document_or_folder_tree':
    case 'create_rem':
    case 'append_to_rem':
    case 'create_document':
    case 'create_folder':
    case 'update_rem':
    case 'move_rem':
    case 'reorder_children':
    case 'create_rem_tree':
    case 'update_rem_rich':
    case 'set_rem_heading_level':
    case 'set_rem_text_color':
    case 'set_rem_highlight_color':
    case 'set_text_span_color':
    case 'set_text_span_highlight':
    case 'set_rem_type':
    case 'set_hide_bullet':
    case 'clear_rem_formatting':
    case 'create_styled_rem_tree':
    case 'apply_remnote_command':
    case 'apply_structured_note_batch':
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
    case 'create_cloze_card':
    case 'create_multiple_choice_card':
    case 'create_list_answer_card':
    case 'replace_rem':
    case 'delete_focused_rem':
    case 'delete_selected_rem':
    case 'delete_rem':
      return tool;
    default:
      return undefined;
  }
}
