import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type { Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
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
import {
  RichTextFormattingError,
  applyClozeToRange,
  applyFormatsToRichTextRange,
  applyTextColorToAllText,
  applyTextColorToRange,
  applyTextHighlightToRange,
  normalizeHighlightColorTarget,
  normalizeTextColorTarget,
  RICH_TEXT_FONT_COLOR_FIELD,
  RICH_TEXT_HIGHLIGHT_FIELD,
  resolveRangeFromPlainText,
} from '../richTextFormatting';
import { RemnoteWriteError, mapFormattingError, runSdkOperation, wrapPartialCreateError } from './writeErrors';
import { COLOR_FORMATS, type ParentLookupCode } from './writeTypes';

export async function parseMarkdownToRichText(plugin: RNPlugin, markdown: string): Promise<RichTextInterface> {
  return runSdkOperation('richText.parseFromMarkdown', () =>
    plugin.richText.parseFromMarkdown(markdown)
  );
}

export function getColorFormat(input: string): RichTextFormatName | undefined {
  const color = remColorNameFromString(input);
  const format = COLOR_FORMATS[color];
  if (!format && color !== 'default' && color !== 'pink' && color !== 'gray' && color !== 'brown') {
    throw new RemnoteWriteError('INVALID_ARGS', `Unsupported color "${input}".`);
  }

  if (!format && (color === 'pink' || color === 'gray' || color === 'brown')) {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      `The installed RemNote SDK rich text formatter only exposes red, orange, yellow, green, blue, and purple.`
    );
  }

  return format;
}

export function remColorNameFromString(value: string): RemColorName {
  const color = value.trim().toLowerCase();
  switch (color) {
    case 'red':
    case 'orange':
    case 'yellow':
    case 'green':
    case 'blue':
    case 'purple':
    case 'pink':
    case 'gray':
    case 'brown':
    case 'default':
      return color;
    default:
      throw new RemnoteWriteError('INVALID_ARGS', `Unsupported color "${value}".`);
  }
}

export function headingLevelFromString(value: string): RemHeadingLevel {
  switch (value.trim()) {
    case 'H1':
    case 'h1':
      return 'H1';
    case 'H2':
    case 'h2':
      return 'H2';
    case 'H3':
    case 'h3':
      return 'H3';
    case 'normal':
    case 'Normal':
      return 'normal';
    default:
      throw new RemnoteWriteError('INVALID_ARGS', `Unsupported heading level "${value}".`);
  }
}

export function normalizeHeading(level: RemHeadingLevel): 'H1' | 'H2' | 'H3' | undefined {
  return level === 'normal' ? undefined : level;
}

export function getRemTypeValue(type: RemTypeName): SetRemType {
  switch (type) {
    case 'concept':
      return SetRemType.CONCEPT;
    case 'descriptor':
      return SetRemType.DESCRIPTOR;
    case 'normal':
    default:
      return SetRemType.DEFAULT_TYPE;
  }
}

export function getTextFormats(styles: RichTextSpanInput['styles']): Exclude<RichTextFormatName, 'cloze'>[] {
  const formats: Exclude<RichTextFormatName, 'cloze'>[] = [];
  if (!styles) {
    return formats;
  }

  if (styles.bold) {
    formats.push('bold');
  }
  if (styles.italic) {
    formats.push('italic');
  }
  if (styles.underline) {
    formats.push('underline');
  }
  if (styles.quote) {
    formats.push('quote');
  }

  return formats;
}

