import type {
  CreateOrReplaceNoteFromMarkdownArgs,
  MarkdownImportFidelityOptions,
  MarkdownImportHeadingMapping,
  MarkdownImportLimits,
  MarkdownImportRemnoteLayout,
  MarkdownImportSafetyOptions,
  MarkdownMathOptions,
  NoteStylePresetFields,
  PracticeDirection,
  RemHeadingLevel,
  RichTextSpanInput,
  StyledRemTreeNode,
} from './protocol.js';
import { applyStylePresetToMarkdownArgs, isNuclearPhysicsSpacerNode } from './style-presets.js';

export const DEFAULT_MARKDOWN_IMPORT_LIMITS: Required<MarkdownImportLimits> = {
  maxMarkdownChars: 120000,
  maxDepth: 8,
  maxNodes: 200,
} as const;

const HARD_MARKDOWN_IMPORT_LIMITS = {
  maxMarkdownChars: 120000,
  maxDepth: 12,
  maxNodes: 1000,
} as const;

const DEFAULT_HEADING_MAPPING = {
  rootHeading: 'first_h1',
  rootHeadingLevel: 'H1',
  sectionHeadingLevel: 'H3',
  subsectionHeadingLevel: 'H3',
} as const;

const DEFAULT_LAYOUT = {
  insertSpacerBetweenSections: true,
  spacerText: '',
  preserveBlankLines: true,
  paragraphMode: 'child_rem_per_paragraph',
  bulletMode: 'plain_child_rems',
} as const;

const DEFAULT_MATH_OPTIONS = {
  inlineMathDelimiters: 'both',
  blockMathDelimiters: 'both',
  formulaMode: 'preserve',
  rejectMalformedMath: true,
} as const;

const DEFAULT_FIDELITY_OPTIONS = {
  requireExactText: true,
  allowWhitespaceNormalization: true,
  preserveSourceOrder: true,
  failOnContentLoss: true,
} as const;

const DEFAULT_FLASHCARD_OPTIONS = {
  enabled: false,
  marker: 'both',
  defaultDirection: 'both',
} as const;

const DEFAULT_FORMULA_SAFE_SPLIT_CHARS = 3500;

export interface MarkdownImportParseOptions extends NoteStylePresetFields {
  headingMapping?: MarkdownImportHeadingMapping;
  remnoteLayout?: MarkdownImportRemnoteLayout;
  mathOptions?: MarkdownMathOptions;
  fidelityOptions?: MarkdownImportFidelityOptions;
  flashcardOptions?: MarkdownFlashcardOptions;
  limits?: MarkdownImportLimits;
}

export interface MarkdownFlashcardOptions {
  enabled?: boolean;
  marker?: 'double_colon' | 'cloze' | 'both';
  defaultDirection?: PracticeDirection;
}

export interface MarkdownTreeStats {
  nodeCount: number;
  maxDepth: number;
  headingCount: number;
  mathBlockCount: number;
  inlineMathCount: number;
  codeBlockCount: number;
  tableCount: number;
  tableRowCount: number;
  tableCellCount: number;
  paragraphCount: number;
  bulletCount: number;
  calloutCount: number;
  workedExampleCount: number;
  flashcardCount: number;
  splitChunkCount: number;
}

export interface MarkdownImportPlan {
  tree: StyledRemTreeNode;
  sourceHash: string;
  outputHash: string;
  sourceSnippets: string[];
  stats: MarkdownTreeStats;
  options: {
    headingMapping: Required<MarkdownImportHeadingMapping>;
    remnoteLayout: Required<MarkdownImportRemnoteLayout>;
    mathOptions: Required<MarkdownMathOptions>;
    fidelityOptions: Required<MarkdownImportFidelityOptions>;
    flashcardOptions: Required<MarkdownFlashcardOptions>;
    limits: Required<MarkdownImportLimits>;
  };
  previewOutline: string[];
  formulaValidation: MarkdownFormulaValidationResult;
}

export interface MarkdownFormulaValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MarkdownSourceFidelityReport {
  passed: boolean;
  checkedNodeCount: number;
  headingCount: number;
  paragraphCount: number;
  bulletCount: number;
  mathBlockCount: number;
  inlineMathCount: number;
  codeBlockCount: number;
  tableCount: number;
  missingTextSnippets: string[];
  extraTextSnippets: string[];
  structureMismatches: string[];
  pollutionRems: string[];
}

export interface NormalizedMarkdownImportArgs extends NoteStylePresetFields {
  parentRemId: string;
  targetRemId: string;
  markdownText: string;
  mode: NonNullable<CreateOrReplaceNoteFromMarkdownArgs['mode']>;
  duplicatePolicy: NonNullable<CreateOrReplaceNoteFromMarkdownArgs['duplicatePolicy']>;
  headingMapping: Required<MarkdownImportHeadingMapping>;
  remnoteLayout: Required<MarkdownImportRemnoteLayout>;
  mathOptions: Required<MarkdownMathOptions>;
  fidelityOptions: Required<MarkdownImportFidelityOptions>;
  flashcardOptions: Required<MarkdownFlashcardOptions>;
  safetyOptions: Required<MarkdownImportSafetyOptions>;
  limits: Required<MarkdownImportLimits>;
}

