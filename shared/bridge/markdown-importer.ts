import type {
  CreateOrReplaceNoteFromMarkdownArgs,
  MarkdownImportFidelityOptions,
  MarkdownImportHeadingMapping,
  MarkdownImportLimits,
  MarkdownImportRemnoteLayout,
  MarkdownImportSafetyOptions,
  MarkdownMathOptions,
  NoteStylePresetFields,
  RemHeadingLevel,
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
  bulletMode: 'preserve_markdown_bullets',
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

export interface MarkdownImportParseOptions extends NoteStylePresetFields {
  headingMapping?: MarkdownImportHeadingMapping;
  remnoteLayout?: MarkdownImportRemnoteLayout;
  mathOptions?: MarkdownMathOptions;
  fidelityOptions?: MarkdownImportFidelityOptions;
  limits?: MarkdownImportLimits;
}

export interface MarkdownTreeStats {
  nodeCount: number;
  maxDepth: number;
  headingCount: number;
  mathBlockCount: number;
  inlineMathCount: number;
  codeBlockCount: number;
  tableCount: number;
  paragraphCount: number;
  bulletCount: number;
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
    limits: Required<MarkdownImportLimits>;
  };
  previewOutline: string[];
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

function stripMarkdownInline(value: string): string {
  return normalizeWhitespace(
    value
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
  if (node.front !== undefined) return node.front;
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

function addSnippet(snippets: string[], value: string) {
  const normalized = stripMarkdownInline(value);
  if (normalized) {
    snippets.push(normalized);
  }
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

function bulletMatch(line: string): { indent: number; text: string } | null {
  const match = /^(\s*)([-*+]|\d+[.)])\s+(.+)$/.exec(line);
  if (!match) return null;
  return {
    indent: match[1].replace(/\t/g, '    ').length,
    text: `${match[2]} ${match[3]}`,
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
    paragraphCount: 0,
    bulletCount: 0,
  };
  next.nodeCount += 1;
  next.maxDepth = Math.max(next.maxDepth, depth);
  if (node.style?.headingLevel && node.style.headingLevel !== 'normal') next.headingCount += 1;
  if (node.type === 'mathBlock' || node.richText?.some((span: any) => span.type === 'mathBlock')) next.mathBlockCount += 1;
  if (node.richText?.some((span: any) => span.type === 'inlineMath') || /\$[^$\n]+?\$|\\\(.+?\\\)/.test(nodeText(node))) {
    next.inlineMathCount += 1;
  }
  if ((node.clientNodeId ?? '').startsWith('code-')) next.codeBlockCount += 1;
  if ((node.clientNodeId ?? '').startsWith('table-')) next.tableCount += 1;
  if ((node.clientNodeId ?? '').startsWith('paragraph-')) next.paragraphCount += 1;
  if ((node.clientNodeId ?? '').startsWith('bullet-')) next.bulletCount += 1;
  for (const child of node.children ?? []) {
    analyzeTree(child, depth + 1, next);
  }
  return next;
}

export function getMarkdownStyledTreeStats(tree: StyledRemTreeNode): MarkdownTreeStats {
  return analyzeTree(tree);
}

function treeOutputText(node: StyledRemTreeNode): string {
  const self = node.richText?.length
    ? node.richText.map((span: any) => span.latex ?? span.text ?? '').join('')
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
  let skippedRootHeading = false;

  const currentParent = () => stack[stack.length - 1].node;

  function flushParagraph() {
    if (!paragraph.length) return;
    const text = normalizeWhitespace(paragraph.join(' '));
    paragraph = [];
    if (!text) return;
    const node: StyledRemTreeNode = {
      clientNodeId: `paragraph-${paragraphCount += 1}`,
      type: 'rem',
      text,
    };
    pushChild(currentParent(), node);
    addSnippet(snippets, text);
    for (const snippet of extractMathSnippets(text)) {
      addSnippet(snippets, snippet);
    }
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
      const first = trimmed.slice(openLength).replace(close, '').trim();
      const mathLines = first ? [first] : [];
      while (!trimmed.endsWith(close) && index + 1 < lines.length) {
        index += 1;
        const next = lines[index].trim();
        if (next.endsWith(close)) {
          mathLines.push(next.slice(0, -close.length).trim());
          break;
        }
        mathLines.push(lines[index]);
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
      const text = tableLines.join('\n');
      pushChild(currentParent(), {
        clientNodeId: `table-${tableCount += 1}`,
        type: 'rem',
        text,
      });
      addSnippet(snippets, text);
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
        const text =
          normalizedOptions.remnoteLayout.bulletMode === 'plain_child_rems'
            ? current.text.replace(/^([-*+]|\d+[.)])\s+/, '')
            : current.text;
        const node = pushChild(bulletStack[bulletStack.length - 1].node, {
          clientNodeId: `bullet-${bulletCount += 1}`,
          type: 'rem',
          text,
          children: [],
        });
        addSnippet(snippets, text);
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
  const missingTextSnippets = sourceSnippets.filter((snippet) => {
    const needle = fidelity.allowWhitespaceNormalization ? normalizeWhitespace(snippet) : snippet;
    return Boolean(needle) && !haystack.includes(needle);
  });
  const pollutionRems = outputText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => ['Size', 'H1', 'H2', 'H3', 'normal'].includes(line));
  const structureMismatches: string[] = [];
  if (fidelity.preserveSourceOrder) {
    let cursor = 0;
    for (const snippet of sourceSnippets) {
      const needle = fidelity.allowWhitespaceNormalization ? normalizeWhitespace(snippet) : snippet;
      if (!needle) continue;
      const index = haystack.indexOf(needle, cursor);
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
