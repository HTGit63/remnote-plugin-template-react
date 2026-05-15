import type { RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type { BridgeErrorCode } from '../bridge/protocol';

export const TEXT_COLOR_FORMATS = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  gray: 'Gray',
  brown: 'Brown',
  pink: 'Pink',
} as const;

const INSTALLED_TEXT_COLOR_FORMATS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'] as const;
const INSTALLED_TEXT_COLOR_SET = new Set<string>(INSTALLED_TEXT_COLOR_FORMATS);
const TEXT_COLOR_NUMBERS: Record<InstalledTextColorFormat, number> = {
  Red: 1,
  Orange: 2,
  Yellow: 3,
  Green: 4,
  Purple: 5,
  Blue: 6,
};
export const RICH_TEXT_FONT_COLOR_FIELD = 'tc';
export const RICH_TEXT_HIGHLIGHT_FIELD = 'h';

type InstalledTextColorFormat = (typeof INSTALLED_TEXT_COLOR_FORMATS)[number];
type BuilderTextFormat = 'bold' | 'italic' | 'underline' | 'quote';
type RangeFormat = BuilderTextFormat | 'cloze';

export class RichTextFormattingError extends Error {
  constructor(
    readonly code: BridgeErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'RichTextFormattingError';
  }
}

export interface ResolvedTextRange {
  start: number;
  end: number;
  resolvedPlainText: string;
  plainTextLength: number;
}

export interface SplitRichTextRange {
  before: RichTextInterface;
  target: RichTextInterface;
  after: RichTextInterface;
  targetPlainText: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneRichText(richText: RichTextInterface): RichTextInterface {
  return richText.map((item) => {
    if (typeof item === 'string') {
      return item;
    }

    return JSON.parse(JSON.stringify(item));
  }) as RichTextInterface;
}

function officialColorName(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  if (lower in TEXT_COLOR_FORMATS) {
    return TEXT_COLOR_FORMATS[lower as keyof typeof TEXT_COLOR_FORMATS];
  }

  const exact = Object.values(TEXT_COLOR_FORMATS).find((value) => value === trimmed);
  return exact;
}

export function normalizeTextColor(input: string): RichTextFormatName {
  const official = officialColorName(input);
  if (!official) {
    throw new RichTextFormattingError('INVALID_ARGS', `Unsupported text color "${input}".`, {
      requestedColor: input,
      supportedColors: Object.keys(TEXT_COLOR_FORMATS),
    });
  }

  if (!INSTALLED_TEXT_COLOR_SET.has(official)) {
    throw new RichTextFormattingError(
      'SDK_UNSUPPORTED',
      `Text color "${official}" is not exposed by installed @remnote/plugin-sdk 0.0.14 typings.`,
      {
        requestedColor: input,
        normalizedColor: official,
        installedSupportedColors: [...INSTALLED_TEXT_COLOR_FORMATS],
      }
    );
  }

  return official as RichTextFormatName;
}

export function normalizeHighlightColor(input: string): RichTextFormatName {
  return normalizeTextColor(input);
}

export function normalizeTextColorTarget(input: string): {
  requestedColor: string;
  normalizedColor: InstalledTextColorFormat | 'default';
  colorNumber: number | null;
} {
  const requestedColor = input;
  if (input.trim().toLowerCase() === 'default') {
    return {
      requestedColor,
      normalizedColor: 'default',
      colorNumber: null,
    };
  }

  const normalizedColor = normalizeTextColor(input) as InstalledTextColorFormat;
  return {
    requestedColor,
    normalizedColor,
    colorNumber: TEXT_COLOR_NUMBERS[normalizedColor],
  };
}

export function normalizeHighlightColorTarget(input: string): {
  requestedColor: string;
  normalizedColor: InstalledTextColorFormat | 'default';
  colorNumber: number | null;
} {
  return normalizeTextColorTarget(input);
}

async function richTextLength(plugin: RNPlugin, richText: RichTextInterface): Promise<number> {
  try {
    return await plugin.richText.length(richText);
  } catch {
    return (await plugin.richText.toString(richText)).length;
  }
}

function validateRange(start: number, end: number, textLength: number, details?: Record<string, unknown>) {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end <= start ||
    end > textLength
  ) {
    throw new RichTextFormattingError('INVALID_ARGS', 'Range must be inside the Rem plain text.', {
      start,
      end,
      textLength,
      ...details,
    });
  }
}

