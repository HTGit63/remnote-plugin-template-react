import type {
  ApplyRemnoteCommandArgs,
  ApplyRemnoteCommandResult,
  ApplyStylePlanArgs,
  ApplyStylePlanResult,
  ApplyStructuredNoteBatchArgs,
  ApplyStructuredNoteBatchResult,
  AppendToRemArgs,
  AppendToRemResult,
  BridgeErrorCode,
  ClearRemFormattingArgs,
  CreateDocumentArgs,
  CreateDocumentResult,
  CreateFlashcardArgs,
  CreateFlashcardResult,
  CreateFolderArgs,
  CreateFolderResult,
  CreateListAnswerCardArgs,
  CreateMultipleChoiceCardArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreateOrReplaceNoteFromMarkdownResult,
  CreatePolishedNoteTreeArgs,
  CreatePolishedNoteTreeResult,
  CreateRemTreeArgs,
  CreateRemTreeNode,
  CreateRemTreeResult,
  CreateRemArgs,
  CreateRemResult,
  CreateClozeCardArgs,
  CreateStyledRemTreeArgs,
  CreateStyledRemTreeResult,
  DeletePreview,
  DeleteRemByIdArgs,
  DeleteRemByIdResult,
  DeleteRemByIdTarget,
  ExpectedStyleMapEntry,
  FormatRemResult,
  MoveRemArgs,
  MoveRemResult,
  PracticeDirection,
  ReplaceRemArgs,
  ReplaceRemResult,
  ReorderChildrenArgs,
  ReorderChildrenResult,
  RemColorName,
  RemnoteCommandName,
  RemHeadingLevel,
  RemStyleInput,
  RemTypeName,
  RichTextSpanInput,
  SetHideBulletArgs,
  SetRemHeadingLevelArgs,
  SetRemHighlightColorArgs,
  SetRemTextColorArgs,
  SetRemTypeArgs,
  SetTextSpanColorArgs,
  SetTextSpanHighlightArgs,
  StyledRemTreeNode,
  StyledRemTreeNodeType,
  UpdateRemArgs,
  UpdateRemRichArgs,
  UpdateRemResult,
  VerifyNoteDesignArgs,
  VerifyNoteDesignResult,
} from '../../../shared/bridge/protocol';
import { STRUCTURED_BATCH_CACHE_LIMIT } from './writeTypes';

export const STRUCTURED_BATCH_RESULT_CACHE = new Map<string, ApplyStructuredNoteBatchResult>();
export const REMNOTE_COMMAND_RESULT_CACHE = new Map<string, ApplyRemnoteCommandResult>();
export const STYLE_PLAN_RESULT_CACHE = new Map<string, ApplyStylePlanResult>();
export const STYLED_TREE_RESULT_CACHE = new Map<string, CreateStyledRemTreeResult>();
export const DELETE_BY_ID_RESULT_CACHE = new Map<string, DeleteRemByIdResult>();
export const POLISHED_TREE_RESULT_CACHE = new Map<string, CreatePolishedNoteTreeResult>();
export const MARKDOWN_IMPORT_RESULT_CACHE = new Map<string, CreateOrReplaceNoteFromMarkdownResult>();
export const CREATE_REM_RESULT_CACHE = new Map<string, CreateRemResult>();
export const CREATE_DOCUMENT_RESULT_CACHE = new Map<string, CreateDocumentResult>();
export const APPEND_RESULT_CACHE = new Map<string, AppendToRemResult>();
export const UPDATE_RESULT_CACHE = new Map<string, UpdateRemResult>();
export const UPDATE_RICH_RESULT_CACHE = new Map<string, FormatRemResult>();
export const MOVE_RESULT_CACHE = new Map<string, MoveRemResult>();
export const REORDER_RESULT_CACHE = new Map<string, ReorderChildrenResult>();
export const CREATE_TREE_RESULT_CACHE = new Map<string, CreateRemTreeResult>();
export const FLASHCARD_RESULT_CACHE = new Map<string, CreateFlashcardResult>();

export function getWriteIdempotencyKey(input: string | undefined, prefix: string): string {
  const trimmed = input?.trim();
  return trimmed || `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function rememberCachedResult<T>(cache: Map<string, T>, idempotencyKey: string, result: T) {
  cache.delete(idempotencyKey);
  cache.set(idempotencyKey, result);

  while (cache.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    cache.delete(oldestKey);
  }
}
