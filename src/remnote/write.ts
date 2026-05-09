import type { Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  AppendToRemArgs,
  AppendToRemResult,
  BridgeErrorCode,
  CreateDocumentArgs,
  CreateDocumentResult,
  CreateFolderArgs,
  CreateFolderResult,
  CreateRemTreeArgs,
  CreateRemTreeNode,
  CreateRemTreeResult,
  CreateRemArgs,
  CreateRemResult,
  DeleteFocusedRemArgs,
  DeletePreview,
  DeleteRemArgs,
  DeleteRemResult,
  DeleteSelectedRemArgs,
  MoveRemArgs,
  MoveRemResult,
  ReplaceRemArgs,
  ReplaceRemResult,
  ReorderChildrenArgs,
  ReorderChildrenResult,
  UpdateRemArgs,
  UpdateRemResult,
} from '../bridge/protocol';

const MAX_MARKDOWN_CHARS = 20000;
export const CREATE_TREE_MAX_DEPTH = 5;
export const CREATE_TREE_MAX_NODES = 100;
export const CREATE_TREE_MAX_TITLE_LENGTH = 1000;

type ParentLookupCode = Extract<BridgeErrorCode, 'REM_NOT_FOUND' | 'PARENT_NOT_FOUND'>;

interface ValidatedTreeNode {
  title: string;
  children: ValidatedTreeNode[];
}

interface TreeValidationState {
  nodeCount: number;
}

export class RemnoteWriteError extends Error {
  constructor(
    readonly code: BridgeErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'RemnoteWriteError';
  }
}

function normalizeMarkdown(markdown: string): string {
  const trimmed = markdown.trim();

  if (!trimmed) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Markdown payload is empty.');
  }

  if (trimmed.length > MAX_MARKDOWN_CHARS) {
    throw new RemnoteWriteError('INVALID_ARGS', `Markdown payload exceeds ${MAX_MARKDOWN_CHARS} characters.`);
  }

  return trimmed;
}

function getSdkErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function runSdkOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    throw new RemnoteWriteError('SDK_ERROR', 'RemNote SDK operation failed.', {
      operation: operationName,
      sdkMessage: getSdkErrorMessage(error),
    });
  }
}

async function parseMarkdownToRichText(plugin: RNPlugin, markdown: string): Promise<RichTextInterface> {
  return runSdkOperation('richText.parseFromMarkdown', () =>
    plugin.richText.parseFromMarkdown(markdown)
  );
}

export async function findRequiredRem(
  plugin: RNPlugin,
  remId: string,
  label: 'Parent' | 'Target',
  code: ParentLookupCode = 'REM_NOT_FOUND'
): Promise<Rem> {
  let rem;
  try {
    rem = await plugin.rem.findOne(remId);
  } catch {
    throw new RemnoteWriteError(code, `${label} Rem was not found.`, {
      remId,
    });
  }

  if (!rem) {
    throw new RemnoteWriteError(code, `${label} Rem was not found.`, {
      remId,
    });
  }

  return rem;
}

async function createRemWithRichText(
  plugin: RNPlugin,
  richText: RichTextInterface,
  parent: Rem | null,
  positionAmongstSiblings?: number
): Promise<Rem> {
  const createdRem = await runSdkOperation('rem.createRem', () => plugin.rem.createRem());

  if (!createdRem) {
    throw new RemnoteWriteError('SDK_ERROR', 'RemNote did not return a created Rem.', {
      operation: 'rem.createRem',
    });
  }

  await runSdkOperation('rem.setText', () => createdRem.setText(richText));

  if (parent) {
    await runSdkOperation('rem.setParent', () =>
      createdRem.setParent(parent, positionAmongstSiblings)
    );
  }

  return createdRem;
}

function getInsertIndex(parent: Rem, position: 'start' | 'end' | undefined): number {
  return position === 'start' ? 0 : parent.children.length;
}

async function getFreshInsertIndex(
  plugin: RNPlugin,
  parent: Rem,
  position: 'start' | 'end' | undefined
): Promise<number> {
  if (position === 'start') {
    return 0;
  }

  const refreshedParent = await findRequiredRem(plugin, parent._id, 'Parent', 'PARENT_NOT_FOUND');
  return getInsertIndex(refreshedParent, 'end');
}

