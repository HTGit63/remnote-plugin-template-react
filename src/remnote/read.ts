import type { Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  DetectedContentType,
  GetChildrenArgs,
  GetChildrenResult,
  GetCurrentSelectionArgs,
  GetCurrentSelectionResult,
  DebugGetRawRichTextArgs,
  DebugGetRawRichTextResult,
  GetDocumentOrFolderTreeArgs,
  GetDocumentOrFolderTreeResult,
  GetRemArgs,
  GetRemBreadcrumbsArgs,
  GetRemBreadcrumbsResult,
  GetRemRichArgs,
  GetRemRichResult,
  GetRemTreeArgs,
  RemChildSummary,
  RemColorName,
  RemHeadingLevel,
  RemTypeName,
  RichTextSpanInput,
  RemStructureType,
  SearchRemsArgs,
  SearchRemsResult,
  SerializedRem,
} from '../bridge/protocol';
import { buildRemBreadcrumbs, getRemPlainText, serializeRem } from './serialize';

const MAX_RICH_ARRAY_ITEMS = 200;
const MAX_RICH_STRING_CHARS = 2000;
const MAX_RICH_OBJECT_DEPTH = 5;
const REM_TYPE_CONCEPT = 1;
const REM_TYPE_DESCRIPTOR = 2;
const DEFAULT_CHILD_LIMIT = 25;
const MAX_CHILD_LIMIT = 100;
const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 25;
const MAX_SUMMARY_TITLE_CHARS = 500;

const REM_COLOR_BY_NUMBER: Record<number, RemColorName> = {
  1: 'red',
  2: 'orange',
  3: 'yellow',
  4: 'green',
  5: 'purple',
  6: 'blue',
};

const RICH_TEXT_FONT_COLOR_FIELD = 'tc';
const RICH_TEXT_HIGHLIGHT_FIELD = 'h';

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

function clampLimit(value: number | undefined, fallback: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(value), 1), max);
}

async function getRemTitle(plugin: RNPlugin, rem: Rem): Promise<string> {
  const { frontText, plainText } = await getRemPlainText(plugin, rem);
  const title = frontText || plainText || rem._id;
  if (title.length <= MAX_SUMMARY_TITLE_CHARS) {
    return title;
  }

  return `${title.slice(0, MAX_SUMMARY_TITLE_CHARS).trimEnd()}...`;
}

export async function getRemStructureType(rem: Rem): Promise<RemStructureType> {
  try {
    if (await rem.isDocument()) {
      return 'document';
    }
  } catch {
    return 'unknown';
  }

  const remType = Number(rem.type);
  if (remType === REM_TYPE_CONCEPT || remType === REM_TYPE_DESCRIPTOR || remType === 0) {
    return 'rem';
  }

  return 'unknown';
}

async function summarizeRem(
  plugin: RNPlugin,
  rem: Rem,
  index: number
): Promise<RemChildSummary> {
  const { frontText, plainText } = await getRemPlainText(plugin, rem);
  const title = frontText || plainText || rem._id;
  const trimmedTitle =
    title.length <= MAX_SUMMARY_TITLE_CHARS
      ? title
      : `${title.slice(0, MAX_SUMMARY_TITLE_CHARS).trimEnd()}...`;

  return {
    remId: rem._id,
    title: trimmedTitle,
    frontText,
    plainText,
    breadcrumbs: await buildRemBreadcrumbs(plugin, rem),
    index,
    hasChildren: rem.children.length > 0,
    type: await getRemStructureType(rem),
  };
}

export async function readChildren(
  plugin: RNPlugin,
  args: GetChildrenArgs
): Promise<GetChildrenResult | undefined> {
  const parent = await plugin.rem.findOne(args.parentRemId);

  if (!parent) {
    return undefined;
  }

  const maxChildren = clampLimit(args.maxChildren, DEFAULT_CHILD_LIMIT, MAX_CHILD_LIMIT);
  const children = await parent.getChildrenRem();
  const limitedChildren = children.slice(0, maxChildren);
  const summaries: RemChildSummary[] = [];

  for (let index = 0; index < limitedChildren.length; index += 1) {
    summaries.push(await summarizeRem(plugin, limitedChildren[index], index));
  }

  return {
    parentRemId: parent._id,
    remId: parent._id,
    children: summaries,
    childCount: children.length,
    truncated: children.length > limitedChildren.length,
  };
}

