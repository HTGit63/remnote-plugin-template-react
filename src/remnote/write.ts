import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type { Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
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
  DeleteRemArgs,
  DeleteRemResult,
  DeleteSelectedRemArgs,
  FormatRemResult,
  MoveRemArgs,
  MoveRemResult,
  PracticeDirection,
  ReplaceRemArgs,
  ReplaceRemResult,
  ReorderChildrenArgs,
  ReorderChildrenResult,
  RemColorName,
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
} from '../bridge/protocol';

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
  default: undefined,
};

const COLOR_FORMAT_NAMES: RichTextFormatName[] = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];
const STRUCTURED_BATCH_RESULT_CACHE = new Map<string, ApplyStructuredNoteBatchResult>();

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

function getColorFormat(color: RemColorName): RichTextFormatName | undefined {
  const format = COLOR_FORMATS[color];
  if (!format && color !== 'default' && color !== 'pink' && color !== 'gray') {
    throw new RemnoteWriteError('INVALID_ARGS', `Unsupported color "${color}".`);
  }

  if (!format && (color === 'pink' || color === 'gray')) {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      `The installed RemNote SDK rich text formatter only exposes red, orange, yellow, green, blue, and purple.`
    );
  }

  return format;
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

  const color = styles.color && styles.color !== 'default' ? styles.color : styles.highlight;
  if (color && color !== 'default') {
    const format = getColorFormat(color);
    if (format) {
      formats.push(format as Exclude<RichTextFormatName, 'cloze'>);
    }
  }

  return formats;
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

  let builder: ReturnType<RNPlugin['richText']['text']> | undefined;
  let appended = false;

  for (const span of spans) {
    const type = span.type ?? (span.latex ? 'inlineMath' : 'text');
    if (type === 'mathBlock' || type === 'inlineMath') {
      const latex = span.latex ?? span.text ?? '';
      if (!latex) {
        throw new RemnoteWriteError('INVALID_ARGS', 'Math span requires latex.');
      }

      builder = builder
        ? builder.latex(latex, type === 'mathBlock')
        : plugin.richText.latex(latex, type === 'mathBlock');
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
        builder = builder
          ? builder.latex(latex, parsedType === 'mathBlock')
          : plugin.richText.latex(latex, parsedType === 'mathBlock');
      } else {
        builder = builder
          ? builder.text(parsedSpan.text ?? '', getTextFormats(parsedSpan.styles))
          : plugin.richText.text(parsedSpan.text ?? '', getTextFormats(parsedSpan.styles));
      }
      appended = true;
    }
  }

  if (!builder || !appended) {
    throw new RemnoteWriteError('INVALID_ARGS', 'richText did not contain text or math content.');
  }

  const completedBuilder = builder;
  return runSdkOperation('richText.value', () => completedBuilder.value());
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

async function clearColorFormatsInRange(
  plugin: RNPlugin,
  richText: RichTextInterface,
  start: number,
  end: number,
  required = false
): Promise<RichTextInterface> {
  let next = richText;
  let removedAtLeastOne = false;
  let lastFailure: unknown;

  for (const format of COLOR_FORMAT_NAMES) {
    try {
      next = await runSdkOperation('richText.removeTextFormatFromRange', () =>
        plugin.richText.removeTextFormatFromRange(next, start, end, format)
      );
      removedAtLeastOne = true;
    } catch (error: unknown) {
      lastFailure = error;
    }
  }

  if (required && !removedAtLeastOne && lastFailure) {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      'The installed RemNote SDK rejected rich text color clearing for this range.',
      {
        start,
        end,
        sdkMessage: getSdkErrorMessage(lastFailure),
      }
    );
  }

  return next;
}

async function setColorInRange(
  plugin: RNPlugin,
  rem: Rem,
  range: { start: number; end: number },
  color: RemColorName,
  status: FormatRemResult['status']
): Promise<FormatRemResult> {
  const plain = await getRemPlainString(plugin, rem);
  validateTextRange(range, plain.length);

  const format = getColorFormat(color);
  let richText = await clearColorFormatsInRange(plugin, rem.text, range.start, range.end, !format);
  if (format) {
    richText = await runSdkOperation('richText.applyTextFormatToRange', () =>
      plugin.richText.applyTextFormatToRange(richText, range.start, range.end, format)
    );
  }

  await runSdkOperation('rem.setText', () => rem.setText(richText));
  return { remId: rem._id, status };
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
      await setColorInRange(plugin, rem, { start: 0, end: plain.length }, style.color, 'text_color_set');
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
  const plain = await getRemPlainString(plugin, rem);
  if (!plain.length) {
    return { remId: rem._id, status: 'text_color_set' };
  }

  return setColorInRange(plugin, rem, { start: 0, end: plain.length }, args.color, 'text_color_set');
}

