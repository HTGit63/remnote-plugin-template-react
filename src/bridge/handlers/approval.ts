import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  BridgeRequest,
  PendingApprovalRequest,
  ApprovalResolution,
  AppendToRemArgs,
  MoveRemArgs,
  CreateRemArgs,
  CreateDocumentArgs,
  CreateFolderArgs,
  CreateRemTreeArgs,
  CreateStyledRemTreeArgs,
  CreatePolishedNoteTreeArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  ApplyRemnoteCommandArgs,
  ApplyStructuredNoteBatchArgs,
  CreateFlashcardArgs,
  CreateClozeCardArgs,
  CreateMultipleChoiceCardArgs,
  CreateListAnswerCardArgs,
  DeleteRemByIdArgs,
} from '../../../shared/bridge/protocol';
import { buildDeletePreview, getRemApprovalContext } from '../../remnote/write';
import type { BridgeHandlerContext } from '../handlers';

export async function withApprovalTimeout(
  request: PendingApprovalRequest,
  approve: (request: PendingApprovalRequest) => Promise<ApprovalResolution>,
  timeoutMs: number
): Promise<ApprovalResolution> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ApprovalResolution>((resolve) => {
    timeoutId = setTimeout(() => resolve('APPROVAL_TIMEOUT'), timeoutMs);
  });

  const result = await Promise.race([approve(request), timeout]);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  return result;
}

export function approvalSummary(request: BridgeRequest): string {
  switch (request.tool) {
    case 'create_rem':
      return 'Create one Rem from markdown.';
    case 'create_document':
      return 'Create one document Rem from markdown.';
    case 'create_folder':
      return 'Create one folder if the SDK supports folders.';
    case 'append_to_rem':
      return `Append one child Rem at ${(request.args as AppendToRemArgs).position ?? 'end'}.`;
    case 'update_rem':
      return 'Replace target Rem text. Children stay untouched.';
    case 'move_rem':
      return `Move Rem to index ${(request.args as MoveRemArgs).index}.`;
    case 'reorder_children':
      return 'Reorder one parent Rem child list.';
    case 'create_rem_tree':
      return 'Create structured Rem tree from JSON.';
    case 'update_rem_rich':
      return 'Replace target Rem with structured rich text.';
    case 'set_rem_heading_level':
      return 'Apply a RemNote heading level.';
    case 'set_rem_text_color':
      return 'Apply whole-Rem text color.';
    case 'set_rem_highlight_color':
      return 'Apply whole-Rem highlight color.';
    case 'set_text_span_color':
      return 'Apply partial text color.';
    case 'set_text_span_highlight':
      return 'Apply partial text highlight.';
    case 'set_rem_type':
      return 'Set Rem type.';
    case 'set_hide_bullet':
      return 'Toggle Rem bullet visibility.';
    case 'clear_rem_formatting':
      return 'Clear visible text formatting.';
    case 'create_styled_rem_tree':
      return 'Create styled nested Rem tree.';
    case 'apply_remnote_command':
      return `Apply RemNote command ${(request.args as ApplyRemnoteCommandArgs).command}.`;
    case 'apply_structured_note_batch':
      return 'Apply one structured note batch with optional dry-run, rollback, and verification.';
    case 'create_polished_note_tree':
      return 'Create a polished RemNote note tree in one call.';
    case 'create_or_replace_note_from_markdown':
      return `Import full Markdown note with mode ${(request.args as CreateOrReplaceNoteFromMarkdownArgs).mode ?? 'create_child'}.`;
    case 'apply_style_plan':
      return 'Apply a multi-operation style plan.';
    case 'verify_note_design':
      return 'Verify a RemNote design/style map.';
    case 'create_basic_flashcard':
      return 'Create a basic flashcard.';
    case 'create_concept_card':
      return 'Create a concept card.';
    case 'create_descriptor_card':
      return 'Create a descriptor card.';
    case 'create_cloze_card':
      return 'Create a cloze card.';
    case 'create_multiple_choice_card':
      return 'Create a multiple-choice card.';
    case 'create_list_answer_card':
      return 'Create a list-answer card.';
    case 'replace_rem':
      return 'Replace target Rem text.';
    case 'delete_rem_by_id':
      return 'Safely delete target Rem by explicit ID and guard.';
    default:
      return 'Run RemNote bridge request.';
  }
}

// Inline getter functions to keep this module decoupled
function getRequestTargetRemId(request: BridgeRequest): string | undefined {
  const args = request.args as Record<string, unknown>;
  if (typeof args.remId === 'string') {
    return args.remId;
  }
  if (typeof args.parentRemId === 'string') {
    return args.parentRemId;
  }
  if (typeof args.rootRemId === 'string') {
    return args.rootRemId;
  }
  if (typeof args.target === 'object' && args.target && 'remId' in args.target && typeof (args.target as any).remId === 'string') {
    return (args.target as any).remId;
  }
  if (typeof args.target === 'object' && args.target && 'parentId' in args.target && typeof (args.target as any).parentId === 'string') {
    return (args.target as any).parentId;
  }
  return typeof args.parentId === 'string' ? args.parentId : undefined;
}