export async function readRemBreadcrumbs(
  plugin: RNPlugin,
  args: GetRemBreadcrumbsArgs
): Promise<GetRemBreadcrumbsResult | undefined> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    return undefined;
  }

  const breadcrumbs: GetRemBreadcrumbsResult['breadcrumbs'] = [];
  const seen = new Set<string>();
  let current: Rem | undefined = rem;

  while (current && breadcrumbs.length < 12 && !seen.has(current._id)) {
    seen.add(current._id);
    breadcrumbs.unshift({
      remId: current._id,
      title: await getRemTitle(plugin, current),
      text: await getRemTitle(plugin, current),
    });

    if (!current.parent) {
      break;
    }

    current = await plugin.rem.findOne(current.parent);
  }

  return {
    remId: rem._id,
    breadcrumbs,
  };
}

export async function searchRems(
  plugin: RNPlugin,
  args: SearchRemsArgs
): Promise<SearchRemsResult> {
  const query = args.query.trim();
  const maxResults = clampLimit(args.maxResults, DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT);
  let contextRem: Rem | undefined;

  if (args.contextRemId) {
    contextRem = await plugin.rem.findOne(args.contextRemId);
    if (!contextRem) {
      return {
        query,
        contextRemId: args.contextRemId,
        results: [],
        truncated: false,
        searchSupported: true,
      };
    }
  }

  const queryRichText: RichTextInterface = [{ i: 'm', text: query }];
  const results = await plugin.search.search(queryRichText, contextRem, {
    numResults: maxResults + 1,
  });
  const limitedResults = results.slice(0, maxResults);
  const summaries: RemChildSummary[] = [];

  for (let index = 0; index < limitedResults.length; index += 1) {
    summaries.push(await summarizeRem(plugin, limitedResults[index], index));
  }

  return {
    query,
    contextRemId: contextRem?._id ?? null,
    results: summaries,
    truncated: results.length > limitedResults.length,
    searchSupported: true,
  };
}

export async function readDocumentOrFolderTree(
  plugin: RNPlugin,
  args: GetDocumentOrFolderTreeArgs
): Promise<GetDocumentOrFolderTreeResult | undefined> {
  let root: Rem | undefined;
  let source: GetDocumentOrFolderTreeResult['source'] = 'requested_root';

  if (args.rootRemId) {
    root = await plugin.rem.findOne(args.rootRemId);
  } else {
    root = await plugin.focus.getFocusedPortal();
    source = 'focused_portal';

    if (!root) {
      root = await plugin.focus.getFocusedRem();
      source = 'focused_rem';
    }
  }

  if (!root) {
    return undefined;
  }

  const tree = await serializeRem(plugin, root, {
    depth: args.depth,
    maxChildren: clampLimit(args.maxChildren, DEFAULT_CHILD_LIMIT, MAX_CHILD_LIMIT),
  });

  return {
    rootRemId: root._id,
    rootType: await getRemStructureType(root),
    source,
    tree,
    truncated: tree.truncated ?? false,
  };
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

function remTypeName(rem: Rem): RemTypeName | 'unknown' {
  const remType = Number(rem.type);
  if (remType === REM_TYPE_CONCEPT) {
    return 'concept';
  }
  if (remType === REM_TYPE_DESCRIPTOR) {
    return 'descriptor';
  }
  if (remType === 0 || Number.isNaN(remType)) {
    return 'normal';
  }
  return 'unknown';
}

function normalizeRichSpans(value: unknown): RichTextSpanInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const spans: RichTextSpanInput[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      spans.push({ type: 'text', text: item, styles: {} });
      continue;
    }

    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const record = item as Record<string, unknown>;
    if (record.i === 'x') {
      spans.push({
        type: record.block ? 'mathBlock' : 'inlineMath',
        latex: typeof record.text === 'string' ? record.text : '',
        styles: {},
      });
      continue;
    }

    if (record.i === 'm' || typeof record.text === 'string') {
      const color = richTextColorName(record[RICH_TEXT_FONT_COLOR_FIELD] ?? record.color ?? record.textColor);
      const highlight = richTextColorName(record[RICH_TEXT_HIGHLIGHT_FIELD]);
      spans.push({
        type: 'text',
        text: typeof record.text === 'string' ? record.text : '',
        styles: {
          ...(color ? { color } : {}),
          ...(highlight ? { highlight } : {}),
          ...(record.b ? { bold: true } : {}),
          ...(record.l ? { italic: true } : {}),
          ...(record.u ? { underline: true } : {}),
          ...(record.q ? { quote: true } : {}),
          ...(record.cId ? { cloze: true } : {}),
        },
      });
      continue;
    }

    if (record.i === 'q' && typeof record._id === 'string') {
      spans.push({
        type: 'text',
        text: `[[${record._id}]]`,
        styles: {},
      });
    }
  }

  return spans;
}