export async function setTextSpanColor(
  plugin: RNPlugin,
  args: SetTextSpanColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  return setColorInRange(plugin, rem, args.range, args.color, 'span_color_set');
}

export async function setTextSpanHighlight(
  plugin: RNPlugin,
  args: SetTextSpanHighlightArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  return setColorInRange(plugin, rem, args.range, args.color, 'span_highlight_set');
}

export async function setRemHighlightColor(
  plugin: RNPlugin,
  args: SetRemHighlightColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const format = getColorFormat(args.color);
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

  if (rem.type === RemType.CONCEPT || rem.type === RemType.DESCRIPTOR) {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      'The installed RemNote SDK does not expose a reliable concept/descriptor reset to normal type.'
    );
  }

  await runSdkOperation('rem.setText', () => rem.setText(richText));
  await runSdkOperation('rem.setFontSize', () => rem.setFontSize(undefined));

  return { remId: rem._id, status: 'formatting_cleared' };
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
  const clozeRichText = await runSdkOperation('richText.applyTextFormatToRange', () =>
    plugin.richText.applyTextFormatToRange(baseRichText, start, end, 'cloze')
  );
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

export async function createStyledRemTree(
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
        const next = await runSdkOperation('richText.applyTextFormatToRange', () =>
          plugin.richText.applyTextFormatToRange(created.text, start, start + clozeText.length, 'cloze')
        );
        await runSdkOperation('rem.setText', () => created.setText(next));
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

export async function applyStructuredNoteBatch(
  plugin: RNPlugin,
  args: ApplyStructuredNoteBatchArgs
): Promise<ApplyStructuredNoteBatchResult> {
  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const validationState: TreeValidationState = { nodeCount: 0 };
  const root = normalizeStyledNode(args.root, 1, validationState);
  const idempotencyKey = args.idempotencyKey?.trim();
  const rollbackOnFailure = args.rollbackOnFailure ?? true;
  const verifyAfterWrite = args.verifyAfterWrite ?? false;

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

  if (args.dryRun) {
    return {
      status: 'dry_run',
      parentId: parent._id,
      plannedNodeCount: validationState.nodeCount,
      createdNodeCount: 0,
      createdRemIds: [],
      dryRun: true,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      rollbackOnFailure,
      verifyAfterWrite,
    };
  }

  try {
    const created = await createStyledRemTree(plugin, {
      parentId: parent._id,
      position: args.position ?? 'end',
      tree: root,
    });
    const verification = verifyAfterWrite
      ? await verifyCreatedRems(plugin, created.createdRemIds, created.rootCreatedRemId)
      : undefined;
    const result: ApplyStructuredNoteBatchResult = {
      status: 'applied',
      parentId: parent._id,
      plannedNodeCount: validationState.nodeCount,
      createdNodeCount: created.createdNodeCount,
      createdRemIds: created.createdRemIds,
      rootCreatedRemId: created.rootCreatedRemId,
      rootInsertIndex: created.rootInsertIndex,
      rootInsertPosition: created.rootInsertPosition,
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
      const createdRemIds = readCreatedRemIdsFromError(error);
      const rollback = rollbackOnFailure && createdRemIds.length
        ? await rollbackCreatedRems(plugin, createdRemIds)
        : { status: 'not_attempted' as const, removedRemIds: [], failedRemIds: [] };
      throw new RemnoteWriteError(error.code, error.message, {
        originalDetails: error.details,
        partialExecution: {
          ...getPartialExecutionDetails(error.details),
          createdNodeCount: createdRemIds.length,
          createdRemIds,
          failedStage: 'apply_structured_note_batch',
          rollbackStatus: rollback.status,
          rollbackRemovedRemIds: rollback.removedRemIds,
          rollbackFailedRemIds: rollback.failedRemIds,
        },
      });
    }

    throw new RemnoteWriteError('SDK_ERROR', 'Structured note batch failed.', {
      sdkMessage: getSdkErrorMessage(error),
      partialExecution: {
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

async function deleteRemById(
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
  return deleteRemById(plugin, args.remId, args);
}

export async function deleteFocusedRem(
  plugin: RNPlugin,
  args: DeleteFocusedRemArgs
): Promise<DeleteRemResult> {
  const focusedRem = await plugin.focus.getFocusedRem();
  if (!focusedRem) {
    throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
  }

  return deleteRemById(plugin, focusedRem._id, args);
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

  return deleteRemById(plugin, selectedRemIds[0], args);
}
