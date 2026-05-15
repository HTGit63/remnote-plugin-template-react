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
  DeleteFocusedRemArgs,
  DeletePreview,
  DeleteRemByIdArgs,
  DeleteRemByIdResult,
  DeleteRemByIdTarget,
  DeleteRemArgs,
  DeleteRemResult,
  DeleteSelectedRemArgs,
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
} from '../bridge/protocol';
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
} from './richTextFormatting';

const MAX_MARKDOWN_CHARS = 20000;
export const CREATE_TREE_MAX_DEPTH = 5;
export const CREATE_TREE_MAX_NODES = 100;
export const CREATE_TREE_MAX_TITLE_LENGTH = 1000;
const STRUCTURED_BATCH_CACHE_LIMIT = 50;

type ParentLookupCode = Extract<BridgeErrorCode, 'REM_NOT_FOUND' | 'PARENT_NOT_FOUND'>;

interface ValidatedTreeNode {
  title: string;
  children: ValidatedTreeNode[];
}

interface TreeValidationState {
  nodeCount: number;
}

const COLOR_FORMATS: Record<RemColorName, RichTextFormatName | undefined> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  pink: undefined,
  gray: undefined,
  brown: undefined,
  default: undefined,
};

const COLOR_FORMAT_NAMES: RichTextFormatName[] = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];
const STRUCTURED_BATCH_RESULT_CACHE = new Map<string, ApplyStructuredNoteBatchResult>();
const REMNOTE_COMMAND_RESULT_CACHE = new Map<string, ApplyRemnoteCommandResult>();
const DELETE_BY_ID_RESULT_CACHE = new Map<string, DeleteRemByIdResult>();
const POLISHED_TREE_RESULT_CACHE = new Map<string, CreatePolishedNoteTreeResult>();

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

function getPartialExecutionDetails(details: unknown): Record<string, unknown> {
  if (typeof details !== 'object' || details === null || Array.isArray(details)) {
    return {};
  }

  const partialExecution = (details as Record<string, unknown>).partialExecution;
  return typeof partialExecution === 'object' && partialExecution !== null && !Array.isArray(partialExecution)
    ? (partialExecution as Record<string, unknown>)
    : {};
}

function mapFormattingError(error: unknown): RemnoteWriteError {
  if (error instanceof RichTextFormattingError) {
    return new RemnoteWriteError(error.code, error.message, error.details);
  }

  if (error instanceof RemnoteWriteError) {
    return error;
  }

  return new RemnoteWriteError('SDK_ERROR', 'RemNote SDK operation failed.', {
    sdkMessage: getSdkErrorMessage(error),
  });
}

function wrapPartialCreateError(
  error: RemnoteWriteError,
  createdRem: Rem | null,
  failedStage: string
): RemnoteWriteError {
  if (!createdRem) {
    return error;
  }

  return new RemnoteWriteError(error.code, error.message, {
    originalDetails: error.details,
    partialExecution: {
      ...getPartialExecutionDetails(error.details),
      createdRemIds: [createdRem._id],
      failedStage,
      rollbackStatus: 'not_attempted',
    },
  });
}

async function parseMarkdownToRichText(plugin: RNPlugin, markdown: string): Promise<RichTextInterface> {
  return runSdkOperation('richText.parseFromMarkdown', () =>
    plugin.richText.parseFromMarkdown(markdown)
  );
}