export function applyRawColorFieldsToTextItem(
  item: RichTextInterface[number],
  styles: RichTextSpanInput['styles']
): RichTextInterface[number] {
  if (!styles || typeof item !== 'object' || item === null || Array.isArray(item)) {
    return item;
  }

  const next = { ...(item as Record<string, unknown>) };
  if (styles.color !== undefined) {
    const target = normalizeTextColorTarget(styles.color);
    if (target.colorNumber === null) {
      delete next[RICH_TEXT_FONT_COLOR_FIELD];
    } else {
      next[RICH_TEXT_FONT_COLOR_FIELD] = target.colorNumber;
    }
  }

  if (styles.highlight !== undefined) {
    const target = normalizeHighlightColorTarget(styles.highlight);
    if (target.colorNumber === null) {
      delete next[RICH_TEXT_HIGHLIGHT_FIELD];
    } else {
      next[RICH_TEXT_HIGHLIGHT_FIELD] = target.colorNumber;
    }
  }

  if (styles.cloze) {
    next.cId = `bridge-cloze-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return next as RichTextInterface[number];
}

export function applyRawColorFieldsToRichText(
  richText: RichTextInterface,
  styles: RichTextSpanInput['styles']
): RichTextInterface {
  return richText.map((item) => {
    if (typeof item === 'string') {
      return applyRawColorFieldsToTextItem({ i: 'm', text: item } as RichTextInterface[number], styles);
    }

    return applyRawColorFieldsToTextItem(item, styles);
  }) as RichTextInterface;
}

export function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }

  return slashCount % 2 === 1;
}

export function findUnescapedDelimiter(text: string, delimiter: string, fromIndex: number): number {
  let index = text.indexOf(delimiter, fromIndex);
  while (index >= 0) {
    if (!isEscaped(text, index)) {
      return index;
    }

    index = text.indexOf(delimiter, index + delimiter.length);
  }

  return -1;
}

export function findClosingDollar(text: string, fromIndex: number): number {
  let index = text.indexOf('$', fromIndex);
  while (index >= 0) {
    if (!isEscaped(text, index) && text[index + 1] !== '$') {
      return index;
    }

    index = text.indexOf('$', index + 1);
  }

  return -1;
}

export function parseLatexSpansFromText(text: string, styles?: RichTextSpanInput['styles']): RichTextSpanInput[] {
  const spans: RichTextSpanInput[] = [];
  let cursor = 0;
  let textStart = 0;

  function pushText(end: number) {
    if (end > textStart) {
      spans.push({ text: text.slice(textStart, end), styles });
    }
  }

  function pushMath(
    tokenStart: number,
    contentStart: number,
    contentEnd: number,
    closeLength: number,
    type: 'inlineMath' | 'mathBlock'
  ) {
    const latex = text.slice(contentStart, contentEnd).trim();
    if (!latex) {
      return false;
    }

    pushText(tokenStart);
    spans.push({ type, latex });
    cursor = contentEnd + closeLength;
    textStart = cursor;
    return true;
  }

  while (cursor < text.length) {
    if (!isEscaped(text, cursor) && text.startsWith('$$', cursor)) {
      const close = findUnescapedDelimiter(text, '$$', cursor + 2);
      if (close >= 0) {
        if (pushMath(cursor, cursor + 2, close, 2, 'mathBlock')) {
          continue;
        }
      }
    }

    if (!isEscaped(text, cursor) && text.startsWith('\\[', cursor)) {
      const close = findUnescapedDelimiter(text, '\\]', cursor + 2);
      if (close >= 0) {
        if (pushMath(cursor, cursor + 2, close, 2, 'mathBlock')) {
          continue;
        }
      }
    }

    if (!isEscaped(text, cursor) && text.startsWith('\\(', cursor)) {
      const close = findUnescapedDelimiter(text, '\\)', cursor + 2);
      if (close >= 0) {
        if (pushMath(cursor, cursor + 2, close, 2, 'inlineMath')) {
          continue;
        }
      }
    }

    if (text[cursor] === '$' && text[cursor + 1] !== '$' && !isEscaped(text, cursor)) {
      const close = findClosingDollar(text, cursor + 1);
      if (close >= 0) {
        if (pushMath(cursor, cursor + 1, close, 1, 'inlineMath')) {
          continue;
        }
      }
    }

    cursor += 1;
  }

  pushText(text.length);
  return spans.length ? spans : [{ text, styles }];
}

export async function buildRichTextFromSpans(
  plugin: RNPlugin,
  spans: RichTextSpanInput[]
): Promise<RichTextInterface> {
  if (!Array.isArray(spans) || spans.length === 0) {
    throw new RemnoteWriteError('INVALID_ARGS', 'richText must contain at least one span.');
  }

  const output: RichTextInterface = [];
  let appended = false;

  for (const span of spans) {
    const type = span.type ?? (span.latex ? 'inlineMath' : 'text');
    if (type === 'mathBlock' || type === 'inlineMath') {
      const latex = span.latex ?? span.text ?? '';
      if (!latex) {
        throw new RemnoteWriteError('INVALID_ARGS', 'Math span requires latex.');
      }

      output.push({ i: 'x', text: latex, block: type === 'mathBlock' } as RichTextInterface[number]);
      appended = true;
      continue;
    }

    const text = span.text ?? '';
    if (!text) {
      continue;
    }

    for (const parsedSpan of parseLatexSpansFromText(text, span.styles)) {
      const parsedType = parsedSpan.type ?? 'text';
      if (parsedType === 'mathBlock' || parsedType === 'inlineMath') {
        const latex = parsedSpan.latex ?? parsedSpan.text ?? '';
        output.push({ i: 'x', text: latex, block: parsedType === 'mathBlock' } as RichTextInterface[number]);
      } else {
        const built = await runSdkOperation('richText.text.value', () =>
          plugin.richText.text(parsedSpan.text ?? '', getTextFormats(parsedSpan.styles)).value()
        );
        const styled = applyRawColorFieldsToRichText(built, parsedSpan.styles);
        output.push(...styled);
      }
      appended = true;
    }
  }

  if (!appended || output.length === 0) {
    throw new RemnoteWriteError('INVALID_ARGS', 'richText did not contain text or math content.');
  }

  return output;
}

export async function buildStyledText(
  plugin: RNPlugin,
  text: string,
  style?: RemStyleInput
): Promise<RichTextInterface> {
  const normalizedStyle = normalizeRemStyleInput(style);
  return buildRichTextFromSpans(plugin, [
    {
      text,
      styles: {
        color: normalizedStyle?.textColor,
        highlight: normalizedStyle?.highlightColor,
      },
    },
  ]);
}

export function normalizeRemStyleInput(style: RemStyleInput | undefined): RemStyleInput | undefined {
  if (!style) {
    return undefined;
  }
  return {
    ...style,
    textColor: style.textColor ?? style.color,
    highlightColor: style.highlightColor ?? style.highlight,
    remType: style.remType ?? style.type,
  };
}

export async function getRemPlainString(plugin: RNPlugin, rem: Rem): Promise<string> {
  return runSdkOperation('richText.toString', () => plugin.richText.toString(rem.text));
}

export function validateTextRange(range: { start: number; end: number }, textLength: number) {
  if (
    !Number.isInteger(range.start) ||
    !Number.isInteger(range.end) ||
    range.start < 0 ||
    range.end <= range.start ||
    range.end > textLength
  ) {
    throw new RemnoteWriteError('INVALID_ARGS', 'range must be inside the Rem plain text.', {
      range,
      textLength,
    });
  }
}

export function rangeInputFromArgs(
  args: Pick<SetTextSpanColorArgs | SetTextSpanHighlightArgs, 'range' | 'start' | 'end' | 'text' | 'occurrence'>
): { start?: number; end?: number; text?: string; occurrence?: number } {
  return {
    start: args.start ?? args.range?.start,
    end: args.end ?? args.range?.end,
    text: args.text,
    occurrence: args.occurrence,
  };
}

export async function setTextColorInRange(
  plugin: RNPlugin,
  rem: Rem,
  range: { start: number; end: number; resolvedPlainText: string },
  color: string,
  status: FormatRemResult['status']
): Promise<FormatRemResult> {
  try {
    const formatted = await applyTextColorToRange(plugin, rem.text, range.start, range.end, color);
    await runSdkOperation('rem.setText', () => rem.setText(formatted.richText));
    return {
      remId: rem._id,
      status,
      ok: true,
      requestedColor: formatted.requestedColor,
      normalizedColor: formatted.normalizedColor,
      methodUsed: formatted.methodUsed,
      resolvedPlainText: range.resolvedPlainText,
      start: range.start,
      end: range.end,
      verification: {
        plainText: await getRemPlainString(plugin, rem),
      },
    };
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function setTextHighlightInRange(
  plugin: RNPlugin,
  rem: Rem,
  range: { start: number; end: number; resolvedPlainText: string },
  color: string
): Promise<FormatRemResult> {
  try {
    const formatted = await applyTextHighlightToRange(plugin, rem.text, range.start, range.end, color);
    await runSdkOperation('rem.setText', () => rem.setText(formatted.richText));
    return {
      remId: rem._id,
      status: 'span_highlight_set',
      ok: true,
      requestedColor: formatted.requestedColor,
      normalizedColor: formatted.normalizedColor,
      methodUsed: formatted.methodUsed,
      resolvedPlainText: range.resolvedPlainText,
      start: range.start,
      end: range.end,
      verification: {
        plainText: await getRemPlainString(plugin, rem),
      },
    };
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function applyRemStyle(plugin: RNPlugin, rem: Rem, style: RemStyleInput | undefined) {
  const normalizedStyle = normalizeRemStyleInput(style);
  if (!normalizedStyle) {
    return;
  }

  if (normalizedStyle.headingLevel) {
    const headingLevel = normalizedStyle.headingLevel;
    await runSdkOperation('rem.setFontSize', () => rem.setFontSize(normalizeHeading(headingLevel)));
  }

  if (normalizedStyle.hideBullet !== undefined) {
    await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(!normalizedStyle.hideBullet));
  }

  if (normalizedStyle.remType && normalizedStyle.remType !== 'normal') {
    const remType = normalizedStyle.remType;
    await runSdkOperation('rem.setType', () => rem.setType(getRemTypeValue(remType)));
  }

  if (normalizedStyle.highlightColor && normalizedStyle.highlightColor !== 'default') {
    const color = getColorFormat(normalizedStyle.highlightColor);
    if (color) {
      await runSdkOperation('rem.setHighlightColor', () => rem.setHighlightColor(color as never));
    }
  }

  if (normalizedStyle.textColor && normalizedStyle.textColor !== 'default') {
    const plain = await getRemPlainString(plugin, rem);
    if (plain.length > 0) {
      await setTextColorInRange(
        plugin,
        rem,
        { start: 0, end: plain.length, resolvedPlainText: plain },
        normalizedStyle.textColor,
        'text_color_set'
      );
    }
  }
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

export async function createRemWithRichText(
  plugin: RNPlugin,
  richText: RichTextInterface,
  parent: Rem | null,
  positionAmongstSiblings?: number
): Promise<Rem> {
  let createdRem: Rem | null = null;
  let failedStage = 'rem.createRem';

  try {
    const maybeCreatedRem = await runSdkOperation('rem.createRem', () => plugin.rem.createRem());

    if (!maybeCreatedRem) {
      throw new RemnoteWriteError('SDK_ERROR', 'RemNote did not return a created Rem.', {
        operation: 'rem.createRem',
      });
    }

    createdRem = maybeCreatedRem;
    const rem = createdRem;
    failedStage = 'rem.setText';
    await runSdkOperation('rem.setText', () => rem.setText(richText));

    if (parent) {
      failedStage = 'rem.setParent';
      await runSdkOperation('rem.setParent', () =>
        rem.setParent(parent, positionAmongstSiblings)
      );
    }

    return rem;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      throw wrapPartialCreateError(error, createdRem, failedStage);
    }

    throw error;
  }
}

export function getInsertIndex(parent: Rem, position: 'start' | 'end' | undefined): number {
  return position === 'start' ? 0 : parent.children.length;
}

export async function getFreshInsertIndex(
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


export async function assertNewParentIsNotDescendant(plugin: RNPlugin, rem: Rem, newParent: Rem) {
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

export async function getRemTitle(plugin: RNPlugin, rem: Rem): Promise<string> {
  const title = await runSdkOperation('richText.toString', () => plugin.richText.toString(rem.text));
  return title.trim() || rem._id;
}

