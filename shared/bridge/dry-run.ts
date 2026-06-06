import type { BridgeToolArgs } from './protocol-messages.js';
import type { BridgeToolName } from './protocol-core.js';

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safetyOptions(value: Record<string, unknown>): Record<string, unknown> {
  return record(value.safetyOptions);
}

export function isDryRunRequest<TTool extends BridgeToolName>(
  tool: TTool,
  args: BridgeToolArgs[TTool] | unknown
): boolean {
  const input = record(args);
  switch (tool) {
    case 'update_rem':
    case 'move_rem':
    case 'reorder_children':
    case 'create_styled_rem_tree':
    case 'apply_structured_note_batch':
    case 'create_polished_note_tree':
    case 'apply_style_plan':
    case 'apply_remnote_command':
    case 'create_designed_note_tree':
    case 'update_note_with_design':
      return input.dryRun === true;
    case 'create_note_from_markdown_tree':
    case 'append_markdown_as_rem_tree':
    case 'create_or_replace_note_from_markdown':
      return safetyOptions(input).dryRun === true;
    case 'repair_note_design':
    case 'repair_card_set':
    case 'delete_rem_by_id':
      return input.dryRun !== false;
    case 'replace_rem':
      return input.dryRun === true;
    default:
      return false;
  }
}