type HeadingStackEntry = {
  markdownLevel: number;
  node: StyledRemTreeNode;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripUnderscoreEmphasis(value: string): string {
  return value
    .replace(/(^|[^A-Za-z0-9_])__([^_\n]+?)__(?=$|[^A-Za-z0-9_])/g, '$1$2')
    .replace(/(^|[^A-Za-z0-9_])_([^_\n]+?)_(?=$|[^A-Za-z0-9_])/g, '$1$2');
}

function stripMarkdownInline(value: string): string {
  return normalizeWhitespace(
    stripUnderscoreEmphasis(value)
      .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
      .replace(/\\\[([\s\S]+?)\\\]/g, '$1')
      .replace(/\$([^$\n]+?)\$/g, '$1')
      .replace(/\\\(([\s\S]+?)\\\)/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  );
}

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function clampLimit(value: number | undefined, fallback: number, hardMax: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(1, Math.floor(value as number)), hardMax);
}

function normalizeOptions(options: MarkdownImportParseOptions = {}): MarkdownImportPlan['options'] {
  const presetOptions = applyStylePresetToMarkdownArgs(options as CreateOrReplaceNoteFromMarkdownArgs);
  return {
    headingMapping: {
      ...DEFAULT_HEADING_MAPPING,
      explicitTitle: presetOptions.headingMapping?.explicitTitle?.trim() || '',
      ...presetOptions.headingMapping,
      rootHeading: presetOptions.headingMapping?.rootHeading ?? DEFAULT_HEADING_MAPPING.rootHeading,
      rootHeadingLevel: presetOptions.headingMapping?.rootHeadingLevel ?? DEFAULT_HEADING_MAPPING.rootHeadingLevel,
      sectionHeadingLevel: presetOptions.headingMapping?.sectionHeadingLevel ?? DEFAULT_HEADING_MAPPING.sectionHeadingLevel,
      subsectionHeadingLevel: presetOptions.headingMapping?.subsectionHeadingLevel ?? DEFAULT_HEADING_MAPPING.subsectionHeadingLevel,
    },
    remnoteLayout: {
      ...DEFAULT_LAYOUT,
      ...presetOptions.remnoteLayout,
      spacerText: presetOptions.remnoteLayout?.spacerText ?? DEFAULT_LAYOUT.spacerText,
      paragraphMode: presetOptions.remnoteLayout?.paragraphMode ?? DEFAULT_LAYOUT.paragraphMode,
      bulletMode: presetOptions.remnoteLayout?.bulletMode ?? DEFAULT_LAYOUT.bulletMode,
    },
    mathOptions: {
      ...DEFAULT_MATH_OPTIONS,
      ...presetOptions.mathOptions,
      inlineMathDelimiters: presetOptions.mathOptions?.inlineMathDelimiters ?? DEFAULT_MATH_OPTIONS.inlineMathDelimiters,
      blockMathDelimiters: presetOptions.mathOptions?.blockMathDelimiters ?? DEFAULT_MATH_OPTIONS.blockMathDelimiters,
      formulaMode: presetOptions.mathOptions?.formulaMode ?? DEFAULT_MATH_OPTIONS.formulaMode,
      rejectMalformedMath: presetOptions.mathOptions?.rejectMalformedMath ?? DEFAULT_MATH_OPTIONS.rejectMalformedMath,
    },
    fidelityOptions: {
      ...DEFAULT_FIDELITY_OPTIONS,
      ...presetOptions.fidelityOptions,
      requireExactText: presetOptions.fidelityOptions?.requireExactText ?? DEFAULT_FIDELITY_OPTIONS.requireExactText,
      allowWhitespaceNormalization:
        presetOptions.fidelityOptions?.allowWhitespaceNormalization ?? DEFAULT_FIDELITY_OPTIONS.allowWhitespaceNormalization,
      preserveSourceOrder: presetOptions.fidelityOptions?.preserveSourceOrder ?? DEFAULT_FIDELITY_OPTIONS.preserveSourceOrder,
      failOnContentLoss: presetOptions.fidelityOptions?.failOnContentLoss ?? DEFAULT_FIDELITY_OPTIONS.failOnContentLoss,
    },
    flashcardOptions: {
      ...DEFAULT_FLASHCARD_OPTIONS,
      ...presetOptions.flashcardOptions,
      enabled: presetOptions.flashcardOptions?.enabled ?? DEFAULT_FLASHCARD_OPTIONS.enabled,
      marker: presetOptions.flashcardOptions?.marker ?? DEFAULT_FLASHCARD_OPTIONS.marker,
      defaultDirection:
        presetOptions.flashcardOptions?.defaultDirection ?? DEFAULT_FLASHCARD_OPTIONS.defaultDirection,
    },
    limits: {
      maxMarkdownChars: clampLimit(
        presetOptions.limits?.maxMarkdownChars,
        DEFAULT_MARKDOWN_IMPORT_LIMITS.maxMarkdownChars,
        HARD_MARKDOWN_IMPORT_LIMITS.maxMarkdownChars
      ),
      maxDepth: clampLimit(
        presetOptions.limits?.maxDepth,
        DEFAULT_MARKDOWN_IMPORT_LIMITS.maxDepth,
        HARD_MARKDOWN_IMPORT_LIMITS.maxDepth
      ),
      maxNodes: clampLimit(
        presetOptions.limits?.maxNodes,
        DEFAULT_MARKDOWN_IMPORT_LIMITS.maxNodes,
        HARD_MARKDOWN_IMPORT_LIMITS.maxNodes
      ),
    },
  };
}

function nodeText(node: StyledRemTreeNode): string {
  if (node.text !== undefined) return node.text;
  if (node.title !== undefined) return node.title;
  if (node.latex !== undefined) return node.latex;
  if (node.front !== undefined) return [node.front, node.back ?? node.answer ?? ''].filter(Boolean).join(' ');
  return node.type ?? 'rem';
}

function headingStyleForMarkdownLevel(
  markdownLevel: number,
  mapping: Required<MarkdownImportHeadingMapping>
): RemHeadingLevel {
  if (markdownLevel <= 1) return mapping.rootHeadingLevel;
  if (markdownLevel <= 3) return mapping.sectionHeadingLevel;
  return mapping.subsectionHeadingLevel;
}

function pushChild(parent: StyledRemTreeNode, child: StyledRemTreeNode): StyledRemTreeNode {
  parent.children = parent.children ?? [];
  parent.children.push(child);
  return child;
}

function inlineMarkdownNode(
  clientNodeId: string,
  markdownText: string,
  options: {
    style?: StyledRemTreeNode['style'];
    children?: StyledRemTreeNode[];
    type?: StyledRemTreeNode['type'];
  } = {}
): StyledRemTreeNode {
  const inline = markdownInlineToRichText(markdownText);
  return {
    clientNodeId,
    type: options.type ?? 'rem',
    text: inline.text,
    ...(inline.richText ? { richText: inline.richText } : {}),
    ...(options.style ? { style: options.style } : {}),
    ...(options.children ? { children: options.children } : {}),
  };
}

function spacerNode(index: number, text: string): StyledRemTreeNode {
  return {
    clientNodeId: `spacer-${index}`,
    type: 'rem',
    text: text || ' ',
  };
}

function hasPriorHeadingSibling(parent: StyledRemTreeNode): boolean {
  return Boolean(
    parent.children?.some(
      (child) =>
        !isNuclearPhysicsSpacerNode(child) &&
        child.style?.headingLevel &&
        child.style.headingLevel !== 'normal'
    )
  );
}

function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
}