export async function resolveRangeFromPlainText(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start?: number,
  end?: number,
  text?: string,
  occurrence = 1
): Promise<ResolvedTextRange> {
  const plainText = await plugin.richText.toString(richText);
  const textLength = await richTextLength(plugin, richText);

  if (start !== undefined || end !== undefined) {
    if (start === undefined || end === undefined) {
      throw new RichTextFormattingError('INVALID_ARGS', 'Both start and end are required for explicit range formatting.');
    }

    validateRange(start, end, textLength);
    return {
      start,
      end,
      resolvedPlainText: plainText.slice(start, end),
      plainTextLength: textLength,
    };
  }

  const needle = text?.trim();
  if (!needle) {
    throw new RichTextFormattingError('INVALID_ARGS', 'Provide start/end or text to resolve a span range.');
  }

  if (!Number.isInteger(occurrence) || occurrence < 1) {
    throw new RichTextFormattingError('INVALID_ARGS', 'occurrence must be a one-based positive integer.', {
      occurrence,
    });
  }

  let found = -1;
  let cursor = 0;
  for (let index = 0; index < occurrence; index += 1) {
    found = plainText.indexOf(needle, cursor);
    if (found < 0) {
      throw new RichTextFormattingError('INVALID_ARGS', 'Requested text occurrence was not found in Rem plain text.', {
        text: needle,
        occurrence,
        plainText,
      });
    }
    cursor = found + needle.length;
  }

  const resolvedEnd = found + needle.length;
  validateRange(found, resolvedEnd, textLength, { text: needle, occurrence });
  return {
    start: found,
    end: resolvedEnd,
    resolvedPlainText: plainText.slice(found, resolvedEnd),
    plainTextLength: textLength,
  };
}

export async function splitRichTextByCharRange(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start: number,
  end: number
): Promise<SplitRichTextRange> {
  const textLength = await richTextLength(plugin, richText);
  validateRange(start, end, textLength);

  const before = start > 0 ? await plugin.richText.substring(richText, 0, start) : [];
  const target = await plugin.richText.substring(richText, start, end);
  const after = end < textLength ? await plugin.richText.substring(richText, end) : [];

  return {
    before,
    target,
    after,
    targetPlainText: await plugin.richText.toString(target),
  };
}

function isTextElement(item: unknown): boolean {
  if (typeof item === 'string') {
    return true;
  }

  if (!isRecord(item)) {
    return false;
  }

  return item.i === 'm' || (typeof item.text === 'string' && item.i !== 'x');
}

function getTextElementText(item: unknown): string {
  if (typeof item === 'string') {
    return item;
  }

  if (!isRecord(item) || typeof item.text !== 'string') {
    return '';
  }

  return item.text;
}

function baseFormatsFromElement(item: unknown): BuilderTextFormat[] {
  if (!isRecord(item)) {
    return [];
  }

  const formats: BuilderTextFormat[] = [];
  if (item.b === true) {
    formats.push('bold');
  }
  if (item.l === true) {
    formats.push('italic');
  }
  if (item.u === true) {
    formats.push('underline');
  }
  if (item.q === true) {
    formats.push('quote');
  }
  return formats;
}

