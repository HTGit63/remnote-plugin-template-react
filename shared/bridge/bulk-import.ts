export type BulkImportJobStatus =
  | 'planned'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'partial'
  | 'cancelled'
  | 'needs_manual_review';

export type BulkImportChunkStatus =
  | 'pending'
  | 'running'
  | 'written'
  | 'written_not_verified'
  | 'verified'
  | 'partial'
  | 'partial_needs_verification'
  | 'failed'
  | 'skipped_already_verified'
  | 'needs_manual_review';

export type BulkImportVerificationStatus =
  | 'passed'
  | 'failed'
  | 'partial'
  | 'written_not_verified'
  | 'source_fidelity_failed'
  | 'not_verifiable';

export type BulkImportAttemptState =
  | 'dispatching'
  | 'acknowledged'
  | 'unknown'
  | 'failed_before_write';

export type BulkImportReconciliationStatus =
  | 'not_required'
  | 'required'
  | 'reconciled_written'
  | 'reconciled_not_written'
  | 'manual_review';

export interface BulkImportChunkAttempt {
  attemptId: string;
  operationId: string;
  state: BulkImportAttemptState;
  expectedParent: string;
  sourceHash: string;
  semanticHash: string;
  idempotencyKey: string;
  stage: 'chunk_write';
  startedAt: string;
  finishedAt?: string;
  hierarchyCreatedRemIds: string[];
  createdRemIds: string[];
  updatedRemIds: string[];
  pluginVerificationPassed?: boolean;
  readbackVerificationPassed?: boolean;
  error?: string;
  errorCode?: string;
  lifecycle?: unknown[];
  provenance: 'runtime' | 'legacy_migration' | 'reconciliation';
}

export type BulkImportSourceNormalization = 'none' | 'auto' | 'remnote_export';

export interface BulkImportPlannerOptions {
  maxCharsPerChunk?: number;
  maxRemsPerChunk?: number;
  maxDepth?: number;
  maxChildrenPerParent?: number;
}

export interface PlanNoteImportInput {
  ownerId?: string;
  sourceName?: string;
  sourceKind?: 'inline_text' | 'file';
  sourceFilePath?: string;
  sourceText?: string;
  targetRootId: string;
  chapterSelector?: string;
  startMarker?: string;
  stopBeforeMarker?: string;
  rootTitle?: string;
  chapterTitle?: string;
  sourceNormalization?: BulkImportSourceNormalization;
  options?: BulkImportPlannerOptions;
}

export interface BulkImportSourceMetadata {
  sourceKind: 'inline_text' | 'file';
  sourceFilePath?: string;
  sourceName?: string;
  startMarker?: string;
  stopBeforeMarker?: string;
  startLine?: number;
  stopLine?: number;
  stopMarkerFound?: boolean;
  rawSourceLength: number;
  rawSourceHash: string;
  extractedSourceLength: number;
  extractedSourceHash: string;
  plannedSourceLength: number;
  plannedSourceHash: string;
  semanticSourceHash: string;
  normalization: BulkImportSourceNormalization;
  normalizationDescription: string;
}

export type BulkImportSemanticUnitKind =
  | 'heading'
  | 'paragraph'
  | 'list_item'
  | 'ordered_list_item'
  | 'blockquote'
  | 'inline_math'
  | 'block_math'
  | 'code'
  | 'table_cell';

export interface BulkImportSemanticUnit {
  unitId: string;
  kind: BulkImportSemanticUnitKind;
  semanticText: string;
  rawText: string;
  sourceSpan: {
    startLine: number;
    endLine: number;
  };
  parentPath: string[];
  listMarker?: string;
}

export interface BulkImportSupportedLoss {
  feature: 'link_destination' | 'inline_code_style' | 'code_language' | 'native_table' | 'ordered_list_marker';
  detail: string;
}

export interface BulkImportSourceManifest {
  rawSourceHash: string;
  semanticHash: string;
  units: BulkImportSemanticUnit[];
  hierarchyRelationships: Array<{
    unitId: string;
    parentPath: string[];
  }>;
  formattingExpectations: Array<'emphasis' | 'link' | 'inline_math' | 'block_math' | 'blockquote' | 'code' | 'table' | 'ordered_list'>;
  supportedLosses: BulkImportSupportedLoss[];
}

export interface BulkImportHierarchyMismatch {
  chunkId: string;
  semanticText: string;
  sourceSpan?: BulkImportSemanticUnit['sourceSpan'];
  expectedParentRemId?: string;
  actualParentRemId?: string;
  remId?: string;
}

export interface BulkImportChunk {
  chunkId: string;
  targetRootId: string;
  importRootTitle?: string;
  importRootRemId?: string;
  chapterRootRemId?: string;
  chapterTitle: string;
  sectionRootRemId?: string;
  sectionKey: string;
  sectionTitle: string;
  chunkIndex: number;
  logicalSectionKey: string;
  nativeChunkIndex: number;
  sourceText: string;
  sourceHash: string;
  sourceManifest: BulkImportSourceManifest;
  expectedSourceText: string;
  expectedSourceHash: string;
  expectedParent: string;
  chunkParentRemId?: string;
  hierarchyCreatedRemIds: string[];
  createdRemIds: string[];
  updatedRemIds: string[];
  attempts: BulkImportChunkAttempt[];
  reconciliationStatus: BulkImportReconciliationStatus;
  reconciliationProvenance?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  verificationStatus: BulkImportVerificationStatus;
  status: BulkImportChunkStatus;
  error?: string;
  retryCount: number;
  idempotencyKey: string;
  charCount: number;
  estimatedRemCount: number;
}

export interface BulkImportSection {
  sectionKey: string;
  title: string;
  sourceHash: string;
  sourceManifest: BulkImportSourceManifest;
  sourceText: string;
  bodySourceText: string;
  sectionRootRemId?: string;
  idempotencyKey?: string;
  chunkCount: number;
  chunks: BulkImportChunk[];
}

export interface BulkImportPlan {
  ok: true;
  planId: string;
  ownerId?: string;
  sourceName?: string;
  sourceHash: string;
  sourceManifest: BulkImportSourceManifest;
  sourceMetadata: BulkImportSourceMetadata;
  plannedSourceLength: number;
  extractedSourceLength: number;
  targetRootId: string;
  importRootTitle?: string;
  importRootRemId?: string;
  importRootIdempotencyKey?: string;
  chapterRootRemId?: string;
  chapterIdempotencyKey: string;
  chapterSelector?: string;
  chapterTitle: string;
  sections: BulkImportSection[];
  chunks: BulkImportChunk[];
  estimatedChunks: number;
  logicalChunkCount: number;
  nativeChunkCount: number;
  estimatedRems: number;
  warnings: string[];
  options: Required<BulkImportPlannerOptions>;
}

export interface BulkImportCheckpoint {
  at: string;
  sectionKey?: string;
  chunkIndex?: number;
  chunkId?: string;
  status: BulkImportChunkStatus | BulkImportJobStatus;
  message?: string;
}

export interface BulkImportVerificationResult {
  ok: boolean;
  status: BulkImportVerificationStatus | 'source_fidelity_failed';
  jobId?: string;
  sectionKey?: string;
  chunkIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  rawSourceHash?: string;
  semanticHash?: string;
  renderedReadbackHash?: string;
  missingUnits?: BulkImportSemanticUnit[];
  extraUnits?: BulkImportSemanticUnit[];
  missingTextPreview?: string;
  extraTextPreview?: string;
  duplicateSections?: string[];
  missingChunks?: string[];
  wrongParentChunks?: string[];
  hierarchyMismatches?: BulkImportHierarchyMismatch[];
  warnings: string[];
  recommendedAction?: string;
  method: 'semantic_manifest' | 'normalized_plain_text' | 'manifest_only';
}

