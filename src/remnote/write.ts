import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  AppendToRemArgs,
  AppendToRemResult,
  CreateRemArgs,
  CreateRemResult,
  DeleteRemArgs,
  DeleteRemResult,
  ReplaceRemArgs,
  ReplaceRemResult,
} from '../bridge/protocol';

const MAX_MARKDOWN_CHARS = 20000;

function normalizeMarkdown(markdown: string): string {
  const trimmed = markdown.trim();

  if (!trimmed) {
    throw new Error('Markdown payload is empty.');
  }

  if (trimmed.length > MAX_MARKDOWN_CHARS) {
    throw new Error(`Markdown payload exceeds ${MAX_MARKDOWN_CHARS} characters.`);
  }

  return trimmed;
}

export async function createRemFromMarkdown(
  plugin: RNPlugin,
  args: CreateRemArgs
): Promise<CreateRemResult> {
  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const createdRem = await plugin.rem.createWithMarkdown(markdown);

  if (!createdRem) {
    throw new Error('RemNote did not return a created Rem.');
  }

  if (parentId) {
    const parent = await plugin.rem.findOne(parentId);
    if (!parent) {
      throw new Error(`Parent Rem not found: ${parentId}`);
    }

    await createdRem.setParent(parent, 0);
  }

  return {
    remId: createdRem._id,
    parentId,
  };
}

export async function appendMarkdownToRem(
  plugin: RNPlugin,
  args: AppendToRemArgs
): Promise<AppendToRemResult> {
  const parent = await plugin.rem.findOne(args.remId);

  if (!parent) {
    throw new Error(`Target Rem not found: ${args.remId}`);
  }

  const createdRem = await createRemFromMarkdown(plugin, {
    parentId: parent._id,
    markdown: args.markdown,
  });

  return {
    remId: createdRem.remId,
    parentId: parent._id,
  };
}

export async function replaceRemMarkdown(
  plugin: RNPlugin,
  args: ReplaceRemArgs
): Promise<ReplaceRemResult> {
  const markdown = normalizeMarkdown(args.markdown);
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    throw new Error(`Target Rem not found: ${args.remId}`);
  }

  const richText = await plugin.richText.parseFromMarkdown(markdown);
  await rem.setText(richText);

  return {
    remId: rem._id,
  };
}

export async function deleteRem(plugin: RNPlugin, args: DeleteRemArgs): Promise<DeleteRemResult> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    throw new Error(`Target Rem not found: ${args.remId}`);
  }

  await rem.remove();

  return {
    remId: rem._id,
  };
}

