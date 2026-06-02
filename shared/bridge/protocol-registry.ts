import type { BridgeErrorCode, BridgeLifecycleEvent, BridgeToolName } from './protocol-core';
import type {
  BridgeFailure,
  BridgeRequest,
  BridgeResponse,
  BridgeSuccess,
  BridgeToolResults,
} from './protocol-messages';

export interface BridgeToolAnnotations {
  readOnlyHint: boolean;
  openWorldHint: boolean;
  destructiveHint: boolean;
  idempotentHint?: boolean;
}

export const BRIDGE_TOOL_NAMES: readonly BridgeToolName[] = [
  'ping',
  'get_status',
  'get_focused_rem',
  'get_rem',
  'get_rem_tree',
  'get_rem_rich',
  'debug_get_raw_rich_text',
  'get_current_selection',
  'get_children',
  'get_rem_breadcrumbs',
  'search_rems',
  'get_document_or_folder_tree',
  'create_rem',
  'append_to_rem',
  'create_document',
  'create_folder',
  'update_rem',
  'move_rem',
  'reorder_children',
  'create_rem_tree',
  'update_rem_rich',
  'set_rem_heading_level',
  'set_rem_text_color',
  'set_rem_highlight_color',
  'set_text_span_color',
  'set_text_span_highlight',
  'set_rem_type',
  'set_hide_bullet',
  'clear_rem_formatting',
  'create_styled_rem_tree',
  'apply_remnote_command',
  'apply_structured_note_batch',
  'create_polished_note_tree',
  'create_or_replace_note_from_markdown',
  'apply_style_plan',
  'verify_note_design',
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
  'replace_rem',
  'delete_rem_by_id',
] as const;

export const BRIDGE_TOOL_ANNOTATIONS: Record<BridgeToolName, BridgeToolAnnotations> = {
  ping: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_status: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_focused_rem: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_tree: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_rich: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  debug_get_raw_rich_text: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_current_selection: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_children: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_breadcrumbs: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  search_rems: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_document_or_folder_tree: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  create_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  append_to_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_document: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_folder: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  update_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  move_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  reorder_children: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_rem_tree: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  update_rem_rich: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_heading_level: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_text_color: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_highlight_color: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_text_span_color: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_text_span_highlight: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_type: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_hide_bullet: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  clear_rem_formatting: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_styled_rem_tree: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  apply_remnote_command: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  apply_structured_note_batch: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_polished_note_tree: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  create_or_replace_note_from_markdown: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  apply_style_plan: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  verify_note_design: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  create_basic_flashcard: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_concept_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_descriptor_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_cloze_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_multiple_choice_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_list_answer_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  replace_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  },
  delete_rem_by_id: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
};

export function isBridgeToolName(value: unknown): value is BridgeToolName {
  return typeof value === 'string' && (BRIDGE_TOOL_NAMES as readonly string[]).includes(value);
}

export function createBridgeSuccess<TTool extends BridgeToolName>(
  request: Pick<BridgeRequest<TTool>, 'id'>,
  result: BridgeToolResults[TTool],
  lifecycle?: BridgeLifecycleEvent[]
): BridgeSuccess<BridgeToolResults[TTool]> {
  return {
    id: request.id,
    ok: true,
    result,
    ...(lifecycle ? { lifecycle } : {}),
  };
}

export function createBridgeFailure(
  id: string,
  code: BridgeErrorCode,
  message: string,
  details?: unknown,
  lifecycle?: BridgeLifecycleEvent[]
): BridgeFailure {
  return {
    id,
    ok: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    ...(lifecycle ? { lifecycle } : {}),
  };
}
