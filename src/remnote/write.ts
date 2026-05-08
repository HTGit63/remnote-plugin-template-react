import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  AppendToRemArgs,
  AppendToRemResult,
  BridgeErrorCode,
  CreateRemArgs,
  CreateRemResult,
  DeleteRemArgs,
  DeleteRemResult,
  ReplaceRemArgs,
  ReplaceRemResult,
} from '../bridge/protocol';

const MAX_MARKDOWN_CHARS = 20000;

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

async function findRequiredRem(plugin: RNPlugin, remId: string, label: 'Parent' | 'Target') {
  let rem;
  try {
    rem = await plugin.rem.findOne(remId);
  } catch {
    throw new RemnoteWriteError('REM_NOT_FOUND', `${label} Rem was not found.`, {
      remId,
    });
  }

  if (!rem) {
    throw new RemnoteWriteError('REM_NOT_FOUND', `${label} Rem was not found.`, {
      remId,
    });
  }

  return rem;
}

export async function createRemFromMarkdown(
  plugin: RNPlugin,
  args: CreateRemArgs
): Promise<CreateRemResult> {
  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent') : null;
  const richText = await runSdkOperation('richText.parseFromMarkdown', () =>
    plugin.richText.parseFromMarkdown(markdown)
  );
  const createdRem = await runSdkOperation('rem.createRem', () => plugin.rem.createRem());

  if (!createdRem) {
    throw new RemnoteWriteError('SDK_ERROR', 'RemNote did not return a created Rem.', {
      operation: 'rem.createRem',
    });
  }

  await runSdkOperation('rem.setText', () => createdRem.setText(richText));

  if (parent) {
    await runSdkOperation('rem.setParent', () => createdRem.setParent(parent, 0));
  }

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

  const createdRem = await createRemFromMarkdown(plugin, {
    parentId: parent._id,
    markdown: args.markdown,
  });

  return {
    targetRemId: parent._id,
    createdRemId: createdRem.createdRemId,
    status: 'appended',
  };
}

export async function replaceRemMarkdown(
  plugin: RNPlugin,
  args: ReplaceRemArgs
): Promise<ReplaceRemResult> {
  const markdown = normalizeMarkdown(args.markdown);
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    throw new RemnoteWriteError('REM_NOT_FOUND', 'Target Rem was not found.', {
      remId: args.remId,
    });
  }

  const richText = await runSdkOperation('richText.parseFromMarkdown', () =>
    plugin.richText.parseFromMarkdown(markdown)
  );
  await runSdkOperation('rem.setText', () => rem.setText(richText));

  return {
    remId: rem._id,
  };
}

export async function deleteRem(plugin: RNPlugin, args: DeleteRemArgs): Promise<DeleteRemResult> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    throw new RemnoteWriteError('REM_NOT_FOUND', 'Target Rem was not found.', {
      remId: args.remId,
    });
  }

  await runSdkOperation('rem.remove', () => rem.remove());

  return {
    remId: rem._id,
  };
}
