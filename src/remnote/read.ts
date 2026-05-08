import type { Rem, RNPlugin } from '@remnote/plugin-sdk';
import type {
  DetectedContentType,
  GetCurrentSelectionArgs,
  GetCurrentSelectionResult,
  GetRemArgs,
  GetRemRichArgs,
  GetRemRichResult,
  GetRemTreeArgs,
  SerializedRem,
} from '../bridge/protocol';
import { getRemPlainText, serializeRem } from './serialize';

const MAX_RICH_ARRAY_ITEMS = 200;
const MAX_RICH_STRING_CHARS = 2000;
const MAX_RICH_OBJECT_DEPTH = 5;
const REM_TYPE_CONCEPT = 1;
const REM_TYPE_DESCRIPTOR = 2;

export interface FocusedRemStatus {
  found: boolean;
  remId?: string;
  label: string;
  hasChildren?: boolean;
}

export async function refreshRem(plugin: RNPlugin, rem: Rem | undefined): Promise<Rem | undefined> {
  if (!rem?._id) {
    return undefined;
  }

  return (await plugin.rem.findOne(rem._id)) ?? rem;
}

export async function readFocusedRem(plugin: RNPlugin): Promise<SerializedRem | undefined> {
  const focusedRem = await plugin.focus.getFocusedRem();
  const rem = await refreshRem(plugin, focusedRem);

  if (!rem) {
    return undefined;
  }

  return serializeRem(plugin, rem);
}

export async function readRem(plugin: RNPlugin, args: GetRemArgs): Promise<SerializedRem | undefined> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    return undefined;
  }

  return serializeRem(plugin, rem);
}

export async function readRemTree(plugin: RNPlugin, args: GetRemTreeArgs): Promise<SerializedRem | undefined> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    return undefined;
  }

  return serializeRem(plugin, rem, { depth: args.depth });
}

function truncateRichString(value: string): string {
  if (value.length <= MAX_RICH_STRING_CHARS) {
    return value;
  }

  return `${value.slice(0, MAX_RICH_STRING_CHARS).trimEnd()}...`;
}

function normalizeRichValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_RICH_OBJECT_DEPTH) {
    return '[truncated]';
  }

  if (typeof value === 'string') {
    return truncateRichString(value);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_RICH_ARRAY_ITEMS).map((item) => normalizeRichValue(item, depth + 1));
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    normalized[key] = normalizeRichValue(item, depth + 1);
  }

  return normalized;
}

function normalizeRichArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeRichValue(value) as unknown[];
}

function detectRichTypes(value: unknown, types: Set<DetectedContentType>) {
  if (Array.isArray(value)) {
    for (const item of value) {
      detectRichTypes(item, types);
    }
    return;
  }

  if (typeof value !== 'object' || value === null) {
    return;
  }

  const record = value as Record<string, unknown>;
  if (record.i === 'x') {
    types.add(record.block ? 'math_block' : 'inline_math');
  }

  for (const item of Object.values(record)) {
    detectRichTypes(item, types);
  }
}

export async function readRemRich(
  plugin: RNPlugin,
  args: GetRemRichArgs
): Promise<GetRemRichResult | undefined> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    return undefined;
  }

  const { frontText, backText, plainText } = await getRemPlainText(plugin, rem);
  const detected = new Set<DetectedContentType>();

  if (plainText) {
    detected.add('plain_text');
  }

  if (rem.type === REM_TYPE_CONCEPT) {
    detected.add('concept');
  }

  if (rem.type === REM_TYPE_DESCRIPTOR) {
    detected.add('descriptor');
  }

  detectRichTypes(rem.text, detected);
  detectRichTypes(rem.backText, detected);

  return {
    remId: rem._id,
    frontText,
    backText,
    plainText,
    rich: {
      front: normalizeRichArray(rem.text),
      back: normalizeRichArray(rem.backText),
    },
    richSupported: true,
    detectedContentTypes: Array.from(detected),
  };
}

export async function getCurrentSelection(
  plugin: RNPlugin,
  _args: GetCurrentSelectionArgs
): Promise<GetCurrentSelectionResult> {
  let focusedRemId: string | null = null;

  try {
    const focusedRem = await plugin.focus.getFocusedRem();
    focusedRemId = focusedRem?._id ?? null;
  } catch {
    focusedRemId = null;
  }

  try {
    const selection = await plugin.editor.getSelection();

    if (!selection) {
      return {
        focusedRemId,
        selectedRemIds: focusedRemId ? [focusedRemId] : [],
        selectionSupported: true,
      };
    }

    if (selection.type === 'Rem') {
      return {
        focusedRemId,
        selectedRemIds: selection.remIds,
        selectionSupported: true,
      };
    }

    if (selection.type === 'Text') {
      return {
        focusedRemId,
        selectedRemIds: [selection.remId],
        selectionSupported: true,
      };
    }

    return {
      focusedRemId,
      selectedRemIds: [],
      selectionSupported: true,
    };
  } catch {
    return {
      focusedRemId,
      selectedRemIds: [],
      selectionSupported: false,
    };
  }
}

export async function getFocusedRemStatus(plugin: RNPlugin): Promise<FocusedRemStatus> {
  const focusedRem = await plugin.focus.getFocusedRem();
  const rem = await refreshRem(plugin, focusedRem);

  if (!rem) {
    return {
      found: false,
      label: 'No focused Rem',
    };
  }

  const serialized = await serializeRem(plugin, rem);

  return {
    found: true,
    remId: serialized.remId,
    label: serialized.frontText || serialized.remId,
    hasChildren: serialized.hasChildren,
  };
}