async function formatTextItems(
  richText: RichTextInterface,
  formats: RangeFormat[],
  fontColorNumber?: number | null,
  highlightColorNumber?: number | null
): Promise<RichTextInterface> {
  const output: RichTextInterface = [];
  const shouldApplyCloze = formats.includes('cloze');
  const basicFormats = formats.filter((format): format is BuilderTextFormat => format !== 'cloze');
  const clozeId = shouldApplyCloze ? `bridge-cloze-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}` : undefined;

  for (const item of richText) {
    if (!isTextElement(item)) {
      throw new RichTextFormattingError(
        'INVALID_ARGS',
        'Requested range crosses non-text rich content. Format adjacent text ranges only.',
        {
          element: item,
        }
      );
    }

    const text = getTextElementText(item);
    if (!text) {
      continue;
    }

    const next =
      typeof item === 'string'
        ? ({ i: 'm', text } as Record<string, unknown>)
        : (JSON.parse(JSON.stringify(item)) as Record<string, unknown>);

    if (fontColorNumber === null) {
      delete next[RICH_TEXT_FONT_COLOR_FIELD];
    } else if (fontColorNumber) {
      next[RICH_TEXT_FONT_COLOR_FIELD] = fontColorNumber;
    }

    if (highlightColorNumber === null) {
      delete next[RICH_TEXT_HIGHLIGHT_FIELD];
    } else if (highlightColorNumber) {
      next[RICH_TEXT_HIGHLIGHT_FIELD] = highlightColorNumber;
    }

    const inherited = baseFormatsFromElement(item);
    const nextFormats = Array.from(new Set([...inherited, ...basicFormats])) as BuilderTextFormat[];
    if (nextFormats.includes('bold')) {
      next.b = true;
    }
    if (nextFormats.includes('italic')) {
      next.l = true;
    }
    if (nextFormats.includes('underline')) {
      next.u = true;
    }
    if (nextFormats.includes('quote')) {
      next.q = true;
    }
    if (clozeId) {
      next.cId = clozeId;
    }

    output.push(next as RichTextInterface[number]);
  }

  return output;
}

async function normalizeCombinedRichText(
  plugin: RNPlugin,
  parts: RichTextInterface[]
): Promise<RichTextInterface> {
  const combined = parts.flat() as RichTextInterface;
  return combined;
}

export async function applyFormatsToRichTextRange(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start: number,
  end: number,
  formats: RangeFormat[]
): Promise<RichTextInterface> {
  const split = await splitRichTextByCharRange(plugin, richText, start, end);
  const target = await formatTextItems(split.target, formats);
  return normalizeCombinedRichText(plugin, [split.before, target, split.after]);
}

export async function applyTextColorToRange(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start: number,
  end: number,
  color: string
): Promise<{ richText: RichTextInterface; requestedColor: string; normalizedColor: string; methodUsed: 'rich_text_rebuild' }> {
  const normalized = normalizeTextColorTarget(color);
  const split = await splitRichTextByCharRange(plugin, richText, start, end);
  const target = await formatTextItems(split.target, [], normalized.colorNumber);
  return {
    richText: await normalizeCombinedRichText(plugin, [split.before, target, split.after]),
    requestedColor: normalized.requestedColor,
    normalizedColor: normalized.normalizedColor,
    methodUsed: 'rich_text_rebuild',
  };
}

export async function applyTextColorToAllText(
  plugin: RNPlugin,
  richText: RichTextInterface,
  color: string
): Promise<{ richText: RichTextInterface; requestedColor: string; normalizedColor: string; methodUsed: 'rich_text_rebuild' }> {
  const normalized = normalizeTextColorTarget(color);
  const output: RichTextInterface = [];

  for (const item of cloneRichText(richText)) {
    if (isTextElement(item)) {
      output.push(...(await formatTextItems([item] as RichTextInterface, [], normalized.colorNumber)));
    } else {
      output.push(item);
    }
  }

  return {
    richText: await normalizeCombinedRichText(plugin, [output]),
    requestedColor: normalized.requestedColor,
    normalizedColor: normalized.normalizedColor,
    methodUsed: 'rich_text_rebuild',
  };
}

export async function applyTextHighlightToRange(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start: number,
  end: number,
  color: string
): Promise<{ richText: RichTextInterface; requestedColor: string; normalizedColor: string; methodUsed: 'rich_text_rebuild' }> {
  const normalized = normalizeHighlightColorTarget(color);
  const split = await splitRichTextByCharRange(plugin, richText, start, end);
  const target = await formatTextItems(split.target, [], undefined, normalized.colorNumber);
  return {
    richText: await normalizeCombinedRichText(plugin, [split.before, target, split.after]),
    requestedColor: normalized.requestedColor,
    normalizedColor: normalized.normalizedColor,
    methodUsed: 'rich_text_rebuild',
  };
}

export async function applyClozeToRange(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start: number,
  end: number
): Promise<{ richText: RichTextInterface; methodUsed: 'rich_text_rebuild' }> {
  return {
    richText: await applyFormatsToRichTextRange(plugin, richText, start, end, ['cloze']),
    methodUsed: 'rich_text_rebuild',
  };
}
