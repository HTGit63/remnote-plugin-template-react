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

export interface BulkImportPlannerOptions {
  maxCharsPerChunk?: number;
  maxRemsPerChunk?: number;
  maxDepth?: number;
  maxChildrenPerParent?: number;
}

export interface PlanNoteImportInput {
  sourceName?: string;
  sourceText: string;
  targetRootId: string;
  chapterSelector?: string;
  options?: BulkImportPlannerOptions;
}

export interface BulkImportChunk {
  chunkId: string;
  targetRootId: string;
  chapterRootRemId?: string;
  chapterTitle: string;
  sectionRootRemId?: string;
  sectionKey: string;
  sectionTitle: string;
  chunkIndex: number;
  sourceText: string;
  sourceHash: string;
  expectedParent: string;
  chunkParentRemId?: string;
  createdRemIds: string[];
  updatedRemIds: string[];
  startedAt?: string;
  finishedAt?: string;
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
  targetRootId: string;
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
  targetRootId: string;
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
  return line.replace(/^#{1,6}\s+/, '').trim();
}

function lineStartsSelectedChapter(line: string, selector: string): boolean {
  if (!line.startsWith('#')) {
    return false;
  }
  return normalizeHeadingText(line).toLowerCase().includes(selector.toLowerCase());
}

function selectedChapterText(sourceText: string, selector?: string): { chapterTitle: string; text: string; warnings: string[] } {
  const warnings: string[] = [];
  const lines = sourceText.replace(/\r\n/g, '\n').split('\n');
  if (!selector?.trim()) {
    const firstHeading = lines.find((line) => /^#\s+/.test(line));
    return {
      chapterTitle: firstHeading ? normalizeHeadingText(firstHeading) : 'Imported chapter',
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

  const startLevel = (lines[start].match(/^#+/)?.[0].length ?? 1);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const heading = lines[index].match(/^(#{1,6})\s+/);
    if (heading && heading[1].length <= startLevel) {
      end = index;
      break;
    }
  }

  return {
    chapterTitle: normalizeHeadingText(lines[start]),
    text: lines.slice(start, end).join('\n'),
    warnings,
  };
}

function isSectionHeading(line: string): boolean {
  if (/^#{1,6}\s+\d+(?:\.\d+)+\b/.test(line)) {
    return true;
  }
  return /^\s*\d+(?:\.\d+)+\s+\S/.test(line);
}

function splitSections(chapterText: string): Array<{ title: string; text: string; sectionKey: string }> {
  const lines = chapterText.replace(/\r\n/g, '\n').split('\n');
  const starts = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isSectionHeading(line));

  if (!starts.length) {
    const title = normalizeHeadingText(lines.find((line) => line.startsWith('#')) ?? 'Imported chapter');
    return [{ title, text: chapterText, sectionKey: slugKey(title, 'chapter') }];
  }

  return starts.map((start, startIndex) => {
    const end = starts[startIndex + 1]?.index ?? lines.length;
    const text = lines.slice(start.index, end).join('\n').trimEnd();
    const title = normalizeHeadingText(start.line);
    return {
      title,
      text,
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
  const selected = selectedChapterText(sourceText, input.chapterSelector);
  const sourceHash = stableBulkImportHash(selected.text);
  const planId = `plan:${stableBulkImportHash(`${input.sourceName ?? ''}:${input.targetRootId}:${sourceHash}`)}`;
  const sections = splitSections(selected.text).map((section) => {
    const chunkTexts = splitSectionIntoChunks(section.text, options);
    const chunks = chunkTexts.map((chunkText, index): BulkImportChunk => {
      const chunkSourceHash = stableBulkImportHash(chunkText);
      const chunkIndex = index + 1;
      return {
        chunkId: bulkChunkId(planId, section.sectionKey, chunkIndex, chunkSourceHash),
        targetRootId: input.targetRootId,
        chapterTitle: selected.chapterTitle,
        sectionKey: section.sectionKey,
        sectionTitle: section.title,
        chunkIndex,
        sourceText: chunkText,
        sourceHash: chunkSourceHash,
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
    targetRootId: input.targetRootId,
    chapterIdempotencyKey: bulkChapterIdempotencyKey('job-pending', sourceHash),
    chapterSelector: input.chapterSelector,
    chapterTitle: selected.chapterTitle,
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
    .replace(/^[ \t]*[-*+]\s+/gm, '- ')
    .trim();
}

function previewAround(value: string, maxLength = 240): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
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

  const missingTextPreview = actual.includes(expected.slice(0, 80)) ? undefined : previewAround(expected);
  const extraTextPreview = expected.includes(actual.slice(0, 80)) ? undefined : previewAround(actual);
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
      expectedText: chunk.sourceText,
      actualText,
      jobId: input.job.jobId,
      sectionKey: chunk.sectionKey,
      chunkIndex: chunk.chunkIndex,
    });
    if (!normalizedTree || !report.ok) {
      return report;
    }
    const expected = normalizeForSourceFidelity(chunk.sourceText);
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