export interface BulkImportJob {
  schemaVersion: 2;
  jobId: string;
  revision: number;
  planId: string;
  ownerId?: string;
  sourceName?: string;
  sourceHash: string;
  sourceMetadata: BulkImportSourceMetadata;
  plannedSourceLength: number;
  extractedSourceLength: number;
  targetRootId: string;
  importRootTitle?: string;
  importRootRemId?: string;
  importRootIdempotencyKey?: string;
  chapterTitle: string;
  status: BulkImportJobStatus;
  storageDurability: 'memory_only' | 'persistent';
  sections: BulkImportSection[];
  chunks: BulkImportChunk[];
  checkpoints: BulkImportCheckpoint[];
  events: BulkImportCheckpoint[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  chapterRootRemId?: string;
  chapterIdempotencyKey: string;
  lastError?: string;
}

const DEFAULT_BULK_IMPORT_OPTIONS: Required<BulkImportPlannerOptions> = {
  maxCharsPerChunk: 6000,
  maxRemsPerChunk: 30,
  maxDepth: 8,
  maxChildrenPerParent: 50,
};

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(value as number), min), max);
}

function normalizePlannerOptions(options: BulkImportPlannerOptions = {}): Required<BulkImportPlannerOptions> {
  return {
    maxCharsPerChunk: clampInt(options.maxCharsPerChunk, DEFAULT_BULK_IMPORT_OPTIONS.maxCharsPerChunk, 500, 24000),
    maxRemsPerChunk: clampInt(options.maxRemsPerChunk, DEFAULT_BULK_IMPORT_OPTIONS.maxRemsPerChunk, 1, 120),
    maxDepth: clampInt(options.maxDepth, DEFAULT_BULK_IMPORT_OPTIONS.maxDepth, 1, 12),
    maxChildrenPerParent: clampInt(
      options.maxChildrenPerParent,
      DEFAULT_BULK_IMPORT_OPTIONS.maxChildrenPerParent,
      1,
      200
    ),
  };
}

