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

export type BulkImportSourceNormalization = 'none' | 'auto' | 'remnote_export';

export interface BulkImportPlannerOptions {
  maxCharsPerChunk?: number;
  maxRemsPerChunk?: number;
  maxDepth?: number;
  maxChildrenPerParent?: number;
}

export interface PlanNoteImportInput {
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
  normalization: BulkImportSourceNormalization;
  normalizationDescription: string;
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
  sourceText: string;
  sourceHash: string;
  expectedSourceText: string;
  expectedSourceHash: string;
  expectedParent: string;
  chunkParentRemId?: string;
  createdRemIds: string[];
  updatedRemIds: string[];
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
  sourceName?: string;
  sourceHash: string;
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
  missingTextPreview?: string;
  extraTextPreview?: string;
  duplicateSections?: string[];
  missingChunks?: string[];
  wrongParentChunks?: string[];
  warnings: string[];
  recommendedAction?: string;
  method: 'normalized_plain_text' | 'manifest_only';
}

export interface BulkImportJob {
  jobId: string;
  planId: string;
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
  return text.replace(/\r\n/g, '\n').split('\n').map((line) => {
    if (/^\s*[-*+]\s*$/.test(line)) {
      return '';
    }
    const headingBullet = line.match(/^\s*[-*+]\s+(#{1,6}\s+.*)$/);
    if (headingBullet) {
      return headingBullet[1].trimEnd();
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

function isSectionHeading(line: string): boolean {
  const headingLevel = markdownHeadingLevel(line);
  if (headingLevel !== null) {
    return headingLevel >= 2;
  }
  return /^\s*\d+(?:\.\d+)+\s+\S/.test(line);
}

function splitSections(chapterText: string): Array<{ title: string; text: string; bodyText: string; sectionKey: string }> {
  const lines = chapterText.replace(/\r\n/g, '\n').split('\n');
  const starts = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isSectionHeading(line));

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

  return starts.map((start, startIndex) => {
    const end = starts[startIndex + 1]?.index ?? lines.length;
    const text = lines.slice(start.index, end).join('\n').trimEnd();
    const bodyText = lines.slice(start.index + 1, end).join('\n').replace(/^\n+/, '').trimEnd();
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
  const chunks: string[] = [];
  let current: string[] = [];
  let currentRems = 0;
  let inFence = false;
  let inMathBlock = false;

  function flush() {
    const text = current.join('\n').trimEnd();
    if (text.trim()) {
      chunks.push(text);
    }
    current = [];
    currentRems = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const togglesFence = /^```/.test(trimmed) || /^~~~/.test(trimmed);
    const togglesMath = trimmed === '$$';
    const nextCharCount = current.join('\n').length + line.length + 1;
    const nextRemCount = currentRems + (trimmed ? 1 : 0);
    const canSplit = current.length > 0 && !inFence && !inMathBlock;
    if (
      canSplit &&
      (nextCharCount > options.maxCharsPerChunk || nextRemCount > options.maxRemsPerChunk)
    ) {
      flush();
    }

    current.push(line);
    if (trimmed) {
      currentRems += 1;
    }
    if (togglesFence) {
      inFence = !inFence;
    }
    if (togglesMath) {
      inMathBlock = !inMathBlock;
    }
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
  const planId = `plan:${stableBulkImportHash(`${input.sourceName ?? ''}:${input.targetRootId}:${input.rootTitle ?? ''}:${chapterTitle}:${sourceHash}`)}`;
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
        sourceText: chunkText,
        sourceHash: chunkSourceHash,
        expectedSourceText: chunkText,
        expectedSourceHash: chunkSourceHash,
        expectedParent: input.targetRootId,
        createdRemIds: [],
        updatedRemIds: [],
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

  return {
    ok: true,
    planId,
    sourceName: input.sourceName,
    sourceHash,
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
    estimatedRems: chunks.reduce((sum, chunk) => sum + chunk.estimatedRemCount, 0),
    warnings,
    options,
  };
}

export function normalizeForSourceFidelity(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \t]*#{1,6}\s+/gm, '')
    .replace(/^[ \t]*[-*+]\s+/gm, '')
    .trim();
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
  if (input.actualText === undefined) {
    return {
      ok: false,
      status: 'not_verifiable',
      jobId: input.jobId,
      sectionKey: input.sectionKey,
      chunkIndex: input.chunkIndex,
      expectedHash: stableBulkImportHash(normalizeForSourceFidelity(input.expectedText)),
      warnings: ['No actual RemNote text was supplied; live/readback verification was not run.'],
      recommendedAction: 'Run verify_note_import_job after readback is available.',
      method: 'manifest_only',
    };
  }

  const expected = normalizeForSourceFidelity(input.expectedText);
  const actual = normalizeForSourceFidelity(input.actualText);
  const expectedHash = stableBulkImportHash(expected);
  const actualHash = stableBulkImportHash(actual);
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
      extraTextPreview: previewAround(unique.join('\n')),
      warnings: [`Formatting pollution Rems detected: ${unique.join(', ')}.`],
      recommendedAction: 'Inspect readback tree before resume.',
      method: 'normalized_plain_text',
    };
  }
  if (expectedHash === actualHash || actual.includes(expected)) {
    return {
      ok: true,
      status: 'passed',
      jobId: input.jobId,
      sectionKey: input.sectionKey,
      chunkIndex: input.chunkIndex,
      expectedHash,
      actualHash,
      warnings: [],
      method: 'normalized_plain_text',
    };
  }

  const expectedUnits = expected.split('\n').map((line) => line.trim()).filter(Boolean);
  const actualUnits = actual.split('\n').map((line) => line.trim()).filter(Boolean);
  const missingUnits = expectedUnits.filter((unit) => !actual.includes(unit)).slice(0, 5);
  const extraUnits = actualUnits.filter((unit) => !expected.includes(unit)).slice(0, 5);
  const missingTextPreview = missingUnits.length ? previewAround(missingUnits.join('\n')) : previewAround(expected);
  const extraTextPreview = extraUnits.length ? previewAround(extraUnits.join('\n')) : undefined;
  return {
    ok: false,
    status: 'source_fidelity_failed',
    jobId: input.jobId,
    sectionKey: input.sectionKey,
    chunkIndex: input.chunkIndex,
    expectedHash,
    actualHash,
    missingTextPreview,
    extraTextPreview,
    warnings: ['Normalized plain-text source fidelity failed. Rich text/math formatting was not fully verified.'],
    recommendedAction: 'resume_note_import_job',
    method: 'normalized_plain_text',
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
    return countOccurrences(actual, title) > 1 ? [section.title] : [];
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
    warnings: ok
      ? []
      : [
          'Final readback did not match the planned source after documented normalization.',
          ...(pollutionRems.length
            ? [`Formatting pollution Rems detected: ${Array.from(new Set(pollutionRems)).join(', ')}.`]
            : []),
        ],
    recommendedAction: ok ? undefined : 'resume_note_import_job',
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
  const ownText = [
    record.frontText,
    record.plainText,
    record.title,
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
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
  const nextChunk = job.chunks.find((chunk) =>
    chunk.status === 'pending' ||
    chunk.status === 'partial' ||
    chunk.status === 'partial_needs_verification' ||
    chunk.status === 'written_not_verified' ||
    chunk.status === 'failed'
  );
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
    createdRemIds: Array.from(new Set(job.chunks.flatMap((chunk) => chunk.createdRemIds))),
    manualReviewItems: job.chunks.filter((chunk) => chunk.status === 'needs_manual_review').map((chunk) => chunk.chunkId),
    recommendedNextAction:
      job.status === 'completed'
        ? 'run verify_note_import_job if live readback is available'
        : job.status === 'cancelled'
          ? 'job is cancelled; create a new job to continue'
          : nextChunk
            ? 'call run_note_import_job_step again'
            : 'run verify_note_import_job',
  };
}