function validateTreeNode(
  rawNode: unknown,
  depth: number,
  state: TreeValidationState
): ValidatedTreeNode {
  if (typeof rawNode !== 'object' || rawNode === null || Array.isArray(rawNode)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Tree node must be an object.');
  }

  if (depth > CREATE_TREE_MAX_DEPTH) {
    throw new RemnoteWriteError('INVALID_ARGS', `Tree depth exceeds ${CREATE_TREE_MAX_DEPTH}.`);
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
  if (state.nodeCount > CREATE_TREE_MAX_NODES) {
    throw new RemnoteWriteError('INVALID_ARGS', `Tree node count exceeds ${CREATE_TREE_MAX_NODES}.`);
  }

  const rawChildren = node.children ?? [];
  if (!Array.isArray(rawChildren)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Tree node children must be an array.');
  }

  return {
    title,
    children: rawChildren.map((child) => validateTreeNode(child, depth + 1, state)),
  };
}

async function assertNewParentIsNotDescendant(plugin: RNPlugin, rem: Rem, newParent: Rem) {
  if (rem._id === newParent._id) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Cannot move a Rem into itself.', {
      remId: rem._id,
    });
  }

  const seen = new Set<string>();
  let current: Rem | undefined = newParent;

  while (current && !seen.has(current._id)) {
    seen.add(current._id);

    if (current._id === rem._id) {
      throw new RemnoteWriteError('INVALID_ARGS', 'Cannot move a Rem into its descendant.', {
        remId: rem._id,
        newParentId: newParent._id,
      });
    }

    if (!current.parent) {
      return;
    }

    current = await plugin.rem.findOne(current.parent);
  }
}

export async function getRemApprovalContext(
  plugin: RNPlugin,
  remId: string,
  label: 'Parent' | 'Target' = 'Target',
  code: ParentLookupCode = 'REM_NOT_FOUND'
): Promise<{
  remId: string;
  title: string;
  hasChildren: boolean;
  childCount: number;
}> {
  const rem = await findRequiredRem(plugin, remId, label, code);
  const title = await runSdkOperation('richText.toString', () => plugin.richText.toString(rem.text));

  return {
    remId: rem._id,
    title: title.trim() || rem._id,
    hasChildren: rem.children.length > 0,
    childCount: rem.children.length,
  };
}

async function getRemTitle(plugin: RNPlugin, rem: Rem): Promise<string> {
  const title = await runSdkOperation('richText.toString', () => plugin.richText.toString(rem.text));
  return title.trim() || rem._id;
}

export async function createRemFromMarkdown(
  plugin: RNPlugin,
  args: CreateRemArgs
): Promise<CreateRemResult> {
  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND') : null;
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const insertIndex = parent ? await getFreshInsertIndex(plugin, parent, 'end') : undefined;
  const createdRem = await createRemWithRichText(
    plugin,
    richText,
    parent,
    insertIndex
  );

  return {
    createdRemId: createdRem._id,
    parentId,
    ...(insertIndex !== undefined ? { insertIndex, insertPosition: 'end' as const } : {}),
    status: 'created',
  };
}

export async function createDocumentFromMarkdown(
  plugin: RNPlugin,
  args: CreateDocumentArgs
): Promise<CreateDocumentResult> {
  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND') : null;
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const insertIndex = parent ? await getFreshInsertIndex(plugin, parent, 'end') : undefined;
  const createdRem = await createRemWithRichText(plugin, richText, parent, insertIndex);

  await runSdkOperation('rem.setIsDocument', () => createdRem.setIsDocument(true));

  return {
    createdRemId: createdRem._id,
    parentId,
    ...(insertIndex !== undefined ? { insertIndex, insertPosition: 'end' as const } : {}),
    document: true,
    status: 'created_document',
  };
}

export async function createFolderFromMarkdown(
  _plugin: RNPlugin,
  _args: CreateFolderArgs
): Promise<CreateFolderResult> {
  throw new RemnoteWriteError(
    'SDK_UNSUPPORTED',
    'Folder creation is not exposed by the installed @remnote/plugin-sdk typings. Document creation is supported through setIsDocument(true).'
  );
}

