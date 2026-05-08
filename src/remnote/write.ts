import type { Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  AppendToRemArgs,
  AppendToRemResult,
  BridgeErrorCode,
  CreateRemTreeArgs,
  CreateRemTreeNode,
  CreateRemTreeResult,
  CreateRemArgs,
  CreateRemResult,
  DeleteRemArgs,
  DeleteRemResult,
  MoveRemArgs,
  MoveRemResult,
  ReplaceRemArgs,
  ReplaceRemResult,
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
}> {
  const rem = await findRequiredRem(plugin, remId, label, code);
  const title = await runSdkOperation('richText.toString', () => plugin.richText.toString(rem.text));

  return {
    remId: rem._id,
    title: title.trim() || rem._id,
    hasChildren: rem.children.length > 0,
  };
}

export async function createRemFromMarkdown(
  plugin: RNPlugin,
  args: CreateRemArgs
): Promise<CreateRemResult> {
  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND') : null;
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const createdRem = await createRemWithRichText(
    plugin,
    richText,
    parent,
    parent ? parent.children.length : undefined
  );

  return {
    createdRemId: createdRem._id,
    parentId,
    status: 'created',
  };
}

export async function appendMarkdownToRem(
  plugin: RNPlugin,
  args: AppendToRemArgs
): Promise<AppendToRemResult> {
  const parent = await findRequiredRem(plugin, args.remId, 'Target');
  const markdown = normalizeMarkdown(args.markdown);
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const createdRem = await createRemWithRichText(
    plugin,
    richText,
    parent,
    getInsertIndex(parent, args.position ?? 'end')
  );

  return {
    targetRemId: parent._id,
    createdRemId: createdRem._id,
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
    const root = await createNode(tree, parent, parent.children.length);
    return {
      rootCreatedRemId: root._id,
      createdNodeCount: createdRemIds.length,
      createdRemIds,
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

export async function deleteRem(plugin: RNPlugin, args: DeleteRemArgs): Promise<DeleteRemResult> {
  if (args.confirmText !== 'DELETE') {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem requires confirmText "DELETE".');
  }

  const recursive = args.recursive ?? false;
  const rem = await findRequiredRem(plugin, args.remId, 'Target');

  if (rem.children.length > 0 && !recursive) {
    throw new RemnoteWriteError('SDK_UNSUPPORTED', 'Non-recursive delete of a Rem with children is not supported safely.', {
      remId: rem._id,
      childCount: rem.children.length,
    });
  }

  await runSdkOperation('rem.remove', () => rem.remove());

  return {
    deletedRemId: rem._id,
    recursive,
    status: 'deleted',
  };
}