export function stableBulkImportHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function semanticInlineText(value: string, renderedReadback: boolean): string {
  return value
    .normalize('NFC')
    .replace(renderedReadback ? /^Callout:\s*/i : /$^/, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\\\[([\s\S]+?)\\\]/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
    .replace(/\\\(([\s\S]+?)\\\)/g, '$1')
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/__([^_\n]+?)__/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?=$|[^*])/g, '$1$2')
    .replace(/(^|[^A-Za-z0-9_])_([^_\n]+?)_(?=$|[^A-Za-z0-9_])/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function buildBulkImportSourceManifest(
  text: string,
  options: { renderedReadback?: boolean } = {}
): BulkImportSourceManifest {
  const normalizedSource = text.replace(/\r\n/g, '\n').normalize('NFC');
  const lines = normalizedSource.split('\n');
  const units: BulkImportSemanticUnit[] = [];
  const headingStack: Array<{ level: number; text: string }> = [];
  const listStack: Array<{ indent: number; text: string }> = [];
  const formattingExpectations = new Set<BulkImportSourceManifest['formattingExpectations'][number]>();
  const supportedLosses = new Map<BulkImportSupportedLoss['feature'], BulkImportSupportedLoss>();

  if (/\*\*[^*]+\*\*|__[^_]+__|(^|\W)\*[^*\n]+\*|(^|\W)_[^_\n]+_/m.test(normalizedSource)) {
    formattingExpectations.add('emphasis');
  }
  if (/!?\[[^\]]+\]\([^)]+\)/.test(normalizedSource)) {
    formattingExpectations.add('link');
    supportedLosses.set('link_destination', {
      feature: 'link_destination',
      detail: 'The current rich-text write schema preserves link labels but has no link-destination node.',
    });
  }
  if (/`[^`\n]+`/.test(normalizedSource)) {
    supportedLosses.set('inline_code_style', {
      feature: 'inline_code_style',
      detail: 'Inline code text is preserved, but the current rich-text schema has no native code-span style.',
    });
  }
  if (/\$[^$\n]+\$|\\\([\s\S]+?\\\)/.test(normalizedSource)) {
    formattingExpectations.add('inline_math');
  }
  if (/\$\$|\\\[/.test(normalizedSource)) {
    formattingExpectations.add('block_math');
  }
  if (/^\s*>/m.test(normalizedSource)) formattingExpectations.add('blockquote');
  if (/^\s*(?:```|~~~)/m.test(normalizedSource)) {
    formattingExpectations.add('code');
    supportedLosses.set('code_language', {
      feature: 'code_language',
      detail: 'Fenced code content is preserved without visible fences; native language metadata is unavailable.',
    });
  }
  if (/^\s*\|?.+\|.+\|?\s*$/m.test(normalizedSource)) {
    formattingExpectations.add('table');
    supportedLosses.set('native_table', {
      feature: 'native_table',
      detail: 'Markdown tables are represented as a row-and-cell Rem hierarchy.',
    });
  }
  if (/^\s*\d+[.)]\s+/m.test(normalizedSource)) {
    formattingExpectations.add('ordered_list');
    supportedLosses.set('ordered_list_marker', {
      feature: 'ordered_list_marker',
      detail: 'Ordered items preserve source order even when visible numeric markers are not native metadata.',
    });
  }

  const addUnit = (input: Omit<BulkImportSemanticUnit, 'unitId'>) => {
    if (!input.semanticText) return;
    units.push({
      ...input,
      unitId: `unit:${String(units.length + 1).padStart(4, '0')}:line:${input.sourceSpan.startLine}`,
    });
  };

  let inFence = false;
  let fenceMarker = '';
  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    const lineNumber = index + 1;
    const fence = /^(?:```|~~~)/.exec(trimmed)?.[0];
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence;
      } else if (trimmed.startsWith(fenceMarker)) {
        inFence = false;
        fenceMarker = '';
      }
      continue;
    }
    if (inFence) {
      addUnit({
        kind: 'code',
        semanticText: rawLine.normalize('NFC').replace(/[ \t]+$/, ''),
        rawText: rawLine,
        sourceSpan: { startLine: lineNumber, endLine: lineNumber },
        parentPath: headingStack.map((entry) => entry.text),
      });
      continue;
    }
    if (!trimmed) {
      listStack.length = 0;
      continue;
    }

    if (trimmed === '$$' || trimmed === '\\[' || trimmed.startsWith('$$') || trimmed.startsWith('\\[')) {
      const close = trimmed.startsWith('\\[') ? '\\]' : '$$';
      const blockLines = [trimmed];
      const startLine = lineNumber;
      while (!blockLines[blockLines.length - 1].endsWith(close) || blockLines.length === 1 && trimmed === close) {
        if (index + 1 >= lines.length) break;
        index += 1;
        blockLines.push(lines[index].trim());
        if (lines[index].trim() === close || lines[index].trim().endsWith(close)) break;
      }
      const semanticText = semanticInlineText(blockLines.join(' '), Boolean(options.renderedReadback));
      addUnit({
        kind: 'block_math',
        semanticText,
        rawText: blockLines.join('\n'),
        sourceSpan: { startLine, endLine: index + 1 },
        parentPath: headingStack.map((entry) => entry.text),
      });
      listStack.length = 0;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const semanticText = semanticInlineText(heading[2], Boolean(options.renderedReadback));
      while (headingStack.length && headingStack[headingStack.length - 1].level >= level) headingStack.pop();
      addUnit({
        kind: 'heading',
        semanticText,
        rawText: rawLine,
        sourceSpan: { startLine: lineNumber, endLine: lineNumber },
        parentPath: headingStack.map((entry) => entry.text),
      });
      headingStack.push({ level, text: semanticText });
      listStack.length = 0;
      continue;
    }

    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(trimmed)) {
      continue;
    }
    if (trimmed.includes('|') && /^\|.*\|$/.test(trimmed)) {
      for (const cell of markdownTableCells(trimmed)) {
        addUnit({
          kind: 'table_cell',
          semanticText: semanticInlineText(cell, Boolean(options.renderedReadback)),
          rawText: cell,
          sourceSpan: { startLine: lineNumber, endLine: lineNumber },
          parentPath: headingStack.map((entry) => entry.text),
        });
      }
      listStack.length = 0;
      continue;
    }

    const list = /^(\s*)([-*+]|\d+[.)])\s+(.+)$/.exec(rawLine);
    if (list) {
      const indent = list[1].replace(/\t/g, '    ').length;
      while (listStack.length && listStack[listStack.length - 1].indent >= indent) listStack.pop();
      const semanticText = semanticInlineText(list[3], Boolean(options.renderedReadback));
      addUnit({
        kind: /^\d/.test(list[2]) ? 'ordered_list_item' : 'list_item',
        semanticText,
        rawText: rawLine,
        sourceSpan: { startLine: lineNumber, endLine: lineNumber },
        parentPath: [
          ...headingStack.map((entry) => entry.text),
          ...listStack.map((entry) => entry.text),
        ],
        listMarker: list[2],
      });
      listStack.push({ indent, text: semanticText });
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      addUnit({
        kind: 'blockquote',
        semanticText: semanticInlineText(quote[1], Boolean(options.renderedReadback)),
        rawText: rawLine,
        sourceSpan: { startLine: lineNumber, endLine: lineNumber },
        parentPath: headingStack.map((entry) => entry.text),
      });
      listStack.length = 0;
      continue;
    }

    const semanticText = semanticInlineText(trimmed, Boolean(options.renderedReadback));
    if (options.renderedReadback && /^(?:Table \d+|Header|Row \d+)$/.test(semanticText)) {
      continue;
    }
    addUnit({
      kind: 'paragraph',
      semanticText,
      rawText: rawLine,
      sourceSpan: { startLine: lineNumber, endLine: lineNumber },
      parentPath: headingStack.map((entry) => entry.text),
    });
    listStack.length = 0;
  }

  const semanticHash = stableBulkImportHash(units.map((unit) => unit.semanticText).join('\n'));
  return {
    rawSourceHash: stableBulkImportHash(normalizedSource),
    semanticHash,
    units,
    hierarchyRelationships: units.map((unit) => ({ unitId: unit.unitId, parentPath: unit.parentPath })),
    formattingExpectations: Array.from(formattingExpectations),
    supportedLosses: Array.from(supportedLosses.values()),
  };
}

function slugKey(input: string, fallback: string): string {
  const sectionMatch = input.match(/\b\d+(?:\.\d+)+\b/);
  if (sectionMatch) {
    return sectionMatch[0];
  }
  const slug = input
    .toLowerCase()
    .replace(/`[^`]+`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || fallback;
}

function normalizeHeadingText(line: string): string {
  return stripLeadingOutlineMarker(line).replace(/^#{1,6}\s+/, '').trim();
}

function normalizeChapterTitle(line: string): string {
  return normalizeHeadingText(line).replace(/:\s*$/, '').trim() || 'Imported chapter';
}

function stripLeadingOutlineMarker(line: string): string {
  return line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').trimEnd();
}

function normalizeMarkerComparable(value: string): string {
  return stripLeadingOutlineMarker(value)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeMarkerWithoutHash(value: string): string {
  return normalizeMarkerComparable(value).replace(/^#{1,6}\s+/, '');
}

function markerMatchesLine(line: string, marker: string): boolean {
  const normalizedLine = normalizeMarkerComparable(line);
  const normalizedMarker = normalizeMarkerComparable(marker);
  return normalizedLine === normalizedMarker ||
    normalizeMarkerWithoutHash(line) === normalizeMarkerWithoutHash(marker);
}

function lineStartsSelectedChapter(line: string, selector: string): boolean {
  const outlineText = stripLeadingOutlineMarker(line);
  if (!outlineText.startsWith('#')) {
    return false;
  }
  return normalizeHeadingText(outlineText).toLowerCase().includes(selector.toLowerCase());
}

function selectedChapterText(sourceText: string, selector?: string): { chapterTitle: string; text: string; warnings: string[] } {
  const warnings: string[] = [];
  const lines = sourceText.replace(/\r\n/g, '\n').split('\n');
  if (!selector?.trim()) {
    const firstHeading = lines.find((line) => /^#{1,6}\s+/.test(stripLeadingOutlineMarker(line)));
    return {
      chapterTitle: firstHeading ? normalizeChapterTitle(firstHeading) : 'Imported chapter',
      text: sourceText,
      warnings,
    };
  }

  const start = lines.findIndex((line) => lineStartsSelectedChapter(line, selector.trim()));
  if (start < 0) {
    warnings.push(`chapterSelector "${selector}" was not found; planned full source.`);
    return {
      chapterTitle: selector,
      text: sourceText,
      warnings,
    };
  }

  const startLevel = (stripLeadingOutlineMarker(lines[start]).match(/^#+/)?.[0].length ?? 1);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const heading = stripLeadingOutlineMarker(lines[index]).match(/^(#{1,6})\s+/);
    if (heading && heading[1].length <= startLevel) {
      end = index;
      break;
    }
  }

  return {
    chapterTitle: normalizeChapterTitle(lines[start]),
    text: lines.slice(start, end).join('\n'),
    warnings,
  };
}

function looksLikeRemNoteExportMarkdown(text: string): boolean {
  return text.replace(/\r\n/g, '\n').split('\n').some((line) => /^\s*[-*+]\s+#{1,6}\s+/.test(line));
}

export function normalizeRemNoteExportMarkdown(text: string): string {
  let contentBaseIndent = 0;
  return text.replace(/\r\n/g, '\n').split('\n').map((line) => {
    if (/^\s*[-*+]\s*$/.test(line)) {
      return '';
    }
    const headingBullet = line.match(/^(\s*)[-*+]\s+(#{1,6}\s+.*)$/);
    if (headingBullet) {
      const headingIndent = headingBullet[1].replace(/\t/g, '    ').length;
      contentBaseIndent = headingIndent + 4;
      return headingBullet[2].trimEnd();
    }
    if (contentBaseIndent > 0) {
      const leading = /^\s*/.exec(line)?.[0] ?? '';
      const expanded = leading.replace(/\t/g, '    ');
      if (expanded.length >= contentBaseIndent) {
        return `${expanded.slice(contentBaseIndent)}${line.slice(leading.length)}`.trimEnd();
      }
    }
    return line;
  }).join('\n').trimEnd();
}

export function extractMarkedSourceText(input: {
  sourceText: string;
  startMarker?: string;
  stopBeforeMarker?: string;
  sourceNormalization?: BulkImportSourceNormalization;
  sourceKind?: 'inline_text' | 'file';
  sourceName?: string;
  sourceFilePath?: string;
}): { chapterTitle: string; text: string; metadata: BulkImportSourceMetadata; warnings: string[] } {
  const warnings: string[] = [];
  const normalizedSource = input.sourceText.replace(/\r\n/g, '\n');
  const lines = normalizedSource.split('\n');
  let start = 0;
  let end = lines.length;
  let stopMarkerFound = false;

  if (input.startMarker?.trim()) {
    start = lines.findIndex((line) => markerMatchesLine(line, input.startMarker as string));
    if (start < 0) {
      throw new Error(`startMarker "${input.startMarker}" was not found in source.`);
    }
  }

  if (input.stopBeforeMarker?.trim()) {
    const stop = lines.findIndex((line, index) => index > start && markerMatchesLine(line, input.stopBeforeMarker as string));
    if (stop < 0) {
      throw new Error(`stopBeforeMarker "${input.stopBeforeMarker}" was not found after startMarker.`);
    }
    end = stop;
    stopMarkerFound = true;
  } else if (input.startMarker?.trim()) {
    const startLevel = (stripLeadingOutlineMarker(lines[start]).match(/^#+/)?.[0].length ?? 1);
    for (let index = start + 1; index < lines.length; index += 1) {
      const heading = stripLeadingOutlineMarker(lines[index]).match(/^(#{1,6})\s+/);
      if (heading && heading[1].length <= startLevel) {
        end = index;
        break;
      }
    }
  }

  const extracted = lines.slice(start, end).join('\n').trimEnd();
  const normalization = input.sourceNormalization ?? 'auto';
  const shouldNormalizeRemNoteExport =
    normalization === 'remnote_export' ||
    (normalization === 'auto' && looksLikeRemNoteExportMarkdown(extracted));
  const planned = shouldNormalizeRemNoteExport ? normalizeRemNoteExportMarkdown(extracted) : extracted;
  const firstHeading = planned.split('\n').find((line) => /^#{1,6}\s+/.test(line));
  const chapterTitle = firstHeading ? normalizeChapterTitle(firstHeading) : normalizeChapterTitle(input.startMarker ?? 'Imported chapter');
  const metadata: BulkImportSourceMetadata = {
    sourceKind: input.sourceKind ?? 'inline_text',
    sourceFilePath: input.sourceFilePath,
    sourceName: input.sourceName,
    startMarker: input.startMarker,
    stopBeforeMarker: input.stopBeforeMarker,
    startLine: input.startMarker?.trim() ? start + 1 : undefined,
    stopLine: end < lines.length ? end + 1 : undefined,
    stopMarkerFound,
    rawSourceLength: normalizedSource.length,
    rawSourceHash: stableBulkImportHash(normalizedSource),
    extractedSourceLength: extracted.length,
    extractedSourceHash: stableBulkImportHash(extracted),
    plannedSourceLength: planned.length,
    plannedSourceHash: stableBulkImportHash(planned),
    semanticSourceHash: buildBulkImportSourceManifest(planned).semanticHash,
    normalization,
    normalizationDescription: shouldNormalizeRemNoteExport
      ? 'RemNote exported heading bullets were normalized to Markdown headings before chunk planning.'
      : 'Source text was planned without RemNote export heading normalization.',
  };
  if (shouldNormalizeRemNoteExport) {
    warnings.push(metadata.normalizationDescription);
  }
  if (input.stopBeforeMarker && stopMarkerFound) {
    warnings.push(`Stopped before marker "${input.stopBeforeMarker}".`);
  }
  return { chapterTitle, text: planned, metadata, warnings };
}

function markdownHeadingLevel(line: string): number | null {
  const heading = stripLeadingOutlineMarker(line).match(/^(#{1,6})\s+\S/);
  return heading ? heading[1].length : null;
}

function splitSections(chapterText: string): Array<{ title: string; text: string; bodyText: string; sectionKey: string }> {
  const lines = chapterText.replace(/\r\n/g, '\n').split('\n');
  const headingStarts = lines
    .map((line, index) => ({ line, index, level: markdownHeadingLevel(line) }))
    .filter((entry): entry is { line: string; index: number; level: number } =>
      entry.level !== null && entry.level >= 2
    );
  const principalHeadingLevel = headingStarts.length
    ? Math.min(...headingStarts.map((entry) => entry.level))
    : undefined;
  const starts = principalHeadingLevel !== undefined
    ? headingStarts
        .filter((entry) => entry.level === principalHeadingLevel)
        .map(({ line, index }) => ({ line, index }))
    : lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => /^\s*\d+(?:\.\d+)+\s+\S/.test(line));

  if (!starts.length) {
    const firstHeadingIndex = lines.findIndex((line) => markdownHeadingLevel(line) !== null);
    const title = normalizeHeadingText(
      firstHeadingIndex >= 0 ? lines[firstHeadingIndex] : 'Imported chapter'
    );
    const bodyText = firstHeadingIndex >= 0
      ? lines.slice(firstHeadingIndex + 1).join('\n').replace(/^\n+/, '').trimEnd()
      : chapterText;
    return [{
      title,
      text: chapterText,
      bodyText: bodyText.trim() ? bodyText : chapterText,
      sectionKey: slugKey(title, 'chapter'),
    }];
  }

  const preSectionLines = lines.slice(0, starts[0].index);
  const preSectionBodyLines = preSectionLines
    .filter((line) => {
      const level = markdownHeadingLevel(line);
      return level === null || level > 1;
    });

  return starts.map((start, startIndex) => {
    const end = starts[startIndex + 1]?.index ?? lines.length;
    const text = lines
      .slice(startIndex === 0 ? 0 : start.index, end)
      .join('\n')
      .trimEnd();
    const bodyLines = startIndex === 0
      ? [...preSectionBodyLines, ...lines.slice(start.index + 1, end)]
      : lines.slice(start.index + 1, end);
    const bodyText = bodyLines.join('\n').replace(/^\n+/, '').trimEnd();
    const title = normalizeHeadingText(start.line);
    return {
      title,
      text,
      bodyText,
      sectionKey: slugKey(title, `section-${startIndex + 1}`),
    };
  });
}

function estimatedRemCount(text: string): number {
  return Math.max(
    1,
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean).length
  );
}

function splitSectionIntoChunks(sectionText: string, options: Required<BulkImportPlannerOptions>): string[] {
  const lines = sectionText.replace(/\r\n/g, '\n').split('\n');
  const headingEntries = lines
    .map((line, index) => ({ index, level: markdownHeadingLevel(line) }))
    .filter((entry): entry is { index: number; level: number } => entry.level !== null);
  const principalHeadingLevel = headingEntries.length
    ? Math.min(...headingEntries.map((entry) => entry.level))
    : undefined;
  let starts = principalHeadingLevel === undefined
    ? []
    : headingEntries.filter((entry) => entry.level === principalHeadingLevel).map((entry) => entry.index);

  if (starts.length === 0) {
    const bullets = lines
      .map((line, index) => {
        const match = /^(\s*)(?:[-*+]|\d+[.)])\s+\S/.exec(line);
        return match
          ? { index, indent: match[1].replace(/\t/g, '    ').length }
          : undefined;
      })
      .filter((entry): entry is { index: number; indent: number } => Boolean(entry));
    if (bullets.length) {
      const rootIndent = Math.min(...bullets.map((entry) => entry.indent));
      starts = bullets.filter((entry) => entry.indent === rootIndent).map((entry) => entry.index);
    }
  }

  const blocks: string[] = [];
  if (starts.length) {
    if (starts[0] > 0) {
      const intro = lines.slice(0, starts[0]).join('\n').trim();
      if (intro) blocks.push(intro);
    }
    starts.forEach((start, index) => {
      const block = lines.slice(start, starts[index + 1] ?? lines.length).join('\n').trim();
      if (block) blocks.push(block);
    });
  } else {
    const paragraphs = sectionText.replace(/\r\n/g, '\n').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    blocks.push(...(paragraphs.length ? paragraphs : [sectionText.trim()]));
  }

  const chunks: string[] = [];
  let currentBlocks: string[] = [];
  const remCount = (value: string) => value.split('\n').filter((line) => line.trim()).length;
  const flush = () => {
    const chunk = currentBlocks.join('\n').trim();
    if (chunk) chunks.push(chunk);
    currentBlocks = [];
  };
  for (const block of blocks) {
    const candidate = [...currentBlocks, block].join('\n');
    if (
      currentBlocks.length > 0 &&
      (candidate.length > options.maxCharsPerChunk || remCount(candidate) > options.maxRemsPerChunk)
    ) {
      flush();
    }
    currentBlocks.push(block);
  }
  flush();
  return chunks.length ? chunks : [sectionText];
}

export function bulkChunkId(planId: string, sectionKey: string, chunkIndex: number, sourceHash: string): string {
  return `${planId}:section:${sectionKey}:chunk:${chunkIndex}:source:${sourceHash}`;
}

export function bulkChunkIdempotencyKey(jobId: string, sectionKey: string, chunkIndex: number, sourceHash: string): string {
  return `bulk-import:${jobId}:section:${sectionKey}:chunk:${chunkIndex}:source:${sourceHash}`;
}

export function bulkChapterIdempotencyKey(jobId: string, sourceHash: string): string {
  return `bulk-import:${jobId}:chapter:source:${sourceHash}`;
}

export function bulkImportRootIdempotencyKey(jobId: string, sourceHash: string): string {
  return `bulk-import:${jobId}:import-root:source:${sourceHash}`;
}

export function bulkSectionIdempotencyKey(jobId: string, sectionKey: string, sourceHash: string): string {
  return `bulk-import:${jobId}:section-root:${sectionKey}:source:${sourceHash}`;
}

export function bulkImportDurabilityWarning(storageDurability: BulkImportJob['storageDurability']): string | undefined {
  return storageDurability === 'memory_only'
    ? 'Bulk import job state is memory_only and is not durable across server restart.'
    : undefined;
}

export function bulkImportChunkHasVerifiedEvidence(chunk: BulkImportChunk): boolean {
  return chunk.verificationStatus === 'passed' && (chunk.createdRemIds.length > 0 || chunk.updatedRemIds.length > 0);
}

export function isBulkImportChunkRunnable(status: BulkImportChunkStatus): boolean {
  return status === 'pending';
}

function legacyAttemptForChunk(chunk: BulkImportChunk, at: string): BulkImportChunkAttempt | undefined {
  if (chunk.status === 'pending') {
    return undefined;
  }
  const safelyAcknowledged = chunk.status === 'verified' || chunk.status === 'skipped_already_verified';
  return {
    attemptId: `legacy:${chunk.chunkId}`,
    operationId: `legacy:${chunk.chunkId}`,
    state: safelyAcknowledged ? 'acknowledged' : 'unknown',
    expectedParent: chunk.expectedParent,
    sourceHash: chunk.sourceHash,
    semanticHash: chunk.sourceManifest?.semanticHash ?? chunk.sourceHash,
    idempotencyKey: chunk.idempotencyKey,
    stage: 'chunk_write',
    startedAt: chunk.startedAt ?? at,
    finishedAt: chunk.finishedAt,
    hierarchyCreatedRemIds: [...(chunk.hierarchyCreatedRemIds ?? [])],
    createdRemIds: [...(chunk.createdRemIds ?? [])],
    updatedRemIds: [...(chunk.updatedRemIds ?? [])],
    error: chunk.error,
    provenance: 'legacy_migration',
  };
}

export function migrateBulkImportJob(job: BulkImportJob): BulkImportJob {
  const at = job.updatedAt || job.createdAt || new Date(0).toISOString();
  const migrateChunk = (chunk: BulkImportChunk): BulkImportChunk => {
    const legacyAttempt = !Array.isArray(chunk.attempts) ? legacyAttemptForChunk(chunk, at) : undefined;
    const attempts = Array.isArray(chunk.attempts)
      ? chunk.attempts.map((attempt) => ({
          ...attempt,
          semanticHash: attempt.semanticHash ?? chunk.sourceManifest?.semanticHash ?? chunk.sourceHash,
          idempotencyKey: attempt.idempotencyKey ?? chunk.idempotencyKey,
          stage: attempt.stage ?? 'chunk_write',
          provenance: attempt.provenance ?? 'legacy_migration',
          hierarchyCreatedRemIds: [...(attempt.hierarchyCreatedRemIds ?? [])],
          createdRemIds: [...(attempt.createdRemIds ?? [])],
          updatedRemIds: [...(attempt.updatedRemIds ?? [])],
        }))
      : legacyAttempt
        ? [legacyAttempt]
        : [];
    const claimedComplete = chunk.status === 'verified' || chunk.status === 'skipped_already_verified';
    const completed = claimedComplete &&
      chunk.verificationStatus === 'passed' &&
      ((chunk.createdRemIds?.length ?? 0) > 0 || (chunk.updatedRemIds?.length ?? 0) > 0);
    const reconciliationStatus = chunk.reconciliationStatus ?? (
      chunk.status === 'pending'
        ? 'not_required'
        : completed
          ? 'reconciled_written'
          : 'required'
    );
    return {
      ...chunk,
      status: claimedComplete && !completed ? 'partial_needs_verification' : chunk.status,
      verificationStatus: claimedComplete && !completed ? 'partial' : chunk.verificationStatus,
      hierarchyCreatedRemIds: [...(chunk.hierarchyCreatedRemIds ?? [])],
      createdRemIds: [...(chunk.createdRemIds ?? [])],
      updatedRemIds: [...(chunk.updatedRemIds ?? [])],
      attempts,
      reconciliationStatus,
    };
  };
  const chunks = job.chunks.map(migrateChunk);
  const byId = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]));
  return {
    ...job,
    schemaVersion: 2,
    revision: Number.isSafeInteger(job.revision) && job.revision >= 0 ? job.revision : 0,
    status: job.status === 'completed' && chunks.some((chunk) => !bulkImportChunkHasVerifiedEvidence(chunk))
      ? 'partial'
      : job.status,
    chunks,
    sections: job.sections.map((section) => ({
      ...section,
      chunks: section.chunks.map((chunk) => byId.get(chunk.chunkId) ?? migrateChunk(chunk)),
    })),
  };
}

export function canTransitionBulkImportChunkStatus(
  from: BulkImportChunkStatus,
  to: BulkImportChunkStatus,
  nextChunk: BulkImportChunk
): boolean {
  if (from === to) {
    return true;
  }
  if (to === 'verified') {
    return bulkImportChunkHasVerifiedEvidence(nextChunk);
  }
  if (from === 'verified' || from === 'skipped_already_verified') {
    return to === 'needs_manual_review';
  }
  if (from === 'needs_manual_review') {
    return to === 'needs_manual_review';
  }
  return true;
}

export function isBulkImportJobComplete(job: BulkImportJob): boolean {
  return job.chunks.every((chunk) =>
    (chunk.status === 'verified' || chunk.status === 'skipped_already_verified') &&
    bulkImportChunkHasVerifiedEvidence(chunk)
  );
}

export function normalizeBulkImportTitle(title: string): string {
  return title
    .replace(/\r\n/g, '\n')
    .replace(/^[#\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function planNoteImport(input: PlanNoteImportInput): BulkImportPlan {
  const sourceText = input.sourceText ?? '';
  if (!sourceText.trim()) {
    throw new Error('sourceText is required.');
  }
  if (!input.targetRootId.trim()) {
    throw new Error('targetRootId is required.');
  }

  const options = normalizePlannerOptions(input.options);
  const selected = input.startMarker?.trim() || input.stopBeforeMarker?.trim()
    ? extractMarkedSourceText({
        sourceText,
        startMarker: input.startMarker,
        stopBeforeMarker: input.stopBeforeMarker,
        sourceNormalization: input.sourceNormalization,
        sourceKind: input.sourceKind,
        sourceName: input.sourceName,
        sourceFilePath: input.sourceFilePath,
      })
    : (() => {
        const chapter = selectedChapterText(sourceText, input.chapterSelector);
        const normalized = input.sourceNormalization === 'remnote_export' ||
          ((input.sourceNormalization ?? 'auto') === 'auto' && looksLikeRemNoteExportMarkdown(chapter.text))
          ? normalizeRemNoteExportMarkdown(chapter.text)
          : chapter.text;
        const metadata: BulkImportSourceMetadata = {
          sourceKind: input.sourceKind ?? 'inline_text',
          sourceFilePath: input.sourceFilePath,
          sourceName: input.sourceName,
          rawSourceLength: sourceText.length,
          rawSourceHash: stableBulkImportHash(sourceText),
          extractedSourceLength: chapter.text.length,
          extractedSourceHash: stableBulkImportHash(chapter.text),
          plannedSourceLength: normalized.length,
          plannedSourceHash: stableBulkImportHash(normalized),
          semanticSourceHash: buildBulkImportSourceManifest(normalized).semanticHash,
          normalization: input.sourceNormalization ?? 'auto',
          normalizationDescription: normalized === chapter.text
            ? 'Source text was planned without RemNote export heading normalization.'
            : 'RemNote exported heading bullets were normalized to Markdown headings before chunk planning.',
        };
        return {
          chapterTitle: input.chapterTitle?.trim() || chapter.chapterTitle,
          text: normalized,
          metadata,
          warnings: normalized === chapter.text ? chapter.warnings : [...chapter.warnings, metadata.normalizationDescription],
        };
      })();
  const chapterTitle = input.chapterTitle?.trim() || selected.chapterTitle;
  const sourceHash = stableBulkImportHash(selected.text);
  const sourceManifest = buildBulkImportSourceManifest(selected.text);
  const planId = `plan:${stableBulkImportHash(`${input.ownerId ?? ''}:${input.sourceName ?? ''}:${input.targetRootId}:${input.rootTitle ?? ''}:${chapterTitle}:${sourceHash}`)}`;
  const sections = splitSections(selected.text).map((section) => {
    const writableSectionText = section.bodyText.trim() ? section.bodyText : section.text;
    const chunkTexts = splitSectionIntoChunks(writableSectionText, options);
    const chunks = chunkTexts.map((chunkText, index): BulkImportChunk => {
      const chunkSourceHash = stableBulkImportHash(chunkText);
      const chunkIndex = index + 1;
      return {
        chunkId: bulkChunkId(planId, section.sectionKey, chunkIndex, chunkSourceHash),
        targetRootId: input.targetRootId,
        importRootTitle: input.rootTitle?.trim() || undefined,
        chapterTitle,
        sectionKey: section.sectionKey,
        sectionTitle: section.title,
        chunkIndex,
        logicalSectionKey: section.sectionKey,
        nativeChunkIndex: chunkIndex,
        sourceText: chunkText,
        sourceHash: chunkSourceHash,
        sourceManifest: buildBulkImportSourceManifest(chunkText),
        expectedSourceText: chunkText,
        expectedSourceHash: chunkSourceHash,
        expectedParent: input.targetRootId,
        hierarchyCreatedRemIds: [],
        createdRemIds: [],
        updatedRemIds: [],
        attempts: [],
        reconciliationStatus: 'not_required',
        verificationStatus: 'not_verifiable',
        status: 'pending',
        retryCount: 0,
        idempotencyKey: bulkChunkIdempotencyKey('job-pending', section.sectionKey, chunkIndex, chunkSourceHash),
        charCount: chunkText.length,
        estimatedRemCount: estimatedRemCount(chunkText),
      };
    });
    return {
      sectionKey: section.sectionKey,
      title: section.title,
      sourceHash: stableBulkImportHash(section.text),
      sourceManifest: buildBulkImportSourceManifest(section.text),
      sourceText: section.text,
      bodySourceText: writableSectionText,
      chunkCount: chunks.length,
      chunks,
    };
  });

  const chunks = sections.flatMap((section) => section.chunks);
  const warnings = [...selected.warnings];
  if (chunks.length > sections.length) {
    warnings.push('Large sections were split into bounded chunks; run one job step at a time.');
  }
  if (chunks.some((chunk) =>
    chunk.charCount > options.maxCharsPerChunk || chunk.estimatedRemCount > options.maxRemsPerChunk
  )) {
    warnings.push(
      'An atomic Markdown subtree exceeded maxCharsPerChunk or maxRemsPerChunk and was kept intact to preserve hierarchy.'
    );
  }

  return {
    ok: true,
    planId,
    ownerId: input.ownerId,
    sourceName: input.sourceName,
    sourceHash,
    sourceManifest,
    sourceMetadata: selected.metadata,
    plannedSourceLength: selected.metadata.plannedSourceLength,
    extractedSourceLength: selected.metadata.extractedSourceLength,
    targetRootId: input.targetRootId,
    importRootTitle: input.rootTitle?.trim() || undefined,
    importRootIdempotencyKey: input.rootTitle?.trim() ? bulkImportRootIdempotencyKey('job-pending', sourceHash) : undefined,
    chapterIdempotencyKey: bulkChapterIdempotencyKey('job-pending', sourceHash),
    chapterSelector: input.chapterSelector,
    chapterTitle,
    sections,
    chunks,
    estimatedChunks: chunks.length,
    logicalChunkCount: sections.length,
    nativeChunkCount: chunks.length,
    estimatedRems: chunks.reduce((sum, chunk) => sum + chunk.estimatedRemCount, 0),
    warnings,
    options,
  };
}

export function normalizeForSourceFidelity(text: string): string {
  return buildBulkImportSourceManifest(text, { renderedReadback: true })
    .units
    .map((unit) => unit.semanticText)
    .join('\n');
}

function previewAround(value: string, maxLength = 240): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function visibleStylePollutionRems(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => ['Size', 'H1', 'H2', 'H3', 'normal'].includes(line));
}

export function verifyBulkImportSourceText(input: {
  expectedText: string;
  actualText?: string;
  jobId?: string;
  sectionKey?: string;
  chunkIndex?: number;
}): BulkImportVerificationResult {
  const expectedManifest = buildBulkImportSourceManifest(input.expectedText);
  if (input.actualText === undefined) {
    return {
      ok: false,
      status: 'not_verifiable',
      jobId: input.jobId,
      sectionKey: input.sectionKey,
      chunkIndex: input.chunkIndex,
      expectedHash: expectedManifest.semanticHash,
      rawSourceHash: expectedManifest.rawSourceHash,
      semanticHash: expectedManifest.semanticHash,
      warnings: ['No actual RemNote text was supplied; live/readback verification was not run.'],
      recommendedAction: 'Run verify_note_import_job after readback is available.',
      method: 'manifest_only',
    };
  }

  const actualManifest = buildBulkImportSourceManifest(input.actualText, { renderedReadback: true });
  const expectedHash = expectedManifest.semanticHash;
  const actualHash = actualManifest.semanticHash;
  const matchedActualIndexes = new Set<number>();
  const missingUnits: BulkImportSemanticUnit[] = [];
  let cursor = 0;
  for (const unit of expectedManifest.units) {
    const relativeIndex = actualManifest.units
      .slice(cursor)
      .findIndex((candidate) => candidate.semanticText === unit.semanticText);
    if (relativeIndex < 0) {
      missingUnits.push(unit);
      continue;
    }
    const actualIndex = cursor + relativeIndex;
    matchedActualIndexes.add(actualIndex);
    cursor = actualIndex + 1;
  }
  const extraUnits = actualManifest.units.filter((_, index) => !matchedActualIndexes.has(index));
  const pollutionRems = visibleStylePollutionRems(input.actualText);
  if (pollutionRems.length > 0) {
    const unique = Array.from(new Set(pollutionRems));
    return {
      ok: false,
      status: 'source_fidelity_failed',
      jobId: input.jobId,
      sectionKey: input.sectionKey,
      chunkIndex: input.chunkIndex,
      expectedHash,
      actualHash,
      rawSourceHash: expectedManifest.rawSourceHash,
      semanticHash: expectedManifest.semanticHash,
      renderedReadbackHash: actualManifest.rawSourceHash,
      missingUnits: missingUnits.slice(0, 5),
      extraUnits: extraUnits.slice(0, 5),
      extraTextPreview: previewAround(unique.join('\n')),
      warnings: [`Formatting pollution Rems detected: ${unique.join(', ')}.`],
      recommendedAction: 'Inspect readback tree before resume.',
      method: 'semantic_manifest',
    };
  }
  if (missingUnits.length === 0) {
    return {
      ok: true,
      status: 'passed',
      jobId: input.jobId,
      sectionKey: input.sectionKey,
      chunkIndex: input.chunkIndex,
      expectedHash,
      actualHash,
      rawSourceHash: expectedManifest.rawSourceHash,
      semanticHash: expectedManifest.semanticHash,
      renderedReadbackHash: actualManifest.rawSourceHash,
      warnings: [],
      method: 'semantic_manifest',
    };
  }

  const missingTextPreview = previewAround(missingUnits.slice(0, 5).map((unit) => unit.semanticText).join('\n'));
  const extraTextPreview = extraUnits.length
    ? previewAround(extraUnits.slice(0, 5).map((unit) => unit.semanticText).join('\n'))
    : undefined;
  return {
    ok: false,
    status: 'source_fidelity_failed',
    jobId: input.jobId,
    sectionKey: input.sectionKey,
    chunkIndex: input.chunkIndex,
    expectedHash,
    actualHash,
    rawSourceHash: expectedManifest.rawSourceHash,
    semanticHash: expectedManifest.semanticHash,
    renderedReadbackHash: actualManifest.rawSourceHash,
    missingUnits: missingUnits.slice(0, 5),
    extraUnits: extraUnits.slice(0, 5),
    missingTextPreview,
    extraTextPreview,
    warnings: ['Semantic source-manifest verification failed. Inspect the exact missing/extra units and source spans.'],
    recommendedAction: 'resume_note_import_job',
    method: 'semantic_manifest',
  };
}

export interface BulkImportFinalVerificationReport extends BulkImportVerificationResult {
  normalizedMatchPercentage: number;
  expectedSourceLength: number;
  actualReadbackLength?: number;
  failedChunkIds: string[];
  structure: {
    rootTitle?: string;
    chapterTitle: string;
    sectionOrderOk: boolean;
    duplicateSectionTitles: string[];
    missingSectionTitles: string[];
  };
  checks: {
    noChapterTwo: boolean;
    noVisibleDashPrefixes: boolean;
    noDuplicateChunkContent: boolean;
  };
}

interface ReadbackNodeView {
  remId?: string;
  text: string;
  children: ReadbackNodeView[];
}

function normalizedUnits(text: string): string[] {
  return normalizeForSourceFidelity(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function expectedBulkImportReadbackText(job: BulkImportJob): string {
  return [
    job.chapterTitle,
    ...job.sections.flatMap((section) => [
      section.title,
      ...section.chunks.map((chunk) => chunk.expectedSourceText ?? chunk.sourceText),
    ]),
  ].filter(Boolean).join('\n');
}

function duplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries()).filter(([, count]) => count > 1).map(([value]) => value);
}

function readbackNodeView(value: unknown): ReadbackNodeView {
  if (!value || typeof value !== 'object') {
    return { text: '', children: [] };
  }
  const record = value as Record<string, unknown>;
  const remId = [record.remId, record._id, record.id]
    .find((item): item is string => typeof item === 'string' && item.length > 0);
  const textValue = [record.plainText, record.frontText, record.title]
    .find((item): item is string => typeof item === 'string' && item.trim().length > 0);
  const children = Array.isArray(record.children) ? record.children.map(readbackNodeView) : [];
  return { remId, text: textValue ?? '', children };
}

function directExpectedUnits(sourceText: string): string[] {
  return sourceText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return '';
      }
      const bullet = /^(\s*)([-*+]|\d+[.)])\s+(.+)$/.exec(line);
      if (bullet) {
        return bullet[1].replace(/\t/g, '    ').length === 0
          ? normalizeForSourceFidelity(bullet[3])
          : '';
      }
      if (/^#{1,6}\s+/.test(trimmed) || /^\s/.test(line)) {
        return '';
      }
      return normalizeForSourceFidelity(trimmed);
    })
    .filter(Boolean);
}

function findReadbackNodeByText(root: ReadbackNodeView, text: string): ReadbackNodeView | null {
  const target = normalizeForSourceFidelity(text);
  if (normalizeForSourceFidelity(root.text) === target) {
    return root;
  }
  for (const child of root.children) {
    const found = findReadbackNodeByText(child, text);
    if (found) {
      return found;
    }
  }
  return null;
}

function directChildWithText(node: ReadbackNodeView, text: string): ReadbackNodeView | undefined {
  const target = normalizeForSourceFidelity(text);
  return node.children.find((child) => normalizeForSourceFidelity(child.text) === target);
}

function descendantWithTextAndParent(
  node: ReadbackNodeView,
  text: string
): { node: ReadbackNodeView; parent: ReadbackNodeView } | undefined {
  const target = normalizeForSourceFidelity(text);
  for (const child of node.children) {
    if (normalizeForSourceFidelity(child.text) === target) {
      return { node: child, parent: node };
    }
    const nested = descendantWithTextAndParent(child, text);
    if (nested) return nested;
  }
  return undefined;
}

function verifyBulkImportHierarchy(input: {
  job: BulkImportJob;
  readbackTree?: unknown;
}): { wrongParentChunks: string[]; hierarchyMismatches: BulkImportHierarchyMismatch[]; warnings: string[] } {
  if (!input.readbackTree) {
    return { wrongParentChunks: [], hierarchyMismatches: [], warnings: [] };
  }
  const root = readbackNodeView(input.readbackTree);
  const wrongParentChunks = new Set<string>();
  const hierarchyMismatches: BulkImportHierarchyMismatch[] = [];
  const warnings: string[] = [];
  for (const chunk of input.job.chunks) {
    const sectionNode = findReadbackNodeByText(root, chunk.sectionTitle);
    if (!sectionNode) {
      continue;
    }
    const manifestDirectUnits = chunk.sourceManifest?.units.filter((unit) => unit.parentPath.length === 0) ?? [];
    const expectedDirectUnits = manifestDirectUnits.length
      ? manifestDirectUnits
      : directExpectedUnits(chunk.expectedSourceText ?? chunk.sourceText).map((semanticText) => ({ semanticText }));
    for (const unit of expectedDirectUnits) {
      if (directChildWithText(sectionNode, unit.semanticText)) {
        continue;
      }
      const nested = descendantWithTextAndParent(sectionNode, unit.semanticText);
      if (nested) {
        wrongParentChunks.add(chunk.chunkId);
        hierarchyMismatches.push({
          chunkId: chunk.chunkId,
          semanticText: unit.semanticText,
          sourceSpan: (unit as Partial<BulkImportSemanticUnit>).sourceSpan,
          expectedParentRemId: sectionNode.remId ?? chunk.sectionRootRemId ?? chunk.expectedParent,
          actualParentRemId: nested.parent.remId,
          remId: nested.node.remId,
        });
        warnings.push(`Hierarchy mismatch: "${unit.semanticText}" is nested under the wrong parent in section "${chunk.sectionTitle}".`);
      }
    }
  }
  return { wrongParentChunks: Array.from(wrongParentChunks), hierarchyMismatches, warnings };
}

export function verifyBulkImportFinalReadback(input: {
  job: BulkImportJob;
  readbackTree?: unknown;
  actualText?: string;
  chunkReports?: BulkImportVerificationResult[];
}): BulkImportFinalVerificationReport {
  const actualRaw = input.actualText ?? (input.readbackTree ? flattenBulkImportReadbackText(input.readbackTree) : undefined);
  const expectedRaw = expectedBulkImportReadbackText(input.job);
  const expected = normalizeForSourceFidelity(expectedRaw);
  const expectedHash = stableBulkImportHash(expected);
  const failedChunkIds = (input.chunkReports ?? [])
    .filter((report) => !report.ok && report.status !== 'not_verifiable')
    .map((report) => {
      const chunk = input.job.chunks.find((candidate) =>
        candidate.sectionKey === report.sectionKey && candidate.chunkIndex === report.chunkIndex
      );
      return chunk?.chunkId;
    })
    .filter((chunkId): chunkId is string => Boolean(chunkId));
  if (actualRaw === undefined) {
    return {
      ok: false,
      status: 'not_verifiable',
      jobId: input.job.jobId,
      expectedHash,
      warnings: ['No full readback text was supplied; final source verification was not run.'],
      recommendedAction: 'Run verify_note_import_job after live readback is available.',
      method: 'manifest_only',
      normalizedMatchPercentage: 0,
      expectedSourceLength: expectedRaw.length,
      failedChunkIds,
      structure: {
        rootTitle: input.job.importRootTitle,
        chapterTitle: input.job.chapterTitle,
        sectionOrderOk: false,
        duplicateSectionTitles: [],
        missingSectionTitles: input.job.sections.map((section) => section.title),
      },
      checks: {
        noChapterTwo: false,
        noVisibleDashPrefixes: false,
        noDuplicateChunkContent: false,
      },
    };
  }

  const actual = normalizeForSourceFidelity(actualRaw);
  const actualHash = stableBulkImportHash(actual);
  const hierarchy = verifyBulkImportHierarchy({ job: input.job, readbackTree: input.readbackTree });
  const pollutionRems = visibleStylePollutionRems(actualRaw);
  const expectedUnits = normalizedUnits(expectedRaw);
  const actualUnits = normalizedUnits(actualRaw);
  const missingUnits = expectedUnits.filter((unit) => !actual.includes(unit));
  const extraUnits = actualUnits.filter((unit) => !expected.includes(unit));
  const sectionOffsets = input.job.sections.map((section) => actual.indexOf(normalizeForSourceFidelity(section.title)));
  const missingSectionTitles = input.job.sections
    .filter((_, index) => sectionOffsets[index] < 0)
    .map((section) => section.title);
  const sectionOrderOk = sectionOffsets.every((offset) => offset >= 0) &&
    sectionOffsets.every((offset, index) => index === 0 || offset > sectionOffsets[index - 1]);
  const sectionOccurrences = input.job.sections.flatMap((section) => {
    const title = normalizeForSourceFidelity(section.title);
    return actualUnits.filter((unit) => unit === title).length > 1 ? [section.title] : [];
  });
  const duplicateSectionTitles = duplicateValues(sectionOccurrences).length ? duplicateValues(sectionOccurrences) : sectionOccurrences;
  const noChapterTwo = !/\bchapter\s+two\b/i.test(actualRaw) && !/^2\.\d+\b/m.test(actual);
  const noVisibleDashPrefixes = !/^\s*-\s*(?:#{1,6}\s+|chapter\b|\d+(?:\.\d+)+\b)/im.test(actualRaw);
  const duplicateChunkContent = input.job.chunks.filter((chunk) => {
    const normalizedChunk = normalizeForSourceFidelity(chunk.expectedSourceText ?? chunk.sourceText);
    return normalizedChunk && countOccurrences(actual, normalizedChunk) > 1;
  });
  const matchedCount = expectedUnits.length - missingUnits.length;
  const normalizedMatchPercentage = expectedUnits.length === 0
    ? 100
    : Math.round((matchedCount / expectedUnits.length) * 10000) / 100;
  const ok =
    missingUnits.length === 0 &&
    extraUnits.length === 0 &&
    pollutionRems.length === 0 &&
    failedChunkIds.length === 0 &&
    missingSectionTitles.length === 0 &&
    hierarchy.wrongParentChunks.length === 0 &&
    duplicateSectionTitles.length === 0 &&
    sectionOrderOk &&
    noChapterTwo &&
    noVisibleDashPrefixes &&
    duplicateChunkContent.length === 0;
  return {
    ok,
    status: ok ? 'passed' : 'source_fidelity_failed',
    jobId: input.job.jobId,
    expectedHash,
    actualHash,
    missingTextPreview: missingUnits.length ? previewAround(missingUnits.slice(0, 5).join('\n')) : undefined,
    extraTextPreview: extraUnits.length ? previewAround(extraUnits.slice(0, 5).join('\n')) : undefined,
    duplicateSections: duplicateSectionTitles.length ? duplicateSectionTitles : undefined,
    missingChunks: failedChunkIds.length ? failedChunkIds : undefined,
    wrongParentChunks: hierarchy.wrongParentChunks.length ? hierarchy.wrongParentChunks : undefined,
    hierarchyMismatches: hierarchy.hierarchyMismatches.length ? hierarchy.hierarchyMismatches : undefined,
    warnings: ok
      ? []
      : [
          'Final readback did not match the planned source after documented normalization.',
          ...hierarchy.warnings,
          ...(pollutionRems.length
            ? [`Formatting pollution Rems detected: ${Array.from(new Set(pollutionRems)).join(', ')}.`]
            : []),
        ],
    recommendedAction: ok
      ? undefined
      : input.job.status === 'completed'
        ? 'Inspect exact source-fidelity evidence; do not replay completed chunks. Use explicit reconciliation only if write identity is uncertain.'
        : 'resume_note_import_job',
    method: 'normalized_plain_text',
    normalizedMatchPercentage,
    expectedSourceLength: expectedRaw.length,
    actualReadbackLength: actualRaw.length,
    failedChunkIds,
    structure: {
      rootTitle: input.job.importRootTitle,
      chapterTitle: input.job.chapterTitle,
      sectionOrderOk,
      duplicateSectionTitles,
      missingSectionTitles,
    },
    checks: {
      noChapterTwo,
      noVisibleDashPrefixes,
      noDuplicateChunkContent: duplicateChunkContent.length === 0,
    },
  };
}

export function flattenBulkImportReadbackText(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const record = value as Record<string, unknown>;
  const ownTextValue = [record.plainText, record.frontText, record.title]
    .find((item): item is string => typeof item === 'string' && item.trim().length > 0);
  const ownText = ownTextValue ? [ownTextValue] : [];
  const childText = Array.isArray(record.children)
    ? record.children.map((child) => flattenBulkImportReadbackText(child)).filter(Boolean)
    : [];
  return [...ownText, ...childText].join('\n');
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) {
    return 0;
  }
  let count = 0;
  let offset = 0;
  while (offset <= haystack.length) {
    const foundAt = haystack.indexOf(needle, offset);
    if (foundAt < 0) {
      break;
    }
    count += 1;
    offset = foundAt + Math.max(1, needle.length);
  }
  return count;
}

export function verifyBulkImportReadback(input: {
  job: BulkImportJob;
  readbackTree?: unknown;
  actualTextByChunkId?: Record<string, string>;
}): BulkImportVerificationResult[] {
  const treeText = input.readbackTree ? flattenBulkImportReadbackText(input.readbackTree) : undefined;
  const normalizedTree = treeText ? normalizeForSourceFidelity(treeText) : undefined;
  let previousOffset = -1;
  return input.job.chunks.map((chunk) => {
    const explicitText = input.actualTextByChunkId?.[chunk.chunkId];
    const actualText = explicitText ?? normalizedTree;
    const report = verifyBulkImportSourceText({
      expectedText: chunk.expectedSourceText ?? chunk.sourceText,
      actualText,
      jobId: input.job.jobId,
      sectionKey: chunk.sectionKey,
      chunkIndex: chunk.chunkIndex,
    });
    if (!normalizedTree || !report.ok) {
      return report;
    }
    const expected = normalizeForSourceFidelity(chunk.expectedSourceText ?? chunk.sourceText);
    const offset = normalizedTree.indexOf(expected);
    const duplicateCount = countOccurrences(normalizedTree, expected);
    const wrongOrder = offset >= 0 && offset < previousOffset;
    if (offset >= 0) {
      previousOffset = offset;
    }
    if (duplicateCount > 1 || wrongOrder) {
      return {
        ...report,
        ok: false,
        status: 'source_fidelity_failed',
        duplicateSections: duplicateCount > 1 ? [chunk.sectionKey] : undefined,
        wrongParentChunks: wrongOrder ? [chunk.chunkId] : undefined,
        warnings: [
          ...report.warnings,
          duplicateCount > 1 ? 'Duplicate chunk text found in readback.' : '',
          wrongOrder ? 'Chunk order in readback does not match manifest.' : '',
        ].filter(Boolean),
        recommendedAction: 'Inspect readback tree before resume.',
      };
    }
    return report;
  });
}

export function summarizeBulkImportProgress(job: BulkImportJob) {
  const chunksTotal = job.chunks.length;
  const chunksVerified = job.chunks.filter((chunk) =>
    (chunk.status === 'verified' || chunk.status === 'skipped_already_verified') &&
    chunk.verificationStatus === 'passed'
  ).length;
  const chunksFailed = job.chunks.filter((chunk) =>
    chunk.status === 'failed' ||
    chunk.status === 'partial' ||
    chunk.status === 'partial_needs_verification' ||
    chunk.status === 'written_not_verified'
  ).length;
  const sectionsTotal = job.sections.length;
  const verifiedSections = new Set(
    job.sections
      .filter((section) => section.chunks.every((chunk) =>
        (chunk.status === 'verified' || chunk.status === 'skipped_already_verified') &&
        chunk.verificationStatus === 'passed'
      ))
      .map((section) => section.sectionKey)
  );
  const manualReviewChunk = job.chunks.find((chunk) =>
    chunk.status === 'needs_manual_review' || chunk.reconciliationStatus === 'manual_review'
  );
  const reconciliationChunk = job.chunks.find((chunk) => chunk.reconciliationStatus === 'required');
  const pendingChunk = job.chunks.find((chunk) => chunk.status === 'pending');
  const nextChunk = manualReviewChunk ?? reconciliationChunk ?? pendingChunk;
  return {
    sectionsTotal,
    sectionsVerified: verifiedSections.size,
    chunksTotal,
    chunksVerified,
    chunksFailed,
    percent: chunksTotal === 0 ? 0 : Math.round((chunksVerified / chunksTotal) * 100),
    currentSection: nextChunk?.sectionKey,
    currentChunk: nextChunk?.chunkIndex,
    pendingChunks: job.chunks.filter((chunk) => chunk.status === 'pending').length,
    failedChunks: chunksFailed,
    lastError: job.lastError,
    lastSuccessfulCheckpoint: [...job.checkpoints].reverse().find((checkpoint) => checkpoint.status === 'verified'),
    createdRemIds: Array.from(new Set([
      job.importRootRemId,
      job.chapterRootRemId,
      ...job.sections.map((section) => section.sectionRootRemId),
      ...job.chunks.flatMap((chunk) => chunk.hierarchyCreatedRemIds),
      ...job.chunks.flatMap((chunk) => chunk.createdRemIds),
    ].filter((remId): remId is string => Boolean(remId)))),
    manualReviewItems: job.chunks
      .filter((chunk) => chunk.status === 'needs_manual_review' || chunk.reconciliationStatus === 'manual_review')
      .map((chunk) => chunk.chunkId),
    recommendedNextAction:
      job.status === 'completed'
        ? 'run verify_note_import_job if live readback is available'
        : job.status === 'cancelled'
          ? 'job is cancelled; create a new job to continue'
          : manualReviewChunk
            ? 'manual review is required; inspect exact live Rem IDs and parent state before creating a new job'
          : reconciliationChunk
            ? 'call reconcile_note_import_job_chunk before any retry'
          : pendingChunk
            ? 'call run_note_import_job_step again'
            : 'run verify_note_import_job',
  };
}