export async function appendMarkdownToRem(
  plugin: RNPlugin,
  args: AppendToRemArgs
): Promise<AppendToRemResult> {
  const parent = await findRequiredRem(plugin, args.remId, 'Target');
  const markdown = normalizeMarkdown(args.markdown);
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const insertIndex = await getFreshInsertIndex(plugin, parent, args.position ?? 'end');
  const createdRem = await createRemWithRichText(
    plugin,
    richText,
    parent,
    insertIndex
  );

  return {
    targetRemId: parent._id,
    createdRemId: createdRem._id,
    insertIndex,
    position: args.position ?? 'end',
    status: 'appended',
  };
}

export async function updateRemMarkdown(
  plugin: RNPlugin,
  args: UpdateRemArgs
): Promise<UpdateRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const markdown = normalizeMarkdown(args.markdown);
  const richText = await parseMarkdownToRichText(plugin, markdown);

  await runSdkOperation('rem.setText', () => rem.setText(richText));

  return {
    updatedRemId: rem._id,
    status: 'updated',
  };
}

export async function moveRem(plugin: RNPlugin, args: MoveRemArgs): Promise<MoveRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const newParent = await findRequiredRem(plugin, args.newParentId, 'Parent', 'PARENT_NOT_FOUND');

  await assertNewParentIsNotDescendant(plugin, rem, newParent);

  const sameParent = rem.parent === newParent._id;
  const maxIndex = sameParent ? Math.max(newParent.children.length - 1, 0) : newParent.children.length;
  if (args.index > maxIndex) {
    throw new RemnoteWriteError('INVALID_ARGS', 'index is outside the target parent child range.', {
      index: args.index,
      maxIndex,
    });
  }

  await runSdkOperation('rem.setParent', () => rem.setParent(newParent, args.index));

  return {
    movedRemId: rem._id,
    newParentId: newParent._id,
    index: args.index,
    status: 'moved',
  };
}

export async function reorderChildren(
  plugin: RNPlugin,
  args: ReorderChildrenArgs
): Promise<ReorderChildrenResult> {
  const parent = await findRequiredRem(plugin, args.parentRemId, 'Parent', 'PARENT_NOT_FOUND');
  const currentChildren = await runSdkOperation('rem.getChildrenRem', () => parent.getChildrenRem());
  const currentIds = currentChildren.map((child) => child._id);
  const requestedIds = args.orderedChildRemIds;
  const currentSet = new Set(currentIds);
  const requestedSet = new Set(requestedIds);

  if (requestedSet.size !== requestedIds.length) {
    throw new RemnoteWriteError('INVALID_ARGS', 'orderedChildRemIds contains duplicate Rem IDs.');
  }

  const missingIds = currentIds.filter((id) => !requestedSet.has(id));
  const extraIds = requestedIds.filter((id) => !currentSet.has(id));
  if (missingIds.length > 0 || extraIds.length > 0) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'orderedChildRemIds must contain exactly the current direct child IDs.',
      {
        parentRemId: parent._id,
        missingIds,
        extraIds,
      }
    );
  }

  const childrenById = new Map(currentChildren.map((child) => [child._id, child]));
  for (let index = 0; index < requestedIds.length; index += 1) {
    const child = childrenById.get(requestedIds[index]);
    if (!child) {
      throw new RemnoteWriteError('REM_NOT_FOUND', 'Child Rem was not found during reorder.', {
        remId: requestedIds[index],
      });
    }

    await runSdkOperation('rem.setParent', () => child.setParent(parent, index));
  }

  return {
    parentRemId: parent._id,
    orderedChildRemIds: requestedIds,
    status: 'reordered',
  };
}