function getColorFormat(input: string): RichTextFormatName | undefined {
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

function remColorNameFromString(value: string): RemColorName {
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

function headingLevelFromString(value: string): RemHeadingLevel {
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

function normalizeHeading(level: RemHeadingLevel): 'H1' | 'H2' | 'H3' | undefined {
  return level === 'normal' ? undefined : level;
}

function getRemTypeValue(type: RemTypeName): SetRemType {
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

function getTextFormats(styles: RichTextSpanInput['styles']): Exclude<RichTextFormatName, 'cloze'>[] {
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

function applyRawColorFieldsToTextItem(
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

function applyRawColorFieldsToRichText(
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

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }

  return slashCount % 2 === 1;
}

function findUnescapedDelimiter(text: string, delimiter: string, fromIndex: number): number {
  let index = text.indexOf(delimiter, fromIndex);
  while (index >= 0) {
    if (!isEscaped(text, index)) {
      return index;
    }

    index = text.indexOf(delimiter, index + delimiter.length);
  }

  return -1;
}

function findClosingDollar(text: string, fromIndex: number): number {
  let index = text.indexOf('$', fromIndex);
  while (index >= 0) {
    if (!isEscaped(text, index) && text[index + 1] !== '$') {
      return index;
    }

    index = text.indexOf('$', index + 1);
  }

  return -1;
}

function parseLatexSpansFromText(text: string, styles?: RichTextSpanInput['styles']): RichTextSpanInput[] {
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

async function buildRichTextFromSpans(
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

async function buildStyledText(
  plugin: RNPlugin,
  text: string,
  style?: RemStyleInput
): Promise<RichTextInterface> {
  return buildRichTextFromSpans(plugin, [
    {
      text,
      styles: {
        color: style?.color,
        highlight: style?.highlight,
      },
    },
  ]);
}

async function getRemPlainString(plugin: RNPlugin, rem: Rem): Promise<string> {
  return runSdkOperation('richText.toString', () => plugin.richText.toString(rem.text));
}

function validateTextRange(range: { start: number; end: number }, textLength: number) {
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

function rangeInputFromArgs(
  args: Pick<SetTextSpanColorArgs | SetTextSpanHighlightArgs, 'range' | 'start' | 'end' | 'text' | 'occurrence'>
): { start?: number; end?: number; text?: string; occurrence?: number } {
  return {
    start: args.start ?? args.range?.start,
    end: args.end ?? args.range?.end,
    text: args.text,
    occurrence: args.occurrence,
  };
}

async function setTextColorInRange(
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

async function setTextHighlightInRange(
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

async function applyRemStyle(plugin: RNPlugin, rem: Rem, style: RemStyleInput | undefined) {
  if (!style) {
    return;
  }

  if (style.headingLevel) {
    const headingLevel = style.headingLevel;
    await runSdkOperation('rem.setFontSize', () => rem.setFontSize(normalizeHeading(headingLevel)));
  }

  if (style.hideBullet !== undefined) {
    await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(!style.hideBullet));
  }

  if (style.remType && style.remType !== 'normal') {
    const remType = style.remType;
    await runSdkOperation('rem.setType', () => rem.setType(getRemTypeValue(remType)));
  }

  if (style.highlight && style.highlight !== 'default') {
    const color = getColorFormat(style.highlight);
    if (color) {
      await runSdkOperation('rem.setHighlightColor', () => rem.setHighlightColor(color as never));
    }
  }

  if (style.color && style.color !== 'default') {
    const plain = await getRemPlainString(plugin, rem);
    if (plain.length > 0) {
      await setTextColorInRange(
        plugin,
        rem,
        { start: 0, end: plain.length, resolvedPlainText: plain },
        style.color,
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

async function createRemWithRichText(
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

function simpleTreeToStyledNode(node: ValidatedTreeNode): StyledRemTreeNode {
  return {
    type: 'rem',
    text: node.title,
    children: node.children.map((child) => simpleTreeToStyledNode(child)),
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

export async function updateRemRich(
  plugin: RNPlugin,
  args: UpdateRemRichArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const richText = await buildRichTextFromSpans(plugin, args.richText);

  await runSdkOperation('rem.setText', () => rem.setText(richText));

  return {
    remId: rem._id,
    status: 'updated_rich',
  };
}

export async function setRemHeadingLevel(
  plugin: RNPlugin,
  args: SetRemHeadingLevelArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  await runSdkOperation('rem.setFontSize', () => rem.setFontSize(normalizeHeading(args.level)));
  return { remId: rem._id, status: 'heading_set' };
}

export async function setRemTextColor(
  plugin: RNPlugin,
  args: SetRemTextColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  try {
    const formatted = await applyTextColorToAllText(plugin, rem.text, args.color);
    await runSdkOperation('rem.setText', () => rem.setText(formatted.richText));
    const plain = await getRemPlainString(plugin, rem);
    return {
      remId: rem._id,
      status: 'text_color_set',
      ok: true,
      requestedColor: formatted.requestedColor,
      normalizedColor: formatted.normalizedColor,
      methodUsed: formatted.methodUsed,
      verification: {
        plainText: plain,
        textLength: plain.length,
      },
    };
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function setTextSpanColor(
  plugin: RNPlugin,
  args: SetTextSpanColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  try {
    const range = await resolveRangeFromPlainText(
      plugin,
      rem.text,
      rangeInputFromArgs(args).start,
      rangeInputFromArgs(args).end,
      rangeInputFromArgs(args).text,
      rangeInputFromArgs(args).occurrence ?? 1
    );
    return setTextColorInRange(plugin, rem, range, args.color, 'span_color_set');
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function setTextSpanHighlight(
  plugin: RNPlugin,
  args: SetTextSpanHighlightArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const rangeArgs = rangeInputFromArgs(args);
  try {
    const range = await resolveRangeFromPlainText(
      plugin,
      rem.text,
      rangeArgs.start,
      rangeArgs.end,
      rangeArgs.text,
      rangeArgs.occurrence ?? 1
    );
    return setTextHighlightInRange(plugin, rem, range, args.color);
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function setRemHighlightColor(
  plugin: RNPlugin,
  args: SetRemHighlightColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const color = remColorNameFromString(args.color);
  const format = getColorFormat(color);
  if (!format) {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      'The installed RemNote SDK does not expose clearing whole-Rem highlight color.'
    );
  }

  await runSdkOperation('rem.setHighlightColor', () =>
    rem.setHighlightColor(format as never)
  );

  return { remId: rem._id, status: 'highlight_set' };
}

export async function setRemType(
  plugin: RNPlugin,
  args: SetRemTypeArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  if (args.type === 'normal') {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      'The installed RemNote SDK does not expose a reliable reset to normal Rem type.'
    );
  }

  await runSdkOperation('rem.setType', () => rem.setType(getRemTypeValue(args.type)));
  return { remId: rem._id, status: 'rem_type_set' };
}

export async function setHideBullet(
  plugin: RNPlugin,
  args: SetHideBulletArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(!args.hideBullet));
  return { remId: rem._id, status: 'hide_bullet_set' };
}

export async function clearRemFormatting(
  plugin: RNPlugin,
  args: ClearRemFormattingArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const plain = await getRemPlainString(plugin, rem);
  const richText = await buildRichTextFromSpans(plugin, [{ text: plain || ' ' }]);
  const warnings: string[] = [];
  const cleared: NonNullable<FormatRemResult['cleared']> = {};
  const unsupported: NonNullable<FormatRemResult['unsupported']> = {};

  await runSdkOperation('rem.setText', () => rem.setText(richText));
  cleared.textFormatting = true;

  await runSdkOperation('rem.setFontSize', () => rem.setFontSize(undefined));
  cleared.heading = true;

  await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(true));
  cleared.hideBullet = true;

  cleared.wholeRemHighlight = false;
  warnings.push('Whole-Rem highlight clearing is not exposed by installed @remnote/plugin-sdk 0.0.14.');

  if (rem.type === RemType.CONCEPT || rem.type === RemType.DESCRIPTOR) {
    cleared.remType = false;
    unsupported.remTypeReset = true;
    unsupported.reason = 'The installed RemNote SDK does not expose a reliable concept/descriptor reset to normal type.';
    warnings.push(unsupported.reason);
  } else {
    cleared.remType = true;
  }

  return {
    remId: rem._id,
    status: 'formatting_cleared',
    ok: !unsupported.remTypeReset && warnings.length === 0,
    cleared,
    unsupported,
    warnings,
  };
}

async function resolveCommandTarget(plugin: RNPlugin, args: ApplyRemnoteCommandArgs): Promise<Rem> {
  if (args.target.mode === 'focused_rem') {
    const focused = await plugin.focus.getFocusedRem();
    if (!focused) {
      throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
    }
    return focused;
  }

  if (args.target.mode === 'selected_rem') {
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
        'selected_rem command target requires exactly one selected Rem.',
        { selectedRemCount: selectedRemIds.length }
      );
    }
    return findRequiredRem(plugin, selectedRemIds[0], 'Target');
  }

  const remId = args.target.remId?.trim();
  if (!remId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'rem_id command target requires remId.');
  }
  return findRequiredRem(plugin, remId, 'Target');
}

function rememberRemnoteCommandResult(idempotencyKey: string, result: ApplyRemnoteCommandResult) {
  REMNOTE_COMMAND_RESULT_CACHE.delete(idempotencyKey);
  REMNOTE_COMMAND_RESULT_CACHE.set(idempotencyKey, result);

  while (REMNOTE_COMMAND_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = REMNOTE_COMMAND_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    REMNOTE_COMMAND_RESULT_CACHE.delete(oldestKey);
  }
}

function resultForCommand(
  rem: Rem,
  command: RemnoteCommandName,
  idempotencyKey?: string,
  status: ApplyRemnoteCommandResult['status'] = 'command_applied'
): ApplyRemnoteCommandResult {
  return {
    remId: rem._id,
    command,
    status,
    ...(idempotencyKey ? { idempotencyKey } : {}),
  };
}

async function appendMathToRem(
  plugin: RNPlugin,
  rem: Rem,
  latex: string,
  block: boolean,
  prefixText?: string
) {
  const currentText = await getRemPlainString(plugin, rem);
  const spans: RichTextSpanInput[] = [];
  if (currentText) {
    spans.push({ text: `${currentText} ` });
  }
  if (prefixText?.trim()) {
    spans.push({ text: `${prefixText.trim()} ` });
  }
  spans.push({ type: block ? 'mathBlock' : 'inlineMath', latex });
  const richText = await buildRichTextFromSpans(plugin, spans);
  await runSdkOperation('rem.setText', () => rem.setText(richText));
}

export async function applyRemnoteCommand(
  plugin: RNPlugin,
  args: ApplyRemnoteCommandArgs
): Promise<ApplyRemnoteCommandResult> {
  const idempotencyKey = args.idempotencyKey?.trim();
  if (idempotencyKey) {
    const cached = REMNOTE_COMMAND_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
      };
    }
  }

  const rem = await resolveCommandTarget(plugin, args);
  const command = args.command;

  switch (command) {
    case 'heading_1':
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize('H1'));
      break;
    case 'heading_2':
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize('H2'));
      break;
    case 'heading_3':
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize('H3'));
      break;
    case 'normal_text':
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize(undefined));
      break;
    case 'highlight_yellow':
    case 'highlight_blue':
    case 'highlight_green':
    case 'highlight_red': {
      const colorName = command.replace('highlight_', '') as RemColorName;
      const format = getColorFormat(colorName);
      if (!format) {
        throw new RemnoteWriteError('SDK_UNSUPPORTED', `Highlight ${colorName} is not supported by this SDK.`);
      }
      await runSdkOperation('rem.setHighlightColor', () => rem.setHighlightColor(format as never));
      break;
    }
    case 'hide_bullet':
      await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(false));
      break;
    case 'show_bullet':
      await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(true));
      break;
    case 'make_concept':
      await runSdkOperation('rem.setType', () => rem.setType(SetRemType.CONCEPT));
      break;
    case 'make_descriptor':
      await runSdkOperation('rem.setType', () => rem.setType(SetRemType.DESCRIPTOR));
      break;
    case 'make_normal':
      throw new RemnoteWriteError(
        'SDK_UNSUPPORTED',
        'The installed RemNote SDK does not expose a reliable reset to normal Rem type.'
      );
    case 'insert_inline_math':
    case 'insert_math_block': {
      const latex = args.args?.latex?.trim();
      if (!latex) {
        throw new RemnoteWriteError('INVALID_ARGS', `${command} requires args.latex.`);
      }
      await appendMathToRem(plugin, rem, latex, command === 'insert_math_block', args.args?.text);
      break;
    }
    default:
      throw new RemnoteWriteError('INVALID_ARGS', `Unsupported RemNote command "${command}".`);
  }

  const result = resultForCommand(rem, command, idempotencyKey);
  if (idempotencyKey) {
    rememberRemnoteCommandResult(idempotencyKey, result);
  }
  return result;
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
    parentId: parent._id,
    orderedChildRemIds: requestedIds,
    orderedChildIds: requestedIds,
    status: 'reordered',
  };
}

export async function createRemTree(
  plugin: RNPlugin,
  args: CreateRemTreeArgs
): Promise<CreateRemTreeResult> {
  const validationState: TreeValidationState = { nodeCount: 0 };
  const tree = validateTreeNode(args.tree, 1, validationState);

  try {
    const created = await createStyledRemTree(plugin, {
      parentId: args.parentId,
      position: args.position ?? 'end',
      tree: simpleTreeToStyledNode(tree),
    });
    return {
      rootCreatedRemId: created.rootCreatedRemId,
      createdNodeCount: created.createdNodeCount,
      createdRemIds: created.createdRemIds,
      rootInsertIndex: created.rootInsertIndex,
      rootInsertPosition: args.position ?? 'end',
      status: 'created_tree',
    };
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      const createdRemIds = readCreatedRemIdsFromError(error);
      throw new RemnoteWriteError(error.code, error.message, {
        originalDetails: error.details,
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        partialExecution: {
          ...getPartialExecutionDetails(error.details),
          createdNodeCount: createdRemIds.length,
          createdRemIds,
          failedStage: 'create_rem_tree',
          rollbackStatus: 'not_attempted',
        },
      });
    }

    const createdRemIds: string[] = [];
    throw new RemnoteWriteError('SDK_ERROR', 'RemNote tree creation failed.', {
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      partialExecution: {
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        failedStage: 'create_rem_tree',
        rollbackStatus: 'not_attempted',
      },
      sdkMessage: getSdkErrorMessage(error),
    });
  }
}

function normalizeStyledNode(
  rawNode: StyledRemTreeNode,
  depth: number,
  state: TreeValidationState
): StyledRemTreeNode {
  if (typeof rawNode !== 'object' || rawNode === null || Array.isArray(rawNode)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Styled tree node must be an object.');
  }

  if (depth > CREATE_TREE_MAX_DEPTH) {
    throw new RemnoteWriteError('INVALID_ARGS', `Styled tree depth exceeds ${CREATE_TREE_MAX_DEPTH}.`);
  }

  state.nodeCount += 1;
  if (state.nodeCount > CREATE_TREE_MAX_NODES) {
    throw new RemnoteWriteError('INVALID_ARGS', `Styled tree node count exceeds ${CREATE_TREE_MAX_NODES}.`);
  }

  const children = rawNode.children ?? [];
  if (!Array.isArray(children)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Styled tree node children must be an array.');
  }

  return {
    ...rawNode,
    children: children.map((child) => normalizeStyledNode(child, depth + 1, state)),
  };
}

async function createFlashcardRem(
  plugin: RNPlugin,
  parent: Rem,
  index: number,
  cardType: CreateFlashcardResult['cardType'],
  front: string,
  back: string,
  direction: PracticeDirection = 'both',
  remType?: RemTypeName
): Promise<{ rem: Rem; childIds: string[] }> {
  const frontRichText = await buildRichTextFromSpans(plugin, [{ text: front }]);
  const backRichText = await buildRichTextFromSpans(plugin, [{ text: back }]);
  const rem = await createRemWithRichText(plugin, frontRichText, parent, index);
  const childIds: string[] = [];

  if (remType) {
    await runSdkOperation('rem.setType', () => rem.setType(getRemTypeValue(remType)));
  }

  await runSdkOperation('rem.setBackText', () => rem.setBackText(backRichText));
  await runSdkOperation('rem.setEnablePractice', () => rem.setEnablePractice(true));
  await runSdkOperation('rem.setPracticeDirection', () => rem.setPracticeDirection(direction));

  if (cardType === 'multiple_choice' || cardType === 'list_answer') {
    const choices = back
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    for (let childIndex = 0; childIndex < choices.length; childIndex += 1) {
      const childText = await buildRichTextFromSpans(plugin, [{ text: choices[childIndex] }]);
      const child = await createRemWithRichText(plugin, childText, rem, childIndex);
      await runSdkOperation('rem.setIsCardItem', () => child.setIsCardItem(true));
      childIds.push(child._id);
    }
  }

  return { rem, childIds };
}

export async function createBasicFlashcard(
  plugin: RNPlugin,
  args: CreateFlashcardArgs,
  cardType: CreateFlashcardResult['cardType'] = 'basic',
  remType?: RemTypeName
): Promise<CreateFlashcardResult> {
  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const insertIndex = await getFreshInsertIndex(plugin, parent, 'end');
  const { rem, childIds } = await createFlashcardRem(
    plugin,
    parent,
    insertIndex,
    cardType,
    args.front,
    args.back,
    args.direction ?? 'both',
    remType
  );

  return {
    createdRemId: rem._id,
    parentId: parent._id,
    cardType,
    direction: args.direction ?? 'both',
    ...(childIds.length ? { createdChildRemIds: childIds } : {}),
    status: 'created_flashcard',
  };
}

export async function createClozeCard(
  plugin: RNPlugin,
  args: CreateClozeCardArgs
): Promise<CreateFlashcardResult> {
  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const insertIndex = await getFreshInsertIndex(plugin, parent, 'end');
  const plainText = args.text;
  let start = args.clozeText ? plainText.indexOf(args.clozeText) : -1;
  let end = start >= 0 && args.clozeText ? start + args.clozeText.length : -1;

  if (start < 0) {
    if (args.clozeText) {
      throw new RemnoteWriteError('INVALID_ARGS', 'clozeText was not found in text.', {
        clozeText: args.clozeText,
      });
    }

    const match = /\{\{(.+?)\}\}/.exec(plainText);
    if (match?.index !== undefined) {
      start = match.index;
      end = match.index + match[0].length;
    } else {
      start = 0;
      end = plainText.length;
    }
  }

  const baseRichText = await buildRichTextFromSpans(plugin, [{ text: plainText }]);
  let clozeRichText: RichTextInterface;
  try {
    clozeRichText = (await applyClozeToRange(plugin, baseRichText, start, end)).richText;
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
  const rem = await createRemWithRichText(plugin, clozeRichText, parent, insertIndex);
  await runSdkOperation('rem.setEnablePractice', () => rem.setEnablePractice(true));
  await runSdkOperation('rem.setPracticeDirection', () => rem.setPracticeDirection(args.direction ?? 'both'));

  return {
    createdRemId: rem._id,
    parentId: parent._id,
    cardType: 'cloze',
    direction: args.direction ?? 'both',
    status: 'created_flashcard',
  };
}

export async function createMultipleChoiceCard(
  plugin: RNPlugin,
  args: CreateMultipleChoiceCardArgs
): Promise<CreateFlashcardResult> {
  const back = [`Answer: ${args.correctChoice}`, ...args.choices.map((choice) => `Choice: ${choice}`)].join('\n');
  return createBasicFlashcard(
    plugin,
    {
      parentId: args.parentId,
      front: args.question,
      back,
      direction: args.direction ?? 'forward',
    },
    'multiple_choice'
  );
}

export async function createListAnswerCard(
  plugin: RNPlugin,
  args: CreateListAnswerCardArgs
): Promise<CreateFlashcardResult> {
  return createBasicFlashcard(
    plugin,
    {
      parentId: args.parentId,
      front: args.prompt,
      back: args.items.join('\n'),
      direction: args.direction ?? 'forward',
    },
    'list_answer'
  );
}

export async function structuredWriteEngine(
  plugin: RNPlugin,
  args: CreateStyledRemTreeArgs
): Promise<CreateStyledRemTreeResult> {
  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const validationState: TreeValidationState = { nodeCount: 0 };
  const tree = normalizeStyledNode(args.tree, 1, validationState);
  const createdRemIds: string[] = [];
  const createdNodes: CreateStyledRemTreeResult['createdNodes'] = [];

  async function createNode(
    node: StyledRemTreeNode,
    nodeParent: Rem,
    index: number,
    depth: number
  ): Promise<Rem> {
    const type: StyledRemTreeNodeType = node.type ?? 'rem';
    let created: Rem;
    let childIds: string[] = [];

    if (type === 'basicFlashcard' || type === 'conceptCard' || type === 'descriptorCard') {
      const remType = type === 'conceptCard' ? 'concept' : type === 'descriptorCard' ? 'descriptor' : undefined;
      const card = await createFlashcardRem(
        plugin,
        nodeParent,
        index,
        type === 'conceptCard' ? 'concept' : type === 'descriptorCard' ? 'descriptor' : 'basic',
        node.front ?? node.title ?? node.text ?? '',
        node.back ?? node.answer ?? '',
        node.direction ?? 'both',
        remType
      );
      created = card.rem;
      childIds = card.childIds;
    } else if (type === 'multipleChoiceCard') {
      const choices = node.choices ?? [];
      const back = [`Answer: ${node.correctChoice ?? node.answer ?? ''}`, ...choices.map((choice) => `Choice: ${choice}`)].join('\n');
      const card = await createFlashcardRem(
        plugin,
        nodeParent,
        index,
        'multiple_choice',
        node.front ?? node.title ?? node.text ?? '',
        back,
        node.direction ?? 'forward'
      );
      created = card.rem;
      childIds = card.childIds;
    } else if (type === 'listAnswerCard') {
      const card = await createFlashcardRem(
        plugin,
        nodeParent,
        index,
        'list_answer',
        node.front ?? node.title ?? node.text ?? '',
        (node.items ?? []).join('\n'),
        node.direction ?? 'forward'
      );
      created = card.rem;
      childIds = card.childIds;
    } else if (type === 'clozeCard') {
      const text = node.text ?? node.title ?? '';
      const richText = await buildRichTextFromSpans(plugin, [{ text }]);
      created = await createRemWithRichText(plugin, richText, nodeParent, index);
      const plain = await getRemPlainString(plugin, created);
      const clozeText = node.clozeText ?? plain;
      const start = plain.indexOf(clozeText);
      if (start >= 0) {
        let next: RichTextInterface;
        try {
          next = (await applyClozeToRange(plugin, created.text, start, start + clozeText.length)).richText;
        } catch (error: unknown) {
          throw mapFormattingError(error);
        }
        await runSdkOperation('rem.setText', () => created.setText(next));
      } else if (node.clozeText) {
        throw new RemnoteWriteError('INVALID_ARGS', 'clozeText was not found in clozeCard text.', {
          clozeText: node.clozeText,
        });
      }
      await runSdkOperation('rem.setEnablePractice', () => created.setEnablePractice(true));
      await runSdkOperation('rem.setPracticeDirection', () => created.setPracticeDirection(node.direction ?? 'both'));
    } else {
      const richText =
        node.richText && node.richText.length
          ? await buildRichTextFromSpans(plugin, node.richText)
          : type === 'mathBlock' || type === 'inlineMath'
            ? await buildRichTextFromSpans(plugin, [
                { type, latex: node.latex ?? node.text ?? node.title ?? '' },
              ])
            : await buildStyledText(plugin, node.text ?? node.title ?? '', node.style);
      created = await createRemWithRichText(plugin, richText, nodeParent, index);
    }

    await applyRemStyle(plugin, created, node.style);
    createdRemIds.push(created._id, ...childIds);
    createdNodes.push({
      remId: created._id,
      parentId: nodeParent._id,
      depth,
      index,
      type,
    });

    const children = node.children ?? [];
    for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
      await createNode(children[childIndex], created, childIndex, depth + 1);
    }

    return created;
  }

  try {
    const rootInsertIndex = await getFreshInsertIndex(plugin, parent, args.position ?? 'end');
    const root = await createNode(tree, parent, rootInsertIndex, 0);

    return {
      rootCreatedRemId: root._id,
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      createdNodes,
      rootInsertIndex,
      rootInsertPosition: args.position ?? 'end',
      status: 'created_styled_tree',
    };
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      throw new RemnoteWriteError(error.code, error.message, {
        originalDetails: error.details,
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        partialExecution: {
          ...getPartialExecutionDetails(error.details),
          createdNodeCount: createdRemIds.length,
          createdRemIds,
          failedStage: 'create_styled_rem_tree',
          rollbackStatus: 'not_attempted',
        },
      });
    }

    throw new RemnoteWriteError('SDK_ERROR', 'RemNote styled tree creation failed.', {
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      partialExecution: {
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        failedStage: 'create_styled_rem_tree',
        rollbackStatus: 'not_attempted',
      },
      sdkMessage: getSdkErrorMessage(error),
    });
  }
}

function rememberStructuredBatchResult(idempotencyKey: string, result: ApplyStructuredNoteBatchResult) {
  STRUCTURED_BATCH_RESULT_CACHE.delete(idempotencyKey);
  STRUCTURED_BATCH_RESULT_CACHE.set(idempotencyKey, result);

  while (STRUCTURED_BATCH_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = STRUCTURED_BATCH_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    STRUCTURED_BATCH_RESULT_CACHE.delete(oldestKey);
  }
}

function readCreatedRemIdsFromError(error: RemnoteWriteError): string[] {
  const details = typeof error.details === 'object' && error.details !== null
    ? (error.details as Record<string, unknown>)
    : {};
  const direct = Array.isArray(details.createdRemIds) ? details.createdRemIds : [];
  const partial = getPartialExecutionDetails(error.details);
  const partialIds = Array.isArray(partial.createdRemIds) ? partial.createdRemIds : [];
  return Array.from(
    new Set(
      [...direct, ...partialIds].filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );
}

async function rollbackCreatedRems(plugin: RNPlugin, createdRemIds: string[]) {
  const removedRemIds: string[] = [];
  const failedRemIds: string[] = [];

  for (const remId of [...createdRemIds].reverse()) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      continue;
    }

    try {
      await runSdkOperation('rem.remove', () => rem.remove());
      removedRemIds.push(remId);
    } catch {
      failedRemIds.push(remId);
    }
  }

  return {
    status: failedRemIds.length ? 'failed' as const : 'completed' as const,
    removedRemIds,
    failedRemIds,
  };
}

async function verifyCreatedRems(
  plugin: RNPlugin,
  createdRemIds: string[],
  rootCreatedRemId?: string
): Promise<ApplyStructuredNoteBatchResult['verification']> {
  const checkedRemIds: string[] = [];
  const missingRemIds: string[] = [];
  let rootPlainText: string | undefined;

  for (const remId of createdRemIds) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      missingRemIds.push(remId);
      continue;
    }

    checkedRemIds.push(remId);
    if (rootCreatedRemId && remId === rootCreatedRemId) {
      rootPlainText = await getRemPlainString(plugin, rem);
    }
  }

  return {
    ok: missingRemIds.length === 0,
    checkedRemIds,
    missingRemIds,
    ...(rootPlainText !== undefined ? { rootPlainText } : {}),
  };
}

export async function createStyledRemTree(
  plugin: RNPlugin,
  args: CreateStyledRemTreeArgs
): Promise<CreateStyledRemTreeResult> {
  return structuredWriteEngine(plugin, args);
}

async function applyOneStyleOperation(
  plugin: RNPlugin,
  operation: ApplyStylePlanArgs['operations'][number]
): Promise<unknown> {
  switch (operation.type) {
    case 'heading':
      return setRemHeadingLevel(plugin, {
        remId: operation.remId,
        level: headingLevelFromString(operation.value),
      });
    case 'whole_rem_highlight':
      return setRemHighlightColor(plugin, {
        remId: operation.remId,
        color: remColorNameFromString(operation.value),
      });
    case 'text_color_span':
      return setTextSpanColor(plugin, {
        remId: operation.remId,
        color: operation.value,
        start: operation.start,
        end: operation.end,
        text: operation.text,
        occurrence: operation.occurrence,
      });
    case 'text_highlight_span':
      return setTextSpanHighlight(plugin, {
        remId: operation.remId,
        color: operation.value,
        start: operation.start,
        end: operation.end,
        text: operation.text,
        occurrence: operation.occurrence,
      });
    case 'bold_span':
    case 'italic_span': {
      const rem = await findRequiredRem(plugin, operation.remId, 'Target');
      const range = await resolveRangeFromPlainText(
        plugin,
        rem.text,
        operation.start,
        operation.end,
        operation.text,
        operation.occurrence ?? 1
      );
      const richText = await applyFormatsToRichTextRange(
        plugin,
        rem.text,
        range.start,
        range.end,
        [operation.type === 'bold_span' ? 'bold' : 'italic']
      );
      await runSdkOperation('rem.setText', () => rem.setText(richText));
      return {
        remId: rem._id,
        status: 'updated_rich',
        ok: true,
        resolvedPlainText: range.resolvedPlainText,
        start: range.start,
        end: range.end,
        methodUsed: 'rich_text_rebuild',
      } as FormatRemResult;
    }
    case 'math_conversion':
      throw new RemnoteWriteError(
        'SDK_UNSUPPORTED',
        'apply_style_plan math_conversion is not safe for existing arbitrary rich text in installed SDK. Use update_rem_rich or create_polished_note_tree with math spans.'
      );
    default:
      throw new RemnoteWriteError('INVALID_ARGS', `Unsupported style operation "${operation.type}".`);
  }
}

export async function applyStylePlan(
  plugin: RNPlugin,
  args: ApplyStylePlanArgs
): Promise<ApplyStylePlanResult> {
  const continueOnError = args.continueOnError ?? true;
  const operations: ApplyStylePlanResult['operations'] = [];

  for (let index = 0; index < args.operations.length; index += 1) {
    const operation = args.operations[index];
    try {
      const result = await applyOneStyleOperation(plugin, operation);
      operations.push({
        index,
        remId: operation.remId,
        type: operation.type,
        status: 'applied',
        result,
      });
    } catch (error: unknown) {
      const mapped = mapFormattingError(error);
      operations.push({
        index,
        remId: operation.remId,
        type: operation.type,
        status: mapped.code === 'SDK_UNSUPPORTED' ? 'unsupported' : 'failed',
        error: {
          code: mapped.code,
          message: mapped.message,
          details: mapped.details,
        },
      });
      if (!continueOnError) {
        break;
      }
    }
  }

  const failed = operations.some((operation) => operation.status === 'failed');
  const unsupported = operations.some((operation) => operation.status === 'unsupported');
  return {
    status: failed ? 'failed' : unsupported ? 'partial' : 'applied',
    operations,
    continueOnError,
    verifyAfterWrite: args.verifyAfterWrite ?? false,
  };
}

function rememberPolishedTreeResult(idempotencyKey: string, result: CreatePolishedNoteTreeResult) {
  POLISHED_TREE_RESULT_CACHE.delete(idempotencyKey);
  POLISHED_TREE_RESULT_CACHE.set(idempotencyKey, result);

  while (POLISHED_TREE_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = POLISHED_TREE_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    POLISHED_TREE_RESULT_CACHE.delete(oldestKey);
  }
}

export async function createPolishedNoteTree(
  plugin: RNPlugin,
  args: CreatePolishedNoteTreeArgs
): Promise<CreatePolishedNoteTreeResult> {
  const idempotencyKey = args.idempotencyKey?.trim();
  if (idempotencyKey) {
    const cached = POLISHED_TREE_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return cached;
    }
  }

  const created = await createStyledRemTree(plugin, {
    parentId: args.parentId,
    position: 'end',
    tree: args.tree,
  });
  const stylePlan = args.stylingPlan?.operations?.length
    ? await applyStylePlan(plugin, {
        operations: args.stylingPlan.operations,
        continueOnError: true,
        verifyAfterWrite: args.verifyAfterWrite,
      })
    : undefined;
  const verification = args.verifyAfterWrite
    ? await verifyCreatedRems(plugin, created.createdRemIds, created.rootCreatedRemId)
    : undefined;
  const result: CreatePolishedNoteTreeResult = {
    ...created,
    ...(stylePlan ? { stylePlan } : {}),
    ...(verification ? { verification } : {}),
    ...(idempotencyKey ? { idempotencyKey } : {}),
  };

  if (idempotencyKey) {
    rememberPolishedTreeResult(idempotencyKey, result);
  }

  return result;
}