function tableToRemNode(lines: string[], tableIndex: number): StyledRemTreeNode {
  const header = tableCells(lines[0] ?? '');
  const bodyRows = lines.slice(2).map(tableCells).filter((cells) => cells.length > 0);
  const children: StyledRemTreeNode[] = [];
  if (header.length) {
    children.push({
      clientNodeId: `table-${tableIndex}-header`,
      type: 'rem',
      text: 'Header',
      children: header.map((cell, index) =>
        inlineMarkdownNode(`table-${tableIndex}-header-cell-${index + 1}`, cell)
      ),
    });
  }
  bodyRows.forEach((row, rowIndex) => {
    children.push({
      clientNodeId: `table-${tableIndex}-row-${rowIndex + 1}`,
      type: 'rem',
      text: `Row ${rowIndex + 1}`,
      children: row.map((cell, cellIndex) =>
        inlineMarkdownNode(`table-${tableIndex}-row-${rowIndex + 1}-cell-${cellIndex + 1}`, cell)
      ),
    });
  });
  return {
    clientNodeId: `table-${tableIndex}`,
    type: 'rem',
    text: `Table ${tableIndex}`,
    children,
  };
}

function blockquoteMatch(line: string): string | null {
  const match = /^\s*>\s?(.*)$/.exec(line);
  return match?.[1] ?? null;
}

function isWorkedExampleText(text: string): boolean {
  return /^(worked\s+example|example)\s*(\d+|[A-Z])?\s*[:.-]/i.test(text.trim());
}

function flashcardNodeFromText(
  clientNodeId: string,
  text: string,
  options: Required<MarkdownFlashcardOptions>
): StyledRemTreeNode | null {
  if (!options.enabled || (options.marker !== 'double_colon' && options.marker !== 'both')) {
    return null;
  }
  const separator = text.indexOf('::');
  if (separator <= 0) {
    return null;
  }
  const front = stripMarkdownInline(text.slice(0, separator));
  const back = stripMarkdownInline(text.slice(separator + 2));
  if (!front || !back) {
    return null;
  }
  return {
    clientNodeId,
    type: 'basicFlashcard',
    front,
    back,
    direction: options.defaultDirection,
  };
}

function addSnippet(snippets: string[], value: string) {
  const normalized = stripMarkdownInline(value);
  if (normalized) {
    snippets.push(normalized);
  }
}

function addInlineSourceSnippets(snippets: string[], value: string) {
  addSnippet(snippets, value);
  for (const snippet of extractMathSnippets(value)) {
    addSnippet(snippets, snippet);
  }
}

function addNodeSourceSnippets(
  snippets: string[],
  node: StyledRemTreeNode,
  fallbackMarkdown: string
) {
  if (
    node.type === 'basicFlashcard' ||
    node.type === 'conceptCard' ||
    node.type === 'descriptorCard'
  ) {
    if (node.front) addInlineSourceSnippets(snippets, node.front);
    if (node.back) addInlineSourceSnippets(snippets, node.back);
    if (node.answer) addInlineSourceSnippets(snippets, node.answer);
    return;
  }
  addInlineSourceSnippets(snippets, fallbackMarkdown);
}

function extractMathSnippets(text: string): string[] {
  const snippets: string[] = [];
  const patterns = [
    /\$\$([\s\S]+?)\$\$/g,
    /\\\[([\s\S]+?)\\\]/g,
    /\$([^$\n]+?)\$/g,
    /\\\(([\s\S]+?)\\\)/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const snippet = normalizeWhitespace(match[1] ?? '');
      if (snippet) snippets.push(snippet);
    }
  }
  return snippets;
}

function markdownCharEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function findUnescapedMarkdownDelimiter(text: string, delimiter: string, fromIndex: number): number {
  let index = text.indexOf(delimiter, fromIndex);
  while (index >= 0) {
    if (!markdownCharEscaped(text, index)) {
      return index;
    }
    index = text.indexOf(delimiter, index + delimiter.length);
  }
  return -1;
}

function findUnescapedSingleDollar(text: string, fromIndex: number): number {
  let index = text.indexOf('$', fromIndex);
  while (index >= 0) {
    if (!markdownCharEscaped(text, index) && text[index - 1] !== '$' && text[index + 1] !== '$') {
      return index;
    }
    index = text.indexOf('$', index + 1);
  }
  return -1;
}