export async function createRemTree(
  plugin: RNPlugin,
  args: CreateRemTreeArgs
): Promise<CreateRemTreeResult> {
  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const validationState: TreeValidationState = { nodeCount: 0 };
  const tree = validateTreeNode(args.tree, 1, validationState);
  const createdRemIds: string[] = [];

  async function createNode(node: ValidatedTreeNode, nodeParent: Rem, index: number): Promise<Rem> {
    const richText = await parseMarkdownToRichText(plugin, node.title);
    const created = await createRemWithRichText(plugin, richText, nodeParent, index);
    createdRemIds.push(created._id);

    for (let childIndex = 0; childIndex < node.children.length; childIndex += 1) {
      await createNode(node.children[childIndex], created, childIndex);
    }

    return created;
  }

  try {
    const rootInsertIndex = await getFreshInsertIndex(plugin, parent, 'end');
    const root = await createNode(tree, parent, rootInsertIndex);
    return {
      rootCreatedRemId: root._id,
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      rootInsertIndex,
      status: 'created_tree',
    };
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      throw new RemnoteWriteError(error.code, error.message, {
        originalDetails: error.details,
        createdNodeCount: createdRemIds.length,
        createdRemIds,
      });
    }

    throw new RemnoteWriteError('SDK_ERROR', 'RemNote tree creation failed.', {
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      sdkMessage: getSdkErrorMessage(error),
    });
  }
}

export async function replaceRemMarkdown(
  plugin: RNPlugin,
  args: ReplaceRemArgs
): Promise<ReplaceRemResult> {
  const updated = await updateRemMarkdown(plugin, args);

  return {
    remId: updated.updatedRemId,
  };
}

export async function buildDeletePreview(
  plugin: RNPlugin,
  remId: string,
  recursive: boolean
): Promise<DeletePreview> {
  const rem = await findRequiredRem(plugin, remId, 'Target');
  const parent = await runSdkOperation('rem.getParentRem', () => rem.getParentRem());
  const descendants = recursive
    ? await runSdkOperation('rem.getDescendants', () => rem.getDescendants())
    : [];

  return {
    targetRemId: rem._id,
    targetTitle: await getRemTitle(plugin, rem),
    parentRemId: parent?._id ?? null,
    parentTitle: parent ? await getRemTitle(plugin, parent) : null,
    childCount: rem.children.length,
    descendantCount: descendants.length,
    recursive,
    requiresConfirmText: 'DELETE',
  };
}

async function deleteRemById(
  plugin: RNPlugin,
  remId: string,
  args: Pick<DeleteRemArgs, 'recursive' | 'confirmText'>
): Promise<DeleteRemResult> {
  if (args.confirmText !== 'DELETE') {
    throw new RemnoteWriteError('INVALID_ARGS', 'Delete requires confirmText "DELETE".');
  }

  const recursive = args.recursive ?? false;
  const preview = await buildDeletePreview(plugin, remId, recursive);
  const rem = await findRequiredRem(plugin, remId, 'Target');

  if (preview.childCount > 0 && !recursive) {
    throw new RemnoteWriteError('SDK_UNSUPPORTED', 'Non-recursive delete of a Rem with children is not supported safely.', {
      remId: preview.targetRemId,
      childCount: preview.childCount,
    });
  }

  await runSdkOperation('rem.remove', () => rem.remove());

  return {
    deletedRemId: rem._id,
    recursive,
    preview,
    status: 'deleted',
  };
}

export async function deleteRem(plugin: RNPlugin, args: DeleteRemArgs): Promise<DeleteRemResult> {
  return deleteRemById(plugin, args.remId, args);
}

export async function deleteFocusedRem(
  plugin: RNPlugin,
  args: DeleteFocusedRemArgs
): Promise<DeleteRemResult> {
  const focusedRem = await plugin.focus.getFocusedRem();
  if (!focusedRem) {
    throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
  }

  return deleteRemById(plugin, focusedRem._id, args);
}

export async function deleteSelectedRem(
  plugin: RNPlugin,
  args: DeleteSelectedRemArgs
): Promise<DeleteRemResult> {
  const selection = await plugin.editor.getSelection();
  const selectedRemIds =
    selection?.type === 'Rem'
      ? selection.remIds
      : selection?.type === 'Text'
        ? [selection.remId]
        : [];

  if (selectedRemIds.length !== 1) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'delete_selected_rem requires exactly one selected Rem.',
      {
        selectedRemCount: selectedRemIds.length,
      }
    );
  }

  return deleteRemById(plugin, selectedRemIds[0], args);
}
