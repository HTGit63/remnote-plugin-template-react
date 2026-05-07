import type { Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type { SerializedRem } from '../bridge/protocol';

const DEFAULT_TREE_DEPTH = 0;
const HARD_MAX_TREE_DEPTH = 3;
const DEFAULT_MAX_CHILDREN = 25;
const DEFAULT_MAX_CHARS = 6000;
const MAX_BREADCRUMB_DEPTH = 12;

export interface SerializeRemOptions {
  depth?: number;
  maxChildren?: number;
  maxChars?: number;
}

interface SerializeState {
  seenRemIds: Set<string>;
}

export function clampTreeDepth(depth: number | undefined): number {
  if (typeof depth !== 'number' || Number.isNaN(depth)) {
    return DEFAULT_TREE_DEPTH;
  }

  return Math.min(Math.max(Math.floor(depth), 0), HARD_MAX_TREE_DEPTH);
}

function truncateText(value: string, maxChars: number): { text: string; truncated: boolean } {
  if (value.length <= maxChars) {
    return { text: value, truncated: false };
  }

  return {
    text: value.slice(0, Math.max(maxChars - 16, 0)).trimEnd(),
    truncated: true,
  };
}

async function richTextToString(plugin: RNPlugin, richText?: RichTextInterface): Promise<string> {
  if (!richText?.length) {
    return '';
  }

  return (await plugin.richText.toString(richText)).trim();
}

export async function getRemPlainText(plugin: RNPlugin, rem: Rem): Promise<{
  frontText: string;
  backText: string;
  plainText: string;
}> {
  const frontText = await richTextToString(plugin, rem.text);
  const backText = await richTextToString(plugin, rem.backText);
  const parts = [frontText, backText].filter(Boolean);

  return {
    frontText,
    backText,
    plainText: parts.join('\n\n'),
  };
}

export async function buildRemBreadcrumbs(plugin: RNPlugin, rem: Rem): Promise<string[]> {
  const breadcrumbs: string[] = [];
  const seen = new Set<string>();
  let current: Rem | undefined = rem;

  while (current && breadcrumbs.length < MAX_BREADCRUMB_DEPTH && !seen.has(current._id)) {
    seen.add(current._id);
    const text = await richTextToString(plugin, current.text);
    breadcrumbs.unshift(text || current._id);

    if (!current.parent) {
      break;
    }

    current = await plugin.rem.findOne(current.parent);
  }

  return breadcrumbs;
}

export async function serializeRem(
  plugin: RNPlugin,
  rem: Rem,
  options: SerializeRemOptions = {},
  state: SerializeState = { seenRemIds: new Set<string>() }
): Promise<SerializedRem> {
  const depth = clampTreeDepth(options.depth);
  const maxChildren = options.maxChildren ?? DEFAULT_MAX_CHILDREN;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const { frontText, backText, plainText } = await getRemPlainText(plugin, rem);
  const front = truncateText(frontText, maxChars);
  const back = truncateText(backText, maxChars);
  const plain = truncateText(plainText, maxChars);
  const hasChildren = rem.children.length > 0;
  const breadcrumbs = await buildRemBreadcrumbs(plugin, rem);
  const children: SerializedRem[] = [];
  let truncated = front.truncated || back.truncated || plain.truncated;

  if (depth > 0 && hasChildren && !state.seenRemIds.has(rem._id)) {
    state.seenRemIds.add(rem._id);
    const childRems = await rem.getChildrenRem();
    const limitedChildren = childRems.slice(0, maxChildren);
    truncated = truncated || childRems.length > limitedChildren.length;

    for (const child of limitedChildren) {
      children.push(
        await serializeRem(
          plugin,
          child,
          {
            ...options,
            depth: depth - 1,
          },
          state
        )
      );
    }
  }

  return {
    remId: rem._id,
    frontText: front.text,
    backText: back.text,
    plainText: plain.text,
    breadcrumbs,
    hasChildren,
    ...(children.length ? { children } : {}),
    ...(truncated ? { truncated: true } : {}),
  };
}