function getRequestPreviewMarkdown(request: BridgeRequest): string | undefined {
  const args = request.args as any;
  if (typeof args.markdown === 'string') {
    return args.markdown.slice(0, 3000);
  }
  if (typeof args.markdownText === 'string') {
    return args.markdownText.slice(0, 3000);
  }
  if (typeof args.front === 'string' || typeof args.back === 'string') {
    return `Front: ${args.front ?? ''}\nBack: ${args.back ?? ''}`.slice(0, 3000);
  }
  if (typeof args.text === 'string') {
    return args.text.slice(0, 3000);
  }
  if (typeof args.question === 'string') {
    return `Question: ${args.question}\nChoices: ${(args.choices ?? []).join(', ')}`.slice(0, 3000);
  }
  if (typeof args.prompt === 'string') {
    return `Prompt: ${args.prompt}\nItems: ${(args.items ?? []).join(', ')}`.slice(0, 3000);
  }
  if (args.richText || args.tree) {
    return JSON.stringify(args.richText ?? args.tree, null, 2).slice(0, 3000);
  }
  if (args.operations) {
    return JSON.stringify(args.operations, null, 2).slice(0, 3000);
  }
  if (args.root) {
    return JSON.stringify(args.root, null, 2).slice(0, 3000);
  }
  if (args.note) {
    return JSON.stringify(args.note, null, 2).slice(0, 3000);
  }
  if ('command' in args && typeof args.command === 'string') {
    return JSON.stringify({ command: args.command, args: args.args }, null, 2).slice(0, 3000);
  }
  return undefined;
}

export async function buildApprovalRequest(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext,
  timeoutMs: number,
  destructive: boolean
): Promise<PendingApprovalRequest> {
  const targetRemId = getRequestTargetRemId(request) ?? undefined;
  const deletePreview =
    targetRemId &&
    request.tool === 'delete_rem_by_id'
      ? await buildDeletePreview(plugin, targetRemId, true)
      : undefined;
  const target =
    deletePreview
      ? undefined
      : targetRemId && (request.tool === 'create_rem' || request.tool === 'create_document' || request.tool === 'create_folder' || request.tool === 'create_rem_tree')
      ? await getRemApprovalContext(plugin, targetRemId, 'Parent', 'PARENT_NOT_FOUND')
      : targetRemId &&
          (request.tool === 'create_styled_rem_tree' ||
            request.tool === 'create_polished_note_tree' ||
            request.tool === 'create_or_replace_note_from_markdown' ||
            request.tool === 'apply_style_plan' ||
            request.tool === 'apply_remnote_command' ||
            request.tool === 'apply_structured_note_batch' ||
            request.tool === 'create_basic_flashcard' ||
            request.tool === 'create_concept_card' ||
            request.tool === 'create_descriptor_card' ||
            request.tool === 'create_cloze_card' ||
            request.tool === 'create_multiple_choice_card' ||
            request.tool === 'create_list_answer_card')
        ? await getRemApprovalContext(plugin, targetRemId, 'Parent', 'PARENT_NOT_FOUND')
      : targetRemId
        ? await getRemApprovalContext(plugin, targetRemId)
        : undefined;
  const hasChildren = deletePreview ? deletePreview.childCount > 0 : target?.hasChildren;
  const deadline = new Date(Date.now() + timeoutMs).toISOString();
  let warning: string | undefined;

  if (request.tool === 'delete_rem_by_id') {
    warning = deletePreview?.recursive
      ? `Recursive delete removes ${deletePreview.descendantCount} descendants.`
      : hasChildren
        ? 'This Rem has children. Non-recursive delete is blocked.'
        : 'Delete permanently removes the target Rem.';
  } else if (request.tool === 'move_rem' && hasChildren) {
    warning = `This move request moves a Rem with ${target?.childCount ?? 0} direct children.`;
  } else if (request.tool === 'replace_rem') {
    warning = 'This replace request overwrites the visible text of the target Rem.';
  } else if (request.tool === 'update_rem') {
    warning = 'This update replaces the visible text of the target Rem.';
  }

  return {
    id: request.id,
    tool: request.tool,
    args: request.args,
    permissionMode: context.permissionMode,
    permissionScope: context.permissionScope,
    requestedAt: new Date().toISOString(),
    timeoutDeadline: deadline,
    targetRemId,
    targetTitle: deletePreview?.targetTitle ?? target?.title,
    hasChildren,
    previewMarkdown: getRequestPreviewMarkdown(request),
    riskLevel: destructive ? 'destructive' : 'safe_write',
    summary: approvalSummary(request),
    ...(warning ? { warning } : {}),
    ...(deletePreview ? { confirmTextRequired: 'DELETE' as const, deletePreview } : {}),
  };
}

export async function shouldForceApproval(_plugin: RNPlugin, request: BridgeRequest): Promise<boolean> {
  switch (request.tool) {
    case 'create_rem':
    case 'create_document':
    case 'create_folder':
      return Boolean((request.args as CreateRemArgs | CreateDocumentArgs | CreateFolderArgs).parentId);
    case 'apply_structured_note_batch':
      return !(request.args as ApplyStructuredNoteBatchArgs).dryRun;
    case 'create_or_replace_note_from_markdown':
      return (request.args as CreateOrReplaceNoteFromMarkdownArgs).safetyOptions?.dryRun !== true;
    case 'append_to_rem':
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
    case 'create_basic_flashcard':
    case 'create_polished_note_tree':
    case 'apply_style_plan':
    case 'create_concept_card':
    case 'create_descriptor_card':
    case 'create_cloze_card':
    case 'create_multiple_choice_card':
    case 'create_list_answer_card':
      return true;
    default:
      return false;
  }
}