const RICH_TEXT_COLOR_NUMBERS: Record<string, number> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  purple: 5,
  blue: 6,
};

function richTextHasSpanField(
  richText: RichTextInterface | undefined,
  text: string | undefined,
  color: string,
  field: typeof RICH_TEXT_FONT_COLOR_FIELD | typeof RICH_TEXT_HIGHLIGHT_FIELD
): boolean {
  if (!richText || !text) {
    return false;
  }

  const expectedColor = RICH_TEXT_COLOR_NUMBERS[color.trim().toLowerCase()];
  if (!expectedColor) {
    return false;
  }

  return richText.some((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return false;
    }

    const record = item as Record<string, unknown>;
    return typeof record.text === 'string' && record.text.includes(text) && record[field] === expectedColor;
  });
}

export async function verifyNoteDesign(
  plugin: RNPlugin,
  args: VerifyNoteDesignArgs
): Promise<VerifyNoteDesignResult> {
  const checkedRemIds: string[] = [];
  const mismatches: VerifyNoteDesignResult['mismatches'] = [];
  const unsupportedChecks: VerifyNoteDesignResult['unsupportedChecks'] = [];
  const entries = Object.entries(args.expectedStyleMap) as Array<[string, ExpectedStyleMapEntry]>;
  const idsToCheck: Array<[string, ExpectedStyleMapEntry]> = entries.length
    ? entries
    : [[args.rootRemId, args.expectedStyleMap[args.rootRemId] ?? {}]];

  for (const [remId, expected] of idsToCheck) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      mismatches.push({
        remId,
        type: 'missing_rem',
        expected: remId,
        actual: null,
        message: 'Expected Rem is missing.',
      });
      continue;
    }

    checkedRemIds.push(remId);
    const plainText = await getRemPlainString(plugin, rem);
    if (expected.plainText !== undefined && plainText !== expected.plainText) {
      mismatches.push({
        remId,
        type: 'plainText',
        expected: expected.plainText,
        actual: plainText,
        message: 'Plain text mismatch.',
      });
    }

    if (expected.headingLevel) {
      const actual = (await rem.getFontSize().catch(() => undefined)) ?? 'normal';
      if (actual !== expected.headingLevel) {
        mismatches.push({
          remId,
          type: 'headingLevel',
          expected: expected.headingLevel,
          actual,
          message: 'Heading level mismatch.',
        });
      }
    }

    if (expected.wholeRemHighlight) {
      const actual = String(await rem.getHighlightColor().catch(() => 'default')).toLowerCase();
      if (actual !== expected.wholeRemHighlight.toLowerCase()) {
        mismatches.push({
          remId,
          type: 'wholeRemHighlight',
          expected: expected.wholeRemHighlight,
          actual,
          message: 'Whole-Rem highlight mismatch.',
        });
      }
    }

    for (const span of expected.textColorSpans ?? []) {
      if (!richTextHasSpanField(rem.text, span.text, span.color, RICH_TEXT_FONT_COLOR_FIELD)) {
        mismatches.push({
          remId,
          type: 'textColorSpan',
          expected: span,
          message: 'Expected colored text span was not found in readable rich text fields.',
        });
      }
    }

    for (const span of expected.textHighlightSpans ?? []) {
      if (!richTextHasSpanField(rem.text, span.text, span.color, RICH_TEXT_HIGHLIGHT_FIELD)) {
        mismatches.push({
          remId,
          type: 'textHighlightSpan',
          expected: span,
          message: 'Expected highlighted text span was not found in raw rich text highlight field.',
        });
      }
    }

    if (expected.childOrder) {
      const children = await rem.getChildrenRem();
      const actual = children.map((child) => child._id);
      if (JSON.stringify(actual) !== JSON.stringify(expected.childOrder)) {
        mismatches.push({
          remId,
          type: 'childOrder',
          expected: expected.childOrder,
          actual,
          message: 'Child order mismatch.',
        });
      }
    }
  }

  return {
    rootRemId: args.rootRemId,
    ok: mismatches.length === 0,
    checkedRemIds,
    mismatches,
    unsupportedChecks,
  };
}

