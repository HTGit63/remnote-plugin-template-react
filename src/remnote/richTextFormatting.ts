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

type InstalledTextColorFormat = (typeof INSTALLED_TEXT_COLOR_FORMATS)[number];
type BuilderTextFormat = 'bold' | 'italic' | 'underline' | 'quote' | InstalledTextColorFormat;
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

function normalizeTextColorTarget(input: string): {
  requestedColor: string;
  normalizedColor: InstalledTextColorFormat | 'default';
  colorFormat: InstalledTextColorFormat | null;
} {
  const requestedColor = input;
  if (input.trim().toLowerCase() === 'default') {
    return {
      requestedColor,
      normalizedColor: 'default',
      colorFormat: null,
    };
  }

  const normalizedColor = normalizeTextColor(input) as InstalledTextColorFormat;
  return {
    requestedColor,
    normalizedColor,
    colorFormat: normalizedColor,
  };
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

function hasAdvancedTextFields(item: unknown): item is Record<string, unknown> {
  if (!isRecord(item)) {
    return false;
  }

  return ['cId', 'code', 'url', 'qId', 'hiddenCloze', 'revealedCloze', 'language', 'c'].some(
    (key) => item[key] !== undefined
  );
}

async function buildText(plugin: RNPlugin, text: string, formats: BuilderTextFormat[]): Promise<RichTextInterface> {
  if (!text) {
    return [];
  }

  return plugin.richText.text(text, formats).value();
}

async function formatTextItems(
  plugin: RNPlugin,
  richText: RichTextInterface,
  formats: RangeFormat[],
  colorFormat?: InstalledTextColorFormat | null
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

    if (hasAdvancedTextFields(item)) {
      const next = JSON.parse(JSON.stringify(item)) as Record<string, unknown>;
      if (colorFormat === null) {
        delete next.h;
      } else if (colorFormat) {
        next.h = TEXT_COLOR_NUMBERS[colorFormat];
      }
      if (basicFormats.includes('bold')) {
        next.b = true;
      }
      if (basicFormats.includes('italic')) {
        next.l = true;
      }
      if (basicFormats.includes('underline')) {
        next.u = true;
      }
      if (basicFormats.includes('quote')) {
        next.q = true;
      }
      if (clozeId) {
        next.cId = clozeId;
      }
      output.push(next as RichTextInterface[number]);
      continue;
    }

    const inherited = baseFormatsFromElement(item);
    const nextFormats = Array.from(
      new Set([
        ...inherited,
        ...basicFormats,
        ...(colorFormat ? [colorFormat] : []),
      ])
    ) as BuilderTextFormat[];
    const built = await buildText(plugin, text, nextFormats);
    if (clozeId) {
      for (const builtItem of built) {
        if (typeof builtItem === 'string') {
          output.push({ i: 'm', text: builtItem, cId: clozeId } as RichTextInterface[number]);
        } else if (isRecord(builtItem)) {
          output.push({ ...builtItem, cId: clozeId } as RichTextInterface[number]);
        }
      }
    } else {
      output.push(...built);
    }
  }

  return output;
}

async function normalizeCombinedRichText(
  plugin: RNPlugin,
  parts: RichTextInterface[]
): Promise<RichTextInterface> {
  const combined = parts.flat() as RichTextInterface;
  try {
    return await plugin.richText.normalize(combined);
  } catch {
    return combined;
  }
}

export async function applyFormatsToRichTextRange(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start: number,
  end: number,
  formats: RangeFormat[]
): Promise<RichTextInterface> {
  const split = await splitRichTextByCharRange(plugin, richText, start, end);
  const target = await formatTextItems(plugin, split.target, formats);
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
  const target = await formatTextItems(plugin, split.target, [], normalized.colorFormat);
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
      output.push(...(await formatTextItems(plugin, [item] as RichTextInterface, [], normalized.colorFormat)));
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

export async function applyTextHighlightToRange(): Promise<never> {
  throw new RichTextFormattingError(
    'SDK_UNSUPPORTED',
    'Selected-text highlight is not exposed as a distinct safe API by installed @remnote/plugin-sdk 0.0.14. Whole-Rem highlight remains supported through set_rem_highlight_color.',
    {
      checked: [
        'RichTextNamespace.text formats',
        'RichTextFormatName',
        'RichTextElementTextInterface',
        'applyTextFormatToRange',
      ],
      distinction: 'set_text_span_highlight is not routed to whole-Rem highlight.',
    }
  );
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