export function validateMarkdownMathDelimiters(
  markdownText: string,
  options: MarkdownMathOptions = {}
): MarkdownFormulaValidationResult {
  const mathOptions = {
    ...DEFAULT_MATH_OPTIONS,
    ...options,
  };
  const errors: string[] = [];
  const lines = markdownText.replace(/\r\n/g, '\n').split('\n');
  let inCodeFence = false;
  let blockMode: { delimiter: '$$' | '\\['; line: number } | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) {
      continue;
    }

    let cursor = 0;
    while (cursor < line.length) {
      if (blockMode) {
        const close = blockMode.delimiter === '$$' ? '$$' : '\\]';
        const closeAt = findUnescapedMarkdownDelimiter(line, close, cursor);
        if (closeAt < 0) {
          break;
        }
        const latex = line.slice(cursor, closeAt).trim();
        if (mathOptions.rejectMalformedMath && closeAt === cursor && lineIndex === blockMode.line) {
          errors.push(`Empty block math delimiter at line ${lineIndex + 1}.`);
        } else if (mathOptions.rejectMalformedMath && !latex && lineIndex === blockMode.line) {
          errors.push(`Empty block math delimiter at line ${lineIndex + 1}.`);
        }
        blockMode = null;
        cursor = closeAt + close.length;
        continue;
      }

      if (line.startsWith('$$', cursor) && !markdownCharEscaped(line, cursor)) {
        const closeAt = findUnescapedMarkdownDelimiter(line, '$$', cursor + 2);
        if (closeAt >= 0) {
          if (mathOptions.rejectMalformedMath && !line.slice(cursor + 2, closeAt).trim()) {
            errors.push(`Empty $$ math delimiter at line ${lineIndex + 1}.`);
          }
          cursor = closeAt + 2;
        } else {
          blockMode = { delimiter: '$$', line: lineIndex };
          cursor += 2;
        }
        continue;
      }

      if (line.startsWith('\\[', cursor) && !markdownCharEscaped(line, cursor)) {
        const closeAt = findUnescapedMarkdownDelimiter(line, '\\]', cursor + 2);
        if (closeAt >= 0) {
          if (mathOptions.rejectMalformedMath && !line.slice(cursor + 2, closeAt).trim()) {
            errors.push(`Empty \\[ math delimiter at line ${lineIndex + 1}.`);
          }
          cursor = closeAt + 2;
        } else {
          blockMode = { delimiter: '\\[', line: lineIndex };
          cursor += 2;
        }
        continue;
      }

      if (line.startsWith('\\(', cursor) && !markdownCharEscaped(line, cursor)) {
        const closeAt = findUnescapedMarkdownDelimiter(line, '\\)', cursor + 2);
        if (closeAt < 0) {
          errors.push(`Unclosed \\( inline math at line ${lineIndex + 1}.`);
          break;
        }
        if (mathOptions.rejectMalformedMath && !line.slice(cursor + 2, closeAt).trim()) {
          errors.push(`Empty \\( inline math at line ${lineIndex + 1}.`);
        }
        cursor = closeAt + 2;
        continue;
      }

      if (line[cursor] === '$' && !markdownCharEscaped(line, cursor) && line[cursor + 1] !== '$') {
        const closeAt = findUnescapedSingleDollar(line, cursor + 1);
        if (closeAt < 0) {
          errors.push(`Unclosed $ inline math at line ${lineIndex + 1}.`);
          break;
        }
        if (mathOptions.rejectMalformedMath && !line.slice(cursor + 1, closeAt).trim()) {
          errors.push(`Empty $ inline math at line ${lineIndex + 1}.`);
        }
        cursor = closeAt + 1;
        continue;
      }

      cursor += 1;
    }
  }

  if (blockMode) {
    const close = blockMode.delimiter === '$$' ? '$$' : '\\]';
    errors.push(`Unclosed ${blockMode.delimiter} block math started at line ${blockMode.line + 1}; expected ${close}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

interface InlineMathRange {
  start: number;
  end: number;
}

function inlineMathRanges(text: string): InlineMathRange[] {
  const ranges: InlineMathRange[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    if (text.startsWith('\\(', cursor) && !markdownCharEscaped(text, cursor)) {
      const closeAt = findUnescapedMarkdownDelimiter(text, '\\)', cursor + 2);
      if (closeAt >= 0) {
        ranges.push({ start: cursor, end: closeAt + 2 });
        cursor = closeAt + 2;
        continue;
      }
    }
    if (text[cursor] === '$' && !markdownCharEscaped(text, cursor) && text[cursor + 1] !== '$') {
      const closeAt = findUnescapedSingleDollar(text, cursor + 1);
      if (closeAt >= 0) {
        ranges.push({ start: cursor, end: closeAt + 1 });
        cursor = closeAt + 1;
        continue;
      }
    }
    cursor += 1;
  }
  return ranges;
}

function indexInsideRange(index: number, ranges: readonly InlineMathRange[]): InlineMathRange | undefined {
  return ranges.find((range) => index > range.start && index < range.end);
}

export function splitTextFormulaSafe(
  text: string,
  maxChars = DEFAULT_FORMULA_SAFE_SPLIT_CHARS
): string[] {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= maxChars) {
    return normalized ? [normalized] : [];
  }

  const ranges = inlineMathRanges(normalized);
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    let end = Math.min(normalized.length, cursor + maxChars);
    const containingRange = indexInsideRange(end, ranges);
    if (containingRange) {
      end = containingRange.end;
    } else if (end < normalized.length) {
      let splitAt = -1;
      for (let probe = end; probe > cursor + Math.floor(maxChars / 2); probe -= 1) {
        if (/\s/.test(normalized[probe] ?? '') && !indexInsideRange(probe, ranges)) {
          splitAt = probe;
          break;
        }
      }
      if (splitAt > cursor) {
        end = splitAt;
      }
    }

    const chunk = normalized.slice(cursor, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    cursor = end;
    while (cursor < normalized.length && /\s/.test(normalized[cursor])) {
      cursor += 1;
    }
  }
  return chunks;
}

function cleanMarkdownTextSegment(value: string): string {
  return stripUnderscoreEmphasis(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}

function markdownInlineToRichText(text: string): {
  richText?: RichTextSpanInput[];
  text: string;
  inlineMathCount: number;
} {
  const spans: RichTextSpanInput[] = [];
  let inlineMathCount = 0;
  let cursor = 0;
  let textStart = 0;

  function pushText(end: number) {
    if (end <= textStart) return;
    const cleaned = cleanMarkdownTextSegment(text.slice(textStart, end));
    if (cleaned) {
      spans.push({ text: cleaned });
    }
  }

  while (cursor < text.length) {
    if (text.startsWith('\\(', cursor) && !markdownCharEscaped(text, cursor)) {
      const closeAt = findUnescapedMarkdownDelimiter(text, '\\)', cursor + 2);
      if (closeAt >= 0) {
        pushText(cursor);
        const latex = text.slice(cursor + 2, closeAt).trim();
        if (latex) {
          spans.push({ type: 'inlineMath', latex });
          inlineMathCount += 1;
        }
        cursor = closeAt + 2;
        textStart = cursor;
        continue;
      }
    }

    if (text[cursor] === '$' && !markdownCharEscaped(text, cursor) && text[cursor + 1] !== '$') {
      const closeAt = findUnescapedSingleDollar(text, cursor + 1);
      if (closeAt >= 0) {
        pushText(cursor);
        const latex = text.slice(cursor + 1, closeAt).trim();
        if (latex) {
          spans.push({ type: 'inlineMath', latex });
          inlineMathCount += 1;
        }
        cursor = closeAt + 1;
        textStart = cursor;
        continue;
      }
    }

    cursor += 1;
  }

  pushText(text.length);

  const plainText = normalizeWhitespace(
    spans.map((span) => span.latex ?? span.text ?? '').join('')
  );
  return {
    richText: inlineMathCount > 0 ? spans : undefined,
    text: plainText || stripMarkdownInline(text),
    inlineMathCount,
  };
}

function tableLike(lines: string[], start: number): boolean {
  const line = lines[start] ?? '';
  const next = lines[start + 1] ?? '';
  return line.includes('|') && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(next);
}

function headingMatch(line: string): { level: number; title: string } | null {
  const match = /^(#{1,4})\s+(.+?)\s*$/.exec(line);
  if (!match) return null;
  return {
    level: match[1].length,
    title: stripMarkdownInline(match[2]),
  };
}

function bulletMatch(line: string): { indent: number; marker: string; text: string } | null {
  const match = /^(\s*)([-*+]|\d+[.)])\s+(.+)$/.exec(line);
  if (!match) return null;
  return {
    indent: match[1].replace(/\t/g, '    ').length,
    marker: match[2],
    text: match[3],
  };
}

function selectRootTitle(markdown: string, lines: string[], mapping: Required<MarkdownImportHeadingMapping>): {
  title: string;
  skipFirstHeading: boolean;
} {
  if (mapping.rootHeading === 'explicit_title') {
    const title = mapping.explicitTitle?.trim();
    if (!title) {
      throw new Error('headingMapping.explicitTitle required when rootHeading=explicit_title.');
    }
    return { title, skipFirstHeading: false };
  }

  const firstHeading = lines.map((line, index) => ({ heading: headingMatch(line), index })).find((entry) => entry.heading);
  if (mapping.rootHeading === 'first_h1' && firstHeading?.heading?.level === 1) {
    return { title: firstHeading.heading.title, skipFirstHeading: true };
  }

  const firstNonEmpty = lines.find((line) => line.trim()) ?? markdown.slice(0, 1000);
  return {
    title: stripMarkdownInline(firstNonEmpty.replace(/^#+\s*/, '')) || 'Imported Markdown Note',
    skipFirstHeading: mapping.rootHeading === 'title_from_first_line',
  };
}

function analyzeTree(node: StyledRemTreeNode, depth = 1, stats?: MarkdownTreeStats): MarkdownTreeStats {
  const next = stats ?? {
    nodeCount: 0,
    maxDepth: 0,
    headingCount: 0,
    mathBlockCount: 0,
    inlineMathCount: 0,
    codeBlockCount: 0,
    tableCount: 0,
    tableRowCount: 0,
    tableCellCount: 0,
    paragraphCount: 0,
    bulletCount: 0,
    calloutCount: 0,
    workedExampleCount: 0,
    flashcardCount: 0,
    splitChunkCount: 0,
  };
  next.nodeCount += 1;
  next.maxDepth = Math.max(next.maxDepth, depth);
  if (node.style?.headingLevel && node.style.headingLevel !== 'normal') next.headingCount += 1;
  if (node.type === 'mathBlock' || node.richText?.some((span: any) => span.type === 'mathBlock')) next.mathBlockCount += 1;
  const inlineMathSpanCount =
    node.richText?.filter((span: any) => span.type === 'inlineMath').length ?? 0;
  if (inlineMathSpanCount > 0) {
    next.inlineMathCount += inlineMathSpanCount;
  } else if (/\$[^$\n]+?\$|\\\(.+?\\\)/.test(nodeText(node))) {
    next.inlineMathCount += 1;
  }
  if ((node.clientNodeId ?? '').startsWith('code-')) next.codeBlockCount += 1;
  if (/^table-\d+$/.test(node.clientNodeId ?? '')) next.tableCount += 1;
  if (/^table-\d+-row-\d+$/.test(node.clientNodeId ?? '')) next.tableRowCount += 1;
  if (/^table-\d+-(header|row-\d+)-cell-\d+$/.test(node.clientNodeId ?? '')) next.tableCellCount += 1;
  if ((node.clientNodeId ?? '').startsWith('paragraph-')) next.paragraphCount += 1;
  if ((node.clientNodeId ?? '').startsWith('bullet-')) next.bulletCount += 1;
  if (/^callout-\d+$/.test(node.clientNodeId ?? '')) next.calloutCount += 1;
  if ((node.clientNodeId ?? '').startsWith('worked-example-')) next.workedExampleCount += 1;
  if (
    node.type === 'basicFlashcard' ||
    node.type === 'conceptCard' ||
    node.type === 'descriptorCard' ||
    node.type === 'clozeCard' ||
    node.type === 'multipleChoiceCard' ||
    node.type === 'listAnswerCard'
  ) {
    next.flashcardCount += 1;
  }
  if (/-chunk-\d+$/.test(node.clientNodeId ?? '')) next.splitChunkCount += 1;
  for (const child of node.children ?? []) {
    analyzeTree(child, depth + 1, next);
  }
  return next;
}

export function getMarkdownStyledTreeStats(tree: StyledRemTreeNode): MarkdownTreeStats {
  return analyzeTree(tree);
}

function treeOutputText(node: StyledRemTreeNode): string {
  const self =
    node.type === 'basicFlashcard' || node.type === 'conceptCard' || node.type === 'descriptorCard'
      ? [node.front, node.back ?? node.answer].filter(Boolean).join('\n')
      : node.richText?.length
        ? node.richText.map((span: any) =>
            span.type === 'inlineMath' ? `\\(${span.latex ?? span.text ?? ''}\\)` : span.latex ?? span.text ?? ''
          ).join('')
        : nodeText(node);
  return [self, ...(node.children ?? []).map((child: StyledRemTreeNode) => treeOutputText(child))].join('\n');
}

function previewOutline(node: StyledRemTreeNode, depth = 0, output: string[] = []): string[] {
  output.push(`${'  '.repeat(depth)}- ${nodeText(node)}`.slice(0, 240));
  for (const child of node.children ?? []) {
    previewOutline(child, depth + 1, output);
  }
  return output;
}

function assertPlanLimits(plan: MarkdownImportPlan) {
  const { stats, options } = plan;
  if (stats.nodeCount > options.limits.maxNodes) {
    throw new Error(
      `Markdown import node count exceeds maxNodes. actualNodeCount=${stats.nodeCount}; maxNodes=${options.limits.maxNodes}.`
    );
  }
  if (stats.maxDepth > options.limits.maxDepth) {
    throw new Error(
      `Markdown import depth exceeds maxDepth. actualDepth=${stats.maxDepth}; maxDepth=${options.limits.maxDepth}.`
    );
  }
}

export function parseMarkdownImportPlan(
  markdownText: string,
  options: MarkdownImportParseOptions = {}
): MarkdownImportPlan {
  const normalizedOptions = normalizeOptions(options);
  const markdown = markdownText.trim();
  if (!markdown) {
    throw new Error('markdownText is empty.');
  }
  if (markdown.length > normalizedOptions.limits.maxMarkdownChars) {
    throw new Error(
      `markdownText exceeds maxMarkdownChars. actualChars=${markdown.length}; maxMarkdownChars=${normalizedOptions.limits.maxMarkdownChars}.`
    );
  }
  const formulaValidation = validateMarkdownMathDelimiters(markdown, normalizedOptions.mathOptions);
  if (!formulaValidation.valid && normalizedOptions.mathOptions.rejectMalformedMath) {
    throw new Error(`Markdown math delimiter validation failed: ${formulaValidation.errors.join('; ')}`);
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const rootSelection = selectRootTitle(markdown, lines, normalizedOptions.headingMapping);
  const root: StyledRemTreeNode = {
    clientNodeId: 'markdown-root',
    type: 'rem',
    text: rootSelection.title,
    style: {
      headingLevel: normalizedOptions.headingMapping.rootHeadingLevel,
    },
    children: [],
  };
  const snippets: string[] = [];
  addSnippet(snippets, rootSelection.title);
  const stack: HeadingStackEntry[] = [{ markdownLevel: 1, node: root }];
  let paragraph: string[] = [];
  let spacerCount = 0;
  let paragraphCount = 0;
  let codeCount = 0;
  let tableCount = 0;
  let bulletCount = 0;
  let calloutCount = 0;
  let skippedRootHeading = false;

  const currentParent = () => stack[stack.length - 1].node;

  function flushParagraph() {
    if (!paragraph.length) return;
    const chunks = splitTextFormulaSafe(paragraph.join(' '));
    paragraph = [];
    if (!chunks.length) return;
    chunks.forEach((text, chunkIndex) => {
      paragraphCount += 1;
      const baseId =
        chunks.length > 1
          ? `paragraph-${paragraphCount}-chunk-${chunkIndex + 1}`
          : `paragraph-${paragraphCount}`;
      const flashcard = flashcardNodeFromText(
        baseId,
        text,
        normalizedOptions.flashcardOptions
      );
      const node =
        flashcard ??
        inlineMarkdownNode(
          isWorkedExampleText(text) ? `worked-example-${paragraphCount}` : baseId,
          text,
          {
            style: isWorkedExampleText(text)
              ? { headingLevel: normalizedOptions.headingMapping.sectionHeadingLevel }
              : undefined,
          }
        );
      pushChild(currentParent(), node);
      addNodeSourceSnippets(snippets, node, text);
    });
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const heading = headingMatch(line);

    if (heading) {
      if (rootSelection.skipFirstHeading && !skippedRootHeading && heading.level === 1 && heading.title === rootSelection.title) {
        skippedRootHeading = true;
        continue;
      }
      flushParagraph();
      while (stack.length > 1 && stack[stack.length - 1].markdownLevel >= heading.level) {
        stack.pop();
      }
      if (
        normalizedOptions.remnoteLayout.insertSpacerBetweenSections &&
        heading.level <= 3 &&
        hasPriorHeadingSibling(currentParent())
      ) {
        pushChild(currentParent(), spacerNode(spacerCount += 1, normalizedOptions.remnoteLayout.spacerText));
      }
      const node = pushChild(currentParent(), {
        clientNodeId: `heading-${index + 1}`,
        type: 'rem',
        text: heading.title,
        style: {
          headingLevel: headingStyleForMarkdownLevel(heading.level, normalizedOptions.headingMapping),
        },
        children: [],
      });
      addSnippet(snippets, heading.title);
      stack.push({ markdownLevel: heading.level, node });
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (/^```/.test(trimmed)) {
      flushParagraph();
      const block = [line];
      index += 1;
      while (index < lines.length) {
        block.push(lines[index]);
        if (/^```/.test(lines[index].trim())) break;
        index += 1;
      }
      const text = block.join('\n');
      pushChild(currentParent(), {
        clientNodeId: `code-${codeCount += 1}`,
        type: 'rem',
        text,
      });
      addSnippet(snippets, text);
      continue;
    }

    if (trimmed === '$$' || trimmed.startsWith('$$') || trimmed === '\\[' || trimmed.startsWith('\\[')) {
      flushParagraph();
      const close = trimmed.startsWith('\\[') ? '\\]' : '$$';
      const openLength = trimmed.startsWith('\\[') ? 2 : 2;
      const afterOpen = trimmed.slice(openLength);
      const sameLineClose =
        afterOpen.length > close.length && afterOpen.endsWith(close);
      const mathLines = sameLineClose
        ? [afterOpen.slice(0, -close.length).trim()]
        : afterOpen.trim()
          ? [afterOpen.trim()]
          : [];
      if (!sameLineClose) {
        while (index + 1 < lines.length) {
          index += 1;
          const next = lines[index].trim();
          if (next === close || next.endsWith(close)) {
            const beforeClose = next === close ? '' : next.slice(0, -close.length).trim();
            if (beforeClose) {
              mathLines.push(beforeClose);
            }
            break;
          }
          mathLines.push(lines[index]);
        }
      }
      const latex = mathLines.join('\n').trim();
      pushChild(currentParent(), {
        clientNodeId: `math-block-${index + 1}`,
        type: 'mathBlock',
        latex,
        richText: [{ type: 'mathBlock', latex }],
      });
      addSnippet(snippets, latex);
      continue;
    }

    if (tableLike(lines, index)) {
      flushParagraph();
      const tableLines = [line];
      index += 1;
      tableLines.push(lines[index]);
      while (index + 1 < lines.length && lines[index + 1].includes('|') && lines[index + 1].trim()) {
        index += 1;
        tableLines.push(lines[index]);
      }
      const tableNode = tableToRemNode(tableLines, tableCount += 1);
      pushChild(currentParent(), tableNode);
      for (let tableLineIndex = 0; tableLineIndex < tableLines.length; tableLineIndex += 1) {
        if (tableLineIndex === 1) {
          continue;
        }
        const tableLine = tableLines[tableLineIndex];
        for (const cell of tableCells(tableLine)) {
          addInlineSourceSnippets(snippets, cell);
        }
      }
      continue;
    }

    const blockquote = blockquoteMatch(line);
    if (blockquote !== null) {
      flushParagraph();
      const quoteLines = [blockquote];
      while (index + 1 < lines.length) {
        const nextQuote = blockquoteMatch(lines[index + 1]);
        if (nextQuote === null) {
          break;
        }
        index += 1;
        quoteLines.push(nextQuote);
      }
      const first = quoteLines[0]?.trim() ?? '';
      const admonition = /^\[!(\w+)\]\s*(.*)$/.exec(first);
      const label = admonition
        ? `${admonition[1].slice(0, 1).toUpperCase()}${admonition[1].slice(1).toLowerCase()}`
        : 'Callout';
      const title = stripMarkdownInline(admonition?.[2] || quoteLines.find((entry) => entry.trim()) || label);
      const body = admonition ? quoteLines.slice(1) : quoteLines.slice(1);
      const calloutChildren = body
        .map((entry, entryIndex) => entry.trim())
        .filter(Boolean)
        .map((entry, entryIndex) =>
          inlineMarkdownNode(`callout-${calloutCount + 1}-body-${entryIndex + 1}`, entry)
        );
      const calloutNode = inlineMarkdownNode(
        `callout-${calloutCount += 1}`,
        title ? `${label}: ${title}` : label,
        { children: calloutChildren }
      );
      pushChild(currentParent(), calloutNode);
      if (title) {
        addInlineSourceSnippets(snippets, title);
      }
      for (const entry of body) {
        addInlineSourceSnippets(snippets, entry);
      }
      continue;
    }

    const bullet = bulletMatch(line);
    if (bullet) {
      flushParagraph();
      const bulletParent = currentParent();
      const bulletStack: Array<{ indent: number; node: StyledRemTreeNode }> = [{ indent: -1, node: bulletParent }];
      while (index < lines.length) {
        const current = bulletMatch(lines[index]);
        if (!current) {
          index -= 1;
          break;
        }
        while (bulletStack.length > 1 && bulletStack[bulletStack.length - 1].indent >= current.indent) {
          bulletStack.pop();
        }
        const bulletText =
          normalizedOptions.remnoteLayout.bulletMode === 'preserve_markdown_bullets'
            ? `${current.marker} ${current.text}`
            : current.text;
        const chunks = splitTextFormulaSafe(bulletText);
        const firstChunk = chunks[0] ?? stripMarkdownInline(bulletText);
        const flashcard = flashcardNodeFromText(
          `bullet-${bulletCount + 1}`,
          firstChunk,
          normalizedOptions.flashcardOptions
        );
        const node = pushChild(
          bulletStack[bulletStack.length - 1].node,
          flashcard ??
            inlineMarkdownNode(
              `bullet-${bulletCount += 1}`,
              firstChunk,
              {
                children: chunks.slice(1).map((chunk, chunkIndex) =>
                  inlineMarkdownNode(
                    `bullet-${bulletCount}-chunk-${chunkIndex + 2}`,
                    chunk
                  )
                ),
              }
            )
        );
        if (flashcard) {
          bulletCount += 1;
        }
        addNodeSourceSnippets(snippets, node, current.text);
        bulletStack.push({ indent: current.indent, node });
        index += 1;
      }
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();

  const outputText = treeOutputText(root);
  const plan: MarkdownImportPlan = {
    tree: root,
    sourceHash: stableHash(markdown),
    outputHash: stableHash(outputText),
    sourceSnippets: Array.from(new Set(snippets.map((snippet) => normalizeWhitespace(snippet)).filter(Boolean))),
    stats: analyzeTree(root),
    options: normalizedOptions,
    previewOutline: previewOutline(root),
    formulaValidation,
  };
  assertPlanLimits(plan);
  return plan;
}

export function verifyMarkdownSourceFidelity(
  sourceSnippets: readonly string[],
  outputText: string,
  options: MarkdownImportFidelityOptions = {},
  expectedStats?: Partial<MarkdownTreeStats>
): MarkdownSourceFidelityReport {
  const fidelity = {
    ...DEFAULT_FIDELITY_OPTIONS,
    ...options,
  };
  const haystack = fidelity.allowWhitespaceNormalization ? normalizeWhitespace(outputText) : outputText;
  const comparableHaystack = fidelity.allowWhitespaceNormalization
    ? normalizeWhitespace(stripMarkdownInline(outputText))
    : stripMarkdownInline(outputText);
  const missingTextSnippets = sourceSnippets.filter((snippet) => {
    const needle = fidelity.allowWhitespaceNormalization ? normalizeWhitespace(snippet) : snippet;
    const comparableNeedle = fidelity.allowWhitespaceNormalization
      ? normalizeWhitespace(stripMarkdownInline(snippet))
      : stripMarkdownInline(snippet);
    return Boolean(needle) && !haystack.includes(needle) && !comparableHaystack.includes(comparableNeedle);
  });
  const pollutionRems = outputText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => ['Size', 'H1', 'H2', 'H3', 'normal'].includes(line));
  const structureMismatches: string[] = [];
  if (fidelity.preserveSourceOrder) {
    let cursor = 0;
    for (const snippet of sourceSnippets) {
      const needle = fidelity.allowWhitespaceNormalization
        ? normalizeWhitespace(stripMarkdownInline(snippet))
        : stripMarkdownInline(snippet);
      if (!needle) continue;
      const index = comparableHaystack.indexOf(needle, cursor);
      if (index < 0) continue;
      if (index < cursor) {
        structureMismatches.push(`Source order mismatch near "${needle.slice(0, 80)}".`);
        break;
      }
      cursor = index + needle.length;
    }
  }
  if (pollutionRems.length) {
    structureMismatches.push(`Formatting pollution Rems detected: ${Array.from(new Set(pollutionRems)).join(', ')}.`);
  }
  return {
    passed: missingTextSnippets.length === 0 && structureMismatches.length === 0 && pollutionRems.length === 0,
    checkedNodeCount: sourceSnippets.length,
    headingCount: expectedStats?.headingCount ?? 0,
    paragraphCount: expectedStats?.paragraphCount ?? 0,
    bulletCount: expectedStats?.bulletCount ?? 0,
    mathBlockCount: expectedStats?.mathBlockCount ?? 0,
    inlineMathCount: expectedStats?.inlineMathCount ?? 0,
    codeBlockCount: expectedStats?.codeBlockCount ?? 0,
    tableCount: expectedStats?.tableCount ?? 0,
    missingTextSnippets,
    extraTextSnippets: [],
    structureMismatches,
    pollutionRems,
  };
}

export function markdownImportOutputTextFromTree(tree: StyledRemTreeNode): string {
  return treeOutputText(tree);
}

function normalizeMarkdownImportMode(
  mode: CreateOrReplaceNoteFromMarkdownArgs['mode']
): Required<CreateOrReplaceNoteFromMarkdownArgs>['mode'] {
  switch (mode) {
    case undefined:
      return 'create_child';
    case 'create_child':
    case 'append_to_target':
    case 'replace_target_children':
    case 'update_target_and_replace_children':
      return mode;
    default:
      throw new Error('mode must be create_child, append_to_target, replace_target_children, or update_target_and_replace_children.');
  }
}

function normalizeMarkdownImportDuplicatePolicy(
  duplicatePolicy: CreateOrReplaceNoteFromMarkdownArgs['duplicatePolicy']
): Required<CreateOrReplaceNoteFromMarkdownArgs>['duplicatePolicy'] {
  switch (duplicatePolicy) {
    case undefined:
      return 'create_new';
    case 'skip':
    case 'replace':
    case 'create_new':
      return duplicatePolicy;
    default:
      throw new Error('duplicatePolicy must be skip, replace, or create_new.');
  }
}

export function normalizeMarkdownImportArgs(args: CreateOrReplaceNoteFromMarkdownArgs): NormalizedMarkdownImportArgs {
  const presetArgs = applyStylePresetToMarkdownArgs(args);
  const options = normalizeOptions(presetArgs);
  return {
    parentRemId: presetArgs.parentRemId ?? '',
    targetRemId: presetArgs.targetRemId ?? '',
    markdownText: presetArgs.markdownText,
    mode: normalizeMarkdownImportMode(presetArgs.mode),
    duplicatePolicy: normalizeMarkdownImportDuplicatePolicy(presetArgs.duplicatePolicy),
    stylePreset: presetArgs.stylePreset ?? undefined,
    course: presetArgs.course ?? '',
    rootHeadingLevel: presetArgs.rootHeadingLevel ?? 'H1',
    sectionHeadingLevel: presetArgs.sectionHeadingLevel ?? 'H3',
    insertSiblingSpacers: presetArgs.insertSiblingSpacers ?? false,
    spacerText: presetArgs.spacerText ?? '',
    majorFormulaMode: presetArgs.majorFormulaMode ?? 'mathBlockRem',
    verifyAfterWrite: presetArgs.verifyAfterWrite ?? true,
    headingMapping: options.headingMapping,
    remnoteLayout: options.remnoteLayout,
    mathOptions: options.mathOptions,
    fidelityOptions: options.fidelityOptions,
    flashcardOptions: options.flashcardOptions,
    safetyOptions: {
      dryRun: presetArgs.safetyOptions?.dryRun ?? false,
      verifyAfterWrite: presetArgs.safetyOptions?.verifyAfterWrite ?? true,
      rollbackOnFailure: presetArgs.safetyOptions?.rollbackOnFailure ?? true,
      idempotencyKey: presetArgs.safetyOptions?.idempotencyKey ?? '',
    },
    limits: options.limits,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}