export async function applyStructuredNoteBatch(
  plugin: RNPlugin,
  args: ApplyStructuredNoteBatchArgs
): Promise<ApplyStructuredNoteBatchResult> {
  const operation = args.operation ?? 'create_child_tree';
  const target = args.target ?? {
    mode: 'parent_child' as const,
    parentId: args.parentId ?? null,
  };
  const noteRoot = args.note?.root ?? args.root;
  const rawNoteChildren = args.note?.children;
  const noteChildren = Array.isArray(rawNoteChildren) ? rawNoteChildren : [];
  if (!noteRoot && !noteChildren.length) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Structured note batch requires root, note.root, or note.children.');
  }
  if (!noteRoot && (operation === 'create_child_tree' || operation === 'update_root_and_replace_children')) {
    throw new RemnoteWriteError('INVALID_ARGS', `${operation} requires root or note.root.`);
  }

  const validationState: TreeValidationState = { nodeCount: 0 };
  const root = noteRoot
    ? normalizeStyledNode(
        {
          ...noteRoot,
          children: [
            ...(Array.isArray(noteRoot.children) ? noteRoot.children : []),
            ...noteChildren,
          ],
        },
        1,
        validationState
      )
    : undefined;
  const childNodes = root?.children ?? noteChildren.map((child) => normalizeStyledNode(child, 1, validationState));
  const idempotencyKey = args.idempotencyKey?.trim();
  const rollbackOnFailure = args.rollbackOnFailure ?? true;
  const verifyAfterWrite = args.verifyAfterWrite ?? false;
  const operationId = `structured-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (idempotencyKey && !args.dryRun) {
    const cached = STRUCTURED_BATCH_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
        dryRun: false,
      };
    }
  }

  const targetRemId = target.remId ?? null;
  const requestedParentId = target.parentId ?? args.parentId ?? null;
  const parentId =
    operation === 'create_child_tree'
      ? requestedParentId ?? targetRemId
      : targetRemId ?? requestedParentId;
  if (!parentId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Structured note batch target did not resolve to a Rem ID.');
  }

  const parent = await findRequiredRem(
    plugin,
    parentId,
    operation === 'create_child_tree' ? 'Parent' : 'Target',
    operation === 'create_child_tree' ? 'PARENT_NOT_FOUND' : 'REM_NOT_FOUND'
  );

  if (args.dryRun) {
    return {
      operationId,
      status: 'dry_run',
      targetRemId: operation === 'create_child_tree' ? undefined : parent._id,
      parentId: operation === 'create_child_tree' ? parent._id : undefined,
      operation,
      plannedNodeCount: validationState.nodeCount,
      createdNodeCount: 0,
      createdRemIds: [],
      updatedRemIds: [],
      deletedRemIds: [],
      dryRun: true,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      rollbackOnFailure,
      verifyAfterWrite,
    };
  }

  const createdRemIds: string[] = [];
  const updatedRemIds: string[] = [];
  const deletedRemIds: string[] = [];

  async function updateExistingRoot(rem: Rem, node: StyledRemTreeNode) {
    const richText =
      node.richText && node.richText.length
        ? await buildRichTextFromSpans(plugin, node.richText)
        : node.type === 'mathBlock' || node.type === 'inlineMath'
          ? await buildRichTextFromSpans(plugin, [
              { type: node.type, latex: node.latex ?? node.text ?? node.title ?? '' },
            ])
          : await buildStyledText(plugin, node.text ?? node.title ?? '', node.style);
    await runSdkOperation('rem.setText', () => rem.setText(richText));
    await applyRemStyle(plugin, rem, node.style);
    updatedRemIds.push(rem._id);
  }

  async function deleteDirectChildren(rem: Rem) {
    const children = await runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem());
    for (const child of children) {
      const descendants = await runSdkOperation('rem.getDescendants', () => child.getDescendants());
      deletedRemIds.push(child._id, ...descendants.map((descendant) => descendant._id));
      await runSdkOperation('rem.remove', () => child.remove());
    }
  }

  async function createChildNodes(rem: Rem, nodes: StyledRemTreeNode[]) {
    for (let index = 0; index < nodes.length; index += 1) {
      const created = await structuredWriteEngine(plugin, {
        parentId: rem._id,
        position: 'end',
        tree: nodes[index],
      });
      createdRemIds.push(...created.createdRemIds);
    }
  }

  try {
    let rootCreatedRemId: string | undefined;
    let rootInsertIndex: number | undefined;
    let rootInsertPosition: 'start' | 'end' | undefined;

    if (operation === 'create_child_tree') {
      if (!root) {
        throw new RemnoteWriteError('INVALID_ARGS', 'create_child_tree requires root or note.root.');
      }
      const created = await structuredWriteEngine(plugin, {
        parentId: parent._id,
        position: args.position ?? 'end',
        tree: root,
      });
      createdRemIds.push(...created.createdRemIds);
      rootCreatedRemId = created.rootCreatedRemId;
      rootInsertIndex = created.rootInsertIndex;
      rootInsertPosition = created.rootInsertPosition;
    } else {
      if (operation === 'update_root_and_replace_children') {
        if (!root) {
          throw new RemnoteWriteError('INVALID_ARGS', 'update_root_and_replace_children requires root or note.root.');
        }
        await updateExistingRoot(parent, root);
      }
      if (operation === 'replace_children' || operation === 'update_root_and_replace_children') {
        await deleteDirectChildren(parent);
      }
      if (
        operation === 'append_children' ||
        operation === 'replace_children' ||
        operation === 'update_root_and_replace_children'
      ) {
        await createChildNodes(parent, childNodes);
      }
    }

    const verification = verifyAfterWrite
      ? await verifyCreatedRems(
          plugin,
          Array.from(new Set([...createdRemIds, ...updatedRemIds])),
          rootCreatedRemId ?? parent._id
        )
      : undefined;
    const result: ApplyStructuredNoteBatchResult = {
      operationId,
      status: 'applied',
      targetRemId: operation === 'create_child_tree' ? rootCreatedRemId : parent._id,
      parentId: operation === 'create_child_tree' ? parent._id : parent.parent ?? undefined,
      operation,
      plannedNodeCount: validationState.nodeCount,
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      updatedRemIds,
      deletedRemIds: Array.from(new Set(deletedRemIds)),
      rootCreatedRemId,
      rootInsertIndex,
      rootInsertPosition,
      dryRun: false,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      rollbackOnFailure,
      verifyAfterWrite,
      ...(verification ? { verification } : {}),
    };

    if (idempotencyKey) {
      rememberStructuredBatchResult(idempotencyKey, result);
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      const nestedCreatedRemIds = readCreatedRemIdsFromError(error);
      for (const remId of nestedCreatedRemIds) {
        createdRemIds.push(remId);
      }
      const uniqueCreatedRemIds = Array.from(new Set(createdRemIds));
      const hasPartial = uniqueCreatedRemIds.length > 0 || updatedRemIds.length > 0 || deletedRemIds.length > 0;
      const rollback = rollbackOnFailure && uniqueCreatedRemIds.length
        ? await rollbackCreatedRems(plugin, uniqueCreatedRemIds)
        : { status: 'not_attempted' as const, removedRemIds: [], failedRemIds: [] };
      throw new RemnoteWriteError(hasPartial ? 'PARTIAL_FAILURE' : error.code, hasPartial ? 'Structured note batch failed after partial execution.' : error.message, {
        originalDetails: error.details,
        operationId,
        idempotencyKey,
        partialExecution: {
          ...getPartialExecutionDetails(error.details),
          createdNodeCount: uniqueCreatedRemIds.length,
          createdRemIds: uniqueCreatedRemIds,
          updatedRemIds,
          deletedRemIds: Array.from(new Set(deletedRemIds)),
          failedStage: 'apply_structured_note_batch',
          rollbackStatus: rollback.status,
          rollbackRemovedRemIds: rollback.removedRemIds,
          rollbackFailedRemIds: rollback.failedRemIds,
        },
      });
    }

    throw new RemnoteWriteError('SDK_ERROR', 'Structured note batch failed.', {
      sdkMessage: getSdkErrorMessage(error),
      operationId,
      idempotencyKey,
      partialExecution: {
        createdRemIds,
        updatedRemIds,
        deletedRemIds: Array.from(new Set(deletedRemIds)),
        failedStage: 'apply_structured_note_batch',
        rollbackStatus: 'not_attempted',
      },
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

async function getDeleteTarget(plugin: RNPlugin, rem: Rem): Promise<DeleteRemByIdTarget> {
  const breadcrumbs: DeleteRemByIdTarget['breadcrumbs'] = [];
  const seen = new Set<string>();
  let current: Rem | undefined = rem;

  while (current && !seen.has(current._id)) {
    seen.add(current._id);
    breadcrumbs.unshift({
      id: current._id,
      text: await getRemTitle(plugin, current),
    });

    if (!current.parent) {
      break;
    }

    current = (await plugin.rem.findOne(current.parent)) ?? undefined;
  }

  return {
    remId: rem._id,
    plainText: await getRemPlainString(plugin, rem),
    parentId: rem.parent ?? null,
    breadcrumbs,
    childCount: rem.children.length,
  };
}

function rememberDeleteByIdResult(idempotencyKey: string, result: DeleteRemByIdResult) {
  DELETE_BY_ID_RESULT_CACHE.delete(idempotencyKey);
  DELETE_BY_ID_RESULT_CACHE.set(idempotencyKey, result);

  while (DELETE_BY_ID_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = DELETE_BY_ID_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    DELETE_BY_ID_RESULT_CACHE.delete(oldestKey);
  }
}

async function assertSafeDeleteTarget(plugin: RNPlugin, rem: Rem, target: DeleteRemByIdTarget) {
  if (!target.parentId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete top-level/workspace root Rems.', {
      remId: target.remId,
    });
  }

  if (/plugin test|mcp regression test root/i.test(target.plainText)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete Plugin Test / MCP Regression root Rems.', {
      remId: target.remId,
      plainText: target.plainText,
    });
  }

  const isDocument = await rem.isDocument().catch(() => false);
  if (isDocument) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete document roots.', {
      remId: target.remId,
    });
  }

  const focusedRem = await plugin.focus.getFocusedRem().catch(() => undefined);
  const focusedPortal = await plugin.focus.getFocusedPortal().catch(() => undefined);
  if (focusedRem?._id === target.remId || focusedPortal?._id === target.remId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete the current focused Rem or focused portal.', {
      remId: target.remId,
    });
  }
}

export async function deleteRemByIdSafe(
  plugin: RNPlugin,
  args: DeleteRemByIdArgs
): Promise<DeleteRemByIdResult> {
  const remId = args.remId?.trim();
  if (!remId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id requires remId.');
  }

  const idempotencyKey = args.idempotencyKey?.trim();
  if (idempotencyKey) {
    const cached = DELETE_BY_ID_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: cached.status === 'deleted' ? 'already_deleted' : cached.status,
      };
    }
  }

  const rem = await findRequiredRem(plugin, remId, 'Target');
  const target = await getDeleteTarget(plugin, rem);
  const ancestorIds = new Set(target.breadcrumbs.map((item) => item.id));
  const guards: NonNullable<DeleteRemByIdResult['guards']> = {
    ...(args.expectedParentId ? { expectedParentMatches: target.parentId === args.expectedParentId } : {}),
    ...(args.expectedAncestorId ? { expectedAncestorMatches: ancestorIds.has(args.expectedAncestorId) } : {}),
    ...(args.confirmTitle ? { confirmTitleMatches: target.plainText.trim() === args.confirmTitle.trim() } : {}),
  };
  const dryRun = args.dryRun ?? true;
  const baseResult: DeleteRemByIdResult = {
    dryRun,
    target,
    guards,
    wouldDelete: {
      remId: target.remId,
      childCount: target.childCount,
      includesDescendants: target.childCount > 0,
    },
    ...(idempotencyKey ? { idempotencyKey } : {}),
    status: dryRun ? 'dry_run' : 'deleted',
  };

  if (dryRun) {
    return baseResult;
  }

  await assertSafeDeleteTarget(plugin, rem, target);

  if (args.expectedParentId && !guards.expectedParentMatches) {
    throw new RemnoteWriteError('INVALID_ARGS', 'expectedParentId did not match target parent.', {
      expectedParentId: args.expectedParentId,
      actualParentId: target.parentId,
    });
  }

  if (args.expectedAncestorId && !guards.expectedAncestorMatches) {
    throw new RemnoteWriteError('INVALID_ARGS', 'expectedAncestorId was not found in target breadcrumbs.', {
      expectedAncestorId: args.expectedAncestorId,
      breadcrumbs: target.breadcrumbs,
    });
  }

  if (args.confirmTitle && !guards.confirmTitleMatches) {
    throw new RemnoteWriteError('INVALID_ARGS', 'confirmTitle did not match target plain text.', {
      confirmTitle: args.confirmTitle,
      actualPlainText: target.plainText,
    });
  }

  const hasPassingGuard = Boolean(guards.expectedParentMatches || guards.expectedAncestorMatches);
  if (!hasPassingGuard) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'Real delete requires dryRun:false plus a matching expectedParentId or expectedAncestorId guard.',
      { guards }
    );
  }

  await runSdkOperation('rem.remove', () => rem.remove());
  const afterDelete = await plugin.rem.findOne(remId).catch(() => undefined);
  const result: DeleteRemByIdResult = {
    ...baseResult,
    deletedRemId: remId,
    verification: {
      deleted: !afterDelete,
      readAfterDelete: afterDelete ? 'still_present' : 'missing',
    },
    status: 'deleted',
  };

  if (afterDelete) {
    throw new RemnoteWriteError('SDK_ERROR', 'Rem still resolved after delete.', {
      remId,
      verification: result.verification,
    });
  }

  if (idempotencyKey) {
    rememberDeleteByIdResult(idempotencyKey, result);
  }

  return result;
}

async function deleteRemByIdLegacy(
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
  return deleteRemByIdLegacy(plugin, args.remId, args);
}

export async function deleteFocusedRem(
  plugin: RNPlugin,
  args: DeleteFocusedRemArgs
): Promise<DeleteRemResult> {
  const focusedRem = await plugin.focus.getFocusedRem();
  if (!focusedRem) {
    throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
  }

  return deleteRemByIdLegacy(plugin, focusedRem._id, args);
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

  return deleteRemByIdLegacy(plugin, selectedRemIds[0], args);
}
