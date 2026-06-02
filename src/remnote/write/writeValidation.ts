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
import { RemnoteWriteError } from './writeErrors';
import {
  CREATE_TREE_DEFAULT_MAX_DEPTH,
  CREATE_TREE_DEFAULT_MAX_NODES,
  CREATE_TREE_MAX_DEPTH,
  CREATE_TREE_MAX_NODES,
  CREATE_TREE_MAX_TITLE_LENGTH,
  MAX_MARKDOWN_CHARS,
  type TreeValidationState,
  type ValidatedTreeNode,
} from './writeTypes';
import { normalizeRemStyleInput } from './remnoteSdkHelpers';

export function normalizeMarkdown(markdown: string): string {
  const trimmed = markdown.trim();

  if (!trimmed) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Markdown payload is empty.');
  }

  if (trimmed.length > MAX_MARKDOWN_CHARS) {
    throw new RemnoteWriteError('INVALID_ARGS', `Markdown payload exceeds ${MAX_MARKDOWN_CHARS} characters.`);
  }

  return trimmed;
}

export function validateTreeNode(
  rawNode: unknown,
  depth: number,
  state: TreeValidationState,
  path = 'root'
): ValidatedTreeNode {
  if (typeof rawNode !== 'object' || rawNode === null || Array.isArray(rawNode)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Tree node must be an object.');
  }

  if (depth > CREATE_TREE_MAX_DEPTH) {
    throw new RemnoteWriteError('INVALID_ARGS', `Tree depth exceeds ${CREATE_TREE_MAX_DEPTH}.`, {
      actualDepth: depth,
      maxDepth: CREATE_TREE_MAX_DEPTH,
      path,
    });
  }

  const node = rawNode as Partial<CreateRemTreeNode>;
  if (typeof node.title !== 'string' || !node.title.trim()) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Tree node title is required.');
  }

  const title = node.title.trim();
  if (title.length > CREATE_TREE_MAX_TITLE_LENGTH) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      `Tree node title exceeds ${CREATE_TREE_MAX_TITLE_LENGTH} characters.`
    );
  }

  state.nodeCount += 1;
  if (depth > (state.maxDepthSeen ?? 0)) {
    state.maxDepthSeen = depth;
    state.maxDepthPath = path;
    state.maxDepthTitle = title;
  }
  if (state.nodeCount > CREATE_TREE_MAX_NODES) {
    throw new RemnoteWriteError('INVALID_ARGS', `Tree node count exceeds ${CREATE_TREE_MAX_NODES}.`, {
      actualNodeCount: state.nodeCount,
      maxNodeCount: CREATE_TREE_MAX_NODES,
      path,
      title,
    });
  }

  const rawChildren = node.children ?? [];
  if (!Array.isArray(rawChildren)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Tree node children must be an array.');
  }

  return {
    title,
    children: rawChildren.map((child, index) => validateTreeNode(child, depth + 1, state, `${path}.children[${index}]`)),
  };
}

export function simpleTreeToStyledNode(node: ValidatedTreeNode): StyledRemTreeNode {
  return {
    type: 'rem',
    text: node.title,
    children: node.children.map((child) => simpleTreeToStyledNode(child)),
  };
}


export function normalizeStyledNode(
  rawNode: StyledRemTreeNode,
  depth: number,
  state: TreeValidationState,
  path = 'root'
): StyledRemTreeNode {
  if (typeof rawNode !== 'object' || rawNode === null || Array.isArray(rawNode)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Styled tree node must be an object.');
  }

  if (depth > CREATE_TREE_MAX_DEPTH) {
    throw new RemnoteWriteError('INVALID_ARGS', `Styled tree depth exceeds ${CREATE_TREE_MAX_DEPTH}.`, {
      actualDepth: depth,
      maxDepth: CREATE_TREE_MAX_DEPTH,
      path,
      title: rawNode.text ?? rawNode.title ?? rawNode.latex ?? rawNode.type,
    });
  }

  state.nodeCount += 1;
  const title = rawNode.text ?? rawNode.title ?? rawNode.latex ?? rawNode.front ?? rawNode.type ?? 'rem';
  if (depth > (state.maxDepthSeen ?? 0)) {
    state.maxDepthSeen = depth;
    state.maxDepthPath = path;
    state.maxDepthTitle = title;
  }
  if (state.nodeCount > CREATE_TREE_MAX_NODES) {
    throw new RemnoteWriteError('INVALID_ARGS', `Styled tree node count exceeds ${CREATE_TREE_MAX_NODES}.`, {
      actualNodeCount: state.nodeCount,
      maxNodeCount: CREATE_TREE_MAX_NODES,
      path,
      title,
    });
  }

  const children = rawNode.children ?? [];
  if (!Array.isArray(children)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Styled tree node children must be an array.');
  }

  return {
    ...rawNode,
    style: normalizeRemStyleInput(rawNode.style),
    children: children.map((child, index) => normalizeStyledNode(child, depth + 1, state, `${path}.children[${index}]`)),
  };
}

export function assertTreeLimits(
  state: TreeValidationState,
  limits: { maxDepth?: number; maxNodeCount?: number },
  label: string
) {
  const maxDepth = limits.maxDepth ?? CREATE_TREE_DEFAULT_MAX_DEPTH;
  const maxNodeCount = limits.maxNodeCount ?? CREATE_TREE_DEFAULT_MAX_NODES;
  if ((state.maxDepthSeen ?? 0) > maxDepth) {
    throw new RemnoteWriteError('INVALID_ARGS', `${label} depth exceeds requested maxDepth.`, {
      maxDepth,
      actualDepth: state.maxDepthSeen ?? 0,
      path: state.maxDepthPath,
      title: state.maxDepthTitle,
    });
  }

  if (state.nodeCount > maxNodeCount) {
    throw new RemnoteWriteError('INVALID_ARGS', `${label} node count exceeds requested maxNodeCount.`, {
      maxNodeCount,
      actualNodeCount: state.nodeCount,
      path: state.maxDepthPath,
      title: state.maxDepthTitle,
    });
  }
}

export function collectStyledTreePlan(node: StyledRemTreeNode, depth = 0, outline: string[] = []) {
  const type: StyledRemTreeNodeType = node.type ?? 'rem';
  const children = node.children ?? [];
  let styleOperationCount = node.style ? Object.keys(node.style).filter((key) => (node.style as Record<string, unknown>)[key] !== undefined).length : 0;
  let mathNodeCount = type === 'inlineMath' || type === 'mathBlock' || Boolean(node.richText?.some((span) => span.type === 'inlineMath' || span.type === 'mathBlock' || span.latex)) ? 1 : 0;
  let cardNodeCount = type.endsWith('Card') ? 1 : 0;
  const label = node.text ?? node.title ?? node.front ?? node.latex ?? type;
  outline.push(`${'  '.repeat(depth)}- [${type}] ${label}`.slice(0, 240));

  for (const child of children) {
    const childStats = collectStyledTreePlan(child, depth + 1, outline);
    styleOperationCount += childStats.styleOperationCount;
    mathNodeCount += childStats.mathNodeCount;
    cardNodeCount += childStats.cardNodeCount;
  }

  return {
    styleOperationCount,
    mathNodeCount,
    cardNodeCount,
    previewOutline: outline,
  };
}