function richTextColorName(value: unknown): RemColorName | undefined {
  if (typeof value === 'number') {
    return REM_COLOR_BY_NUMBER[value];
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized in REM_COLOR_BY_NUMBER) {
      return REM_COLOR_BY_NUMBER[Number(normalized)];
    }
    if (
      normalized === 'red' ||
      normalized === 'orange' ||
      normalized === 'yellow' ||
      normalized === 'green' ||
      normalized === 'blue' ||
      normalized === 'purple' ||
      normalized === 'pink' ||
      normalized === 'gray' ||
      normalized === 'brown'
    ) {
      return normalized as RemColorName;
    }
  }

  return undefined;
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
  const headingLevel = (await rem.getFontSize().catch(() => undefined)) ?? 'normal';
  const isListItem = await rem.isListItem().catch(() => true);
  const highlightColor = await rem.getHighlightColor().catch(() => undefined);
  const children = await readChildren(plugin, { parentRemId: rem._id, maxChildren: DEFAULT_CHILD_LIMIT }).catch(
    () => undefined
  );
  const cards = await rem.getCards().catch(() => []);

  return {
    remId: rem._id,
    frontText,
    backText,
    plainText,
    remStyle: {
      headingLevel: headingLevel as RemHeadingLevel,
      hideBullet: !isListItem,
      ...(highlightColor ? { highlightColor: String(highlightColor).toLowerCase() as RemColorName } : {}),
      remType: remTypeName(rem),
    },
    richText: normalizeRichSpans(rem.text),
    backRichText: normalizeRichSpans(rem.backText),
    children: children?.children ?? [],
    card: {
      hasCards: cards.length > 0,
      cards: cards.map((card) => ({
        id: (card as { _id?: string })._id,
        type: (card as { type?: unknown }).type,
      })),
    },
    rich: {
      front: normalizeRichArray(rem.text),
      back: normalizeRichArray(rem.backText),
    },
    richSupported: true,
    detectedContentTypes: Array.from(detected),
  };
}

export async function debugGetRawRichText(
  plugin: RNPlugin,
  args: DebugGetRawRichTextArgs
): Promise<DebugGetRawRichTextResult | undefined> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    return undefined;
  }

  const richLength = await plugin.richText.length(rem.text).catch(() => undefined);
  const backRichLength = rem.backText
    ? await plugin.richText.length(rem.backText).catch(() => undefined)
    : undefined;

  return {
    remId: rem._id,
    rawText: rem.text,
    rawBackText: rem.backText,
    richLength,
    backRichLength,
    json: JSON.stringify(
      {
        text: rem.text,
        backText: rem.backText,
      },
      null,
      2
    ),
    interpretation: {
      fontColorField: RICH_TEXT_FONT_COLOR_FIELD,
      textHighlightField: RICH_TEXT_HIGHLIGHT_FIELD,
      wholeRemHighlightSource: 'rem.getHighlightColor()',
    },
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
      reason: 'SDK does not expose current selection',
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
